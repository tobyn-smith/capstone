# Advice night — lines Tobyn writes

The live file does not show placeholder text. `ENABLE_TWO_VERSIONS` is off unless you set it. New sits then get `agent` and the night you already wrote.

Set `ENABLE_TWO_VERSIONS=1` only after you write the advice night. Do not turn it on for the class with this stub.

The `agent` night is the six scenes already in `app/game.js` (`SCENES`). No new words were added there.

The `advice` night, when the flag is on, reuses only two of your scenes. Everything else is missing until you write it.

## Already reused (your words, do not need rewriting)

- Scene 1, The route — `app/game.js` `SCENES[0]` lines 22–30
- Scene 2, Advice — `app/game.js` `SCENES[1]` lines 32–45
- Inquiry file panel, first line only — `app/game.js` `fileLines()` "Officials asked ORACLE for advice, and chose whether to act."

## You write (advice version)

Put your sentences in `app/game.js` in `nightScenes()` for `condition === "advice"`. Keep your voice. Do not leave bracket notes on the class link.

1. After the advice scene: what the official decided, and that a person chose whether to act. (Your current scene 3 is the upgrade. That is the agent night.)
2. The second ship, if that beat is in the advice night. (Your current scene 4 is `SCENES[3]`.)
3. What was done, if a person did it. (Your current scene 5 is ORACLE acting. That is the agent night.)
4. Lei's move, if you want that beat on the advice night. You can reuse `SCENES[5]` if those lines still fit. That is your call.
5. Inquiry file panel lines for the advice night after the first line. `fileLines()` in `app/game.js`.
6. Last page, the "I think that..." sentence, if you want one for the advice night. That line is skipped for `advice` so we did not invent one. `debrief()` in `app/game.js`.

## Agent night (already on the page)

TODO for Tobyn: keep all six scenes as the agent night, or write a shorter agent night. Not decided here.

## Flag

- Off (default): `/api/start` assigns `agent`. People see your current night.
- On: `/api/start` balances `advice` and `agent`. Advice people only see scenes 1–2 until you add more.
