// Coin transfers between world wallets (pure). The ONE sanctioned exception to "wallets never
// mix": send coins in clean 10s from one unlocked world to another; THE BANKER keeps 50 %
// (the owner's call: was 20 %). Amounts are multiples of 10, so the toll (amount × TOLL_RATE) is
// always a whole number.
import { getStage, setStage, isUnlocked } from './save.js';

export const STEP = 10;
export const TOLL_RATE = 0.5;

// The honest math: "Send 100 → 50 arrive · Banker keeps 50".
export function quote(amount) {
  const toll = Math.round(amount * TOLL_RATE);
  return { send: amount, arrive: amount - toll, toll };
}

// The most you can send from a wallet (rounded down to 10s).
export const maxSend = (coins) => Math.floor(Math.max(0, coins) / STEP) * STEP;

// The amount stepper: −10 / +10 / +100 / MAX, clamped to 0 … maxSend(wallet).
export function stepAmount(amount, button, wallet) {
  const top = maxSend(wallet);
  const next = button === 'max' ? top : amount + (button === '+100' ? 100 : button === '+10' ? 10 : button === '-10' ? -10 : 0);
  return Math.max(0, Math.min(top, next));
}

// Why a transfer can't happen (null = it can).
export function transferProblem(save, from, to, amount) {
  if (!isUnlocked(save, from) || !isUnlocked(save, to)) return 'locked';
  if (from === to) return 'same';
  if (!Number.isInteger(amount) || amount <= 0 || amount % STEP !== 0) return 'amount';
  if (amount > getStage(save, from).coins) return 'poor';
  return null;
}

// → the new save (both wallets changed), or null if not allowed. The save passed in is untouched.
export function transfer(save, from, to, amount) {
  if (transferProblem(save, from, to, amount)) return null;
  const q = quote(amount);
  const a = getStage(save, from), b = getStage(save, to);
  const next = setStage(save, from, { ...a, coins: a.coins - q.send });
  return setStage(next, to, { ...b, coins: b.coins + q.arrive });
}
