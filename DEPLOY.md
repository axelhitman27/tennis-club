# Deploy on a Hostinger VPS (Ubuntu + Docker)

1. In hPanel, create the VPS with the **Ubuntu 24.04 with Docker** template.
2. Point your domain's DNS `A` record to the VPS IP.
3. SSH in and `git clone` the GitHub repo into `/opt/club` (see the GitHub section below).
4. `cp .env.example .env` and fill it in (`openssl rand -base64 32` for the secrets).
5. `docker compose up -d --build` — migrations run on start, HTTPS is automatic via Caddy.
6. Create the first admin and default prices (once):
   `docker compose exec app npx tsx prisma/seed.ts`
7. Firewall: allow only 22, 80, 443 (hPanel firewall or `ufw`).
8. Backups (cron, daily):
   `docker compose exec -T db pg_dump -U tennis tennis | gzip > backups/$(date +%F).sql.gz`

Local dev: run a Postgres, set `.env`, then `npx prisma migrate dev` and `npm run dev`.

## Deploying this for a different club

Each club gets its own full deployment (own VPS or at least own domain, own database,
fully isolated — not a shared multi-club database). It's the same code every time:

1. Repeat steps 1–7 above with that club's domain and a fresh `.env`.
2. Set `CLUB_NAME` and `CLUB_PRIMARY_COLOR` in that `.env` — every bit of branding (page
   title, favicon, home-screen icon, email sender) comes from those two values, so no
   code changes are needed per club.
3. Set that club's own prices in **Admin → Τιμές & κανόνες** after the first login.

## Deploy from GitHub

- The VPS pulls the code with a read-only **deploy key** (repo → Settings → Deploy keys).
- Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into the VPS and runs
  `git pull && docker compose up -d --build`. It needs three repo secrets:
  `VPS_HOST` (IP), `VPS_USER` (e.g. `root`) and `VPS_SSH_KEY` (a private key whose public half is
  in the VPS `~/.ssh/authorized_keys`). Use a dedicated key for this, not your personal one.
- `.env` lives only on the server and is never committed.
