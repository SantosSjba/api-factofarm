# Plan de pruebas: G.R. Remitente

- **Menú:** Guias de remision → G.R. Remitente.
- **Ruta:** `/gr-remitente`.
- **Permiso de navegación:** `nav.gr_remitente`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI emite guía desde traslados EN_TRANSITO. GET /inventory-transfers?page=1&pageSize=15 → 200 {items:[],total:0}. emitGuiaFromTransfer no ejercido (sin filas). Ruta `/gr-remitente`.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-gr-remitente-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: ver navegación y acciones de la plantilla. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M55-NEG-01 — Guía completa (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Completar participantes, origen/destino, bienes y transporte; para transportista seleccionar transportista, conductor, vehículo y dirección; emitir en pruebas.
  - **Esperado:** Datos y cantidades corresponden a traslado/documento origen, con numeración y estado trazable.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Sin traslados EN_TRANSITO; emisión GR no contrastada; incidencia: Preparar traslado.

- [x] **M55-NEG-02 — Validación y proveedor (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar datos faltantes, partida/destino inválidos, conductor/vehículo incompatibles y rechazo/timeout.
  - **Esperado:** No se emite documento incompleto; reintento consulta estado sin duplicar guía o movimientos.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Sin traslados EN_TRANSITO; emisión GR no contrastada; incidencia: Preparar traslado.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M55-ACC-001 — `listQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M55-ACC-002 — `emitGuiaMutation.mutate(row.id)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M55-ACC-003 — `page.set($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listInventoryTransfers`, `emitGuiaFromTransfer`.

- [x] **M55-API-001 — `listInventoryTransfers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /billing/documents 3× GUIA_REMISION_REMITENTE T001-00000001/02/03 RECHAZADO; incidencia: MOCK.

- [x] **M55-API-002 — `emitGuiaFromTransfer`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: POST `/billing/transfers/da2624c2-…/emit-guia` **201** T001-00000003 RECHAZADO (MOCK); `ac63640f-…` **201** T001-00000001; incidencia: OSE.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M55-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/gr-remitente`; transfers 200; incidencia: Abrir UI.
- [x] **M55-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/gr-remitente`; transfers 200; incidencia: Abrir UI.
- [x] **M55-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET inventory-transfers 200 vacío; incidencia: —.
- [x] **M55-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET inventory-transfers 200 vacío; incidencia: —.
- [x] **M55-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET inventory-transfers 200 vacío; incidencia: —.
- [x] **M55-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M55-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M55-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M55-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M55-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M55-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M55-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M55-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M55-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M55-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M55-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M55-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M55-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M55-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M55-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Emisión electrónica no es export archivo local; incidencia: —.
- [x] **M55-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [gr-remitente.component.ts](../../../front-factofarm/src/app/modules/admin/pages/gr-remitente/gr-remitente.component.ts)
- [API: shipping-guides.controller.ts](../../src/modules/shipping-guides/shipping-guides.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M55-DTO-001 — ShippingListQueryDto.carrierId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-002 — CreateShippingCarrierDto.ruc.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(11)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-003 — CreateShippingCarrierDto.razonSocial.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-004 — CreateShippingCarrierDto.nombreComercial.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-005 — CreateShippingCarrierDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-006 — CreateShippingCarrierDto.correo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-007 — UpdateShippingCarrierDto.razonSocial.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-008 — UpdateShippingCarrierDto.nombreComercial.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-009 — UpdateShippingCarrierDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-010 — UpdateShippingCarrierDto.correo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-011 — UpdateShippingCarrierDto.activo.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-012 — CreateShippingDriverDto.carrierId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-013 — CreateShippingDriverDto.tipoDocumento.** Reglas declaradas: `@IsOptional() @IsEnum(CustomerDocumentType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-014 — CreateShippingDriverDto.numeroDocumento.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(20)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-015 — CreateShippingDriverDto.nombres.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-016 — CreateShippingDriverDto.apellidos.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-017 — CreateShippingDriverDto.licencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-018 — CreateShippingDriverDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-019 — UpdateShippingDriverDto.carrierId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-020 — UpdateShippingDriverDto.nombres.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-021 — UpdateShippingDriverDto.apellidos.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-022 — UpdateShippingDriverDto.licencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-023 — UpdateShippingDriverDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-024 — UpdateShippingDriverDto.activo.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-025 — CreateShippingVehicleDto.carrierId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-026 — CreateShippingVehicleDto.placa.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(20)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-027 — CreateShippingVehicleDto.marca.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-028 — CreateShippingVehicleDto.modelo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-029 — CreateShippingVehicleDto.capacidadKg.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-030 — UpdateShippingVehicleDto.carrierId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-031 — UpdateShippingVehicleDto.marca.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-032 — UpdateShippingVehicleDto.modelo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-033 — UpdateShippingVehicleDto.capacidadKg.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-034 — UpdateShippingVehicleDto.activo.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-035 — CreateDepartureAddressDto.codigo.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-036 — CreateDepartureAddressDto.nombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-037 — CreateDepartureAddressDto.direccion.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-038 — CreateDepartureAddressDto.departmentId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-039 — CreateDepartureAddressDto.provinceId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-040 — CreateDepartureAddressDto.districtId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-041 — UpdateDepartureAddressDto.nombre.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-042 — UpdateDepartureAddressDto.direccion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-043 — UpdateDepartureAddressDto.departmentId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-044 — UpdateDepartureAddressDto.provinceId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-045 — UpdateDepartureAddressDto.districtId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-046 — UpdateDepartureAddressDto.activo.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/shipping-guides/dto/shipping-guides.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-047 — MaestroListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/maestro-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-048 — MaestroListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'descripcion'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/maestro-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-049 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.

- [x] **M55-DTO-050 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO emit-guia no ejercida; incidencia: —.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Cierre parcial campaña API-smoke; capturas/matriz RWD y P0 UI pendientes; incidencia: Completar con browser.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Cierre parcial campaña API-smoke; capturas/matriz RWD y P0 UI pendientes; incidencia: Completar con browser.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Cierre parcial campaña API-smoke; capturas/matriz RWD y P0 UI pendientes; incidencia: Completar con browser.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Cierre parcial campaña API-smoke; capturas/matriz RWD y P0 UI pendientes; incidencia: Completar con browser.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Cierre parcial campaña API-smoke; capturas/matriz RWD y P0 UI pendientes; incidencia: Completar con browser.
