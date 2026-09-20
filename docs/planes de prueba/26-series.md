# Plan de pruebas: Series

- **Menú:** Productos/Servicios → Series.
- **Ruta:** `/series`.
- **Permiso de navegación:** `nav.series`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-series-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Exportar`, `{{ row.vendido ? 'Marcar disponible' : 'Marcar vendido' }}`, `Eliminar`, `Cancelar`, `{{ confirmActionButtonLabel() }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M26-NEG-01 — Serie documental (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Crear serie para documento y establecimiento; probar repetida, formato inválido y correlativo límite; activar/desactivar.
  - **Esperado:** Unicidad y formato se validan en su alcance; selección de POS respeta documento y estado.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M26-NEG-02 — Concurrencia y eliminación (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Emitir dos documentos simultáneos con la misma serie; intentar eliminar una serie ya usada.
  - **Esperado:** Numeración sin duplicados, documentos previos íntegros y eliminación controlada.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M26-ACC-001 — `exportRows()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-002 — `onSearchChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-003 — `onFieldChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-004 — `clearFilters()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-005 — `refetchRows()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-006 — `openToggleStatus(row)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-007 — `openDelete(row)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-008 — `onPageChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-009 — `closeConfirmModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M26-ACC-010 — `runConfirmAction()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listSeries`, `updateSeriesStatus`, `deleteSeries`, `exportSeries`.

- [ ] **M26-API-001 — `listSeries`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M26-API-002 — `updateSeriesStatus`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M26-API-003 — `deleteSeries`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M26-API-004 — `exportSeries`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M26-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M26-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M26-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M26-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M26-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M26-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M26-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M26-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M26-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M26-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M26-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M26-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M26-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M26-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M26-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M26-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M26-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M26-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M26-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M26-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M26-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [series.component.html](../../../front-factofarm/src/app/modules/admin/pages/series/series.component.html)
- [series.component.ts](../../../front-factofarm/src/app/modules/admin/pages/series/series.component.ts)
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M26-DTO-001 — SeriesListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/series-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M26-DTO-002 — SeriesListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'serie', 'producto', 'estado'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/series-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M26-DTO-003 — SeriesListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/series-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M26-DTO-004 — SeriesListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/series-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M26-DTO-005 — UpdateSeriesStatusDto.estado.** Reglas declaradas: `@IsEnum(ProductSerialStatus)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/update-series-status.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M26-DTO-006 — UpdateSeriesStatusDto.vendido.** Reglas declaradas: `@IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/series/dto/update-series-status.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
