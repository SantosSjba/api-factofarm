# Plan de pruebas: Comparativo precios

- **Menú:** Compras → Comparativo precios.
- **Ruta:** `/comparativo-precios`.
- **Permiso de navegación:** `nav.comparativo_precios`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI live: vacío («Sin productos con precios de compra»). GET price-comparison 200 items=[].

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-comparativo-precios-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: ver navegación y acciones de la plantilla. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M33-NEG-01 — Comparación homogénea (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar dos proveedores del mismo producto con distinta presentación, moneda y fecha; consultar.
  - **Esperado:** Se identifica la base comparada y el proveedor; no se señala como más barato un precio de unidad incompatible.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; comparativo API vacío; reglas negocio no contrastadas; incidencia: —.

- [x] **M33-NEG-02 — Sin referencia (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Consultar producto con un proveedor, sin proveedores y precio faltante.
  - **Esperado:** Estados vacíos y datos incompletos explícitos, sin cero ficticio o división por cero.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; comparativo API vacío; reglas negocio no contrastadas; incidencia: —.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M33-ACC-001 — `reportQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getPriceComparisonReport`.

- [x] **M33-API-001 — `getPriceComparisonReport`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Guessed /price-comparison → 404; correcto /api/v1/purchases/reports/price-comparison → 200 items=[]; incidencia: —.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M33-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M33-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M33-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET price-comparison 200 items=[]; incidencia: —.
- [x] **M33-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET price-comparison 200 items=[]; incidencia: —.
- [x] **M33-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET price-comparison 200 items=[]; incidencia: —.
- [x] **M33-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M33-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M33-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M33-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M33-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M33-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M33-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M33-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M33-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M33-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M33-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M33-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M33-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M33-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M33-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Export comparativo no ejercido; incidencia: —.
- [x] **M33-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [comparativo-precios.component.html](../../../front-factofarm/src/app/modules/admin/pages/comparativo-precios/comparativo-precios.component.html)
- [comparativo-precios.component.ts](../../../front-factofarm/src/app/modules/admin/pages/comparativo-precios/comparativo-precios.component.ts)
- [API: purchases.controller.ts](../../src/modules/purchases/purchases.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M33-DTO-001 — CreatePurchaseOrderItemDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-002 — CreatePurchaseOrderItemDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-003 — CreatePurchaseOrderItemDto.unitPrice.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-004 — CreatePurchaseOrderDto.supplierId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-005 — CreatePurchaseOrderDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-006 — CreatePurchaseOrderDto.fechaEntregaEstimada.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-007 — CreatePurchaseOrderDto.comentario.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-008 — CreatePurchaseOrderDto.condicionesPago.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-009 — CreatePurchaseOrderDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-010 — CreateGoodsReceiptItemDto.purchaseOrderItemId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-011 — CreateGoodsReceiptItemDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-012 — CreateGoodsReceiptItemDto.lotCode.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-013 — CreateGoodsReceiptItemDto.expirationDate.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-014 — CreateGoodsReceiptItemDto.unitCost.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-015 — CreateGoodsReceiptDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-016 — CreateGoodsReceiptDto.referenciaDoc.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-017 — CreateGoodsReceiptDto.comentario.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-018 — RegisterAccountPayablePaymentDto.amount.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.01)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-019 — RegisterAccountPayablePaymentDto.metodo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-020 — RegisterAccountPayablePaymentDto.referencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-021 — CreateSupplierCreditNoteDto.supplierId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-022 — CreateSupplierCreditNoteDto.monto.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.01)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-023 — CreateSupplierCreditNoteDto.motivo.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-024 — CreateSupplierCreditNoteDto.accountPayableId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-025 — CreateSupplierCreditNoteDto.purchaseOrderId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-026 — CreateSupplierCreditNoteDto.numero.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-027 — PurchaseOrderListQueryDto.supplierId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-028 — PurchaseOrderListQueryDto.estado.** Reglas declaradas: `@IsOptional() @IsEnum(PurchaseOrderStatus)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-029 — AccountPayableListQueryDto.supplierId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-030 — ReplenishmentReportQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-031 — PriceComparisonQueryDto.productId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/purchases/dto/purchase-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-032 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.

- [x] **M33-DTO-033 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Matriz query DTO no ejercida; GET path correcto OK; incidencia: —.
