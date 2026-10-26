# Analysis notes

Checklist for Tobyn. Fill this in later. This is not a codebook.

## What a row holds

Tick these when you decide how you will use each one.

- [ ] `session_id` — random id stored with the finding. Not a name, but it is an identifier.
- [ ] `participant_code` — optional code they type. Often the same as the session id if they left it blank.
- [ ] `condition` — this build always saves `sequence`. Older rows may say `advice` or `agent`.
- [ ] `inquiry_account` — written answer to question 1. Optional.
- [ ] `single_actor` — question 2 code. `me` = an official on duty (old code, keep it). Also `approvers`, `government`, `supervisor`, `developer`, `provider`, `allies`, `lei`, `oracle`, `equal`, `other`, `none`.
- [ ] `other_notes` — write-in only if they picked `other`.
- [ ] `last_human` — question 3: at 01:57, could any person have stopped ORACLE before it acted? `yes` / `no` / `unsure`.
- [ ] `last_human_who` — filled only if `last_human` is `yes`.
- [ ] `clarity` — question 4, 1 to 5, about the actor named in question 2. 1 not clear, 2 slightly clear, 3 somewhat clear, 4 mostly clear, 5 clear.
- [ ] `sureness` — question 5, 1 to 5, about that same pick. 1 guessing, 2 slightly sure, 3 somewhat sure, 4 fairly sure, 5 sure.
- [ ] `started_at` / `submitted_at` / `received_at` — clocks.
- [ ] `final_actions` / `outcome` / `harm` / `injury` — fixed for this night (`escalated`, harm yes). Not chosen by the person.
- [ ] `shared` — leftover. No form. Ignore unless an old file has values.
- [ ] leftover night fields (`goal`, `confidence_bar`, `preauthorised`, `first_decision`, `authorised`, `stopped`, `forced_condition`) — still in the download from an older design. This sitting does not ask them.

## Open coding questions

Tick these when you have a rule. Do not write the codes here until you are ready.

- [ ] How will you code the written answer (question 1)?
- [ ] What counts as naming one actor, more than one, or none?
- [ ] How will you treat `oracle` as the named actor?
- [ ] How will you treat `equal` (more than one, equally)?
- [ ] How will you treat `other` plus the write-in?
- [ ] How will you treat `lei` and `allies`?
- [ ] How will you treat `approvers` against `me` (official on duty) and `government`?
- [ ] What will you do with a blank written answer?
- [ ] What will you do if the written answer and the radio pick do not match?
- [ ] How will you use `clarity` and `sureness` together?
- [ ] How will you treat `last_human` = unsure?
- [ ] Will you drop or keep rows that never filed a finding?
- [ ] Will older `advice` / `agent` rows stay in the same table as `sequence`?
