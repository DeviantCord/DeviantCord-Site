---
sidebar_position: 2
---

# Admin Commands

| Command | Description                           | Uses Parameters | Parameters |
|---------|---------------------------------------|--------------------------------------|------------|
| addfolder   | Adds folder listener for the provided artist and folder | Yes             | artist, folder, channel            |
| addallfolder  | Adds a folder listener for any deviations posted by an artist | Yes | artist, channel |
| addjournal   | Adds a journal listener for any journals posted by an artist      | Yes | artist, channel |
| addstatus   | Adds a status listener for any status messages posted by an artist      | Yes | artist, channel |
| deletefolder   | Deletes a folder listener      | No             |            |
| deletejournal   | Deletes a journal listener      | No             |            |
| deletestatus   | Deletes a status listener      | No             |            |
| updateinverse   | Updates the Inverse property for a folder listener      | No             |            |
| updatechannel   | Updates the channel for a listener      | Yes             | channel (of current listener)           |
| setuprole   | Sets the minimum role required to use the bot. (Requires Administrator permissions)      | No             |            |
