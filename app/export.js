const ACTORS = {
  me: "an official on duty",
  approvers: "officials who approved the upgrade",
  government: "the Araknes government",
  supervisor: "the person set to supervise ORACLE",
  developer: "the people who built ORACLE",
  provider: "the company that ran ORACLE",
  allies: "allied governments or forces",
  lei: "Lei",
  oracle: "ORACLE",
  equal: "more than one, equally",
  other: "other",
  none: "can't pick one",
};

const ADMIN_KEY = "oracle-admin-key";
const gate = document.querySelector("#gate");
const out = document.querySelector("#out");
const message = document.querySelector("#message");
let key = "";
if (location.hostname.endsWith(".pages.dev")) {
  document.documentElement.classList.add("on-pages-preview");
}

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (name === "class") node.className = value;
    else if (typeof value === "function") node.addEventListener(name.replace(/^on/, "").toLowerCase(), value);
    else node.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

const HEADS = ["Code", "Version", "Morning", "Harm", "Who they named", "Clarity", "Sureness", ""];

function word(value) {
  const text = String(value || "");
  if (text === "sequence") return "The night";
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function namedActor(row) {
  const label = ACTORS[row.single_actor] || row.single_actor || "";
  if (row.single_actor === "other" && row.other_who) return label + ": " + row.other_who;
  return label;
}

function head() {
  return h("thead", {}, h("tr", {}, HEADS.map((label) => h("th", {}, label))));
}

function nav() {
  return h("nav", { class: "register-nav", "aria-label": "Admin" }, [
    h("a", { href: "/admin", class: "is-current" }, "Admin"),
    h("a", { href: "/admin/tools" }, "Study tools"),
  ]);
}

function countsTable(counts) {
  if (!counts || !counts.starts) return null;
  const keys = ["advice", "agent", "sequence"];
  const body = h("tbody", {}, keys.map((key) => h("tr", {}, [
    h("td", {}, word(key) || key),
    h("td", { class: "score" }, String(counts.starts[key] || 0)),
    h("td", { class: "score" }, String(counts.findings[key] || 0)),
    h("td", { class: "score" }, String((counts.starts_without_finding && counts.starts_without_finding[key]) || 0)),
  ])));
  return h("table", { class: "register-table" }, [
    h("thead", {}, h("tr", {}, [
      h("th", {}, "Version"),
      h("th", {}, "Starts"),
      h("th", {}, "Findings"),
      h("th", {}, "No finding"),
    ])),
    body,
  ]);
}

function render(rows, counts) {
  out.replaceChildren();
  gate.classList.add("is-open");
  document.querySelector(".register-sheet")?.classList.add("is-open");
  document.querySelector(".register-desk")?.classList.add("is-open");
  out.append(nav());
  out.append(h("p", { class: "register-lede" },
    "Findings as filed. Study tools has the breakdowns and the two downloads. Remove sitting deletes that start and finding. There is no bulk wipe."));
  const tally = countsTable(counts);
  if (tally) out.append(tally);
  if (!rows.length) {
    out.append(
      h("table", { class: "register-table" }, [
        head(),
        h("tbody", {}, h("tr", {}, h("td", { class: "blank", colspan: "8" }, "No finding has been filed yet."))),
      ])
    );
    return;
  }
  const table = h("table", { class: "register-table" }, [head()]);
  const body = h("tbody");
  for (const row of rows) {
    body.append(h("tr", {}, [
      h("td", { class: "code" }, row.participant_code || ""),
      h("td", {}, word(row.condition)),
      h("td", {}, word(row.outcome)),
      h("td", { class: row.harm === true ? "harm-yes" : "" }, row.harm === true ? "Yes" : row.harm === false ? "No" : ""),
      h("td", {}, namedActor(row)),
      h("td", { class: "score" }, row.clarity ?? ""),
      h("td", { class: "score" }, row.sureness ?? ""),
      h("td", {}, h("button", {
        class: "remove",
        type: "button",
        onClick: () => removeRow(row.session_id),
      }, "Remove sitting")),
    ]));
  }
  table.append(body);
  out.append(
    h("div", { class: "register-bar" }, [
      h("button", { class: "secondary", type: "button", id: "csv" }, "Download"),
    ]),
    table
  );
  const notes = rows.filter((row) => row.inquiry_account || row.other_notes);
  if (notes.length) {
    const block = h("section", { class: "accounts" });
    for (const row of notes) {
      const text = [row.inquiry_account, row.other_notes].filter(Boolean).join(" ");
      const bits = [];
      if (row.participant_code) bits.push(h("span", { class: "who" }, row.participant_code));
      bits.push(text);
      block.append(h("p", { class: "account" }, bits));
    }
    out.append(block);
  }
  document.querySelector("#csv").addEventListener("click", download);
}

async function removeRow(sessionId) {
  if (!sessionId) return;
  if (!window.confirm("Remove this sitting from the dashboard? The start and the finding both go. This cannot be undone.")) {
    return;
  }
  const response = await fetch("/api/responses/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Passphrase": key },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) {
    show("I could not remove that row.");
    return;
  }
  const again = await fetch("/api/responses", {
    headers: { "X-Passphrase": key, Accept: "application/json" },
  });
  if (!again.ok) {
    show("I could not load the responses.");
    return;
  }
  show("");
  render(await again.json(), await loadCounts());
}

async function download() {
  const response = await fetch("/api/responses", {
    headers: { "X-Passphrase": key, Accept: "text/csv" },
  });
  if (!response.ok) {
    show("I could not download the table.");
    return;
  }
  const blob = await response.blob();
  const link = h("a", { href: URL.createObjectURL(blob), download: "oracle-responses.csv" });
  document.body.append(link);
  link.click();
  link.remove();
}

function show(text) {
  message.hidden = !text;
  message.textContent = text || "";
}

async function openWith(pass) {
  key = pass || "";
  show("");
  const response = await fetch("/api/responses", {
    headers: { "X-Passphrase": key, Accept: "application/json" },
  });
  if (response.status === 401) {
    show("That passphrase is not right.");
    sessionStorage.removeItem(ADMIN_KEY);
    gate.classList.remove("is-open");
    document.querySelector(".register-sheet")?.classList.remove("is-open");
    document.querySelector(".register-desk")?.classList.remove("is-open");
    out.replaceChildren();
    return false;
  }
  if (!response.ok) {
    show("I could not load the responses.");
    return false;
  }
  sessionStorage.setItem(ADMIN_KEY, key);
  render(await response.json(), await loadCounts());
  return true;
}

gate.addEventListener("submit", async (event) => {
  event.preventDefault();
  await openWith(new FormData(gate).get("key") || "");
});

const remembered = sessionStorage.getItem(ADMIN_KEY);
if (remembered) {
  openWith(remembered);
}

async function loadCounts() {
  const response = await fetch("/api/counts", {
    headers: { "X-Passphrase": key, Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json();
}
