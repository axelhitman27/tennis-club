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

## Deploy from GitHub

- The VPS pulls the code with a read-only **deploy key** (repo → Settings → Deploy keys).
- Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into the VPS and runs
  `git pull && docker compose up -d --build`. It needs three repo secrets:
  `VPS_HOST` (IP), `VPS_USER` (e.g. `root`) and `VPS_SSH_KEY` (a private key whose public half is
  in the VPS `~/.ssh/authorized_keys`). Use a dedicated key for this, not your personal one.
- `.env` lives only on the server and is never committed.
