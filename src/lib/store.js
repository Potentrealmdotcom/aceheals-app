import { useState, useEffect, useCallback } from 'react';

// Persistent local state (offline-first). Namespaced under aceheals:.
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem('aceheals:' + key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key, val) {
  try {
    localStorage.setItem('aceheals:' + key, JSON.stringify(val));
  } catch { /* storage full / private mode — app keeps working in memory */ }
}

export function useStored(key, initial) {
  const [val, setVal] = useState(() => load(key, initial));
  const set = useCallback((v) => {
    setVal((prev) => {
      const next = typeof v === 'function' ? v(prev) : v;
      save(key, next);
      return next;
    });
  }, [key]);
  return [val, set];
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// Consecutive-day streak counter
export function useStreak() {
  const [streak, setStreak] = useStored('streak', { count: 0, last: null });
  useEffect(() => {
    const t = todayKey();
    if (streak.last === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    setStreak({ count: streak.last === y ? streak.count + 1 : 1, last: t });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return streak.count;
}

// Tiny toast helper (event-based so any component can fire one)
export function toast(msg) {
  window.dispatchEvent(new CustomEvent('aceheals:toast', { detail: msg }));
}

// Text-to-speech (AAC board, stories, read-aloud)
// Strips emojis/symbols first — screen readers read "glowing star" etc. out loud otherwise.
// Browsers BLOCK speech until the person has tapped the page once ("not-allowed").
// So: if nothing has been tapped yet, we queue the line and say it on the first tap.
let _unlocked = false;
let _pending = null;
let _lastErrToast = 0;

function userHasTapped() {
  try {
    if (navigator.userActivation) return navigator.userActivation.hasBeenActive || _unlocked;
  } catch {}
  return _unlocked;
}

function audioSettingsBlock() {
  try {
    const s = JSON.parse(localStorage.getItem('aceheals:audioSettings') || '{}');
    if (s.master === false) return true;
    if (s.voice === false) return true;
    if (s.mode === 'library' || s.mode === 'quiet') return true;
  } catch {}
  return false;
}

function pickVoice(synth) {
  // Phones ship several voices; the robotic one is usually the default. Prefer the natural/neural ones.
  try {
    const v = (synth.getVoices() || []).filter((x) => /^en/i.test(x.lang));
    if (!v.length) return null;
    const score = (x) => {
      const n = x.name.toLowerCase();
      let sc = 0;
      if (/natural|neural|premium|enhanced|wavenet/.test(n)) sc += 100;
      if (/google us english|google uk english female/.test(n)) sc += 60;
      if (/samantha|ava|allison|susan|karen|moira|serena|zoe|aria|jenny|emma|libby|sonia/.test(n)) sc += 50;
      if (/^en[-_]US/i.test(x.lang)) sc += 20;
      if (!x.localService) sc += 10; // network voices are usually smoother
      if (/espeak|compact|robot/.test(n)) sc -= 80;
      return sc;
    };
    return v.sort((a, b) => score(b) - score(a))[0];
  } catch { return null; }
}

function speakNow(text, rate) {
  const clean = String(text || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return;
  const synth = window.speechSynthesis;
  const doSpeak = () => {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = Math.min(1.05, rate + 0.1); // 0.85 sounds drawn-out/robotic; a touch faster is more natural
    u.pitch = 1.08;
    u.lang = 'en-US';
    try {
      const s = JSON.parse(localStorage.getItem('aceheals:audioSettings') || '{}');
      u.volume = typeof s.volume === 'number' ? Math.max(0.05, s.volume) : 1;
    } catch {}
    const v = pickVoice(synth);
    if (v) u.voice = v;
    u.onerror = (ev) => {
      const now = Date.now();
      if (now - _lastErrToast < 4000) return;
      _lastErrToast = now;
      const code = ev && ev.error;
      if (code === 'interrupted' || code === 'canceled') return;
      if (code === 'not-allowed') toast('🔊 Tap the screen once, then try again. Also check phone volume + silent switch.');
      else if (code === 'synthesis-unavailable' || code === 'language-unavailable' || code === 'voice-unavailable')
        toast('🔇 This phone has no voice installed. Install "Speech Services by Google" (Android) or check Settings → Accessibility → Spoken Content (iPhone).');
      else toast('🔇 Voice could not play on this device. Words still show on screen.');
    };
    // Small delay after cancel() — Android needs breathing room
    setTimeout(() => { try { synth.speak(u); } catch { toast('🔇 Could not play speech'); } }, 50);
  };
  if (synth.getVoices().length === 0) {
    let done = false;
    const onVoices = () => { if (!done) { done = true; doSpeak(); } };
    synth.addEventListener('voiceschanged', onVoices, { once: true });
    setTimeout(() => { if (!done) { done = true; doSpeak(); } }, 500);
  } else {
    doSpeak();
  }
}

// Call once at app start: unlocks voice + sound on the first tap anywhere.
export function installAudioUnlock() {
  if (typeof window === 'undefined' || window.__acehealsUnlock) return;
  window.__acehealsUnlock = true;
  const unlock = () => {
    _unlocked = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { const c = new AC(); c.resume && c.resume(); setTimeout(() => { try { c.close(); } catch {} }, 300); }
    } catch {}
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch {}
    if (_pending) { const [t, r] = _pending; _pending = null; setTimeout(() => speakNow(t, r), 120); }
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((e) => window.removeEventListener(e, unlock, true));
  };
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((e) => window.addEventListener(e, unlock, true));
}

export function speak(text, rate = 0.85) {
  try {
    if (audioSettingsBlock()) return;
    if (!('speechSynthesis' in window)) { toast('🔇 Speech not supported on this device'); return; }
    if (!userHasTapped()) { _pending = [text, rate]; return; } // wait for first tap instead of failing
    speakNow(text, rate);
  } catch {
    toast('🔇 Could not play speech');
  }
}

export function stopSpeak() {
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
}

// Vibrate when available (used in deaf/HOH mode as a visual/tactile cue)
export function buzz(pattern = [60]) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch {}
}
