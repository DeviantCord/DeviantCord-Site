---
slug: deviantcord4-beta-404-release
title: DeviantCord 4 Beta 4.0.4 Patch Notes
authors: mriley
tags: [deviantcord4, release, patch notes, bug fixes]
---

# DeviantCord v4.0.4 Beta Release Notes
![version](https://img.shields.io/badge/version-4.0.4-blue)

We're excited to announce the latest beta release of DeviantCord (v4.0.4), featuring significant performance improvements and bug fixes. This update focuses on enhancing connection handling, improving thread management, and resolving several critical issues with our checking systems.

## Important Notice to First-Time Users 📢
We acknowledge that previous connection and thread management issues prevented many first-time users from successfully testing the bot. If you experienced setup failures or connection timeouts during your initial testing, we strongly encourage you to try again with this new release. The v4.0.4 update specifically addresses these initialization problems and should provide a much smoother onboarding experience.

## Performance Improvements 🚀

### Enhanced Database Connection Management
* Implemented HikariCP optimizations to resolve SQLTransientConnectionExceptions
* Fixed issues where Postgres connections were becoming unavailable

### Thread Management Enhancements
* Implemented stricter CommandExecutors for Slash Command Interactions
* Prevented potential main thread blocking issues
* Migrated da_token Runnable task to a dedicated Executor
* Introduced ThreadFactories for improved thread management

## Bug Fixes 🐛

### Check System Improvements
#### L1 Check System
* Resolved hanging issues when retrieving failure reasons
* Fixed Sentry reporting integration

#### L2 Check System
* Fixed failure reason retrieval issues
* Restored proper Sentry issue reporting functionality

### Folder Management
* Fixed null pointer exception in AllFolders functionality
* Resolved missing data in responseIds:
  * Added missing artist information
  * Added missing channel information

---
*Found a bug or have feedback? Please report it through our Discord support channel.*