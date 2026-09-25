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
  ["find", "Find out what happened to the tanker before Asterra takes a public step"],
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
  ["messages", "Send private messages to both capitals, increase surveillance, and hold the navy where it is"],
  ["facts", "Say publicly that the facts are not settled yet, and increase surveillance"],
  ["blame", "Say publicly that Lei is responsible, and ask allies for support"],
  ["quiet", "Do not message either capital tonight. Leave the routine watch as it is"],
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
  ["me", "Me, the official in this exercise"],
  ["government", "The Asterra government that deployed ORACLE"],
  ["supervisor", "The human supervisor assigned to ORACLE"],
  ["developer", "The developer that built ORACLE"],
  ["provider", "The provider that ran the infrastructure"],
  ["oracle", "ORACLE"],
];

let state = blank();

function blank() {
  return {
    step: "landing",
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

function goto(step) {
  state.step = step;
  state.formError = "";
  save();
  render();
  window.scrollTo(0, 0);
}

function where() {
  const names = {
    briefing: "Briefing",
    setup: "The crisis",
    move1: "The crisis",
    move2: "The crisis",
    overnight: "The crisis",
    log: "The crisis",
    hold: "The crisis",
    morning: "The crisis",
    inquiry: "Inquiry",
    debrief: "Done",
  };
  return names[state.step] ? h("p", { class: "where" }, names[state.step]) : null;
}

function choiceButton(text, onClick) {
  return h("button", { class: "choice", type: "button", onClick }, text);
}

function situation() {
  return [
    "A commercial tanker has been damaged on a shipping route that both Araknes and Lei use. Asterra has an interest in the route as well.",
    "Araknes says Lei damaged the ship on purpose, to disrupt trade. Lei denies that. Lei says the tanker may have hit an old mine, or that it broke down.",
    "The intelligence does not settle it. Neither side can show exactly what happened.",
  ];
}

function landing() {
  const saved = loadSaved();
  const resume = saved && saved.sessionId && saved.step && saved.step !== "landing" && saved.step !== "debrief";
  return h("section", {}, [
    where(),
    prose(
      "A short scenario wargame. You play a senior official in Asterra, a fictional government, during a crisis at sea. An AI system called ORACLE is part of it. At the end, an inquiry asks who is responsible.",
      "It takes about fifteen minutes. You do not need any specialist knowledge. There is no right answer."
    ),
    resume
      ? h("div", {}, [
          h("p", {}, "You already started a game on this browser."),
          h("button", {
            class: "primary",
            type: "button",
            onClick: () => {
              state = saved;
              render();
              window.scrollTo(0, 0);
            },
          }, "Continue that game"),
          h("button", {
            class: "secondary",
            type: "button",
            onClick: () => {
              sessionStorage.removeItem(STORAGE);
              state = blank();
              render();
            },
          }, "Start again instead"),
        ])
      : null,
    h("form", { onSubmit: onBegin }, [
      h("label", { htmlFor: "code" }, "Participant code, if you were given one"),
      h("p", {}, h("input", { id: "code", name: "code", type: "text", autocomplete: "off", maxlength: "40" })),
      h("p", { class: "muted" }, "By starting, you agree I can save your choices and your inquiry answers for this project. Leave the code blank if you were not given one. Do not use your real name."),
      state.formError ? h("p", { class: "error" }, state.formError) : null,
      h("button", { class: "primary", type: "submit" }, "Begin"),
    ]),
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
    goto("briefing");
  } catch {
    state.formError = "I could not start the game. Open it from the running server, then try again.";
    render();
  }
}

function briefing() {
  const tail = state.condition === "agent"
    ? [
        "You are the senior official Asterra has put on this. ORACLE is not only there to give advice. It is a persistent set of agents. It can keep working when you are not in the room, and it can carry out measures you have allowed in advance, without asking you each time.",
        "Before the night runs on, you will set the goal, tick what ORACLE may do without coming back to you, and set how confident it needs to be before it acts. You will get one later look at what it has done, and a chance to stop what has not already gone out.",
      ]
    : [
        "You are the senior official Asterra has put on this. ORACLE is the system your department can consult. You can read its recommendation. It does not act. You do.",
        "You will have a few decisions. Some steps, once taken, cannot be pulled back straight away. Then there is an inquiry.",
      ];
  return h("section", {}, [
    where(),
    h("div", { class: "sitrep" }, [
      h("p", { class: "dateline" }, "The situation"),
      ...paras(situation()),
      ...paras(tail),
    ]),
    h("button", {
      class: "primary",
      type: "button",
      onClick: () => goto(state.condition === "agent" ? "setup" : "move1"),
    }, "Continue"),
  ]);
}

function setup() {
  return h("section", {}, [
    where(),
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
        h("p", { class: "muted" }, "Tick every measure you are willing to let it take on its own. Anything you do not tick, it will not do. If you tick nothing, it cannot take a measure for you."),
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
        h("p", { class: "muted" }, "You will not see the confidence score until afterwards. If the score meets the bar you set here, ORACLE carries out every measure you ticked. If it falls short, ORACLE does not take those measures. It only keeps watching, and only where you ticked a watching task."),
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
    h("div", { class: "sitrep" }, paras([
      "You leave the watch with ORACLE.",
      "You are not asked to approve the next step. If the read meets the bar you just set, ORACLE will carry out what you ticked. If it falls short, it will not.",
      "Overnight, a second commercial ship loses contact on the same stretch of water. The log is waiting in the morning.",
    ])),
    h("button", { class: "primary", type: "button", onClick: () => goto("log") }, "Open the log"),
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
    h("div", { class: "log" }, [
      h("p", { class: "label" }, "ORACLE log"),
      ...lines.map((line) => h("p", {}, line)),
      h("p", {}, "Goal on the file: " + labelOf(GOALS, state.goal)),
      ...watched.map((id) => h("p", {}, labelOf(MEASURES, id) + " — " + actionStatus(id, state.authorised))),
    ]),
    h("form", { onSubmit: onHold }, [
      ...holdFields(),
      state.formError ? h("p", { class: "error" }, state.formError) : null,
      h("button", { class: "primary", type: "submit" }, needsHold(state.authorised) ? "This is my decision" : "Continue to the morning report"),
    ]),
  ]);
}

function hold() {
  const rows = state.authorised.map((id) => labelOf(MEASURES, id) + ". " + actionStatus(id, state.authorised));
  return h("section", {}, [
    where(),
    h("div", { class: "sitrep" }, [
      h("p", { class: "dateline" }, "Twenty minutes later"),
      ...paras([
        "Here is what has already left the building, and what you can still stop.",
      ]),
    ]),
    h("div", { class: "log" }, rows.map((row) => h("p", {}, row))),
    h("form", { onSubmit: onHold }, [
      ...holdFields(),
      h("button", { class: "primary", type: "submit" }, "This is my decision"),
    ]),
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
    h("div", { class: "sitrep" }, [
      h("p", { class: "dateline" }, "06:40 · The tanker"),
      ...paras([
        "The tanker is still in the water. Araknes has asked Asterra to say something publicly. Lei has asked Asterra to stay out of it.",
        "Your own people cannot yet tell a mine strike from a mechanical failure, or from something done on purpose.",
      ]),
    ]),
    h("aside", { class: "cable" }, [
      h("p", { class: "label" }, "ORACLE"),
      ...paras([
        "I cannot confirm that Lei meant to disrupt the route. An old mine, and a mechanical failure, are both still open.",
        "Recommendation: send private messages to both capitals, increase surveillance of the route, and hold Asterra's naval forces where they are.",
        "A public statement taking Araknes's side would run ahead of the reporting we have.",
      ]),
    ]),
    h("h2", {}, "What do you do?"),
    ...FIRST.map(([id, text]) => choiceButton(text, () => {
      state.firstDecision = id;
      goto("move2");
    })),
  ]);
}

function afterFirst() {
  const lead = {
    messages: "The private messages go out. Neither capital sounds reassured.",
    facts: "Your public statement, that the facts are not settled, satisfies neither capital.",
    blame: "Your statement lands badly in Lei. Araknes treats it as Asterra taking its side.",
    quiet: "You leave the routine watch in place. Araknes asks again, publicly, why Asterra has said nothing.",
  }[state.firstDecision];
  return lead + " Through the day, the watch picks up more military radio traffic from both sides. It does not show a mine, and it does not show a clean mechanical cause. Late that night, a second commercial ship loses contact on the same stretch of water.";
}

function move2() {
  return h("section", {}, [
    where(),
    h("div", { class: "sitrep" }, [
      h("p", { class: "dateline" }, "01:50 · The second ship"),
      ...paras([afterFirst()]),
    ]),
    h("aside", { class: "cable" }, [
      h("p", { class: "label" }, "ORACLE"),
      ...paras([
        "The second loss of contact fits Lei preparing to target commercial shipping. It also fits a mechanical failure, and it fits an old mine.",
        "My confidence that Lei is preparing to target shipping is 62%.",
        "If you want to act on that read, the measures would be an allied maritime warning, naval patrols in the area, a freeze on diplomatic channels with Lei, and inspections of Lei-linked vessels. I cannot tell you which of those the morning will justify.",
      ]),
    ]),
    h("h2", {}, "What do you authorise?"),
    ...PACKAGES.map(([id, text, actions]) => choiceButton(text, () => {
      state.authorised = [...actions];
      state.stopped = [];
      if (needsHold(state.authorised)) goto("hold");
      else finishCrisis();
    })),
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
      text += " Lei had already objected to the public statement that took Araknes's side.";
    }
    return text + " " + found + " The 62% read did not hold up.";
  }
  if (state.outcome === "political") {
    const parts = [];
    if (set.has("warning")) parts.push("Lei protests the maritime warning.");
    if (state.firstDecision === "blame") parts.push("Lei protests the public statement that took Araknes's side.");
    return parts.join(" ") + " It does not move forces. " + found;
  }
  return found + " Araknes is angry that Asterra did not take the accusation more seriously. No Asterra patrol entered the lane, and no inspection took place.";
}

function morning() {
  return h("section", {}, [
    where(),
    h("div", { class: "morning sitrep" }, [
      h("p", { class: "dateline" }, "Morning report"),
      ...paras([morningText()]),
    ]),
    h("button", { class: "primary", type: "button", onClick: () => goto("inquiry") }, "The inquiry is ready"),
  ]);
}

function fileLines() {
  const standing = state.finalActions.length
    ? phraseList(state.finalActions.map((id) => SHORT[id]))
    : "no Asterra measure beyond the watch";
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
    : "The morning report does not show a clash. What, if anything, still concerns you about how Asterra handled this?";
  return h("section", {}, [
    where(),
    prose(
      "You are still the official. A short inquiry now has to answer one question. When something is done in a case like this, who is responsible?",
      "Answer as yourself. There is no line you are meant to take."
    ),
    h("div", { class: "file" }, [
      h("p", { class: "label" }, "The file"),
      h("ul", {}, fileLines().map((line) => h("li", {}, line))),
    ]),
    h("form", {
      onSubmit: onInquiry,
      onInput: (event) => {
        syncInquiry(event.currentTarget);
        save();
      },
    }, [
      h("div", { class: "ask" }, [
        h("label", { htmlFor: "account" }, prompt),
        h("textarea", { id: "account", name: "account", value: q.account }),
      ]),
      h("fieldset", {}, [
        h("legend", {}, "If you had to name one actor as responsible for what Asterra did, who would it be?"),
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
        h("legend", {}, "Was there a last human who could have stopped what happened?"),
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
        h("legend", {}, "How clear was the chain of responsibility?"),
        scale("clarity", q.clarity),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · not clear at all"),
          h("span", {}, "5 · clear enough to name one actor"),
        ]),
      ]),
      h("fieldset", {}, [
        h("legend", {}, "How sure are you of your answer on who is responsible?"),
        scale("sureness", q.sureness),
        h("p", { class: "ends" }, [
          h("span", {}, "1 · guessing"),
          h("span", {}, "5 · sure"),
        ]),
      ]),
      h("fieldset", {}, [
        h("legend", {}, "Who else shares some of the responsibility?"),
        h("p", { class: "muted" }, "Tick any that apply. Leave this blank if you think it sits with one actor only."),
        ...ACTORS.map(([id, text]) => h("label", { class: "tick" }, [
          h("input", { type: "checkbox", name: "shared", value: id, checked: q.shared.includes(id) }),
          h("span", {}, text),
        ])),
      ]),
      h("div", { class: "ask" }, [
        h("label", { htmlFor: "notes" }, "Anything else the inquiry should have on the file? This can be blank."),
        h("textarea", { id: "notes", name: "other_notes", value: q.otherNotes }),
      ]),
      state.formError ? h("p", { class: "error" }, state.formError) : null,
      h("button", { class: "primary", type: "submit" }, "Send this to the inquiry"),
    ]),
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
  if (q.account.trim().length < 20) return "Write a few sentences on what the inquiry needs to understand.";
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
    ? "Thank you. Your answers are saved for the project."
    : "Thank you. The project file did not get your answers. Download a copy below and send it back, or this play stays only on this browser.";
  const actor = state.inquiry.single === "none"
    ? "You said you could not point to one actor."
    : "You named: " + (labelOf(ACTORS, state.inquiry.single) || "your answer") + ".";
  return h("section", {}, [
    where(),
    prose(
      saved,
      "You were in the version where " + version,
      "There is another version of this same crisis. In one, a person asks and decides. In the other, a person sets a goal and the system can act. I want to see whether that changes how easy it is to say who is responsible.",
      actor + " You rated how clear the chain was: " + state.inquiry.clarity + " out of 5.",
      "You can close this page."
    ),
    h("button", { class: "secondary", type: "button", onClick: downloadCopy }, "Download a copy of my answers"),
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
  landing,
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

function render() {
  const screen = screens[state.step] || landing;
  app.replaceChildren(screen());
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
