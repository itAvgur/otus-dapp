#!/usr/bin/env node
// scripts/check-payments.js
// Check incoming payments to a testnet address using Blockstream Esplora testnet API.
// Outputs: amount (sats and BTC), tx hash, confirmations. Uses built-in fetch (Node 18+).

const DEFAULT_API = 'https://blockstream.info/testnet/api';
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 3;

function prettyLog(level, message, extra = {}) {
  const out = Object.assign({ level, time: new Date().toISOString(), message }, extra);
  console.log(JSON.stringify(out, null, 2));
}

async function fetchWithRetry(url, opts = {}, retries = DEFAULT_RETRIES, timeout = DEFAULT_TIMEOUT) {
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      prettyLog('info', 'fetching', { url, attempt });
      const res = await fetch(url, Object.assign({}, opts, { signal: controller.signal }));
      clearTimeout(id);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
        err.status = res.status;
        throw err;
      }
      return res;
    } catch (err) {
      clearTimeout(id);
      const isAbort = err.name === 'AbortError';
      prettyLog('warn', 'fetch failed', { url, attempt, error: String(err), abort: isAbort });
      if (attempt >= retries) {
        prettyLog('error', 'exhausted retries', { url, attempts: attempt });
        throw err;
      }
      const backoff = 200 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

async function getTipHeight(apiBase) {
  const url = `${apiBase}/blocks/tip/height`;
  const res = await fetchWithRetry(url);
  const text = await res.text();
  const height = parseInt(text.trim(), 10);
  if (Number.isNaN(height)) throw new Error(`Invalid tip height response: ${text}`);
  return height;
}

async function getAddressTxs(apiBase, address) {
  // Fetch only the first page of address txs (Esplora instance may not support /txs/{start} for addresses)
  const url = `${apiBase}/address/${address}/txs`;
  const res = await fetchWithRetry(url);
  const page = await res.json();
  if (!Array.isArray(page)) throw new Error('Unexpected address txs response');
  prettyLog('info', 'fetched address txs (first page)', { address, page_len: page.length });
  return page;
}

async function getAddressMempoolTxs(apiBase, address) {
  const url = `${apiBase}/address/${address}/txs/mempool`;
  try {
    const res = await fetchWithRetry(url);
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    prettyLog('info', 'fetched mempool txs', { address, len: arr.length });
    return arr;
  } catch (err) {
    // Some Esplora instances may not support this endpoint; return empty
    prettyLog('warn', 'mempool fetch failed or unsupported', { address, error: String(err) });
    return [];
  }
}

function satsToBtc(sats) {
  return (sats / 1e8).toFixed(8);
}

function extractIncomingAmount(address, tx) {
  // Sum vout values where scriptpubkey_address equals the address
  if (!Array.isArray(tx.vout)) return 0;
  let sum = 0;
  for (const v of tx.vout) {
    if (v.scriptpubkey_address && v.scriptpubkey_address === address) sum += Number(v.value || v.value === 0 ? v.value : v.value);
    // Some responses use 'value' field in satoshis. Ensure Number.
  }
  return sum;
}

async function main() {
  try {
    if (typeof fetch !== 'function') {
      console.error('Global fetch is not available. Please run on Node 18+ or set up a fetch polyfill.');
      process.exit(2);
    }

    const argv = process.argv.slice(2);
    if (argv.length === 0) {
      console.error('Usage: node scripts/check-payments.js <testnet-address>');
      process.exitCode = 2;
      return;
    }
    const address = argv[0];

    const envApi = process.env.ESPLORA_API;
    let apiBase = DEFAULT_API;
    if (envApi) {
      if (!/testnet/i.test(envApi)) {
        console.error('ESPLORA_API must point to testnet API (contain "testnet"). Ignoring.');
        process.exitCode = 2;
        return;
      }
      apiBase = envApi.replace(/\/+$/g, '');
    }

    prettyLog('info', 'starting', { address, apiBase });

    const tip = await getTipHeight(apiBase);

    // Fetch confirmed and mempool txs, then dedupe by txid (preferring mempool status if present)
    const [confirmed, mempool] = await Promise.all([getAddressTxs(apiBase, address), getAddressMempoolTxs(apiBase, address)]);

    const txMap = new Map();
    for (const tx of confirmed) txMap.set(tx.txid, tx);
    for (const tx of mempool) txMap.set(tx.txid, tx); // overwrite with mempool if present (confirms 0)

    const payments = [];
    for (const [txid, tx] of txMap.entries()) {
      const amount = extractIncomingAmount(address, tx);
      if (!amount || amount <= 0) continue; // skip non-incoming
      const confirmedFlag = tx.status && tx.status.confirmed;
      const confirmations = confirmedFlag && typeof tx.status.block_height === 'number' ? (tip - tx.status.block_height + 1) : 0;
      payments.push({ txid, amount_sats: amount, amount_btc: satsToBtc(amount), confirmations });
    }

    // Sort payments by confirmations desc then amount desc
    payments.sort((a, b) => {
      if (b.confirmations !== a.confirmations) return b.confirmations - a.confirmations;
      return b.amount_sats - a.amount_sats;
    });

    const output = { address, tip_height: tip, payments };
    console.log(JSON.stringify(output, null, 2));
    prettyLog('info', 'done', { address, payments_count: payments.length });
  } catch (err) {
    prettyLog('error', 'fatal', { error: String(err) });
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main, getAddressTxs, getAddressMempoolTxs, extractIncomingAmount };
