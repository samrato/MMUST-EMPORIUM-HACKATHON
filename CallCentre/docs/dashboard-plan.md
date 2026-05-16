# Future React Dashboard Plan

The first version uses FreePBX as the UI. A later version can add a local React dashboard with this shape:

```text
Dashboard
├── Total Calls Today
├── Active Calls
├── Missed Calls
├── Available Agents
└── Call Queue Status
```

Main pages:

```text
1. Dashboard
2. Agents
3. Call Queue
4. IVR Menu
5. Call Logs
6. Recordings
7. Settings
```

Example dashboard:

```text
------------------------------------------------
| Local Call Center Dashboard                  |
------------------------------------------------
| Active Calls: 2 | Agents Online: 3 | Missed: 1 |
------------------------------------------------

Support Queue
--------------------------------
Agent 1001    Online     Idle
Agent 1002    Online     Busy
Agent 1003    Offline    -

Recent Calls
--------------------------------
1001 -> 1002      Completed
1003 -> 600       Missed
1002 -> 1001      Recorded
```

## Data Sources

Use FreePBX/Asterisk as the source of truth:

- Call logs: MariaDB `asteriskcdrdb.cdr`.
- Queue activity: Asterisk queue log and AMI `QueueStatus`.
- Active calls: AMI `CoreShowChannels`.
- Extension/agent status: AMI `PJSIPShowEndpoint`, `QueueStatus`, and device state events.
- Recordings: files under `/var/spool/asterisk/monitor`, exposed locally as `data/recordings`.

## Suggested Next Architecture

```text
React UI -> Node/Express API -> MariaDB + Asterisk AMI + recordings folder
```

Keep the dashboard read-only at first. Do not let the custom UI edit FreePBX configuration until authentication and authorization are added.
