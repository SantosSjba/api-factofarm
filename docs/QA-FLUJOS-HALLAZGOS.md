# QA flujos FactoFarm — hallazgos y plan

| Campo | Valor |
|-------|-------|
| **Zona horaria** | `America/Lima` (UTC−5, sin DST) |
| **Entorno E2E** | Docker local `db` en **5433** + seed (`admin@factosysperu.com` / `Admin123!`) |
| **Suite** | `test/business-flows.e2e-spec.ts` + `test/sales-flow.e2e-spec.ts` |
| **Última corrida** | 2026-09-20 — **14/14 passed** (business + sales) |

## Cómo correr

```bash
# 1) Postgres + Redis (puerto host 5433 para no chocar con Postgres Windows)
docker compose up -d db redis

# 2) .env local (gitignored) con DATABASE_URL ...@127.0.0.1:5433/factofarm
npm run prisma:deploy
npm run db:seed

# 3) Tests
npm run test:e2e -- --testPathPatterns="business-flows|sales-flow" --forceExit
npm test -- --testPathPatterns=timezone.util.spec
```

---

## Matriz de flujos (resultado)

| ID | Flujo | Resultado | Notas |
|----|-------|-----------|-------|
| QA-POS-01 | Venta contado NV → stock −1 | **PASS** | |
| QA-POS-02 | Anulación (otro usuario) → stock restaurado | **PASS** | No se puede anular propia venta (403) |
| QA-POS-03 | Devolución sobre NOTA_VENTA | **PASS** (regla) | 400: NC solo boleta/factura |
| QA-POS-04 | Crédito → CxC → pago | **PASS** | |
| QA-INV-01 | OC → approve → send → receipt → stock +5 | **PASS** | RUC válido requerido |
| QA-INV-01b | Inbound directo → stock + | **PASS** | |
| QA-INV-02 | Traslado dispatch/receive | **PASS** | |
| QA-INV-03 | Ajuste pequeño aplica | **PASS** | |
| QA-REP-01 | `from`/`to` = día civil Lima | **PASS** | |
| QA-CPE-01 | Sin OSE real: boleta 400; NV OK | **PASS** | MOCK ≠ OSE |
| QA-CONCUR | 10 ventas concurrentes sin 5xx | **PASS** | |
| QA-UI-01 | Doble botón Cobrar POS | **fixed** | Un solo Cobrar (F2); redeploy front pendiente |
| QA-UI-02 | QA visual localhost POS | **PASS** | NV01-00000280 · S/ 3.00; caja abierta; 1 Cobrar |
| QA-UI-03 | Almacén cruzado vs caja | **fixed** | Solo almacenes del establecimiento de sesión |
| QA-UI-04 | Header solapado + sin accesos | **fixed** | Accesos: POS, Caja, Productos, Clientes, Recepción, Panel |
| QA-UI-05 | Densidad admin (caja/recepción/listas) | **fixed** | Padding shell ↓; recepción auto-carga ítems |
| QA-UI-06 | Header rings + Usuarios/Establecimientos | **PASS** | Rings sin clip; CRUD OK; smoke rutas menú |
| QA-UI-07 | Usuarios/Establecimientos responsive + CRUD real | **PASS** | 390/768/1440; CRUD persistente QA-*; seed intacto |
| QA-UI-08 | Login completo (+ fix logo) | **PASS** | Contraste; sin logo duplicado móvil; full-bleed; Enter submit |
| QA-UI-09 | Dashboards completo (shell por rol) | **PASS** | Admin A–D; smoke E1–E6; CTA caja cajero; build OK |
| QA-UI-10 | Usuarios completo + compactación | **PASS** | Densidad H1/filas/cards; CRUD QA; 390/768/1440 |
| QA-UI-11 | Usuarios validación Número/celular + QA live | **PASS** | DNI `eds` → error; API 400; árbol permisos; builds OK |
| QA-UI-12 | Foto usuario + MinIO/storage | **PASS** | upload+GET Bearer; preview `blob:`; `users.write` en upload |

---

## Hallazgos de reglas de negocio (confirmados por E2E)

### QA-RULE-01 — No anular venta propia
- Quien registró la venta recibe **403** al anular.
- Correcto: otro usuario (mismo establecimiento) debe autorizar.

### QA-RULE-02 — Devoluciones NC solo boleta/factura
- `POST .../returns` sobre **NOTA_VENTA** → **400**.
- Con proveedor **MOCK** (sin OSE) no se pueden emitir boletas → devolución con NC queda fuera de alcance hasta configurar OSE.

### QA-RULE-03 — Sin OSE solo nota de venta
- `documentType: BOLETA` sin OSE real → **400** con mensaje de facturación electrónica.
- El seed demo usa MOCK; CPE ACEPTADO requiere Factiliza/Nubefact/APIsPERU en Mi farmacia.

### QA-UI-01 — Dos botones Cobrar (front)
- Causa: `:host { display: inline-flex }` anula `hidden`/`md:hidden` en `app-button`.
- Fix en código: un solo Cobrar + `:host(.hidden)` / `sm:hidden` en host.
- **Redeploy front** aún pendiente para producción.

### QA-UI-02 — QA visual localhost (2026-09-20)
- Login OK · caja abierta · un solo **Cobrar (F2)** · venta NV contado **NV01-00000280**.
- Compactación POS: header denser, tiles más bajos, full-bleed, icon-only en xs, modal cobro más compacto.

### QA-UI-03 — Almacén de otra sucursal
- Lista de almacenes del tenant podía elegir Sucursal con caja de Oficina Principal → `404 Almacén no válido`.
- Fix: filtrar `scopedWarehouses` por `auth.user().establecimientoId` y auto-corregir selección inválida.

### QA-UI-04 — Header + accesos directos
- Causa real del logo duplicado: `.logo-dark-glow { @apply inline-flex }` en `styles.css` pisaba `xl:hidden`.
- Fix: logo del header solo si viewport &lt; 1280 **y** drawer cerrado (`showHeaderLogo` + `matchMedia`); en desktop solo sidebar.
- Accesos: 2 (móvil) → 4 (≥640) → 6 (≥1024); tooltips; labels en 2xl.
- Build front OK; verificado 390 / 768 / 1440.

### QA-UI-05 — Compactación y consistencia UX
- Shell `p-3 md:p-4`, toolbar `mb-3`, list-filters más densos.
- Caja: grid `md:2` / `lg:3`, filas con `truncate` + `tabular-nums`.
- Recepción: auto-carga ítems al elegir OC; labels Cantidad/Lote/Vencimiento; sin paso extra “Cargar ítems”.
- Establecimientos: empty states correctos (sin “filtros”).
- Productos/Clientes: menos margen breadcrumb; botón “Columnas” compacto; nombres con `truncate`.

### QA-UI-06 — Header rings + Usuarios / Establecimientos (2026-09-20)
- **Header:** `nav` de accesos con `px-0.5 py-0.5` + `overflow-x-auto` → rings `ring-1` sin clip en 390 / 768 / 1440; logo solo &lt;1280 con drawer cerrado.
- **Sidebar:** collapse desktop 290↔90; drawer + backdrop &lt;1280; grupo Usuarios & Establecimientos navega OK.
- **Usuarios:** listado, filtros, Nuevo (tabs Datos/Permisos/Personales/Documentos), Editar, árbol permisos; select Establecimiento poblado tras fix `listEstablishmentsAll` (paged `pageSize=100` + `map(items)`).
- **Establecimientos:** listado 2 filas; filtro hospital → empty state; Nuevo/Editar (ubigeo + checkboxes); Series modal con listado + alta; Cancelar cierra.
- **Smoke carga OK:** `/gestion-personal`, `/auditoria`, `/lpdp`, `/farmaceutico-titular`, `/mi-farmacia`.
- **Build front:** `npm run build` OK.

### QA-UI-07 — Usuarios / Establecimientos: matriz responsive + CRUD persistente (2026-09-20)
- **Entorno:** `localhost:4200` sesión admin demo; viewports CDP **390 / 768 / 1440**. Datos solo `QA-*` / `qa.*@test.local`; no se tocó Oficina Principal, Sucursal ni `ADMINISTRADOR`.

#### Matriz responsive (ambos módulos)
| Zona | 390 | 768 | 1440 |
|------|-----|-----|------|
| Toolbar título + Nuevo | PASS | PASS | PASS |
| `list-filters` + Limpiar | PASS | PASS | PASS |
| Tabla (scroll/acciones) | PASS | PASS | PASS |
| Paginación | PASS | PASS | PASS |
| Modal form (body scroll, footer visible) | PASS | PASS | PASS |
| Modal Series / confirm delete | PASS | PASS | PASS |
| Shell drawer + logo + accesos 2 chips | PASS | — | — |
| Usuarios tabs Datos/Permisos/Personales/Documentos | PASS (header sin overflow; árbol scrolleable) | PASS | PASS |
| Establecimientos grid 1 col + ubigeo + Pagos/Inventario | PASS | PASS | PASS |

#### CRUD Usuarios
| Acción | Resultado |
|--------|-----------|
| Crear `QA Usuario Temp` + email `qa.user.<ts>@test.local` + CAJERO + ≥1 permiso | **PASS** |
| Filtrar por nombre QA / rol Cajero; Limpiar | **PASS** |
| Editar → `QA Usuario Editado` (listado refleja) | **PASS** |
| Acción Permisos fila: abrir árbol, toggle, cancelar | **PASS** (cancel cierra sin persistir) |
| Eliminar usuario QA (confirm) | **PASS** |
| Eliminar `ADMINISTRADOR` | **PASS** (botón Eliminar oculto; no forzado) |

#### CRUD Establecimientos + Series
| Acción | Resultado |
|--------|-----------|
| Crear `QA Estab Temp` código `9001` + ubigeo Lima | **PASS** |
| Filtro texto QA; Solo hospitales → empty; Limpiar | **PASS** |
| Editar → `QA Estab Editado` | **PASS** |
| Series: add BOLETA `QA01` → fila visible; delete `QA01` | **PASS** (alta crea series por defecto; empty state N/A) |
| Eliminar QA Estab (confirm); seed Oficina Principal / Sucursal intactos | **PASS** |

#### Bugs corregidos en este pase
1. **Listado no reflejaba edit/create:** `invalidateQueries` usaba `userQueryKeys.list()` / `establishmentQueryKeys.list()` (solo key sin filtros) → cambiado a `.all`.
2. **Crear establecimiento con ubigeo fallaba (400):** DTO `departmentId`/`provinceId`/`districtId` eran `@IsUUID()` pero el front envía códigos (`15`, `1501`, …) → `@IsString()` `@MaxLength(10)` en `create-establishment.dto.ts`.
3. (Previos QA-UI-06 reutilizados) select Establecimiento en form usuario; binding `form-select`.

- **Build front:** `npm run build` OK (2026-09-20).

### QA-UI-08 — Login completo (+ fix logo) (2026-09-20)
- **Entorno:** front `localhost:4200/auth/signin` + API `localhost:3000`; demo `admin@factosysperu.com` / `Admin123!`; viewports CDP **390 / 768 / 1440**.

#### Causa del logo
- No era 404: `logo-nav.png` responde **200**. En panel `brand-950` el logo oscuro quedaba ilegible.
- **Fix:** chip blanco + `logo-nav.png` en aside; franja móvil full-bleed (`:host { display:block; width:100% }`).
- **Ajuste posterior:** se quitó el logo extra en la columna form (duplicado en móvil) y el toggle de tema pasó a la franja en `<lg`.

#### Matriz A–F (navegador)
| ID | Caso | Resultado |
|----|------|-----------|
| A1 | Logo desktop panel → `/` | **PASS** |
| A2 | Logo móvil / Network 200 | **PASS** |
| A3 | Contraste light/dark (toggle) | **PASS** |
| A4 | Grid no tapa logo/CTA | **PASS** |
| B1–B3 | Submit vacío / solo email / solo password | **PASS** (botón disabled) |
| B4 | Email `a@b` | **PASS** (hint formato) |
| B5 | Editar limpia errores | **PASS** (`(input)` → `clearErrorsOnEdit`) |
| C1–C2 | Password mala / email inexistente | **PASS** (alert + toast; permanece en signin) |
| C3 | Doble submit | **PASS** (busy/disabled) |
| C4 | API caída | **N/A** (no forzado en este pase) |
| D1 | Login OK → `/dashboard` | **PASS** |
| D2 | Mantener sesión + reload | **PASS** (`ff_*` en localStorage) |
| D3 | Guest guard | **PASS** (`/auth/signin` → `/dashboard`) |
| D4 | Logout → form limpio | **PASS** |
| E1 | Mostrar/ocultar password | **PASS** (`aria-pressed`) |
| E2 | Forgot password | **PASS** → `/auth/forgot-password` |
| E3 | Volver al inicio | **PASS** → `/` |
| E4 | Autofocus email | **PASS** (código `ngAfterViewInit`; automatización MCP puede robar foco) |
| E5 | Enter en password | **PASS** tras fix `type="submit"` en `app-button` |
| F1–F3 | 390 / 768 / 1440 | **PASS** (sin overflow; split en 1440) |
| F4 | `aria-invalid` / `role=alert` | **PASS** (error API + hints) |

#### Bugs corregidos en este pase
1. Contraste logo auth (chip blanco + asset `logo-nav.png`).
2. Logo duplicado + margen lateral en móvil → un solo logo en franja; `:host` block 100%; toggle en franja móvil.
3. Errores de login no se limpiaban al editar → `(input)` en form.
4. Enter no enviaba el form → `app-button` acepta `type="submit"`; signin usa submit + `ngSubmit` (sin doble `btnClick`).

- **Build front:** `pnpm run build` OK (2026-09-20).

### QA-UI-09 — Dashboards completo (shell por rol) (2026-09-20)
- **Entorno:** front `localhost:4200/dashboard` + API `localhost:3000` (DB connected); demo `admin@factosysperu.com` / `Admin123!`; viewports CDP **390 / 768 / 1440** + theme light/dark.
- **Usuarios smoke (temporales):** `qa.dash.*@test.local` / `QaDash123!` (gerente, farmacéutico, cajero, almacenero, contador); eliminados al final.
- **Precondición técnica:** `prebundle.exclude` TanStack en `angular.json` (sin NG0203 / `injectQuery` en `/dashboard`).

#### Matriz A–F
| ID | Caso | Resultado |
|----|------|-----------|
| A1 | Login admin → `/dashboard` | **PASS** (título admin/cadena; sin NG0203) |
| A2 | Menú lateral usable | **PASS** (Dashboard activo) |
| A3 | Guest sin token → login | **PASS** |
| A4 | `defaultHomePath` cajero → POS; `/dashboard` accesible | **PASS** (`/punto-venta`; Mi panel OK) |
| B1 | KPI cards (usuarios/estabs/clientes/productos) | **PASS** (10 / 2 / 2 / 7 vs API) |
| B2 | Chart 14d | **PASS** (series visibles) |
| B3 | Alertas inventario + links | **PASS** |
| B4 | Chain summary | **PASS** (2 sucursales; scroll OK) |
| B5 | Loading → content | **PASS** (`page-state` + skeletons) |
| B6 | Error + Reintentar | **PASS** (bloqueo Network + retry) |
| B7 | Valores vs API 200 | **PASS** |
| C1–C4 | Onboarding banner (visible / links / dismiss / restore) | **PASS** (`localStorage`) |
| D1–D3 | 390 / 768 / 1440 | **PASS** (sin overflow-x; grids estables) |
| D4 | Dark/light | **PASS** |
| D5–D6 | Densidad + focus/links | **PASS** |
| E1 | GERENTE_SUCURSAL → panel gerente | **PASS** (ventas/cajas/personal) |
| E2 | FARMACEUTICO → panel farmacéutico | **PASS** (recetas/anulaciones/controlados) |
| E3 | CAJERO → panel cajero | **PASS** (CTA caja + POS; Abrir caja →) |
| E4 | ALMACENERO → panel almacén | **PASS** (links inventario/traslados/OC/frío) |
| E5 | CONTADOR → panel contabilidad | **PASS** (CPE/jobs + CxP/CxC) |
| E6 | Shell routing (no admin por defecto) | **PASS** |
| F1 | Console limpia / sin NG0203 | **PASS** |
| F2 | `pnpm run build` | **PASS** |
| F3 | Documentar QA-UI-09 | **PASS** |

#### Bugs corregidos en este pase
1. CTAs cajero “Ir a caja” / “Ir al POS” no proyectaban en `app-page-toolbar` → falta `data-toolbar-actions` en el wrapper (fix en `dash-cashier.component.ts`). Card “Abrir caja →” a `/caja-chica-pos` ya OK.

- **Cleanup:** 5 usuarios `QA Dash *` eliminados vía API.
- **Build front:** `pnpm run build` OK (2026-09-20).

### QA-UI-10 — Usuarios completo + compactación (2026-09-20)
- **Entorno:** front `localhost:4200/usuarios` + API `localhost:3000`; demo `admin@factosysperu.com` / `Admin123!`; viewports CDP **390 / 768 / 1440** + theme light/dark.
- **Datos QA:** `QA Usuario Temp` → `QA Usuario Editado` / `qa.user.<ts>@test.local` (eliminado al final; seed intacto).

#### Densidad (baseline → post-fix)
| Métrica | Antes | Después |
|---------|-------|---------|
| H1 | 36px (`sm:text-title-md`) | **30px** (`text-title-sm`) |
| Fila card @390 | ~335px | **~161px** |
| Modo @768 | cards (overflow) | **tabla real** (`naturalWidth` ~722) |
| Columna Api Token | siempre `—` | **eliminada** |

#### Matriz A–F
| ID | Caso | Resultado |
|----|------|-----------|
| A1–A3 | Acceso `/usuarios`, breadcrumb, Nuevo | **PASS** |
| B1–B5 | Listado densificado; acciones; Admin sin Eliminar; paginación | **PASS** |
| C1–C4 | Buscar / rol Cajero / Limpiar / sin coincidencias | **PASS** |
| D1 | Crear QA + permisos | **PASS** |
| D2 | Tabs Personales / Documentos | **PASS** |
| D3 | Editar nombre → listado | **PASS** |
| D4 | Permisos fila → toggle → Cancelar | **PASS** |
| D5 | Eliminar QA (confirm) | **PASS** |
| D6 | Validación email/password (yup + toast) | **PASS** |
| D7 | Select Establecimiento (2 opts) | **PASS** |
| E1–E6 | 390/768/1440; dark/light; márgenes | **PASS** |
| F1–F3 | Console OK; build; docs | **PASS** |

#### Bugs corregidos en este pase
1. H1 demasiado grande → quitar `sm:text-title-md`; breadcrumb sin `mb-5`.
2. Columna **Api Token** placeholder (`apiTokenCell()` → `—`) eliminada del listado.
3. Celdas `px-5 py-4` → `px-3 py-2.5`; `#`/`Establecimiento` responsive; card header denser vía clase local.
4. Cards móviles densas: clase `ff-usuarios-list` + CSS en `styles.css`.
5. Modal form: padding/gaps `sm:px-6`, `gap-3`, `mt-1.5`; delete confirm `text-lg`.

- **Build front:** `pnpm run build` OK (2026-09-20).

### QA-UI-11 — Usuarios validación completa + fix Número (2026-09-20)
- **Entorno:** front `localhost:4200/usuarios` + API `localhost:3000` (reiniciado tras DTO); demo `admin@factosysperu.com` / `Admin123!`.
- **Hallazgo previo:** en Datos personales, **Número** aceptaba `"eds"` (solo `max(20)`). Correo personal sí validaba.

#### Fix
1. Front (`usuario-form-modal`): formato por `tipoDoc` — DNI `^\d{8}$`, CE 9–12 alfanum., PASAPORTE 6–12, OTRO 1–20 alfanum./guiones; celulares `^\+?\d{7,15}$`; mensajes live + bloqueo en Guardar.
2. API: `IsPeruDocument` en `UserProfileDto.numeroDocumento` + `Matches` celulares; helpers en `peru-documents.ts` (PASAPORTE/OTRO).
3. Tras redeploy/restart API: `POST /users` con DNI `eds` → **400** `profile.DNI debe tener 8 dígitos.`

#### Matriz A–G
| ID | Caso | Resultado |
|----|------|-----------|
| A | Listado `/usuarios`, buscar Admin (2 filas), Limpiar | **PASS** |
| B | Modal eliminar: Cancelar sin spinner; cierre OK | **PASS** |
| C | Nuevo → Guardar vacío: hints nombre/email/establecimiento/password | **PASS** |
| D | Personales: DNI+`eds` → **«DNI debe tener 8 dígitos.»** (borde rojo) | **PASS** |
| E | Tab Permisos: bosque único (~98 checks), filtro «Buscar módulo…», indeterminate | **PASS** |
| F | CRUD QA: create DNI válido 201; edit nombre; delete; seed intacto; cleanup `QA Bad Doc` | **PASS** |
| G | `pnpm run build` front + `npm run build` API | **PASS** |

- **Cleanup:** usuarios QA (`qa.baddoc@test.local`, `QA UI11*`) eliminados vía API.
- **Builds:** front + API OK (2026-09-20).

### QA-UI-12 — Foto usuario + MinIO/storage (2026-09-20)
- **Entorno:** front `localhost:4200/usuarios` + API `localhost:3000`; demo `admin@factosysperu.com` / `Admin123!`.
- **Storage:** `FilesModule` usa `S3MinioFileStorage` si `S3_ENDPOINT`+keys; si no, disco local. Upload/GET funcionaron en local (PUT+stream OK).

#### Hallazgos / fixes
1. **Permisos:** `POST /files/upload` no incluía `users.write` → operadores solo-Usuarios recibían 403. Añadido en `files.controller.ts`.
2. **Preview:** `<img src="/api/v1/files/:id">` no envía Bearer → 401. Fix: `FilesApiService.fetchObjectUrl` (GET blob + `blob:`) en modal Usuarios (upload y al editar).

#### Matriz M1–M6
| ID | Caso | Resultado |
|----|------|-----------|
| M1 | Upload PNG 1×1 vía API | **PASS** (201 + `id`) |
| M2 | `GET /files/:id` con Bearer | **PASS** 200 `image/png` |
| M3 | Crear usuario con `profile.fotoArchivoId` | **PASS** (`fotoUrl` = `/api/v1/files/...`) |
| M4 | Editar QA en UI → Personales | **PASS** preview `blob:http://localhost:4200/...` `naturalWidth=1` |
| M5 | Sin error rojo de carga foto | **PASS** |
| M6 | Cleanup + builds | **PASS** |

- **Cleanup:** `QA UI12 Foto` / `qa.ui12.foto.*@test.local` eliminados.
- **Builds:** `pnpm run build` front + `npm run build` API OK.

---

## Registro de corridas

| Fecha (Lima) | Suite | Resultado |
|--------------|-------|-----------|
| 2026-09-20 | business-flows + sales-flow | 14 passed |
| 2026-09-20 | timezone.util.spec | 3 passed |
| 2026-09-20 | QA visual POS localhost | venta OK + UX compacta |
| 2026-09-20 | QA UI header + caja + recepción | header OK; caja S/103; recepción auto-ítems |
| 2026-09-20 | QA-UI-06 header + Usuarios/Establecimientos | PASS + build OK |
| 2026-09-20 | QA-UI-07 Usuarios/Establecimientos CRUD+responsive | PASS + build OK |
| 2026-09-20 | QA-UI-08 Login completo (+ logo) | PASS + build OK |
| 2026-09-20 | QA-UI-09 Dashboards completo (shell por rol) | PASS + build OK |
| 2026-09-20 | QA-UI-10 Usuarios completo + compactación | PASS + build OK |
| 2026-09-20 | QA-UI-11 Usuarios validación Número/celular | PASS + API 400 DNI eds + builds OK |
| 2026-09-20 | QA-UI-12 Foto usuario + MinIO/storage | PASS + blob preview + users.write + builds OK |

---

## Próximos (opcional)

1. Redeploy front + API (QA-UI-01…10; DTO ubigeo).
2. E2E devolución con stock restore cuando haya OSE de prueba.
3. E2E filtro “hoy” cerca de medianoche Lima (instante fijo).
4. Seguir barrido opción por opción (inventario, comprobantes, fármacos).
5. Probar pestañas Catálogo/Carrito en dispositivo real &lt;768px.
6. Revisar permisos POS del rol CAJERO seed/QA si “No tiene permisos” reaparece fuera de dashboard.
