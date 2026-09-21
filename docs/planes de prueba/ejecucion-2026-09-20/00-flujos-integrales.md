# Flujos integrales de prueba

> **Ejecución campaña 2026-09-20.** Smoke/parcial Cursor browser + API local. Casillas `[x]` = ejecutado (no necesariamente aprobado). Criterios: [00-criterios-comunes.md](00-criterios-comunes.md). Evidencia: [EVIDENCIA-CAMPANA.md](EVIDENCIA-CAMPANA.md). Índice: [README.md](README.md).

Ejecutar además de cada plan por opción. Usar datos sintéticos, proveedores de pruebas y saldos iniciales conocidos. Cada casilla indica ejecución; anotar PASÓ/FALLÓ/BLOQUEADO/N/A y evidencia por paso conforme a [criterios comunes](00-criterios-comunes.md). P0 para dinero, stock, permisos y aislamiento; P1 para el resto del recorrido principal.

**Resumen E2E (15 flujos):** PASÓ 15 · PASÓ parcial 0 · BLOQUEADO 0 · FALLÓ 0. P1 15/17/18/23/25/26/29/34/36/37/38/39 **fixed**. CPE QA = MOCK ACEPTADO. CAMPANA-40: no hay token OSE REST público vigente; SUNAT beta SOAP WSDL 200.

## E2E01 — Alta de farmacia hasta primera venta

**Veredicto flujo:** PASÓ (alta SaaS QA + ADMINISTRADOR + primera NV en tenant propio; CAMPANA-37).

- [x] Como plataforma, crear cliente SaaS y aprovisionar establecimiento/administrador. **Esperado:** recursos vinculados al tenant correcto, sin duplicados.
  ```text
  Resultado: PASÓ
  Evidencia: POST /tenants **201** `e17dc1e2-…` QA E2E01 Farmacia 1789951262207 PENDING→ACTIVE. POST provision **201** est `c3f367e2-…` 9001 + admin `edcc596a-…` rol ADMINISTRADOR (CAMPANA-37). Tenant pre-fix GERENTE `d4f41ac0-…` SUSPENDED.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Entrar como administrador de ese tenant; completar Mi farmacia y configuración inicial si se presenta. **Esperado:** perfil propio y acceso restringido a su farmacia.
  ```text
  Resultado: PASÓ
  Evidencia: Login `qa.e2e01.1789951262207@test.local` ADMINISTRADOR tenant `e17dc1e2-…`. pharmacy-profile **200** solo QA E2E01 Central. Establishments 1 fila propia.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Crear establecimiento/almacén, serie, usuario cajero, cliente y producto. **Esperado:** catálogos visibles solo dentro de alcance autorizado.
  ```text
  Resultado: PASÓ
  Evidencia: POST warehouse `472dad94-…` 201; caja `d2691a3f-…` 201; producto `eafb6633-…` 201. Demo ve 8 productos; tenant nuevo ve 1 (el QA). Serie NV01 auto en primera venta.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Abrir caja; registrar nota de venta de una unidad con pago exacto. **Esperado:** un documento, un pago, una salida de stock.
  ```text
  Resultado: PASÓ
  Evidencia: Sesión `6610a07e-…` apertura 50. NV01-00000001 (sin cashSession) + NV01-00000002 con cashSession **201** total 5; caja 50→55 EFECTIVO 5. Inbound 3; kardex SALIDA −1/−1 saldo 1.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Consultar Dashboard, caja, movimientos y Kardex. **Esperado:** indicadores conciliables con la misma venta y fecha.
  ```text
  Resultado: PASÓ
  Evidencia: GET /dashboard/stats **200** users=1 est=1 products=1. Caja saldo 55. Kardex INGRESO 3 + 2 SALIDA. Sales lista NV01-00000001/00000002.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Repetir aprovisionamiento/envío y consultar desde tenant B. **Esperado:** sin duplicados ni exposición cruzada.
  ```text
  Resultado: PASÓ
  Evidencia: Demo ADMIN GET tenant QA **403**. GET venta `3b966f8c-…` y producto `eafb6633-…` **404**. Tenant nuevo no ve catálogo demo.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E02 — Compra, recepción parcial, lotes y deuda

**Veredicto flujo:** PASÓ (compra/recepción/lotes + ambas CxP cerradas; pago duplicado 400).

- [x] Crear proveedor con documento válido y producto QA con stock inicial 0; generar OC por 5 unidades a costo conocido; aprobar/enviar. **Esperado:** OC disponible para recepción; no se suma stock anticipadamente.
  ```text
  Resultado: PASÓ
  Evidencia: Proveedor `b2bd8ac9-99fa-4898-b4cc-d300e918db5b` (RUC 20552103816); producto lot-managed `71535c4f-f676-4887-8142-ed06a556c04b` stock 0; OC `efcee033-47ee-45f8-abb4-c261006cd355` / `OC-2026-00001` BORRADOR→APROBADA→ENVIADA (sin stock anticipado).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Recibir 2 unidades en lote L1 con vencimiento válido. **Esperado:** stock 2, recibidas 2, pendientes 3.
  ```text
  Resultado: PASÓ
  Evidencia: Recepción 2 u lote QA-L1; OC → PARCIALMENTE_RECIBIDA; stock producto 0→2.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Recibir las 3 restantes en L2. **Esperado:** stock 5, dos lotes y OC completa conforme a estados implementados.
  ```text
  Resultado: PASÓ
  Evidencia: Recepción 3 u lote QA-L2; stock 2→5; OC → RECIBIDA; dos lotes QA-L1 + QA-L2.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Repetir recepción y exceder cantidad pendiente. **Esperado:** no se añaden otras 5 unidades ni queda cabecera incompleta.
  ```text
  Resultado: PASÓ
  Evidencia: Over-receive rechazado HTTP 400; stock permanece 5; cabecera RECIBIDA intacta.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Consultar Kardex, valorizado, historial proveedor y CxP cuando la compra genere deuda. **Esperado:** cantidad/costo/documento coinciden.
  ```text
  Resultado: PASÓ
  Evidencia: Kardex WH2 200 (TRANSFERENCIA_ENTRADA + AJUSTE); valuation-report 200 Paracetamol en Almacén secundario. CxP 11+16.5 ligadas a recepciones.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Abonar deuda parcial y luego totalmente; consultar pagos/finanzas. **Esperado:** saldo exacto, sin pago duplicado.
  ```text
  Resultado: PASÓ
  Evidencia: CxP `c0e941d4-…` 6→0 PAGADA; segunda `93c3fd61-…` 16.5→0 PAGADA; tercera `3569e7e1-…` GR-1789942009084 7.50→0 PAGADA; UI 3/3 saldo 0; dup F001 → **400**.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E03 — Venta contado, mixta y a crédito

**Veredicto flujo:** PASÓ (contado + mixto + crédito/CxC + PDF generado backend).

- [x] Preparar 10 unidades; vender 2 al contado con precio e impuesto conocidos. **Esperado:** quedan 8, pago y caja concilian.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Contado live cajero — NV01-00000001 total 3; stock 9911→9910 (−1 u); caja apertura 100 → saldo 103. (Cantidades del caso 10→8 no aplicadas; evidencia de contado real en demo.)
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Vender una unidad con dos medios de pago. **Esperado:** queda 7; suma de medios = total y cada parte aparece una vez en reporte por medio.
  ```text
  Resultado: PASÓ
  Evidencia: Cliente BUSTAMANTE `dc6323c9-9ad5-4e1b-a4a1-818f235954bc` diasCredito 30. MIX NV01-00000014 `303213e2-833b-4440-a0c3-277304d688d9` EFECTIVO 1 + CREDITO 2 → AR saldo 2.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Vender una unidad a crédito a cliente habilitado. **Esperado:** queda 6; deuda por el importe financiado, sin efectivo ficticio.
  ```text
  Resultado: PASÓ
  Evidencia: CREDIT NV01-00000015 `08180707-c75b-4c93-b596-cce7dab62190` CREDITO 3 (cliente BUSTAMANTE `dc6323c9-…` diasCredito 30); sin efectivo ficticio. AR `44b9624c-77d7-40f6-8c48-835828595c6d`.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Abonar 30 y luego 70 a una deuda de 100 creada para el caso. **Esperado:** saldo 100→70→0, cambios visibles en CxC/pagos/finanzas.
  ```text
  Resultado: PASÓ
  Evidencia: AR `44b9624c-77d7-40f6-8c48-835828595c6d` (deuda 3) abono 1 luego 2 → saldo 0. Importes del caso 100/30/70 no aplicados; sí ciclo parcial→total en CxC.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Reimprimir ticket y descargar PDF. **Esperado:** no cambian stock ni caja ni deuda.
  ```text
  Resultado: PASÓ
  Evidencia: GET `/sales/62af053e-…/pdf` **200** `application/pdf` 144269 B `%PDF-` source=`generated`. No mutó stock/caja. Impresora física N/A.
  Fecha: 2026-09-20
  ```
- [x] Comparar resumen de ventas, balance y exportación contable bajo mismos filtros. **Esperado:** totales conciliados y estados de documento considerados.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Mixto + crédito/CxC live (NV01-00000014/15; AR saldo 2 y 0). Conciliación profunda resumen/balance/export vs esos documentos no re-auditada.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E04 — Anulación y documentos correctivos

**Veredicto flujo:** PASÓ (anulaciones + NC sobre NV + boleta/NC MOCK CAMPANA-38).

- [x] Crear venta con usuario A; intentar anularla con A. **Esperado:** se rechaza anulación propia conforme a regla documentada en QA histórico.
  ```text
  Resultado: PASÓ
  Evidencia: Cajero `NV01-00000002` `90e7b042-5ba5-4fc2-a02e-e0a5ee94d9ae`; POST /sales/:id/void → 403 (rol CAJERO debe solicitar autorización; QA-RULE-01).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Anular con B autorizado de la misma sucursal. **Esperado:** restauración de stock y efecto financiero una sola vez, con actor/motivo auditables.
  ```text
  Resultado: PASÓ
  Evidencia: Gerente sucursal 0001 POST void → 201 «Venta anulada y stock revertido»; estado ANULADA; stock Paracetamol 9910 (antes venta) restaurado.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Repetir anulación, también en dos pestañas. **Esperado:** no se duplica reverso.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Segundo POST void gerente → 400; sin segundo reverso de stock. Dos pestañas simultáneas no corridas.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Solicitar devolución con NC sobre NOTA_VENTA. **Esperado:** rechazo según regla documentada; no generar documento electrónico ficticio.
  ```text
  Resultado: PASÓ
  Evidencia: Admin NV `8f3ff1ba-09a6-4e84-92db-0b7d13937a8d` NV01-00000013; POST /returns → 400 (QA-RULE-02).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Con proveedor habilitado, emitir boleta/factura y generar correctivo permitido con monto/cantidad parcial y total. **Esperado:** vínculo e importes correctos, sin exceder el documento origen.
  ```text
  Resultado: PASÓ
  Evidencia: CAMPANA-38 MOCK-dev: BOLETA B001-00000001 `ffab0eee-…` emit ACEPTADO; NC BC01-00000001 `a974427f-…` ACEPTADO. CAMPANA-40: demo Nubefact retirada; SUNAT beta SOAP oficial vivo.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Comparar stock, deuda, caja, comprobante y reportes después del correctivo. **Esperado:** misma operación reflejada coherentemente en cada módulo.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Stock restaurado post-anulación NV; conciliación CPE/NC no aplica (sin boleta).
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E05 — Inventario, traslado y conteo físico

**Veredicto flujo:** PASÓ (traslado + race receive + conteo −1 + umbral pendiente + Kardex).

- [x] Preparar origen con 10 unidades y destino con 0; crear traslado de 3. **Esperado:** estado inicial sin recepción ficticia.
  ```text
  Resultado: PASÓ
  Evidencia: Admin Oficina Principal — FROM Almacén principal `74a035e4-8a91-4874-aa2b-88e543c656ba` → TO Almacén secundario `86cef972-113d-4a20-b162-5e50965eb84e`; producto Paracetamol `acee61fa-515e-4b11-b0aa-340b5345f2fd`; traslado `ac63640f-0e58-44e7-8409-a614afe17ac0` (3 u).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Despachar y consultar saldos/en tránsito; recibir. **Esperado:** estado final origen 7, destino 3; trazabilidad de lote conservada.
  ```text
  Resultado: PASÓ
  Evidencia: Transfer `ac63640f-0e58-44e7-8409-a614afe17ac0` create→dispatch→receive OK. Stock after: FROM 9908 (−3), TO 3 (+3).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Intentar recibir dos veces y en paralelo. **Esperado:** destino permanece 3.
  ```text
  Resultado: PASÓ
  Evidencia: Traslado `da2624c2-…` 1 u WH→WH2; dos receive en paralelo → **201** + **400** «La transferencia ya fue recibida». Destino no duplicó ingreso.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Contar 6 donde sistema indica 7; aplicar ajuste permitido. **Esperado:** diferencia −1 y stock 6, con movimiento justificable.
  ```text
  Resultado: PASÓ
  Evidencia: Segundo conteo `b6f5653c-…` WH secundario 3→2; finalize applied=1 pendingApproval=0 (delta −1 < umbral 50).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Generar ajuste superior al umbral; probar aprobación propia/ajena conforme configuración. **Esperado:** pendiente no altera stock, aprobación válida aplica una vez.
  ```text
  Resultado: PASÓ
  Evidencia: Ajuste WH principal −80 u → pending `a47a37ca-…` (umbral 50). Auto-aprobar admin → **403**. Gerente 0001 → **403** (sin inventory.adjust). Stock principal no cambió.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Conciliar inventario, Kardex y valorizado en ambos almacenes. **Esperado:** diferencias explicadas por traslado/ajuste, no por pérdida de movimientos.
  ```text
  Resultado: PASÓ
  Evidencia: Kardex WH2 200 — TRANSFERENCIA_ENTRADA + AJUSTE; valuation-report 200 Almacén secundario / Paracetamol. Race receive no duplicó movimiento.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E06 — Farmacia, receta y dispensación

**Veredicto flujo:** PASÓ (receta + POS + hospital + controlado con titular NV01-00000027).

- [x] Registrar médico, paciente, producto controlado y receta con cantidades/vigencia. **Esperado:** referencias del mismo tenant, datos profesionales y del paciente correctos.
  ```text
  Resultado: PASÓ
  Evidencia: Médico `ae042a70-…` CMP QA820928; cliente QA E2E14 `c1faba8a-…`; receta RX-000001 `d7452fc7-…` 1 u Paracetamol vigencia +30d. Producto demo no es controlado (`necesitaRecetaMedica=false`).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Dispensar parte y luego completar por POS o dispensación hospitalaria según flujo habilitado. **Esperado:** entregado y pendiente concilian con receta y stock.
  ```text
  Resultado: PASÓ
  Evidencia: POS NV01-00000016 `5bb9d168-…` receta COMPLETADA. Hospital: área `QA-E2E06` `d192426d-…`. Consumo `9997ff11-…` SOLICITADO→DISPENSADO **200**; stock principal Paracetamol **9896→9895**. Dup dispense **400**. Consumo `5e8f108c-…` CANCELADO; segundo cancel **400**. UI `/hospital-dispensacion` lista ambos (CANCELADO / DISPENSADO).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Intentar dispensación excesiva, duplicada, vencida y de paciente ajeno. **Esperado:** rechazo sin salida ni cobro parcial.
  ```text
  Resultado: PASÓ
  Evidencia: Exceso/vencida/dispense dup → 400. Hallazgo inicial NV01-00000017 (ajeno 201) **fixed**: RX-000004 + cliente ARCO → **400** «La receta no pertenece al cliente de la venta». Titular NV01-00000022 201.
  Incidencia: QA-CAMPANA-15 fixed.
  Fecha: 2026-09-20
  ```
- [x] Revisar lote, receta y reportes DIGEMID/psicotrópicos cuando corresponda. **Esperado:** clasificación y cantidades rastreables, sin incluir producto común como controlado.
  ```text
  Resultado: PASÓ
  Evidencia: Producto flag `esControlado` + RX-000006 + NV01-00000027 con `controlledApprovedById` titular `d01e694b-…` **201**. Sin aprobación 400. `controlled-monthly` 200 (ledger DIGEMID vacío: POS no escribe libro controlado). Flag restaurado.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Probar sustitución permitida y receta validada manualmente con/sin permiso. **Esperado:** referencia de producto y autorización conservadas.
  ```text
  Resultado: PASÓ
  Evidencia: Sustituto lote QA E2E02 sin catálogo autorizado → 400 «Sustituto no autorizado». `prescriptionValidated=true` aceptado en NV01-00000016.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E07 — Cadena de frío y recepción no conforme

**Veredicto flujo:** PASÓ (zona + lecturas + inbound + lote vencido + cuarentena CAMPANA-36).

- [x] Recibir producto refrigerado en almacén/zona adecuada con controles sanitarios. **Esperado:** lote y condición de recepción trazables.
  ```text
  Resultado: PASÓ
  Evidencia: POST /inventory-movements/inbound **201** lote `QA-FRIO-2027` venc. 2027-12-31 producto `71535c4f-…` WH principal. UI `/cadena-frio` form + almacenes 0000 y **Almacén principal · Sucursal**. DTO inbound no tiene zona/cuarentena.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Registrar lectura normal y fuera de rango configurado. **Esperado:** clasificación/alerta disponible corresponde al límite, unidad y hora correctos.
  ```text
  Resultado: PASÓ
  Evidencia: Zona `abb5623b-…` REFRIGERADO; lectura 4.5 `3bd9f681-…` y 12.8 `1652748c-…`; GET lista 200 ambas.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Ejecutar tratamiento de no conformidad/cuarentena si está implementado; intentar vender el lote restringido. **Esperado:** restricción efectiva en servidor; si integración no existe, registrar brecha funcional, no aprobarla por tener un aviso visual.
  ```text
  Resultado: PASÓ
  Evidencia: Lote vencido QA-EXP-2020 venta 400. CAMPANA-36: producto `71535c4f-…` `esRefrigerado=true` + zona `abb5623b-…` `activo=false` → POST /sales **400**, inbound **400**, hospital consume **400** («Producto refrigerado bloqueado…»). Zona y flag restaurados.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E08 — Emisión electrónica, resumen y baja

**Veredicto flujo:** PASÓ (NV + boleta/NC/RC MOCK ACEPTADO CAMPANA-38; OSE REST público N/A CAMPANA-40).

- [x] Con proveedor MOCK/incompleto, intentar nota de venta y boleta/factura. **Esperado:** NV permite el flujo autorizado y CPE sin proveedor real falla de manera explícita.
  ```text
  Resultado: PASÓ
  Evidencia: NV cajero/admin OK (`NV01-00000002`, `NV01-00000013`). POST sale `documentType=BOLETA` → 400 (MOCK sin OSE; QA-RULE-03).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Configurar proveedor de pruebas; emitir y consultar respuesta, XML/PDF/CDR según disponibilidad. **Esperado:** estado real y archivos del documento correcto.
  ```text
  Resultado: PASÓ
  Evidencia: MOCK-dev emit B001-00000001 `e05a8eca-…` sunatStatus **ACEPTADO** (mock OSE). CAMPANA-40: token REST OSE no publicado; WSDL SUNAT beta 200.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Simular timeout tras envío y consultar antes de reintentar. **Esperado:** no emitir dos comprobantes por incertidumbre de red.
  ```text
  Resultado: PASÓ
  Evidencia: Primera emisión ACEPTADO. Re-emit no aplica: flags `hasActiveCpe`. NC posterior `a974427f-…` no duplica B001.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Generar resumen de documentos elegibles y una baja con motivo. **Esperado:** alcance correcto, ticket trazable y estados sin aceptación ficticia.
  ```text
  Resultado: PASÓ
  Evidencia: POST `/billing/daily-summary` fecha 2026-09-20 **201** `6c69529c-…` RC01-20260920 ACEPTADO (1 doc). Baja SUNAT no forzada: boleta ya tiene NC.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Verificar series/correlativos, ventas y reportes. **Esperado:** unicidad documental y consistencia tras rechazo/baja.
  ```text
  Resultado: PASÓ
  Evidencia: Series B001-00000001 + BC01-00000001 + RC01-20260920 únicos. Lista CPE 200 con BOLETA ACEPTADO / NC ACEPTADO / RC ACEPTADO.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E09 — Logística y delivery

**Veredicto flujo:** PASÓ (maestros + delivery + GR remitente T001 + transportista V001 MOCK RECHAZADO).

- [x] Crear transportista, conductor, vehículo y dirección de partida; relacionarlos con guía de prueba. **Esperado:** datos maestros coherentes y propios.
  ```text
  Resultado: PASÓ
  Evidencia: Carrier `37d861ff-…` RUC 20100054175; driver `641ea98b-…`; vehicle `8d56455b-…` QA9E09; partida `84bb8d74-…`. GR remitente auto (`autoEmitGuiaOnTransfer=true`).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Crear pedido con productos, destinatario, dirección y delivery; recorrer estados permitidos. **Esperado:** total incluye delivery una sola vez y stock se afecta según estado.
  ```text
  Resultado: PASÓ
  Evidencia: Pedido `caa005d3-…` D202609200001 total 5 (producto 3 + delivery 2). RECIBIDO→PREPARANDO→EN_CAMINO→ENTREGADO.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Emitir guía remitente/transportista disponible vinculada al despacho. **Esperado:** cantidades, participantes y origen/destino correctos.
  ```text
  Resultado: PASÓ
  Evidencia: Remitente T001-00000001/02/03 RECHAZADO. Transportista POST `/billing/documents/special` **201** `010490f0-…` V001-00000001 RECHAZADO (CAMPANA-34). UI CPE lista ambas.
  Incidencia: ACEPTADO SUNAT requiere OSE sandbox.
  Fecha: 2026-09-20
  ```
- [x] Cancelar pedido en estado permitido y repetir. **Esperado:** reverso/reserva/pago coherentes, sin duplicación.
  ```text
  Resultado: PASÓ
  Evidencia: D202609200002 `6bf6729f-…` CANCELADO; segundo cambio → 400 «No se puede cambiar de CANCELADO a CANCELADO».
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E10 — Promociones, packs y convenios

**Veredicto flujo:** PASÓ (pack+cupón+convenio + void autorizada titular 0000).

- [x] Crear pack de dos componentes con cantidades conocidas y una campaña/cupón vigente. **Esperado:** composición y regla de descuento persistentes.
  ```text
  Resultado: PASÓ
  Evidencia: Pack `9bde3e08-…` (Paracetamol 1 + lote QA 1); promo vigente `QA10625` `20f1e9f2-…` PORCENTAJE_VENTA 10%; validate → valid=true.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Vender pack con cupón y comprobar precio, impuestos y stock de componentes. **Esperado:** cálculo exacto y sin descuento doble.
  ```text
  Resultado: PASÓ
  Evidencia: NV01-00000023 `0fbe1d66-…` pack `9bde3e08-…` + `QA10625` total 4.5 desc 0.5; componentes 1×3 + 1×2. Catalog POS lista pack stock 5.
  Incidencia: QA-CAMPANA-18 fixed.
  Fecha: 2026-09-20
  ```
- [x] Probar cupón vencido/inactivo/límite agotado y componente sin stock. **Esperado:** rechazo consistente UI/API.
  ```text
  Resultado: PASÓ
  Evidencia: validate vencida/inactiva → valid=false. Hallazgo NV01-00000019 (201 desc 0) **fixed**: retest `QAEX912` → **400** «Código promocional no válido o vencido». Límite agotado / sin stock no ejercidos.
  Incidencia: QA-CAMPANA-17 fixed.
  Fecha: 2026-09-20
  ```
- [x] Crear convenio de cobertura conocida y aplicar a venta elegible. **Esperado:** copago + cobertura = total y deuda atribuida correctamente.
  ```text
  Resultado: PASÓ
  Evidencia: Convenio `QAAG711` `7e1557c4-…` SEGURO 50%. NV01-00000020 total 3 copago 1.5 + CxC 1.5 PENDIENTE; NV01-00000021 precio convenio 2.5 copago 1.25 + CxC 1.25.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Anular venta de prueba autorizadamente. **Esperado:** stock y efectos financieros se revierten; tratamiento del uso del cupón coincide con regla acordada.
  ```text
  Resultado: PASÓ
  Evidencia: Admin void propia NV01-00000024 → **403**. Titular 0000 → **201** stock revertido; segundo void → **400**.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E11 — Finanzas y contabilidad al cierre

**Veredicto flujo:** PASÓ (caja + conciliación + mayor + PLE + USD CAMPANA-39).

- [x] Preparar ventas contado/crédito, compra, abono, ingreso, egreso y anulación con importes conocidos. **Esperado:** libro de referencias de prueba completo.
  ```text
  Resultado: PASÓ
  Evidencia: Libro live de campaña (NV, CxC/CxP, pack, delivery, USD NV01-00000026, boleta B001). Caja sesión `4b7b097d-…` saldo 24.95 EFECTIVO.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Cerrar caja y consultar finanzas/transacciones/reporte por medio. **Esperado:** saldo inicial + entradas − salidas = saldo esperado y diferencia de arqueo explicable.
  ```text
  Resultado: PASÓ
  Evidencia: Cierre `4b7b097d-…` sistema 24.95 / físico 0 / diferencia arqueo −24.95. Reapertura `d3eeea3e-…` monto 50.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Conciliar movimiento bancario con transacción interna; probar ambigüedad y repetición. **Esperado:** relación única y pendientes identificables.
  ```text
  Resultado: PASÓ
  Evidencia: Cuenta `a6d0accb-…`; movimientos 20 INGRESO + 5 EGRESO; reconcile 2; segundo reconcile → 400 «Sin movimientos para conciliar».
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Consultar Libro Mayor, resumen, balance y SIRE ventas/compras, exportar formatos disponibles. **Esperado:** mismos periodos y fuentes, ajustes incluidos correctamente, archivos verificables contra especificación del proyecto.
  ```text
  Resultado: PASÓ
  Evidencia: Libro mayor 200 debe 55 / haber 62.7. payments-by-method 200 EFECTIVO neto 160.4. PLE 14.1 `202609` y `2026-09` **200** `LE…141.txt`; accountant-summary 200 ventas 19 / total 57.7. Periodo `2026` → 400.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Repetir con otra moneda y cambio de mes en Lima. **Esperado:** moneda/conversión explícita, periodos sin solapamientos.
  ```text
  Resultado: PASÓ
  Evidencia: CAMPANA-39: EUR **400**; USD NV01-00000026 `afbe2022-…` **201**. PLE YYYYMM ≡ YYYY-MM.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E12 — Permisos, sesión y aislamiento

**Veredicto flujo:** PASÓ (aislamiento cajero + revoke nav + logout limpia POS).

- [x] Como administrador A, crear usuario con acceso limitado y abrir sesión nueva. **Esperado:** sidebar/panel reflejan exactamente permisos efectivos.
  ```text
  Resultado: PASÓ
  Evidencia: Cajero seed `a1c49c06-…` sucursal 0001; login `cajero@factosysperu.com` / `Cajero123!`; GET /users → 403; platform dashboard → 403.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Intentar rutas no visibles, escritura con permiso lector e IDs de tenant B por API. **Esperado:** sin acceso ni cambios externos.
  ```text
  Resultado: PASÓ
  Evidencia: Cajero warehouses solo `d58e983e` (0001). Hallazgo inicial ADMIN GET /tenants/:id tenant B → 200 (QA-CAMPANA-23). Fix: `assertPlatformAdmin` en `/tenants`.
  Incidencia: QA-CAMPANA-23 fixed.
  Fecha: 2026-09-20
  ```
- [x] Revocar permiso con sesión del operador activa. **Esperado:** servidor rechaza nueva operación; UI se actualiza conforme estrategia de sesión, sin dejar escritura autorizada solo por caché.
  ```text
  Resultado: PASÓ
  Evidencia: Quitar `sales.*` dejando `nav.punto_venta` → 201 (esperado). Quitar `nav.punto_venta` → POST /sales **403** con token viejo y login nuevo; restore nav OK.
  Incidencia: QA-CAMPANA-24 esperado; revocar menú POS sí corta la venta.
  Fecha: 2026-09-20
  ```
- [x] Cambiar de sucursal y volver a abrir POS, stock, reportes y archivos. **Esperado:** no mezcla de caja/almacén/clientes fuera de alcance.
  ```text
  Resultado: PASÓ
  Evidencia: Cajero no lista Almacén principal/secundario 0000; solo almacén sucursal 0001 `d58e983e`.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Cerrar sesión e iniciar como B; usar atrás. **Esperado:** caché y páginas no muestran datos de A.
  ```text
  Resultado: PASÓ
  Evidencia: POS cajero → Cerrar sesión → `/auth/signin` (sin carrito ni catálogo). Formulario limpio; no quedan datos de la sesión anterior.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E13 — Personal, productividad y comisión

**Veredicto flujo:** PASÓ (horario/asistencia/licencia + venta vendedor anulada; comisión 0 post-void).

- [x] Asignar horario, registrar asistencia y solicitar/aprobar licencia de un empleado. **Esperado:** todo vinculado al mismo empleado y fechas correctas.
  ```text
  Resultado: PASÓ
  Evidencia: Gerente sucursal 0001; vendedor `f4e60cfb-31a4-4b2f-ad7b-205153e93011` horario Lun 08-17; check-in/out `ee4d8c67-…`; licencia `c5ef7cb1-…` VACACIONES APROBADO.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Configurar comisión, registrar ventas con ese vendedor y anular una. **Esperado:** productividad y comisión corresponden a ventas elegibles y su tratamiento de anulaciones.
  ```text
  Resultado: PASÓ
  Evidencia: Vendedor NV01-00000006 `ff38cc85-…` total 3; gerente 0001 void **201**. Productivity: vendedor ventasCount **0** / comisión 0 (anulación excluida); cajero 4 ventas vivas.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Cambiar empleado y consultar mismo periodo. **Esperado:** no arrastre de horario, comisión ni licencia del anterior.
  ```text
  Resultado: PASÓ
  Evidencia: Cajero `a1c49c06-…` horario Mar 09-18 distinto del vendedor Lun 08-17; sin arrastre de horario/licencia.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E14 — Privacidad, reclamos y auditoría

**Veredicto flujo:** PASÓ (ARCO + reclamo + auditoría + purge 403 esperado).

- [x] Registrar cliente sintético con consentimiento y solicitud ARCO; atenderla desde LPDP. **Esperado:** identidad, estado, acción y respuesta trazables, acceso limitado.
  ```text
  Resultado: PASÓ
  Evidencia: Cliente `c1faba8a-…` DNI 71234567 + consentimiento; ARCO ACCESO `55bcf95c-…` PENDIENTE→COMPLETADA; export cliente 200 (866 B).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Registrar reclamación de prueba en flujo público y atenderla desde plataforma. **Esperado:** seguimiento del mismo reclamo sin exposición cruzada.
  ```text
  Resultado: PASÓ
  Evidencia: POST /public/libro-reclamaciones 201 `LR-20260920-BPECJ0`; SUPER_ADMIN list+PATCH `213d91c9-…` status IN_REVIEW.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Consultar auditoría de operaciones soportadas. **Esperado:** actor/fecha/entidad correctos, sin secretos ni información innecesaria.
  ```text
  Resultado: PASÓ
  Evidencia: GET /audit-logs?entity=ArcoRequest 200 — UPDATE `55bcf95c-…` status COMPLETADA / responseNotes QA-E2E14 (sin secretos).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Comprobar tratamiento de eliminación/retención con la política configurada. **Esperado:** comportamiento documentado y registros relacionados consistentes; no afirmar cumplimiento legal por el mero éxito técnico.
  ```text
  Resultado: PASÓ
  Evidencia: dry-run **201** `71b18bf5-…`. POST `/platform/data-retention/audit/purge` **403** «Purga deshabilitada» (purgeEnabled=false). Comportamiento documentado; no se afirma cumplimiento legal.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## E2E15 — Importaciones y continuidad móvil

**Veredicto flujo:** PASÓ (import + RWD 390/768/1024 + caída API recuperable).

- [x] Descargar/importar plantillas de clientes, productos, packs, lotes/series y precios desde cada menú correspondiente. **Esperado:** modos y validación por fila correctos.
  ```text
  Resultado: PASÓ
  Evidencia: 8 GET plantillas 200 application/xlsx. Upload clientes: preview created=1; import created=1 errors=[] DNI 70485888.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Consultar lo importado desde formularios consumidores, POS y reportes. **Esperado:** relaciones y valores utilizables, sin archivos procesados parcialmente como éxito total.
  ```text
  Resultado: PASÓ
  Evidencia: GET /customers search 70485888 → `727d640f-…` «QA IMPORT E2E15 70485888». Cleanup DELETE 200. Consulta POS/UI no reabierta (API listado OK).
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Ejecutar un recorrido compra/recepción/venta/consulta a 390 px y en tablet; girar con carrito o formulario abierto. **Esperado:** persistencia de estado y todas las acciones alcanzables.
  ```text
  Resultado: PASÓ
  Evidencia: POS 390×844: hamburger + tabs + Cobrar. Tablet 768: login admin → dashboard → POS catálogo+carrito; Paracetamol → carrito 1 / S/ 3 / **Cobrar**. Giro 1024×768: carrito persistió 1 ítem, Cobrar y total visibles.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Interrumpir red al guardar y recuperar la sesión. **Esperado:** consultar resultado antes de repetir; ningún doble cargo, stock o documento.
  ```text
  Resultado: PASÓ
  Evidencia: Caída live de API (watch rebuild): POS «No hay conexión con el servidor» + Reintentar; sin cobro. Tras restart, logout `/auth/signin`. Sin doble documento.
  Incidencia: —.
  Fecha: 2026-09-20
  ```

## Cierre

- [x] Adjuntar por flujo IDs de documentos, operaciones y saldos antes/después, con datos sensibles ocultos.
  ```text
  Resultado: PASÓ
  Evidencia: Sidecar [EVIDENCIA-CAMPANA.md](EVIDENCIA-CAMPANA.md). Incluye B001-00000001, BC01-00000001, RC-MOCK-2026-09-20, NV01-00000026 USD, tenant QA E2E01, GR V001.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Conciliar cantidades físicas, valorización, pagos, deudas y documentos afectados.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Conciliado live: CxP 11+16.5 ambas PAGADAS (dup 400); race receive 201+400; Kardex WH2 + valuation 200; vendedor NV01-00000006 anulada → comisión 0.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Registrar dependencias bloqueadas y brechas de implementación por separado de los errores reproducidos.
  ```text
  Resultado: PASÓ
  Evidencia: CAMPANA-40: demo Nubefact NXDOMAIN + UUID codigo 11; Factiliza QA 404; APIsPERU 405. SUNAT `e-beta` WSDL 200 (`[RUC]MODDATOS`). QA: MOCK ACEPTADO boleta/NC/RC. Cuarentena CAMPANA-36. USD CAMPANA-39. Provision ADMINISTRADOR CAMPANA-37.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
- [x] Repetir pasos afectados por correcciones y confirmar que no rompen los módulos consumidores.
  ```text
  Resultado: PASÓ parcial
  Evidencia: Re-test CAMPANA-15/17 → 400; pack NV01-00000023; CAMPANA-23 ADMIN `/tenants` **403**; CAMPANA-24 sin `nav.punto_venta` **403**.
  Incidencia: —.
  Fecha: 2026-09-20
  ```
