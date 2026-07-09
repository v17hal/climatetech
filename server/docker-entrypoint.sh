#!/bin/sh
set -e

echo "▶ Applying database schema (prisma db push)…"
npx prisma db push --skip-generate --accept-data-loss

# Seed only once — marker file lives on the same volume as the DB.
SEED_MARKER="/app/data/.seeded"
if [ ! -f "$SEED_MARKER" ]; then
  echo "▶ First boot — seeding demo data…"
  node dist-seed/seed.js
  touch "$SEED_MARKER"
  echo "✔ Seed complete."
else
  echo "▶ Data already seeded — skipping."
fi

echo "▶ Starting CarbonSmart API…"
exec "$@"
