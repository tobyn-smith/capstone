# Change timeline (repo history)

Reviewer and appendix source. Not paper prose. Dates and reasons are taken from commits and PR titles or bodies. Anything not in those records is marked **unknown**.

Built 31 Oct 2026 from `tobyn-smith/capstone` history and GitHub PRs 1–31. Screenshots were captured from a local run of this branch on that date.

## Which design a change belongs to

| Code stored as | What the player sees | When it is assigned |
| --- | --- | --- |
| `sequence` | One night: advice, then the upgrade, then ORACLE acts. The earlier class sitting. | `ENABLE_TWO_VERSIONS` off (or not a truthy value). |
| `advice` | Route + advice scenes only, until he writes more. | Flag on; least-count vs `agent`, coin on a tie. |
| `agent` | The same full night as `sequence`. | Flag on; least-count vs `advice`, coin on a tie. |

`sequence` and `agent` use the same scenes. They are stored as different versions so the earlier sitting can be compared with the two-version sitting.

## Timeline

Dates are UTC commit or PR-created dates from GitHub.

| Date | Ref | What changed in the game or design | Why (from the PR or commit) | Design version |
| --- | --- | --- | --- | --- |
| 2026-09-25 | PR 1 merged | First wargame: “Who answers when it goes wrong?” | PR title. | Pre-pilot / early file |
| 2026-09-25 | PRs 2–4 merged | How to run it; temporary class link; inquiry file + student-pack host | PR titles. | Pre-pilot |
| 2026-09-25 | PR 5 merged; `7b2bc3e`, `1896c35`, `b65309a` | Commission file look; draft mark; arms | Commits: draft setup, commission record, welcome sheet. | Visual identity (not a version split) |
| 2026-09-25 | PR 6 merged | Night in plainer words | PR title. | Copy on the single night |
| 2026-09-25 | PR 7 merged; `203209e` | UGA visual style on the class page | Commit message. | Visual |
| 2026-09-25 | PRs 8–11 merged | Root address, tab icon, phone message, class introduction | PR titles. | Host / class page |
| 2026-09-28 | PRs 12–14 merged | Admin register on the Heroku class host, then cut down to the table | PR titles. | Measurement / admin |
| 2026-09-28 | PR 16 and night-picture commits `a7c56eb`, `ee23be3`, `75ad356` | Night shown as a still of the lane before answers | Commits. | Single-night (`sequence`) |
| 2026-09-28 | PR 17 merged; `3db3c08`, `4d43b08` | Inquiry after the night; tanker cause left unproved | Commits. | Single-night |
| 2026-09-28 | PR 18 merged; `443771e` | Play the night through; answers only on the inquiry | Commit. | Single-night |
| 2026-09-28 | PR 19 merged; `fe84050` | Hold each beat until Next; map picture per beat | Commit. | Single-night |
| 2026-09-28 | PR 20 merged; `8da8e74` | Smoother coasts and ships | Commit. | Visual of the two countries |
| 2026-09-28 | PR 21 merged; `e127180` | Lane redraw; ORACLE as a model transcript | Commit. | Visual / ORACLE panel |
| 2026-09-28 | PR 22 merged; `4a8ec43` | One Araknes flag; thesis line and lane taken off the night | Commit. | Single-night; avoids stating the claim on the night |
| 2026-09-29 | PR 23 merged; `8c7dff3`, `28d0a29` | Night reads as the story; banner kept for the inquiry; flags in the page | Commits. | Single-night |
| 2026-09-29 | PR 24 merged; `fcd7752` | Inquiry clock and choices; tighter store rules | Commit. | Measurement |
| 2026-09-29 | **PR 25 open** (`5ffab05` and later) | Plainer night lines; email / issues note | PR title and commits. | Single-night copy. **Not merged.** |
| 2026-10-26 | **PR 26 open** | Inquiry wording pass, then restore of Tobyn's wording | PR title; `25b3984`. | Wording. **Not merged.** |
| 2026-10-26 | **PR 27 open** | Layout, type, focus; no copy change | `9413d7f`. | Visual. **Not merged.** |
| 2026-10-26 | **PR 28 open** (`c3b9e5c`) | Assignment mechanics: `advice` / `agent`, least-count, coin on a tie, `/api/counts`. Flag off assigned `agent` only. | PR body. | Two-version mechanics. **Not merged.** Not the default on this branch when the flag is off. |
| 2026-10-26 | **PR 29 open** | Restore original consent, stem, Q3, scale labels | `5b8aeb7`. | Wording. **Not merged.** |
| 2026-10-31 | **PR 30 open** | Draft checks: notes, optional code, consent attempt, one sitting | PR commits. | Single-night instrument. **Not merged.** Consent rewrite is his decision. |
| 2026-10-31 | **PR 31 open** (this branch) | Optional code (blank stays blank); notes box; one sitting per browser; Cloudflare preview worker + KV; phone gate off only on `*.pages.dev` | Commits `ca5dfec`–`4cff60e` and later work on this PR. | Starts as `sequence`. This update turns two-version assignment on for the preview, records `sequence` when the switch is off, and polishes the visuals. |

## This update (31 Oct 2026, PR 31)

Not yet a separate merged PR. Recorded here because it is the sitting the screenshots show.

- Switch: `ENABLE_TWO_VERSIONS` in `1` / `true` / `yes` / `on`. Off → new starts are `sequence`. On → `advice` or `agent` by least-count, coin on a tie. `sequence` rows do not count toward that balance.
- Version is on every start and finding, in the export, and in `/admin` counts.
- One sitting per browser is unchanged.
- Advice night still uses only his first two scenes. No new participant sentences.
- Style pass: type, spacing, contrast, flags, lane drawing, ORACLE panel flattened. Same words. Same logic. Both live versions share the same look except the intended scene set.

PR 28's default-off assignment (`agent`) is **not** used here. That difference is intentional so the earlier single-night data stays labelled `sequence`.

## Screenshots

Captured locally at `http://127.0.0.1:8000`, viewport 1400×920. No admin passphrase is in any frame.

### Style pass (same sitting, before vs after)

| Screen | Before | After |
| --- | --- | --- |
| Start | [style-before-start.png](screenshots/style-before-start.png) | [sequence-start.png](screenshots/sequence-start.png) |
| Night (Lei moves) | [style-before-night.png](screenshots/style-before-night.png) | [sequence-night.png](screenshots/sequence-night.png) |
| Inquiry | [style-before-inquiry.png](screenshots/style-before-inquiry.png) | [sequence-inquiry.png](screenshots/sequence-inquiry.png) |
| Debrief | [style-before-debrief.png](screenshots/style-before-debrief.png) | [sequence-debrief.png](screenshots/sequence-debrief.png) |

### Single-night version (`sequence`)

Start, night, inquiry, debrief: the After column above.

### Two-version · advice

| Screen | File |
| --- | --- |
| Start | [advice-start.png](screenshots/advice-start.png) |
| Night | [advice-night.png](screenshots/advice-night.png) |
| Inquiry | [advice-inquiry.png](screenshots/advice-inquiry.png) |
| Debrief | [advice-debrief.png](screenshots/advice-debrief.png) |

### Two-version · agent

| Screen | File |
| --- | --- |
| Start | [agent-start.png](screenshots/agent-start.png) |
| Night | [agent-night.png](screenshots/agent-night.png) |
| Inquiry | [agent-inquiry.png](screenshots/agent-inquiry.png) |
| Debrief | [agent-debrief.png](screenshots/agent-debrief.png) |

Start pages are the same words in every version. Night and inquiry file-panel length differ for `advice` because only the first two scenes (and the first file line) are reused. Debrief omits the hypothesis sentence for `advice`; that sentence is not rewritten.

Phone-width start after the style pass (preview gate off, 390px): [style-after-phone-start.png](screenshots/style-after-phone-start.png).

## Unknown

- Exact class-sitting dates and how many people filed on Heroku: not in this git history.
- Whether PR 25–30 will merge, and in what order.
- A screenshot of the live class host from those earlier dates: not in the repo. The frames above are this branch, run locally.
- Why the draft says equal probability while PR 28 (and this port) uses least-count: not stated in a commit. Left as his decision.
