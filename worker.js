/* TRAPPANYAKI — Worker entry point.
   Static assets are served automatically for anything that matches a file
   (run_worker_first defaults to false), so this only ever runs for paths
   with no matching asset — in practice, just /api/notify-order below.
   Everything else falls through to the static site via env.ASSETS. */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/notify-order') {
      return notifyOrder(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

/* Texts the kitchen when an order comes through the batch builder. Fire-and-
   forget from the client — a failure here must never surface to the
   customer, since the order already reached Web3Forms by the time this
   runs. Kept deliberately minimal: no queue, no retry, no logging of
   customer data beyond what's needed for the text itself. */
async function notifyOrder(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!/^https:\/\/(www\.)?trappanyaki\.com$/.test(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response('Bad Request', { status: 400 });
  }

  /* Honeypot tripped — pretend success, do nothing further. */
  if (body && body.botcheck) {
    return json({ ok: true });
  }

  const name = String((body && body.name) || '').trim().slice(0, 80);
  const slot = String((body && body.slot) || '').trim().slice(0, 40);
  const total = String((body && body.total) || '').trim().slice(0, 20);
  if (!name || !slot || !total) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!env.TEXTBELT_KEY || !env.NOTIFY_PHONE) {
    return new Response('Not configured', { status: 503 });
  }

  const message = 'TRAPP ORDER: ' + name + ' - ' + slot + ' - ' + total;

  const params = new URLSearchParams({
    phone: env.NOTIFY_PHONE,
    message: message,
    key: env.TEXTBELT_KEY,
    sender: 'Trappanyaki'
  });

  let ok = false;
  try {
    const resp = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await resp.json();
    ok = !!data.success;
  } catch (err) {
    ok = false;
  }

  return json({ ok: ok });
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
