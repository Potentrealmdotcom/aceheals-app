import { load, save } from './store.js';

// Parent-made child profiles (stored on this device). Powers the landing-page tiles.
export const BUDDIES = ['🦊','🦉','🦅','🦁','🐼','🐸','🦄','🐉','🤖','👽','🐱','🐶'];
export const KID_COLORS = [
  { id: 'orange', hex: '#FF6B35' }, { id: 'purple', hex: '#9B59B6' }, { id: 'blue', hex: '#3498DB' },
  { id: 'pink', hex: '#E91E8C' }, { id: 'green', hex: '#2ECC71' }, { id: 'yellow', hex: '#F1C40F' },
  { id: 'red', hex: '#e74c3c' }, { id: 'teal', hex: '#1abc9c' },
];

export function getKids() { return load('kids', []); }
export function addKid(k) {
  const kids = getKids();
  const kid = { id: 'kid' + Date.now(), ...k };
  save('kids', [...kids, kid]);
  return kid;
}
export function removeKid(id) { save('kids', getKids().filter((k) => k.id !== id)); }
export function setActiveKid(k) { save('activeKid', k ? { id: k.id, name: k.name, emoji: k.emoji, color: k.color } : null); }
export function getActiveKid() { return load('activeKid', null); }
