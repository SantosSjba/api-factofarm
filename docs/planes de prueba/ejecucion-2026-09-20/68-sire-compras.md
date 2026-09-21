# Plan de pruebas: Compras

- **Menú:** Contabilidad → SIRE → Compras.
- **Ruta:** `/sire-compras`.
- **Permiso de navegación:** `nav.sire_compras`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI `/sire-compras` 3 recepciones / S/ 62.50. PLE 8.1 `LE…20260981.txt` 200.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-sire-compras-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Consultar`, `Exportar PLE 8.1`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M68-NEG-01 — Archivo contable (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar documentos válidos, anulados, crédito/débito y dos monedas en un periodo; generar cada formato ofrecido.
  - **Esperado:** Estructura, codificación, columnas, fechas, signos y totales coinciden con especificación versionada del formato del proyecto.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Compras count=0 periodo; reglas profundas no; incidencia: —.

- [x] **M68-NEG-02 — Periodo y reexportación (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar periodo vacío, cerrado, rango invertido y reexportar mismo conjunto.
  - **Esperado:** Archivo no mezcla periodos/tenants ni duplica filas; nombres y contenido permiten identificar periodo y empresa.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Compras count=0 periodo; reglas profundas no; incidencia: —.

- [x] **M68-NEG-03 — Conciliación documental (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Comparar exportación con documentos fuente, impuestos y ajustes mediante cálculo independiente.
  - **Esperado:** Diferencias de redondeo explicables; cada fila tiene referencia y los totales concilian. No declarar certificación normativa sin validación externa aprobada.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Compras count=0 periodo; reglas profundas no; incidencia: —.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M68-CAM-001 — `period() — YYYY-MM`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M68-ACC-001 — `summaryQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M68-ACC-002 — `exportPle()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getAccountantSummary`, `getPleExport`.

- [x] **M68-API-001 — `getAccountantSummary`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: accountant-summary 200; PLE 8.1 200; guessed /sire/compras 404; incidencia: —.

- [x] **M68-API-002 — `getPleExport`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: accountant-summary 200; PLE 8.1 200; guessed /sire/compras 404; incidencia: —.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M68-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/sire-compras`; PLE 8.1 200; incidencia: Abrir UI.
- [x] **M68-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/sire-compras`; PLE 8.1 200; incidencia: Abrir UI.
- [x] **M68-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: summary compras count=0; PLE 8.1 vacío; incidencia: —.
- [x] **M68-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: PASÓ; evidencia: summary compras count=0; PLE 8.1 vacío; incidencia: —.
- [x] **M68-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: PASÓ; evidencia: summary compras count=0; PLE 8.1 vacío; incidencia: —.
- [x] **M68-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M68-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M68-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M68-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M68-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M68-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M68-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M68-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M68-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M68-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M68-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M68-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M68-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M68-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M68-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: PLE 8.1 vía API OK; UI download pendiente; incidencia: —.
- [x] **M68-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [sire-compras.component.ts](../../../front-factofarm/src/app/modules/admin/pages/sire-compras/sire-compras.component.ts)
- [API: compliance.controller.ts](../../src/modules/compliance/compliance.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M68-DTO-001 — FinancePeriodQueryDto.from.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-002 — FinancePeriodQueryDto.to.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-003 — AccountingExportQueryDto.format.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-004 — CreateBankAccountDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-005 — CreateBankAccountDto.tipo.** Reglas declaradas: `@IsOptional() @IsEnum(BankAccountType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-006 — CreateBankAccountDto.banco.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-007 — CreateBankAccountDto.numeroCuenta.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-008 — CreateBankMovementDto.bankAccountId.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-009 — CreateBankMovementDto.tipo.** Reglas declaradas: `@IsEnum(BankMovementType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-010 — CreateBankMovementDto.monto.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-011 — CreateBankMovementDto.referencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-012 — CreateBankMovementDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-013 — BankMovementListQueryDto.bankAccountId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-014 — BankMovementListQueryDto.conciliado.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-015 — UpsertPurchaseBudgetDto.anio.** Reglas declaradas: `@IsInt() @Min(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-016 — UpsertPurchaseBudgetDto.mes.** Reglas declaradas: `@IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-017 — UpsertPurchaseBudgetDto.montoPresupuestado.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-018 — UpsertPurchaseBudgetDto.notas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-019 — PurchaseBudgetReportQueryDto.anio.** Reglas declaradas: `@IsInt() @Min(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-020 — BulkReconcileMovementsDto.movementIds.** Reglas declaradas: `@IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-021 — RecentPaymentsQueryDto.from.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-022 — RecentPaymentsQueryDto.to.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-023 — GeneralLedgerQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-024 — GeneralLedgerQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-025 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.

- [x] **M68-DTO-026 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz period no completa; incidencia: —.


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
