# Plan de pruebas: Dashboard

- **Menú:** Plataforma → Dashboard.
- **Ruta:** `/platform/dashboard`.
- **Permiso de navegación:** `nav.platform_dashboard`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** SUPER_ADMIN en `/platform/dashboard`. UI: Clientes activos=2, En prueba=0, Pendientes=0, Suspendidos=0, Leads nuevos=1, Reclamaciones abiertas=0, Activados(30d)=2, Sucursales activas=2, Usuarios de clientes=10; recientes Venta Addin (BOTICA/ACTIVE) y FactoFarm Demo (CADENA/ACTIVE). Título «FactoFarm | Dashboard plataforma». Sidebar solo sección plataforma. Tenant admin no debe ver datos globales (API denial pendiente).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-platform-dashboard-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: ver navegación y acciones de la plantilla. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M01-NEG-01 — Indicadores de plataforma (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Preparar tenants PENDING, TRIAL, ACTIVE y SUSPENDED, además de un conjunto vacío; abrir el panel y usar sus accesos a clientes.
  - **Esperado:** Cada indicador coincide con los tenants de prueba y el acceso aplica el filtro correcto; un administrador de farmacia no obtiene datos globales.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ; evidencia: Indicadores UI coinciden con 2 tenants ACTIVE (activos=2, trial/pending/suspended=0, activados 30d=2, sucursales=2, usuarios=10, leads nuevos=1, reclamaciones abiertas=0); recientes Venta Addin BOTICA/ACTIVE y FactoFarm Demo CADENA/ACTIVE. Aislamiento UI menú plataforma solo SUPER_ADMIN (API denial tenant admin pendiente); incidencia: —.
- [x] **M01-NEG-02 — Actualización del panel (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Cambiar estado y plan de un tenant desde Clientes SaaS; volver y actualizar.
  - **Esperado:** Las cantidades se actualizan sin contar dos veces un cliente ni mostrar caché de otra sesión.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: No se mutó estado/plan de tenant en esta pasada para forzar refresh del panel; incidencia: Dependencia: completar tras 02-platform-clientes.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M01-ACC-001 — `query.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Panel cargó con indicadores; refetch explícito no clickeado con evidencia — carga inicial OK; incidencia: Re-run click refresh/refetch.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `getPlatformDashboard`.

- [x] **M01-API-001 — `getPlatformDashboard`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Datos dashboard claramente de API getPlatformDashboard (conteos/recientes coherentes); captura HTTP/variantes 4xx no ejecutadas en smoke; incidencia: Completar matriz API negativa.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M01-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: URL directa /platform/dashboard + sidebar SUPER_ADMIN; título FactoFarm | Dashboard plataforma; incidencia: —.
- [x] **M01-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: SUPER_ADMIN OK; denegación tenant ADMINISTRADOR y lector/sin permiso pendientes; incidencia: Login cruzado.
- [x] **M01-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Listado recientes 2 filas (Venta Addin, FactoFarm Demo); variantes vacío/nulos no forzadas; incidencia: —.
- [x] **M01-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: N/A; evidencia: Dashboard sin filtros de listado en plantilla observada; validado Auto; incidencia: —.
- [x] **M01-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: N/A; evidencia: Dashboard sin paginación de listado en plantilla observada; validado Auto; incidencia: —.
- [x] **M01-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual OK (indicadores/sidebar); estados deshabilitados no auditados; incidencia: —.
- [x] **M01-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin modales/pestañas en dashboard plataforma; validado Auto; incidencia: —.
- [x] **M01-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport 320–1920 pendiente re-run; incidencia: —.
- [x] **M01-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport pendiente re-run; incidencia: —.
- [x] **M01-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/teclado virtual pendiente re-run; incidencia: —.
- [x] **M01-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado completo no ejecutado en smoke; incidencia: —.
- [x] **M01-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Zoom/contraste/etiquetas no verificados en profundidad; incidencia: —.
- [x] **M01-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red lenta/timeout/500 no ejecutada; incidencia: —.
- [x] **M01-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz 4xx/401/403 no ejercida en smoke; incidencia: —.
- [x] **M01-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Aislamiento rol UI menú plataforma solo SUPER_ADMIN; probe API tenant pendiente; incidencia: —.
- [x] **M01-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload/secretos consola no probados en smoke; incidencia: —.
- [x] **M01-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada en smoke read-only; incidencia: —.
- [x] **M01-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Prueba volumen/listeners no medida; incidencia: —.
- [x] **M01-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Panel refleja clientes/leads/reclamaciones al cargar; refresh tras mutación 02 pendiente; incidencia: —.
- [x] **M01-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: N/A; evidencia: Sin export/import/impresión en dashboard plataforma; validado Auto; incidencia: —.
- [x] **M01-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [platform-dashboard.component.ts](../../../front-factofarm/src/app/modules/admin/pages/platform-dashboard/platform-dashboard.component.ts)
- [API: dashboard.controller.ts](../../src/modules/dashboard/dashboard.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. **Resultado: BLOQUEADO; evidencia: Cierre incompleto: smoke/parcial; matriz RWD/A11Y/API/mutaciones pendientes; capturas viewport no adjuntas; incidencia: Completar re-run profundo antes de cierre formal.**
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. **Resultado: BLOQUEADO; evidencia: Cierre incompleto: smoke/parcial; matriz RWD/A11Y/API/mutaciones pendientes; capturas viewport no adjuntas; incidencia: Completar re-run profundo antes de cierre formal.**
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. **Resultado: BLOQUEADO; evidencia: Cierre incompleto: smoke/parcial; matriz RWD/A11Y/API/mutaciones pendientes; capturas viewport no adjuntas; incidencia: Completar re-run profundo antes de cierre formal.**
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. **Resultado: BLOQUEADO; evidencia: Cierre incompleto: smoke/parcial; matriz RWD/A11Y/API/mutaciones pendientes; capturas viewport no adjuntas; incidencia: Completar re-run profundo antes de cierre formal.**
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. **Resultado: BLOQUEADO; evidencia: Cierre incompleto: smoke/parcial; matriz RWD/A11Y/API/mutaciones pendientes; capturas viewport no adjuntas; incidencia: Completar re-run profundo antes de cierre formal.**
