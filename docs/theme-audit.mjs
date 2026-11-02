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

  const blankInquiry = { account: "", single: "", lastHuman: "", lastHumanWho: "", clarity: null, sureness: null, shared: [], otherNotes: "" };
  const session = {
    sessionId: "aaaaaaaaaaaaaaaa",
    participantCode: "",
    condition: "sequence",
    forced: false,
    startedAt: new Date().toISOString(),
    scene: 0,
    formError: "",
    inquiry: blankInquiry,
    submitted: false,
    savedOk: false,
    resumed: false,
  };

  async function prep() {
    await page.evaluate(() => document.documentElement.classList.add("on-pages-preview"));
  }

  async function waitMotion() {
    await page.evaluate(async () => {
      const animations = document.getAnimations ? document.getAnimations() : [];
      await Promise.all(animations.map((a) => a.finished.catch(() => {})));
    });
    await page.waitForTimeout(60);
  }

  async function boot(step, extra) {
    await page.evaluate((payload) => {
      sessionStorage.setItem("oracle-wargame", JSON.stringify(payload));
      document.documentElement.classList.add("on-pages-preview");
    }, { ...session, step, ...extra });
    await page.reload();
    await prep();
    await waitMotion();
  }

  async function measure(screen, w, h, zoom) {
    await waitMotion();
    return page.evaluate(({ screen, w, h, zoom }) => {
      const issues = [];

      function lum(color) {
        const m = String(color).match(/[\d.]+/g);
        if (!m || m.length < 3) return 0;
        const s = m.slice(0, 3).map((n) => {
          const x = Number(n) / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
      }
      function contrast(fg, bg) {
        const a = lum(fg);
        const b = lum(bg);
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        return (hi + 0.05) / (lo + 0.05);
      }

      function scroller() {
        const site = document.querySelector(".site");
        if (site && getComputedStyle(site).overflowY === "auto") return site;
        return document.scrollingElement || document.documentElement;
      }

      function setScroll(node, y) {
        if (node === document.scrollingElement || node === document.documentElement) {
          window.scrollTo(0, y);
        } else {
          node.scrollTop = y;
        }
      }

      function maxScroll(node) {
        if (node === document.scrollingElement || node === document.documentElement) {
          return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        }
        return Math.max(0, node.scrollHeight - node.clientHeight);
      }

      function clipOf(node) {
        if (node === document.scrollingElement || node === document.documentElement) {
          return { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
        }
        const r = node.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }

      const bar = document.querySelector("#step-bar");
      const barOn = bar && !bar.hidden && getComputedStyle(bar).display !== "none";
      const barRect = barOn ? bar.getBoundingClientRect() : null;
      const root = scroller();

      function checkBar(where) {
        if (!barOn || !barRect) return;
        const clip = clipOf(root);
        const nodes = document.querySelectorAll(
          "p, li, label, legend, h1, button, .qhead, .reach, .figure, .oracle-role, .model-out, figcaption, .byline, .sat"
        );
        nodes.forEach((el) => {
          if (el.closest("#step-bar")) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || Number(cs.opacity) < 0.2) return;
          const vis = {
            top: Math.max(r.top, clip.top),
            bottom: Math.min(r.bottom, clip.bottom),
            left: Math.max(r.left, clip.left),
            right: Math.min(r.right, clip.right),
          };
          if (vis.bottom - vis.top < 2 || vis.right - vis.left < 2) return;
          const ix = Math.min(vis.right, barRect.right) - Math.max(vis.left, barRect.left);
          const iy = Math.min(vis.bottom, barRect.bottom) - Math.max(vis.top, barRect.top);
          if (ix > 3 && iy > 3) {
            const text = (el.textContent || el.getAttribute("aria-label") || el.className || "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 48);
            issues.push("behind-bar-" + where + ":" + text);
          }
        });
      }

      if (document.documentElement.scrollWidth > window.innerWidth + 2) {
        issues.push("horizontal-scroll " + document.documentElement.scrollWidth + ">" + window.innerWidth);
      }

      const textNodes = document.querySelectorAll(
        "p, li, label, legend, h1, button, .qhead, .reach, .figure, .oracle-role, .model-out, figcaption, .byline"
      );
      textNodes.forEach((el) => {
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
      });

      setScroll(root, 0);
      checkBar("scroll0");
      setScroll(root, maxScroll(root));
      checkBar("max");
      setScroll(root, 0);

      const sat = document.querySelector(".sat");
      if (sat) {
        const r = sat.getBoundingClientRect();
        if (r.width > 8 && r.height > 8) {
          const ratio = r.width / r.height;
          if (Math.abs(ratio - 1200 / 560) > 0.08) issues.push("map-ratio:" + ratio.toFixed(3));
          if (r.width < 140) issues.push("map-too-small:" + Math.round(r.width));
        }
      }

      const oracle = document.querySelector(".oracle");
      if (oracle) {
        const bg = getComputedStyle(oracle).backgroundColor;
        oracle.querySelectorAll("p, .oracle-name, .oracle-role, .figure, .readout-label").forEach((el) => {
          const ratio = contrast(getComputedStyle(el).color, bg);
          if (ratio < 4.5) {
            const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 32);
            issues.push("contrast:" + ratio.toFixed(2) + ":" + text);
          }
        });
      }

      return { screen, w, h, zoom, issues };
    }, { screen, w, h, zoom });
  }

  async function setView(w, h, zoom) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate((z) => {
      document.documentElement.classList.add("on-pages-preview");
      document.documentElement.style.zoom = String(z);
      const site = document.querySelector(".site");
      if (site) site.scrollTop = 0;
      window.scrollTo(0, 0);
    }, zoom);
    await waitMotion();
  }

  async function record(screen, w, h, zoom) {
    results.push(await measure(screen, w, h, zoom));
  }

  await page.goto("http://127.0.0.1:8000/?audit=1");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await prep();
  await page.waitForSelector(".welcome .question");
  await waitMotion();

  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("intro", w, h, zoom);
    }
  }

  await boot("landing");
  await page.waitForSelector(".cover");
  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("landing", w, h, zoom);
    }
  }

  const nightNames = ["route", "advice", "upgrade", "second", "acts", "lei"];
  for (let i = 0; i < nightNames.length; i++) {
    await boot("night", { scene: i });
    await page.waitForSelector(".film");
    for (const [w, h] of sizes) {
      for (const zoom of zooms) {
        await setView(w, h, zoom);
        await record("night-" + nightNames[i], w, h, zoom);
      }
    }
  }

  await boot("inquiry");
  await page.waitForSelector(".inquiry-form");
  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("inquiry", w, h, zoom);
    }
  }

  await boot("debrief", {
    submitted: true,
    savedOk: true,
    inquiry: { ...blankInquiry, single: "oracle", lastHuman: "no", account: "Officials set the agenda.", clarity: 3, sureness: 4 },
  });
  await page.waitForSelector(".debrief");
  for (const [w, h] of sizes) {
    for (const zoom of zooms) {
      await setView(w, h, zoom);
      await record("debrief", w, h, zoom);
    }
  }

  return results;
}
