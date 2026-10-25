import { load, save } from './store.js';
import { sb } from './supabase.js';

// Pricing per spec: $79 lifetime (featured), $12.99/mo, 24h free trial no card.
export const PLANS = {
  lifetime: { id: 'lifetime', name: 'Lifetime Access', price: 79, label: '$79 one-time', note: 'Pay once, own forever. No renewals.' },
  monthly: { id: 'monthly', name: 'Monthly', price: 12.99, label: '$12.99/month', note: 'Cancel anytime.' },
};

// access = { paid: bool, plan: 'lifetime'|'monthly'|null, trialStart: ts,
//            graceUntil: ts|null, promoUntil: ts|null, redeemedCodes: [string] }
export function getAccess() {
  const a = load('access', null);
  if (a) return a;
  const fresh = { paid: false, plan: null, trialStart: Date.now(), graceUntil: null, promoUntil: null, redeemedCodes: [] };
  save('access', fresh);
  return fresh;
}
export function setAccess(a) { save('access', a); }

export function trialHoursLeft() {
  const a = getAccess();
  if (a.paid) return Infinity;
  const end = a.trialStart + 24 * 3600e3;
  return Math.max(0, (end - Date.now()) / 3600e3);
}
export function trialActive() {
  const a = getAccess();
  return !a.paid && trialHoursLeft() > 0;
}
export function isPaid() {
  const a = getAccess();
  if (a.paid) return true;
  // 3-day grace period on failed payments before blocking (per spec)
  if (a.graceUntil && Date.now() < a.graceUntil) return true;
  // Book promo code still running (see PROMO_CODES below)
  if (a.promoUntil && Date.now() < a.promoUntil) return true;
  return false;
}
export function hasAccess() { return trialActive() || isPaid(); }

// ── POTENT Publishing coloring-book promo codes ─────────────────────────────
// Each book prints one code on its AceHeals bonus page. A code grants 7 DAYS
// of full premium access, counted from redemption (or stacked onto a promo
// already running). Redemption lives in the same local `access` record as
// the trial, so it persists across reloads and works offline afterwards —
// same enforcement level as the trial / parent PIN (per-device local store).
export const PROMO_CODES = {
  ANIMALS7: { days: 7, book: 'Bold & Easy Animals' },
  DINOS7: { days: 7, book: 'Bold & Easy Dinosaurs' },
  TRUCKS7: { days: 7, book: 'Bold & Easy Trucks & Machines' },
  PETS7: { days: 7, book: 'Bold & Easy Cats & Dogs' },
  MAGIC7: { days: 7, book: 'Bold & Easy Unicorns & Magic' },
  HEROES7: { days: 7, book: 'POTENT Heroes' },
};

export function promoActive() {
  const a = getAccess();
  return Boolean(a.promoUntil && Date.now() < a.promoUntil);
}
export function promoDaysLeft() {
  const a = getAccess();
  if (!a.promoUntil) return 0;
  return Math.max(0, Math.ceil((a.promoUntil - Date.now()) / 864e5));
}

// Redeem a book code. Returns { ok, ... } — never throws.
// One redemption per code per device/account-local store (redeemedCodes).
export function redeemPromoCode(raw) {
  const code = String(raw || '').trim().toUpperCase().replace(/[\s-]+/g, '');
  const entry = PROMO_CODES[code];
  if (!entry) {
    return { ok: false, reason: 'invalid', message: "Hmm, that code doesn't match one of our books. Check the letters and try again 💛" };
  }
  const a = getAccess();
  const used = a.redeemedCodes || [];
  if (used.includes(code)) {
    return { ok: false, reason: 'used', message: 'Good news — this code was already redeemed here, so its 7 days are already counted 🎁' };
  }
  const base = Math.max(Date.now(), a.promoUntil || 0);
  const until = base + entry.days * 864e5;
  setAccess({ ...a, promoUntil: until, redeemedCodes: [...used, code] });
  return { ok: true, code, book: entry.book, daysAdded: entry.days, until };
}

// Per-tab trial limits after 24h unpaid (per spec)
export const TRIAL_LIMITS = {
  home: 'accessible-with-paywall',
  scanner: { scansPerDay: 3 },
  aac: { categories: 2 },           // first 2 categories only
  potty: 'paywall',
  music: 'paywall',
  recipes: { max: 5, noAI: true },   // 5 recipes only, no AI generator
  community: 'read-only',
};

export function scansToday() {
  const k = 'scans:' + new Date().toISOString().slice(0, 10);
  return load(k, 0);
}
export function bumpScans() {
  const k = 'scans:' + new Date().toISOString().slice(0, 10);
  const n = load(k, 0) + 1;
  save(k, n);
  return n;
}

// Restore purchase: manual Supabase check (per spec). Falls back gracefully offline.
export async function restorePurchase(userId) {
  const row = await sb(async (s) => {
    const { data, error } = await s.from('users').select('paid, plan').eq('id', userId).single();
    if (error) throw error;
    return data;
  }, null);
  if (row && row.paid) {
    setAccess({ ...getAccess(), paid: true, plan: row.plan || 'lifetime', graceUntil: null });
    return true;
  }
  return false;
}

// Start Stripe Checkout via Netlify function (stub until keys are configured).
export async function startCheckout(planId, email) {
  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, email }),
    });
    const data = await res.json();
    if (data.url) { window.location.href = data.url; return; }
    throw new Error(data.error || 'Checkout not configured yet');
  } catch (e) {
    throw new Error('Payments are not connected yet. ' + (e.message || ''));
  }
}

// ?payment=success handler — auto-verify and unlock (per spec).
export async function handlePaymentReturn() {
  const q = new URLSearchParams(window.location.search);
  if (q.get('payment') !== 'success') return false;
  const sessionId = q.get('session_id');
  try {
    const res = await fetch('/.netlify/functions/verify-access?session_id=' + encodeURIComponent(sessionId || ''));
    const data = await res.json();
    if (data.paid) {
      setAccess({ ...getAccess(), paid: true, plan: data.plan || 'lifetime', graceUntil: null });
    }
  } catch { /* offline — keep trial state, user can hit Restore Purchase later */ }
  window.history.replaceState({}, '', window.location.pathname);
  return true;
}
