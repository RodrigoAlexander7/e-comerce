/** Cliente minimo del protocolo de DevTools, sin dependencias externas. */
export async function connect(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'error');
    return r.result.value;
  };

  const goto = async (url) => {
    await send('Page.navigate', { url });
    // Espera a que React haya hidratado y pintado.
    for (let i = 0; i < 60; i++) {
      try {
        const ready = await evaluate('return document.readyState === "complete";');
        if (ready) { await evaluate('return new Promise(r => setTimeout(r, 400));'); return; }
      } catch { /* la navegacion invalida el contexto: se reintenta */ }
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  return { send, evaluate, goto, close: () => ws.close() };
}
