# Who answers when it goes wrong?

Scenario wargame for my MIP capstone. The note next to this file is the thinking. This file is just how to run the game.

## Run it

```bash
python3 server.py
```

Then open http://127.0.0.1:8000

Someone plays one version. At the end, the inquiry answers are saved in `data/responses.jsonl`.

To read them, open http://127.0.0.1:8000/export

The passphrase is printed in the terminal when the server starts. It is also in `data/passphrase.txt`. That file is not part of the project. Do not send people the export page.

If you add `?condition=advice` or `?condition=agent` to the link, that forces a version, so you can try both. Those plays are marked. Do not send a forced link to participants. Leave the assignment to the server, which alternates the two versions.

## What a row means

- `condition` is `advice` (ORACLE recommends, the person decides) or `agent` (they set the goal and the limits, ORACLE can act).
- `confidence_bar` is the bar they set in the agent version. ORACLE's read is always 62%.
- `final_actions` is what was still standing after they had a chance to stop a patrol or an inspection. A warning and a diplomatic freeze cannot be unsent.
- `outcome` is `escalated`, `political`, or `contained`.
- `harm` is true when Lei moves naval forces towards the route.
- `clarity` and `sureness` are the 1 to 5 scales in the inquiry.
- `single_actor` is `me`, `government`, `supervisor`, `developer`, `provider`, `oracle`, or `none` if they could not pick one. The table writes those out in words. The download keeps the short codes.
