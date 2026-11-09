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

function word(value) {
  const text = String(value || "");
  if (text === "sequence") return "The night";
  if (text === "yes") return "Yes";
  if (text === "no") return "No";
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function nav() {
  return h("nav", { class: "register-nav", "aria-label": "Admin" }, [
    h("a", { href: "/admin" }, "Register"),
    h("a", { href: "/admin/tools", class: "is-current" }, "Study tools"),
  ]);
}

function pairTable(title, counts, keys, labels) {
  if (!counts) return null;
  const body = h("tbody", {}, keys.map((key, i) => h("tr", {}, [
    h("td", {}, labels[i] || word(key) || key),
    h("td", { class: "score" }, String((counts.starts && counts.starts[key]) || 0)),
    h("td", { class: "score" }, String((counts.findings && counts.findings[key]) || 0)),
  ])));
  return h("section", { class: "tools-block" }, [
    h("h2", { class: "tools-head" }, title),
    h("table", { class: "register-table" }, [
      h("thead", {}, h("tr", {}, [
        h("th", {}, "Group"),
        h("th", {}, "Starts"),
        h("th", {}, "Findings"),
      ])),
      body,
    ]),
  ]);
}

function render(counts) {
  out.replaceChildren();
  gate.classList.add("is-open");
  document.querySelector(".register-sheet")?.classList.add("is-open");
  document.querySelector(".register-desk")?.classList.add("is-open");
  out.append(nav());
  out.append(h("p", { class: "register-lede" },
    "Breakdowns for the Methods Final. The register keeps the findings table and the sitting-remove tool. New sits are always advice or agent. Forced preview starts stay out of the least-count tally and in_main_comparison."));
  const two = counts && counts.two_versions;
  out.append(h("section", { class: "tools-block" }, [
    h("h2", { class: "tools-head" }, "Assignment"),
    h("p", { class: "register-lede" },
      two
        ? "two_versions is on. Unforced starts are least-count advice vs agent, with a coin flip on a tie."
        : "two_versions should be on. If this line is wrong, the counts request is stale."),
  ]));
  out.append(h("section", { class: "tools-block" }, [
    h("h2", { class: "tools-head" }, "Preview arms"),
    h("p", { class: "register-lede" },
      "These links force a version. They are marked forced and do not enter the main comparison."),
    h("div", { class: "register-bar register-bar-start" }, [
      h("a", { class: "secondary", href: "/?condition=advice" }, "Open advice"),
      h("a", { class: "secondary", href: "/?condition=agent" }, "Open agent"),
    ]),
  ]));
  out.append(h("div", { class: "register-bar register-bar-start" }, [
    h("button", { class: "secondary", type: "button", onClick: () => download("main") }, "Download main comparison"),
    h("button", { class: "secondary", type: "button", onClick: () => download("") }, "Download full export"),
  ]));
  if (counts) {
    out.append(pairTable("Condition", {
      starts: counts.starts,
      findings: counts.findings,
    }, ["advice", "agent", "sequence"], ["Advice", "Agent", "The night"]));
    out.append(pairTable("Night kind", counts.night_kind, ["matched", "sequence", "unmatched"], ["Matched", "The night", "Unmatched"]));
    out.append(pairTable("Forced", counts.forced, ["unforced", "forced"], ["Unforced", "Forced"]));
    out.append(pairTable("Main comparison", counts.in_main_comparison, ["yes", "no"], ["In the table", "Out of the table"]));
    out.append(pairTable("Who executed", counts.who_executed, ["officials", "oracle"], ["Officials", "ORACLE"]));
    const leftover = (counts.audit && counts.audit.starts_without_finding) || [];
    out.append(h("section", { class: "tools-block" }, [
      h("h2", { class: "tools-head" }, "Starts with no finding"),
      leftover.length
        ? h("table", { class: "register-table" }, [
          h("thead", {}, h("tr", {}, [
            h("th", {}, "Session"),
            h("th", {}, "Version"),
            h("th", {}, "Forced"),
            h("th", {}, "Main"),
            h("th", {}, "Started"),
          ])),
          h("tbody", {}, leftover.map((row) => h("tr", {}, [
            h("td", { class: "code" }, row.session_id || ""),
            h("td", {}, word(row.condition)),
            h("td", {}, row.forced_condition ? "Forced" : "Unforced"),
            h("td", {}, row.in_main_comparison ? "Yes" : "No"),
            h("td", {}, row.started_at || ""),
          ]))),
        ])
        : h("p", { class: "register-lede" }, "Every start has a finding, or there are no starts yet."),
    ]));
  }
  out.append(h("p", { class: "register-note" },
    "To remove one sitting, use Remove sitting on the register. That deletes the start and the finding. There is no bulk wipe on this host."));
}

async function download(setName) {
  const path = setName === "main" ? "/api/responses?set=main" : "/api/responses";
  const filename = setName === "main" ? "oracle-main-comparison.csv" : "oracle-responses.csv";
  const response = await fetch(path, {
    headers: { "X-Passphrase": key, Accept: "text/csv" },
  });
  if (!response.ok) {
    show("I could not download the table.");
    return;
  }
  const blob = await response.blob();
  const link = h("a", { href: URL.createObjectURL(blob), download: filename });
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
  const response = await fetch("/api/counts", {
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
    show("I could not load the tools.");
    return false;
  }
  sessionStorage.setItem(ADMIN_KEY, key);
  render(await response.json());
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
