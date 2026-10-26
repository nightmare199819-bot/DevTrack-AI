# DevTrack AI

A responsive, browser-based learning and coding progress tracker.

## Features
- Daily task log with status, notes, actual minutes, evidence URL, assistance type, and blockers.
- 23-day LeetCode difficulty cycle: Days 1–10 Easy, Day 11 Medium, Days 12–21 Easy, Day 22 Medium, Day 23 Hard attempt.
- Weekly review journal.
- Local browser storage and JSON backup import/export.
- Responsive layout and sleep-friendly reminders.

## Run locally
Open `index.html` in a modern browser. No build step, dependencies, API keys, or server are required.

## Data and privacy
Logs are stored in this browser's local storage. They do not sync automatically between devices or to Notion/Todoist. Export a JSON backup regularly. Do not put passwords, API keys, or other secrets in task notes.

## Hosting
GitHub Pages can publish the static `index.html`, but a Pages site published from a private repository is generally public on GitHub Free. Keep this repository private if desired, but do not put sensitive information in the site files. To enable hosting, open **Settings → Pages** and choose **Deploy from a branch**, branch **main**, folder **/(root)**, then save. If that option is unavailable for your account/repository, use the app locally or choose another static host.
