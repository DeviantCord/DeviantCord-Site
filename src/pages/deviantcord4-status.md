## Current TODO List for DeviantCord 4
**Last Updated October 16th, 2023**

In order to be transparent with the progress for DeviantCord 4, this page was created and will be updated accordingly
with the current status of DeviantCord 4's release

### Deviant DataBase Service (Deviant DBS) TODO
Deviant-DBS is the backend component that fetches and tracks updates for artists deviations, journals, 
and status updates. Currently it is being updated to utilize the new CockroachDB component and RabbitMQ messaging system.

Implement Current needed data models:
- StatusNotification
- JournalNotification
- Deviation Notification

- Reworked statusNotifications to use RMQ. Check Journal Notification

- Implement Logic to export missed jobs as flat files (Implemented for Journal Notifications
- Implement Logic to import flat file missed jobs

#### Potential Bugs:

- Models may need to use Dict instead of List for serializeData method. (DONE IN JOURNAL AND STATUS NOTIFICATION)

#### Nice to Have (NOT REQUIRED FOR LAUNCH):
- Implement Logging (should be able to skip after verifying that Sentry alerts work properly!)
- Disable Json Logging

### Javacord TODO Stuff:
- Update Javacord dependency
- Fix and Deprecated Methods
- Fix the Bug with all required parameters being optional, this sends the wrong message
- Add Command to find invalid channels and move it to another channel

### DeviantCord Docs:
- Update Command Lists (Easy)

### Infrastructure Stuff:
- Transfer Old DeviantCord 3 Postgres to CockroachDB for DeviantCord 4 (Final Infrastructure Online)
- Ensure RMQ is online (Online, Replication not needed at this stage, it can be moved over later)
- Turn on DeviantCord 4


## Phase 2:
- Write Self Hosted Documentation
- Write DockerFiles for DeviantCord 4
- Write PageOps (Another piece of software for monitoring DeviantCord Docker Containers)
  -TBD