# Classroom Hub

The website for Bayune Lutheran Secondary School's Maths, Science & ICT department — announcements, subject resources, and a contact form for students, parents, and guardians, with a teacher-only admin panel behind it.

## Features

- **Announcements** — school notices, with comments and reactions
- **Resources** — PDFs, spreadsheets, audio, video, and YouTube links, organized by subject and grade
- **Contact form** — students, parents, guardians, and the public can reach the school directly
- **Admin panel** — teacher login to manage announcements, resources, and incoming messages
- **Installable PWA** — add-to-home-screen, with offline caching of previously visited pages
- **Privacy & Content Policy** page

## Tech stack

**Frontend** — vanilla HTML/CSS/JS, no build step, no framework. Ships as a static PWA (manifest + service worker).

**Backend** — Flask (Python), deployed as serverless functions on Vercel.
- [Supabase](https://supabase.com) — database
- [Cloudinary](https://cloudinary.com) — hosting for uploaded files, images, and video
- [Upstash Redis](https://upstash.com) — caching, plus admin session storage and login rate-limiting

## Project structure

```
classroom-hub/
├── frontend/                 # Static site — deploy as-is to any static host
│   ├── index.html, announcements.html, resources.html,
│   │   contact.html, admin.html, policy.html
│   ├── assets/                # Favicon, logo, app icons
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js             # Shared header/footer/nav, API_BASE, sanitizer
│   │   ├── notifications.js   # Bell badge + new-resource polling
│   │   └── (one file per page: announcements.js, resources.js, contact.js, admin.js)
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker (offline caching, push listener)
├── backend/                   # Flask API — deploy to Vercel
│   ├── api/
│   │   ├── index.py           # App entry point, blueprint registration, security headers
│   │   ├── auth.py            # Admin login/logout, session tokens, rate limiting
│   │   ├── announcements.py
│   │   ├── resources.py
│   │   ├── contact.py
│   │   ├── database.py        # Supabase client
│   │   ├── storage.py         # Cloudinary upload
│   │   ├── cache.py           # Redis helpers (falls back to in-memory if REDIS_URL isn't set)
│   │   └── sanitizer.py       # Server-side input sanitization (bleach)
│   ├── requirements.txt
│   ├── vercel.json
│   └── .env.example
└── .gitignore
```

## Running it locally

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in real values — see Environment variables below
flask --app api.index run --debug
```
The API runs at `http://localhost:5000`.

**Frontend** — no build step, just serve the folder:
```bash
cd frontend
python3 -m http.server 8080
```
Open `http://localhost:8080`. `js/app.js` already points `API_BASE` at `http://localhost:5000/api` whenever it's running on `localhost`, so it talks to your local backend automatically.

## Environment variables

Full list in `backend/.env.example`.

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary dashboard home |
| `REDIS_URL` | Upstash → your Redis database → connection string |
| `FLASK_SECRET_KEY` | Any random string, e.g. `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Whatever you want the teacher login to be |
| `FRONTEND_URL` | Your deployed frontend's exact URL — used for CORS |

Without `REDIS_URL` set, the backend falls back to an in-memory cache — fine for local testing, but sessions and rate-limits vanish on every restart. Set it for any real deployment.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) are what the backend actually connects with — see Database setup below for why.

## Database setup

Run `backend/schema.sql` once, in your Supabase project's SQL Editor, to create the three tables this app needs (`announcements`, `resources`, `messages`). It also enables Row Level Security on all three with no policies attached, on purpose — that locks them to be readable/writable *only* through the service role key, which only the backend has. The backend authenticates with that key specifically so it can bypass RLS; everyone and everything else is denied by default at the database level, not just by the app's own login check.

## Admin access

Logging in at `/admin.html` exchanges the username/password for a short-lived session token, kept server-side in Redis rather than trusted from the browser. Every admin-only request — creating or deleting announcements, uploading or deleting resources, reading or deleting contact messages — requires that token. Sessions last 12 hours of inactivity; repeated failed logins from the same IP get a 15-minute lockout.

## Pushing to GitHub

Create an empty repository on GitHub first (github.com/new — leave "Add a README" unchecked, so there's nothing to merge). Then, from the project root:

```bash
git init
git add .
git status                 # sanity check: backend/.env should NOT be in this list
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

Swap in your actual GitHub username and repository name on the `git remote add` line. `.gitignore` is already set up to keep `backend/.env` out of the commit — the `git status` line above is just a chance to double-check that before it's too late.

If you're doing this from inside a Codespace, its terminal already has git configured with your GitHub identity, so the same commands work as-is.

## Deployment

- **Frontend** — static hosting (currently deployed on Render)
- **Backend** — `vercel.json` is already set up to deploy `backend/` as Vercel serverless functions

Before deploying, update the placeholder production URL in `frontend/js/app.js` (`API_BASE`) to your actual Vercel backend URL, and set `FRONTEND_URL` in the backend's environment to your actual deployed frontend URL.

## License

Not yet decided.
