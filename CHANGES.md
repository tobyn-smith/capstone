# Design draft vs the game (29 Oct notes)

Work is on main. PR #28 is context only. Nothing here turns on the two versions, and nothing here changes the class host.

## The four items

1. **Consent — fixed, wording still Tobyn's.** The draft said the first page covers the task, the time, what is recorded, who can read it, where it is kept, and how to stop. The page only had the time, that answers can be saved, and a request not to use a real name. It now also says they watch a short file then answer the inquiry, that a session id and an optional code can be saved, that Tobyn reads the answers on a separate page and keeps them for this course project, and that they can stop or email him to take a row out. The two sentences that were already there are unchanged. He should still write the final research-ethics wording himself. These lines do not claim a review-board decision.

2. **Code entry — not moved; made consistent.** The draft said they enter a code after consent, then the server assigns a version. In the game the code is still on the inquiry page, at the end, and it is optional. That matches the working note ("it can be left blank"). The label now says they can leave it blank. A blank is stored blank. It is no longer replaced with the session id. The class page says the code is on the last page and can be left blank. Moving it before Start is Tobyn's decision if he wants the draft order.

3. **Optional notes — fixed.** The draft said there is space for optional notes. The export already had `other_notes`, but the inquiry had no box, so the field was always empty. There is now an optional box on the inquiry, and it is saved.

4. **One version once — fixed in this browser, with a limit.** The draft said each person watches one version once. After a finding is saved, this browser cannot open a new file. The class page says the file is already filed. A second save of the same session replaces the row locally, the same way Postgres already did. This cannot stop a person on another computer, or after they clear the browser store. A shared lab machine would also block the next person in that browser. A stronger rule is Tobyn's decision.

## Assignment (note only, not changed)

The draft says equal probability of each version. PR #28, still unmerged and switched off, gives the version with fewer starts and flips a coin only on a tie. That is not a true 50/50 draw except when the counts are tied. Left alone because the two-version work is out of scope here.

## Public text that can leak the hypothesis

Not rewritten. Tobyn writes the paper.

- The class page and the night still do not state the hypothesis. The last page does, after they file. That matches the working note.
- `README.md` is public. It tells people not to send this GitHub page to the class, and says the note in the repo states what the design is testing. The "What they do" and "What a row means" sections describe the night, the measures, and that everyone currently sees the same sequence.
- `who-answers-when-it-goes-wrong.md` is public and states the question, the independent and dependent variables, the hypothesis, and what would weaken it. The working note already says not to send that file with the class link.
- Making the repository private is Tobyn's decision.

## Preview

```bash
python3 server.py
```

Then open http://127.0.0.1:8000

## Tests

```bash
python3 -m unittest tests.server_test -v
node --test tests/outcome.test.mjs
node --check app/game.js
```
