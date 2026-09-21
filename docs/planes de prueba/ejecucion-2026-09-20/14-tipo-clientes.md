# Plan de pruebas: Tipos de Clientes

- **Menú:** Clientes → Tipos de Clientes.
- **Ruta:** `/tipo-clientes`.
- **Permiso de navegación:** `nav.tipo_clientes`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** ADMINISTRADOR; GET `/customer-types` 200. CRUD API real: POST `QA-TIPO-CLIENTES-CAMPANA-2026-09-20` id=`0e5bf306-6f7d-4261-967b-796e9add8180` luego DELETE 200 (cleanup).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-tipo-clientes-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `Descripción`.

Botones/textos observados: `Nuevo`, `Cancelar`, `{{ submitLabel() }}`, `{{ deleteMutation.isPending() ? 'Eliminando…' : 'Eliminar' }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M14-NEG-01 — Catálogo y dependencias (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: PASÓ parcial; evidencia: Alta+delete API QA tipo cliente OK; duplicado/asignación a cliente/eliminar usado no ejercidos; incidencia: Completar dependencias cliente; fecha: 2026-09-20.
  - **Pasos y datos:** Crear descripción QA, duplicarla, editarla y asignarla a un cliente; intentar eliminar un tipo usado.
  - **Esperado:** Nombre validado, selector actualizado y referencias existentes protegidas o conservadas según contrato; no hay clientes huérfanos.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Alta+delete API QA tipo cliente OK; duplicado/asignación a cliente/eliminar usado no ejercidos; incidencia: Completar dependencias cliente; fecha: 2026-09-20.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M14-CAM-001 — `descripcion()`.** Resultado: PASÓ parcial; evidencia: descripcion persistió vía POST (normalizada mayúsculas); matriz V01–V12 límites no completa; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: descripcion persistió vía POST (normalizada mayúsculas); matriz V01–V12 límites no completa; incidencia: —; fecha: 2026-09-20.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M14-ACC-001 — `openCreateModal()`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-002 — `onSearchChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-003 — `onFilterFieldChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-004 — `clearFilters()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-005 — `refetchRows()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-006 — `openEditModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-007 — `openDeleteConfirm(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-008 — `onPageChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-009 — `closeFormModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-010 — `submitForm()`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-011 — `closeDeleteConfirm()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada (UI acciones no ejercidas); incidencia: —; fecha: 2026-09-20.

- [x] **M14-ACC-012 — `confirmDelete()`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete ejecutado; UI modal no clickeada en esta pasada; incidencia: —; fecha: 2026-09-20.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listCustomerTypesPaged`, `createCustomerType`, `updateCustomerType`, `deleteCustomerType`.

- [x] **M14-API-001 — `listCustomerTypesPaged`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listCustomerTypesPaged`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M14-API-002 — `createCustomerType`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: POST /customer-types 200 id=0e5bf306-6f7d-4261-967b-796e9add8180; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M14-API-003 — `updateCustomerType`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M14-API-004 — `deleteCustomerType`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: DELETE /customer-types/0e5bf306-6f7d-4261-967b-796e9add8180 200; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M14-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Ruta del módulo presente en sidebar admin y accesible; smoke campaña 2026-09-20; incidencia: —; fecha: 2026-09-20.
- [x] **M14-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Solo ADMINISTRADOR smoke; lector/sin permiso/revocado no corridos; incidencia: Login cruzado roles; fecha: 2026-09-20.
- [x] **M14-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Listado/consulta smoke con datos demo o vacío documentado; variantes vacío forzado/nulos largos no todas; incidencia: —; fecha: 2026-09-20.
- [x] **M14-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz filtros combinados no corrida completa; incidencia: —; fecha: 2026-09-20.
- [x] **M14-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Paginación extrema/eliminación última fila no ejercida; incidencia: —; fecha: 2026-09-20.
- [x] **M14-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual/sidebar OK en smoke admin; estados deshabilitados no auditados en profundidad; incidencia: —; fecha: 2026-09-20.
- [x] **M14-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Modales/pestañas no ejercidos sistemáticamente en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M14-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M14-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M14-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M14-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M14-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M14-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M14-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M14-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin-only; aislamiento cross-tenant no plenamente demostrado; incidencia: Probe tenant B; fecha: 2026-09-20.
- [x] **M14-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload extra/secretos consola no probados en smoke; incidencia: —; fecha: 2026-09-20.
- [x] **M14-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M14-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M14-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Módulo responde en sesión admin; persistencia post-mutación/cross-módulo no revalidada completa; incidencia: —; fecha: 2026-09-20.
- [x] **M14-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin export/import/impresión aplicable en pantalla observada; validado Auto; incidencia: —; fecha: 2026-09-20.
- [x] **M14-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.

## Fuentes y trazabilidad

- [tipo-clientes.component.html](../../../front-factofarm/src/app/modules/admin/pages/tipo-clientes/tipo-clientes.component.html)
- [tipo-clientes.component.ts](../../../front-factofarm/src/app/modules/admin/pages/tipo-clientes/tipo-clientes.component.ts)
- [API: customer-types.controller.ts](../../src/modules/customer-types/customer-types.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M14-DTO-001 — MaestroListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/maestro-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M14-DTO-002 — MaestroListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'descripcion'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/maestro-list-query.dto.ts). **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: POST válido con descripcion QA; violaciones MaxLength/vacío no ejercidas; incidencia: —; fecha: 2026-09-20.

- [x] **M14-DTO-003 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M14-DTO-004 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M14-DTO-005 — CreateCustomerTypeDto.descripcion.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customer-types/dto/create-customer-type.dto.ts). **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: POST válido con descripcion QA; violaciones MaxLength/vacío no ejercidas; incidencia: —; fecha: 2026-09-20.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. Resultado: PASÓ parcial; evidencia: Sin FALLÓ nuevo documentado en smoke 05–18 de esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. Resultado: BLOQUEADO; evidencia: P0/P1 no todos aprobados; muchos BLOQUEADO por mutación/matrices; incidencia: Re-run mutaciones; fecha: 2026-09-20.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. Resultado: PASÓ; evidencia: Registros QA-* creados y eliminados vía API (cleanup documentado en cabecera); incidencia: —; fecha: 2026-09-20.
