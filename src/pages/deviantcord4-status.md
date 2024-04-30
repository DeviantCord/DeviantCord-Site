## Current TODO List for DeviantCord 4
**Last Updated Apr 26th, 2024**

In order to be transparent with the progress for DeviantCord 4, this page was created and will be updated accordingly
with the current status of DeviantCord 4's release

### Deviant DataBase Service (Deviant DBS) TODO
Deviant-DBS is the backend component that fetches and tracks updates for artists deviations, journals, 
and status updates. Currently, it is being updated to utilize the new CockroachDB component and RabbitMQ messaging system.

Implement Current needed data models:
- ~~StatusNotification~~
- ~~JournalNotification~~
- Deviation Notification
- ~~Listener SQL Error Fallback (Flat File retry) via DBS Overseer~~

- Reworked statusNotifications to use RMQ. Check Journal Notification

- ~~Implement Logic to export missed jobs as flat files (Implemented for Journal Notifications)~~
- Implement Logic to import flat file missed jobs

#### Potential Bugs:

- ~~Models may need to use Dict instead of List for serializeData method. (DONE IN JOURNAL AND STATUS NOTIFICATION)~~

### Javacord TODO Stuff:
-  ~~Update Javacord dependency~~
-  ~~Fix and Deprecated Methods~~
- ~~Fix the Bug with all required parameters being optional, this sends the wrong message~~


### DeviantCord Docs:
- Update Command Lists (Easy)

### Infrastructure Stuff:
-  ~~Transfer Old DeviantCord 3 Postgres to CockroachDB for DeviantCord 4 (Final Infrastructure Online)~~
-  ~~Ensure RMQ is online (Online, Replication not needed at this stage, it can be moved over later)~~
-  ~~CockroachDB Cluster Onine~~
- ~~Setup DeviantCord KeyDB x2 Instances~~
- ~~Setup DLS KeyDB x2 Instances~~ 
- Get DLS working
- Fix any found DLS bugs
- Turn on DeviantCord 4

## Phase 2: Testing Period
Allow those who have used the bot previously to start using it. We will not advertise the bot until after a couple weeks
of testing. 
- Add Command to find invalid channels and move it to another channel

## Phase 3:
- Write Self Hosted Documentation
- Write DockerFiles for DeviantCord 4
- Write PageOps (Another piece of software for monitoring DeviantCord Docker Containers)
  -TBD
