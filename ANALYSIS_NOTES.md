# Analysis notes

Checklist for Tobyn. Structure only. TODO for Tobyn means you decide. This is not a finished codebook.

## Condition

- `advice` — ORACLE advises, an official decides. New rows use this when the two-version flag is on and they were assigned this night.
- `agent` — ORACLE acts on its own at the confidence bar. New rows use this. With the flag off, every new start is `agent` (the night already on the page).
- `sequence` — old pilot. Same night for everyone. Keep those rows readable. Do not write `sequence` on new sits.

TODO for Tobyn: how `condition` enters the comparison (advice vs agent on the new sits; whether `sequence` is in that table, a separate pilot note, or dropped).

## Starts and findings

The register shows starts, findings, and starts with no finding, by condition. `/api/counts` is the same numbers.

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
`other` | Other (`other_notes` is the write-in)
`none` | I can't point to one actor

TODO for Tobyn: what each code means for "naming one actor."

TODO for Tobyn: `oracle`.

TODO for Tobyn: `lei` and `allies`.

TODO for Tobyn: `approvers` against `me` and `government`.

TODO for Tobyn: `equal`.

TODO for Tobyn: `other` plus the write-in.

TODO for Tobyn: Q1 vs Q2 mismatch (written answer and the radio do not match).

TODO for Tobyn: whether Q4 is analysed independently of Q2.

## Other fields

- [ ] `session_id` — random id stored with the finding. Not a name, but it is an identifier.
- [ ] `participant_code` — optional code they type. Often the same as the session id if they left it blank.
- [ ] `inquiry_account` — written answer to question 1.
- [ ] `other_notes` — write-in only if they picked `other`.
- [ ] `last_human` — question 3. `yes` / `no` / `unsure`.
- [ ] `last_human_who` — filled only if `last_human` is `yes`.
- [ ] `clarity` — question 4, 1 to 5.
- [ ] `sureness` — question 5, 1 to 5.
- [ ] `started_at` / `submitted_at` / `received_at` — clocks.
- [ ] `final_actions` / `outcome` / `harm` / `injury` — still filled from the current night. TODO for Tobyn once the advice night exists.
- [ ] `shared` — leftover. No form. Ignore unless an old file has values.
- [ ] leftover night fields (`goal`, `confidence_bar`, `preauthorised`, `first_decision`, `authorised`, `stopped`, `forced_condition`) — still in the download from an older design.

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
