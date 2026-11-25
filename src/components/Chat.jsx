import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useLS, uid, fmtTime } from '../utils/localStorage';
import { sameEmail } from '../utils/tenancy';

// contacts: [{ email, name, sub }]
export default function Chat({ me, contacts }) {
  const [messages, setMessages] = useLS('messages');
  const [active, setActive] = useState(contacts[0]?.email || null);
  const [text, setText] = useState('');
  const end = useRef(null);

  // Every message between me and the selected contact, oldest first (email matching ignores case)
  const thread = messages
    .filter((m) => (sameEmail(m.from, me.email) && sameEmail(m.to, active)) || (sameEmail(m.to, me.email) && sameEmail(m.from, active)))
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread.length, active]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const msg = { id: uid(), from: me.email, fromName: me.name, to: active, text: text.trim(), time: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    setText('');
  };

  const last = (email) => {
    const t = messages.filter((m) => (sameEmail(m.from, me.email) && sameEmail(m.to, email)) || (sameEmail(m.to, me.email) && sameEmail(m.from, email)));
    return t.length ? t[t.length - 1].text : 'No messages yet';
  };

  if (!contacts.length)
    return (
      <div className="empty"><MessageSquare size={40} /><h3>No conversations yet</h3>
        <p>Messages will appear here once a tenant is assigned to one of your properties.</p></div>
    );

  const current = contacts.find((c) => sameEmail(c.email, active));
  return (
    <div className="chat">
      <div className={`chat-list ${active ? 'hide-mobile' : ''}`}>
        <h4>Conversations</h4>
        {contacts.map((c) => (
          <button key={c.email} className={current && sameEmail(c.email, current.email) ? 'on' : ''} onClick={() => setActive(c.email)}>
            <span className="avatar">{c.name.charAt(0)}</span>
            <span className="c-text"><strong>{c.name}</strong><small>{last(c.email)}</small></span>
          </button>
        ))}
      </div>
      <div className={`chat-pane ${!active ? 'hide-mobile' : ''}`}>
        <div className="chat-head">
          <button className="back-btn" onClick={() => setActive(null)}>‹ Back</button>
          <span className="avatar">{current?.name.charAt(0) || '?'}</span>
          <div><strong>{current?.name || 'Select a conversation'}</strong><small>{current?.sub}</small></div>
        </div>
        <div className="chat-body">
          {thread.length === 0 && <p className="muted center">Say hello 👋 – start the conversation below.</p>}
          {thread.map((m) => (
            <div key={m.id} className={`bubble ${sameEmail(m.from, me.email) ? 'me' : 'them'}`}>
              <span className="b-name">{m.fromName}</span>
              <p>{m.text}</p>
              <small>{fmtTime(m.time)}</small>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" disabled={!current} />
          <button className="btn btn-primary" disabled={!text.trim() || !current}><Send size={16} /> Send</button>
        </form>
      </div>
    </div>
  );
}
