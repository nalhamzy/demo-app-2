import { binance } from "./binance.js";
import { coinbase } from "./coinbase.js";
import { dexscreener } from "./dexscreener.js";

const ALL = { binance, coinbase, dexscreener };

export function getExchanges(ids) {
  const out = [];
  for (const id of ids) {
    if (!ALL[id]) throw new Error(`unknown exchange ${id}`);
    out.push(ALL[id]);
  }
  return out;
}

export function getExchange(id) {
  const ex = ALL[id];
  if (!ex) throw new Error(`unknown exchange ${id}`);
  return ex;
}
