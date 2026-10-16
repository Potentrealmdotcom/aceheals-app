import React, { useState } from 'react';
import { Btn, Modal } from './ui.jsx';
import { BUDDIES, KID_COLORS, addKid } from '../lib/kids.js';
import { getAccess } from '../lib/paywall.js';
import { toast } from '../lib/store.js';

// Parent builds their child's world: name, buddy, color, what they love.
export default function AddChild({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🦊');
  const [color, setColor] = useState('#FF6B35');
  const [mode, setMode] = useState('play');
  const [age, setAge] = useState('4-6');

  const save = () => {
    const n = name.trim();
    if (!n) { toast('✏️ Type your child\'s name'); return; }
    getAccess(); // starts the 24-hour free trial the first time
    const kid = addKid({ name: n.slice(0, 14), emoji, color, mode, age });
    toast('🎉 ' + kid.name + '\'s world is ready!');
    onCreated(kid);
  };

  const pill = (active) => ({
    padding: '10px 8px', borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 13,
    border: active ? '3px solid #1A1040' : '2px solid #e8dcc8',
    background: active ? '#FFE9A8' : '#fff', color: '#1A1040',
  });

  return (
    <Modal onClose={onClose} title="➕ Build your child's world">
      <div style={{ fontSize: 13, color: '#8a7f9e', marginBottom: 10 }}>
        Takes 30 seconds. 🎁 Your 24-hour free trial starts now — everything unlocked, no card.
      </div>
      <input className="input-gloss" placeholder="Child's first name" value={name} maxLength={14}
        onChange={(e) => setName(e.target.value)} style={{ marginBottom: 12, fontSize: 18 }} />

      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1040', marginBottom: 6 }}>Pick a buddy</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: 12 }}>
        {BUDDIES.map((b) => (
          <button key={b} onClick={() => setEmoji(b)} style={{ ...pill(emoji === b), fontSize: 26, padding: 6 }}>{b}</button>
        ))}
      </div>

      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1040', marginBottom: 6 }}>Favorite color</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {KID_COLORS.map((c) => (
          <button key={c.id} aria-label={c.id} onClick={() => setColor(c.hex)}
            style={{ width: 38, height: 38, borderRadius: '50%', background: c.hex, cursor: 'pointer',
              border: color === c.hex ? '4px solid #1A1040' : '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
        ))}
      </div>

      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1040', marginBottom: 6 }}>Age</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
        {['2-3', '4-6', '7-9', '10+'].map((a) => (
          <button key={a} onClick={() => setAge(a)} style={pill(age === a)}>{a}</button>
        ))}
      </div>

      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1040', marginBottom: 6 }}>Start with</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setMode('play')} style={pill(mode === 'play')}>🎮 Play &amp; Learn<br /><span style={{ fontWeight: 600, fontSize: 11 }}>games, photos, songs</span></button>
        <button onClick={() => setMode('talk')} style={pill(mode === 'talk')}>⚡ Talk &amp; Calm<br /><span style={{ fontWeight: 600, fontSize: 11 }}>AAC board, calm corner</span></button>
      </div>
      <Btn block onClick={save}>Start {name.trim() ? name.trim() + '\'s' : 'their'} world 🚀</Btn>
    </Modal>
  );
}
