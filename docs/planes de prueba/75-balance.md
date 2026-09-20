# Plan de pruebas: Balance

- **Menú:** Finanzas → Balance.
- **Ruta:** `/balance`.
- **Permiso de navegación:** `nav.balance`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-balance-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Consultar`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M75-NEG-01 — Rentabilidad (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar ingreso 100 y costo/gasto conocidos; consultar balance y margen por los filtros disponibles.
  - **Esperado:** Totales y porcentajes se reconcilian con fuentes y base de cálculo; sin ingresos no se divide entre cero.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M75-NEG-02 — Moneda y ajustes (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Agregar anulación, devolución y otra moneda; actualizar periodo.
  - **Esperado:** No se suman monedas incompatibles sin conversión explícita ni se cuentan documentos anulados como vigentes.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [ ] **M75-CAM-001 — `from() (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M75-CAM-002 — `to() (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M75-ACC-001 — `marginQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getMarginReport`.

- [ ] **M75-API-001 — `getMarginReport`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M75-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M75-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M75-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M75-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M75-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M75-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M75-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M75-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M75-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M75-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M75-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M75-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M75-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M75-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M75-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M75-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M75-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M75-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M75-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M75-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M75-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [balance.component.ts](../../../front-factofarm/src/app/modules/admin/pages/balance/balance.component.ts)
- [API: finance.controller.ts](../../src/modules/finance/finance.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M75-DTO-001 — FinancePeriodQueryDto.from.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-002 — FinancePeriodQueryDto.to.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-003 — AccountingExportQueryDto.format.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-004 — CreateBankAccountDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-005 — CreateBankAccountDto.tipo.** Reglas declaradas: `@IsOptional() @IsEnum(BankAccountType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-006 — CreateBankAccountDto.banco.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-007 — CreateBankAccountDto.numeroCuenta.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-008 — CreateBankMovementDto.bankAccountId.** Reglas declaradas: `@IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-009 — CreateBankMovementDto.tipo.** Reglas declaradas: `@IsEnum(BankMovementType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-010 — CreateBankMovementDto.monto.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-011 — CreateBankMovementDto.referencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-012 — CreateBankMovementDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-013 — BankMovementListQueryDto.bankAccountId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-014 — BankMovementListQueryDto.conciliado.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-015 — UpsertPurchaseBudgetDto.anio.** Reglas declaradas: `@IsInt() @Min(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-016 — UpsertPurchaseBudgetDto.mes.** Reglas declaradas: `@IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-017 — UpsertPurchaseBudgetDto.montoPresupuestado.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-018 — UpsertPurchaseBudgetDto.notas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-019 — PurchaseBudgetReportQueryDto.anio.** Reglas declaradas: `@IsInt() @Min(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-020 — BulkReconcileMovementsDto.movementIds.** Reglas declaradas: `@IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-021 — RecentPaymentsQueryDto.from.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-022 — RecentPaymentsQueryDto.to.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-023 — GeneralLedgerQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-024 — GeneralLedgerQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/finance/dto/finance.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-025 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M75-DTO-026 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
