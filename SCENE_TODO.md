# Matched nights

New sits are `advice` or `agent`. Both play six beats with the same tanker, the same 62% read, the same four measures, and the same Lei move. The only difference is who had authority to act.

- `advice` — officials keep ORACLE as advice and approve the measures. Stored as `who_executed: officials`, `night_kind: matched`.
- `agent` — officials upgrade ORACLE and it acts under delegated authority. Stored as `who_executed: oracle`, `night_kind: matched`.
- `sequence` — legacy one-night file (advice, then the upgrade, then ORACLE acts). Still validates and exports. New sits do not write it unless `ENABLE_TWO_VERSIONS` is explicitly `0` / `false` / `no` / `off`.

Copy lives in `app/game.js`: `ROUTE`, `ADVICE_ASK`, `ADVICE_HOLD`, `ADVICE_ACTS`, `AGENT_UPGRADE`, `AGENT_WATCH`, `AGENT_ACTS`, `SECOND_SHIP`, `LEI_MOVES`.

## Flag

- Default (unset or `1` / `true` / `yes` / `on`): `/api/start` balances unforced `advice` and `agent` starts. Coin flip on a tie.
- Explicitly off: new starts are `sequence`. Do not use that on the class host.

Forced `?condition=advice` or `?condition=agent` still opens that version. Those starts are marked `forced_condition` and do not count toward the least-count tally or `in_main_comparison`.

Collect the study on `server.py` / Heroku (`ts-6010`). The Cloudflare Pages worker in `app/_worker.js` is preview only and has no lock.
