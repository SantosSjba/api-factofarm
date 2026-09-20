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
| QA-UI-08 | Login completo (+ fix logo) | **PASS** | Contraste logo; matriz A–F; Enter submit; build OK |

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
- **Fix:** chip blanco + `logo-nav.png` en aside; logo compacto en columna form (`lg:hidden`) para móvil.

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
1. Contraste logo auth (chip blanco + asset `logo-nav.png` + logo form móvil).
2. Errores de login no se limpiaban al editar → `(input)` en form.
3. Enter no enviaba el form → `app-button` acepta `type="submit"`; signin usa submit + `ngSubmit` (sin doble `btnClick`).

- **Build front:** `pnpm run build` OK (2026-09-20).

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

---

## Próximos (opcional)

1. Redeploy front + API (QA-UI-01…08; DTO ubigeo).
2. E2E devolución con stock restore cuando haya OSE de prueba.
3. E2E filtro “hoy” cerca de medianoche Lima (instante fijo).
4. Seguir barrido opción por opción (inventario, comprobantes, fármacos).
5. Probar pestañas Catálogo/Carrito en dispositivo real &lt;768px.
