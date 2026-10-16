import React, { useState } from 'react';
import { Card, Btn, SectionHead } from './ui.jsx';
import { useStored, toast } from '../lib/store.js';

const QUICK = [
  'What do I do when he melts down?',
  'How do I get my child to try new foods?',
  'What does this behavior mean?',
  'How do I prepare for an IEP meeting?',
  'Help me build a bedtime routine.',
];
// Offline answers so the helper is useful even before the AI key is connected.
const OFFLINE = {
  'What do I do when he melts down?': 'Stay calm and lower your voice. Make the space safe and quiet. Offer the calm kit and the break button, and wait before you talk. After it passes, log the trigger (hunger, noise, change, tired) in the Triggers tracker so you can spot patterns. If meltdowns are getting more frequent or unsafe, tell your child\'s doctor or therapist.',
  'How do I get my child to try new foods?': 'Go slow. Put one new food on the plate beside a safe food with no pressure. Let them touch, smell or lick it first. Keep trying small exposures over weeks. Eat it yourself in front of them. Ask your doctor or a feeding therapist if the list of foods they accept is getting very short.',
  'What does this behavior mean?': 'Behavior is communication. Check the basics first: hungry, thirsty, tired, too loud or bright, too many changes, or a need they cannot say. Write down what happened just before and after. A therapist or your doctor can help read the pattern.',
  'How do I prepare for an IEP meeting?': 'Gather recent reports, your own notes on what works, and 3 goals you want. Write your questions ahead of time and bring someone with you. Ask for draft documents before the meeting. You can ask to pause and come back to anything you are not sure about.',
  'Help me build a bedtime routine.': 'Pick 4 or 5 steps in the same order every night: bath, pajamas, teeth, story, lights out. Show it with pictures in the Routine Builder. Dim lights and cut screens 30 to 60 minutes before. Use the same calming sound each night. Be patient: routines take a couple of weeks to stick.',
};

export default function ParentHelper() {
  const [chat, setChat] = useStored('helperChat', []);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = async (text) => {
    const question = (text || q).trim();
    if (!question || busy) return;
    setQ(''); setBusy(true);
    const next = [...chat, { r: 'user', t: question }];
    setChat(next);
    let answer = '';
    try {
      const res = await fetch('/.netlify/functions/ai-helper', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-8).map((m) => ({ role: m.r === 'user' ? 'user' : 'assistant', content: m.t })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI not connected');
      answer = data.reply;
    } catch {
      answer = OFFLINE[question] ||
        'The AI helper is not connected yet, so I can only answer the quick questions above. Your doctor or therapist is the best next step for anything medical.';
    }
    setChat([...next, { r: 'ai', t: answer }].slice(-40));
    setBusy(false);
  };

  return (
    <div>
      <SectionHead title="🤖 Parent Helper" />
      <div style={{ fontSize: 13, color: '#8a7f9e', marginBottom: 10 }}>
        Ask anything about routines, communication, sensory needs, school, food, or sleep. It gives ideas, not medical advice. For health questions, ask your doctor.
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {QUICK.map((x) => <Btn key={x} size="sm" color="cream" onClick={() => ask(x)}>{x}</Btn>)}
      </div>
      {chat.map((m, i) => (
        <Card key={i} style={{ marginBottom: 8, background: m.r === 'user' ? '#fff3e0' : '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#8a7f9e' }}>{m.r === 'user' ? 'You' : 'Helper'}</div>
          <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.t}</div>
        </Card>
      ))}
      {busy && <div className="empty">Thinking… 💛</div>}
      <input className="input-gloss" placeholder="Type your question" value={q}
        onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} style={{ marginBottom: 8 }} />
      <div className="row" style={{ gap: 6 }}>
        <Btn block onClick={() => ask()} disabled={busy}>Ask</Btn>
        {chat.length > 0 && <Btn color="cream" onClick={() => { setChat([]); toast('Chat cleared'); }}>Clear</Btn>}
      </div>
    </div>
  );
}
