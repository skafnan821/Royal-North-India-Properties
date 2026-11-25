import { read, write, uid, today, ymd } from './localStorage';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthLabel = (d = new Date()) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// Emails are matched regardless of case or stray spaces
export const sameEmail = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// A rent that is unpaid after its due date is overdue, whatever the stored label says
export function effectiveStatus(p) {
  if (p.status === 'Paid') return 'Paid';
  if (p.status === 'Overdue' || (p.due && p.due < today())) return 'Overdue';
  return 'Pending';
}
export const withStatus = (list) => list.map((p) => ({ ...p, status: effectiveStatus(p) }));

// Enquiries saved before statuses existed count as New
export const enqStatus = (e) => e.status || 'New';

export const activeTenantOf = (propertyId, tenants = read('tenants', [])) =>
  tenants.find((t) => t.propertyId === propertyId && t.status === 'Active');
export const activeTenancyOf = (email, tenants = read('tenants', [])) =>
  tenants.find((t) => sameEmail(t.email, email) && t.status === 'Active');

// The only place a tenant is attached to a property: enforces one tenant per property and one property per tenant
export function assignTenant({ ownerEmail, name, email, phone = '', propertyId }) {
  const properties = read('properties', []);
  const tenants = read('tenants', []);
  const p = properties.find((x) => x.id === propertyId);
  if (!p) return { ok: false, error: 'Property not found.' };
  if (p.status === 'Rented' || activeTenantOf(propertyId, tenants))
    return { ok: false, error: `${p.name} is already rented to a tenant.` };
  if (activeTenancyOf(email, tenants))
    return { ok: false, error: `${name.trim()} already has an active tenancy.` };

  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);

  const tenant = { id: uid(), ownerEmail, name: name.trim(), email: email.trim(), phone: phone || '', propertyId, status: 'Active' };
  write('tenants', [...tenants, tenant]);
  write('leases', [...read('leases', []), {
    id: uid(), tenantEmail: tenant.email, tenantName: tenant.name, propertyId,
    start: today(), end: ymd(end), rent: p.rent, deposit: p.rent * 3, status: 'Active',
  }]);
  write('payments', [...read('payments', []), {
    id: uid(), tenantEmail: tenant.email, tenantName: tenant.name, propertyId,
    month: monthLabel(start), amount: p.rent, due: today(), date: null, status: 'Pending',
  }]);
  write('properties', properties.map((x) => (x.id === propertyId ? { ...x, status: 'Rented' } : x)));
  return { ok: true, tenant, property: p };
}

// Ends a tenancy: removes the tenant, its lease, and frees the property. Payment history is kept.
export function endTenancy(tenantId) {
  const t = read('tenants', []).find((x) => x.id === tenantId);
  if (!t) return { ok: false, error: 'Tenant not found.' };
  write('tenants', read('tenants', []).filter((x) => x.id !== tenantId));
  write('leases', read('leases', []).filter((l) => !(sameEmail(l.tenantEmail, t.email) && l.propertyId === t.propertyId)));
  write('properties', read('properties', []).map((x) => (x.id === t.propertyId ? { ...x, status: 'Available' } : x)));
  return { ok: true };
}

export function acceptEnquiry(enquiry) {
  const property = read('properties', []).find((p) => p.id === enquiry.propertyId);
  if (!property) return { ok: false, error: 'This property no longer exists.' };
  const phone = read('users', []).find((u) => sameEmail(u.email, enquiry.email))?.phone || '';
  const res = assignTenant({ ownerEmail: property.ownerEmail, name: enquiry.name, email: enquiry.email, phone, propertyId: property.id });
  if (!res.ok) return res;
  // Other open enquiries for this property are closed, since it is now let
  write('enquiries', read('enquiries', []).map((e) => {
    if (e.id === enquiry.id) return { ...e, status: 'Accepted' };
    if (e.propertyId === property.id && enqStatus(e) === 'New') return { ...e, status: 'Closed' };
    return e;
  }));
  return { ok: true, property };
}

export function rejectEnquiry(id) {
  write('enquiries', read('enquiries', []).map((e) => (e.id === id ? { ...e, status: 'Rejected' } : e)));
}
