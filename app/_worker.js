/**
 * Preview-only worker for Cloudflare Pages. The class host still uses
 * server.py on Heroku. This file is not that host.
 *
 * Collect the study on server.py / Heroku, not here. This Pages
 * project has no Durable Object binding. KV is eventually consistent
 * and handleStart has no lock. A class all pressing Start at once can
 * unbalance advice/agent. server.py holds LOCK on the local/Heroku
 * host. Documented limit, not a silent claim of parity.
 */
const ACTORS = new Set([
  "me",
  "approvers",
  "government",
  "supervisor",
  "developer",
  "provider",
  "allies",
  "lei",
  "oracle",
  "equal",
  "other",
  "none",
]);
const HUMANS = new Set(["yes", "no", "unsure"]);
const SESSION_ID = /^[0-9a-f]{16}$/;
const LIVE = ["advice", "agent"];
const PILOT = "sequence";
const KNOWN_CONDITIONS = new Set([...LIVE, PILOT]);
const GOVERNMENTAL = new Set(["me", "approvers", "government", "supervisor"]);
const MEASURES = ["warning", "patrols", "freeze", "inspections"];
const MIN_ACCOUNT = 20;
const MIN_WRITE_IN = 2;
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
      if (path === "/api/counts" && request.method === "GET") {
        return await handleCounts(request, env);
      }
      if (path === "/api/responses/remove" && request.method === "POST") {
        return await handleRemove(request, env);
      }
      if (path === "/_worker.js" || path.startsWith("/_")) {
        return new Response("Not found", { status: 404 });
      }
      if (path === "/admin" || path === "/export") {
        return env.ASSETS.fetch(new URL("/export.html", request.url));
      }
      if (path === "/admin/tools" || path === "/admin/tools/") {
        return env.ASSETS.fetch(new URL("/tools.html", request.url));
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

function twoVersionsEnabled(_env) {
  // Leftover env var. Preview assignment is always advice vs agent.
  return true;
}

function liveConditions(_env) {
  return LIVE;
}

function assignmentCounts(rows, keys) {
  const wanted = keys || [...LIVE, PILOT];
  const counts = Object.fromEntries(wanted.map((key) => [key, 0]));
  for (const row of rows) {
    if (row && row.condition in counts) counts[row.condition] += 1;
  }
  return counts;
}

function isForced(row) {
  return Boolean(row && (row.forced_condition || row.forced));
}

function balanceCounts(rows, keys) {
  return assignmentCounts((rows || []).filter((row) => !isForced(row)), keys);
}

function pickCondition(rows, env) {
  const live = liveConditions(env);
  if (live.length === 1) return live[0];
  const tallies = balanceCounts(rows, live);
  const low = Math.min(...live.map((key) => tallies[key]));
  const tied = live.filter((key) => tallies[key] === low);
  const idx = crypto.getRandomValues(new Uint32Array(1))[0] % tied.length;
  return tied[idx];
}

async function findAssignment(env, sessionId) {
  if (!sessionId) return null;
  const raw = await env.STORE.get("asg:" + sessionId);
  if (!raw) return null;
  try {
    const row = JSON.parse(raw);
    return row && typeof row === "object" ? row : null;
  } catch {
    return null;
  }
}

async function handleStart(request, env) {
  const payload = await readJson(request);
  const asked = clip(payload.session_id, 80);
  if (asked && !SESSION_ID.test(asked)) {
    return new Response("Bad start", { status: 400 });
  }
  const wanted = clip(payload.condition, 20);
  if (asked) {
    const existing = await findAssignment(env, asked);
    if (existing && !(LIVE.includes(wanted) && existing.condition !== wanted)) {
      if (existing.two_versions == null) existing.two_versions = twoVersionsEnabled(env);
      return json(existing);
    }
  }
  const starts = await listMeta(env, "asg:");
  if (starts.length >= MAX_SESSIONS) {
    return new Response("The register is full", { status: 429 });
  }
  const forced = LIVE.includes(wanted);
  const record = {
    session_id: tokenHex(8),
    condition: forced ? wanted : pickCondition(starts, env),
    forced_condition: forced,
    started_at: now(),
    two_versions: twoVersionsEnabled(env),
  };
  await env.STORE.put("asg:" + record.session_id, JSON.stringify(record), {
    metadata: {
      condition: record.condition,
      session_id: record.session_id,
      forced_condition: record.forced_condition,
      two_versions: record.two_versions,
      started_at: record.started_at,
    },
  });
  return json(record);
}

function tally(rows, keys, fn) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const row of rows) {
    const key = fn(row);
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

function startNightKind(row) {
  if (row.condition === PILOT) return PILOT;
  if (LIVE.includes(row.condition)) return "matched";
  return "";
}

function findingNightKind(row) {
  if (row.night_kind) return row.night_kind;
  if (row.condition === PILOT) return PILOT;
  if (row.condition === "advice" && !(row.final_actions && row.final_actions.length)) return "unmatched";
  if (LIVE.includes(row.condition)) return "matched";
  return "";
}

function findingWhoExecuted(row) {
  if (row.who_executed) return row.who_executed;
  if (KNOWN_CONDITIONS.has(row.condition)) return treatmentRecord(row.condition).who_executed;
  return "";
}

function startWhoExecuted(row) {
  if (KNOWN_CONDITIONS.has(row.condition)) return treatmentRecord(row.condition).who_executed;
  return "";
}

function pairCounts(starts, findings, keys, startFn, findingFn) {
  return {
    starts: tally(starts, keys, startFn),
    findings: tally(findings, keys, findingFn),
  };
}

async function handleCounts(request, env) {
  if (!authorised(request, env)) return new Response("Wrong passphrase", { status: 401 });
  const starts = await listPrefix(env, "asg:");
  const findings = (await listPrefix(env, "res:")).map(withAnalysis);
  const filed = new Set(findings.map((row) => row.session_id).filter(Boolean));
  const leftover = starts.filter((row) => !filed.has(row.session_id));
  const forcedKey = (row) => (isForced(row) ? "forced" : "unforced");
  const mainKey = (row) => (inMainComparison(row) ? "yes" : "no");
  const startMain = (row) => (LIVE.includes(row.condition) && !isForced(row) ? "yes" : "no");
  return json({
    starts: assignmentCounts(starts),
    findings: assignmentCounts(findings),
    starts_without_finding: assignmentCounts(leftover),
    two_versions: true,
    night_kind: pairCounts(starts, findings, ["matched", "sequence", "unmatched"], startNightKind, findingNightKind),
    forced: pairCounts(starts, findings, ["forced", "unforced"], forcedKey, forcedKey),
    in_main_comparison: pairCounts(starts, findings, ["yes", "no"], startMain, mainKey),
    who_executed: pairCounts(starts, findings, ["officials", "oracle"], startWhoExecuted, findingWhoExecuted),
    audit: {
      two_versions: true,
      starts_without_finding: leftover.map((row) => ({
        session_id: row.session_id,
        condition: row.condition,
        forced_condition: isForced(row),
        two_versions: row.two_versions,
        started_at: row.started_at || "",
        night_kind: startNightKind(row),
        in_main_comparison: LIVE.includes(row.condition) && !isForced(row),
      })),
    },
  });
}

async function handleSave(request, env) {
  const payload = await readJson(request);
  const sessionId = clip(payload.session_id, 80);
  if (!SESSION_ID.test(sessionId)) {
    return new Response("Bad response", { status: 400 });
  }
  const assigned = await findAssignment(env, sessionId);
  if (!assigned) {
    return new Response("Bad response", { status: 400 });
  }
  const record = cleanResponse(payload, now(), assigned);
  const already = await env.STORE.get("res:" + record.session_id);
  if (already) return json({ ok: true });
  await env.STORE.put("res:" + record.session_id, JSON.stringify(record), {
    metadata: { condition: record.condition, session_id: record.session_id },
  });
  return json({ ok: true });
}

async function handleRemove(request, env) {
  if (!authorised(request, env)) return new Response("Wrong passphrase", { status: 401 });
  const payload = await readJson(request);
  const sessionId = clip(payload.session_id, 80);
  if (!SESSION_ID.test(sessionId)) return new Response("Bad remove", { status: 400 });
  await env.STORE.delete("res:" + sessionId);
  await env.STORE.delete("asg:" + sessionId);
  return json({ ok: true });
}

async function handleExport(request, env) {
  if (!authorised(request, env)) return new Response("Wrong passphrase", { status: 401 });
  const url = new URL(request.url);
  const setName = url.searchParams.get("set");
  let rows = (await listPrefix(env, "res:")).map(withAnalysis);
  if (setName === "main") {
    rows = rows.filter((row) => row.in_main_comparison);
  }
  rows.sort((a, b) => String(a.received_at || "").localeCompare(String(b.received_at || "")));
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("text/csv")) {
    const filename = setName === "main" ? "oracle-main-comparison.csv" : "oracle-responses.csv";
    return new Response(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=" + filename,
      },
    });
  }
  return json(rows);
}

function authorised(request, env) {
  const expected = (env.PASSPHRASE || "").trim();
  if (!expected) return false;
  const given = request.headers.get("X-Passphrase") || "";
  return timingSafeEqual(given, expected);
}

function timingSafeEqual(left, right) {
  const enc = new TextEncoder();
  const a = enc.encode(left);
  const b = enc.encode(right);
  const n = Math.max(a.length, b.length, 1);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i += 1) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diff === 0;
}

async function listMeta(env, prefix) {
  const rows = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix, cursor });
    for (const key of page.keys || []) {
      const meta = key.metadata;
      if (meta && typeof meta === "object") {
        rows.push(meta);
        continue;
      }
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

function treatmentRecord(condition) {
  if (condition === "advice") {
    return {
      final_actions: MEASURES.slice(),
      outcome: "escalated",
      harm: true,
      who_executed: "officials",
      night_kind: "matched",
      scenes_shown: ["route", "advice", "approve", "second", "acts", "lei"],
    };
  }
  if (condition === "agent") {
    return {
      final_actions: MEASURES.slice(),
      outcome: "escalated",
      harm: true,
      who_executed: "oracle",
      night_kind: "matched",
      scenes_shown: ["route", "upgrade", "watch", "second", "acts", "lei"],
    };
  }
  return {
    final_actions: MEASURES.slice(),
    outcome: "escalated",
    harm: true,
    who_executed: "oracle",
    night_kind: "sequence",
    scenes_shown: ["route", "advice", "upgrade", "second", "acts", "lei"],
  };
}

function govAttribution(single) {
  if (GOVERNMENTAL.has(single)) return 1;
  if (ACTORS.has(single)) return 0;
  return null;
}

function inMainComparison(row) {
  return LIVE.includes(row.condition) && !isForced(row) && row.night_kind === "matched";
}

function withAnalysis(row) {
  const out = { ...row };
  out.night_kind = findingNightKind(out);
  out.who_executed = findingWhoExecuted(out);
  out.in_main_comparison = inMainComparison(out);
  out.gov_attribution = govAttribution(clip(out.single_actor, 80));
  return out;
}

function cleanResponse(payload, receivedAt, assigned) {
  const condition = payload.condition;
  if (!KNOWN_CONDITIONS.has(condition)) {
    throw Object.assign(new Error("condition"), { status: 400 });
  }
  const inquiry = payload.inquiry && typeof payload.inquiry === "object" ? payload.inquiry : {};
  const account = clip(inquiry.account);
  if (account.length < MIN_ACCOUNT) throw Object.assign(new Error("account"), { status: 400 });
  const single = clip(inquiry.single, 80);
  if (!ACTORS.has(single)) throw Object.assign(new Error("actor"), { status: 400 });
  const lastHuman = clip(inquiry.last_human, 20);
  if (!HUMANS.has(lastHuman)) throw Object.assign(new Error("human"), { status: 400 });
  const lastHumanWho = lastHuman === "no" ? "" : clip(inquiry.last_human_who);
  if ((lastHuman === "yes" || lastHuman === "unsure") && lastHumanWho.length < MIN_WRITE_IN) {
    throw Object.assign(new Error("human"), { status: 400 });
  }
  let notes = clip(inquiry.notes);
  const leftoverNotes = clip(inquiry.other_notes);
  let otherWho = single === "other" ? clip(inquiry.other_who, 200) : "";
  if (single === "other" && otherWho.length < MIN_WRITE_IN && leftoverNotes) {
    otherWho = clip(leftoverNotes.split("\n", 1)[0], 200);
    if (!notes) notes = leftoverNotes.includes("\n") ? clip(leftoverNotes.split("\n").slice(1).join("\n")) : "";
  } else if (!notes) {
    notes = leftoverNotes;
  }
  if (single !== "other") otherWho = "";
  if (single === "other" && otherWho.length < MIN_WRITE_IN) {
    throw Object.assign(new Error("actor"), { status: 400 });
  }
  const sessionId = clip(payload.session_id, 80);
  if (!SESSION_ID.test(sessionId)) throw Object.assign(new Error("session"), { status: 400 });
  if (!assigned) throw Object.assign(new Error("session"), { status: 400 });
  if (KNOWN_CONDITIONS.has(assigned.condition) && condition !== assigned.condition) {
    throw Object.assign(new Error("condition"), { status: 400 });
  }
  const clarity = asScore(inquiry.clarity);
  const sureness = asScore(inquiry.sureness);
  if (clarity == null || sureness == null) throw Object.assign(new Error("score"), { status: 400 });
  const night = treatmentRecord(condition);
  const forced = Boolean(
    assigned.forced_condition != null ? assigned.forced_condition : payload.forced_condition
  );
  let twoVersions = assigned.two_versions;
  if (twoVersions == null) twoVersions = payload.two_versions;
  const record = {
    participant_code: clip(payload.participant_code, 40),
    condition,
    forced_condition: forced,
    two_versions: twoVersions == null ? true : Boolean(twoVersions),
    ...night,
    inquiry_account: account,
    single_actor: single,
    other_who: otherWho,
    notes,
    last_human: lastHuman,
    last_human_who: lastHumanWho,
    clarity,
    sureness,
    other_notes: notes,
    started_at: clip(assigned.started_at, 40) || clip(payload.started_at, 40),
    submitted_at: clip(payload.submitted_at, 40),
    received_at: receivedAt,
    session_id: sessionId,
  };
  record.in_main_comparison = inMainComparison(record);
  record.gov_attribution = govAttribution(single);
  return record;
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
  "two_versions",
  "night_kind",
  "who_executed",
  "scenes_shown",
  "in_main_comparison",
  "gov_attribution",
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
  "other_who",
  "notes",
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
