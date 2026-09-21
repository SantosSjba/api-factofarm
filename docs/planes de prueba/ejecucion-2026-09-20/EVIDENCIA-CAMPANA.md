# Evidencia campaña 2026-09-20

## Entorno
- Front: http://localhost:4200 (HTTP 200)
- API: http://localhost:3000/api/v1/health status=ok database=connected
- Zona: America/Lima
- Moneda: PEN (demo)

## Identidades
- Tenant A: FactoFarm Demo (00000000-0000-4000-8000-000000000001) plan=CADENA
- Tenant B: Venta Addin (21762d36-5e54-48b7-94fd-9e5914eed595) plan=BOTICA
- Est A1: Oficina Principal 0000 (944c1bf0-4ce6-483d-9b85-fc232f6f7933)
- Est A2: Sucursal 0001 (d9ecc596-f795-49ba-a5be-d77fd3f245bb)
- Almacenes Oficina Principal (0000): Almacén principal `74a035e4-8a91-4874-aa2b-88e543c656ba` + Almacén secundario `86cef972-113d-4a20-b162-5e50965eb84e` (total 2). Sucursal sin almacén propio sigue pendiente.
- SUPER_ADMIN: superadmin@factosysperu.com / SuperAdmin123!
- SUPER_ADMIN: platform@factosysperu.com / Platform123!
- ADMINISTRADOR: admin@factosysperu.com / Admin123!
- Roles seed presentes: ADMINISTRADOR, ADMIN_CADENA, GERENTE_SUCURSAL, FARMACEUTICO_TITULAR, FARMACEUTICO, TECNICO_FARMACEUTICO, CAJERO, ALMACENERO, CONTADOR, VENDEDOR (+ SUPER_ADMIN)

## Catálogos demo
- products~7, customers~2, suppliers~1, categories~10, brands~8, laboratories~0, units~13, services~1
- Caja: Caja principal · 0000 activa
- QA-* dedicados: a crear por módulo al ejecutar
- QA CRUD 05–18 (cleanup DELETE 200): customer-type `0e5bf306-6f7d-4261-967b-796e9add8180` (`QA-TIPO-CLIENTES-CAMPANA-2026-09-20`); service `7b12b229-b68a-4301-912e-f2b1d470e6d5` (`QA-servicios-campana-2026-09-20`)
- Warehouses admin A (0000): total=2 (principal + secundario). GAP Sucursal sin almacén propio.

## Integraciones
- OSE/SUNAT producción: no usada (pruebas locales) → casos OSE reales BLOQUEADOS
- Archivos/MinIO: endpoints /files health 404 en sonda; upload usuarios probado en QA-UI-12 previa
- Periféricos (impresora/cajón/display): no disponibles en agente → BLOQUEADOS

## Live 2026-09-20 — cajero NV + E2E05 traslado
- Cajero: NV01-00000001 total 3; stock 9911→9910; caja apertura 100 → saldo 103
- Almacén principal: `74a035e4-8a91-4874-aa2b-88e543c656ba`
- Almacén secundario: `86cef972-113d-4a20-b162-5e50965eb84e`
- Producto Paracetamol: `acee61fa-515e-4b11-b0aa-340b5345f2fd`
- Transfer: `ac63640f-0e58-44e7-8409-a614afe17ac0` (create→dispatch→receive)
- Stock post-traslado: FROM 9908 (−3), TO 3 (+3)

## Live 2026-09-20 — E2E02 compra / recepción / CxP
- Proveedor: `b2bd8ac9-99fa-4898-b4cc-d300e918db5b` (RUC 20552103816)
- Producto lot-managed: `71535c4f-f676-4887-8142-ed06a556c04b` (stock 0 → recepción)
- OC: `efcee033-47ee-45f8-abb4-c261006cd355` / `OC-2026-00001`
- Estados OC: BORRADOR→APROBADA→ENVIADA→PARCIALMENTE_RECIBIDA→RECIBIDA
- Recepción: 2 u lote QA-L1, luego 3 u lote QA-L2; over-receive → HTTP 400
- CxP: 2 filas (totales 11 y 16.5); abono parcial amount 5 → saldo 6 estado PARCIAL

## Live 2026-09-20 — E2E04 anulación + E2E08 MOCK
- Cajero NV: `90e7b042-5ba5-4fc2-a02e-e0a5ee94d9ae` / `NV01-00000002` total 3; stock antes 9910
- POST void cajero → **403**; POST void gerente (misma sucursal 0001) → **201** ANULADA + stock restaurado 9910
- Segundo void gerente → **400** (sin doble reverso)
- Admin NV: `8f3ff1ba-09a6-4e84-92db-0b7d13937a8d` / `NV01-00000013`; POST returns → **400**
- POST sale BOLETA → **400** (MOCK / sin OSE)

## Live 2026-09-20 — E2E03 crédito / mixto / CxC
- Cliente BUSTAMANTE: `dc6323c9-9ad5-4e1b-a4a1-818f235954bc` diasCredito 30
- MIX: NV01-00000014 `303213e2-833b-4440-a0c3-277304d688d9` EFECTIVO 1 + CREDITO 2 → AR saldo 2
- CREDIT: NV01-00000015 `08180707-c75b-4c93-b596-cce7dab62190` CREDITO 3
- AR: `44b9624c-77d7-40f6-8c48-835828595c6d` abono 1 luego 2 → saldo 0
- Reimpresión/PDF: BLOQUEADO

## Live 2026-09-20 — E2E13 personal / comisión
- Gerente sucursal 0001
- Vendedor: `f4e60cfb-31a4-4b2f-ad7b-205153e93011` horario Lun 08-17
- Check-in/out: `ee4d8c67-…`
- Licencia: `c5ef7cb1-…` VACACIONES APROBADO
- Comisión: regla 5% `ae795550-…`; productivity-report 200 (ventasCount 0 este periodo para la mayoría)
- Cajero (cambio empleado): `a1c49c06-…` horario Mar 09-18

## Live 2026-09-20 — E2E15 plantillas
- 8 GET plantillas 200 application/xlsx (clientes, productos, packs, lotes/series, precios)
- Import clientes: preview created=1; POST /customers/import created=1 DNI `70485888` id `727d640f-…`; DELETE cleanup 200
- RWD 390/tablet 768 + giro 1024: PASÓ (carrito 1 / Cobrar persistió)
- Interrupt de red: PASÓ parcial (caída API → «No hay conexión»; logout → signin)

## Live 2026-09-20 — E2E14 ARCO / reclamo
- Cliente: `c1faba8a-c1e4-472d-8a61-f3d0ddf6512f` DNI 71234567 + consentimiento LPDP
- ARCO ACCESO: `55bcf95c-5149-43c0-9d61-afc92b7e585e` PENDIENTE→COMPLETADA; export 200 (866 B)
- Reclamo público: `LR-20260920-BPECJ0` id `213d91c9-aad9-497f-9c21-6442fe53770f` PATCH IN_REVIEW
- Auditoría: entity=ArcoRequest UPDATE del mismo id
- Retención: candidates=[] policy 10 años; sin purge

## Live 2026-09-20 — E2E06 receta
- Médico: `ae042a70-228c-4103-a85a-10e3931997d4` CMP QA820928
- RX-000001 `d7452fc7-ba89-4fe3-a238-cf9b3ba82253` 1 u Paracetamol → COMPLETADA vía NV01-00000016 `5bb9d168-…`
- Exceso / vencida / dispense dup → 400
- Paciente ajeno RX-000003 + cliente ARCO → NV01-00000017 **201** (QA-CAMPANA-15)
- Sustituto no autorizado → 400
- Reporte dispensation-by-medico: 2 / total 6.00

## Live 2026-09-20 — E2E10 pack / promo / convenio
- Pack: `9bde3e08-b5ed-49e0-931f-db9f6fa43dd5` (2 componentes); POST /sales pack → 404
- Promo vigente `QA10625` `20f1e9f2-…` → NV01-00000018 total 2.7 desc 0.3
- Promo vencida `QAEX912`: validate false; sale NV01-00000019 total 3 desc 0 (no 400)
- Convenio `QAAG711` `7e1557c4-…` 50%: NV01-00000020 copago 1.5 CxC 1.5; NV01-00000021 precio 2.5 copago 1.25 CxC 1.25
- Void propia 403; gerente 0001 → 404

## Live 2026-09-20 — fixes P1 + E2E05/07/CxP
- CAMPANA-15 retest: RX-000004 + cliente ARCO → **400** titular. Titular NV01-00000022 OK.
- CAMPANA-17 retest: `QAEX912` → **400**.
- CxP `c0e941d4-…` 6→0 PAGADA.
- Conteo `b5b1f761-…` WH secundario Paracetamol 3=3 finalize OK.
- Zona frío `abb5623b-…`; temps 4.5 / 12.8.

## Live 2026-09-20 — pack POS + delivery
- CAMPANA-18: pack en `pos-catalog` (`esPack`); POST /sales expande componentes.
- NV01-00000023 `0fbe1d66-…` pack `9bde3e08-…` + cupón QA10625 total 4.5 desc 0.5.
- Delivery D202609200001 `caa005d3-…` RECIBIDO→ENTREGADO total 5; D202609200002 cancel + doble 400.
- GR remitente: T001-00000001/02/03 `RECHAZADO` (MOCK); emit-guia `da2624c2-…`/`ac63640f-…` **201**.

## Live 2026-09-20 — E2E05/11/12 cierre
- Conteo diferencia: `b6f5653c-…` WH secundario 3→2 applied=1.
- Ajuste umbral: pending `a47a37ca-…` (−80); self/gerente approve → 403.
- Caja: cierre `4b7b097d-…` sistema 24.95 / físico 0 / diff −24.95; reapertura `d3eeea3e-…` 50.
- Banco: cuenta `a6d0accb-…`; INGRESO 20 + EGRESO 5; reconcile 2; segundo 400.
- Cajero: est 0001; warehouses solo `d58e983e-8243-4ee3-abb1-bb71fc6cb640`; GET /users 403.
- CAMPANA-23 retest: ADMIN `/tenants` y `/tenants/21762d36-…` → **403**; SUPER_ADMIN lista Venta Addin + FactoFarm Demo.
- CAMPANA-24 retest: sin `nav.punto_venta` → POST `/sales` **403** (token viejo y nuevo); restore nav OK.
- E2E10 void: NV01-00000024 `62af053e-…` admin self **403**; titular 0000 **201**; doble **400**.

## Live 2026-09-20 — E2E02/05/09/13 restantes
- Race receive: traslado `da2624c2-…` 1 u; paralelo **201** + **400** «ya fue recibida».
- Kardex WH2 200 (TRANSFERENCIA_ENTRADA + AJUSTE); valuation-report 200.
- CxP `93c3fd61-…` 16.5→0 PAGADA; dup **400**.
- Vendedor NV01-00000006 `ff38cc85-…`; gerente void **201**; productivity vendedor count 0 / comisión 0.
- Shipping: carrier `37d861ff-…` / driver `641ea98b-…` / vehicle `8d56455b-…` / partida `84bb8d74-…`.
- `controlled-monthly?year=2026&month=9` 200 entries=[].

## Live 2026-09-20 — PDF / lote vencido / cotización
- PDF NV01-00000024 `62af053e-…`: 200 application/pdf 144269 B `%PDF-` source=generated.
- Ingreso lote `QA-EXP-2020` (2020-01-15) producto `71535c4f-…`; venta MANUAL → **400**; available-lots solo QA-L1 vigente; alerts vencidos=1.
- Cotización `290a87ef-…` total 6 BORRADOR→send 201.
- Hospital: área `QA-E2E06` `d192426d-…`; consumo `9997ff11-…` DISPENSADO (stock principal 9896→9895); `5e8f108c-…` CANCELADO; dups **400**.

## Live 2026-09-20 — PLE + RWD + sesión
- CAMPANA-25: PLE 14.1 `202609`/`2026-09` 200 `LE…202609141.txt`; `2026` → 400. Mayor debe 55 / haber 62.7. Accountant-summary ventas 19 total 57.7.
- convert-to-cpe NV → 400 (sin OSE).
- POS 390 px: hamburger + Catálogo/Carrito; Paracetamol → carrito 1 / Cobrar.
- Tablet 768: login admin → dashboard → POS; Paracetamol carrito 1 / S/ 3 / Cobrar.
- Giro 1024×768: carrito persistió; Cobrar + total visibles.
- API caída (watch): «No hay conexión con el servidor». Logout → `/auth/signin` limpio.

## Live 2026-09-20 — GR + hospital + CAMPANA-26
- Billing config: provider=MOCK `autoEmitGuiaOnTransfer=true`.
- Documents: 3× GUIA_REMISION_REMITENTE T001-00000001/02/03 sunat=RECHAZADO.
- Special DTO: `lines` ahora valida; POST special → **400** capability MOCK (ya no «property lines should not exist»).
- Hospital área `d192426d-…` queda listada; `esHospital` demo = false.
- Consumo `9997ff11-…` DISPENSADO; `5e8f108c-…` CANCELADO.
- Inbound refrigerado lote `QA-FRIO-2027` **201** (sin zona en DTO).
- POST billing refresh-status / daily-summary → **400** sin OSE.

## Live 2026-09-20 — UI hospital / frío / resúmenes + reportes
- `/hospital-dispensacion`: 2 filas Pabellón QA E2E06 CANCELADO + DISPENSADO.
- `/cadena-frio`: form temperatura; dropdown incluye Almacén principal · Sucursal.
- `/resumenes`: Enviar RC (API 400 MOCK).
- Tax: 7 tasas; calculate 1000×3% = 30; lists vacíos; detracción sync 0.
- Quote `290a87ef-…` ENVIADA total 6 (sin endpoint convert-to-sale).
- DIGEMID: top-products 6; rotation-abc; bpa-storage 200; lot-trace `QA-FRIO-2027` 200.

## Live 2026-09-20 — CAMPANA-29 + DIGEMID/SIRE/PLE
- Adverse event `c6e926d1-…` LEVE; notify `QA-DIG-20260920-01`. UI `/reporte-digemid` lo lista.
- PLE 8.1 `LE…20260981.txt`; 13.1 `LE…202609131.txt`.
- UI: cotizaciones ENVIADA S/ 6; GR remitente traslados RECIBIDO; retenciones aviso OSE; SIRE 19 / S/ 57.70.
- CAMPANA-29: `/anulaciones` ahora `NV01-00000023` (antes `{{ row.numero }`). Mismo fix CPE/médicos/proveedores.

## Live 2026-09-20 — CAMPANA-30 UI restante
- CPE bandeja: T001-00000003/02 RECHAZADO.
- Médicos: JUAN PEREZ GARCIA + Ana QA Receta.
- Proveedores: RUC · 20131312955 / 20552103816.
- Percepciones: 2% / 0.5% + aviso OSE.
- SIRE compras: 3 / S/ 62.50.
- GR transportista: form + maestros.
- CIE-10: J06 → J06.9. Recetas: RX-000005…000002.

## Live 2026-09-20 — CAMPANA-31 inventario / finanzas
- Lotes: QA-EXP-2020 + LOTZBC001/002. Traslados 3 RECIBIDO.
- Delivery: D202609200001 ENTREGADO / 0002 CANCELADO.
- CxC: 000020/000021 PENDIENTE. CxP: F001/F002/GR-1789942009084 las 3 PAGADA.
- Libro mayor: debe 55 / haber 62.70. Promos: 3 filas. Reportes hub OK.

## Live 2026-09-20 — CAMPANA-32 OC / kardex / NV / banco
- OC-2026-00001 RECIBIDA 27.50; 00002 RECIBIDA 7.50. Recepción sin pendientes.
- Kardex Paracetamol: traslado ±3 + salidas venta.
- NV01-00000024 ANULADA; 000023 COMPLETADA 4.50.
- Banco INGRESO 20 / EGRESO 5 Conciliado. Convenio QAAG711 50%.
- cash-flow ingresos ventas 57.7; margen 58.5; medios neto 150.90 (post CxP GR 7.50).

## Live 2026-09-20 — CAMPANA-33 envío / inventario / finanzas / contab
- Conductores: Luis QA Chofer 45881233. Vehículos: QA9E09 Volvo FH. Partida: QA-749812 Av. QA 100 Lima.
- Sugerido: Paracetamol WH2 3/20/17; 3-GEL E2E 2/10/8. Comparativo vacío.
- Inventario: Paracetamol 9,895 / 3; kardex/reporte PEPS 9,895. Alerts stockBajo=2 lotesVencidos=1.
- Balance: venta 58.50 margen 100%. Pagos: CxP GR 7.50 19:05. Flujo: 57.70 / −6.30.
- Banco: INGRESO 20 + EGRESO 5 Conciliado. Medios: 191.90 / 41 / 150.90.
- Caja POS: Caja principal 0000 S/ 50.00. LPDP + QA E2E14. Estabs 0000/0001 no hospital.
- Contabilidad: excel CSV 200; resumen 58.50; PLE 14.1/8.1/13.1; resumido 57.70.
- CxP `3569e7e1-…` GR-1789942009084 7.50→0 PAGADA (POST payments amount+metodo).
- `/platform/dashboard` como ADMIN → redirige `/dashboard` (CAMPANA-23).

## Live 2026-09-20 — CAMPANA-34 GR transportista + CxC + catálogos
- Fix MOCK especiales: POST `/billing/documents/special` **201** `010490f0-…` V001-00000001 RECHAZADO. UI CPE lista GR transportista.
- CxC 5/5 PAGADA: NV01-00000020 1.50 · 000021 1.25 · 000014 2.00 + previas.
- SUPER_ADMIN: tenants Venta Addin + FactoFarm Demo; leads 200; LR-20260920-BPECJ0 IN_REVIEW.
- Catálogos UI: categorías (10) · marcas BABARIA…VESPER · labs vacío · unidades CAJ/GLL… · formas/vías/principios vacíos · zonas LIMA/AREQUIPA · series SERB1001–1003 · importar precios XLS.
- Jest capabilities 7 passed. API `npm run build` OK.

## Live 2026-09-20 — CAMPANA-35 plataforma SUPER_ADMIN
- Dashboard: 2 clientes · 1 lead · 1 reclamo · 10 usuarios · 2 sucursales.
- Clientes: Venta Addin Botica 0/3·0/1; FactoFarm Demo Cadena 10/50·2/20.
- Leads: NEW ad / a@a.com / aa. Reclamos: LR-20260920-BPECJ0 En revisión.
- Retención dry-run `71b18bf5-…` 201 deletedCount=0; purgeEnabled=false.
- USD venta 400 (CreateSaleDto sin moneda). Zona frío inactiva no bloquea NV01-00000025.

## Live 2026-09-20 — CAMPANA-36 cuarentena zona de frío
- Fix: `assertActiveColdZoneForRefrigeratedProducts` en sales / inbound / hospital consume.
- Producto `71535c4f-…` flag ON + zona `abb5623b-…` OFF → venta **400**, inbound **400**, hospital **400** (cuarentena).
- Zona `activo=true` y `esRefrigerado=false` restaurados. Jest 3/3. API `npm run build` OK.

## Live 2026-09-20 — CAMPANA-37 alta SaaS + primera venta
- Provision ahora ADMINISTRADOR. Gerente template +POS.
- Tenant ACTIVE `e17dc1e2-…` QA E2E01 Farmacia; admin `qa.e2e01.1789951262207@test.local`.
- Almacén `472dad94-…`; caja 50→55; producto `eafb6633-…`; inbound 3; NV01-00000002 total 5.
- Aislamiento: demo 404 sobre venta/producto QA; tenant pre-fix SUSPENDED. Jest 2 + build OK.

## Live 2026-09-20 — CAMPANA-38/39 cierre E2E
- MOCK-dev CPE: B001-00000001 `e05a8eca-…` ACEPTADO; NC BC01-00000001 `a974427f-…` ACEPTADO; RC `6c69529c-…` RC-MOCK-2026-09-20 ACEPTADO.
- USD NV01-00000026 `afbe2022-…` **201**; EUR 400.
- Controlado: RX-000006 + NV01-00000027 con titular `d01e694b-…`.
- Purge **403** (flag off). E2E 15/15 PASÓ (CPE = MOCK, no SUNAT real).

## Live 2026-09-20 — CAMPANA-40 sandbox OSE / SUNAT
- Nubefact ZIP oficial sigue publicando `demo.nubefact.com` + UUID `03989d1a`. DNS NXDOMAIN. Mismo UUID en www/api → **codigo 11**.
- Factiliza QA 404; APIsPERU 405 (sin token público).
- SUNAT beta WSDL `e-beta.sunat.gob.pe/.../billService?wsdl` **200**. Auth oficial `[RUC]MODDATOS` / `MODDATOS`.
- Nubefact provider: header `Authorization: Token token="…"` + `fecha_de_emision`. Jest `nubefact.helpers.spec`.
- CPE campaña no cambia: MOCK ACEPTADO. No se commitean tokens.
