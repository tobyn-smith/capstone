/**
 * Preview-only worker for Cloudflare Pages. The class host still uses
 * server.py on Heroku. This file is not that host.
 */
const ACTORS = new Set(["me", "government", "supervisor", "developer", "provider", "oracle", "none"]);
const HUMANS = new Set(["yes", "no", "unsure"]);
const SESSION_ID = /^[0-9a-f]{16}$/;
const MAX_TEXT = 5000;
const MAX_SESSIONS = 2000;
const MAX_BODY = 200000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/api/start" && request.method === "POST") {
        return await handleStart(request, env);
      }
      if (path === "/api/responses" && request.method === "POST") {
        return await handleSave(request, env);
      }
      if (path === "/api/responses" && request.method === "GET") {
        return await handleExport(request, env);
      }
      if (path === "/api/responses/remove" && request.method === "POST") {
        return await handleRemove(request, env);
      }
      if (path === "/admin" || path === "/export") {
        return env.ASSETS.fetch(new URL("/export.html", request.url));
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error && error.status) {
        return json({ error: error.message || "Bad request" }, error.status);
      }
      return json({ error: "The file did not open." }, 500);
    }
  },
};

async function handleStart(request, env) {
  await readJson(request);
  if (await tooMany(env)) {
    return new Response("The register is full", { status: 429 });
  }
  const record = {
    session_id: tokenHex(8),
    condition: "sequence",
    forced_condition: false,
    started_at: now(),
  };
  await env.STORE.put("asg:" + record.session_id, JSON.stringify(record));
  return json(record);
}

async function handleSave(request, env) {
  const payload = await readJson(request);
  const record = cleanResponse(payload, now());
  await env.STORE.put("res:" + (record.session_id || tokenHex(8)), JSON.stringify(record));
  return json({ ok: true });
}

async function handleRemove(request, env) {
  if (!authorised(request, env)) return new Response("Wrong passphrase", { status: 401 });
  const payload = await readJson(request);
  const sessionId = clip(payload.session_id, 80);
  if (!sessionId) return new Response("Bad remove", { status: 400 });
  await env.STORE.delete("res:" + sessionId);
  await env.STORE.delete("asg:" + sessionId);
  return json({ ok: true });
}

async function handleExport(request, env) {
  if (!authorised(request, env)) return new Response("Wrong passphrase", { status: 401 });
  const rows = await listPrefix(env, "res:");
  rows.sort((a, b) => String(a.received_at || "").localeCompare(String(b.received_at || "")));
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("text/csv")) {
    return new Response(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=oracle-responses.csv",
      },
    });
  }
  return json(rows);
}

function authorised(request, env) {
  const expected = (env.PASSPHRASE || "").trim();
  if (!expected) return false;
  const given = request.headers.get("X-Passphrase") || "";
  return given === expected;
}

async function tooMany(env) {
  const rows = await listPrefix(env, "asg:");
  return rows.length >= MAX_SESSIONS;
}

async function listPrefix(env, prefix) {
  const rows = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix, cursor });
    for (const key of page.keys || []) {
      const raw = await env.STORE.get(key.name);
      if (!raw) continue;
      try {
        const row = JSON.parse(raw);
        if (row && typeof row === "object") rows.push(row);
      } catch {
        /* skip a broken line */
      }
    }
    cursor = page.list_complete ? "" : page.cursor;
  } while (cursor);
  return rows;
}

async function readJson(request) {
  const length = Number(request.headers.get("Content-Length") || "0");
  if (length > MAX_BODY) throw Object.assign(new Error("size"), { status: 400 });
  const text = await request.text();
  if (!text) return {};
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw Object.assign(new Error("json"), { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw Object.assign(new Error("object"), { status: 400 });
  }
  return payload;
}

function cleanResponse(payload, receivedAt) {
  const condition = payload.condition;
  if (!["advice", "agent", "sequence"].includes(condition)) {
    throw Object.assign(new Error("condition"), { status: 400 });
  }
  const inquiry = payload.inquiry && typeof payload.inquiry === "object" ? payload.inquiry : {};
  const single = clip(inquiry.single, 80);
  if (single && !ACTORS.has(single)) throw Object.assign(new Error("actor"), { status: 400 });
  const lastHuman = clip(inquiry.last_human, 20);
  if (lastHuman && !HUMANS.has(lastHuman)) throw Object.assign(new Error("human"), { status: 400 });
  const sessionId = clip(payload.session_id, 80);
  if (sessionId && !SESSION_ID.test(sessionId)) throw Object.assign(new Error("session"), { status: 400 });
  return {
    participant_code: clip(payload.participant_code, 40),
    condition,
    forced_condition: Boolean(payload.forced_condition),
    goal: clip(payload.goal, 200),
    confidence_bar: asBar(payload.confidence_bar),
    preauthorised: asList(payload.preauthorised),
    first_decision: clip(payload.first_decision, 40),
    authorised: asList(payload.authorised),
    stopped: asList(payload.stopped),
    final_actions: asList(payload.final_actions),
    outcome: clip(payload.outcome, 40),
    harm: Boolean(payload.harm),
    injury: Boolean(payload.injury),
    inquiry_account: clip(inquiry.account),
    single_actor: single,
    last_human: lastHuman,
    last_human_who: lastHuman === "no" ? "" : clip(inquiry.last_human_who),
    clarity: asScore(inquiry.clarity),
    sureness: asScore(inquiry.sureness),
    shared: asList(inquiry.shared),
    other_notes: clip(inquiry.other_notes),
    started_at: clip(payload.started_at, 40),
    submitted_at: clip(payload.submitted_at, 40),
    received_at: receivedAt,
    session_id: sessionId,
  };
}

function clip(value, limit = MAX_TEXT) {
  if (value == null) return "";
  return String(value).trim().slice(0, limit);
}

function asScore(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw Object.assign(new Error("score"), { status: 400 });
  }
  return value;
}

function asBar(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    throw Object.assign(new Error("bar"), { status: 400 });
  }
  return value;
}

function asList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clip(item, 80)).filter(Boolean);
}

function tokenHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

const COLUMNS = [
  "participant_code",
  "condition",
  "forced_condition",
  "goal",
  "confidence_bar",
  "preauthorised",
  "first_decision",
  "authorised",
  "stopped",
  "final_actions",
  "outcome",
  "harm",
  "injury",
  "inquiry_account",
  "single_actor",
  "last_human",
  "last_human_who",
  "clarity",
  "sureness",
  "shared",
  "other_notes",
  "started_at",
  "submitted_at",
  "received_at",
  "session_id",
];

function join(value) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.map((item) => clip(item, 200)).join(" | ");
  return clip(value, 500);
}

function csvSafe(value) {
  const text = value == null ? "" : String(value);
  const escaped = text.slice(0, 1).match(/[=+\-@]/) ? "'" + text : text;
  if (/[",\n]/.test(escaped)) return '"' + escaped.replace(/"/g, '""') + '"';
  return escaped;
}

function toCsv(rows) {
  const lines = [COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((key) => csvSafe(join(row[key]))).join(","));
  }
  return lines.join("\n") + "\n";
}
