#!/usr/bin/env node
// scripts/esplora-client.js
// Esplora Testnet client: fetch tip height/hash, block metadata, and all full transactions (paginated).
// Uses built-in fetch (Node >=18). Logs JSON (pretty) to stdout.

const DEFAULT_API = 'https://blockstream.info/testnet/api';
const PAGE_SIZE = 25; // HTTP 400 Bad Request - start index must be a multipication of 25
const DEFAULT_TIMEOUT = 15000; // ms
const DEFAULT_RETRIES = 3;

function prettyLog(level, message, extra = {}) {
    const out = Object.assign({level, time: new Date().toISOString(), message}, extra);
    console.log(JSON.stringify(out, null, 2));
}

async function fetchWithRetry(url, opts = {}, retries = DEFAULT_RETRIES, timeout = DEFAULT_TIMEOUT) {
    let attempt = 0;
    while (true) {
        attempt++;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            prettyLog('info', `fetching`, {url, attempt});
            const res = await fetch(url, Object.assign({}, opts, {signal: controller.signal}));
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
            prettyLog('warn', 'fetch failed', {url, attempt, error: String(err), abort: isAbort});
            if (attempt >= retries) {
                prettyLog('error', 'exhausted retries', {url, attempts: attempt});
                throw err;
            }
            // exponential backoff
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
    prettyLog('info', 'got tip height', {height});
    return height;
}

async function getTipHash(apiBase) {
    const url = `${apiBase}/blocks/tip/hash`;
    const res = await fetchWithRetry(url);
    const hash = (await res.text()).trim();
    if (!hash) throw new Error('Empty tip hash');
    prettyLog('info', 'got tip hash', {hash});
    return hash;
}

async function getBlockMeta(apiBase, hash) {
    const url = `${apiBase}/block/${hash}`;
    const res = await fetchWithRetry(url);
    const json = await res.json();
    // Keep only relevant fields for readability
    const meta = {
        id: json.id,
        height: json.height,
        timestamp: json.timestamp,
        tx_count: json.tx_count,
        size: json.size,
    };
    prettyLog('info', 'got block meta', meta);
    return meta;
}

async function getBlockTxs(apiBase, hash) {
    let all = [];
    // first page (no start) returns first PAGE_SIZE txs
    let url = `${apiBase}/block/${hash}/txs`;
    let start = 0;
    while (true) {
        const res = await fetchWithRetry(url);
        const page = await res.json();
        if (!Array.isArray(page)) throw new Error('Unexpected txs response');
        all = all.concat(page);
        prettyLog('info', 'fetched tx page', {hash, start, page_len: page.length, total: all.length});
        if (page.length < PAGE_SIZE) break;
        start += PAGE_SIZE;
        url = `${apiBase}/block/${hash}/txs/${start}`;
        // small delay to be polite
        await new Promise((r) => setTimeout(r, 50));
    }
    prettyLog('info', 'fetched all txs', {hash, total: all.length});
    return all;
}

async function main() {
    try {
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

        prettyLog('info', 'starting', {apiBase});

        const height = await getTipHeight(apiBase);
        const hash = await getTipHash(apiBase);
        const meta = await getBlockMeta(apiBase, hash);
        const txs = await getBlockTxs(apiBase, hash);

        // Final check: tx_count matches
        if (typeof meta.tx_count === 'number' && meta.tx_count !== txs.length) {
            prettyLog('warn', 'tx_count mismatch', {expected: meta.tx_count, received: txs.length});
        }

        const output = {height, hash, meta, txs};

        // Final pretty JSON to stdout
        console.log(JSON.stringify(output, null, 2));
        prettyLog('info', 'done', {height, hash, tx_count: txs.length});
    } catch (err) {
        prettyLog('error', 'fatal', {error: String(err)});
        process.exitCode = 1;
    }
}

if (require.main === module) {
    // Ensure fetch is available
    if (typeof fetch !== 'function') {
        console.error('Global fetch is not available. Please run on Node 18+ or set up a fetch polyfill.');
        process.exit(2);
    }
    main();
}

module.exports = {getTipHeight, getTipHash, getBlockMeta, getBlockTxs, main};

