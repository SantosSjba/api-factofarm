#!/bin/sh
set -e
# I-INF-01: archivos en UPLOADS_DIR (/app/uploads). Preferir MinIO (S3_*) cuando esté configurado.
mkdir -p "${UPLOADS_DIR:-/app/uploads}"
pnpm prisma migrate deploy
exec node dist/src/main.js