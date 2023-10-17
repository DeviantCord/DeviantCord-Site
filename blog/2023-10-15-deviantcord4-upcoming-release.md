---
slug: deviantcord4-upcoming-release
title: DeviantCord 4 Upcoming Release
authors: mriley
tags: [deviantcord4, update]
---

Hello everyone! It has been a long time, and you are all overdue for an update about the current state of DeviantCord, which quite
frankly has been having issues with consistency and deviations being missed. Today I have released a fix for DeviantCord 3 to fix an issue
that was affecting a lot of users, primarily group deviation folders. 
This fix was very easy to fix once I was made aware of it. You should see a significant backlog of deviations being posted
to your servers.

<!--truncate-->

## What happened? Why is it taking so long?
However, this is not the focus of today's post, I want to apologize for the lack of progress on DeviantCord 4. 
DeviantCord 4 initially was supposed to release back in late 2021/Early 2022. However after our primary library (Discord.py)
had ceased development (at the time the maintainer said they were done, but has gone back on this). I had to make 
the difficult decision to rewrite DeviantCord in another library / programming language. 

We would eventually settle on Javacord, but would have to rewrite all functionality of the bot, and the new features
for DeviantCord 4 in Java. Then eventually slash commands were introduced and we had to re-design DeviantCord around it
to not only make it usable, but easy for new users to pick up. Not all artists are computer wizards or know how to use 
command line interfaces with parameters/arguments. 

DeviantCord 4 also had significant breaking backend design changes on how we store, and send data. All of these changes
were made either for reliability reasons, or in order to deliver features that were better then in DeviantCord 3.
The most visable change is that when our deviation update system detects a post by an artist, our new notification system
will tell the bot to send a notification without the bot having to check for changes in the queue. It will effectively 
know if there are new messages to send instead of checking the queue for changes on a schedule. 



Delivering all of these features was a long and tiring tasks for just me to deliver ontop of what was going on in my life. 
From career advancement, to college stuff, to 

## What is changing to prevent this from happening in the future?


## When will DeviantCord 4 release?
I am pleased to announce that I have been making significant progress on DeviantCord 4 and plan on having it released
by the end of the month. As soon as a production build of DeviantCord 4 is ready I will immediately make preperations
to migrate the current bot 

DeviantCord 4, at long last will

## Am I able to track DeviantCord 4's current progress?
