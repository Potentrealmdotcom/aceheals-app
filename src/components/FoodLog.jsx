import React, { useState } from 'react';
import { Card, Btn, SectionHead } from './ui.jsx';
import { useStored, todayKey, toast } from '../lib/store.js';

// Nutrition tracker (parent-facing, optional). Flags dyes + ultra-processed words. Not medical advice.
const FLAGS = [
  [/red ?40|yellow ?[56]|blue ?[12]|dye|food coloring|fruit snacks|neon/i, '🌈 dyes'],
  [/hfcs|high fructose|soda|candy|gummies|fruit snacks/i, '🍬 added sugar'],
  [/chips|nuggets|hot dog|frozen pizza|instant noodles|packaged|fast food|drive.?thru/i, '📦 processed'],
];
export default function FoodLog() {
  const [log, setLog] = useStored('foodLog', []);
  const [text, setText] = useState('');
  const [meal, setMeal] = useState('snack');
  const add = () => {
    const t = text.trim();
    if (!t) { toast('✏️ Type what they ate'); return; }
    const flags = FLAGS.filter(([re]) => re.test(t)).map(([, l]) => l);
    setLog([{ id: Date.now(), day: todayKey(), meal, text: t, flags }, ...log].slice(0, 600));
    setText('');
  };
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10);
    const rows = log.filter((r) => r.day === d);
    return { d, n: rows.length, flagged: rows.filter((r) => r.flags.length).length };
  });
  const today = log.filter((r) => r.day === todayKey());
  return (
    <div>
      <SectionHead title="🥗 Food Log" />
      <div style={{ fontSize: 13, color: '#8a7f9e', marginBottom: 10 }}>
        Log what they ate today. We flag dyes, added sugar and processed foods so you can spot patterns. Bring the weekly view to your doctor.
      </div>
      <Card style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map((m) => (
            <Btn key={m} size="sm" color={meal === m ? 'orange' : 'cream'} onClick={() => setMeal(m)}>{m}</Btn>
          ))}
        </div>
        <input className="input-gloss" placeholder="What did they eat?" value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} style={{ marginBottom: 8 }} />
        <Btn block onClick={add}>Add to today's log</Btn>
      </Card>
      <Card style={{ marginBottom: 10 }}>
        <b>Last 7 days</b>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginTop: 10 }}>
          {days.map((x) => (
            <div key={x.d} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: Math.max(4, x.n * 12), background: x.flagged ? '#e67e22' : '#2ECC71', borderRadius: 6 }} title={x.flagged + ' flagged'} />
              <div style={{ fontSize: 10, color: '#8a7f9e', marginTop: 4 }}>{x.d.slice(8)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#8a7f9e', marginTop: 6 }}>Green = no flags • Orange = at least one flagged item</div>
      </Card>
      <Card>
        <b>Today</b>
        {today.length === 0 && <div style={{ fontSize: 13, color: '#8a7f9e', marginTop: 6 }}>Nothing logged yet.</div>}
        {today.map((r) => (
          <div key={r.id} style={{ marginTop: 8, fontSize: 14 }}>
            <b style={{ textTransform: 'capitalize' }}>{r.meal}:</b> {r.text} {r.flags.map((f) => <span key={f} className="pill" style={{ marginLeft: 4 }}>{f}</span>)}
          </div>
        ))}
        {log.length > 0 && <div style={{ marginTop: 10 }}><Btn size="sm" color="cream" onClick={() => { if (confirm('Clear the whole food log?')) setLog([]); }}>Clear log</Btn></div>}
      </Card>
    </div>
  );
}
