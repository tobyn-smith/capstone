async (page) => {
  const sizes = [
    [1440, 900],
    [1280, 720],
    [1024, 640],
    [768, 1024],
    [390, 844],
    [360, 640],
  ];
  const zooms = [1, 1.25];
  const results = [];

  async function prep() {
    await page.evaluate(() => {
      document.documentElement.classList.add("on-pages-preview");
    });
  }

  async function measure(screen, w, h, zoom) {
    return page.evaluate(({ screen, w, h, zoom }) => {
      const issues = [];
      const doc = document.documentElement;
      if (doc.scrollWidth > window.innerWidth + 2) {
        issues.push("horizontal-scroll " + doc.scrollWidth + ">" + window.innerWidth);
      }
      const bar = document.querySelector("#step-bar");
      const barOn = bar && !bar.hidden && getComputedStyle(bar).display !== "none";
      const barTop = barOn ? bar.getBoundingClientRect().top : window.innerHeight;
      const nodes = document.querySelectorAll(
        "p, li, label, legend, h1, button, .qhead, .reach, .figure, .oracle-role, .model-out, figcaption, .byline"
      );
      nodes.forEach((el) => {
        if (el.closest("#step-bar")) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 48);
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") return;
        if (r.right > window.innerWidth + 3) issues.push("overflow-x:" + text);
        if (r.left < -3) issues.push("overflow-left:" + text);
        if (el.scrollHeight > el.clientHeight + 3 && cs.overflow !== "visible") {
          issues.push("clipped-text:" + text);
        }
        if (r.width < 72 && (el.textContent || "").indexOf(" ") === -1 && (el.textContent || "").trim().length > 10) {
          issues.push("narrow-unbroken:" + text);
        }
        if (barOn && r.top < barTop && r.bottom > barTop + 3 && r.bottom <= window.innerHeight + 1) {
          issues.push("behind-bar:" + text);
        }
      });
      if (barOn) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.max(0, max));
        const barTop2 = bar.getBoundingClientRect().top;
        const lastBits = document.querySelectorAll(".oracle, .model-out, .readout, .inquiry-form, .file, .debrief, .film-copy");
        lastBits.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.height < 2) return;
          if (r.bottom > barTop2 + 6 && r.top < barTop2) {
            issues.push("still-behind-after-scroll:" + (el.className || el.tagName));
          }
        });
        window.scrollTo(0, 0);
      }
      const boxes = [];
      nodes.forEach((el) => {
        if (el.closest("#step-bar")) return;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;
        boxes.push({ el, r });
      });
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
          if (ix > 6 && iy > 6) {
            const ta = (a.el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28);
            const tb = (b.el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28);
            issues.push("overlap:" + ta + "|" + tb);
          }
        }
      }
      const sat = document.querySelector(".sat");
      if (sat) {
        const r = sat.getBoundingClientRect();
        if (r.width > 8 && r.height > 8) {
          const ratio = r.width / r.height;
          if (Math.abs(ratio - 1200 / 560) > 0.08) {
            issues.push("map-ratio:" + ratio.toFixed(3));
          }
          if (r.width < 140) issues.push("map-too-small:" + Math.round(r.width));
        }
      }
      const oracle = document.querySelector(".oracle");
      if (oracle && barOn) {
        const r = oracle.getBoundingClientRect();
        const maxY = window.scrollY + r.bottom;
        const reach = document.documentElement.scrollHeight;
        const limit = reach - (window.innerHeight - barTop) + 4;
        if (r.bottom > barTop + 3 && maxY > limit + 20) {
          issues.push("oracle-unscrollable");
        }
        const read = oracle.querySelector(".readout, .figure");
        if (read) {
          const rr = read.getBoundingClientRect();
          if (rr.bottom > barTop + 3 && rr.top < barTop) issues.push("confidence-behind-bar");
        }
      }
      const root = document.querySelector(".welcome, .cover, .film, .inquiry-board, .debrief, #app");
      if (root && barOn) {
        const last = root.getBoundingClientRect();
        const can = document.documentElement.scrollHeight - window.innerHeight;
        const need = last.bottom + window.scrollY - barTop + 8;
        if (need > can + 24) issues.push("content-unscrollable");
      }
      return { screen, w, h, zoom, issues };
    }, { screen, w, h, zoom });
  }

  async function setView(w, h, zoom) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate((z) => {
      document.documentElement.classList.add("on-pages-preview");
      document.documentElement.style.zoom = String(z);
      window.scrollTo(0, 0);
    }, zoom);
    await page.waitForTimeout(80);
  }

  async function record(screen, w, h, zoom) {
    const row = await measure(screen, w, h, zoom);
    results.push(row);
  }

  await page.goto("http://127.0.0.1:8000/?audit=1");
  await page.evaluate(() => {
    sessionStorage.clear();
    document.documentElement.classList.add("on-pages-preview");
  });
  await page.reload();
  await page.evaluate(() => document.documentElement.classList.add("on-pages-preview"));
  await prep();
  await page.waitForSelector(".welcome .question");

  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("intro", w, h, zoom);
    }
  }

  await page.evaluate(() => {
    sessionStorage.setItem("oracle-wargame", JSON.stringify({
      step: "night",
      sessionId: "aaaaaaaaaaaaaaaa",
      participantCode: "",
      condition: "sequence",
      forced: false,
      startedAt: new Date().toISOString(),
      scene: 0,
      formError: "",
      inquiry: { account: "", single: "", lastHuman: "", lastHumanWho: "", clarity: null, sureness: null, shared: [], otherNotes: "" },
      submitted: false,
      savedOk: false,
      resumed: false,
    }));
  });
  await page.reload();
  await page.waitForSelector(".welcome, .film");
  await prep();
  if (await page.locator(".welcome .primary").count()) {
    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForSelector(".cover, .film");
  }
  await prep();
  if (await page.locator(".cover").count()) {
    for (const [w, h] of sizes) {
      for (const zoom of zooms) {
        await setView(w, h, zoom);
        await record("landing", w, h, zoom);
      }
    }
    await page.getByRole("button", { name: "Return to that file" }).click();
  }

  await page.waitForSelector(".film");
  const nightNames = ["route", "advice", "upgrade", "second", "acts", "lei"];
  for (let i = 0; i < nightNames.length; i++) {
    if (i > 0) {
      await page.locator("#step-next").click();
      await page.waitForTimeout(120);
    }
    await prep();
    for (const [w, h] of sizes) {
      for (const zoom of zooms) {
        await setView(w, h, zoom);
        await record("night-" + nightNames[i], w, h, zoom);
      }
    }
  }

  await page.locator("#step-next").click();
  await page.waitForSelector(".inquiry-form");
  await prep();
  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("inquiry", w, h, zoom);
    }
  }

  await page.evaluate(() => {
    const account = document.querySelector("#account");
    if (account) account.value = "Officials set the agenda and ORACLE carried out the action.";
    [["single", "oracle"], ["last_human", "no"], ["clarity", "3"], ["sureness", "4"]].forEach(([n, v]) => {
      const el = document.querySelector(`input[name="${n}"][value="${v}"]`);
      if (el) el.checked = true;
    });
    const form = document.querySelector(".inquiry-form");
    if (form) form.dispatchEvent(new Event("input", { bubbles: true }));
    const next = document.querySelector("#step-next");
    if (next) next.click();
  });
  await page.waitForSelector(".debrief", { timeout: 8000 });
  await prep();
  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("debrief", w, h, zoom);
    }
  }

  return results;
}
