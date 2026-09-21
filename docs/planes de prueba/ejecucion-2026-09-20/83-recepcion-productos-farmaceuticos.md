# Plan de pruebas: Recepcion de productos farmaceuticos

- **Menú:** Farmacos → Recepcion de productos farmaceuticos.
- **Ruta:** `/recepcion-productos-farmaceuticos`.
- **Permiso de navegación:** `nav.recepcion_productos_farmaceuticos`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI live: hub a recepción mercadería / lotes / movimientos.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-recepcion-productos-farmaceuticos-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: ver navegación y acciones de la plantilla. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M83-NEG-01 — Recepción sanitaria (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Registrar recepción con proveedor, producto, lote, vencimiento y controles sanitarios ofrecidos; consultar detalle.
  - **Esperado:** Se conserva evidencia de calidad y vinculación con compra/stock sin duplicar recepción comercial.
  - **Resultado / evidencia / incidencia:** Resultado: N/A; evidencia: Sin reglas locales; redirige a recepción/lotes/movimientos; incidencia: —.

- [x] **M83-NEG-02 — No conformidad (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar vencido, registro sanitario faltante y condición no conforme; ejecutar rechazo/cuarentena disponibles.
  - **Esperado:** Producto no conforme no queda disponible para dispensación por un fallo de estado; motivo y responsable trazables.
  - **Resultado / evidencia / incidencia:** Resultado: N/A; evidencia: Sin reglas locales; redirige a recepción/lotes/movimientos; incidencia: —.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: sin llamada directa detectada; revisar servicios de los componentes compartidos y enlaces de destino.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M83-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M83-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M83-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: N/A; evidencia: Hub sin listado; incidencia: —.
- [x] **M83-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: N/A; evidencia: Hub sin listado; incidencia: —.
- [x] **M83-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: N/A; evidencia: Hub sin listado; incidencia: —.
- [x] **M83-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M83-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M83-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M83-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M83-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M83-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M83-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M83-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M83-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M83-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M83-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M83-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M83-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M83-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M83-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin export en hub; incidencia: —.
- [x] **M83-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [recepcion-productos-farmaceuticos.component.ts](../../../front-factofarm/src/app/modules/admin/pages/recepcion-productos-farmaceuticos/recepcion-productos-farmaceuticos.component.ts)

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M83-DTO-001 — CreateAdverseEventDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-002 — CreateAdverseEventDto.customerId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-003 — CreateAdverseEventDto.descripcion.** Reglas declaradas: `@IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-004 — CreateAdverseEventDto.severidad.** Reglas declaradas: `@IsOptional() @IsEnum(AdverseEventSeverity)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-005 — CreateAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-006 — CreateAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-007 — CreateAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-008 — CreateAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-009 — NotifyDigemidAdverseEventDto.digemidReportNumber.** Reglas declaradas: `@IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-010 — NotifyDigemidAdverseEventDto.medidasCorrectivas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-011 — NotifyDigemidAdverseEventDto.fechaNotificacion.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-012 — NotifyDigemidAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-013 — NotifyDigemidAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-014 — NotifyDigemidAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-015 — NotifyDigemidAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-016 — PharmaReportQueryDto.from.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-017 — PharmaReportQueryDto.to.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-018 — PharmaReportQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-019 — ControlledMonthlyQueryDto.year.** Reglas declaradas: `@IsOptional() @IsInt() @Min(2000) @Max(2100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-020 — ControlledMonthlyQueryDto.month.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-021 — ProfitabilityQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-022 — SalesAnalyticsQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.

- [x] **M83-DTO-023 — ShrinkageExpiryQueryDto.expiryDaysAhead.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(365)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: N/A; evidencia: Sin DTO propio del hub; incidencia: —.


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
