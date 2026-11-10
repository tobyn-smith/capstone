# Admin dashboard improvements (proposal)

Proposal only. No code in this file is a request to build yet.

The class host stores two tables: `assignments` (`session_id`, `condition`, `forced`, `started_at`, `two_versions`) and `responses` (`session_id`, JSON `payload`). Locally those are JSONL files with the same fields. The payload columns are listed in `COLUMNS` in `server.py`. `/admin` already shows starts / findings / no-finding by version, the findings table, written Q1 text, and a full CSV download. `/admin/tools` already breaks counts down by `night_kind`, forced vs unforced, `in_main_comparison`, and `who_executed`, lists leftover starts, and offers main-comparison plus full CSV.

The HTML shell at `/admin` is public. Counts, rows, CSV, and remove all require the `X-Passphrase` header. Keep that gate. Do not log the passphrase. Do not put `participant_code` or Q1 text on any public page.

ORACLE on the night is a scripted transcript in `app/game.js`. There is no live model call, no model name or version field, and no latency / token / cost log. “The model is live” in this study means the two-arm sitting is collecting on Heroku, not that an LLM is answering during play.

Priority is field usefulness for the Methods Final (`advice` vs `agent`, unforced, `night_kind=matched`), then data quality, then anything that would need new logging.

## 1. Live arm × night counts on the dashboard (S)

**What it shows.** One table, auto-refreshed, of starts, findings, and starts with no finding, crossed by arm (`advice` / `agent` / leftover `sequence`) and `night_kind` (`matched` / `sequence` / `unmatched`). A one-line “last updated” stamp. This is the current counts table plus the night-kind split that today lives only on `/admin/tools`.

**Uses.** `register_counts()` already returns `starts`, `findings`, `starts_without_finding`, and `night_kind`. Assignment `condition` plus derived `start_night_kind` / `finding_night_kind`.

**Effort.** S. Reuse `/api/counts`; no schema change.

**Privacy / ethics.** Aggregate counts only. Low risk. Do not add session ids to this table.

## 2. Completion / drop-off funnel (S)

**What it shows.** Per arm: started → filed a finding → in the main comparison. Completion rate and abandoned count. Link leftover sessions to the existing remove tool.

**Uses.** `assignments.started_at`, `responses.session_id`, `in_main_comparison`, `forced_condition`. Scene-by-scene drop-off is **not** stored (no per-beat events), so the funnel stops at start vs finding.

**Effort.** S from existing counts and `audit.starts_without_finding`. M if you later add a `last_beat` field.

**Privacy / ethics.** Leftover rows already expose `session_id` and `started_at` after the passphrase. Keep that behind the gate. Hex session ids are identifiers, not names.

## 3. Who they named (Q2) by arm, plus Q1 length (S)

**What it shows.** Counts of `single_actor` (Q2: “Name one actor, or say you can't.”) by `advice` vs `agent`, restricted to `in_main_comparison`. Also `gov_attribution` (1 vs 0) and mean `clarity` / `sureness`. Q1 (“Who was responsible for what Araknes did?”) is free text (`inquiry_account`); show length bands and a count of short answers, not a categorical distribution of the prose.

**Uses.** `single_actor`, `gov_attribution`, `clarity`, `sureness`, `inquiry_account`, `condition`, `in_main_comparison`. Q1 has no codebook in the database.

**Effort.** S as a counts table on `/api/counts`. M if you want stacked bars in the page.

**Privacy / ethics.** Aggregates are fine. Do not put Q1 sentences on a summary card. Written accounts already appear under the findings table; keep that after the passphrase and off any class link.

## 4. Recent sessions table with filters (M)

**What it shows.** One row per start, newest first: version, forced, has finding, `in_main_comparison`, duration (`started_at` → `submitted_at` or still open), Q2 label, clarity, sureness. Filters: arm, forced, filed vs abandoned, main-comparison, date range. This replaces hunting across the findings table and the leftover-starts list.

**Uses.** Join `assignments` to `responses` on `session_id`. Fields: `condition`, `forced_condition`, `started_at`, `submitted_at`, `received_at`, `single_actor`, `clarity`, `sureness`, `in_main_comparison`, `participant_code` (optional).

**Effort.** M. New query shape; `/api/responses` today returns findings only, not starts without a finding.

**Privacy / ethics.** `participant_code` is an optional identifier they typed. Default the column off, or mask it. `session_id` is enough to remove a sitting.

## 5. Data-quality flags (M)

**What it shows.** A badge per row, and a tally:

- blank `participant_code` (allowed; flag so you can see how many skipped it)
- sitting under about 10 seconds (`started_at` vs `submitted_at`)
- duplicate or near-duplicate `inquiry_account` text (same canned paragraph filed twice)
- Q1 shorter than the server minimum in spirit (saved rows already meet `MIN_ACCOUNT` = 20 characters)
- Q2 `other` with a thin write-in, or Q1 vs Q2 mismatch left for you to read (no stored mismatch flag)

**Uses.** `participant_code`, `started_at`, `submitted_at`, `inquiry_account`, `single_actor`, `other_who`. All computable. Nothing new to store.

**Effort.** M (string similarity for duplicates is the only fiddly part). S if you only flag blank codes and sub-10s clocks.

**Privacy / ethics.** Duplicate detection displays Q1 text to you. Stay behind the passphrase. Do not export a “flagged text” column to a shared sheet without stripping identifiers.

## 6. Balance check across arms (S)

**What it shows.** Unforced start counts for `advice` vs `agent` (the least-count tally, including abandoned starts), the difference, and a warning if they differ by more than 1. Forced `?condition=` starts listed separately so they do not look like a failed randomisation.

**Uses.** `balance_counts()` / `forced` split already in `/api/counts`. `two_versions` is always true in code.

**Effort.** S.

**Privacy / ethics.** Counts only. Low risk.

## 7. CSV export, no optional identifiers (S)

**What it shows.** Keep the existing Download on `/admin` and the two downloads on `/admin/tools`. Add one labelled “CSV without codes”: same `COLUMNS` except `participant_code` (and do not add emails; none are stored). Main-comparison set stays `?set=main`. Formula-safe `csv_safe()` stays.

**Uses.** `handle_export()`, `COLUMNS`, `in_main_comparison`. Full export already exists; this is a safer default for sharing with a reader.

**Effort.** S.

**Privacy / ethics.** `inquiry_account`, `notes`, `other_who`, and `last_human_who` are still in the file. They can identify someone. For a reader copy, drop those too or replace Q1 with length-only. Hex `session_id` can still join rows; drop it on a public replication file.

## 8. Model-call health — do not build on current data (L if you add a live model)

**What it would show.** Latency, error rate, token / cost, model name and version.

**Uses.** **None today.** No provider client in `server.py` or `app/_worker.js`. Night copy is fixed (`ADVICE_ACTS` / `AGENT_ACTS`). Startup does not print a model id. There is nothing honest to chart.

**Effort.** L, and only after you add a real call plus a log table (status, ms, model id, token counts — not prompts).

**Privacy / ethics.** High if you ever log prompts, ORACLE “outputs”, or Q1 text to a vendor. If a live model is added later, log metadata only, keep raw text off the admin page, and say so in the consent line. Until then, skip this card so the dashboard does not invent telemetry.

## 9. Optional zero-shot blame-label preview (L) — hold

**What it would show.** A column that guesses a `single_actor` code from Q1, next to the radio they picked, as a coding aid.

**Uses.** `inquiry_account` as input; `single_actor` as the human label. No model output is stored now.

**Effort.** L (API, cost, a place to write the preview without mixing it into the finding).

**Privacy / ethics.** High. It sends inquiry text to a model. It can bias your coding if you treat the guess as ground truth. It is not a stored study variable. Do not write model labels into `responses`. Do not run this on the class host until you decide it is in scope for the IRB / class ethics note. Prefer hand-coding Q1 with the checklist in `ANALYSIS_NOTES.md`.

## Suggested order

1, 2, 6, 3, 7 first (all S, all from data you already store). Then 4 and 5 (M). Do not start 8 or 9 unless a live model is actually wired in and the ethics note covers it.
