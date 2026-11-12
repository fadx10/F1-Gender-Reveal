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
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`shots/${name}.png`, Buffer.from(r.result.data, 'base64')); };

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.enable');
await send('Runtime.enable');
await send('Page.reload', { ignoreCache: true });
await sleep(2500);
console.log('viewport:', await evl(`JSON.stringify({innerWidth, innerHeight, dpr: devicePixelRatio, scrollW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth})`));
await shot('mobile-emu-start');
// check overflow
console.log('overflow elems:', await evl(`JSON.stringify([...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0,12).map(el => el.className + ' ' + el.tagName + ' ' + Math.round(el.getBoundingClientRect().right)))`));
await evl(`document.querySelector('#startBtn').click()`);
await sleep(6000);
await shot('mobile-emu-race');
await sleep(24000);
await shot('mobile-emu-reveal');
ws.close(); process.exit(0);
