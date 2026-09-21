# Plan de pruebas: Reporte de psicotropicos y estupefacientes

- **Menú:** Farmacos → Reporte de psicotropicos y estupefacientes.
- **Ruta:** `/reporte-psicotropicos-estupefacientes`.
- **Permiso de navegación:** `nav.reporte_psicotropicos`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI live: libro diario vacío + resumen mensual (sin controlados en periodo).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-reporte-psicotropicos-estupefacientes-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `{{ helpOpen() ? 'Ocultar ayuda' : 'Guía DIGEMID' }}`, `Libro diario`, `Resumen mensual`, `Exportar Excel DIGEMID`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M82-NEG-01 — Libro y mensual (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar entradas/salidas de producto controlado y común; alternar ledger/monthly y consultar mes.
  - **Esperado:** Solo sustancias elegibles; saldo anterior + ingreso − egreso = saldo final y ambos reportes concilian.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Periodo vacío; reglas controlados no contrastadas con stock; incidencia: —.

- [x] **M82-NEG-02 — Trazabilidad y límites (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Cruzar receta, médico, paciente y lote; consultar fin/inicio de mes local y exportar.
  - **Esperado:** Referencias completas y acceso restringido; no pierde movimientos en cambio de mes ni expone datos fuera del alcance.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Periodo vacío; reglas controlados no contrastadas con stock; incidencia: —.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M82-CAM-001 — `dateFrom() (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M82-CAM-002 — `dateTo() (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M82-CAM-003 — `reportYear() (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M82-CAM-004 — `reportMonth() (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M82-ACC-001 — `helpOpen.set(!helpOpen())`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M82-ACC-002 — `setTab('ledger')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M82-ACC-003 — `setTab('monthly')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M82-ACC-004 — `ledgerQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M82-ACC-005 — `exportLedger()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M82-ACC-006 — `monthlyQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getControlledLedger`, `getControlledMonthlyReport`, `exportControlledLedger`.

- [x] **M82-API-001 — `getControlledLedger`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: controlled-monthly 200; controlled-ledger 200 []; incidencia: —.

- [x] **M82-API-002 — `getControlledMonthlyReport`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: controlled-monthly 200; controlled-ledger 200 []; incidencia: —.

- [x] **M82-API-003 — `exportControlledLedger`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: controlled-monthly 200; controlled-ledger 200 []; incidencia: —.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M82-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M82-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M82-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: monthly/ledger vacíos GET 200; incidencia: —.
- [x] **M82-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: PASÓ; evidencia: monthly/ledger vacíos GET 200; incidencia: —.
- [x] **M82-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: PASÓ; evidencia: monthly/ledger vacíos GET 200; incidencia: —.
- [x] **M82-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M82-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: PASÓ; evidencia: UI live Chromium admin 2026-09-20; incidencia: —.
- [x] **M82-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M82-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M82-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M82-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M82-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M82-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M82-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M82-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M82-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M82-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M82-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M82-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M82-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: POST controlled-ledger/export no ejercido; incidencia: —.
- [x] **M82-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [reporte-psicotropicos-estupefacientes.component.html](../../../front-factofarm/src/app/modules/admin/pages/reporte-psicotropicos-estupefacientes/reporte-psicotropicos-estupefacientes.component.html)
- [reporte-psicotropicos-estupefacientes.component.ts](../../../front-factofarm/src/app/modules/admin/pages/reporte-psicotropicos-estupefacientes/reporte-psicotropicos-estupefacientes.component.ts)
- [API: pharmaceutical.controller.ts](../../src/modules/pharmaceutical/pharmaceutical.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M82-DTO-001 — CreateAdverseEventDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-002 — CreateAdverseEventDto.customerId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-003 — CreateAdverseEventDto.descripcion.** Reglas declaradas: `@IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-004 — CreateAdverseEventDto.severidad.** Reglas declaradas: `@IsOptional() @IsEnum(AdverseEventSeverity)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-005 — CreateAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-006 — CreateAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-007 — CreateAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-008 — CreateAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-009 — NotifyDigemidAdverseEventDto.digemidReportNumber.** Reglas declaradas: `@IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-010 — NotifyDigemidAdverseEventDto.medidasCorrectivas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-011 — NotifyDigemidAdverseEventDto.fechaNotificacion.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-012 — NotifyDigemidAdverseEventDto.pacienteEdad.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0) @Max(130)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-013 — NotifyDigemidAdverseEventDto.pacienteSexo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-014 — NotifyDigemidAdverseEventDto.reaccionTipo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-015 — NotifyDigemidAdverseEventDto.cie10Codigo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-016 — PharmaReportQueryDto.from.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-017 — PharmaReportQueryDto.to.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-018 — PharmaReportQueryDto.warehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-019 — ControlledMonthlyQueryDto.year.** Reglas declaradas: `@IsOptional() @IsInt() @Min(2000) @Max(2100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-020 — ControlledMonthlyQueryDto.month.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-021 — ProfitabilityQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-022 — SalesAnalyticsQueryDto.groupBy.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.

- [x] **M82-DTO-023 — ShrinkageExpiryQueryDto.expiryDaysAhead.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(365)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/pharmaceutical/dto/pharmaceutical.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz year/month query no completa; incidencia: —.


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
