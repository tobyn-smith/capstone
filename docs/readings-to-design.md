# Readings to design features

Reviewer note only. Not participant-facing. Not paper prose.

Mapped 31 Oct 2026 from files that were actually opened:

- `tobyn-smith/presentations` PR 5 branch `ts/reading-discussion-weeks-930d` at `0902131` (also checked `main` of that repo)
- week files under `presentations/readings/`
- Tobyn’s talk file `presentations/project/methods-accountability.js` (notes from his 30 Oct draft). That file sets `window.PROJECT_SCRIPT` (lines 177–192) and `window.PROJECT_SLIDES`
- this repo’s working note `who-answers-when-it-goes-wrong.md`

Every title, year, page range, or working-paper number below is copied from one of those files. The file path sits beside the claim. Anything not in those files is **unverified**. Rows that are this repo’s own wiring, not a sentence in a reading, are labelled **design rationale (not from the reading)**.

## Sources

| Path | What it is |
| --- | --- |
| `tobyn-smith/presentations` `readings/geddes-1990.js` | Week deck for Geddes |
| `tobyn-smith/presentations` `readings/kellstedt-whitten.js` | Week deck for the textbook chapter |
| `tobyn-smith/presentations` `readings/seawright-gerring-2008.js` | Week deck for Seawright and Gerring |
| `tobyn-smith/presentations` `readings/conrad-2021.js` | Week deck for Conrad et al. |
| `tobyn-smith/presentations` `readings/fuhrmann-kreps.js` | Week deck for Fuhrmann and Kreps |
| `tobyn-smith/presentations` `project/methods-accountability.js` | Tobyn’s talk. Defines `PROJECT_SLIDES` and `PROJECT_SCRIPT` |
| `tobyn-smith/capstone` `who-answers-when-it-goes-wrong.md` | His working note in this repo |

`PROJECT_SCRIPT` is the speaker-note array in `project/methods-accountability.js` (same file as the slides). It is not a separate document.

King, Keohane and Verba; Van Evera; Brady and Collier; Goertz and Mahoney; Laitin: **not found** in the presentations week files or in this repo’s notes. Do not cite them from this mapping.

## What those files already print

| Source file | What that file itself says | Pages / edition |
| --- | --- | --- |
| `presentations/readings/geddes-1990.js` | Barbara Geddes, *How the Cases You Choose Affect the Answers You Get*, IGS Working Paper 90-13 (1990). The file’s own lines: “Study only the outcome you already care about.” | No page numbers in the file. Working paper 90-13 is on line 9 and again in the “ask” slide. |
| `presentations/readings/kellstedt-whitten.js` | Paul M. Kellstedt and Guy D. Whitten, “Regression, from *The Fundamentals of Political Science Research*.” Grid: “Y is what you want to explain. X is what you think shifts it.” | Edition, chapter, and pages: **unverified**. The file says so (`year: ""`, `pages: ""`, `source` notes the chapter depends on the edition). |
| `presentations/readings/seawright-gerring-2008.js` | Jason Seawright and John Gerring, *Case Selection Techniques in Case Study Research: A Menu of Qualitative and Quantitative Options*, *Political Research Quarterly* 61(2): 294–308 (2008). Menu listed in `caseTypes`: typical / diverse / extreme / deviant / influential / most similar / most different. | 294–308 is in the file (`pages` and `source`). The `grid` fields are empty. |
| `presentations/readings/conrad-2021.js` | Justin Conrad, Kevin T. Greene, Brian J. Phillips and Samantha Daly, *Competition from Within: Ethnicity, Power, and Militant Group Rivalry*, *Defence and Peace Economics* 32 (2021): 757–772. | 757–772 is in the file. |
| `presentations/readings/fuhrmann-kreps.js` | Matthew Fuhrmann and Sarah E. Kreps, *Targeting Nuclear Programs in War and Peace: A Quantitative Empirical Analysis, 1941-2000*, *Journal of Conflict Resolution* 54(6) (2010): 831–859. | 831–859 is in the file. Whether eLC lists the 2009 Belfer draft: **unverified** (the file says so). |
| `presentations/project/methods-accountability.js` | Tobyn’s own talk. Autonomy vs clarity; one-condition pilot; next step two groups picked by chance; coding “clear / unclear”; limits on order, leakage, sample. `PROJECT_SCRIPT` notes name Kellstedt and Whitten (“a theory links two things that can differ”), Conrad (“a row is a pair of groups”), and Fuhrmann and Kreps (“a row is a strike or near-strike moment”). | Not a required reading. |

## Lesson → this game’s design

| Lesson (source) | Design feature in this sitting | Label | What is still open |
| --- | --- | --- | --- |
| Two things that can differ (`PROJECT_SCRIPT` note on `proj-question` in `project/methods-accountability.js`: “K&W: a theory links two things that can differ.” Same pairing of autonomy / clarity is in `who-answers-when-it-goes-wrong.md`) | `ENABLE_TWO_VERSIONS` on: live versions are `advice` and `agent`. Off: every new start is `sequence`. The assigned version is stored on the start row, the finding, JSONL/CSV, and `/admin` counts. | The X/Y pairing is from the talk file. The switch and the stored labels are **design rationale (not from the reading)**. | Draft wording about “equal probability” vs the code’s least-count + coin on a tie. Tobyn must settle. |
| Cause has to vary (`PROJECT_SLIDES` `proj-pilot`: “A cause has to differ between cases.” / `PROJECT_SCRIPT` `proj-pilot`: “Cause has to vary.”) | The switch exists so the paper can compare earlier `sequence` sits with later `advice` / `agent` sits. | Lesson from the talk file. The three stored labels are **design rationale (not from the reading)**. | Advice night still reuses only his route and advice scenes. He still writes the rest. |
| Chance picks the group (`PROJECT_SLIDES` `proj-next` title “Two groups, picked by chance”; callout “Chance picks the group.”) | Server (and the preview worker) assign the version. Same `session_id` keeps the same version. Submit must match the start. | “Picked by chance” is from the talk file. Least-count + coin is **design rationale (not from the reading)**; it comes from capstone PR 28, not from a methods page. | Talk file says “picked by chance.” Code balances counts, then flips a coin on a tie. That is not an independent 50/50 each time. |
| Do not pick only the outcome you already care about (`readings/geddes-1990.js`, habit slide) | Inquiry lets them name one actor **or** say they cannot. Both answers can be filed. The night does not state the hypothesis until after submit (and the hypothesis line is omitted for `advice`, not rewritten). | The habit is from Geddes as printed in that file. Keeping both answers possible is how this sitting applies it; the omit-not-rewrite rule is **design rationale (not from the reading)**. | Whether classmates who already know the guess are a selected sample: noted in `proj-leak` / `proj-who`, not solved here. |
| A row is a defined unit (`PROJECT_SCRIPT` `proj-row` notes: Conrad; Fuhrmann and Kreps. Slides `proj-row`: “One finished inquiry.”) | One row is one finished inquiry: written account, named actor, stop item, clarity, sureness, optional notes, optional code, and `condition`. Starts without a finding are counted separately on `/admin`. | Unit-of-analysis lesson from the talk notes pointing at those two week files. The admin split of starts vs findings is **design rationale (not from the reading)**. | Repeats from another browser are still possible. The talk file already says “not quite one person.” |
| Coding makes answers countable (`PROJECT_SLIDES` `proj-code`: “Coding just means making the answers countable.” Clear = names one actor; unclear = cannot point to one.) | Closed items are stored as fixed codes (`single_actor`, `last_human`, 1–5 scores). Written text is kept beside them. | From the talk file. | Coding rules for the written answers are his, not this PR. |
| Case-selection menu (`readings/seawright-gerring-2008.js` title, pages, and `caseTypes`) | **Not applied in code.** The sitting is still classmates, not a case drawn from that menu. | Title/pages from that file. “Not applied” is the honest mapping. | How he describes the sample in the paper is his. `proj-who` already says classmates, not picked at random. |
| One sitting per browser (`PROJECT_SLIDES` `proj-row`: “Not quite one person”) | `oracle-filed` in `localStorage` after a saved finding. No “Open a new file.” | The limit is from the talk file. The `localStorage` flag is **design rationale (not from the reading)**. | Private windows and a cleared store can sit again. |
| Inquiry wording can nudge (`PROJECT_SLIDES` `proj-order`: “The live page says ORACLE carried out the action. That nudges people.”) | The live inquiry stem on this branch is unchanged. PR 28’s other stem was not copied. | From the talk file. | Tobyn still decides the stem. |

## Missing from those sources

- A full INTL 6010 required-reading list. The presentations repo has the week files above, not a syllabus.
- Edition and pages for Kellstedt and Whitten (`readings/kellstedt-whitten.js` leaves them blank).
- Any reading that names least-count assignment or a coin flip. The assignment rule comes from capstone PR 28, not from a cited methods page.
- King, Keohane and Verba and the other books listed as not found.
- McCubbins, Noll and Weingast appear in `who-answers-when-it-goes-wrong.md` only as something he “kept in mind.” No week file for them was found. **unverified** as a class reading.

Do not paste this file into the sitting.
