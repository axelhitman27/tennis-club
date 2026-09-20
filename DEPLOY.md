# Deploy on a Hostinger VPS (Ubuntu + Docker)

1. In hPanel, create the VPS with the **Ubuntu 24.04 with Docker** template.
2. Point your domain's DNS `A` record to the VPS IP.
3. SSH in, then upload/clone this folder, e.g. `/opt/club`.
4. `cp .env.example .env` and fill it in (`openssl rand -base64 32` for the secrets).
5. `docker compose up -d --build` — migrations run on start, HTTPS is automatic via Caddy.
6. Create the first admin and default prices (once):
   `docker compose exec app npx tsx prisma/seed.ts`
7. Firewall: allow only 22, 80, 443 (hPanel firewall or `ufw`).
8. Backups (cron, daily):
   `docker compose exec -T db pg_dump -U tennis tennis | gzip > backups/$(date +%F).sql.gz`

Local dev: run a Postgres, set `.env`, then `npx prisma migrate dev` and `npm run dev`.
