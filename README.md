# DevTrack AI

A responsive, browser-based learning and coding progress tracker.

## Features

- Automatically generates a daily checklist based on the saved study timetable.
- Simple checkboxes for planned tasks; optional manual tasks remain available.
- Learning progress by course name and completed/total steps (for example, freeCodeCamp JavaScript steps 12/47).
- LeetCode difficulty cycle: Days 1–10 Easy, Day 11 Medium, Days 12–21 Easy, Day 22 Medium, Day 23 Hard attempt.
- LeetCode profile setting prefilled with `https://leetcode.com/u/aditya__bisht/`.
- Optional attempt to check recent accepted LeetCode submissions through the public GraphQL endpoint.
- Browser reminder settings and an in-app notification feed.
- Weekly review, recent activity, and JSON backup import/export.
- Local browser storage; no build step or API key is required.

## Run locally

Open `index.html` in a modern browser. No build step or dependencies are required.

## LeetCode verification limits

The app tries to query recent accepted submissions from LeetCode's public GraphQL endpoint. LeetCode may block browser requests, change its endpoint, or return only a limited recent-submission list. A profile URL alone does not guarantee complete access to submissions or problem difficulty. If the automatic check fails, use the LeetCode cycle log as a fallback. Do not treat a failed network request as proof that no problem was solved.

At present, automatic checking can detect a recent accepted submission only when the endpoint is accessible and returns a submission from the current local day. It does not reliably map that submission to Easy/Medium/Hard difficulty automatically.

## Reminders and background behavior

Browser notifications require permission. The reminder timer runs only while the DevTrack AI page is open in the browser. It cannot guarantee reminders or checks while the browser is closed or the device is asleep. The app pauses reminders after a verified accepted submission is detected or after a solved/hints LeetCode entry is logged for today. The reminder is a local browser feature, not a server-side scheduled job.

Reliable background checks would require a separately hosted scheduled service/backend, which is not included in this static Pages app.

## Data and privacy

Logs, course counts, preferences, and notification history are stored in this browser's local storage. They do not automatically sync between devices or to Notion/Todoist. Clearing browser data can erase them. Export a JSON backup regularly. Do not enter passwords, API keys, or other secrets into task notes.

## Hosting

GitHub Pages serves the static `index.html`. On a public repository, the source code and published site are public. Do not put sensitive personal information or secrets in the repository.
