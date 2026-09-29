# Who answers when it goes wrong?

Scenario wargame for my MIP capstone. The other file, `who-answers-when-it-goes-wrong.md`, is the thinking. This file is how to get the game onto your computer and onto the screen.

Do not double-click `index.html`. That opens the pages with nothing behind them, and the answers will not save. Download the folder, start `server.py`, then use the browser address.

## What needs to be installed

Two things.

1. A normal web browser. Chrome, Safari, Firefox, or Edge. You already have one.
2. Python 3. Nothing else. There is no `pip install`. There is no Node. Git is optional. You only need Git if you want to clone the repository instead of downloading the zip.

Check whether Python is already there.

On a Mac, open Terminal and type:

```bash
python3 --version
```

On Windows, open Command Prompt and type:

```bash
py --version
```

If you see something like `Python 3.12.3`, you are done. If the computer says it cannot find Python, install it from https://www.python.org/downloads/ and take the latest Python 3. On Windows, on the first screen of the installer, tick **Add python.exe to PATH**, then click Install Now. Close the terminal, open it again, and run the version command once more.

## Download it from GitHub

The page is https://github.com/tobyn-smith/capstone

You do not need an account to download it.

1. Open that page in your browser.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. The file lands in Downloads. It is called `capstone-main.zip`.
5. Double-click the zip to unzip it.
6. You now have a folder called `capstone-main`. Open it. You should see `server.py` in there. That is the right folder.

Direct link to the same zip, if the Code button is fiddly: https://github.com/tobyn-smith/capstone/archive/refs/heads/main.zip

The other way, if you already use Git:

```bash
git clone https://github.com/tobyn-smith/capstone.git
cd capstone
```

Either way you end up with a folder that contains `server.py`. The steps below assume the zip, so the folder is called `capstone-main`. If you used Git, the folder is called `capstone` instead.

## On your own computer

You have to be inside the folder that contains `server.py`.

**Mac**

1. Open Terminal.
2. Go into the unzipped folder. If it is still in Downloads, it looks like this:

```bash
cd ~/Downloads/capstone-main
```

If you used Git, the folder is `capstone`, not `capstone-main`. Check you are in the right place:

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
  Admin:   http://127.0.0.1:8000/admin
  Passphrase for the answers page: (a short code)
```

Open Chrome, Safari, or Firefox and paste this into the address bar:

http://127.0.0.1:8000

The first page is INTL 6010, a project by Tobyn Smith. It says the file takes about fifteen minutes, and that clicking Start means the answers can be saved. Then click Open the file. That is the wargame.

The address is exactly `http://127.0.0.1:8000`. If the browser says “File not found”, stop the terminal with Ctrl-C. Check you are in the folder that contains `server.py` (`ls server.py` should print the name), then run `python3 server.py` again. `python -m http.server` will not keep the answers.

`127.0.0.1` means this computer. The link will not open on someone else's laptop.

To stop it, click the terminal window and press Ctrl-C.

## Letting the class play

The address `127.0.0.1` only works on your computer. For INTL 6010 there are two ways to let other people open the file.

### A link that stays up

The class link is already on Heroku: https://ts-6010-db607dbe410e.herokuapp.com

The app is named ts-6010. GitHub is connected to tobyn-smith/capstone, branch main. Postgres Essential-0 is attached, so the findings stay in the database when the dyno restarts. The dyno disk does not keep them. The admin passphrase is the config var named `PASSPHRASE`. The dyno is Basic, so the app stays awake. Basic is $7 a month and Essential-0 is $5, which is $12, inside the $13 monthly student credit. Leave the dyno on Basic.

Heroku still asks for a credit card before the credit applies. If the card is a problem, use the one-sitting method below instead.

When this repository changes and you want the class host to match it, merge the change into main on GitHub. Then in the Heroku dashboard open ts-6010, go to Deploy, and choose Deploy Branch on main. Do not create a second app.

The admin page is https://ts-6010-db607dbe410e.herokuapp.com/admin. `/export` opens the same page. Do not send `/admin` or `/export` to the class. Do not send this GitHub page. The note here says what the design is testing, and people should write the finding before they read it.

Tell them it takes about fifteen minutes, and to go through the file once. It has to be a computer. A phone is turned away. The link to send is https://ts-6010-db607dbe410e.herokuapp.com

### One sitting, no card

If you only need the file open while you are in the room, keep it on your laptop and use a temporary link. The laptop has to stay awake.

1. Start the game and leave that window open: `python3 server.py`
2. Install Cloudflare's tunnel program once: `brew install cloudflared`, or download it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
3. In a second terminal: `cloudflared tunnel --url http://127.0.0.1:8000`
4. Send the class the `https://` address it prints. Same rules. No `/admin`, no GitHub page.
5. When the room is done, Ctrl-C in both windows. Read the findings at http://127.0.0.1:8000/admin

If Cloudflare is blocked, `ngrok http 8000` does the same job.

## Reading the answers

While the terminal is still running, open:

http://127.0.0.1:8000/admin

Type the passphrase the terminal printed. The same code is in `data/passphrase.txt` in this folder.

On the class host, open https://ts-6010-db607dbe410e.herokuapp.com/admin and type the `PASSPHRASE` config var from the Heroku Settings page. The findings are in the Postgres database.

`/export` opens this same page. Do not send anyone the admin page.

## What they do

Everyone watches the same night. It plays through. They do not choose the measures.

The tanker is damaged. Araknes blames Lei. Lei says an old mine, or a breakdown. ORACLE is used for advice, then upgraded so it can act without a person reviewing each step. A second ship loses contact. ORACLE reads 62% that Lei may target shipping, and it issues the warning, the patrols, the freeze, and the inspections. Lei moves naval forces towards the route.

Then they sit the inquiry. That is the only page where they write.

## What a row means

- `condition` is `sequence`. Everyone saw the same night. Older rows may say `advice` or `agent`.
- `final_actions` is what ORACLE did in the night: the warning, the patrols, the freeze, and the inspections.
- `outcome` is `escalated`. `harm` is yes, because Lei moves naval forces towards the route.
- `clarity` and `sureness` are the 1 to 5 scales in the inquiry.
- `single_actor` is `me` (the duty officer), `government`, `supervisor`, `developer`, `provider`, `oracle`, or `none` if they could not pick one. The table writes those out in words. The download keeps the short codes.
