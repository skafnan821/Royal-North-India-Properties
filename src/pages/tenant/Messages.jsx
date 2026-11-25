import Chat from '../../components/Chat';
import NoProperty from '../../components/NoProperty';
import { useAuth } from '../../context/AuthContext';
import { useLS } from '../../utils/localStorage';
import { sameEmail } from '../../utils/tenancy';
import { useTenantData } from './helpers';

export default function TenantMessages() {
  const { user } = useAuth();
  const { property, owner } = useTenantData(user.email);
  const [messages] = useLS('messages');
  const [users] = useLS('users');

  const contacts = new Map();
  const add = (email, name, sub) => {
    const key = email.trim().toLowerCase();
    if (!contacts.has(key)) contacts.set(key, { email, name, sub });
  };
  // The owner of the current property
  if (property) add(property.ownerEmail, owner?.name || 'Property Owner', `Owner · ${property.name}`);
  // Owners this tenant has talked to before, so history stays visible
  messages.forEach((m) => {
    const other = sameEmail(m.from, user.email) ? m.to : sameEmail(m.to, user.email) ? m.from : null;
    if (!other || sameEmail(other, user.email)) return;
    const account = users.find((u) => sameEmail(u.email, other));
    if (account?.role === 'owner') add(other, account.name, 'Property Owner');
  });

  if (!contacts.size) return <><div className="page-title"><h1>Messages</h1></div><NoProperty /></>;
  return (
    <>
      <div className="page-title"><div><h1>Messages</h1><p className="muted">Talk to your property owner.</p></div></div>
      <Chat me={user} contacts={[...contacts.values()]} />
    </>
  );
}
