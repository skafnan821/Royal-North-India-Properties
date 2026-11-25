import Chat from '../../components/Chat';
import { useAuth } from '../../context/AuthContext';
import { useLS } from '../../utils/localStorage';
import { sameEmail } from '../../utils/tenancy';

export default function OwnerMessages() {
  const { user } = useAuth();
  const [props] = useLS('properties');
  const [tenants] = useLS('tenants');
  const [messages] = useLS('messages');
  const [users] = useLS('users');

  const ids = props.filter((p) => sameEmail(p.ownerEmail, user.email)).map((p) => p.id);
  const contacts = new Map();
  const add = (email, name, sub) => {
    const key = email.trim().toLowerCase();
    if (!contacts.has(key)) contacts.set(key, { email, name, sub });
  };

  // Current tenants first (active before past), so their property is shown
  tenants
    .filter((t) => ids.includes(t.propertyId))
    .sort((a, b) => (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1))
    .forEach((t) => add(t.email, t.name, props.find((p) => p.id === t.propertyId)?.name));

  // Keep history: anyone who has exchanged messages with this owner stays in the list
  messages.forEach((m) => {
    const other = sameEmail(m.from, user.email) ? m.to : sameEmail(m.to, user.email) ? m.from : null;
    if (!other || sameEmail(other, user.email)) return;
    const account = users.find((u) => sameEmail(u.email, other));
    if (account?.role === 'tenant') add(other, account.name, 'Past conversation');
  });

  return (
    <>
      <div className="page-title"><div><h1>Messages</h1><p className="muted">Chat with your tenants.</p></div></div>
      <Chat me={user} contacts={[...contacts.values()]} />
    </>
  );
}
