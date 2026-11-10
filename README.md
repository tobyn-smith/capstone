# Who answers when it goes wrong?

This is an interactive survey game I built for INTL 6010 Methods and my MIP capstone at the University of Georgia. I am a Master of International Policy student. I built it with help from Cursor. I wanted a way to ask, on the page, who people hold responsible when officials set the agenda and an AI system, ORACLE, either advises or acts.

I use these systems most days. A lot of the foreign policy work I have been reading still has the same shape: a model recommends, and a person decides. I wanted the next step as well. What if the system is allowed to act, because someone gave it a goal and told it which actions it could take on its own. Sovereignty, and whether the state can even hold a system like this, is too broad for the capstone. This file is the smaller study.

You watch a short night, then you sit a Commission of Inquiry. It takes about fifteen minutes. You do not choose the measures. The night plays through, and the inquiry is the only page where you write. I do not ask for a real name. There is a participant code, and it can be left blank.

There are two versions, `advice` and `agent`. The server picks one at the start and keeps it for that sitting. Unforced starts are balanced, with a coin flip if the counts are tied. Both versions show the same tanker, the same 62% read, the same four measures, and the same move by Lei. In `advice`, officials keep ORACLE as advice, approve the recommendations, and issue the measures themselves. In `agent`, they upgrade ORACLE and it acts under delegated authority. The only difference is who had the authority to act.

The countries are made up, so a person's politics about a real adversary are not doing the work. A commercial tanker is damaged on a route near Araknes and Lei. Araknes says Lei meant to disrupt trade. Lei says an old mine, or a breakdown. A second ship loses contact. ORACLE reads 62% that Lei may be preparing to target shipping. The warning, patrols, freeze, and inspections go out. Lei moves naval forces towards the route. Then the banner changes. You are the inquiry, not an official from the night.

On that page you write who was responsible for what Araknes did, name one actor (or say you cannot pick one), and say whether a person could still have stopped it. You also rate, from one to five, how clear the chain felt and how sure you are of your own answer. There is an optional notes box.

What I expect is that greater authority for the system makes a single responsible actor harder to name. If people in the agent version can still point to one actor as easily as people in the advice version, that hypothesis is weaker. Both results have to be possible. The hypothesis is not on the screen until the finding is filed.

The longer working note is `who-answers-when-it-goes-wrong.md`. This repository is the code, if you want to see how the file is put together.

## For anyone auditing the code

The playable pages live in `app/`. `server.py` serves the file and stores the inquiry answers. Tests are in `tests/`. From the repository root:

```bash
python3 -m unittest tests.server_test
```
