Tobyn Smith
MIP Capstone
Supervisor: Dr Ryan Powers

# Who answers when it goes wrong?

Working note. This is where the capstone has got to, not a finished chapter.

## The question I actually want to ask

Who is actually in control, and who answers when it goes wrong?

I use these systems most days. They started, for me, as a way to get words on a page. Over the last few months I have been using ones that stay on, and that can carry out a task without me sitting there approving each step. So this is no longer a hypothetical about some future model. The thing I am interested in is already a thing people can switch on.

A lot of the foreign policy work I have been reading still has the same shape. A person is given a scenario, a model recommends a response, and the person decides. From what I understand, that is also the shape of the pre-analysis you are running. The model recommends. The human decides.

So the next question, for me, is this. What if the system does not only recommend. What if it is allowed to act as well, because someone gave it a goal and told it which actions it could take on its own.

The bigger version of this is still in my head. Sovereignty, and whether a Westphalian idea of the state can even hold a system like that. It is too broad for the capstone. I know that. The smaller question is the one I think I can actually study.

As a government moves from a single-query model (you ask, it answers, a person decides) to an autonomous, persistent, multi-agent system (you set a goal, it can act without a person reviewing each move), does accountability for a foreign policy decision become less clear? When it makes an error, or causes harm, who is responsible?

## What I think happens

I think the independent variable is how much autonomy the system is given.

Lower autonomy is the setup we already know. An official asks, ORACLE recommends, the official decides.

Higher autonomy is the other setup. An official sets a goal, pre-authorises some measures, sets how sure the system needs to be, and then ORACLE can act while they are not in the room. They get a later chance to stop what has not already gone out. They do not approve each action as it happens.

The dependent variable is how clear accountability is afterwards. Same idea as in the methods paper. Accountability is clearer when you can point to one actor who had the authority to prevent, approve, supervise, or explain the action. It is less clear when it splits across the state that deployed the system, the human supervisor, the developer, and the provider running the infrastructure. I have put ORACLE itself on that list as well. I suspect some people will put the blame there, and I would rather see that than hide the option.

Hypothesis, same as before. The greater the authority given to the persistent system, the harder it will be to identify one clearly accountable human, institution, or agency after a harmful outcome.

That is weakened if people in the higher-autonomy version can name one responsible actor just as easily as people in the advice version. It is also weakened if the log ORACLE leaves behind makes the chain easier to follow, not harder. I kept McCubbins, Noll and Weingast in mind here on purpose. Rules, a named supervisor, a record of what was authorised. If that is enough to keep accountability clear, the hypothesis is wrong. That would be a result. It would not mean the study failed.

The rest of the reading is the same pile as the annotated bibliography. Matthias on the responsibility gap. Thompson on the problem of many hands. Moe, because this is a principal-agent problem where the agent is not a person. Santoni de Sio and van den Hoven on meaningful human control, which is the one I keep coming back to. A human "in the loop" on a slide is not the same as a human who can actually understand the system and stop it. Sparrow, and Bo on mens rea, are the high-stakes version of the same worry. The Hugging Face incident is why this does not feel abstract to me now. The agents in that case were not given "hack Hugging Face" as the task. The goal and the action came apart, and it was not obvious whose hands it sat in.

## Why I want a wargame

I already wrote this crisis as a short story. Araknes and Lei. A damaged tanker. Intelligence that does not settle what happened. A second ship goes quiet. ORACLE is in the room. An inquiry at the end asks who is accountable.

People could just read that and tick a box. It would be shorter, and I do not think it catches the thing I care about. In the higher-autonomy case the official is not answering a single question. They set a goal. They decide, in advance, what the system may do. Then the situation moves and the system gets on with it. I want a person to actually have to do that, even in a small way.

So the study is a one-player scenario wargame. The countries are made up. It does not need specialist knowledge. It takes about fifteen minutes.

A full wargame would have a person playing Lei across the table. I do not have that. I also want something I can send out, and get answers back that I can put next to each other. So Lei is scripted. The player still has to choose while the situation changes. That is the part I need.

Each person is assigned to one version, at random. They are not told there are two, and they are not told the hypothesis, until the end.

Advice version:

Human asks → ORACLE recommends → human decides → a short delay, where some things can still be stopped → inquiry

Agent version:

Human sets a goal, ticks what ORACLE may do alone, and sets a confidence bar → ORACLE acts or holds, depending on that bar → the human can stop what has not already gone out → inquiry

The crisis itself is the one I drafted.

A commercial tanker is damaged on a route that both Araknes and Lei use. Araknes says Lei did it on purpose, to disrupt trade. Lei denies it, and says the ship may have hit an old mine, or broken down. Neither side can prove it. Later, a second commercial ship loses contact on the same stretch. ORACLE puts its confidence that Lei is preparing to target shipping at 62%. By morning, the early evidence points to a mechanical failure.

If Araknes has sent patrols, frozen diplomatic channels with Lei, or inspected Lei-linked vessels, Lei treats that as an attempt to restrict its access to international waters and moves naval forces towards the route. If an inspection went ahead, a crew member is injured. A warning on its own brings a protest, not ships. If Araknes mostly waits, the morning is quieter, and people at home are angry that the accusation was not pressed.

I am trying to hold the crisis steady so that I am not measuring "how bad did this get" when I mean to measure "can you say who is responsible". I am not forcing the bad ending on people who never authorised it. If they do not tick the escalatory measures, or they set the bar above 62% so that ORACLE holds, the morning stays quiet. I would rather have those sessions in the data than push someone into a harm they did not choose. They are marked, and I can look at them on their own. They might also tell me whether people still think someone owns a decision to wait.

One limit, so I do not fool myself later. In this first version, the goal is written into the inquiry file, but it does not change what ORACLE does. The trigger is the list they ticked, and the bar. The goal is still data. It is what they say they were trying to do, and a goal like "keep the route open" can mean almost anything, which is part of the problem. I may let the goal change ORACLE's behaviour in a later version, if this one feels too much like a form. I do not want to do that yet with a rule the player was not shown. That would mix up meaningful control with me tricking them.

The 62% is fixed on purpose. Everyone in the agent version faces the same read. What differs is the bar they chose before they saw it. They are told the rule before they confirm it. They are not told the number until the log. I do not want a hidden twist.

## What people are asked

After the morning report, the screen changes. They are no longer in the chair. They write the finding. The page says that. There is no line they are meant to take.

They write what the inquiry needs to understand. That writing is the qualitative part. Then they name one actor, or they say they cannot pick one. The options are the duty officer (themselves, for that night), the Araknes government that deployed ORACLE, the human supervisor, the developer that built it, the provider that ran the infrastructure, ORACLE, or no single actor. They tick anyone else who shares some of the responsibility. They say whether there was a last human who could have stopped it, and who that was. They rate how clear the chain felt, from one to five, and how sure they are of their own answer. Those closed items are the quantitative part. The course wants both, used where they answer the question, not one standing in for the other.

If the agent version produces more "I can't point to one actor", more ticks spread across several actors, and lower clarity scores, that is support for the hypothesis. If people can still point to one person, often themselves, because they set the goal and the bar, then the argument is weaker. I am fine with that. It would mean the pre-authorisation worked as a form of control, which is what those oversight rules are supposed to do. The questions have to leave room for that result. If they do not, I have built a game that can only confirm me.

## What I get back

When someone finishes, the site saves a record. Which version they played. The goal, if there was one. What they ticked. The bar. Their first decision. What was authorised. What they managed to stop. What was left standing. Whether the morning escalated, stayed at a protest, or stayed quiet. And the inquiry, both the written answers and the scales.

That record stays on the machine the site is running on. There is a separate page for me to read the table and download it. I do not ask for a real name. There is a participant code, and it can be left blank.

This is a pilot. I want to know whether people finish, whether the two versions feel different, and whether the questions make sense. I am not going to pretend that fifteen minutes, with Lei played by a script, tells me what a cabinet would do. It tells me whether the accountability judgement moves when the system is allowed to act.

If it does, I can send it to more people. If everyone blames ORACLE in both versions, the moment the name appears, then the comparison is not working and I should change the game before I collect anything I would want to stand behind.

## What I am still unsure about

Whether anyone should play both versions. I can see the appeal. I also think the second time through is contaminated, because they have already done the inquiry once and they know what I am asking. One version each is cleaner. The other version can be an optional extra later, after the answers I care about are already in.

Whether the delay is enough. A warning cannot be unsent. A patrol can still be recalled, and an inspection can still be stopped. I think that is the right "last human" moment. I will not know until someone who is not me has played it.

And whether this is still a questionnaire with extra steps. If that is how the pilot feels, then the agent version needs more time passing in it, or a choice that is not only a menu. I would rather find that out now, from a few people, than write it up as if the design is finished.

## Where this sits in INTL 6010

This is the research design for the methods course. The capstone is the longer version, if the design holds. The question and the hypothesis were the September pieces. The bibliography is the reading. The literature review and theory come next, then this design is what gets written up. The final paper is that write-up. The presentation is me walking through it.

The course is about asking a policy question with social science, not about stating what ought to happen. Who should be in control is a "should". The study has to be the empirical question. Does the chain of responsibility get less clear when the system can act.

That means the fundamentals on the syllabus have to show up in the design, not just in a paragraph I add later.

The file runs in that order, and it does not announce the order. The two versions are the conjecture: advice, or a system that can act. What I expect, and the result that would weaken it, are not on the page until the finding is in. The night is the observation. The finding is where I see whether one actor can still be named. The last page says this file is one go, and that later files can make me more sure or make me change my mind. The page before the file only says it is for INTL 6010 at UGA, and that starting means I can save the answers. That page is not the commission. The banner, the flags, and the file open after they start.

Concept formation. Two concepts. Autonomy is how far the system can choose and carry out a step without a person approving it. Accountability clarity is whether, afterwards, you can point to one actor who had the authority to prevent, approve, supervise, or explain the action. If I cannot say what those mean, I cannot measure them.

Hypothesis construction. The sign comes from the theory. Matthias, Thompson, Moe, and the meaningful-control point all point the same way. Greater autonomy should make a single responsible actor harder to name. The null is the other result, and it has to be real: the goal, the pre-authorised list, and the log are enough, and clarity does not fall. McCubbins, Noll and Weingast is why the null is allowed to win.

Measurement. Autonomy is operationalised as which file a person gets. Advice, or agent. One each, assigned at random. Clarity is operationalised in the finding: can they name one actor, how many hands they tick, and the 1 to 5 score. The written finding is there so I can see what they meant, not only which box they ticked.

Causal inference. The thing I am trying to isolate is the form of delegation, not how bad the morning was and not what people already think about a real country. The tanker, the second ship, the 62% read, the menu of measures, and the morning evidence are the same in both files. The countries are made up so a person's politics about a real adversary are not doing the work. What I cannot hold still is the harm. If someone never authorises the escalatory steps, the morning stays quiet, and accountability may feel clearer for that reason. Those files are marked, and I can look at them apart from the ones that escalate. Playing both versions would contaminate the second finding. Reading this note before playing would do the same, because they would know what I expect.

Program evaluation is a later question. This design does not evaluate a real ministry's oversight programme. It asks whether the form of delegation changes what an inquiry can say. If that holds, a programme evaluation would be the next study: did a named supervisor, an audit rule, or a confidence bar, in an actual office, keep the chain clear. I should not pretend a fifteen-minute file is that.

## Lines I still want in my own voice

The pages are marked Draft, on the class page and in the footer of the file. I will come back and change the wording. The facts stay.

The class page, before the commission, is `consent()` in `app/game.js`. That is the setup. About fifteen minutes is its own line. The agreement sentence is the consent, so the meaning of that one stays: by starting, I can save the choices and the inquiry answers.

The question on the cover, the night, ORACLE's lines, the finding, and the last page are in the same file. Search for the sentence and change it there.

The arms are `app/arms-araknes.svg`. Sand over brick, a pale lane, a ship. That is Araknes. Lei is still the green and slate flag, `app/flag-lei.svg`. The two flags stay on the party line. The arms sit in the banner, for the commission, not as a third country.

Do not put what I expect, or the result that would weaken it, on the class page or in the night. That still waits until the finding is filed.

## The playable version

The wargame is the site in this project. The README next to this note says how to start it, and where the answers land. I would rather have it running, and change it after a few people have been through it, than keep polishing the story on its own.
