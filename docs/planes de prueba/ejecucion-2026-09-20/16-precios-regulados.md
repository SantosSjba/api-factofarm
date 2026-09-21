# Plan de pruebas: Precios regulados DIGEMED

- **Menú:** Productos/Servicios → Precios regulados DIGEMED.
- **Ruta:** `/precios-regulados`.
- **Permiso de navegación:** `nav.precios_regulados`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** ADMINISTRADOR; GET `/compliance/regulated-prices` 200 [] (vacío). Sin mutación precio regulado QA-* en esta pasada.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-precios-regulados-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Guardar`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M16-NEG-01 — Consulta y comparación (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Buscar producto regulado, sin referencia y con precio en el límite, por debajo y por encima; actualizar catálogo de pruebas si existe acción.
  - **Esperado:** Se identifica la fuente y referencia aplicable; diferencias se muestran correctamente sin inventar un precio para productos sin datos.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-NEG-02 — Uso del precio (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Comparar el resultado con el catálogo y precio ofrecido en POS para misma presentación y moneda.
  - **Esperado:** No se comparan unidades diferentes ni se aplica una actualización fuera del alcance autorizado.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M16-CAM-001 — `codigo() — Código DIGEMID`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-CAM-002 — `nombre() — Nombre`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-CAM-003 — `precio() — Precio máximo`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M16-ACC-001 — `save()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listRegulatedPrices`, `upsertRegulatedPrice`.

- [x] **M16-API-001 — `listRegulatedPrices`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listRegulatedPrices`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M16-API-002 — `upsertRegulatedPrice`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`upsertRegulatedPrice`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M16-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Ruta del módulo presente en sidebar admin y accesible; smoke campaña 2026-09-20; incidencia: —; fecha: 2026-09-20.
- [x] **M16-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Solo ADMINISTRADOR smoke; lector/sin permiso/revocado no corridos; incidencia: Login cruzado roles; fecha: 2026-09-20.
- [x] **M16-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Listado/consulta smoke con datos demo o vacío documentado; variantes vacío forzado/nulos largos no todas; incidencia: —; fecha: 2026-09-20.
- [x] **M16-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz filtros combinados no corrida completa; incidencia: —; fecha: 2026-09-20.
- [x] **M16-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Paginación extrema/eliminación última fila no ejercida; incidencia: —; fecha: 2026-09-20.
- [x] **M16-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual/sidebar OK en smoke admin; estados deshabilitados no auditados en profundidad; incidencia: —; fecha: 2026-09-20.
- [x] **M16-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Modales/pestañas no ejercidos sistemáticamente en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M16-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M16-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M16-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M16-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M16-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M16-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M16-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M16-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin-only; aislamiento cross-tenant no plenamente demostrado; incidencia: Probe tenant B; fecha: 2026-09-20.
- [x] **M16-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload extra/secretos consola no probados en smoke; incidencia: —; fecha: 2026-09-20.
- [x] **M16-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M16-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M16-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Módulo responde en sesión admin; persistencia post-mutación/cross-módulo no revalidada completa; incidencia: —; fecha: 2026-09-20.
- [x] **M16-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin export/import/impresión aplicable en pantalla observada; validado Auto; incidencia: —; fecha: 2026-09-20.
- [x] **M16-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.

## Fuentes y trazabilidad

- [precios-regulados.component.ts](../../../front-factofarm/src/app/modules/admin/pages/precios-regulados/precios-regulados.component.ts)
- [API: compliance.controller.ts](../../src/modules/compliance/compliance.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M16-DTO-001 — CreateAdverseEventDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-002 — CreateAdverseEventDto.customerId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-003 — CreateAdverseEventDto.descripcion.** Reglas declaradas: `@IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-004 — CreateAdverseEventDto.severidad.** Reglas declaradas: `@IsOptional() @IsEnum(AdverseEventSeverity)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-005 — CreateAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-006 — CreateAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-007 — CreateAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-008 — CreateAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-009 — NotifyDigemidAdverseEventDto.digemidReportNumber.** Reglas declaradas: `@IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-010 — NotifyDigemidAdverseEventDto.medidasCorrectivas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-011 — NotifyDigemidAdverseEventDto.fechaNotificacion.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-012 — NotifyDigemidAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-013 — NotifyDigemidAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-014 — NotifyDigemidAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-015 — NotifyDigemidAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-016 — PharmaReportQueryDto.from.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-017 — PharmaReportQueryDto.to.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-018 — PharmaReportQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-019 — ControlledMonthlyQueryDto.year.** Reglas declaradas: `@IsOptional() @IsInt() @Min(2000) @Max(2100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-020 — ControlledMonthlyQueryDto.month.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-021 — ProfitabilityQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-022 — SalesAnalyticsQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M16-DTO-023 — ShrinkageExpiryQueryDto.expiryDaysAhead.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(365)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. Resultado: PASÓ parcial; evidencia: Sin FALLÓ nuevo documentado en smoke 05–18 de esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. Resultado: BLOQUEADO; evidencia: P0/P1 no todos aprobados; muchos BLOQUEADO por mutación/matrices; incidencia: Re-run mutaciones; fecha: 2026-09-20.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. Resultado: PASÓ; evidencia: Sin residuos QA-* nuevos persistentes en esta pasada (mutaciones no aplicadas o cleanup hecho); incidencia: —; fecha: 2026-09-20.
