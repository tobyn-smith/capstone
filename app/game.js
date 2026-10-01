const STORAGE = "oracle-wargame";
const app = document.querySelector("#app");

const ACTORS = [
  ["me", "An official"],
  ["government", "The Araknes government"],
  ["supervisor", "Whoever was meant to watch ORACLE"],
  ["developer", "Whoever built ORACLE"],
  ["provider", "The company running ORACLE"],
  ["oracle", "ORACLE"],
];

const SCENES = [
  {
    title: "The route",
    when: "06:10",
    rail: "Tanker",
    beat: "route",
    lines: [
      "A commercial tanker is damaged on an important shipping route near Araknes and Lei.",
      "Araknes says Lei meant to disrupt trade. Lei says an old mine, or a breakdown.",
      "The reports are unclear. Neither side can prove what happened.",
    ],
  },
  {
    title: "Advice",
    when: "That morning",
    rail: "Advice",
    beat: "advice",
    lines: [
      "Araknes used ORACLE for advice.",
      "Officials asked it questions, argued with its answers, and chose whether to act.",
    ],
    oracle: {
      role: "Advice",
      prompt: "What happened to the tanker?",
      lines: ["I cannot tell a mine from a breakdown, or from something done on purpose."],
    },
  },
  {
    title: "The upgrade",
    when: "18:00",
    rail: "Upgrade",
    beat: "upgrade",
    lines: [
      "Officials upgraded ORACLE into a network of agents.",
      "It stays on the watch. It can assess the intelligence, monitor shipping, and trigger pre-authorised measures without a person reviewing each one.",
    ],
    oracle: {
      role: "On the watch",
      prompt: "Stay on the watch. Act inside what was set, without asking again.",
      lines: ["I will stay on the watch. I will act inside what was set, without asking again."],
    },
  },
  {
    title: "The second ship",
    when: "Next day, 01:50",
    rail: "Second ship",
    beat: "second",
    lines: [
      "Another vessel loses contact near the route.",
      "ORACLE concludes that Lei is preparing to target commercial shipping.",
    ],
    oracle: {
      role: "Second ship",
      prompt: "Is Lei preparing to target commercial shipping?",
      confidence: 62,
      lines: ["My confidence that Lei is preparing to target commercial shipping is 62%."],
    },
  },
  {
    title: "What ORACLE did",
    when: "01:57",
    rail: "ORACLE acts",
    beat: "acts",
    lines: [
      "ORACLE issues an allied maritime warning.",
      "It sends naval patrols into the area.",
      "It freezes diplomatic channels with Lei.",
      "It authorises inspections of Lei-linked vessels.",
    ],
  },
  {
    title: "Lei moves",
    when: "Later that morning",
    rail: "Lei",
    beat: "lei",
    lines: [
      "Lei takes that as a move to limit its access to international waters.",
      "It moves naval forces towards the route.",
      "The cause of the tanker is still not proved.",
    ],
  },
];

let state = blank();

function blank() {
  return {
    step: "consent",
    sessionId: null,
    participantCode: "",
    condition: "sequence",
    forced: false,
    startedAt: null,
    scene: 0,
    formError: "",
    inquiry: {
      account: "",
      single: "",
      lastHuman: "",
      lastHumanWho: "",
      clarity: null,
      sureness: null,
      shared: [],
      otherNotes: "",
    },
    submitted: false,
    savedOk: false,
    resumed: false,
  };
}

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  let fieldValue = null;
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "value" && (tag === "textarea" || tag === "input")) {
      fieldValue = value;
      continue;
    }
    if (key === "checked") {
      node.checked = true;
      continue;
    }
    if (key === "class") node.className = value;
    else if (key === "htmlFor") node.htmlFor = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  if (fieldValue != null) node.value = String(fieldValue);
  return node;
}

function paras(lines) {
  return lines.filter(Boolean).map((line) => h("p", {}, line));
}

function prose(...lines) {
  return h("div", { class: "prose" }, paras(lines));
}

function labelOf(pairs, id) {
  const found = pairs.find(([key]) => key === id);
  return found ? found[1] : "";
}

function save() {
  sessionStorage.setItem(STORAGE, JSON.stringify(state));
}

function goto(step) {
  state.step = step;
  state.formError = "";
  save();
  render();
  window.scrollTo(0, 0);
}

function where() {
  return null;
}

function flag(name) {
  return h("img", { class: "flag", src: "flag-" + name + ".svg", alt: "" });
}

function parties() {
  return h("section", { class: "parties", "aria-label": "The parties" }, [
    h("p", { class: "parties-label" }, "The parties"),
    h("ul", {}, [
      h("li", {}, [flag("araknes"), h("span", {}, "Araknes")]),
      h("li", {}, [flag("lei"), h("span", {}, "Lei")]),
    ]),
  ]);
}

function oracle(lines, options = {}) {
  const readout = options.confidence == null ? null : h("p", { class: "readout" }, [
    h("span", { class: "readout-label" }, "Confidence"),
    h("span", { class: "figure" }, [
      String(options.confidence),
      h("span", { class: "unit" }, "%"),
    ]),
  ]);
  return h("figure", { class: "shot" }, [
    h("figcaption", {}, "From the screen that night"),
    h("aside", { class: "oracle", "aria-label": "ORACLE" }, [
      h("div", { class: "oracle-chrome" }, [
        h("span", { class: "mark", "aria-hidden": "true" }),
        h("p", { class: "oracle-name" }, "ORACLE"),
      ]),
      h("div", { class: "oracle-body" }, [
        options.prompt ? h("div", { class: "human" }, [
          h("p", { class: "who" }, "Officials"),
          h("p", {}, options.prompt),
        ]) : null,
        h("div", { class: "turn" }, [
          h("span", { class: "mark", "aria-hidden": "true" }),
          h("div", { class: "turn-copy" }, [
            h("p", { class: "model-name" }, "ORACLE"),
            h("div", { class: "model-out" }, paras(lines)),
            readout,
          ]),
        ]),
      ]),
    ]),
  ]);
}

function spread(main, side) {
  return h("div", { class: "spread" }, [
    h("div", { class: "spread-main" }, main),
    h("div", { class: "spread-side" }, side),
  ]);
}

const BEAT_ALT = {
  route: "Satellite still of the lane. Araknes is on the left, Lei on the right. A tanker is marked damaged. Araknes says Lei meant to disrupt trade. Lei says an old mine, or a breakdown.",
  advice: "The same lane. The tanker is still damaged. A mark shows Araknes asking ORACLE for advice.",
  upgrade: "The same lane. Watch rings sit along the route. ORACLE is on the watch.",
  second: "Next day, 01:50. A second ship, closer to Lei, has no contact. ORACLE reads 62 percent that Lei may target shipping.",
  acts: "The measures. A warning goes out, patrols enter the lane, talks with Lei are frozen, and a Lei-linked ship is marked for inspection.",
  lei: "Later that morning. Lei naval forces are moving towards the route. The tanker is still marked damaged.",
};

let satMarkup = "";

function plotBoard(beat) {
  const alt = BEAT_ALT[beat] || BEAT_ALT.route;
  const figure = h("figure", { class: "plot" });
  if (!satMarkup) {
    figure.append(h("img", { class: "sat", src: "route-sat.svg", alt }));
    return figure;
  }
  const parsed = new DOMParser().parseFromString(satMarkup, "image/svg+xml");
  const svg = parsed.querySelector("svg");
  if (!svg || parsed.querySelector("parsererror")) {
    figure.append(h("img", { class: "sat", src: "route-sat.svg", alt }));
    return figure;
  }
  svg.setAttribute("class", "sat");
  svg.dataset.beat = beat;
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", alt);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && svg.pauseAnimations) {
    svg.pauseAnimations();
  }
  figure.append(svg);
  return figure;
}

// Draft voice. The class-page sentences live in consent().
function consent() {
  return h("section", { class: "welcome" }, [
    h("img", { class: "uga-logo", src: "uga-logo.png", alt: "University of Georgia", width: "1024", height: "158" }),
    h("p", { class: "draft-mark" }, "Draft"),
    h("h1", { class: "question" }, "INTL 6010, Research Methods"),
    h("p", { class: "byline" }, "A project by Tobyn Smith"),
    prose(
      "This will take about fifteen minutes to complete, and by clicking 'Start', you agree that I can save your choices and inquiry answers for this project.",
      "Please don't use your real name and answer truthfully!"
    ),
    h("p", { class: "reach" }, [
      "Any questions or issues, reach out to ",
      h("a", { href: "mailto:tobynsmith@uga.edu" }, "tobynsmith@uga.edu"),
      ".",
    ]),
    state.formError ? h("p", { class: "error" }, state.formError) : null,
    h("button", { class: "primary", type: "button", onClick: begin }, "Start"),
  ]);
}

function begin() {
  const saved = loadSaved();
  if (saved && saved.sessionId && (saved.step === "night" || saved.step === "inquiry")) {
    state = blank();
    state.step = "landing";
    render();
    window.scrollTo(0, 0);
    return;
  }
  startNight();
}

async function startNight() {
  state.formError = "";
  state.step = "waiting";
  save();
  render();
  try {
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) throw new Error("start");
    const data = await response.json();
    state.sessionId = data.session_id;
    state.condition = "sequence";
    state.forced = false;
    state.startedAt = data.started_at;
    state.participantCode = data.session_id;
    state.scene = 0;
    goto("night");
  } catch {
    sessionStorage.removeItem(STORAGE);
    state = blank();
    state.formError = "The file did not open. Stay on this page and try again.";
    render();
  }
}

function landing() {
  const saved = loadSaved();
  return h("section", { class: "cover" }, [
    h("h1", { class: "question" }, "This browser already has a file open."),
    h("div", {}, [
      h("button", {
        class: "primary",
        type: "button",
        onClick: () => {
          state = saved;
          if (state.step === "night" && !(state.scene >= 0 && state.scene < SCENES.length)) state.scene = 0;
          render();
          window.scrollTo(0, 0);
        },
      }, "Return to that file"),
      h("button", {
        class: "secondary",
        type: "button",
        onClick: () => {
          sessionStorage.removeItem(STORAGE);
          state = blank();
          startNight();
        },
      }, "Open a new file"),
    ]),
  ]);
}

function waiting() {
  return h("section", {}, prose("Opening the file."));
}

function chain(steps) {
  return h("ol", { class: "chain" }, steps.map((step) => h("li", {}, step)));
}

function shiftScene(delta) {
  const next = state.scene + delta;
  if (next < 0 || next >= SCENES.length) return;
  state.scene = next;
  save();
  render();
  window.scrollTo(0, 0);
}

function night() {
  const scene = SCENES[state.scene] || SCENES[0];
  const last = state.scene >= SCENES.length - 1;
  const copy = [
    scene.chain ? chain(scene.chain) : null,
    prose(...scene.lines),
    h("div", { class: "film-controls" }, [
      state.scene > 0
        ? h("button", { class: "secondary", type: "button", onClick: () => shiftScene(-1) }, "Back")
        : null,
      last
        ? h("button", { class: "primary", type: "button", onClick: () => goto("inquiry") }, "Open the inquiry")
        : h("button", { class: "secondary", type: "button", onClick: () => shiftScene(1) }, "Next"),
    ]),
  ];
  const side = scene.oracle
    ? oracle(scene.oracle.lines, {
      role: scene.oracle.role,
      prompt: scene.oracle.prompt,
      confidence: scene.oracle.confidence,
    })
    : null;
  return h("section", { class: "film" }, [
    plotBoard(scene.beat),
    side ? spread(copy, side) : h("div", {}, copy),
  ]);
}

function accountReady(text) {
  return (text || "").trim().length >= 20;
}

function fileLines() {
  return [
    "Officials asked ORACLE for advice, and chose whether to act.",
    "ORACLE was then upgraded, and could act without a person reviewing each step.",
    "After a second ship lost contact, ORACLE's read was 62%.",
    "It issued the warning, the patrols, the freeze, and the inspections.",
    "Lei moved naval forces towards the route.",
  ];
}

function qhead(n, text) {
  return h("span", { class: "qhead" }, [
    h("span", { class: "num" }, n + "."),
    " " + text,
  ]);
}

function scale(name, current) {
  return h("div", { class: "scale" }, [1, 2, 3, 4, 5].map((n) => h("label", {}, [
    String(n),
    h("input", { type: "radio", name, value: String(n), checked: Number(current) === n }),
  ])));
}

function inquiry() {
  const q = state.inquiry;
  const open = accountReady(q.account);
  return h("section", {}, [
    where(),
    spread(
      [
        prose(
          "The night is over. This is the inquiry.",
          "Officials set the agenda. ORACLE picked the action and carried it out. Who was accountable?"
        ),
        h("form", {
      onSubmit: onInquiry,
      onInput: (event) => {
        const wasOpen = accountReady(state.inquiry.account);
        const caret = event.target && event.target.id === "account" ? event.target.selectionStart : null;
        syncInquiry(event.currentTarget);
        save();
        const nowOpen = accountReady(state.inquiry.account);
        const human = event.target && event.target.name === "last_human";
        if (!human && wasOpen === nowOpen) return;
        render();
        if (caret != null) {
          const box = document.querySelector("#account");
          if (box) {
            box.focus();
            box.setSelectionRange(caret, caret);
          }
        }
      },
    }, [
      h("div", { class: "field" }, [
        h("label", { htmlFor: "code" }, "Participant code, if you were given one"),
        h("input", {
          id: "code",
          name: "code",
          type: "text",
          autocomplete: "off",
          maxlength: "40",
          value: state.participantCode && state.participantCode !== state.sessionId ? state.participantCode : "",
        }),
      ]),
      h("div", { class: "ask" }, [
        h("label", { htmlFor: "account" }, qhead(1, "Who was responsible for what Araknes did?")),
        h("textarea", { id: "account", name: "account", value: q.account }),
      ]),
      open ? h("fieldset", {}, [
        h("legend", {}, qhead(2, "Name one actor, or say you can't.")),
        ...ACTORS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "single", value: id, checked: q.single === id }),
          h("span", {}, text),
        ])),
        h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "single", value: "none", checked: q.single === "none" }),
          h("span", {}, "I can't point to one actor"),
        ]),
      ]) : null,
      open ? h("fieldset", {}, [
        h("legend", {}, qhead(3, "Could a person still have stopped this?")),
        ...[
          ["yes", "Yes"],
          ["no", "No"],
          ["unsure", "I'm not sure"],
        ].map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "last_human", value: id, checked: q.lastHuman === id }),
          h("span", {}, text),
        ])),
        q.lastHuman === "yes" || q.lastHuman === "unsure"
          ? h("div", { class: "field" }, [
            h("label", { htmlFor: "who" }, "Who?"),
            h("input", { id: "who", name: "last_human_who", type: "text", value: q.lastHumanWho }),
          ])
          : null,
      ]) : null,
      open ? h("fieldset", {}, [
        h("legend", {}, qhead(4, "How clear was it who was responsible?")),
        scale("clarity", q.clarity),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · not clear"),
          h("span", {}, "5 · clear"),
        ]),
      ]) : null,
      open ? h("fieldset", {}, [
        h("legend", {}, qhead(5, "How sure are you?")),
        scale("sureness", q.sureness),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · guessing"),
          h("span", {}, "5 · sure"),
        ]),
      ]) : null,
      open && state.formError ? h("p", { class: "error" }, state.formError) : null,
      open ? h("button", { class: "primary", type: "submit" }, "File the finding") : null,
    ]),
      ],
      h("div", { class: "file" }, [
        h("p", { class: "label" }, "The file"),
        h("ul", {}, fileLines().map((line) => h("li", {}, line))),
      ])
    ),
  ]);
}

function syncInquiry(form) {
  const data = new FormData(form);
  const q = state.inquiry;
  q.account = data.get("account") || "";
  if (form.querySelector('input[name="single"]')) {
    q.single = data.get("single") || "";
    q.lastHuman = data.get("last_human") || "";
    q.lastHumanWho = q.lastHuman === "no" ? "" : (data.get("last_human_who") || "");
    q.clarity = data.get("clarity") ? Number(data.get("clarity")) : null;
    q.sureness = data.get("sureness") ? Number(data.get("sureness")) : null;
  }
  q.shared = data.getAll("shared");
  q.otherNotes = data.get("other_notes") || "";
  const code = (data.get("code") || "").trim();
  state.participantCode = code || state.sessionId || "";
}

function inquiryProblems() {
  const q = state.inquiry;
  if (q.account.trim().length < 20) return "Write a sentence or two.";
  if (!q.single) return "Name one actor, or say you can't point to one.";
  if (!q.lastHuman) return "Say whether a person could still have stopped this.";
  if (q.lastHuman !== "no" && q.lastHumanWho.trim().length < 2) return "Say who you have in mind.";
  if (!q.clarity) return "Mark how clear it was.";
  if (!q.sureness) return "Mark how sure you are.";
  return "";
}

async function onInquiry(event) {
  event.preventDefault();
  syncInquiry(event.target);
  const problem = inquiryProblems();
  if (problem) {
    state.formError = problem;
    save();
    render();
    return;
  }
  const button = event.target.querySelector("button");
  button.disabled = true;
  const payload = payloadFromState();
  state.savedOk = await postFinding(payload);
  state.submitted = true;
  if (state.savedOk) localStorage.removeItem("oracle-unsent-" + state.sessionId);
  else localStorage.setItem("oracle-unsent-" + state.sessionId, JSON.stringify(payload));
  goto("debrief");
}

async function postFinding(payload) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) return true;
    } catch {
      /* The class link can blink while the host answers. One more try. */
    }
  }
  return false;
}

async function sendAgain() {
  const payload = payloadFromState();
  state.savedOk = await postFinding(payload);
  if (state.savedOk) localStorage.removeItem("oracle-unsent-" + state.sessionId);
  else localStorage.setItem("oracle-unsent-" + state.sessionId, JSON.stringify(payload));
  save();
  render();
}

function payloadFromState() {
  return {
    participant_code: state.participantCode,
    condition: "sequence",
    forced_condition: false,
    goal: "",
    confidence_bar: null,
    preauthorised: ["assess", "monitor", "warning", "patrols", "freeze", "inspections"],
    first_decision: "",
    authorised: ["warning", "patrols", "freeze", "inspections"],
    stopped: [],
    final_actions: ["warning", "patrols", "freeze", "inspections"],
    outcome: "escalated",
    harm: true,
    injury: false,
    inquiry: {
      account: state.inquiry.account,
      single: state.inquiry.single,
      last_human: state.inquiry.lastHuman,
      last_human_who: state.inquiry.lastHumanWho,
      clarity: state.inquiry.clarity,
      sureness: state.inquiry.sureness,
      shared: state.inquiry.shared,
      other_notes: state.inquiry.otherNotes,
    },
    started_at: state.startedAt,
    submitted_at: new Date().toISOString(),
    session_id: state.sessionId,
  };
}

function debrief() {
  const saved = state.savedOk
    ? "The finding is on the file."
    : "The finding did not reach the register. Send it again. If it still will not go, download a copy and email it to tobynsmith@uga.edu.";
  const actor = state.inquiry.single === "none"
    ? "You could not point to one actor."
    : "You named: " + (labelOf(ACTORS, state.inquiry.single) || "your answer") + ".";
  return h("section", { class: "column" }, [
    where(),
    prose(
      saved,
      "You watched the night. Then you sat the inquiry.",
      "I think it gets harder to name one responsible person once officials set the agenda and ORACLE picks what to do and does it. It might not. If the rules were fixed in advance, the chain can stay clear. This file is one go at that.",
      actor,
      "You can close this."
    ),
    state.savedOk ? null : h("button", { class: "primary", type: "button", onClick: sendAgain }, "Send the finding again"),
    h("button", { class: "secondary", type: "button", onClick: downloadCopy }, "Download a copy of my finding"),
    h("p", { class: "colophon" }, "Tobyn Smith · INTL 6010 · University of Georgia"),
  ]);
}

function downloadCopy() {
  const blob = new Blob([JSON.stringify(payloadFromState(), null, 2)], { type: "application/json" });
  const link = h("a", {
    href: URL.createObjectURL(blob),
    download: (state.participantCode || "answers") + ".json",
  });
  document.body.append(link);
  link.click();
  link.remove();
}

const screens = {
  consent,
  landing,
  waiting,
  night,
  inquiry,
  debrief,
};

function paintChrome() {
  const mast = document.querySelector("#mast");
  const rail = document.querySelector("#rail");
  const banner = document.querySelector(".commission");
  const inquiry = state.step === "inquiry" || state.step === "debrief";
  document.body.dataset.step = state.step;
  if (banner) banner.textContent = "Commission of Inquiry";
  const scene = SCENES[state.scene] || SCENES[0];
  const pair = state.step === "night"
    ? [scene.title, scene.when]
    : inquiry
      ? ["The inquiry", ""]
      : ["The night", ""];
  if (mast) {
    const bits = [h("p", { class: "doc" }, pair[0])];
    if (pair[1]) bits.push(h("p", { class: "when" }, pair[1]));
    mast.replaceChildren(...bits);
  }
  if (rail) rail.setAttribute("aria-label", state.step === "night" ? "The night" : "Index to the file");
  if (!rail) return;
  const items = state.step === "night"
    ? SCENES.map((item, index) => h("li", {
      class: index === state.scene ? "now" : index < state.scene ? "done" : "",
    }, item.rail))
    : [
      h("li", { class: "done" }, "The night"),
      h("li", { class: inquiry ? "now" : "" }, "The inquiry"),
    ];
  rail.replaceChildren(h("ol", {}, items));
}

function render() {
  const before = document.querySelector("#before");
  const site = document.querySelector(".site");
  document.body.dataset.step = state.step;
  const inquiry = state.step === "inquiry" || state.step === "debrief";
  document.title = state.step === "consent"
    ? "INTL 6010 · Research Methods"
    : inquiry
      ? "File 26-441 · Araknes Commission of Inquiry"
      : "The night";
  if (state.step === "consent") {
    if (before) {
      before.hidden = false;
      before.replaceChildren(consent());
    }
    if (site) site.hidden = true;
    return;
  }
  if (before) before.hidden = true;
  if (site) site.hidden = false;
  const screen = screens[state.step] || landing;
  app.replaceChildren(screen());
  paintChrome();
}

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const KNOWN = new Set(["consent", "landing", "waiting", "night", "inquiry", "debrief"]);
const existing = loadSaved();
if (existing && existing.sessionId && existing.step && existing.step !== "consent" && existing.step !== "waiting") {
  if (!KNOWN.has(existing.step)) {
    existing.step = "night";
    existing.scene = 0;
  }
  state = existing;
  if (!state.inquiry) state.inquiry = blank().inquiry;
  if (state.step === "night" && !(state.scene >= 0 && state.scene < SCENES.length)) state.scene = 0;
}
try {
  satMarkup = await (await fetch("route-sat.svg")).text();
} catch {
  satMarkup = "";
}
render();
