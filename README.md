# Who answers when it goes wrong?

Scenario wargame for my MIP capstone. The other file, `who-answers-when-it-goes-wrong.md`, is the thinking. This file is how to get the game on screen.

Do not double-click `index.html`. That opens the pages with nothing behind them, and the answers will not save. Start it the way below, then use the browser address.

## On your own computer

You need this folder on your machine. It has to be the folder that contains `server.py`. You also need Python, which is already on most Macs.

**Mac**

1. Open Terminal.
2. Go into the folder. If the folder is in Downloads, it looks like this:

```bash
cd ~/Downloads/capstone
```

If you cloned it somewhere else, use that path instead. Check you are in the right place:

```bash
ls server.py
```

You should see `server.py`. If you see "No such file", you are in the wrong folder.

3. Start the game:

```bash
python3 server.py
```

If the Mac says `python3` is not found, try `python server.py`.

**Windows**

1. Open the folder in File Explorer.
2. Click the address bar, type `cmd`, and press Enter. A black window opens already inside the folder.
3. Start the game:

```bash
py server.py
```

If that fails, try `python server.py`.

## What you should see

Leave that window open. It is the game running. It prints:

```text
The wargame is running. Leave this window open.

  Play:    http://127.0.0.1:8000
  Answers: http://127.0.0.1:8000/export
  Passphrase for the answers page: (a short code)
```

Open Chrome, Safari, or Firefox and paste this into the address bar:

http://127.0.0.1:8000

Click Begin. That is the wargame. It takes about fifteen minutes.

`127.0.0.1` means this computer. The link will not open on someone else's laptop. For now, play it on the machine where you started it. If you want other people to play from their own computers, the game has to be put somewhere they can reach. I have not done that yet.

To stop it, click the terminal window and press Ctrl-C.

## Reading the answers

While the terminal is still running, open:

http://127.0.0.1:8000/export

Type the passphrase from the terminal. The same code is in `data/passphrase.txt` in this folder. Then you can see the table, or download it.

Do not send anyone the export page.

## Trying both versions yourself

The game gives each player one version. To force one while you are checking it:

- http://127.0.0.1:8000/?condition=advice
- http://127.0.0.1:8000/?condition=agent

Advice: ORACLE recommends, and you decide. Agent: you set the goal and the limits, and ORACLE can act.

Do not send those two links to participants. A normal link, with nothing after the `8000`, assigns a version for you.

## What a row means

- `condition` is `advice` or `agent`.
- `confidence_bar` is the bar they set in the agent version. ORACLE's read is always 62%.
- `final_actions` is what was still standing after they had a chance to stop a patrol or an inspection. A warning and a diplomatic freeze cannot be unsent.
- `outcome` is `escalated`, `political`, or `contained`.
- `harm` is yes when Lei moves naval forces towards the route.
- `clarity` and `sureness` are the 1 to 5 scales in the inquiry.
- `single_actor` is `me`, `government`, `supervisor`, `developer`, `provider`, `oracle`, or `none` if they could not pick one. The table writes those out in words. The download keeps the short codes.
