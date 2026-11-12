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
await send('Runtime.enable');
await evl(`document.querySelector('#againBtn').click()`);
await sleep(6000);
console.log(await evl(`JSON.stringify({
  blueLeft: document.querySelector('#tickBlue').style.left,
  pinkLeft: document.querySelector('#tickPink').style.left,
  fill: document.querySelector('#raceFill').style.width,
  blueRect: document.querySelector('#tickBlue').getBoundingClientRect().toJSON(),
  pinkRect: document.querySelector('#tickPink').getBoundingClientRect().toJSON(),
  blueColor: getComputedStyle(document.querySelector('#tickBlue')).backgroundColor,
  pinkColor: getComputedStyle(document.querySelector('#tickPink')).backgroundColor,
  blueZ: getComputedStyle(document.querySelector('#tickBlue')).zIndex,
  timer: document.querySelector('#timer').textContent
}, null, 2)`));
const r = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('shots/race-debug.png', Buffer.from(r.result.data, 'base64'));
ws.close(); process.exit(0);
