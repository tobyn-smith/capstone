# Readings to design features

Reviewer note only. Not participant-facing. Not paper prose.

Mapped 31 Oct 2026 from:

- `tobyn-smith/presentations` `main` (shallow clone) and PR 5 branch `ts/reading-discussion-weeks-930d` at `0902131`
- week files in `readings/`
- Tobyn's talk file `project/methods-accountability.js` (notes from his 30 Oct draft)
- this repo's working note `who-answers-when-it-goes-wrong.md`

No page numbers are added unless the presentations file already prints them. Items not found in those sources are marked **unverified**.

## What those files already cover

| Source in presentations | What the file itself says | Pages / edition |
| --- | --- | --- |
| `readings/geddes-1990.js` | Barbara Geddes, *How the Cases You Choose Affect the Answers You Get*, IGS Working Paper 90-13 (1990). Selecting on the outcome you already care about can change the answer. | No page numbers in the file. |
| `readings/kellstedt-whitten.js` | Paul M. Kellstedt and Guy D. Whitten, a regression chapter from *The Fundamentals of Political Science Research*. Y is what you want to explain; X is what you think shifts it. | Edition, chapter, and pages: **unverified** (the file says so). |
| `readings/seawright-gerring-2008.js` | Jason Seawright and John Gerring, *Case Selection Techniques in Case Study Research*, *Political Research Quarterly* 61(2): 294–308 (2008). Menu of typical / diverse / extreme / deviant / influential / most similar / most different. | 294–308 is in the file. The grid fields are empty. |
| `readings/conrad-2021.js` | Conrad, Greene, Phillips and Daly, *Competition from Within*, *Defence and Peace Economics* 32 (2021): 757–772. A row is a pair of groups in a year. | 757–772 is in the file. |
| `readings/fuhrmann-kreps.js` | Fuhrmann and Kreps, *Targeting Nuclear Programs in War and Peace*, *Journal of Conflict Resolution* 54(6) (2010): 831–859. A row is a strike or near-strike. | 831–859 is in the file. Whether eLC lists the 2009 Belfer draft: **unverified**. |
| `project/methods-accountability.js` | Tobyn's own talk. Autonomy vs clarity; one-condition pilot; next step is two groups picked by chance; coding “clear / unclear”; limits on order, leakage, sample. | Not a required reading. |

King, Keohane and Verba; Van Evera; Brady and Collier; Goertz and Mahoney; Laitin: **not found** in the presentations week files or in this repo's notes. Do not cite them from this mapping.

## Lesson → this game's design

| Lesson (source) | Design feature in this sitting | What is still open |
| --- | --- | --- |
| Two things that can differ, then a guess about how they move (Kellstedt and Whitten as used in `PROJECT_SCRIPT`; same pair in `who-answers-when-it-goes-wrong.md`) | `ENABLE_TWO_VERSIONS` on: live versions are `advice` and `agent`. Off: every new start is `sequence`, the earlier one-night sitting. The assigned version is stored on the start row, the finding, JSONL/CSV, and `/admin` counts. | Draft wording about “equal probability” vs the code's least-count + coin on a tie. Tobyn must settle. |
| Cause has to vary; same night for everyone cannot talk about cause (`proj-pilot` in the talk file) | The switch exists so the paper can compare earlier `sequence` sits with later `advice` / `agent` sits. | Advice night still reuses only his route and advice scenes. He still writes the rest. |
| Chance picks the group (`proj-next`) | Server (and the preview worker) assign the version. Same `session_id` keeps the same version. Submit must match the start. | Talk file says “picked by chance.” Code balances counts, then flips a coin on a tie. That is not an independent 50/50 each time. |
| Do not pick only the outcome you already care about (Geddes 1990) | Inquiry lets them name one actor **or** say they cannot. Both answers can be filed. The night does not state the hypothesis until after submit (and the hypothesis line is omitted for `advice`, not rewritten). | Whether classmates who already know the guess are a selected sample: noted in the talk file, not solved here. |
| A row is a defined unit (Conrad; Fuhrmann and Kreps, as used in the talk notes) | One row is one finished inquiry: written account, named actor, stop item, clarity, sureness, optional notes, optional code, and `condition`. Starts without a finding are counted separately on `/admin`. | Repeats from another browser are still possible. The talk file already says so. |
| Coding makes answers countable (`proj-code`) | Closed items are stored as fixed codes (`single_actor`, `last_human`, 1–5 scores). Written text is kept beside them. | Coding rules for the written answers are his, not this PR. |
| Case-selection menu (Seawright and Gerring 2008) | **Not applied in code.** The sitting is still classmates, not a case drawn from that menu. | How he describes the sample in the paper is his. |
| One sitting per browser (talk file: “not quite one person”) | `oracle-filed` in `localStorage` after a saved finding. No “Open a new file.” | Private windows and a cleared store can sit again. |
| Inquiry wording can nudge (`proj-order`) | The live inquiry stem on this branch is unchanged. PR 28's other stem was not copied. | Tobyn still decides the stem. |

## Missing from those sources

- A full INTL 6010 required-reading list. The presentations repo has the week files above, not a syllabus.
- Edition and pages for Kellstedt and Whitten.
- Any reading that names least-count assignment or a coin flip. The assignment rule comes from PR 28, not from a cited methods page.
- King, Keohane and Verba and the other books listed as not found.

Do not paste this file into the sitting.
