# Plan de pruebas: Lotes

- **Menú:** Inventario → Lotes.
- **Ruta:** `/lotes`.
- **Permiso de navegación:** `nav.lotes`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-lotes-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `Almacén`, `Vencimiento`.

Botones/textos observados: ver navegación y acciones de la plantilla. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M49-NEG-01 — Existencias y vencimiento (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar lotes vigente, vencido, que vence hoy, agotado y sin vencimiento cuando se admita; filtrar almacén y vencimiento.
  - **Esperado:** Clasificación y saldos corresponden al día local y almacén; no se mezclan lotes homónimos de productos distintos.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M49-NEG-02 — Trazabilidad (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Recibir y vender el mismo lote; abrir consultas disponibles.
  - **Esperado:** Se relacionan movimientos y saldo de ese lote sin asignar stock de otro.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [ ] **M49-CAM-001 — `warehouseId()`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M49-CAM-002 — `expiryFilter()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M49-ACC-001 — `onSearchChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M49-ACC-002 — `onFilterFieldChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M49-ACC-003 — `clearFilters()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M49-ACC-004 — `refetchRows()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M49-ACC-005 — `onPageChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listInventoryMovementWarehouses`, `listInventoryLots`.

- [ ] **M49-API-001 — `listInventoryMovementWarehouses`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M49-API-002 — `listInventoryLots`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M49-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M49-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M49-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M49-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M49-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M49-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M49-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M49-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M49-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M49-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M49-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M49-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M49-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M49-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M49-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M49-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M49-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M49-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M49-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M49-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M49-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [lotes.component.html](../../../front-factofarm/src/app/modules/admin/pages/lotes/lotes.component.html)
- [lotes.component.ts](../../../front-factofarm/src/app/modules/admin/pages/lotes/lotes.component.ts)
- [API: inventory-movements.controller.ts](../../src/modules/inventory-movements/inventory-movements.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M49-DTO-001 — CreateInboundMovementDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-002 — CreateInboundMovementDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-003 — CreateInboundMovementDto.transferReasonId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-004 — CreateInboundMovementDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-005 — CreateInboundMovementDto.lotCode.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-006 — CreateInboundMovementDto.expirationDate.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-007 — CreateInboundMovementDto.registeredAt.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-008 — CreateInboundMovementDto.comment.** Reglas declaradas: `@IsOptional() @IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-009 — CreateInboundMovementDto.unitCost.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-010 — CreateInboundMovementDto.reference.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-inbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-011 — CreateOutboundMovementDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-012 — CreateOutboundMovementDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-013 — CreateOutboundMovementDto.transferReasonId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-014 — CreateOutboundMovementDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-015 — CreateOutboundMovementDto.lotCode.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-016 — CreateOutboundMovementDto.registeredAt.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-017 — CreateOutboundMovementDto.comment.** Reglas declaradas: `@IsOptional() @IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-018 — CreateOutboundMovementDto.reference.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-outbound-movement.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-019 — ImportInventoryFileDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/import-inventory-file.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-020 — InventoryImportTemplateQueryDto.mode.** Reglas declaradas: `@IsOptional() @IsIn(inventoryImportTemplateModes)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-import-template-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-021 — InventoryLotListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-022 — InventoryLotListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'producto', 'lote', 'almacen'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-023 — InventoryLotListQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-024 — InventoryLotListQueryDto.establishmentId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-025 — InventoryLotListQueryDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-026 — InventoryLotListQueryDto.expiryFilter.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'expired', '30', '60', '90'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-027 — InventoryLotListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-028 — InventoryLotListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-lot-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-029 — InventoryMovementListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-030 — InventoryMovementListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'producto', 'marca', 'almacen'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-031 — InventoryMovementListQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-032 — InventoryMovementListQueryDto.establishmentId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-033 — InventoryMovementListQueryDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-034 — InventoryMovementListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-035 — InventoryMovementListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-movement-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-036 — KardexQueryDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-037 — KardexQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-038 — KardexQueryDto.from.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-039 — KardexQueryDto.to.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-040 — KardexQueryDto.storage.** Reglas declaradas: `@IsOptional() @IsString() @IsIn(['hot', 'archived', 'all'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-041 — KardexQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-042 — KardexQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/kardex-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-043 — LotCodeSearchQueryDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/lot-code-search-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-044 — LotCodeSearchQueryDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/lot-code-search-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-045 — LotCodeSearchQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/lot-code-search-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-046 — LotCodeSearchQueryDto.mode.** Reglas declaradas: `@IsOptional() @IsIn(lotCodeSearchModes)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/lot-code-search-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-047 — CreateAdjustmentDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-adjustment.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-048 — CreateAdjustmentDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-adjustment.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-049 — CreateAdjustmentDto.countedQuantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-adjustment.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-050 — CreateAdjustmentDto.lotCode.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-adjustment.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-051 — CreateAdjustmentDto.reason.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/create-adjustment.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-052 — InventoryValuationReportQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-valuation-report-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-053 — InventoryValuationReportQueryDto.establishmentId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-valuation-report-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-054 — InventoryValuationReportQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-valuation-report-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-055 — InventoryValuationReportQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/inventory-valuation-report-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-056 — DTO.lotCode.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-057 — DTO.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-058 — DispatchSaleStockDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-059 — DispatchSaleStockDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-060 — DispatchSaleStockDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-061 — DispatchSaleStockDto.mode.** Reglas declaradas: `@IsEnum(SaleLotAllocationMode)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-062 — DispatchSaleStockDto.manualLots.** Reglas declaradas: `@IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-063 — DispatchSaleStockDto.saleId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-064 — DispatchSaleStockDto.reference.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-065 — DispatchSaleStockDto.comment.** Reglas declaradas: `@IsOptional() @IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/dispatch-sale-stock.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-066 — DTO.lotCode.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-067 — DTO.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-068 — SaleLotAllocationPreviewDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-069 — SaleLotAllocationPreviewDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-070 — SaleLotAllocationPreviewDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-071 — SaleLotAllocationPreviewDto.mode.** Reglas declaradas: `@IsEnum(SaleLotAllocationMode)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M49-DTO-072 — SaleLotAllocationPreviewDto.manualLots.** Reglas declaradas: `@IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
