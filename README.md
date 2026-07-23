# FactoFarm · API (NestJS)

Backend REST de **FactoFarm**: sistema farmacéutico integral para Perú — POS, inventario, recetas, facturación electrónica SUNAT, cumplimiento DIGEMID/LPDP, finanzas y más. Expone API REST bajo el prefijo `/api` con autenticación JWT, RBAC por permisos y documentación OpenAPI (Scalar).

**Alcance:** 48 módulos de dominio en `src/modules/` (Fases 0–11 implementadas). Ver [ROADMAP.md](../ROADMAP.md) y [AUDITORIA-SISTEMA.md](../AUDITORIA-SISTEMA.md).

---

## Arquitectura limpia (Clean Architecture)

El proyecto **mantiene** una organización por **módulos de dominio** y **capas** desacopladas del framework HTTP y del ORM. La idea es que reglas de negocio y casos de uso no dependan de Nest ni de Prisma directamente.

### Principios

- **Modular por dominio**: cada área funcional vive en `src/modules/<dominio>/`.
- **Flujo de dependencias**: el dominio no importa infraestructura; la infraestructura implementa interfaces definidas en el dominio (puertos / repositorios).
- **Nest como capa de entrega**: controladores y módulos componen la aplicación; la lógica estable vive en `application/` y `domain/`.

### Estructura de carpetas (`src/`)

```text
src/
├── main.ts                 # Arranque HTTP, Swagger/Scalar, CORS, prefijo global /api
├── app.module.ts           # Raíz de módulos Nest
├── app.controller.ts       # Rutas raíz (health, hello)
├── app.service.ts
├── config/                 # Validación de entorno (Joi), variables centralizadas
├── prisma/                 # PrismaModule global + PrismaService (adaptador pg)
├── generated/prisma/       # Cliente Prisma generado (no editar a mano; ver .gitignore)
└── modules/                # 48 módulos de dominio (ver tabla abajo)
    ├── auth, users, permissions, establishments, tenants
    ├── products, categories, brands, units, laboratories, active-principles
    ├── pharmaceutical-forms, administration-routes, compound-products
    ├── inventory-movements, inventory-transfers, inventory-physical-counts
    ├── warehouses, warehouse-zones, suppliers, purchases
    ├── sales, cash-registers, quotations, accounts-receivable
    ├── billing, series, finance, compliance
    ├── prescriptions, pharmaceutical, medicos, staff, hospital
    ├── customers, customer-types, agreements, marketing
    ├── delivery-orders, shipping-guides, cold-chain
    ├── dashboard, audit, public, files, health, realtime, services
    └── … (lista completa: `ls src/modules`)
```

### Módulos por área funcional

| Área | Módulos |
|------|---------|
| **Plataforma** | `auth`, `users`, `permissions`, `establishments`, `tenants`, `files`, `health`, `audit`, `realtime` |
| **Catálogo** | `products`, `categories`, `brands`, `units`, `laboratories`, `active-principles`, `pharmaceutical-forms`, `administration-routes`, `compound-products`, `services` |
| **Inventario** | `inventory-movements`, `inventory-transfers`, `inventory-physical-counts`, `warehouses`, `warehouse-zones`, `suppliers`, `purchases`, `cold-chain` |
| **Ventas y caja** | `sales`, `cash-registers`, `quotations`, `accounts-receivable`, `customers`, `customer-types`, `agreements`, `marketing` |
| **Facturación SUNAT** | `billing`, `series`, `finance`, `compliance` |
| **Farmacia clínica** | `prescriptions`, `pharmaceutical`, `medicos`, `staff`, `hospital` |
| **Logística** | `delivery-orders`, `shipping-guides` |
| **Otros** | `dashboard`, `public` (libro reclamaciones) |

Los módulos nuevos deben seguir el patrón por capas bajo `src/modules/<nombre>/` cuando aplique (ver `users/` como referencia).

### Prisma (fuera de `src/`)

- Esquema **multiarchivo** en `prisma/` y `prisma/models/*.prisma` (Prisma 7).
- Configuración del datasource: `prisma.config.ts`.
- Migraciones: `prisma/migrations/`.

---

## Requisitos previos

- **Node.js** LTS (recomendado 20.x o superior) y **pnpm** (versión fijada en `package.json` → `packageManager`).
- **PostgreSQL** accesible (local o remoto) y una **base de datos vacía** creada para el proyecto (por ejemplo `bd_factofarm`).

---

## Puesta en marcha desde cero

Ejecuta los pasos **en orden** desde la raíz del repositorio `api-factofarm`.

### 1. Instalar dependencias

```bash
pnpm install
```

Tras `install` se ejecuta `postinstall` → **`prisma generate`** (genera el cliente en `src/generated/prisma`).

### 2. Variables de entorno

Crea un archivo **`.env`** en la raíz del proyecto (no lo subas al repositorio; está en `.gitignore`). Ejemplo mínimo:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# PostgreSQL (obligatoria)
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/bd_factofarm

# JWT (obligatorio; mínimo 32 caracteres)
JWT_SECRET=cambia_esto_por_un_secreto_largo_de_al_menos_32_caracteres
JWT_EXPIRES_IN=7d

# Archivos subidos (opcional; por defecto carpeta ./uploads)
UPLOADS_DIR=uploads

# Producción — obligatorias / recomendadas
# LPDP_SENSITIVE_ENCRYPTION_KEY=secreto_largo_minimo_32_caracteres_para_cifrar_datos_salud
# SWAGGER_ENABLED=false
# BILLING_PROVIDER=FACTILIZA
```

- **`JWT_SECRET`**: obligatorio; la validación Joi exige al menos 32 caracteres.
- **`DATABASE_URL`**: debe comenzar por `postgres://` o `postgresql://`.

### 3. Base de datos: migraciones Prisma

Aplica el esquema a tu base de datos.

**Desarrollo** (crea/aplica migraciones y sincroniza el historial local):

```bash
pnpm run prisma:migrate
```

Equivale a `prisma migrate dev`. Si es la primera vez, Prisma aplicará todas las migraciones existentes en `prisma/migrations/`.

**Producción / CI** (solo aplica migraciones ya versionadas, sin prompts):

```bash
pnpm run prisma:deploy
```

Equivale a `prisma migrate deploy`.

### 4. Datos iniciales (seed)

Carga datos demo (admin, permisos, etc.) definidos en `prisma/seed/`:

```bash
pnpm run db:seed
```

Credenciales de demostración (solo desarrollo; ver `prisma/seed/data/admin-demo.ts`):

- **Correo:** `admin@factosysperu.com`
- **Contraseña:** `Admin123!`

### 5. Compilar y arrancar la API

```bash
pnpm run build
pnpm run start:dev
```

Modo desarrollo con recarga:

```bash
pnpm run start:dev
```

Arranque en producción (tras `build`):

```bash
ppnpm run start:prod
```

En consola verás el **puerto**, la **conexión a PostgreSQL** (vía Prisma) y enlaces útiles con **`http://localhost:<PORT>`** (documentación, health, OpenAPI).

---

## Comprobar que todo funciona

| Recurso | URL típica (puerto 3000) |
|---------|---------------------------|
| Health (incluye ping `SELECT 1` a la BD) | `http://localhost:3000/api/health` |
| Documentación interactiva (Scalar) | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/openapi.json` |
| Prefijo global de rutas REST | **`/api`** |

Login (ejemplo):

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{ "email": "admin@factosysperu.com", "password": "Admin123!" }
```

---

## Scripts pnpm útiles

| Script | Descripción |
|--------|-------------|
| `pnpm run start:dev` | API en modo watch |
| `pnpm run build` | Compila Nest (antes ejecuta `prisma generate`) |
| `pnpm run prisma:generate` | Regenera el cliente Prisma |
| `pnpm run prisma:migrate` | Migraciones en desarrollo (`migrate dev`) |
| `pnpm run prisma:deploy` | Aplicar migraciones en prod/CI (`migrate deploy`) |
| `pnpm run db:seed` | Ejecuta el seed |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Tests unitarios |

---

## Documentación relacionada

| Documento | Descripción |
|-----------|-------------|
| [ROADMAP.md](../ROADMAP.md) | Fases del proyecto y hardening 11.5 |
| [AUDITORIA-SISTEMA.md](../AUDITORIA-SISTEMA.md) | Hallazgos pre-producción |
| [docs/COOLIFY-DOCKER-DEPLOY.md](./docs/COOLIFY-DOCKER-DEPLOY.md) | Deploy Docker / Coolify |
| [docs/DATA-RETENTION-PLAN.md](./docs/DATA-RETENTION-PLAN.md) | Retención, archivado y crecimiento multi-tenant |

## Tests de integración billing (opcional)

Con token sandbox Factiliza:

```bash
FACTILIZA_INTEGRATION_TOKEN=tu_token pnpm run test -- factiliza-billing.integration-spec
```

---

## Frontend y CORS

El front Angular (`front-factofarm`) suele llamar a esta API en desarrollo desde `http://localhost:3000`. En `main.ts` está **`enableCors({ origin: true })`** para desarrollo; en producción conviene restringir orígenes.

---

## Despliegue en Coolify (producción)

> Idea general y checklist para otras apps: [`docs/COOLIFY-DOCKER-DEPLOY.md`](./docs/COOLIFY-DOCKER-DEPLOY.md).

La API en producción **no se compila en el VPS** (KVM 1 es limitado). Se construye la imagen Docker en tu Mac, se publica como `latest` en Docker Hub y Coolify solo la descarga y ejecuta.

| Recurso | Valor |
|---------|--------|
| Imagen | `santossjba/api-factofarm:latest` |
| Coolify (proyecto) | FACTO FARM → production → `api-factofarm` |
| URL | https://api-factofarm.factosysperu.com |
| Health | https://api-factofarm.factosysperu.com/api/health |
| Base de datos | `factofarm_db` en `postgresql-db` (FACTOSYS PERU), red interna Coolify |

### Requisitos en tu máquina

- Docker Desktop (build `linux/amd64` + login a Docker Hub como `santossjba`)
- Acceso a Coolify (`https://factosysperu.cloud`)
- Para migraciones/seed desde tu Mac: `DATABASE_URL` alcanzable (puerto público del Postgres, p. ej. `IP:5433`). En Coolify la app usa el host **interno** del contenedor Postgres.

### Paso a paso tras un cambio de código

1. **Commit y push** (desde la raíz de `api-factofarm`):

```bash
git add -A
git status   # no subir .env ni secretos
git commit -m "mensaje claro del cambio"
git push origin main
```

2. **Migraciones** (solo si cambió `prisma/` o el esquema). Desde tu Mac, con `DATABASE_URL` apuntando a `factofarm_db` pública:

```bash
export NODE_OPTIONS='--experimental-require-module'
pnpm exec prisma migrate deploy
# si hace falta datos demo:
pnpm exec prisma db seed
```

Si el historial de migraciones quedó inconsistente en una BD nueva, usa `pnpm exec prisma migrate reset --force` **solo** con consentimiento explícito (borra todos los datos).

3. **Build y push de la imagen** (solo tag `latest`; no crear tags extras):

```bash
docker buildx build --platform linux/amd64 \
  -t santossjba/api-factofarm:latest \
  --push .
```

El `Dockerfile` ya usa un `DATABASE_URL` placeholder solo para `prisma generate` en el build. Las variables reales de runtime viven en Coolify (no se hornean en la imagen).

4. **Redeploy en Coolify**

- Abre **FACTO FARM → production → api-factofarm**
- Confirma imagen `santossjba/api-factofarm` y tag `latest`
- **Deploy** / **Force rebuild** (pull de la nueva `latest`)
- Espera healthcheck verde (`/api/health`)

Variables críticas en Coolify (runtime):

- `DATABASE_URL` → host interno Coolify, DB `factofarm_db` (no la IP pública del Mac)
- `NODE_ENV=production`, `PORT=3000`, `HOST=0.0.0.0`
- `JWT_SECRET`, `BILLING_ENCRYPTION_KEY`, `LPDP_SENSITIVE_ENCRYPTION_KEY`
- `FRONTEND_URL` / `CORS_ORIGINS` → `https://factofarm.factosysperu.com`

5. **Verificar**

```bash
curl -sS https://api-factofarm.factosysperu.com/api/health
```

Debe responder `{"status":"ok","database":"connected",...}`.

### Notas

- El entrypoint del contenedor ejecuta `pnpm prisma migrate deploy` y luego arranca Nest. Si una migración falla, el contenedor no queda healthy.
- Coolify necesita `curl` dentro de la imagen Alpine (ya incluido en el `Dockerfile`) para el healthcheck.
- No subas `.env` a git. El `.env` local puede usar la IP/puerto público del Postgres; Coolify debe seguir con el hostname interno.

---

## Licencia

Proyecto privado (**UNLICENSED** en `package.json`). NestJS y dependencias mantienen sus propias licencias.
