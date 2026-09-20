# Auditoría FactoFarm — Informe de hallazgos

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-09-19 (inventario) · **Correcciones:** 2026-09-20 |
| **Alcance** | Full: front (UX/UI/responsive + lógica/persistencia cliente) + API (lógica/persistencia) + Prisma + Coolify/Docker |
| **Repos** | `api-factofarm` + `front-factofarm` |
| **Método** | Revisión estática + subagentes de remediación en oleadas |
| **Estado de esta fase** | **Código corregido** para casi todos los IDs. Quedan ops Coolify + pocos ítems de producto/scope. |

### Resumen por severidad (post-remediación)

| Severidad | Total | `done` | `ops` / `skip` |
|-----------|-------|--------|----------------|
| **P0** | 9 | 8 | 1 ops (I-INF-01: código MinIO listo, falta S3_* en Coolify) |
| **P1** | 28 | 27 | 1 deferred (I-INF-03 backups: no requerido ahora) |
| **P2** | 40 | 31 | 9 skip (producto/schema/diseño mayor) |
| **Total** | **77** | **~66 done** | **~11 ops/skip** |

Leyenda estado: `done` = código arreglado · `ops` = requiere acción Coolify/humano · `skip` = producto / fuera de alcance código ahora · `intentional` = diseño deliberado

### Prefijos de ID

| Prefijo | Significado |
|---------|-------------|
| `F-*` | Frontend (`front-factofarm`) |
| `B-*` | Backend (`api-factofarm`) |
| `I-*` | Infra / Coolify / Docker |
| `UI` / `UX` / `RES` | Interfaz / experiencia / responsive |
| `LOG` | Lógica de negocio |
| `PER` | Persistencia de datos |
| `INF` | Infraestructura |

---

## 1. Tabla maestra

| ID | Sev | Estado | Título |
|----|-----|--------|--------|
| F-LOG-01 | P0 | done | Form usuarios: Yup acepta todos los roles |
| B-PER-01 | P0 | done | Import lotes/series con `tenantId` |
| B-LOG-01 | P0 | done | Void cancela AccountReceivable |
| I-INF-01 | P0 | done | MinIO S3_* en Coolify api-factofarm + imagen `santossjba/api-factofarm:latest` redeploy |
| B-PER-02 | P0 | done | Seed no reasigna tenant ajeno |
| B-LOG-02 | P0 | done | Seed no resetea passwords sin flag |
| F-UX-01 | P0 | done | POS móvil: tabs + barra sticky Cobrar |
| F-RES-01 | P0 | done | `overflow-x-auto` en tablas listadas |
| B-LOG-03 | P1 | done | Void caja solo EFECTIVO |
| B-LOG-04 | P1 | done | Return cash en TX + mix EFECTIVO |
| B-LOG-05 | P1 | done | Return ajusta AR |
| B-PER-03 | P1 | done | Numeración advisory lock + unique |
| B-LOG-06 | P1 | done | Promo rebalancea IGV/subtotal |
| F-LOG-02 | P1 | done | POS `payableTotal` con promo |
| B-PER-04 | P1 | done | Recepción exige lote si manejaLotes |
| B-PER-05 | P1 | done | Traslados lote + tenant product |
| B-PER-06 | P1 | done | Ajustes stock atómicos |
| B-PER-07 | P1 | done | AR payment condicional saldo |
| B-LOG-07 | P1 | done | CPE void antes de void local |
| B-LOG-08 | P1 | done | Cotización guard establishment |
| B-LOG-09 | P1 | done | Transfer assert producto tenant |
| B-PER-08 | P1 | done | Billing job claim updateMany |
| B-PER-09 | P1 | done | Import Excel + ProductLotStock |
| F-PER-01 | P1 | done | Carrito POS sessionStorage |
| F-PER-02 | P1 | done | Sync offline al init + reintento |
| F-LOG-03 | P1 | done | Interacciones: error bloquea cobro |
| F-LOG-04 | P1 | done | IGV CPE tax-inclusive |
| F-LOG-05 | P1 | done | Refresh mutex compartido |
| F-PER-03 | P1 | done | Customer display clear al init |
| F-LOG-06 | P1 | done | Pagos solo al abrir modal |
| F-LOG-07 | P1 | done | Stock usa availableStock de línea |
| B-LOG-10 | P1 | done | Refresh rotation en TX |
| B-LOG-11 | P1 | done | Support session en refresh |
| B-LOG-12 | P1 | done | PermissionsCacheService TTL 30s |
| B-LOG-13 | P1 | done | Decrypt recetas en mapDetail |
| B-PER-10 | P1 | done | `@@unique([tenantId, codigo])` |
| I-INF-02 | P1 | done | SMTP_HOST requerido en prod |
| I-INF-03 | P1 | deferred | Backups Coolify — **no requerido ahora** |
| F-RES-02 | P1 | skip | Card-row móvil (~40 páginas) — diseño mayor |
| F-UX-02 | P1 | done | Productos columnas mobile defaults |
| F-UX-03 | P1 | done | Notas-venta kebab móvil |
| F-UX-04 | P1 | done | Search menú desde `lg` |
| F-UX-05 | P1 | done | Sidebar aria-label / expanded |
| F-UX-06 | P1 | done | F-keys ocultos en &lt;md |
| F-RES-03 | P1 | done | Modales con overflow-x-auto |
| F-UX-07 | P1 | done | Tenant pill desde `md` |
| F-LOG-08 | P2 | skip | Remap guards finos (producto) |
| F-PER-04 | P2 | done | loadMe error toast |
| F-PER-05 | P2 | done | platform-clientes queryParams |
| F-PER-06 | P2 | done | Notas-venta filtros ↔ URL |
| B-PER-11 | P2 | done | Physical count PROCESANDO/FINALIZADO |
| B-PER-12 | P2 | done | Lot import TX chunks |
| B-LOG-14 | P2 | done | Dispatch requiere saleId |
| B-PER-13 | P2 | done | Idempotency (unique + TX) |
| B-LOG-15 | P2 | done | Post-commit logger.error |
| B-PER-14 | P2 | skip | Consent tenantId (producto) |
| B-PER-15 | P2 | skip | Catálogos pharma globales (producto C6) |
| B-PER-16 | P2 | skip | Cascades Prisma (mitigado soft-delete) |
| B-PER-17 | P2 | done | ElectronicDocument → Archivo FK |
| B-LOG-16 | P2 | done | Files RequirePermissions |
| B-LOG-17 | P2 | done | Permissions requiere users.read |
| B-LOG-18 | P2 | done | Lockout email + IP |
| B-LOG-19 | P2 | intentional | ADMIN bypass (documentado) |
| B-PER-18 | P2 | skip | AdverseEvent cipher (producto LPDP) |
| B-LOG-20 | P2 | done | Purge requiere CONFIRM=I_UNDERSTAND |
| B-PER-19 | P2 | skip | Archivo.tenantId nullable (compat) |
| B-PER-20 | P2 | skip | Complaint por farmacia (C3 producto) |
| F-A11Y-01 | P2 | done | Modal close aria-label |
| F-A11Y-02 | P2 | done | signin-title id |
| F-A11Y-03 | P2 | done | Pagination aria |
| F-UX-08 | P2 | done | Detail modal loading/error |
| F-RES-04 | P2 | done | POS lot modal stack |
| F-A11Y-04 | P2 | done | POS modals ariaLabel |
| F-UX-09 | P2 | done | Landing Ir al panel en xs |
| F-UX-10 | P2 | done | Auth theme toggle xs |
| F-A11Y-05 | P2 | done | Notas-venta date labels |
| F-A11Y-06 | P2 | done | Resúmenes date label |
| F-UX-11 | P2 | done | Caja chica movement loading |
| F-UI-01 | P2 | done | Productos app-button |
| F-UI-02 | P2 | done | Mi farmacia app-button |
| F-RES-05 | P2 | done | Comparativo overflow |
| F-RES-06 | P2 | done | Packs modal overflow |
| F-RES-07 | P2 | done | Dashboard chart scroll |
| F-RES-08 | P2 | skip | Charts shared (demo, no admin) |
| F-RES-09 | P2 | done | Legal tables overflow |
| F-RES-10 | P2 | done | Importar precios truncate |
| F-UI-03 | P2 | done | Sidebar “Otros” |
| F-UX-12 | P2 | done | Landing CTAs xs |

---

## 2. Detalle P0

### F-LOG-01 — Formulario de usuarios rechaza la mayoría de roles

- **Área:** Logic · **Repo:** front
- **Archivo:** `front-factofarm/src/app/modules/admin/pages/usuarios/usuario-form-modal/usuario-form-modal.component.ts`
- **Evidencia:** Schema Yup `.oneOf(['ADMINISTRADOR', 'VENDEDOR'])` mientras `ROLE_OPTIONS` incluye CAJERO, FARMACEUTICO, etc. y el default es `CAJERO`.
- **Impacto:** No se puede crear/editar cajeros ni farmacéuticos; editar un usuario con rol distinto a Admin/Vendedor falla la validación.

### B-PER-01 — Import lotes/series sin aislamiento de tenant

- **Área:** Persistence · **Repo:** api
- **Archivo:** `api-factofarm/src/modules/inventory-movements/inventory-movements.service.ts` (`importLots`, `importSeries`)
- **Evidencia:** Lookup de producto por `codigoInterno` + `deletedAt: null` **sin** `tenantId`. `codigoInterno` no es unique global.
- **Impacto:** Un tenant puede mutar stock/lotes de otro si coinciden códigos internos.

### B-LOG-01 — Anulación de venta no cancela cuentas por cobrar

- **Área:** Logic · **Repo:** api
- **Archivo:** `api-factofarm/src/modules/sales/sales.service.ts` (`voidSale` vs `create`)
- **Evidencia:** `create` escribe `accountReceivable` para crédito/convenio; `voidSale` restaura stock y marca venta ANULADA pero **no** toca AR (estado `ANULADA` existe en enum y no se usa).
- **Impacto:** CxC viva sobre ventas anuladas; cobranza y reportes inflados.

### I-INF-01 — Uploads en disco efímero → **MinIO**

- **Área:** Infra · **Repo:** api / Coolify
- **Estado:** Código migrado a `S3MinioFileStorage` cuando `S3_ENDPOINT` + keys están definidos. Bucket verificado: `factofarm` en `https://storage.factosysperu.com`.
- **Pendiente operativo:** Añadir en Coolify `api-factofarm` las vars `S3_*` y redeploy.

### B-PER-02 — Seed reasigna establecimientos entre tenants

- **Área:** Persistence · **Repo:** api
- **Archivo:** `api-factofarm/prisma/seed/steps/establishments.ts`
- **Evidencia:** Upsert por `codigo` (unique global) y `update: { tenantId, ... }`.
- **Impacto:** Seed accidental en DB compartida/prod mueve establecimientos reales al tenant demo.

### B-LOG-02 — Seed resetea passwords demo

- **Área:** Logic · **Repo:** api
- **Archivo:** `api-factofarm/prisma/seed/steps/admin-user.ts`
- **Evidencia:** Re-hash de passwords en plaintext del seed + log de credenciales; sin guard `NODE_ENV !== production`.
- **Impacto:** Account takeover si se corre seed en producción.

### F-UX-01 — POS móvil: checkout debajo del fold

- **Área:** UX / Responsive · **Repo:** front
- **Archivo:** `front-factofarm/src/app/modules/admin/pages/punto-venta/punto-venta.component.html`
- **Evidencia:** Grid `md:grid-cols-5` se apila; catálogo `max-h-[40vh]`; carrito + **Cobrar (F2)** debajo.
- **Impacto:** En teléfono/tablet el cajero debe scrollear para cobrar; flujo crítico lento en horas pico.

### F-RES-01 — Tablas sin contenedor de scroll horizontal

- **Área:** Responsive · **Repo:** front
- **Archivos (sin `overflow-x-auto`):**
  - `reporte-compras-sugerido/reporte-compras-sugerido.component.html`
  - `cuentas-pagar/cuentas-pagar.component.html`
  - `cuentas-cobrar/cuentas-cobrar.component.html`
  - `cotizaciones/cotizaciones.component.html`
  - `medicos/medicos.component.html`
  - `comprobante-electronico/comprobante-electronico.component.html`
  - `salida-venta-lotes/salida-venta-lotes.component.html`
- **Impacto:** Overflow horizontal a nivel página; filtros y toolbars salen de pantalla en &lt;768px.

---

## 3. Detalle P1

### Dinero / caja / AR / fiscal (API)

| ID | Título | Evidencia / impacto |
|----|--------|---------------------|
| B-LOG-03 | Void caja ≠ efectivo cobrado | `voidSale` usa `sale.total.negated()`; `create` solo suma pagos EFECTIVO → arqueo corrupto en pagos mixtos |
| B-LOG-04 | Return cash fuera de TX | `createReturn`: stock en `$transaction`; `cashMovement` después; sin proporción EFECTIVO |
| B-LOG-05 | Return no ajusta AR | Crédito/convenio mantiene saldo tras devolución |
| B-PER-03 | Race numeración documentos | `resolveDocumentNumber` (`MAX+1`) fuera de TX; sin `@@unique([establishmentId, documentType, serie, numero])` |
| B-LOG-06 | Promo rompe IGV | Promo resta de `total`/`descuentoTotal` sin rebalancear `subtotal`/`igvTotal` (a diferencia de `applySaleLevelDiscount`) |
| B-LOG-07 | CPE void swallow | `billing.voidFromSale(...).catch(() => undefined)` → venta ANULADA local, CPE puede seguir ACEPTADO |
| B-LOG-08 | Cotización sin guard de establecimiento | Update por `id` solo; posible CONVERTIDA cruzada |
| B-PER-08 | Billing jobs sin claim | Flag in-memory; doble emisión OSE si multi-instancia |
| B-LOG-15 | Post-commit swallow | Billing emit, loyalty, promo, ledger controlado: errores silenciados |

### Stock / lotes (API)

| ID | Título | Evidencia / impacto |
|----|--------|---------------------|
| B-PER-04 | Goods receipt sin lote obligatorio | Warehouse siempre upsert; lot solo si `codigoLote`; no enforce `manejaLotes` |
| B-PER-05 | Transfer warehouse/lot drift | `codigoLote` opcional; stock almacén siempre, lot solo si hay código |
| B-PER-06 | Adjustment RMW | `executeAdjustmentDelta` sin `updateMany` + `gte` (a diferencia de outbound ventas) |
| B-LOG-09 | Transfer sin assert producto tenant | Warehouses sí; productos no |
| B-PER-09 | Import Excel sin ProductLotStock | Crea warehouse stock aunque `manejaLotes` |
| B-PER-07 | AR payment race | Read saldo → write sin lock; doble cobro posible |
| B-PER-11 | Physical count no atómico | Loop de ajustes; estado FINALIZADO solo al final |
| B-PER-12 | Import lots parcial | Row-by-row sin TX envolvente |
| B-LOG-14 | `POST sales/dispatch` | Decrementa stock sin sale linkage |

### POS / front lógica

| ID | Título | Evidencia / impacto |
|----|--------|---------------------|
| F-LOG-02 | Pagos vs promo | `promotionCode` en request; validación usa `cartTotal()` sin descuento promo |
| F-PER-01 | Carrito efímero | Solo signal; refresh pierde venta en curso |
| F-PER-02 | Offline queue | `syncOfflineQueue` solo en evento `online`, no en init |
| F-LOG-03 | Interacciones | `catch` limpia alerts → permite cobrar sin revisión |
| F-LOG-04 | IGV CPE especial | `amount * 0.18` vs extracción tax-inclusive del POS |
| F-LOG-05 | Refresh mutex | Cada 401 llama `refreshSession()` en paralelo |
| F-PER-03 | Customer display stale | localStorage snapshot sobrevive reload del POS |
| F-LOG-06 | Split payments reset | `effect` en `cartTotal()` mientras modal abierto |
| F-LOG-07 | Stock vs catálogo | Si producto no está en `catalog()`, validación falla |

### Auth / LPDP / multi-tenant / infra

| ID | Título | Evidencia / impacto |
|----|--------|---------------------|
| B-LOG-10 | Refresh no atómico | Revoke + issueTokens sin `$transaction` |
| B-LOG-11 | Support refresh | `refresh()` siempre `issueTokens(user)` → pierde contexto tenant de handoff |
| B-LOG-12 | Permisos JWT | Revocación efectiva solo al expirar access/refresh |
| B-LOG-13 | Recetas LPDP | Escribe cipher; `mapDetail()` no llama `decrypt` → UI nula en prod |
| B-PER-10 | codigo establecimiento | `@unique` global; no `@@unique([tenantId, codigo])` |
| I-INF-02 | SMTP | Sin `SMTP_HOST` loguea URL y retorna ok |
| I-INF-03 | Backups | Coolify `postgresql-db` → `backups: []`; solo script manual |

### UX / responsive P1

| ID | Título | Notas |
|----|--------|-------|
| F-RES-02 | Solo tablas en ~40 páginas admin | Sin variante card móvil |
| F-UX-02 | Productos 15+ columnas | Solo `overflow-x-auto` |
| F-UX-03 | Notas-venta overcrowded | Hasta 6 icon-only por fila |
| F-UX-04 | Search menú `xl:block` | Tablets sin command palette |
| F-UX-05 | Sidebar a11y | Icon-only sin `aria-label` / `aria-expanded` |
| F-UX-06 | POS F-key hints | Irrelevantes en touch; consumen altura |
| F-RES-03 | Modales `min-w-[640–900px]` | Scroll doble |
| F-UX-07 | Tenant pill `lg:inline` | Multi-tenant en tablet sin contexto visible |

---

## 4. Detalle P2 (resumen agrupado)

### Persistencia / schema / compliance

- **B-PER-14..20:** Consent/PharmacistLicense/Medico/Complaint globales o sin tenant; cascades en price history; ElectronicDocument sin FK a Archivo; Archivo.tenantId nullable.
- **B-PER-18:** AdverseEvent plaintext vs recetas cifradas.
- **B-LOG-16..20:** Files sin permisos; catálogo permissions abierto; lockout sin IP; ADMIN bypass; audit purge hard-delete.

> **TODO (scope producto — no migrar en beta):** B-PER-14, B-PER-15, B-PER-16, B-PER-18, B-PER-19, B-PER-20 quedan abiertos a propósito (tenant en consent/medico/complaint, cascades, cifrado adverse). Requieren diseño de producto + migraciones pesadas; no incluir en PRs de hardening beta. **B-PER-17** sí se corrigió (FK opcionales ElectronicDocument → Archivo).

### Front UX / a11y / UI

- **F-A11Y-01..06:** Modal close, signin labelledby, pagination, POS ariaLabel, dates sin label.
- **F-UX-08..12 / F-UI-01..03:** Detail modal vacío al cargar; landing/auth CTAs hidden xs; botones inconsistentes; “Others” en inglés.
- **F-RES-04..10:** Lot modal, packs, charts, legal tables, import precios.
- **F-LOG-08 / F-PER-04..06:** Guards nav vs API; loadMe silencioso; queryParams platform; filtros no URL.

---

## 5. Ya documentado (no duplicar como bug nuevo)

Fuente: [`BETA-LAUNCH-CHECKLIST.md`](./BETA-LAUNCH-CHECKLIST.md), [`SAAS-TENANT-ISOLATION.md`](./SAAS-TENANT-ISOLATION.md), [`DATA-RETENTION-PLAN.md`](./DATA-RETENTION-PLAN.md), [`LIBRO-RECLAMACIONES.md`](./LIBRO-RECLAMACIONES.md).

| Ítem checklist / doc | Estado | Relación con este informe |
|----------------------|--------|---------------------------|
| A1 SMTP | `[~]` | Cubierto como **I-INF-02** (bug de UX: fake success) |
| A7 Seed en prod | `[~]` | Cubierto como **B-PER-02 / B-LOG-02** |
| A9 CPE solo con OSE real | `[ ]` | Producto; no bug de código |
| B5 Volumen uploads | `[ ]` | Cubierto como **I-INF-01** |
| B6 Sentry | `[ ]` | Ops; no re-listado como defect |
| C2 Series POS catálogo | `[ ]` | Front aún free-text en POS |
| C3 Libro reclamaciones por farmacia | `[ ]` | = **B-PER-20** (modelo) |
| C4 ARCO anonimización profunda | `[ ]` | Soft-delete customer only |
| C5 WhatsApp/Meta / email cotización | `[ ]` | wa.me + SMS pendiente |
| C6 Catálogos globales solo lectura | `[ ]` | Labs/médicos writable por tenants |
| Bizlinks / RC Factiliza / APIsPERU parcial | código | Capability flags; no “bug” sino scope |
| Signup self-service | front | “Próximamente disponible” |
| Partitioning / multi-DB | DATA-RETENTION | Fase 4/5 no aplicadas |
| ROADMAP.md / AUDITORIA-SISTEMA.md | README | Enlaces rotos → este archivo cubre auditoría |

---

## 6. Observaciones positivas (no defectos)

- Venta POS principal: stock + sale en la misma `$transaction`.
- Outbound con lotes: `updateMany` condicional `stock: { gte }`.
- Money en Prisma: `Decimal` (no Float).
- Prod exige `JWT_SECRET`, `LPDP_SENSITIVE_ENCRYPTION_KEY`, `BILLING_ENCRYPTION_KEY`.
- Modal shell: focus trap, Escape, `max-h` viewport.
- Muchas listas admin: `queryPageState` + empty/loading/error.
- Coolify (2026-09-19): `api-factofarm` y `front-factofarm` **running:healthy**; health API `database: connected`.

---

## 7. Remediación ejecutada (2026-09-20)

Oleadas 1–4 + pasadas extra + MinIO: **~66 IDs `done`**. Builds API y front OK.

### Pendiente humano / Coolify

1. **I-INF-01** — **done (2026-09-20):** vars `S3_*` en Coolify `api-factofarm`, imagen `santossjba/api-factofarm:latest` pusheada y redeploy **healthy**. Log: `MinIO/S3 bucket listo: factofarm`.
2. **I-INF-03** — Backups Postgres: **diferido** (no requerido ahora).
3. Migraciones Prisma: corren en entrypoint al deploy (`prisma migrate deploy`).

### Skip conscientes (producto)

- F-RES-02 card-row en 40 páginas, F-LOG-08 remap permisos finos  
- B-PER-14/15/16/18/19/20 (tenant compliance, catálogos, cascades, AdverseEvent, Complaint C3)  
- B-LOG-19 ADMIN bypass (intentional)
- I-INF-03 backups Coolify (aplazado a propósito)

---

## 8. Cómo usar este documento

1. Marcar cada ID como `open` / `in_progress` / `done` al corregir (opcional: añadir columna Estado en PRs).  
2. Un PR por oleada o por grupo de IDs relacionados.  
3. Tras cada oleada: `npm run build` (api + front) y smoke en Coolify si toca deploy.  
4. No mezclar con trabajo de producto checklist (Bizlinks, Meta WA, etc.) salvo que se priorice explícitamente.

---

*Generado a partir de auditoría estática 2026-09-19. Hallazgos requieren evidencia en archivo; no se incluyen especulaciones.*
