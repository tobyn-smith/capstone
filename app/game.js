import {
  actionsFromDelegation,
  applyCountermand,
  needsHold,
  resolveOutcome,
  STOPPABLE,
} from "./rules.js";

const STORAGE = "oracle-wargame";
const app = document.querySelector("#app");

const GOALS = [
  ["find", "Find out what happened to the tanker before Araknes takes a public step"],
  ["route", "Keep the shipping route open and safe"],
  ["deter", "Deter Lei from any further disruption"],
  ["stay", "Stay out of a dispute between Araknes and Lei"],
];

const MEASURES = [
  ["assess", "Keep assessing the intelligence as it comes in"],
  ["monitor", "Monitor shipping in the lane"],
  ["warning", "Issue an allied maritime warning"],
  ["patrols", "Send naval patrols into the area"],
  ["freeze", "Freeze diplomatic channels with Lei"],
  ["inspections", "Authorise inspections of Lei-linked vessels"],
];

const BARS = [
  ["40", "40%. It may act on a weak read."],
  ["60", "60%. It may act when it is more sure than not, but a real doubt can remain."],
  ["80", "80%. It waits unless it is sure."],
];

const FIRST = [
  ["messages", "Send a private message to Lei, increase surveillance, and hold the navy where it is"],
  ["facts", "Say publicly that the facts are not settled yet, and increase surveillance"],
  ["blame", "Say publicly that Lei is responsible, and ask allies for support"],
  ["quiet", "Do not message Lei tonight. Leave the routine watch as it is"],
];

const PACKAGES = [
  ["watch", "Keep watching. None of those four.", []],
  ["warning", "The warning only", ["warning"]],
  ["patrols", "The warning and the patrols", ["warning", "patrols"]],
  ["boardings", "The warning, the patrols, and the inspections", ["warning", "patrols", "inspections"]],
  ["full", "The full set: warning, patrols, a diplomatic freeze, and inspections", ["warning", "patrols", "freeze", "inspections"]],
];

const SHORT = {
  assess: "assessing the intelligence",
  monitor: "monitoring the lane",
  warning: "the allied maritime warning",
  patrols: "naval patrols in the lane",
  freeze: "the freeze on diplomatic channels with Lei",
  inspections: "inspections of Lei-linked vessels",
};

const ACTORS = [
  ["me", "The duty officer (me, for this night)"],
  ["government", "The Araknes government that deployed ORACLE"],
  ["supervisor", "The human supervisor assigned to ORACLE"],
  ["developer", "The developer that built ORACLE"],
  ["provider", "The provider that ran the infrastructure"],
  ["oracle", "ORACLE"],
];

let state = blank();

function blank() {
  return {
    step: "consent",
    sessionId: null,
    participantCode: "",
    condition: null,
    forced: false,
    startedAt: null,
    goal: null,
    preauthorised: [],
    confidenceBar: null,
    firstDecision: null,
    authorised: [],
    stopped: [],
    finalActions: [],
    outcome: null,
    harm: null,
    injury: null,
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

function phraseList(parts) {
  const clean = parts.filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return clean[0] + " and " + clean[1];
  return clean.slice(0, -1).join(", ") + ", and " + clean[clean.length - 1];
}

function save() {
  sessionStorage.setItem(STORAGE, JSON.stringify(state));
}

let openTimer = 0;

function goto(step) {
  window.clearTimeout(openTimer);
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
  const role = options.role || "For the duty officer";
  const readout = options.confidence == null ? null : h("div", { class: "readout" }, [
    h("p", { class: "readout-label" }, "Confidence"),
    h("p", { class: "figure" }, [
      String(options.confidence),
      h("span", { class: "unit" }, "%"),
    ]),
    h("div", { class: "meter" }, [
      h("span", { style: "--fill:" + options.confidence + "%" }),
    ]),
  ]);
  return h("figure", { class: "shot" }, [
    h("figcaption", {}, "From the screen that night"),
    h("aside", { class: "oracle", "aria-label": "ORACLE" }, [
      h("div", { class: "oracle-chrome" }, [
        h("span", { class: "dots", "aria-hidden": "true" }, [h("i"), h("i"), h("i")]),
        h("p", { class: "oracle-name" }, "ORACLE"),
        h("p", { class: "oracle-role" }, role),
      ]),
      h("div", { class: "oracle-body" }, [
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
    h("p", { class: "shot-note" }, "You cannot reply to it."),
  ]);
}

function spread(main, side) {
  return h("div", { class: "spread" }, [
    h("div", { class: "spread-main" }, main),
    h("div", { class: "spread-side" }, side),
  ]);
}

function choiceButton(text, onClick, index) {
  return h("button", { class: "choice", type: "button", onClick }, [
    h("span", { class: "let" }, String.fromCharCode(65 + index)),
    h("span", {}, text),
  ]);
}

function situation() {
  return [
    "A tanker was damaged on a route that Araknes and Lei both use.",
    "Araknes says Lei did it on purpose, to disrupt trade. Lei says no. It may have been an old mine, or the ship may have broken down.",
    "The reporting does not show which.",
  ];
}

function consent() {
  return h("section", { class: "column" }, [
    h("p", { class: "dateline" }, "University of Georgia"),
    h("h1", { class: "question" }, "INTL 6010, Research Methods"),
    prose(
      "I am Tobyn Smith. This is for my research methods class.",
      "You go through one night, and then you write what you think. About fifteen minutes.",
      "By starting, you agree that I can save your choices and your inquiry answers for this project.",
      "Do not use your real name."
    ),
    h("button", { class: "primary", type: "button", onClick: () => goto("landing") }, "Start"),
  ]);
}

function landing() {
  const saved = loadSaved();
  const resume = saved && saved.sessionId && saved.step && saved.step !== "landing" && saved.step !== "debrief";
  return h("section", {}, [
    where(),
    spread(
      [
        h("h1", { class: "question" }, "Who was responsible for what Araknes did after a tanker was damaged on the route with Lei?"),
        prose(
          "You go through the night as it happened, and then you write what you think. About fifteen minutes.",
          "Araknes and Lei are made up."
        ),
        resume
          ? h("div", {}, [
              h("p", {}, "This browser already has a file open."),
              h("button", {
                class: "primary",
                type: "button",
                onClick: () => {
                  state = saved;
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
                  render();
                },
              }, "Open a new file"),
            ])
          : null,
        h("form", { class: "open", onSubmit: onBegin }, [
          h("div", { class: "field" }, [
            h("label", { htmlFor: "code" }, "Participant code, if you were given one"),
            h("input", { id: "code", name: "code", type: "text", autocomplete: "off", maxlength: "40" }),
          ]),
          h("p", { class: "muted" }, "Leave the code blank if you were not given one. Do not use your real name."),
          state.formError ? h("p", { class: "error" }, state.formError) : null,
          h("button", { class: "primary", type: "submit" }, "Open the file"),
        ]),
      ],
      parties()
    ),
  ]);
}

async function onBegin(event) {
  event.preventDefault();
  const code = (new FormData(event.target).get("code") || "").trim();
  const params = new URLSearchParams(location.search);
  const forced = params.get("condition");
  const body = {};
  if (forced === "advice" || forced === "agent") body.condition = forced;
  try {
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("start");
    const data = await response.json();
    state.sessionId = data.session_id;
    state.condition = data.condition;
    state.forced = Boolean(data.forced_condition);
    state.startedAt = data.started_at;
    state.participantCode = code || data.session_id;
    goto("opening");
  } catch {
    state.formError = "The file did not open. Use the address from the server window, then try again.";
    render();
  }
}

function opening() {
  window.clearTimeout(openTimer);
  openTimer = window.setTimeout(() => {
    if (state.step === "opening") goto("briefing");
  }, 4200);
  return h("section", { class: "opening" }, [
    h("p", { class: "opening-kicker" }, "The record"),
    h("h1", { class: "opening-file" }, "File 26-441"),
    h("ul", { class: "opening-parties", "aria-label": "The parties" }, [
      h("li", {}, [flag("araknes"), h("span", {}, "Araknes")]),
      h("li", { class: "opening-rule", "aria-hidden": "true" }),
      h("li", {}, [flag("lei"), h("span", {}, "Lei")]),
    ]),
    h("p", { class: "opening-line" }, "Araknes and Lei. A tanker was damaged on the route between them, and this file is that night."),
    h("button", {
      class: "primary",
      type: "button",
      onClick: () => goto("briefing"),
    }, "Open the warrant"),
  ]);
}

function briefing() {
  const tail = state.condition === "agent"
    ? [
        "On this file the duty officer did not sign off each step. ORACLE can keep working when the room is empty, and it can carry out what was allowed ahead of time.",
        "You set the goal, tick what it may do without asking, and set how sure it needs to be. In the morning you see what it did. You can still stop a patrol or an inspection that has not gone out. Then you write what you think. You are not there to defend the night.",
      ]
    : [
        "ORACLE gives advice on this file. It does not take the decision. You are sitting the night the duty officer sat.",
        "A warning, once it has gone, cannot be pulled back. After the morning, you write what you think.",
      ];
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, [
          h("p", { class: "dateline" }, "The situation"),
          ...paras(situation()),
          ...paras(tail),
        ]),
        h("button", {
          class: "primary",
          type: "button",
          onClick: () => goto(state.condition === "agent" ? "setup" : "move1"),
        }, "Open the night"),
      ],
      parties()
    ),
  ]);
}

function setup() {
  return h("section", {}, [
    where(),
    spread(
      h("form", { onSubmit: onSetup, onInput: onSetupInput }, [
      h("fieldset", {}, [
        h("legend", {}, "What goal is ORACLE working towards?"),
        ...GOALS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "goal", value: id, checked: state.goal === id }),
          h("span", {}, text),
        ])),
      ]),
      h("fieldset", {}, [
        h("legend", {}, "What may ORACLE do without coming back to you?"),
        h("p", { class: "muted" }, "Tick what you will let it do without coming back. Leave a box empty and it will not do that. Tick nothing, and it cannot act for you."),
        ...MEASURES.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", {
            type: "checkbox",
            name: "measure",
            value: id,
            checked: state.preauthorised.includes(id),
          }),
          h("span", {}, text),
        ])),
      ]),
      h("fieldset", {}, [
        h("legend", {}, "How sure does ORACLE need to be before it acts on its own?"),
        h("p", { class: "muted" }, "You will not see how sure it was until afterwards. If that number is at or above the bar, ORACLE does every measure you ticked. If it is under the bar, it only watches, and only where you ticked a watching task."),
        ...BARS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", {
            type: "radio",
            name: "bar",
            value: id,
            checked: String(state.confidenceBar) === id,
          }),
          h("span", {}, text),
        ])),
      ]),
      state.formError ? h("p", { class: "error" }, state.formError) : null,
      h("button", { class: "primary", type: "submit" }, "Confirm, and leave ORACLE running"),
    ]),
      oracle([
        "I will stay on the watch. I will only act inside the goal, the list, and the bar, and I will not come back tonight.",
      ], { role: "On the watch" })
    ),
  ]);
}

function onSetupInput(event) {
  const data = new FormData(event.currentTarget);
  state.goal = data.get("goal") || null;
  state.confidenceBar = data.get("bar") ? Number(data.get("bar")) : null;
  state.preauthorised = data.getAll("measure");
  save();
}

function onSetup(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.goal = data.get("goal") || null;
  state.confidenceBar = data.get("bar") ? Number(data.get("bar")) : null;
  state.preauthorised = data.getAll("measure");
  if (!state.goal || state.confidenceBar == null) {
    state.formError = "Choose a goal, and choose how sure ORACLE needs to be.";
    save();
    render();
    return;
  }
  state.authorised = actionsFromDelegation(state.preauthorised, state.confidenceBar);
  state.stopped = [];
  goto("overnight");
}

function overnight() {
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, paras([
          "You leave the watch with ORACLE. You are not asked to approve the next step.",
          "If the read is at or above the bar you just set, ORACLE carries out what you ticked. If it is under, it does not.",
          "Overnight, a second ship loses contact on the same stretch of water. The log is there in the morning.",
        ])),
        h("button", { class: "primary", type: "button", onClick: () => goto("log") }, "Open the log"),
      ],
      oracle(["The watch stays open until morning."], { role: "Overnight" })
    ),
  ]);
}

function actionStatus(id, taken) {
  const happened = taken.includes(id);
  if (!happened) return "Not taken.";
  if (id === "warning") return "Sent. You cannot unsend it.";
  if (id === "freeze") return "The instruction has gone to posts. You cannot undo it tonight.";
  if (id === "patrols") return "Not in the lane yet. You can recall them.";
  if (id === "inspections") return "Not started. You can stop them.";
  return "Done.";
}

function canStop() {
  return state.authorised.some((id) => STOPPABLE.includes(id));
}

function holdFields() {
  const stoppable = state.authorised.filter((id) => STOPPABLE.includes(id));
  if (!stoppable.length) return [];
  return [
    h("fieldset", {}, [
      h("legend", {}, "What do you want to stop?"),
      h("p", { class: "muted" }, "Leave these unticked if you want the rest to stand."),
      ...stoppable.map((id) => h("label", { class: "tick" }, [
        h("input", {
          type: "checkbox",
          name: "stop",
          value: id,
          checked: state.stopped.includes(id),
        }),
        h("span", {}, id === "patrols" ? "Recall the patrols" : "Stop the inspections"),
      ])),
    ]),
  ];
}

function log() {
  const further = ["warning", "patrols", "freeze", "inspections"];
  const wanted = state.preauthorised.filter((id) => further.includes(id));
  const took = wanted.filter((id) => state.authorised.includes(id));
  const decision = !wanted.length
    ? "You did not pre-authorise a measure beyond watching, so ORACLE does not take one."
    : took.length
      ? "62% meets the bar you set. ORACLE is carrying out the measures you pre-authorised."
      : "62% is below the bar you set. ORACLE is not taking the further measures.";
  const lines = [
    "01:40  A second vessel loses contact.",
    "01:55  Confidence that Lei is preparing to target commercial shipping: 62%.",
    "01:56  Bar set by you: " + state.confidenceBar + "%.",
    "01:57  " + decision,
  ];
  const watched = state.preauthorised.length ? state.preauthorised : [];
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, paras([
          canStop()
            ? "The log is in. A patrol or an inspection can still be stopped."
            : "The log is in. Nothing that has gone out can be pulled back.",
        ])),
        h("form", { onSubmit: onHold }, [
          ...holdFields(),
          state.formError ? h("p", { class: "error" }, state.formError) : null,
          h("button", { class: "primary", type: "submit" }, canStop() ? "This is my decision" : "Continue to the morning report"),
        ]),
      ],
      oracle([
        ...lines,
        "Goal on the file: " + labelOf(GOALS, state.goal),
        ...watched.map((id) => labelOf(MEASURES, id) + " — " + actionStatus(id, state.authorised)),
      ], { role: "Night log", confidence: 62 })
    ),
  ]);
}

function hold() {
  const rows = state.authorised.map((id) => labelOf(MEASURES, id) + ". " + actionStatus(id, state.authorised));
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, [
          h("p", { class: "dateline" }, "Twenty minutes later"),
          ...paras([
            canStop()
              ? "Here is what has already left the building, and what you can still stop."
              : "Here is what has already left the building. You cannot pull it back tonight.",
          ]),
        ]),
        h("form", { onSubmit: onHold }, [
          ...holdFields(),
          h("button", { class: "primary", type: "submit" }, canStop() ? "This is my decision" : "Continue to the morning report"),
        ]),
      ],
      h("div", { class: "log" }, rows.map((row) => h("p", {}, row)))
    ),
  ]);
}

function onHold(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  state.stopped = data.getAll("stop").filter((id) => state.authorised.includes(id) && STOPPABLE.includes(id));
  finishCrisis();
}

function finishCrisis() {
  state.finalActions = applyCountermand(state.authorised, state.stopped);
  const result = resolveOutcome(
    state.finalActions,
    state.condition === "advice" ? state.firstDecision : null
  );
  state.outcome = result.outcome;
  state.harm = result.harm;
  state.injury = result.injury;
  goto("morning");
}

function move1() {
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, [
          h("p", { class: "dateline" }, "06:40 · The tanker"),
          ...paras([
            "The tanker is still out there. Lei has asked Araknes to stay out of it. At home, people want something said in public.",
            "Our own people still cannot tell a mine from a breakdown, or from something done on purpose.",
          ]),
        ]),
        h("h2", {}, "What do you do?"),
        ...FIRST.map(([id, text], index) => choiceButton(text, () => {
          state.firstDecision = id;
          goto("move2");
        }, index)),
      ],
      oracle([
        "I cannot confirm that Lei meant to disrupt the route. An old mine, and a mechanical failure, are both still open.",
        "Recommendation: send a private message to Lei, increase surveillance of the route, and hold Araknes's naval forces where they are.",
        "A public statement blaming Lei would run ahead of the reporting we have.",
      ], { role: "Recommendation" })
    ),
  ]);
}

function afterFirst() {
  const lead = {
    messages: "The private message goes to Lei. They are not reassured.",
    facts: "You say in public that the facts are not settled. That pleases nobody.",
    blame: "You say in public that Lei did it. Lei takes that badly.",
    quiet: "You leave the usual watch in place. At home, people ask why Araknes has said nothing.",
  }[state.firstDecision];
  return lead + " Through the day, the watch picks up more military radio traffic from both sides. It does not show a mine, and it does not show a clean mechanical cause. Late that night, a second commercial ship loses contact on the same stretch of water.";
}

function move2() {
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "sitrep" }, [
          h("p", { class: "dateline" }, "01:50 · The second ship"),
          ...paras([afterFirst()]),
        ]),
        h("h2", {}, "What do you authorise?"),
        ...PACKAGES.map(([id, text, actions], index) => choiceButton(text, () => {
          state.authorised = [...actions];
          state.stopped = [];
          if (needsHold(state.authorised)) goto("hold");
          else finishCrisis();
        }, index)),
      ],
      oracle([
        "The second ship going quiet could mean Lei is getting ready to hit shipping. It could also be a breakdown, or an old mine.",
        "My confidence that Lei is preparing to target shipping is 62%.",
        "If you act on that, the measures are a maritime warning, patrols, a freeze on talks with Lei, and inspections of Lei-linked ships. I cannot say which of those will look right in the morning.",
      ], { role: "Second ship", confidence: 62 })
    ),
  ]);
}

function morningText() {
  const found = "By morning, the second ship has been found adrift. The early evidence points to a mechanical failure, not a deliberate attack.";
  const set = new Set(state.finalActions);
  if (state.outcome === "escalated") {
    const bits = [];
    if (set.has("inspections")) bits.push(SHORT.inspections);
    if (set.has("patrols")) bits.push(SHORT.patrols);
    if (set.has("freeze")) bits.push(SHORT.freeze);
    let text = "Lei treats " + phraseList(bits) + " as an attempt to restrict its access to international waters, and moves naval forces towards the route.";
    text += state.injury
      ? " During the first inspection of a Lei-linked vessel, a crew member is injured."
      : " There is no boarding.";
    if (state.firstDecision === "blame") {
      text += " Lei had already objected to the public statement that blamed Lei.";
    }
    return text + " " + found + " The 62% read did not hold up.";
  }
  if (state.outcome === "political") {
    const parts = [];
    if (set.has("warning")) parts.push("Lei protests the maritime warning.");
    if (state.firstDecision === "blame") parts.push("Lei protests the public statement that blamed Lei.");
    return parts.join(" ") + " It does not move forces. " + found;
  }
  return found + " At home, people are angry that Araknes did not press the accusation. No Araknes patrol entered the lane, and no inspection took place.";
}

function morning() {
  const word = state.harm ? "Escalated" : "No clash";
  return h("section", {}, [
    where(),
    spread(
      [
        h("div", { class: "morning sitrep" }, [
          h("p", { class: "dateline" }, "Morning report"),
          ...paras([morningText()]),
        ]),
        h("button", { class: "primary", type: "button", onClick: () => goto("inquiry") }, "Write the finding"),
      ],
      h("aside", { class: "signal" }, [
        h("p", { class: "parties-label" }, "Morning signal"),
        h("p", { class: "signal-word" }, word),
      ])
    ),
  ]);
}

function fileLines() {
  const standing = state.finalActions.length
    ? phraseList(state.finalActions.map((id) => SHORT[id]))
    : "no Araknes measure beyond the watch";
  const lines = [];
  if (state.condition === "advice") {
    lines.push("You took the decisions yourself, after reading ORACLE.");
    lines.push("First decision: " + labelOf(FIRST, state.firstDecision));
  } else {
    lines.push("Goal on the file: " + labelOf(GOALS, state.goal));
    lines.push("Bar you set: " + state.confidenceBar + "%. ORACLE's read was 62%.");
    lines.push(
      "Pre-authorised: " +
        (state.preauthorised.length
          ? phraseList(state.preauthorised.map((id) => SHORT[id]))
          : "nothing")
    );
  }
  lines.push("Still standing: " + standing);
  if (state.stopped.length) {
    lines.push("You stopped: " + phraseList(state.stopped.map((id) => SHORT[id])));
  }
  return lines;
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
  const prompt = state.harm
    ? "What do you think went wrong?"
    : "The morning report does not show a clash. What, if anything, still concerns you about how Araknes handled this?";
  return h("section", {}, [
    where(),
    spread(
      [
        prose(
          "The night is over. The warrant asks who was responsible for what Araknes did.",
          "Write what you think. You are not here to defend the night."
        ),
        h("form", {
      onSubmit: onInquiry,
      onInput: (event) => {
        syncInquiry(event.currentTarget);
        save();
      },
    }, [
      h("div", { class: "ask" }, [
        h("label", { htmlFor: "account" }, qhead(1, prompt)),
        h("textarea", { id: "account", name: "account", value: q.account }),
      ]),
      h("fieldset", {}, [
        h("legend", {}, qhead(2, "If you had to name one actor as responsible for what Araknes did, who would it be?")),
        ...ACTORS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "single", value: id, checked: q.single === id }),
          h("span", {}, text),
        ])),
        h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "single", value: "none", checked: q.single === "none" }),
          h("span", {}, "I can't point to one actor"),
        ]),
      ]),
      h("fieldset", {}, [
        h("legend", {}, qhead(3, "Was there a last human who could have stopped what happened?")),
        ...[
          ["yes", "Yes"],
          ["no", "No"],
          ["unsure", "I'm not sure"],
        ].map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "radio", name: "last_human", value: id, checked: q.lastHuman === id }),
          h("span", {}, text),
        ])),
        h("label", { htmlFor: "who" }, "If yes, or if you are not sure, who?"),
        h("input", { id: "who", name: "last_human_who", type: "text", value: q.lastHumanWho }),
      ]),
      h("fieldset", {}, [
        h("legend", {}, qhead(4, "How clear was the chain of responsibility?")),
        scale("clarity", q.clarity),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · not clear at all"),
          h("span", {}, "5 · clear enough to name one actor"),
        ]),
      ]),
      h("fieldset", {}, [
        h("legend", {}, qhead(5, "How sure are you of your answer on who is responsible?")),
        scale("sureness", q.sureness),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · guessing"),
          h("span", {}, "5 · sure"),
        ]),
      ]),
      h("fieldset", {}, [
        h("legend", {}, qhead(6, "Who else shares some of the responsibility?")),
        h("p", { class: "muted" }, "Tick any that apply. Leave this blank if you think it sits with one actor only."),
        ...ACTORS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "checkbox", name: "shared", value: id, checked: q.shared.includes(id) }),
          h("span", {}, text),
        ])),
      ]),
      h("div", { class: "ask" }, [
        h("label", { htmlFor: "notes" }, qhead(7, "Anything else you want on the file? You can leave this blank.")),
        h("textarea", { id: "notes", name: "other_notes", value: q.otherNotes }),
      ]),
      state.formError ? h("p", { class: "error" }, state.formError) : null,
      h("button", { class: "primary", type: "submit" }, "File the finding"),
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
  q.single = data.get("single") || "";
  q.lastHuman = data.get("last_human") || "";
  q.lastHumanWho = data.get("last_human_who") || "";
  q.clarity = data.get("clarity") ? Number(data.get("clarity")) : null;
  q.sureness = data.get("sureness") ? Number(data.get("sureness")) : null;
  q.shared = data.getAll("shared");
  q.otherNotes = data.get("other_notes") || "";
}

function inquiryProblems() {
  const q = state.inquiry;
  if (q.account.trim().length < 20) return "Write a few sentences on what you think happened.";
  if (!q.single) return "Name one actor, or say you can't point to one.";
  if (!q.lastHuman) return "Say whether there was a last human who could have stopped this.";
  if (q.lastHuman !== "no" && q.lastHumanWho.trim().length < 2) return "If there was a last human, or you are not sure, say who you have in mind.";
  if (!q.clarity) return "Mark how clear the chain of responsibility was.";
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
  try {
    const response = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.savedOk = response.ok;
  } catch {
    state.savedOk = false;
  }
  state.submitted = true;
  if (!state.savedOk) localStorage.setItem("oracle-unsent-" + state.sessionId, JSON.stringify(payload));
  goto("debrief");
}

function payloadFromState() {
  return {
    participant_code: state.participantCode,
    condition: state.condition,
    forced_condition: state.forced,
    goal: state.goal || "",
    confidence_bar: state.confidenceBar,
    preauthorised: state.preauthorised,
    first_decision: state.firstDecision || "",
    authorised: state.authorised,
    stopped: state.stopped,
    final_actions: state.finalActions,
    outcome: state.outcome,
    harm: state.harm,
    injury: state.injury,
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
  const version = state.condition === "advice"
    ? "ORACLE recommended, and you decided."
    : "you set the goal and the limits, and ORACLE could act without asking each time.";
  const saved = state.savedOk
    ? "The finding is on the file."
    : "The finding did not reach the register. Download a copy below and send it back, or it stays only on this browser.";
  const actor = state.inquiry.single === "none"
    ? "You could not point to one actor."
    : "You named: " + (labelOf(ACTORS, state.inquiry.single) || "your answer") + ".";
  return h("section", { class: "column" }, [
    where(),
    prose(
      saved,
      "You had the version where " + version,
      "There are two versions of this night. In one, ORACLE recommends and you decide. In the other, you set a goal and a bar, and ORACLE can act.",
      "I think the second one makes it harder to name one person who was responsible. It might not. The goal, the list, and the log might be enough to keep that clear. This file is one go at that. If later files come out the same way, I can be more sure. If they do not, I have to change my mind. I am not asking what Araknes should have done.",
      actor + " You rated how clear the chain was: " + state.inquiry.clarity + " out of 5.",
      "You can close the file."
    ),
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
  opening,
  briefing,
  setup,
  move1,
  move2,
  overnight,
  log,
  hold,
  morning,
  inquiry,
  debrief,
};

const RAIL = [
  ["Terms", ["landing", "opening", "briefing"]],
  ["Record", ["setup", "move1", "move2", "overnight", "log", "hold"]],
  ["Morning", ["morning"]],
  ["Finding", ["inquiry", "debrief"]],
];

const MAST = {
  landing: ["Terms of reference", "Opened"],
  opening: ["The record", "Opening"],
  briefing: ["Warrant", "06:10"],
  setup: ["Delegation", "18:00"],
  move1: ["Cable", "06:40"],
  move2: ["Cable", "01:50"],
  overnight: ["Note to file", "02:00"],
  log: ["Night log", "07:10"],
  hold: ["Minute", "02:10"],
  morning: ["Morning signal", "Morning"],
  inquiry: ["Finding", ""],
  debrief: ["File noted", ""],
};

function paintChrome() {
  const mast = document.querySelector("#mast");
  const rail = document.querySelector("#rail");
  document.body.dataset.step = state.step;
  const pair = MAST[state.step] || ["File", ""];
  if (mast) {
    const bits = [h("p", { class: "doc" }, pair[0])];
    if (pair[1]) bits.push(h("p", { class: "when" }, pair[1]));
    mast.replaceChildren(...bits);
  }
  if (!rail) return;
  const items = RAIL.map(([label]) => {
    const stage = RAIL.findIndex((entry) => entry[1].includes(state.step));
    const mine = RAIL.findIndex((entry) => entry[0] === label);
    const cls = mine === stage ? "now" : mine < stage ? "done" : "";
    return h("li", { class: cls }, label);
  });
  rail.replaceChildren(h("ol", {}, items));
}

function render() {
  const before = document.querySelector("#before");
  const site = document.querySelector(".site");
  document.body.dataset.step = state.step;
  document.title = state.step === "consent"
    ? "INTL 6010 · Research Methods"
    : "File 26-441 · Araknes Commission of Inquiry";
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

const existing = loadSaved();
if (existing && existing.step && existing.step !== "landing") {
  state = existing;
}
render();
