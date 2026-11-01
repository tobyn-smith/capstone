async (page) => {
  const out = "/workspace/docs/theme-shots/";
  async function prep() {
    await page.evaluate(() => document.documentElement.classList.add("on-pages-preview"));
  }
  async function shot(name, w, h) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => {
      document.documentElement.classList.add("on-pages-preview");
      document.documentElement.style.zoom = "1";
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(180);
    await page.screenshot({ path: out + name + ".png", fullPage: false });
  }
  const night = {
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
  };

  await page.goto("http://127.0.0.1:8000/");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await prep();
  await page.waitForSelector(".welcome .question");
  await shot("desktop-consent", 1440, 900);
  await shot("phone-consent", 390, 844);

  await page.evaluate((saved) => sessionStorage.setItem("oracle-wargame", JSON.stringify(saved)), { ...night, step: "landing" });
  await page.reload();
  await prep();
  await page.waitForSelector(".cover");
  await shot("desktop-landing", 1440, 900);
  await shot("phone-landing", 390, 844);

  const nights = [["route", 0], ["advice", 1], ["upgrade", 2], ["second", 3], ["acts", 4], ["lei", 5]];
  for (const [name, scene] of nights) {
    await page.evaluate((payload) => sessionStorage.setItem("oracle-wargame", JSON.stringify(payload)), { ...night, scene });
    await page.reload();
    await prep();
    await page.waitForSelector(".film");
    await shot("desktop-night-" + name, 1440, 900);
    if (name === "route" || name === "advice") await shot("phone-night-" + name, 390, 844);
  }

  await page.evaluate((payload) => sessionStorage.setItem("oracle-wargame", JSON.stringify(payload)), { ...night, step: "inquiry" });
  await page.reload();
  await prep();
  await page.waitForSelector(".inquiry-form");
  await shot("desktop-inquiry", 1440, 900);
  await shot("phone-inquiry", 390, 844);

  await page.evaluate((payload) => sessionStorage.setItem("oracle-wargame", JSON.stringify({
    ...payload,
    step: "debrief",
    submitted: true,
    savedOk: true,
    inquiry: { ...payload.inquiry, single: "oracle", lastHuman: "no", account: "Officials set the agenda.", clarity: 3, sureness: 4 },
  })), night);
  await page.reload();
  await prep();
  await page.waitForSelector(".debrief");
  await shot("desktop-debrief", 1440, 900);
  await shot("phone-debrief", 390, 844);
  return "ok";
}
