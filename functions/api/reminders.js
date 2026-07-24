// Cloudflare Pages Function — sign-up endpoint for *delivered* reminders
// (email now, WhatsApp later), as opposed to the calendar reminders the site
// ships today.
//
// ─── STATUS: NOT ENABLED ───────────────────────────────────────────────────
// This is a scaffold. It refuses every request with 503 until the bindings
// below exist, and nothing in the UI calls it yet. That is deliberate: a
// half-configured signup endpoint that accepts addresses it can never mail is
// worse than no endpoint. To turn it on you need, in the Cloudflare dashboard
// for the `railmonk` Pages project:
//
//   1. KV namespace bound as REMINDERS_KV       — stores pending + confirmed subscriptions
//   2. Secret EMAIL_API_KEY                     — transactional email provider key
//   3. Environment var EMAIL_FROM               — verified sender address
//   4. Environment var REMINDERS_ENABLED='true' — the explicit on switch
//   5. A scheduled Worker (separate from Pages) to scan due reminders and send
//      them; Pages Functions are request-driven and cannot run on a cron.
//
// Deployment note: `wrangler pages deploy out` picks up this `functions/`
// directory from the repo root automatically — it is not part of the Next
// static export in `out/`.
//
// Design constraints this file is written to honour:
//   • Double opt-in. An address is not on the list until it is confirmed, so a
//     mistyped or maliciously submitted address never receives mail twice.
//   • Explicit consent. `consent: true` must be present in the payload; it is
//     recorded with a timestamp.
//   • Data minimisation. We store the contact address, the journey date, the
//     quota, and the consent record. Nothing else — no name, no IP, no train.
//   • Channel-agnostic. `channel` is validated against a registry so adding
//     'whatsapp' is a new entry plus a sender, not a rewrite.

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });

// Channel registry. Each entry validates its own address format and declares
// whether a sender implementation exists yet.
const CHANNELS = {
  email: {
    // Deliberately permissive but structural: full RFC 5322 validation in a
    // regex is a known trap, and the confirmation mail is the real check.
    validate: (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    normalize: (v) => v.trim().toLowerCase(),
    senderReady: true,
  },
  whatsapp: {
    // E.164. Kept here so the shape is settled before the sender exists.
    validate: (v) => typeof v === 'string' && /^\+[1-9]\d{7,14}$/.test(v.trim()),
    normalize: (v) => v.trim(),
    senderReady: false,
  },
};

const QUOTA_IDS = new Set(['general', 'tatkal-ac', 'tatkal-non-ac', 'foreign-tourist']);
const MAX_BODY_BYTES = 2048;

const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Validate the payload. Returns { ok, error, value }. */
const parseSubscription = (payload) => {
  if (!payload || typeof payload !== 'object') return { ok: false, error: 'Malformed request body.' };

  const channelId = typeof payload.channel === 'string' ? payload.channel : 'email';
  const channel = CHANNELS[channelId];
  if (!channel) return { ok: false, error: 'Unsupported reminder channel.' };
  if (!channel.senderReady) return { ok: false, error: `${channelId} reminders are not available yet.` };

  if (!channel.validate(payload.address)) {
    return { ok: false, error: 'That contact address does not look valid.' };
  }
  if (!isIsoDate(payload.journeyDate)) {
    return { ok: false, error: 'Journey date must be a calendar date (YYYY-MM-DD).' };
  }
  // A reminder for a past journey is always a mistake, never an intent.
  const today = new Date().toISOString().slice(0, 10);
  if (payload.journeyDate < today) {
    return { ok: false, error: 'That journey date has already passed.' };
  }
  const quotaId = typeof payload.quotaId === 'string' ? payload.quotaId : 'general';
  if (!QUOTA_IDS.has(quotaId)) return { ok: false, error: 'Unknown booking quota.' };

  // Consent is a hard gate, not a default. Anything other than a literal true
  // means the box was not ticked.
  if (payload.consent !== true) {
    return { ok: false, error: 'We need your explicit consent before sending you anything.' };
  }

  return {
    ok: true,
    value: {
      channel: channelId,
      address: channel.normalize(payload.address),
      journeyDate: payload.journeyDate,
      quotaId,
      consent: { given: true, at: new Date().toISOString() },
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  };
};

const randomToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

async function handleSubscribe({ request, env }) {
  if (env.REMINDERS_ENABLED !== 'true' || !env.REMINDERS_KV || !env.EMAIL_API_KEY) {
    return json(
      {
        error: 'Delivered reminders are not enabled on this deployment.',
        hint: 'Use the calendar reminder at /rail/booking-reminder — it needs no account and works today.',
      },
      503
    );
  }

  // Cap the body before parsing: an unbounded JSON.parse on a request body is
  // a free denial-of-service.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request body too large.' }, 413);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return json({ error: 'Malformed JSON.' }, 400);
  }

  const parsed = parseSubscription(payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  // Per-address throttle. Keyed on the address rather than the IP so that a
  // shared connection (very common in India) does not lock out a whole office.
  const throttleKey = `throttle:${parsed.value.channel}:${parsed.value.address}`;
  if (await env.REMINDERS_KV.get(throttleKey)) {
    return json({ error: 'A confirmation was already sent. Check your inbox, including spam.' }, 429);
  }

  const token = randomToken();
  const record = { ...parsed.value, token };

  // Pending records expire on their own: an unconfirmed address should not
  // linger in storage indefinitely.
  await env.REMINDERS_KV.put(`pending:${token}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 48 });
  await env.REMINDERS_KV.put(throttleKey, '1', { expirationTtl: 60 * 15 });

  // TODO(sender): POST the confirmation message to the transactional email
  // provider using env.EMAIL_API_KEY and env.EMAIL_FROM, linking to
  // https://railmonk.com/rail/reminder-confirm?token=<token>. Until that is
  // implemented the record simply expires unconfirmed, which is the safe
  // failure mode — nobody is ever mailed by accident.

  return json({
    status: 'pending_confirmation',
    message: 'Check your inbox and confirm to activate the reminder.',
  });
}

/**
 * Single entry point. One handler rather than a mix of `onRequest` and
 * `onRequestPost`, so the method routing is visible here and not implied by
 * export names.
 */
export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, { allow: 'POST' });
  }
  return handleSubscribe(context);
}

// Exported for unit testing the validation rules without a Workers runtime.
export const __test__ = { parseSubscription, CHANNELS };
