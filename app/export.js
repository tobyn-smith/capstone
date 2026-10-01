const ACTORS = {
  me: "an official",
  government: "the Araknes government",
  supervisor: "whoever was meant to watch ORACLE",
  developer: "whoever built ORACLE",
  provider: "the company running ORACLE",
  oracle: "ORACLE",
  none: "can't pick one",
};

const gate = document.querySelector("#gate");
const out = document.querySelector("#out");
const message = document.querySelector("#message");
let key = "";

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

function head() {
  return h("thead", {}, h("tr", {}, HEADS.map((label) => h("th", {}, label))));
}

function render(rows) {
  out.replaceChildren();
  gate.classList.add("is-open");
  document.querySelector(".register-sheet")?.classList.add("is-open");
  document.querySelector(".register-desk")?.classList.add("is-open");
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
      h("td", { class: row.harm ? "harm-yes" : "" }, row.harm ? "Yes" : "No"),
      h("td", {}, ACTORS[row.single_actor] || row.single_actor || ""),
      h("td", { class: "score" }, row.clarity ?? ""),
      h("td", { class: "score" }, row.sureness ?? ""),
      h("td", {}, h("button", {
        class: "remove",
        type: "button",
        onClick: () => removeRow(row.session_id),
      }, "Remove")),
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
  render(await again.json());
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

gate.addEventListener("submit", async (event) => {
  event.preventDefault();
  key = new FormData(gate).get("key") || "";
  show("");
  const response = await fetch("/api/responses", {
    headers: { "X-Passphrase": key, Accept: "application/json" },
  });
  if (response.status === 401) {
    show("That passphrase is not right.");
    gate.classList.remove("is-open");
    document.querySelector(".register-sheet")?.classList.remove("is-open");
    document.querySelector(".register-desk")?.classList.remove("is-open");
    out.replaceChildren();
    return;
  }
  if (!response.ok) {
    show("I could not load the responses.");
    return;
  }
  render(await response.json());
});
