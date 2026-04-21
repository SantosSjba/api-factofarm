# FactoFarm · API (NestJS)

Backend REST de **FactoFarm**: autenticación JWT, usuarios, establecimientos, permisos, archivos y documentación OpenAPI.

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
└── modules/
    ├── auth/               # Login JWT
    ├── users/              # CRUD usuarios (ejemplo completo en capas)
    │   ├── application/    # Casos de uso, DTOs, UsersService
    │   ├── domain/         # Tipos de dominio, IUserRepository (puerto)
    │   ├── infrastructure/ # PrismaUserRepository
    │   ├── users.controller.ts
    │   └── users.module.ts
    ├── establishments/
    ├── permissions/
    └── files/              # Subida de archivos + tabla archivos
```

| Capa | Rol |
|------|-----|
| **domain/** | Contratos (`user.repository.ts`), tipos (`user.types.ts`). Sin Nest/Prisma. |
| **application/** | Orquestación (`users.service.ts`), DTOs de entrada/salida. |
| **infrastructure/** | Implementación concreta del repositorio (Prisma). |
| **\*.controller.ts** | HTTP: validación, delegación al servicio de aplicación. |
| **\*.module.ts** | Composición Nest (providers, imports, exports). |

Los **nuevos dominios** deben seguir el mismo patrón bajo `src/modules/<nombre>/`.

### Prisma (fuera de `src/`)

- Esquema **multiarchivo** en `prisma/` y `prisma/models/*.prisma` (Prisma 7).
- Configuración del datasource: `prisma.config.ts`.
- Migraciones: `prisma/migrations/`.

---

## Requisitos previos

- **Node.js** LTS (recomendado 20.x o superior) y **npm**.
- **PostgreSQL** accesible (local o remoto) y una **base de datos vacía** creada para el proyecto (por ejemplo `bd_factofarm`).

---

## Puesta en marcha desde cero

Ejecuta los pasos **en orden** desde la raíz del repositorio `api-factofarm`.

### 1. Instalar dependencias

```bash
npm install
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
```

- **`JWT_SECRET`**: obligatorio; la validación Joi exige al menos 32 caracteres.
- **`DATABASE_URL`**: debe comenzar por `postgres://` o `postgresql://`.

### 3. Base de datos: migraciones Prisma

Aplica el esquema a tu base de datos.

**Desarrollo** (crea/aplica migraciones y sincroniza el historial local):

```bash
npm run prisma:migrate
```

Equivale a `prisma migrate dev`. Si es la primera vez, Prisma aplicará todas las migraciones existentes en `prisma/migrations/`.

**Producción / CI** (solo aplica migraciones ya versionadas, sin prompts):

```bash
npm run prisma:deploy
```

Equivale a `prisma migrate deploy`.

### 4. Datos iniciales (seed)

Carga datos demo (admin, permisos, etc.) definidos en `prisma/seed/`:

```bash
npm run db:seed
```

Credenciales de demostración (solo desarrollo; ver `prisma/seed/data/admin-demo.ts`):

- **Correo:** `admin@factofarm.local`
- **Contraseña:** `Admin123!`

### 5. Compilar y arrancar la API

```bash
npm run build
npm run start:dev
```

Modo desarrollo con recarga:

```bash
npm run start:dev
```

Arranque en producción (tras `build`):

```bash
npm run start:prod
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

{ "email": "admin@factofarm.local", "password": "Admin123!" }
```

---

## Scripts npm útiles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | API en modo watch |
| `npm run build` | Compila Nest (antes ejecuta `prisma generate`) |
| `npm run prisma:generate` | Regenera el cliente Prisma |
| `npm run prisma:migrate` | Migraciones en desarrollo (`migrate dev`) |
| `npm run prisma:deploy` | Aplicar migraciones en prod/CI (`migrate deploy`) |
| `npm run db:seed` | Ejecuta el seed |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitarios |

---

## Frontend y CORS

El front Angular (`front-factofarm`) suele llamar a esta API en desarrollo desde `http://localhost:3000`. En `main.ts` está **`enableCors({ origin: true })`** para desarrollo; en producción conviene restringir orígenes.

---

## Licencia

Proyecto privado (**UNLICENSED** en `package.json`). NestJS y dependencias mantienen sus propias licencias.
