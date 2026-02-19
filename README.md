# Ops HQ Dashboard

A real-time visual command center for Notion Ops HQ data.

## Live Demo
**[View Live →](https://ops-hq-dashboard-2026.pages.dev)**

## Features

- **Real-time Notion sync** — fetches live data from Tasks, Grants DBs
- **Overdue alerts** — prominently displays the overdue task batch (Feb 13)
- **Priority boards** — Kanban-style view of tasks by status
- **Grant deadline tracker** — countdown to upcoming deadlines
- **Stats cards** — P1 count, overdue count, due today, completion rate
- **Stuck items detector** — highlights tasks not touched in 7+ days
- **Beautiful dark UI** — gradient accents, smooth animations

## Tech Stack

- Cloudflare Pages with Functions (serverless Notion proxy)
- Vanilla JavaScript + CSS (no build step)
- Notion API (data_sources endpoint)

## API Endpoints

- `/api/tasks` — all tasks from Notion
- `/api/tasks/overdue` — tasks past due date
- `/api/tasks/today` — tasks due today
- `/api/grants` — grants with deadlines
- `/api/stats` — summary statistics

## Development

```bash
# Local dev with wrangler
npm install -g wrangler
wrangler pages dev . --port 8788
```

## Deployment

```bash
wrangler pages deploy . --project-name=ops-hq-dashboard-2026
```

## Changelog

### v1.0.0 (2026-02-20)
- Initial release
- Notion API integration
- Task boards by status
- Overdue alerts
- Grant deadline tracking
- Stats dashboard

## Roadmap

- [ ] Task status updates (drag-and-drop)
- [ ] Add new tasks from dashboard
- [ ] Daily journal integration
- [ ] Mobile app-like PWA
