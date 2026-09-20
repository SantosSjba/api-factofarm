#!/usr/bin/env bash
# Manual Postgres dump fallback.
# I-INF-03: Coolify scheduled backups cannot be created from app code.
# Prefer enabling backups in Coolify UI on postgresql-db (daily).
# See docs/BETA-LAUNCH-CHECKLIST.md item B11.
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/factofarm_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" | gzip > "${FILE}"
echo "Backup creado: ${FILE}"
