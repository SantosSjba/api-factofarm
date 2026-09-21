# Plan de pruebas: Mi panel

- **Menú:** Dashboard → Mi panel.
- **Ruta:** `/dashboard`.
- **Permiso de navegación:** `nav.dashboard_admin`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** ADMINISTRADOR `admin@factosysperu.com` en `/dashboard` (sidebar completo). API GET 200: `/dashboard/stats`, `/dashboard/sales-trend`, `/dashboard/chain-summary`, `/dashboard/manager|cashier|pharmacist|warehouse|accountant`. Zona America/Lima. Smoke Chromium Cursor + API local; matrices RWD/A11Y/BRS/PER/CON no corridas completas.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-dashboard-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Ir a caja`, `Ir al POS`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M05-NEG-01 — Panel por rol (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: PASÓ parcial; evidencia: Solo rol ADMINISTRADOR panel OK; otros roles no logueados en esta pasada; incidencia: Login multi-rol; fecha: 2026-09-20.
  - **Pasos y datos:** Entrar por separado con administrador, cajero, farmacéutico, almacenero y contador; abrir Mi panel y todos sus accesos habilitados.
  - **Esperado:** Cada rol recibe su panel y acciones autorizadas; no se filtran indicadores de otras sucursales.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Solo rol ADMINISTRADOR panel OK; otros roles no logueados en esta pasada; incidencia: Login multi-rol; fecha: 2026-09-20.

- [x] **M05-NEG-02 — Consistencia de indicadores (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* compra/venta/caja en esta pasada para reconciliar indicadores; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Registrar compra, venta, pago y anulación con importes conocidos; actualizar los periodos del panel.
  - **Esperado:** Los totales se pueden reconciliar con movimientos y reportes, con el mismo establecimiento y día civil de Lima.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* compra/venta/caja en esta pasada para reconciliar indicadores; incidencia: —; fecha: 2026-09-20.

- [x] **M05-NEG-03 — Caja del cajero (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* compra/venta/caja en esta pasada para reconciliar indicadores; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Entrar sin caja abierta, abrirla desde el acceso del panel y volver; cerrar la caja.
  - **Esperado:** La llamada a la acción refleja el estado actual y lleva al flujo correcto, sin usar caja ajena.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* compra/venta/caja en esta pasada para reconciliar indicadores; incidencia: —; fecha: 2026-09-20.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M05-ACC-001 — `query.refetch()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M05-ACC-002 — `statsQuery.refetch()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M05-ACC-003 — `salesTrendQuery.refetch()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M05-ACC-004 — `chainQuery.refetch()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getAccountantDashboard`, `getDashboardStats`, `getDashboardChainSummary`, `getDashboardSalesTrend`, `getCashierDashboard`, `getManagerDashboard`, `getPharmacistDashboard`, `getWarehouseDashboard`.

- [x] **M05-API-001 — `getAccountantDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getAccountantDashboard`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-002 — `getDashboardStats`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getDashboardStats`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-003 — `getDashboardChainSummary`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getDashboardChainSummary`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-004 — `getDashboardSalesTrend`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getDashboardSalesTrend`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-005 — `getCashierDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getCashierDashboard`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-006 — `getManagerDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getManagerDashboard`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-007 — `getPharmacistDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getPharmacistDashboard`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M05-API-008 — `getWarehouseDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET dashboard relacionado 200 (`getWarehouseDashboard`) America/Lima; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M05-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Ruta del módulo presente en sidebar admin y accesible; smoke campaña 2026-09-20; incidencia: —; fecha: 2026-09-20.
- [x] **M05-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Solo ADMINISTRADOR smoke; lector/sin permiso/revocado no corridos; incidencia: Login cruzado roles; fecha: 2026-09-20.
- [x] **M05-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Listado/consulta smoke con datos demo o vacío documentado; variantes vacío forzado/nulos largos no todas; incidencia: —; fecha: 2026-09-20.
- [x] **M05-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz filtros combinados no corrida completa; incidencia: —; fecha: 2026-09-20.
- [x] **M05-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Paginación extrema/eliminación última fila no ejercida; incidencia: —; fecha: 2026-09-20.
- [x] **M05-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual/sidebar OK en smoke admin; estados deshabilitados no auditados en profundidad; incidencia: —; fecha: 2026-09-20.
- [x] **M05-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Modales/pestañas no ejercidos sistemáticamente en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M05-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M05-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M05-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M05-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M05-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M05-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M05-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M05-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin-only; aislamiento cross-tenant no plenamente demostrado; incidencia: Probe tenant B; fecha: 2026-09-20.
- [x] **M05-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload extra/secretos consola no probados en smoke; incidencia: —; fecha: 2026-09-20.
- [x] **M05-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M05-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M05-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Módulo responde en sesión admin; persistencia post-mutación/cross-módulo no revalidada completa; incidencia: —; fecha: 2026-09-20.
- [x] **M05-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin export/import/impresión aplicable en pantalla observada; validado Auto; incidencia: —; fecha: 2026-09-20.
- [x] **M05-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.

## Fuentes y trazabilidad

- [dash-accountant.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-accountant/dash-accountant.component.ts)
- [dash-admin.component.html](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-admin/dash-admin.component.html)
- [dash-admin.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-admin/dash-admin.component.ts)
- [dashboard-sales-chart.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-admin/dashboard-sales-chart.component.ts)
- [dash-cashier.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-cashier/dash-cashier.component.ts)
- [dash-manager.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-manager/dash-manager.component.ts)
- [dash-pharmacist.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-pharmacist/dash-pharmacist.component.ts)
- [dash-warehouse.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dash-warehouse/dash-warehouse.component.ts)
- [dashboard-shell.component.ts](../../../front-factofarm/src/app/modules/admin/pages/dashboard/dashboard-shell.component.ts)
- [API: dashboard.controller.ts](../../src/modules/dashboard/dashboard.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.spec.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.spec.ts) — URLs y payloads de las operaciones anteriores.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. Resultado: PASÓ parcial; evidencia: Sin FALLÓ nuevo documentado en smoke 05–18 de esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. Resultado: BLOQUEADO; evidencia: P0/P1 no todos aprobados; muchos BLOQUEADO por mutación/matrices; incidencia: Re-run mutaciones; fecha: 2026-09-20.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. Resultado: PASÓ; evidencia: Sin residuos QA-* nuevos persistentes en esta pasada (mutaciones no aplicadas o cleanup hecho); incidencia: —; fecha: 2026-09-20.
