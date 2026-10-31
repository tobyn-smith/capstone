# Change timeline (repo history)

Reviewer and appendix source. Not paper prose. Dates and reasons are taken from GitHub PR `createdAt` / `mergedAt` and from commit messages. Anything not in those records is marked **unknown** or **inferred**.

Built 31 Oct 2026 from `tobyn-smith/capstone` history and GitHub PRs 1–31 in that repo. Screenshots were captured from a local run of this branch on that date.

PR numbers in this file are **`tobyn-smith/capstone`** unless a row says otherwise. `tobyn-smith/presentations` PR 5 (`ts/reading-discussion-weeks-930d`) is the only presentations PR named here. Those two repos number PRs separately.

## Version labels used in the last column

| Version | What the player sees | When it is assigned |
| --- | --- | --- |
| Single-night (`sequence`) | One night: advice, then the upgrade, then ORACLE acts. The earlier class sitting. | `ENABLE_TWO_VERSIONS` off (or not a truthy value), on this branch. |
| Two-version · `advice` | Route + advice scenes only, until he writes more. | Flag on; least-count vs `agent`, coin on a tie. |
| Two-version · `agent` | The same full night as `sequence`. | Flag on; least-count vs `advice`, coin on a tie. |
| Style pass | Same words and logic as the sitting it sits on. Editorial / museum look. | Visual only. Not a stored condition. |

`sequence` and `agent` use the same scenes. They are stored as different versions so the earlier sitting can be compared with the two-version sitting. That identity is intended.

## Why flag-off and the `sequence` label differ from PR 28

Quoted from **capstone PR 28** body (`c3b9e5c`, created 2026-10-26):

> Flag **off** (default): every new start is `agent` and people see the night already on the page.

> Least-count among the live versions; a fair coin when the counts are tied. `sequence` rows do not count toward that balance.

> `sequence` is the old one-night pilot and still loads. New sits do not write `sequence`.

This branch (capstone PR 31) does **not** use PR 28’s flag-off = `agent`. **Inferred** from the later work on this PR, not a quoted commit: flag-off writes `sequence` so earlier one-night data stays labelled `sequence` and can be compared with later `advice` / `agent` sits. If that inference is wrong, the code still does it; the motive is not in a commit message before 31 Oct.

## Timeline

Dates are UTC `createdAt` from GitHub for that capstone PR, plus `mergedAt` when the PR merged. PRs 1–11 all landed on 2026-09-25; the clock times below are per PR, not one shared stamp.

| Date (UTC) | Ref (capstone unless noted) | What changed in the game or design | Why (from the PR or commit) | Version |
| --- | --- | --- | --- | --- |
| 2026-09-25 17:39 created / 17:45 merged | PR 1 merged | First wargame: “Who answers when it goes wrong?” | PR title. | Pre-pilot / early file |
| 2026-09-25 17:49 created / 17:52 merged | PR 2 merged | How to start the wargame | PR title. | Pre-pilot |
| 2026-09-25 18:09 created / 18:39 merged | PR 3 merged | Temporary seminar play link | PR title. | Host |
| 2026-09-25 18:25 created / 18:39 merged | PR 4 merged | Inquiry-file shape; student-pack host | PR title. | Pre-pilot |
| 2026-09-25 18:50 created / 20:47 merged | PR 5 merged; commits `7b2bc3e`, `1896c35`, `b65309a` | Commission file look; draft mark; arms | Commits: draft setup, commission record, welcome sheet. | Style (not a version split) |
| 2026-09-25 21:34 created / 22:01 merged | PR 6 merged | Night in plainer words | PR title. | Single-night copy |
| 2026-09-25 22:21 created / 22:44 merged | PR 7 merged; `203209e` | UGA visual style on the class page | Commit message. | Style |
| 2026-09-25 22:56 created / 23:14 merged | PR 8 merged | Class page at the root address | PR title. | Host / class page |
| 2026-09-25 23:20 created / 23:21 merged | PR 9 merged | Tab icon | PR title. | Host |
| 2026-09-25 23:25 created / 23:29 merged | PR 10 merged | Phone message | PR title. | Host |
| 2026-09-25 23:28 created / 23:29 merged | PR 11 merged | Class page introduction | PR title. | Class page |
| 2026-09-28 19:51 created / 19:54 merged | PR 12 merged | Admin register for the Heroku class host | PR title. | Measurement / admin |
| 2026-09-28 20:03 created / 20:04 merged | PR 13 merged | Register on the UGA sheet | PR title. | Admin |
| 2026-09-28 20:08 created / 20:22 merged | PR 14 merged | Cut the register down to the table | PR title. | Admin |
| 2026-09-28 20:25 created / 23:03 closed, not merged | PR 15 closed | Point the class link at the Heroku address that answers (`650a351`) | PR title: “Use the Heroku address that actually opens the file.” Closed without merge. **Inferred:** a later change on another branch covered the same host note. | Host. Not a design version. |
| 2026-09-28 20:40 created / 21:32 merged | PR 16 merged; `a7c56eb`, `ee23be3`, `75ad356` | Night shown as a still of the lane before answers | Commits. | Single-night (`sequence`) |
| 2026-09-28 21:39 created / 21:53 merged | PR 17 merged; `3db3c08`, `4d43b08` | Inquiry after the night; tanker cause left unproved | Commits. | Single-night (`sequence`) |
| 2026-09-28 22:09 created / 22:09 merged | PR 18 merged; `443771e` | Play the night through; answers only on the inquiry | Commit. | Single-night (`sequence`) |
| 2026-09-28 22:22 created / 22:29 merged | PR 19 merged; `fe84050` | Hold each beat until Next; map picture per beat | Commit. | Single-night (`sequence`) |
| 2026-09-28 22:37 created / 23:03 merged | PR 20 merged; `8da8e74` | Smoother coasts and ships | Commit. | Style of the two countries |
| 2026-09-28 23:17 created / 23:22 merged | PR 21 merged; `e127180` | Lane redraw; ORACLE as a model transcript | Commit. | Style / ORACLE panel |
| 2026-09-29 00:21 created / 00:25 merged | PR 22 merged; `4a8ec43` | One Araknes flag; thesis line and lane taken off the night | Commit. | Single-night (`sequence`); avoids stating the claim on the night |
| 2026-09-29 00:40 created / 00:52 merged | PR 23 merged; `8c7dff3`, `28d0a29` | Night reads as the story; banner kept for the inquiry; flags in the page | Commits. | Single-night (`sequence`) |
| 2026-09-29 04:06 created / 04:07 merged | PR 24 merged; `fcd7752` | Inquiry clock and choices; tighter store rules | Commit. | Measurement |
| 2026-09-29 04:15 created; still open | **PR 25 open** (`5ffab05` and later) | Plainer night lines; email / issues note | PR title and commits. | Single-night copy. **Not merged.** |
| 2026-10-26 01:50 created; still open | **PR 26 open** | Inquiry wording pass, then restore of Tobyn’s wording | PR title; `25b3984`. | Wording. **Not merged.** |
| 2026-10-26 02:34 created; still open | **PR 27 open** | Layout, type, focus; no copy change | `9413d7f`. | Style. **Not merged.** |
| 2026-10-26 02:53 created; still open | **PR 28 open** (`c3b9e5c`) | Assignment mechanics: `advice` / `agent`, least-count, coin on a tie, `/api/counts`. Flag off assigned `agent` only. New sits did not write `sequence`. | Quoted PR body (see above). | Two-version mechanics. **Not merged.** Not the flag-off default on PR 31. |
| 2026-10-26 02:57 created; still open | **PR 29 open** | Restore original consent, stem, Q3, scale labels | `5b8aeb7`. | Wording. **Not merged.** |
| 2026-10-31 18:05 created; still open | **PR 30 open** | Draft checks: notes, optional code, consent attempt, one sitting | PR commits. | Single-night instrument. **Not merged.** Consent rewrite is his decision. |
| 2026-10-31 18:06 created; still open | **PR 31 open** (this branch), first stretch `ca5dfec`–`4cff60e` | Optional code (blank stays blank); notes box; one sitting per browser; Cloudflare preview worker + KV; phone gate off only on `*.pages.dev` | Commits on this PR. | Single-night (`sequence`) instrument and preview host. Two-version assignment was not on yet. |
| 2026-10-31 18:37 | PR 31, commit `29b5ca9` | Two-version assignment turned on for the preview; flag-off records `sequence` (not PR 28’s `agent`); style pass | Commit message: “Turn on two-version assignment and polish the sitting.” Flag-off = `sequence` is **inferred** (see above). | Two-version · `advice` and `agent` when the flag is on. Single-night (`sequence`) when the flag is off. Style pass on every version. |
| 2026-10-31 (this update) | PR 31, review-hint pass | First finding wins; start session required on save; session reuse if a save fails; advice night gated on `condition` only; worker list uses KV metadata; timing-safe passphrase; `/_worker.js` not served; hex session id on remove | This commit. Not a player-facing wording change. | Same three stored versions. Honest docs. |
| 2026-10-31 (this update) | PR 31, coach fixes | Dropped the inquiry line “The night is over. This is the inquiry.” Advice findings no longer store later-night `final_actions` / `outcome` `escalated` / `harm` true. Advice inquiry lead uses his file-panel line so it does not say ORACLE carried out the action. Missing or unknown `session_id` still rejected. | Tobyn approved these on this PR. | Same three stored versions. |
| 2026-10-31 (this update) | PR 31, two-column laptop layout | Night: scene text and map/ORACLE sit side by side. Inquiry: questions and the file panel sit side by side. Two columns stay at 1280×800. A window under 1040px still stacks. No wording change. | Tobyn asked for the layout. | Same three stored versions. Screenshots below retaken at 1280×800. |

Presentations PR 5 (`tobyn-smith/presentations`, `ts/reading-discussion-weeks-930d`, `0902131`) is the source of the week files mapped in `docs/readings-to-design.md`. It is not a capstone game change.

## This update (31 Oct 2026, capstone PR 31)

Not yet a separate merged PR. Recorded here because it is the sitting the screenshots show.

- Switch: `ENABLE_TWO_VERSIONS` in `1` / `true` / `yes` / `on`. Off → new starts are `sequence`. On → `advice` or `agent` by least-count, coin on a tie. `sequence` rows do not count toward that balance (quoted from capstone PR 28). Abandoned starts still count toward that balance (same rule: it tallies start rows).
- Version is on every start and finding, in the export, and in `/admin` counts.
- One sitting per browser is unchanged. A failed save keeps the same `session_id` so a retry does not draw a new version.
- Advice night still uses only his first two scenes. No new participant sentences.
- `agent` night is the same scenes as `sequence`. Intended.
- Style pass: type, spacing, contrast, flags, lane drawing, ORACLE panel flattened. Same words. Same logic. Both live versions share the same look except the intended scene set.
- Preview KV has no lock and no Durable Object. Concurrent starts can unbalance the arms. `server.py` still holds `LOCK`.

## Screenshots

Captured locally at `http://127.0.0.1:8000`, viewport 1280×800. No admin passphrase is in any frame. Every stored version has start, night, inquiry, and debrief.

### Style pass (same sitting, before vs after)

| Screen | Before | After |
| --- | --- | --- |
| Start | [style-before-start.png](screenshots/style-before-start.png) | [sequence-start.png](screenshots/sequence-start.png) |
| Night (Lei moves) | [style-before-night.png](screenshots/style-before-night.png) | [sequence-night.png](screenshots/sequence-night.png) |
| Inquiry | [style-before-inquiry.png](screenshots/style-before-inquiry.png) | [sequence-inquiry.png](screenshots/sequence-inquiry.png) |
| Debrief | [style-before-debrief.png](screenshots/style-before-debrief.png) | [sequence-debrief.png](screenshots/sequence-debrief.png) |

### Single-night version (`sequence`)

| Screen | File |
| --- | --- |
| Start | [sequence-start.png](screenshots/sequence-start.png) |
| Night | [sequence-night.png](screenshots/sequence-night.png) |
| Inquiry | [sequence-inquiry.png](screenshots/sequence-inquiry.png) |
| Debrief | [sequence-debrief.png](screenshots/sequence-debrief.png) |

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

Start pages are the same words in every version. Night and inquiry file-panel length differ for `advice` because only the first two scenes (and the first file line) are reused. Debrief omits the hypothesis sentence for `advice`; that sentence is not rewritten. Agent and sequence nights match.

The inquiry frames now match the live page: no “The night is over. This is the inquiry.” line, and the advice lead uses the file-panel wording.

Phone-width start after the style pass (preview gate off, 390px): [style-after-phone-start.png](screenshots/style-after-phone-start.png). That frame is older and was not retaken for this layout pass.

## Unknown

- Exact class-sitting dates and how many people filed on Heroku: not in this git history.
- Whether PR 25–30 will merge, and in what order.
- A screenshot of the live class host from those earlier dates: not in the repo. The frames above are this branch, run locally.
- Why the draft says equal probability while PR 28 (and this port) uses least-count: not stated in a commit. Left as his decision.
- Why PR 15 closed without merge: not stated in a commit. **Inferred** above.
