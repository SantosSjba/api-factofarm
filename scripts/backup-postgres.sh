#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/factofarm_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" | gzip > "${FILE}"
echo "Backup creado: ${FILE}"
