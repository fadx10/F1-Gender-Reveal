import fs from 'node:fs';

const base = 'http://127.0.0.1:9333';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`${base}/json/list`)).json();
      const page = list.find(t => t.type === 'page' && t.url.includes('8765'));
      if (page) return page;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('no target');
}

const page = await getTarget();
console.log('target', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
function send(method, params = {}) {
  const mid = ++id;
  ws.send(JSON.stringify({ id: mid, method, params }));
  return new Promise((res) => pending.set(mid, res));
}

async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) console.log('EXC', JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`shots/${name}.png`, Buffer.from(r.result.data, 'base64'));
  console.log('shot', name);
}

await send('Page.enable');
await send('Runtime.enable');
await sleep(1500);

console.log('errors:', await evaluate(`window.__errs || 'none'`));

// set secret = boy
await evaluate(`document.querySelector('#gearBtn').click()`);
await sleep(300);
await evaluate(`document.querySelector('[data-gender="boy"]').click()`);
await sleep(150);
await evaluate(`document.querySelector('#saveSettings').click()`);
await sleep(400);
await evaluate(`document.querySelector('#startBtn').click()`);
await sleep(1200);
await shot('countdown');
await sleep(2600);
await shot('race-early');
await sleep(9000);
await shot('race-mid');
await sleep(12000);
await shot('race-late');
await sleep(9000);
await shot('reveal-1');
await sleep(1500);
await shot('reveal-2');

console.log('winner state check', await evaluate(`document.querySelector('#reveal').className`));
console.log('errors2:', await evaluate(`window.__errs || 'none'`));
ws.close();
process.exit(0);
