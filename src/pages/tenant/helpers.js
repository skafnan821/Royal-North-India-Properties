import { read, useStoreVersion } from '../../utils/localStorage';
import { sameEmail } from '../../utils/tenancy';

// Everything that belongs to the logged-in tenant (and nobody else)
export function getTenantData(email) {
  const tenant = read('tenants', []).find((t) => sameEmail(t.email, email) && t.status === 'Active');
  const property = tenant ? read('properties', []).find((p) => p.id === tenant.propertyId) : null;
  const owner = property ? read('users', []).find((u) => sameEmail(u.email, property.ownerEmail)) : null;
  const lease = tenant ? read('leases', []).find((l) => sameEmail(l.tenantEmail, email) && l.propertyId === tenant.propertyId) : null;
  const payments = read('payments', []).filter((p) => sameEmail(p.tenantEmail, email));
  return { tenant, property, owner, lease, payments };
}

// Re-reads the tenant's data whenever anything in storage changes (owner actions show up immediately)
export function useTenantData(email) {
  useStoreVersion();
  return getTenantData(email);
}
