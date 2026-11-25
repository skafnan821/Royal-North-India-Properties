import { useState, useEffect } from 'react';
import { MapPin, BedDouble, Bath, Maximize, Check, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Modal from './Modal';
import Img from './Img';
import StatusBadge from './StatusBadge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { money, read, write, uid, useStoreVersion } from '../utils/localStorage';
import { sameEmail, activeTenantOf, enqStatus } from '../utils/tenancy';

export default function PropertyModal({ property: picked, onClose, showEnquiry = true }) {
  useStoreVersion(); // re-render whenever properties, tenants or enquiries change
  const [idx, setIdx] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [err, setErr] = useState('');
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setIdx(0);
    setErr('');
    setForm({ name: user?.name || '', email: user?.email || '', message: '' });
  }, [picked, user]);

  if (!picked) return null;
  // Always show the latest saved copy of the property (photos, rent, availability)
  const property = read('properties', []).find((p) => p.id === picked.id) || picked;
  const rented = property.status === 'Rented' || !!activeTenantOf(property.id);
  const imgs = (property.images || []).filter(Boolean);
  const cur = Math.min(idx, Math.max(imgs.length - 1, 0));
  const go = (d) => setIdx((i) => (i + d + imgs.length) % imgs.length);

  const submit = (e) => {
    e.preventDefault();
    const email = form.email.trim();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setErr('Please enter your name and a valid email address.');
    if (rented) return setErr('This property is already rented.');
    const all = read('enquiries', []);
    if (all.some((x) => x.propertyId === property.id && sameEmail(x.email, email) && enqStatus(x) === 'New'))
      return setErr('You already have a pending enquiry for this property.');
    write('enquiries', [...all, {
      id: uid(), propertyId: property.id, ownerEmail: property.ownerEmail,
      name: form.name.trim(), email, message: form.message.trim(), time: new Date().toISOString(), status: 'New',
    }]);
    toast('Enquiry sent! The owner will contact you soon.');
    setForm({ ...form, message: '' });
    setErr('');
  };

  return (
    <Modal open={!!picked} onClose={onClose} title={property.name} wide>
      <div className="pm-grid">
        <div>
          <div className="gallery-main">
            <Img key={cur} src={imgs[cur]} alt={`${property.name} photo ${cur + 1}`} />
            {imgs.length > 1 && (
              <>
                <button className="g-arrow left" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft /></button>
                <button className="g-arrow right" onClick={() => go(1)} aria-label="Next photo"><ChevronRight /></button>
              </>
            )}
            <span className="g-count">{cur + 1} / {imgs.length || 1}</span>
          </div>
          <div className="thumbs">
            {imgs.map((s, i) => (
              <button key={i} className={i === cur ? 'on' : ''} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`}>
                <Img src={s} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="pm-info">
          <div className="row between">
            <StatusBadge status={rented ? 'Rented' : property.status} />
            <span className="badge gray">{property.type}</span>
          </div>
          <p className="price big">{money(property.rent)}<small>/month</small></p>
          <p className="muted loc"><MapPin size={16} /> {property.location}</p>
          <div className="spec-row">
            {property.type !== 'Commercial' && <span><BedDouble size={16} /> {property.beds} Bedrooms</span>}
            <span><Bath size={16} /> {property.baths} Bathrooms</span>
            {property.area ? <span><Maximize size={16} /> {property.area} sq ft</span> : null}
          </div>
          <p className="desc">{property.description}</p>
          {property.amenities?.length > 0 && (
            <div className="amen">
              {property.amenities.map((a) => <span key={a}><Check size={14} /> {a}</span>)}
            </div>
          )}
        </div>
      </div>
      {showEnquiry && (rented ? (
        <div className="enquiry"><p className="muted">This property is currently rented, so new enquiries are closed.</p></div>
      ) : (
        <form className="enquiry" onSubmit={submit} noValidate>
          <h4>Interested? Send an enquiry</h4>
          {err && <p className="form-error">{err}</p>}
          <div className="grid-2">
            <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <textarea rows="2" placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button className="btn btn-accent"><Send size={16} /> Send enquiry</button>
        </form>
      ))}
    </Modal>
  );
}
