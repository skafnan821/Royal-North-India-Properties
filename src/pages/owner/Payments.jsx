import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, BellRing, PlusSquare } from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLS, money, fmtDate, today, uid } from '../../utils/localStorage';
import { MONTHS, sameEmail, withStatus } from '../../utils/tenancy';

const defaultDue = (month, year) => `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-05`;
const blankForm = () => {
  const d = new Date();
  const month = MONTHS[d.getMonth()];
  return { tenantEmail: '', month, year: d.getFullYear(), amount: '', due: defaultDue(month, d.getFullYear()), date: today(), status: 'Paid' };
};

export default function Payments() {
  const { user } = useAuth();
  const toast = useToast();
  const [props] = useLS('properties');
  const [tenants] = useLS('tenants');
  const [payments, setPayments] = useLS('payments');
  const [, setMessages] = useLS('messages');
  const [filter, setFilter] = useState('All');
  const [recording, setRecording] = useState(false);
  const [f, setF] = useState(blankForm());
  const [err, setErr] = useState('');

  const ids = props.filter((p) => sameEmail(p.ownerEmail, user.email)).map((p) => p.id);
  const mine = withStatus(payments.filter((p) => ids.includes(p.propertyId)));
  const rows = mine.filter((p) => filter === 'All' || p.status === filter);
  const sum = (s) => mine.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const pname = (id) => props.find((p) => p.id === id)?.name;
  const activeTenants = tenants.filter((t) => ids.includes(t.propertyId) && t.status === 'Active');

  const markPaid = (p) => {
    setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'Paid', date: today() } : x)));
    toast(`${p.month} rent from ${p.tenantName} marked as paid.`);
  };
  const remind = (p) => {
    setMessages((prev) => [...prev, { id: uid(), from: user.email, fromName: user.name, to: p.tenantEmail, text: `Reminder: your rent of ${money(p.amount)} for ${p.month} is ${p.status.toLowerCase()}. Please pay at the earliest.`, time: new Date().toISOString() }]);
    toast(`Reminder sent to ${p.tenantName}.`, 'info');
  };

  const change = (k) => (e) => {
    const v = e.target.value;
    setF((s) => {
      const next = { ...s, [k]: v };
      if (k === 'month' || k === 'year') next.due = defaultDue(next.month, next.year);
      if (k === 'status' && v === 'Paid' && !next.date) next.date = today();
      return next;
    });
  };
  const pickTenant = (email) => {
    const t = activeTenants.find((x) => sameEmail(x.email, email));
    const rent = t ? props.find((p) => p.id === t.propertyId)?.rent : '';
    setF((s) => ({ ...s, tenantEmail: email, amount: rent ?? '' }));
  };
  const openRecord = () => { setF(blankForm()); setErr(''); setRecording(true); };

  const record = (e) => {
    e.preventDefault();
    const t = activeTenants.find((x) => sameEmail(x.email, f.tenantEmail));
    const amount = Number(f.amount);
    const month = `${f.month} ${f.year}`;
    if (!t) return setErr('Choose an active tenant.');
    if (!(amount > 0)) return setErr('Enter an amount greater than 0.');
    if (payments.some((p) => p.propertyId === t.propertyId && sameEmail(p.tenantEmail, t.email) && p.month === month))
      return setErr(`A payment for ${month} is already recorded for ${t.name}.`);
    const paid = f.status === 'Paid';
    setPayments((prev) => [...prev, {
      id: uid(), tenantEmail: t.email, tenantName: t.name, propertyId: t.propertyId, month, amount,
      due: f.due || defaultDue(f.month, f.year), date: paid ? (f.date || today()) : null, status: f.status,
    }]);
    toast(`${month} rent of ${money(amount)} recorded for ${t.name}.`);
    setRecording(false); setErr('');
  };

  return (
    <>
      <div className="page-title">
        <div><h1>Rental Payments</h1><p className="muted">Track rent collected, pending and overdue.</p></div>
        <button className="btn btn-primary" onClick={openRecord}><PlusSquare size={16} /> Record payment</button>
      </div>
      <div className="stats three">
        <StatCard icon={CheckCircle2} label="Total Collected" value={money(sum('Paid'))} tone="green" />
        <StatCard icon={Clock} label="Pending" value={money(sum('Pending'))} tone="amber" />
        <StatCard icon={AlertTriangle} label="Overdue" value={money(sum('Overdue'))} tone="red" />
      </div>
      <div className="tabs left">{['All', 'Paid', 'Pending', 'Overdue'].map((t) => <button key={t} className={filter === t ? 'on' : ''} onClick={() => setFilter(t)}>{t}</button>)}</div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Tenant Name</th><th>Property Name</th><th>Payment Month</th><th>Amount</th><th>Due Date</th><th>Payment Date</th><th>Payment Status</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.tenantName}</strong></td><td>{pname(p.propertyId)}</td><td>{p.month}</td><td>{money(p.amount)}</td><td>{fmtDate(p.due)}</td><td>{fmtDate(p.date)}</td>
              <td><StatusBadge status={p.status} /></td>
              <td>{p.status === 'Paid' ? <span className="muted">—</span> : (
                <div className="act-row"><button className="btn btn-accent btn-sm" onClick={() => markPaid(p)}>Mark paid</button><button className="btn btn-ghost btn-sm" onClick={() => remind(p)}><BellRing size={14} /> Remind</button></div>)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="8" className="center muted">No payments in this category.</td></tr>}
        </tbody>
      </table></div></div>

      <Modal open={recording} onClose={() => setRecording(false)} title="Record rent payment">
        <form onSubmit={record} noValidate className="stack">
          {err && <div className="alert error">{err}</div>}
          <div className="field"><label>Tenant</label>
            <select value={f.tenantEmail} onChange={(e) => pickTenant(e.target.value)}>
              <option value="">Select an active tenant</option>
              {activeTenants.map((t) => <option key={t.id} value={t.email}>{t.name} – {pname(t.propertyId)}</option>)}
            </select>
            {!activeTenants.length && <small className="err">No active tenants. Assign a tenant first.</small>}
          </div>
          <div className="grid-2">
            <div className="field"><label>Month</label><select value={f.month} onChange={change('month')}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div className="field"><label>Year</label><input type="number" value={f.year} onChange={change('year')} /></div>
            <div className="field"><label>Amount (₹)</label><input type="number" min="0" value={f.amount} onChange={change('amount')} /></div>
            <div className="field"><label>Due date</label><input type="date" value={f.due} onChange={change('due')} /></div>
            <div className="field"><label>Status</label><select value={f.status} onChange={change('status')}><option>Paid</option><option>Pending</option><option>Overdue</option></select></div>
            <div className="field"><label>Payment date</label><input type="date" value={f.date} disabled={f.status !== 'Paid'} onChange={change('date')} /></div>
          </div>
          <button className="btn btn-accent btn-block"><PlusSquare size={16} /> Save payment</button>
        </form>
      </Modal>
    </>
  );
}
