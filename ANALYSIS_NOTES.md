# Analysis notes

Checklist for Tobyn. Structure only. TODO for Tobyn means you decide. This is not a finished codebook.

## Condition

- `advice` — ORACLE advises, officials decide and issue the measures. New unforced sits use this when assigned this arm. `night_kind` is `matched`. `who_executed` is `officials`.
- `agent` — officials delegate; ORACLE issues the same measures. `night_kind` is `matched`. `who_executed` is `oracle`.
- `sequence` — old pilot. Advice, then the upgrade, then ORACLE acts. Keep those rows readable. Do not write `sequence` on new sits.

The Methods Final comparison is `advice` vs `agent` on matched nights. Use `in_main_comparison` on the download: `advice` or `agent`, not forced, `night_kind` is `matched`. Drop `sequence` and any older unmatched `advice` rows (two-scene prototype, empty `final_actions`) from that table.

## Starts and findings

The admin dashboard shows starts, findings, and starts with no finding, by condition. `/admin/tools` has the same numbers plus night_kind, forced, in_main_comparison, who_executed, and the assignment audit. `/api/counts` is the payload for both. Least-count assignment tallies unforced starts, including starts that never filed.

TODO for Tobyn: keep or drop starts that never filed a finding.

## Q2 code table

Stored code | Label on the page now
--- | ---
`me` | An official on duty
`approvers` | Officials who approved the upgrade
`government` | The Araknes government
`supervisor` | The person set to supervise ORACLE
`developer` | The people who built ORACLE
`provider` | The company that ran ORACLE
`allies` | Allied governments or forces
`lei` | Lei
`oracle` | ORACLE
`equal` | More than one, equally
`other` | Other (`other_who` is the write-in)
`none` | I can't point to one actor

`gov_attribution` on the download is 1 for `me`, `approvers`, `government`, and `supervisor`, and 0 for every other stored code. That is the Final’s secondary binary. It does not replace `single_actor`.

TODO for Tobyn: what each code means for "naming one actor."

TODO for Tobyn: `oracle`.

TODO for Tobyn: `lei` and `allies`.

TODO for Tobyn: `approvers` against `me` and `government` (advice sits never see an upgrade).

TODO for Tobyn: `equal`.

TODO for Tobyn: `other` plus the write-in.

TODO for Tobyn: Q1 vs Q2 mismatch (written answer and the radio do not match).

TODO for Tobyn: whether Q4 is analysed independently of Q2.

## Other fields

- [ ] `session_id` — random id stored with the finding. Not a name, but it is an identifier.
- [ ] `participant_code` — optional code they type. A blank stays blank.
- [ ] `inquiry_account` — written answer to question 1.
- [ ] `other_who` — write-in only if they picked `other`.
- [ ] `notes` — optional notes box. `other_notes` copies `notes` so older spreadsheets still open.
- [ ] `last_human` — question 3. `yes` / `no` / `unsure`.
- [ ] `last_human_who` — filled if `last_human` is `yes` or `unsure`.
- [ ] `clarity` — question 4, 1 to 5. Required.
- [ ] `sureness` — question 5, 1 to 5. Required.
- [ ] `started_at` / `submitted_at` / `received_at` — clocks.
- [ ] `final_actions` / `outcome` / `harm` — the same on matched `advice` and `agent` rows (the four measures, `escalated`, harm yes). `who_executed` is what differs.
- [ ] `scenes_shown` / `night_kind` — what they watched. Main comparison needs `night_kind=matched`.
- [ ] `forced_condition` / `two_versions` — assignment audit. Forced preview sits are not a fair draw.
- [ ] leftover columns (`goal`, `confidence_bar`, `preauthorised`, `first_decision`, `authorised`, `stopped`, `shared`, `injury`) — still in the download so old files open. New rows leave them empty.

## Open coding questions

Tick these when you have a rule. Do not write the codes here until you are ready.

- [ ] How will you code the written answer (question 1)?
- [ ] What counts as naming one actor, more than one, or none?
- [ ] How will you treat `oracle` as the named actor?
- [ ] How will you treat `equal` (more than one, equally)?
- [ ] How will you treat `other` plus the write-in?
- [ ] How will you treat `lei` and `allies`?
- [ ] How will you treat `approvers` against `me` (official on duty) and `government`?
- [ ] What will you do with a short written answer?
- [ ] What will you do if the written answer and the radio pick do not match?
- [ ] How will you use `clarity` and `sureness` together?
- [ ] How will you treat `last_human` = unsure?
- [ ] Will you drop or keep rows that never filed a finding?
- [ ] Will older `sequence` rows stay in the same table as `advice` / `agent`?
- [ ] How does `condition` enter the comparison?
- [ ] Is Q4 analysed independently of Q2?
