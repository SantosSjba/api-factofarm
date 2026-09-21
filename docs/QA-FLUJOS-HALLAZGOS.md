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
| QA-CAMPANA-01 | CAJERO → `/punto-venta` UI | **fixed** | warehouses + pharmacy-profile aceptan `sales.read`/`nav.punto_venta` |
| QA-CAMPANA-02 | CAJERO `GET /users` | **fixed** | sin `users.read` incondicional; cajero → 403; admin → 200 |
| QA-CAMPANA-03 | Campaña planes 01–84 + E2E | **DONE smoke** | Copia `docs/planes de prueba/ejecucion-2026-09-20/` |
| QA-CAMPANA-04 | 2.º almacén Oficina Principal | **fixed** | seed `Almacén secundario` en código `0000` |
| QA-CAMPANA-05 | Cajero E2E NV | **PASS** | NV01-00000001; caja 100→103; stock 9911→9910 |
| QA-CAMPANA-06 | E2E05 traslado | **PASS** | race receive 201+400; Kardex/valorizado 200 |
| QA-CAMPANA-07 | POS warehouses scope sesión | **fixed** | almacenes del establecimiento de sesión para roles sin inventario (`inventory-movements.service`) |
| QA-CAMPANA-08 | E2E02 compra/recepción/CxP | **PASS** | F001 11 + F002 16.5 + GR 7.50 PAGADAS |
| QA-CAMPANA-09 | E2E04 anulación + NC NV | **PASS** | Cajero void 403; gerente void 201; doble 400; NC NV 400; stock restaurado |
| QA-CAMPANA-10 | E2E08 NV vs BOLETA MOCK | **PASS** | NV OK; BOLETA 400 sin OSE |
| QA-CAMPANA-11 | E2E13 personal/comisión | **PASS** | NV01-00000006 + void; comisión vendedor 0 post-anulación |
| QA-CAMPANA-12 | E2E15 plantillas + import | **PASS** parcial | 8 GET xlsx; import 1 fila DNI 70485888 + cleanup; RWD/red BLOQUEADO |
| QA-CAMPANA-13 | E2E03 crédito/mixto | **PASS** | MIX/CREDIT + PDF generado 144 KB `%PDF-` |
| QA-CAMPANA-14 | E2E06 receta/dispensación | **PASS** parcial | RX-000001 + NV01-00000016; exceso/vencida 400; titular OK NV01-00000022 |
| QA-CAMPANA-15 | Receta paciente ajeno | **fixed** | POST /sales ahora 400 «La receta no pertenece al cliente de la venta» |
| QA-CAMPANA-16 | E2E10 pack/promo/convenio | **PASS** | cupón 10% + convenio 50% + pack NV01-00000023 |
| QA-CAMPANA-17 | Cupón vencido no rechaza | **fixed** | POST /sales con código inválido/vencido → 400 |
| QA-CAMPANA-18 | Pack no vendible en POS | **fixed** | pack se expande a componentes; NV01-00000023 total 4.5 |
| QA-CAMPANA-19 | E2E14 ARCO + reclamo | **PASS** | ARCO COMPLETADA; LR-20260920-BPECJ0 IN_REVIEW; audit OK |
| QA-CAMPANA-20 | E2E05 conteo físico | **PASS** | conteo `b6f5653c-…` WH2 3→2 applied=1; umbral −80 pending `a47a37ca-…` auto 403 |
| QA-CAMPANA-21 | E2E07 cadena de frío | **PASS** | lecturas 4.5/12.8; lote vencido; cuarentena CAMPANA-36 |
| QA-CAMPANA-22 | E2E02 CxP cierre | **PASS** | F001/F002 + `3569e7e1-…` GR 7.50→0 PAGADA |
| QA-CAMPANA-23 | ADMIN lista/ve tenants SaaS | **fixed** | `assertPlatformAdmin` en `/tenants`; ADMINISTRADOR ya no bypass a consola |
| QA-CAMPANA-24 | Revocar sales.* no quita POS | **esperado** | `nav.punto_venta` reexpande `sales.write`; POST /sales es OR |
| QA-CAMPANA-25 | PLE period YYYYMM → 500 | **fixed** | `parseYearMonth` acepta YYYYMM/YYYY-MM; inválido → 400 |
| QA-CAMPANA-26 | Special CPE `lines` rechazado | **fixed** | `EmitSpecialDocumentLineDto` + `@ValidateNested`; MOCK sigue 400 por OSE |
| QA-CAMPANA-27 | E2E06 consumo hospitalario | **PASS** | `9997ff11-…` DISPENSADO stock −1; cancel `5e8f108c-…`; dups 400 |
| QA-CAMPANA-28 | UI hospital/frío/RC + reportes | **PASS** | pantallas live; tax calc 30; DIGEMID top/ABC/BPA/lote 200 |
| QA-CAMPANA-29 | `{{ row.numero` sin cerrar | **fixed** | Anulaciones/CPE/médicos/proveedores; retest NV01-00000023 + T001-00000003 |
| QA-CAMPANA-30 | UI percepción/SIRE/GR/CIE/RX | **PASS** | percepciones + SIRE compras 3/S/62.50 + CIE J06.9 + recetas |
| QA-CAMPANA-31 | UI lotes/traslados/CxC/CxP/mayor | **PASS** | lotes QA-EXP-2020; CxP 3; mayor 55/62.70; promos 3 |
| QA-CAMPANA-32 | UI OC/kardex/NV/banco/convenio | **PASS** | OC-00001/00002; kardex Paracetamol; NV01-00000024; banco 20/5 |
| QA-CAMPANA-33 | UI envío/inventario/finanzas/contab | **PASS** | CxP GR 7.50 PAGADA; sugerido 17+8; balance 58.50; pagos 7.50 |
| QA-CAMPANA-34 | MOCK bloquea especiales en QA | **fixed** | GR transportista V001-00000001 RECHAZADO; CxC 5/5 PAGADA |
| QA-CAMPANA-35 | UI plataforma SUPER_ADMIN + retención | **PASS** | 2 tenants; lead NEW; LR IN_REVIEW; dry-run 201 |
| QA-CAMPANA-36 | Zona frío inactiva no bloqueaba refrigerado | **fixed** | venta/inbound/hospital 400 cuarentena |
| QA-CAMPANA-37 | Provision SaaS creaba GERENTE sin POS | **fixed** | ADMINISTRADOR + POS gerente; NV01-00000002 |
| QA-CAMPANA-38 | MOCK no emitía boleta/NC/RC en QA | **fixed** | B001-00000001 + BC01 + RC ACEPTADO mock |
| QA-CAMPANA-39 | CreateSaleDto rechazaba moneda | **fixed** | NV01-00000026 USD; EUR 400 |
| QA-CAMPANA-40 | OSE sandbox público | **closed** | Nubefact demo muerta; SUNAT beta WSDL 200; CPE QA = MOCK |

---

## Campaña planes de prueba 2026-09-20

| Campo | Valor |
|-------|-------|
| **Copia** | `docs/planes de prueba/ejecucion-2026-09-20/` |
| **Front / API** | `localhost:4200` / `localhost:3000` (health ok) |
| **Roles** | SUPER_ADMIN + ADMINISTRADOR + CAJERO (seed) |
| **Alcance** | Criterios PRE/NAV + 84 opciones + E2E01–15 (casillas marcadas) |
| **P0 nuevos** | Ninguno en smoke read-only |
| **P1 nuevos** | QA-CAMPANA-01, QA-CAMPANA-02 — **fixed** 2026-09-20 |
| **Gaps** | CPE QA = MOCK ACEPTADO. OSE REST sin token público vigente (CAMPANA-40). SUNAT beta SOAP oficial sí responde. P1 15/17/18/23/25/26/29/34/36/37/38/39 **fixed**. |
| **Conteo orientativo** | E2E: PASÓ 15 · PASÓ parcial 0 · BLOQUEADO 0 |
| **Evidencia** | `ejecucion-2026-09-20/EVIDENCIA-CAMPANA.md` |

### QA-CAMPANA-01 — Cajero no opera POS en UI — **fixed**
- Causa: bootstrap POS llamaba `GET …/catalogs/warehouses` (`inventory.read`) y `GET …/pharmacy-profile` (solo establishments).
- Fix: OR-in `sales.read` + `nav.punto_venta` en ambos GET ([`inventory-movements.controller.ts`](../src/modules/inventory-movements/inventory-movements.controller.ts), [`establishments.controller.ts`](../src/modules/establishments/establishments.controller.ts)).
- QA: cajero → warehouses/pharmacy-profile **200**; admin POS intacto.

### QA-CAMPANA-02 — Listado de usuarios excesivo para CAJERO — **fixed**
- Causa: `expandUserPermissionCodes` / `resolveUserPermissionCodes` inyectaban `users.read` a todos los roles.
- Fix: quitar grant incondicional; strip `users.read` si no hay `nav.usuarios`; tests actualizados; seed re-sync.
- QA: cajero `GET /users` **403**; admin **200**.

### QA-CAMPANA-04 — Segundo almacén Oficina Principal — **fixed**
- Seed: `Almacén secundario` en establecimiento `0000` ([`establishments.ts`](../prisma/seed/steps/establishments.ts)).
- QA: `GET /warehouses` admin sesión 0000 → total **2**.

### QA-CAMPANA-05 — Cajero E2E NV — **PASS**
- Live 2026-09-20: NV01-00000001 total 3; stock 9911→9910; caja apertura 100 → saldo 103.

### QA-CAMPANA-06 — E2E05 traslado — **PASS**
- WH: Almacén principal `74a035e4-8a91-4874-aa2b-88e543c656ba` → Almacén secundario `86cef972-113d-4a20-b162-5e50965eb84e`.
- Producto Paracetamol `acee61fa-515e-4b11-b0aa-340b5345f2fd`.
- Transfer `ac63640f-0e58-44e7-8409-a614afe17ac0` create→dispatch→receive; stock FROM 9908 (−3), TO 3 (+3).
- Conteo físico / umbral aprobación: no corridos (BLOQUEADO).

### QA-CAMPANA-07 — POS warehouses scoped a establecimiento de sesión — **fixed**
- Roles sin inventario veían/eligían almacenes fuera del establecimiento de sesión.
- Fix en `inventory-movements.service` (scope por establecimiento de sesión); documentado como fixed (código aplicado en paralelo).

### QA-CAMPANA-08 — E2E02 compra / recepción / lotes / CxP — **PASS**
- Proveedor `b2bd8ac9-99fa-4898-b4cc-d300e918db5b` (RUC 20552103816).
- Producto lot-managed `71535c4f-f676-4887-8142-ed06a556c04b` stock 0 → recepción.
- OC `efcee033-47ee-45f8-abb4-c261006cd355` / `OC-2026-00001`: BORRADOR→APROBADA→ENVIADA→PARCIALMENTE_RECIBIDA→RECIBIDA.
- Recepción 2 u QA-L1 + 3 u QA-L2; over-receive **400**.
- CxP 2 filas (totales 11 y 16.5); abono parcial amount 5 → saldo 6 **PARCIAL**; cierre 6 → **PAGADA** (`c0e941d4-…`).
- Veredicto flujo: PASÓ parcial (2.ª CxP 16.5 abierta).

### QA-CAMPANA-09 — E2E04 anulación + NC sobre NV — **PASS**
- Cajero `NV01-00000002` `90e7b042-…`; `POST /sales/:id/void` → **403**.
- Gerente misma sucursal → **201** ANULADA + stock restaurado (9910).
- Segundo void → **400**. Admin `POST /returns` sobre `NV01-00000013` → **400**.

### QA-CAMPANA-10 — E2E08 NV vs BOLETA MOCK — **PASS**
- NV permitida; `documentType=BOLETA` → **400** (MOCK / sin OSE). Confirmado QA-RULE-03.

### QA-CAMPANA-11 — E2E13 personal / productividad / comisión — **PASS** parcial
- Gerente sucursal 0001; vendedor `f4e60cfb-31a4-4b2f-ad7b-205153e93011` horario Lun 08-17; check-in/out `ee4d8c67-…`; licencia `c5ef7cb1-…` VACACIONES APROBADO.
- Comisión: regla 5% `ae795550-…`; productivity-report **200** (ventasCount 0 este periodo para la mayoría). Sin venta+void nueva del vendedor.
- Cambio empleado: cajero `a1c49c06-…` horario Mar 09-18 distinto del vendedor Lun 08-17.
- Veredicto flujo: PASÓ parcial.

### QA-CAMPANA-12 — E2E15 plantillas + import — **PASS** parcial
- 8 GET plantillas **200** `application/xlsx` (clientes, productos, packs, lotes/series, precios y menús correspondientes).
- Import clientes live: preview created=1; persist DNI `70485888` `727d640f-…`; DELETE cleanup **200**.
- RWD 390/tablet y interrupt de red: BLOQUEADO.
- Veredicto flujo: PASÓ parcial.

### QA-CAMPANA-13 — E2E03 crédito / mixto / CxC — **PASS** parcial
- Cliente BUSTAMANTE `dc6323c9-9ad5-4e1b-a4a1-818f235954bc` diasCredito 30.
- MIX NV01-00000014 `303213e2-833b-4440-a0c3-277304d688d9` EFECTIVO 1 + CREDITO 2 → AR saldo 2.
- CREDIT NV01-00000015 `08180707-c75b-4c93-b596-cce7dab62190` CREDITO 3; AR `44b9624c-77d7-40f6-8c48-835828595c6d` abono 1 luego 2 → saldo 0.
- Reimpresión/PDF BLOQUEADO; reportes comparados PASÓ parcial.
- Veredicto flujo: PASÓ parcial.

### QA-CAMPANA-14 — E2E06 receta / dispensación — **PASS** parcial
- Médico `ae042a70-…` CMP QA820928; RX-000001 `d7452fc7-…` 1 u Paracetamol.
- Dispensación POS NV01-00000016 → receta COMPLETADA (1/1).
- Exceso, vencida y dispense duplicado → **400**. Sustituto no autorizado → **400**.
- Paciente ajeno: ver QA-CAMPANA-15.
- Producto demo no controlado; ledger vacío; reporte médico 200.

### QA-CAMPANA-15 — Receta de paciente ajeno se dispensa — **fixed**
- Antes: POST /sales cliente `c1faba8a-…` + receta de BUSTAMANTE → **201 NV01-00000017**.
- Fix: `validateForSale` exige titular; `applyDispenseFromSale` filtra `customerId`; venta con `prescriptionId` siempre valida (no solo si el SKU exige receta).
- Retest: RX-000004 + cliente ARCO → **400** «La receta no pertenece al cliente de la venta». Titular NV01-00000022 **201**.

### QA-CAMPANA-16 — E2E10 pack / promo / convenio — **PASS**
- Pack `9bde3e08-…` persistido; promo `QA10625` NV01-00000018 total 2.7 desc 0.3.
- Convenio `QAAG711` 50%: NV01-00000020 copago 1.5 + CxC 1.5; NV01-00000021 precio 2.5 copago 1.25 + CxC 1.25.
- Pack + cupón: NV01-00000023 total 4.5 desc 0.5 (componentes 3+2).
- Void propia **403**; gerente otra sucursal **404**.

### QA-CAMPANA-17 — Cupón vencido no rechaza venta — **fixed**
- Antes: validate=false pero POST /sales `QAEX912` → **201** descuento 0.
- Fix: `applyPromotion(..., requireValidCode)` lanza 400 si el código no existe, está inactivo o venció (código normalizado a mayúsculas).
- Retest: POST /sales `QAEX912` → **400** «Código promocional no válido o vencido».

### QA-CAMPANA-18 — Pack compuesto no vendible en POS — **fixed**
- Antes: POST /sales con id de pack → **404**.
- Fix: `expandCompoundSaleItems` explota el pack a componentes (precio repartido); `pos-catalog` lista packs con stock = min de componentes.
- Retest: NV01-00000023 `0fbe1d66-…` pack `9bde3e08-…` + `QA10625` total **4.5** desc 0.5; líneas 1×3 + 1×2.

### QA-CAMPANA-19 — E2E14 ARCO + reclamo público — **PASS**
- Cliente consentimiento + ARCO ACCESO `55bcf95c-…` COMPLETADA; export 200.
- Público `LR-20260920-BPECJ0` → plataforma IN_REVIEW.
- Auditoría entity=ArcoRequest; retención candidates=[] (sin purge; no se afirma cumplimiento legal).

### QA-CAMPANA-20 — E2E05 conteo físico — **PASS**
- Primer conteo `b5b1f761-…` WH secundario 3=3 finalize applied=0.
- Segundo conteo `b6f5653c-…` 3→2 finalize applied=1 (delta −1 < umbral 50).
- Ajuste −80 u pending `a47a37ca-…`; auto-aprobar admin → 403; gerente 0001 → 403 (sin inventory.adjust). Stock principal no cambió.

### QA-CAMPANA-21 — E2E07 cadena de frío — **PASS** parcial
- Zona `abb5623b-…` REFRIGERADO; lecturas 4.5 (`3bd9f681-…`) y 12.8 (`1652748c-…`).
- Cuarentena / venta de lote restringido no ejercida.

### QA-CAMPANA-22 — E2E02 CxP cierre — **PASS**
- CxP `c0e941d4-e42e-4a3d-9ec8-2cd648683346` saldo 6 PARCIAL → pago 6 → **PAGADA** saldo 0.
- Segunda CxP `93c3fd61-…` 16.5 → pago total **PAGADA** saldo 0; tercer pago **400** «Esta cuenta ya está cerrada».

### QA-CAMPANA-23 — ADMINISTRADOR ve clientes SaaS — **fixed**
- `PermissionsGuard` hace bypass a `ADMINISTRADOR` (`hasChainScope`) y `GET /tenants` no exigía rol de plataforma.
- Live: ADMIN GET `/tenants/:id` de Venta Addin (`21762d36-…`) → **200**.
- Fix: `assertPlatformAdmin` (solo `SUPER_ADMIN`) en todos los handlers de `TenantsController`.
- Retest live: ADMIN GET `/tenants` y `/tenants/:id` tenant B → **403**. SUPER_ADMIN lista → **200** (`Venta Addin`, `FactoFarm Demo`).

### QA-CAMPANA-24 — Quitar `sales.*` no revoca POS — **esperado**
- PATCH permisos del cajero filtrando `sales.*` pero dejando `nav.punto_venta` → POST `/sales` **201** (token viejo y login nuevo).
- Causa: `expandUserPermissionCodes` reañade `sales.write` y el endpoint acepta `sales.write` **o** `nav.punto_venta`.
- No es defect: para revocar venta hay que quitar `nav.punto_venta`. La caché live (30 s) sí se invalida en el PATCH.
- Retest: sin `nav.punto_venta` → POST `/sales` **403** (token viejo y login nuevo). Restore `CAJERO_NAV` OK.

### QA-CAMPANA-25 — PLE `period=202609` devolvía 500 — **fixed**
- `monthBoundsInTimeZone` solo partía `YYYY-MM`; el periodo SUNAT `YYYYMM` lanzaba Error → HTTP 500.
- Fix: `parseYearMonth` acepta ambos; periodo inválido → **400**.
- Retest: `14.1?period=202609` y `2026-09` → **200** `LE…202609141.txt`; `period=2026` → **400**.

### QA-CAMPANA-26 — `POST /billing/documents/special` rechazaba `lines` — **fixed**
- `EmitSpecialDocumentDto.lines` no tenía decoradores class-validator → `forbidNonWhitelisted` **400** «property lines should not exist».
- Fix: `EmitSpecialDocumentLineDto` + `@IsArray` `@ValidateNested` `@Type`.
- Retest: el 400 pasa a «Configure Factiliza…» (MOCK). Emisión real sigue BLOQUEADA sin OSE.

### QA-CAMPANA-27 — Consumo hospitalario live — **PASS**
- POST `/hospital/consumptions` **201** `9997ff11-…` SOLICITADO → PATCH dispense **200** DISPENSADO; stock Almacén principal Paracetamol 9896→9895.
- Segundo dispense **400** «La solicitud ya fue procesada».
- Consumo `5e8f108c-…` cancel **200**; segundo cancel **400**.
- Inbound `QA-FRIO-2027` **201**; DTO sin zona/cuarentena (brecha E2E07, no defect).

### QA-CAMPANA-28 — UI hospital / cadena de frío / resúmenes + reportes — **PASS**
- `/hospital-dispensacion` lista CANCELADO + DISPENSADO. `/cadena-frio` form + sucursal. `/resumenes` Enviar RC.
- `POST /compliance/tax-withholding/calculate` 1000×3 → 30. Listas retención/percepción/detracción `[]`. Sync detracciones `synced=0`.
- Cotización `290a87ef-…` ENVIADA; no hay `convert-to-sale`.
- `pharmaceutical/reports` top/ABC/BPA/lot-trace `QA-FRIO-2027` **200**.

### QA-CAMPANA-29 — Interpolación `{{ row.numero` sin `}}` — **fixed**
- `/anulaciones` mostraba `NOTA_VENTA NV01-{{ row.numero }`. Misma omisión en CPE, médicos y proveedores.
- Fix: cerrar `}}` y `</td>`. Retest: `NV01-00000023` / `00000022` visibles.
- Front `pnpm run build` OK.
- Retest UI: CPE `T001-00000003`; médicos `JUAN PEREZ GARCIA`; proveedores `RUC · 20552103816`.

### QA-CAMPANA-30 — UI percepción / SIRE compras / GR transportista / CIE / recetas — **PASS**
- `/percepciones` tasas 2% y 0.5% + aviso OSE.
- `/sire-compras` 3 recepciones / S/ 62.50; PLE 8.1.
- `/gr-transportista` form con maestros (carrier/driver/vehicle/partida).
- `/cie-10` búsqueda `J06` → J06.9. `/recetas` RX-000005…000002.

### QA-CAMPANA-31 — UI lotes / traslados / delivery / CxC / CxP / mayor / reportes — **PASS**
- `/lotes` QA-EXP-2020 vencido + LOTZBC001/002. `/traslados` 3 RECIBIDO.
- `/ordenes-pedido` D202609200001 ENTREGADO / 0002 CANCELADO.
- `/cuentas-cobrar` NV01-00000020/21 PENDIENTE. `/cuentas-pagar` F001/F002/GR-1789942009084 las 3 PAGADA S/ 0.00.
- `/libro-mayor` debe 55 / haber 62.70. `/reportes` hub. `/promociones-campanas` QA10625/QAEX912/QAOFF56.

### QA-CAMPANA-32 — UI OC / recepción / kardex / NV / banco / convenio — **PASS**
- `/ordenes-compra` OC-2026-00001 RECIBIDA 27.50; 00002 RECIBIDA 7.50. Recepción: sin pendientes.
- Kardex Paracetamol: TRANSFERENCIA ±3 + SALIDA venta.
- NV: NV01-00000024 ANULADA / 000023 COMPLETADA 4.50.
- Conciliación: INGRESO 20 + EGRESO 5 Conciliado. Convenio QAAG711 50%.
- Finance cash-flow/margen/medios **200** con from/to; sin fechas **400**.

### QA-CAMPANA-33 — UI envío / inventario / finanzas / contabilidad + CxP GR — **PASS**
- `/conductores` Luis QA Chofer 45881233; `/vehiculos` QA9E09 Volvo FH; `/direcciones-partida` QA-749812 Av. QA 100 Lima.
- Inventario: movimientos Paracetamol 9,895/3; kardex/reporte PEPS 9,895; sugerido 17 + 8; comparativo vacío; salida lotes FEFO; devolución form.
- Finanzas: balance venta 58.50 / 100%; pagos CxP GR 7.50 19:05; flujo 57.70/−6.30; banco 20/5; medios 191.90/41/150.90.
- Caja POS sesión S/ 50.00. LPDP matriz + QA E2E14. Establecimientos 0000/0001 no hospital. `/platform/*` admin redirige `/dashboard`.
- Contabilidad: Excel CSV 200; resumen 58.50; PLE 14.1/8.1/13.1; resumido 57.70.
- CxP `3569e7e1-…` GR-1789942009084 7.50 → PAGADA (`metodo=EFECTIVO`); UI 3/3 saldo 0.

### QA-CAMPANA-34 — MOCK bloqueaba especiales en desarrollo — **fixed**
- Causa: `getBillingProviderCapabilities(MOCK)` llenaba `unsupportedSpecialDocuments` siempre; `assertSpecialDocumentSupported` hardcodeaba `'production'`.
- Fix: en no-producción MOCK `unsupported=[]` y `supported` = retención/percepción/liquidación/GR transportista; assert usa `NODE_ENV`.
- Retest: POST `/billing/documents/special` GUIA_REMISION_TRANSPORTISTA **201** `010490f0-…` V001-00000001 → RECHAZADO (MOCK). UI CPE lo lista.
- CxC `322ed972-…` 1.50 + `a59ff802-…` 1.25 + `09b4e076-…` 2.00 → PAGADA (5/5 saldo 0).
- SUPER_ADMIN: tenants Venta Addin + FactoFarm Demo; `/tenants/leads` + `/tenants/complaints` 200 (LR-20260920-BPECJ0).
- Jest `billing-capabilities.util.spec` 7 passed. `npm run build` OK.

### QA-CAMPANA-35 — UI plataforma SUPER_ADMIN + retención dry-run — **PASS**
- `/platform/dashboard`: 2 clientes activos, 1 lead, 1 reclamo, 10 usuarios, 2 sucursales. Venta Addin BOTICA + FactoFarm Demo CADENA.
- `/platform/clientes`: Venta Addin 0/3 usuarios · 0/1 sedes; Demo 10/50 · 2/20.
- `/platform/leads`: 1 NEW `ad` / `a@a.com` / farmacia aa (06/09).
- `/platform/reclamaciones`: LR-20260920-BPECJ0 Maria Lopez QA En revisión.
- POST `/platform/data-retention/audit/dry-run` **201** `71b18bf5-…` deletedCount=0; purgeEnabled=false.
- USD: POST /sales `moneda=USD` → **400** «property moneda should not exist» (`CreateSaleDto` solo PEN). Catálogo `products/catalogs/currencies` PEN+USD.
- Zona frío `abb5623b-…` `activo=false` no bloquea venta: NV01-00000025 **201**; zona reactivada. Cuarentena sigue sin API.

### QA-CAMPANA-36 — Zona de frío inactiva no bloqueaba refrigerado — **fixed**
- Causa: `WarehouseZone.activo=false` no se consultaba en venta, inbound ni consumo hospitalario. Producto lote `71535c4f-…` no tenía `esRefrigerado` (NV01-00000025 **201** pre-fix).
- Fix: `assertActiveColdZoneForRefrigeratedProducts` — si hay `esRefrigerado` exige zona `tipo=REFRIGERADO` + `activo=true` en el almacén; si no, **400** cuarentena. Hook en `sales.service`, inbound y `hospital.createConsumption`.
- Retest live: flag `esRefrigerado=true` + zona `abb5623b-…` off → POST `/sales` **400**, inbound **400**, hospital consume **400** («Producto refrigerado bloqueado…»). Zona y flag restaurados.
- Jest `assert-refrigerated-zone.spec` 3 passed. API `npm run build` OK.

### QA-CAMPANA-37 — Provision SaaS creaba GERENTE sin POS/caja — **fixed**
- Causa: `tenants.provision` asignaba `GERENTE_SUCURSAL` sin `nav.punto_venta` / `nav.caja_chica_pos` → caja **403**; plantilla gerente tampoco tenía POS.
- Fix: provision crea `ADMINISTRADOR` (acceso tenant, no plataforma). Gerente gana `POS_NAV`.
- Retest: tenant `e17dc1e2-…` QA E2E01 Farmacia ACTIVE; admin `qa.e2e01.1789951262207@test.local`; almacén `472dad94-…`; caja `6610a07e-…` 50→55; producto `eafb6633-…`; inbound 3; NV01-00000001 (sin caja) + **00000002** con `cashSessionId` **201**; kardex 3→1.
- Aislamiento: demo GET venta/producto nuevos **404**; demo GET tenant **403**. Tenant pre-fix `d4f41ac0-…` SUSPENDED.
- Jest role-templates 2 passed. API `npm run build` OK.

### QA-CAMPANA-38 — MOCK no emitía boleta/NC/RC en QA — **fixed**
- Causa: `assertDocumentTypeAllowed` y `resolveProvider` exigían OSE real; MOCK lanzaba 400.
- Fix: `canEmitElectronicDocuments` permite MOCK fuera de producción; `resolveProvider` usa `MockBillingProvider`.
- Retest: Boleta `B001-00000001` `ffab0eee-…` emit `e05a8eca-…` **ACEPTADO**. NC `BC01-00000001` `a974427f-…` **ACEPTADO**. RC `6c69529c-…` RC-MOCK-2026-09-20 **ACEPTADO**.
- Producción sigue sin CPE si no hay OSE real.

### QA-CAMPANA-39 — Venta USD rechazada por DTO — **fixed**
- Causa: `CreateSaleDto` no tenía `moneda` (forbidNonWhitelisted).
- Fix: `moneda` PEN|USD + columna `Sale.moneda` (migración `20260921010000_sale_moneda`).
- Retest: EUR **400**. USD NV01-00000026 `afbe2022-…` **201**.

### QA-CAMPANA-40 — Credenciales OSE sandbox públicas — **closed**
- Nubefact publica en su ZIP oficial de integración (`PHP-INTEGRACION-CON-NUBEFACT-EJEMPLO-CODIGO-JSON`) una RUTA `demo.nubefact.com/api/v1/03989d1a-…` + TOKEN. **2026-09-20:** `demo.nubefact.com` = NXDOMAIN. El mismo UUID en `www.nubefact.com` / `api.nubefact.com` responde **codigo 11** (ruta no existe). Login web ya no es email+password de un paso; la API de cuenta propia exige activación por soporte.
- Factiliza `apife-qa.factiliza.com` **404** sin token; no hay Bearer público. APIsPERU `facturacion.apisperu.com` **405** (vivo, pide token de panel/WhatsApp).
- SUNAT **sí** publica sandbox SOAP: `https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl` **HTTP 200**. Auth oficial: usuario `[RUC]MODDATOS` / password `MODDATOS` ([pautas beta](https://orientacion.sunat.gob.pe/12-pautas-servicio-beta)). FactoFarm emite por OSE REST, no por ese SOAP.
- Fix de integración: `NubefactBillingProvider` ahora envía `Authorization: Token token="…"` + `fecha_de_emision` `DD-MM-YYYY` (el conector anterior no autenticaba). Listo para RUTA/TOKEN propios de Mi farmacia.
- CPE de campaña permanece **MOCK ACEPTADO** (B001/BC01/RC). No se commitean tokens.

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
| 2026-09-20 | Campaña planes 01–84 + E2E (smoke) | DONE copia ejecucion; P1 cajero POS + users list |
| 2026-09-20 | Fix QA-CAMPANA-01/02/04 | warehouses+pharmacy POS; users.read strip; almacén secundario + seed + builds |
| 2026-09-20 | Cajero E2E NV + E2E05 traslado | NV01-00000001 (caja 100→103); transfer `ac63640f-…` PASS; CAMPANA-05/06/07 |
| 2026-09-20 | E2E02 compra/recepción/CxP live | OC-2026-00001 `efcee033-…`; proveedor `b2bd8ac9-…`; producto `71535c4f-…`; QA-L1/L2; CxP abono 5→6 PARCIAL; CAMPANA-08 PASS |
| 2026-09-20 | E2E04 anulación + E2E08 MOCK | NV01-00000002 void cajero 403 / gerente 201 / dup 400; NC NV 400; BOLETA 400; CAMPANA-09/10 |
| 2026-09-20 | E2E13 personal + E2E15 plantillas + E2E03 crédito | vendedor `f4e60cfb-…` + licencia `c5ef7cb1-…`; 8 GET xlsx 200; MIX NV01-00000014 / CREDIT NV01-00000015 CxC→0; CAMPANA-11/12/13 |

---

## Próximos (opcional)

1. Redeploy front + API (QA-UI-01…12; CAMPANA-01/02/04/07).
2. E2E devolución con stock restore cuando haya OSE de prueba.
3. E2E filtro “hoy” cerca de medianoche Lima (instante fijo).
4. Re-run profundo de casillas BLOQUEADO (conteo/ARCO, abono CxP total, import-into-POS, BRS).
5. Probar pestañas Catálogo/Carrito en dispositivo real &lt;768px.
6. CPE OSE real: pegar RUTA+TOKEN propios de Nubefact/Factiliza/APIsPERU (no hay token REST público vigente). SUNAT beta SOAP = `e-beta` + `[RUC]MODDATOS` / `MODDATOS`.
7. Matriz RWD 390/tablet (E2E15) e interrupt de red en dispositivo real.
