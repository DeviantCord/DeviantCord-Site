---
slug: deviantcord4-upcoming-release
title: DeviantCord 4 Upcoming Release
authors: mriley
tags: [deviantcord4, update]
---

Hello everyone! It has been a long time, and you are all overdue for an update about the current state of DeviantCord, which quite
frankly has been having a lot of issues with consistency and deviations being missed. In this post I will be explaining
the current status of the project, the issues we experienced during DeviantCord 4's development and how we are planning
on handling things moving forward to prevent this period of stagnation after the release of DeviantCord 4. 

I will also mention, that for users of DeviantCord 3. Today I have released a fix for DeviantCord 3 to fix an issue
that was affecting a lot of users, primarily it prevented group deviation folders from posting. 
This fix was very easy to fix once I was made aware of it. You should see a significant backlog of deviations being posted
to your servers posted last night.

<!--truncate-->

## What happened? Why is it taking so long?
Again, I want to apologize for the lack of progress on DeviantCord 4. 
DeviantCord 4 initially was supposed to release back in late 2021/Early 2022. However, after our primary library 
(Discord.py) had ceased development (at the time the maintainer said they were done, but has gone back on this about 
half a year or more later. I don't remember the exact time). I had to make 
the difficult decision to rewrite DeviantCord in another library / programming language. 


To explain how the discontinuation of development on Discord.py affected us, I did at some point have a version of 
DeviantCord 4 written with Discord.py, that 
introduced new features, but was not using Slash Commands. It introduced localization of new languages, status updates,
and more. I had spent a significant amount of time developing this version. 
Then to sudden be told that the library that powered the bot had an uncertain future, was unmotivating.
To make sure that any future efforts would not be put to waste, we started the necessary work to figure out
 what library would be the replacement to create DeviantCord on, we eventually settled on Javacord, which is programmed
using Java. 

With the project now using Javacord, now the project would have to rewrite all functionality of the bot, as well as 
the new features for DeviantCord 4 in Java. Then eventually slash commands were introduced, and it was decided to 
re-design DeviantCord around it to not only make it usable, but easy for new users to pick up. Not all artists are computer wizards or know how to use
command line interfaces with parameters/arguments. Which was one of the biggest new user experience issues that we 
encountered.

A timer would then set by Discord, who informed developers that they would have to adapt to Slash Commands by a set date
for public bots on a certain number of servers. We would unfortunately would not make that deadline. 

With the rewrite of V4, I had made the decision to make  backend design changes on how we store,
and send data. All of these changes were made either for reliability reasons and to make DeviantCord more towards what 
I had envisioned the final product to become. 
Rather than significantly re-work DeviantCord again in a later date, I had made the decision to just apply those changes
now.  The most visable change is that when our deviation update system detects a post by an artist, our new notification
system will tell the bot to send a notification without the bot having to check for changes in the queue.
It will effectively know if there are new messages to send instead of checking the queue for changes on a schedule. 

Working through these setbacks was not only time-consuming, but also led to burn out. It did not help that having to 
rework all of these features, and implementing the needed backend changes caused the scope of the V4 to keep expanding.
Even if it couldn't be helped. I kept adding more and more to V4. Which led to the current state of DeviantCord 3,
which again I apologize for, it's not the state I want it in, not even close.

In July 2022 I started a new position as an Engineer at Platform.sh, and after half a year I had the opportunity to
work with many of the other times in a much more personal capacity. I've told a few about this when I got the job offer,
that my chance to work at Platform.sh was unlike anything I had done in my career. Finally working on Cloud Stuff.
I didn't know what to expect, it was new territory for me. I was excited and terrified.  As such I gave it my all, and
time was spent focusing on Platform.sh and my personal life in this new chapter. I attended 3 conferences that required significant
travel in April, and May of this year as my time off as well to get more acquainted with the Python community. It wasn't 
until I had a real vacation this October that I managed to feel motivated to started making significant progress again.

**I am not giving up on DeviantCord.**




## What is changing to prevent this from happening in the future?
Moving forward after the release of DeviantCord 4, we will not be working on significant bot changes, and backend
changes at the same time. To prevent the scope of releases from becoming to large for a single person to handle. 
I will also be managing my time better with projects and work in general. 

In the instance where functionality is broken for users, we will be approaching this differently as well. 
If functionality of the bot breaks, we will work on restoring the functionality, In the case of DeviantCord when slash commands became mandatory, and
DeviantCord 4 wasn't close to being released, we should have released DeviantCord 3.1 as a way to keep the bot available to 
all users.

If Discord ever decides to pull something like this that makes the current version of the bot unusable, we will stop all
efforts and immediately move to get the current version up and running. This should have been a given, and I'm sorry we
didn't make the right choice here.

## When will DeviantCord 4 release?
I am pleased to announce that I have been making significant progress on DeviantCord 4 and plan on having it released
by Mid-November. However, it could happen soon, as soon as a production build of DeviantCord 4 is ready I will immediately make preperations
to migrate the current bot and post an announcement here and in Discord.


## Am I able to track DeviantCord 4's current progress?
Yes! As part of my mission to be more transparent, I have set up a page on here that will be updated with the current
todo list for DeviantCord 4. You can find more information on our status page [here](https://deviantcord.com/deviantcord4-status)

## Closing Thoughts ##
I hope this was insightful. The purpose of this post is not to complain, but to provide insight on what has happened.
Moving forward I aim to be more transparent with you all regarding the Bot. Thank you for reading. 