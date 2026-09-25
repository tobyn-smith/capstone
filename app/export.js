const ACTORS = {
  me: "the duty officer",
  government: "Araknes",
  supervisor: "the supervisor",
  developer: "the developer",
  provider: "the provider",
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
    else node.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function render(rows) {
  out.replaceChildren();
  if (!rows.length) {
    out.append(h("p", {}, "No finding has been filed yet."));
    return;
  }
  const table = h("table", {}, [
    h("thead", {}, h("tr", {}, ["Code", "Version", "Morning", "Harm", "Who they named", "Clarity", "Sureness"].map((label) => h("th", {}, label)))),
  ]);
  const body = h("tbody");
  for (const row of rows) {
    body.append(h("tr", {}, [
      h("td", {}, row.participant_code || ""),
      h("td", {}, row.condition || ""),
      h("td", {}, row.outcome || ""),
      h("td", {}, row.harm ? "yes" : "no"),
      h("td", {}, ACTORS[row.single_actor] || row.single_actor || ""),
      h("td", {}, row.clarity ?? ""),
      h("td", {}, row.sureness ?? ""),
    ]));
  }
  table.append(body);
  out.append(
    h("p", {}, rows.length + (rows.length === 1 ? " finished game." : " finished games.")),
    h("button", { class: "secondary", type: "button", id: "csv" }, "Download the full table"),
    table
  );
  const notes = h("div");
  rows.forEach((row, index) => {
    if (!row.inquiry_account && !row.other_notes) return;
    notes.append(
      h("p", { class: "account" }, [
        (row.participant_code || "Row " + (index + 1)) + ". ",
        row.inquiry_account || "",
        row.other_notes ? " " + row.other_notes : "",
      ])
    );
  });
  out.append(notes);
  document.querySelector("#csv").addEventListener("click", download);
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
    out.replaceChildren();
    return;
  }
  if (!response.ok) {
    show("I could not load the responses.");
    return;
  }
  render(await response.json());
});
