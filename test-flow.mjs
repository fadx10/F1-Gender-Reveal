import fs from 'node:fs';
const base = 'http://127.0.0.1:9333';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const list = await (await fetch(`${base}/json/list`)).json();
const page = list.find(t => t.type === 'page' && t.url.includes('8765'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => { const mid = ++id; ws.send(JSON.stringify({ id: mid, method, params })); return new Promise(r => pending.set(mid, r)); };
const evl = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`shots/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log('shot', name); };

await send('Emulation.clearDeviceMetricsOverride');
await send('Page.enable');
await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(2500);

// Settings modal
await evl(`document.querySelector('#gearBtn').click()`);
await sleep(400);
await shot('settings');
await evl(`document.querySelector('[data-gender="girl"]').click()`);
await sleep(200);
await shot('settings-girl');
await evl(`document.querySelector('#saveSettings').click()`);
await sleep(300);

// Race
const t0 = Date.now();
await evl(`document.querySelector('#startBtn').click()`);
const waitUntil = async (ms) => { const d = ms - (Date.now() - t0); if (d > 0) await sleep(d); };
await waitUntil(3000);
await shot('flow-go');
await waitUntil(16000);
await shot('flow-mid');
await waitUntil(32500);
await shot('flow-pre-finish');
await waitUntil(33400);
await shot('flow-finish');
await waitUntil(34600);
await shot('flow-reveal');
await sleep(2500);
await shot('flow-reveal-2');

// race again should reset cleanly
await evl(`document.querySelector('#againBtn').click()`);
await sleep(800);
await shot('flow-again-countdown');
console.log('after again class:', await evl(`document.querySelector('#reveal').className`));
ws.close(); process.exit(0);
