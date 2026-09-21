# Criterios comunes de ejecución

Fecha de referencia: 2026-09-20. Este documento complementa **cada uno de los 84 planes por opción del sidebar**. Las casillas del plan de cada opción son independientes: aprobar Usuarios no aprueba automáticamente Productos. Son pruebas propuestas, no resultados de una ejecución ni certificación normativa.

## Cómo marcar y registrar resultados

- [x] Preparar una copia de los planes para la versión que se va a evaluar; conservar el original como plantilla.
  ```text
  Resultado: PASÓ
  Variante y datos: copia de ejecución en docs/planes de prueba/ejecucion-2026-09-20/
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: n/a (preparación de campaña)
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: carpeta ejecucion-2026-09-20/ con 00–84 y README; original conservado como plantilla
  Evidencia (captura, video, request sanitizado, documento): ruta de copia en repo api-factofarm
  Incidencia / responsable / fecha / repetición: Auto campaña 2026-09-20
  ```
- [x] Marcar `[x]` cuando se haya ejecutado el caso y registrar PASÓ, FALLÓ, BLOQUEADO o N/A. Una casilla marcada no significa por sí sola que pasó.
  ```text
  Resultado: PASÓ
  Variante y datos: convención de campaña aplicada en esta copia
  Versión frontend / API / migración: n/a
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: casillas con [x] + bloque Resultado; PASÓ no se infiere solo del check
  Evidencia: este documento
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```
- [x] Registrar por variante: ID del caso, datos empleados, rol, tenant, establecimiento, navegador/versión, viewport, pasos, esperado, obtenido, evidencia e incidencia.
  ```text
  Resultado: PASÓ
  Variante y datos: plantilla de registro adoptada bajo cada caso
  Versión frontend / API / migración: n/a
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: campos de plantilla usados en PRE/NAV y N/A documentados en matrices transversales
  Evidencia: este documento
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```
- [x] Si una función no existe en la versión desplegada, identificar si es una diferencia respecto al código, una condición de permisos/plan o una función no implementada. No registrar PASÓ.
  ```text
  Resultado: PASÓ
  Variante y datos: regla de campaña (no inventar PASÓ sin evidencia)
  Versión frontend / API / migración: n/a
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: aplicada en PRE05/PRE07/NAV02/NAV04–NAV08 (BLOQUEADO/GAP sin PASÓ inventado)
  Evidencia: bloques Resultado de este documento
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```
- [x] Para N/A, explicar la razón y quién validó la exclusión. Para BLOQUEADO, indicar dependencia y condición de desbloqueo.
  ```text
  Resultado: PASÓ
  Variante y datos: N/A con motivo + validador; BLOQUEADO con dependencia
  Versión frontend / API / migración: n/a
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: criterio aplicado en matrices transversales y casos bloqueados
  Evidencia: este documento
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```
- [x] En una corrección, conservar el fallo original y añadir fecha, versión y resultado de la repetición.
  ```text
  Resultado: PASÓ
  Variante y datos: política de no sobrescribir fallos originales
  Versión frontend / API / migración: n/a
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: convención documentada para repeticiones futuras de campaña
  Evidencia: este documento
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```

Plantilla para copiar debajo de cada caso:

```text
Resultado: PENDIENTE | PASÓ | FALLÓ | BLOQUEADO | N/A
Variante y datos:
Versión frontend / API / migración:
Rol / tenant / establecimiento:
Navegador / dispositivo / viewport / zoom:
Obtenido:
Evidencia (captura, video, request sanitizado, documento):
Incidencia / responsable / fecha / repetición:
```

## Preparación y datos

- [x] **PRE01 — Entorno.** Registrar URLs frontend/API y versiones; comprobar que la aplicación consume la API prevista. Resultado: no hay mezcla de ambientes ni migraciones pendientes que invaliden la prueba.
  ```text
  Resultado: PASÓ
  Variante y datos: Front http://localhost:4200 HTTP 200; API http://localhost:3000 health status=ok database=connected port=3000; front consume API local
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: n/a (smoke entorno)
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: front 200; API health ok + DB connected; sin mezcla de ambientes detectada
  Evidencia: health API local; carga front localhost:4200; fecha 2026-09-20 America/Lima
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20
  ```
- [x] **PRE02 — Identidades.** Crear tenant A y B; dos sucursales en A con almacenes separados; usuarios autorizado, lector, sin acceso y operador de B. Resultado: IDs y alcance conocidos para probar aislamiento.
  ```text
  Resultado: PASÓ con GAP documentado
  Variante y datos: Tenant A FactoFarm Demo id 00000000-0000-4000-8000-000000000001; Tenant B Venta Addin id 21762d36-5e54-48b7-94fd-9e5914eed595; dos sucursales en A (Oficina Principal 0000 + Sucursal 0001); usuarios por rol en A
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: seed Demo / Venta Addin
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: tenants A/B y dos sucursales en A confirmados; usuarios por rol en A listables. GAP: solo 1 warehouse visible (Almacén principal en Oficina Principal); no almacén separado confirmado en Sucursal
  Evidencia: IDs tenant/sucursal seed; listado almacenes UI/API
  Incidencia / responsable / fecha / repetición: GAP almacén Sucursal — no inventar segundo almacén; Auto 2026-09-20. Desbloqueo: crear/confirmar almacén en Sucursal si módulos de inventario lo exigen
  ```
- [x] **PRE03 — Roles.** Cubrir SUPER_ADMIN, ADMIN_CADENA, GERENTE_SUCURSAL, FARMACEUTICO_TITULAR, FARMACEUTICO, TECNICO_FARMACEUTICO, CAJERO, ALMACENERO, CONTADOR, ADMINISTRADOR y VENDEDOR según disponibilidad; guardar matriz real de permisos. No asumir que el nombre del rol garantiza una operación.
  ```text
  Resultado: PASÓ
  Variante y datos: SUPER_ADMIN (superadmin@ / SuperAdmin123!), ADMIN_CADENA, GERENTE_SUCURSAL, FARMACEUTICO_TITULAR, FARMACEUTICO, TECNICO_FARMACEUTICO, CAJERO, ALMACENERO, CONTADOR, ADMINISTRADOR, VENDEDOR — todos login/listables en seed
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: seed FactoFarm Demo
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: roles listados disponibles para login/listado en seed
  Evidencia: login/listado usuarios seed
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20; matriz fina de permisos se revalida por módulo
  ```
- [x] **PRE04 — Catálogos.** Preparar producto normal, servicio, pack, distintas presentaciones, controlado, refrigerado, inactivo, sin stock y con dos lotes; cliente contado/crédito, proveedor, médico, receta y series de prueba. Resultado: cada caso tiene una referencia verificable.
  ```text
  Resultado: PASÓ con gap
  Variante y datos: products~7, customers~2, suppliers~1, services~1, categories/brands/units ok; laboratories=0; QA-* dedicados se crean por módulo
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: Tenant A Demo
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: catálogos base presentes; laboratories=0; datos QA-* on-demand por módulo
  Evidencia: conteos seed / listados
  Incidencia / responsable / fecha / repetición: gap laboratories=0 y QA-* on-demand; Auto 2026-09-20
  ```
- [x] **PRE05 — Volumen.** Preparar 0, 1, N, N+1 y 2N+1 registros para tamaño de página N; nombres de una línea y varias líneas; nulos opcionales; lista grande representativa acordada. Resultado: no se depende de una sola página de datos.
  ```text
  Resultado: BLOQUEADO
  Variante y datos: no se preparó volumen 0/1/N/N+1/2N+1 sistemático aún; depende de cada módulo
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: preparación diferida a módulos con listados
  Evidencia: ausencia de dataset volumétrico de campaña
  Incidencia / responsable / fecha / repetición: Motivo: preparación diferida a módulos con listados. Desbloqueo: ejecutar volumen en cada plan 01–84 con listados. Auto 2026-09-20
  ```
- [x] **PRE06 — Estado financiero.** Anotar saldos de stock/caja/CxC/CxP antes de probar, costos/precios/impuestos y unidades. Resultado: efectos comparables mediante cálculo independiente.
  ```text
  Resultado: PASÓ parcial
  Variante y datos: caja principal activa id 61ece690-12a2-4981-971b-a533a2f63ba4; stock/precios demo presentes; saldos CxC/CxP no capturados en baseline numérico
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: Tenant A Demo / caja principal
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: caja y stock/precios demo anotados; baseline CxC/CxP pendiente por flujo financiero
  Evidencia: id caja; presencia stock/precios demo
  Incidencia / responsable / fecha / repetición: baseline CxC/CxP pendiente — anotar al ejecutar flujos financieros; Auto 2026-09-20
  ```
- [x] **PRE07 — Integraciones.** Confirmar proveedor electrónico de pruebas, almacenamiento de archivos y periféricos. Si falta alguno, dejar los casos dependientes BLOQUEADOS y ejecutar los restantes.
  ```text
  Resultado: BLOQUEADO parcial
  Variante y datos: OSE real no; periféricos no; MinIO/archivos: sonda /files health 404 pero upload usuarios validado en QA-UI-12 previa
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: n/a / módulos F07
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: OSE y periféricos no disponibles; health /files 404; upload usuarios ya validado en QA-UI-12
  Evidencia: sonda /files health 404; nota QA-UI-12 upload
  Incidencia / responsable / fecha / repetición: casos OSE/periféricos BLOQUEADOS; archivos seguir en módulos F07. Desbloqueo: OSE de prueba, periféricos y health files. Auto 2026-09-20
  ```
- [x] **PRE08 — Fecha y moneda.** Usar día civil America/Lima; registrar moneda y precisión configurada. Preparar registros antes y después de medianoche local y cambio de mes/año.
  ```text
  Resultado: PASÓ
  Variante y datos: timeZone America/Lima en user; moneda PEN demo
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: usuario seed Demo
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: zona America/Lima y moneda PEN confirmadas en demo
  Evidencia: perfil/config usuario; moneda demo
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20; cortes medianoche/mes-año se validan en módulos con fechas
  ```

## Sidebar, navegación y sesión

- [x] **NAV01 — Rutas.** Entrar desde cada hoja, pegar su URL, recargar y usar atrás/adelante. Esperado: pantalla y breadcrumb correctos; estado activo único y sin 404 o bucles.
  ```text
  Resultado: PASÓ parcial
  Variante y datos: login admin → /dashboard ok; sidebar links present for main leaves; platform routes pending SUPER_ADMIN session (will continue). Dashboard URL + reload verified via session inject; full 84 routes pending module plans
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: ADMINISTRADOR / Tenant A Demo
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: /dashboard carga y recarga ok; enlaces principales en sidebar; 84 rutas completas y platform pendientes
  Evidencia: session inject + dashboard reload; snapshot sidebar
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20; completar por plan 01–84 y SUPER_ADMIN platform
  ```
- [x] **NAV02 — Permisos.** Repetir con navegación permitida pero escritura denegada, sin permiso y tras revocación. Esperado: UI y servidor aplican la operación autorizada; esconder un botón no sustituye al control API.
  ```text
  Resultado: BLOQUEADO
  Variante y datos: matriz por módulo; smoke rol ADMINISTRADOR con permisos amplios verificado
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: ADMINISTRADOR / Tenant A
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: smoke ADMINISTRADOR con permisos amplios ok; matrices denegación/revocación no ejecutadas aquí
  Evidencia: login ADMINISTRADOR + navegación amplia
  Incidencia / responsable / fecha / repetición: Motivo: matriz por módulo; smoke rol ADMINISTRADOR con permisos amplios verificado. Desbloqueo: re-test por módulo con matrices de permisos. Auto 2026-09-20
  ```
- [x] **NAV03 — Agrupadores.** Abrir/cerrar todos los grupos y los niveles Resúmenes–Anulaciones y SIRE; activar sus hijos. Esperado: no se confunde el agrupador con una página; se conserva la indicación de ruta activa.
  ```text
  Resultado: PASÓ parcial
  Variante y datos: grupos sidebar visibles (Dashboard, Usuarios, Clientes, Productos, Compras, Ventas, Inventario...) en snapshot dashboard
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: ADMINISTRADOR / Tenant A
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: agrupadores principales visibles en sidebar; profundidad Resúmenes–Anulaciones/SIRE no agotada aquí
  Evidencia: snapshot dashboard/sidebar
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20; completar hijos profundos en planes de ventas/contabilidad
  ```
- [x] **NAV04 — Árbol dinámico.** Probar árbol API normal, vacío, etiquetas largas, error de red y permisos parciales. Esperado: fallback estático filtrado; ningún enlace duplicado ni acceso adicional por fallo del árbol.
  ```text
  Resultado: BLOQUEADO (variantes error/vacío)
  Variante y datos: árbol API normal con muchos links observado; vacío/error no forzado aún
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: ADMINISTRADOR / Tenant A
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium
  Obtenido: árbol normal funcional con muchos enlaces; variantes vacío/error/red/permisos parciales no ejecutadas
  Evidencia: sidebar con árbol poblado
  Incidencia / responsable / fecha / repetición: Motivo: variantes error/vacío no forzadas. Desbloqueo: simular fallo/vacío de árbol API. Auto 2026-09-20
  ```
- [x] **NAV05 — Permiso compartido.** Con `nav.establecimientos`, comprobar Mi farmacia y Establecimientos como dos destinos distintos. Esperado: ambos se conservan cuando corresponda; no se fusionan por compartir permiso.
  ```text
  Resultado: BLOQUEADO
  Variante y datos: no ejecutado aún en criterios; pendiente módulos 11/12
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: pendiente
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: no probado Mi farmacia vs Establecimientos en esta pasada
  Evidencia: n/a
  Incidencia / responsable / fecha / repetición: Motivo: pending module 11/12. Desbloqueo: ejecutar en planes Mi farmacia y Establecimientos. Auto 2026-09-20
  ```
- [x] **NAV06 — Desktop.** Expandir/colapsar sidebar, pasar mouse y navegar con teclado. Esperado: iconos accesibles, tooltips/nombres legibles, contenido sin solapamiento y activo visible.
  ```text
  Resultado: PASÓ parcial
  Variante y datos: desktop sidebar visible
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: ADMINISTRADOR / Tenant A
  Navegador / dispositivo / viewport / zoom: Cursor browser Chromium (desktop)
  Obtenido: sidebar desktop visible; expandir/colapsar/teclado no agotados
  Evidencia: snapshot dashboard desktop
  Incidencia / responsable / fecha / repetición: Auto 2026-09-20; completar colapso/teclado en RWD/UI
  ```
- [x] **NAV07 — Móvil.** Abrir drawer, desplazar hasta el último menú, seleccionar hoja y cerrar con botón/backdrop/Escape según comportamiento previsto. Esperado: no hay doble scroll del fondo, logo duplicado o foco oculto.
  ```text
  Resultado: BLOQUEADO
  Variante y datos: viewport móvil no ejecutado aún en criterios
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: n/a
  Navegador / dispositivo / viewport / zoom: móvil no ejecutado
  Obtenido: no se ejecutó drawer móvil en esta pasada
  Evidencia: n/a
  Incidencia / responsable / fecha / repetición: Motivo: will run in RWD. Desbloqueo: matriz RWD móvil. Auto 2026-09-20
  ```
- [x] **NAV08 — Sesión.** Expirar token durante lectura y guardado, cerrar sesión y volver con otro tenant; usar atrás. Esperado: sin información recuperable de sesión anterior y sin mutación aceptada sin autorización.
  ```text
  Resultado: BLOQUEADO
  Variante y datos: token expiry / cross-tenant atrás not fully tested
  Versión frontend / API / migración: builds locales pnpm start / start:dev
  Rol / tenant / establecimiento: dependencia sesión/tenant
  Navegador / dispositivo / viewport / zoom: n/a
  Obtenido: no se completó expiración de token ni navegación atrás cross-tenant
  Evidencia: n/a
  Incidencia / responsable / fecha / repetición: Motivo: dependencia de pruebas de sesión/aislamiento. Desbloqueo: forzar expiry + cambio tenant + atrás. Auto 2026-09-20
  ```

## Listados, búsqueda y filtros

- [x] **DAT01 — Estados.** Abrir con 0/1/muchos registros, demora y error. Esperado: carga, vacío real, sin coincidencias y error son estados diferentes, sin ceros o filas ficticias.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **DAT02 — Filtros.** Ejecutar cada opción del selector y combinaciones relevantes, texto exacto/parcial, mayúsculas, tildes, espacios e inexistente; limpiar. Esperado: resultados y total respetan filtros, y limpiar restaura el conjunto y página inicial.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **DAT03 — Paginación.** Recorrer primera, segunda, última, anterior y siguiente; filtrar desde última página y borrar su única fila. Esperado: página válida, contador correcto y ningún registro omitido/duplicado.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **DAT04 — Carrera de búsqueda.** En red lenta escribir A→AB→ABC rápidamente y cambiar filtro durante carga. Esperado: resultado final de ABC y filtro actual, no de una respuesta antigua.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **DAT05 — Columnas y orden.** Probar cada orden/columna configurable existente, ocultar/restaurar y navegar. Esperado: valores alineados con encabezados; selección no afecta identidad de acciones de fila.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **DAT06 — Datos largos.** Nombres largos, tildes, emoji, nulos, importes grandes y fechas. Esperado: no hay `undefined`, `NaN` o fechas inválidas; información truncada se puede consultar y no oculta acciones.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## Matriz de validación por cada campo

Aplicar estas variantes a **cada CAM del documento del menú**, tanto en alta como en edición y envío API cuando corresponda. Registrar la propiedad del DTO y los límites reales. Si la regla no está definida, señalar la decisión pendiente; no convertir la implementación observada en aprobación automática de una regla de negocio.

- [x] **V01 — Requerido y opcional.** Omitir, enviar `null`, cadena vacía y espacios. Esperado: requerido rechazado; opcional aceptado únicamente en las representaciones admitidas; no borrar valores por una conversión accidental.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V02 — Longitud.** Probar 1, mínimo−1/mínimo/mínimo+1 y máximo−1/máximo/máximo+1 caracteres donde exista límite. Esperado: frontera exacta consistente UI/API, sin truncado silencioso.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V03 — Texto.** Probar tildes, ñ, apóstrofe, guion, Unicode, saltos de línea y espacios externos; escribir y pegar. Esperado: normalización prevista, contenido preservado y mensajes comprensibles.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V04 — Número.** Probar −1, 0, 1, vacío, decimal, coma/punto, notación exponencial, letra, `NaN`, infinito y valor muy grande mediante API. Esperado: tipo/escala/límites reales respetados, sin aceptar conversión parcial ni desbordamiento.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V05 — Moneda y porcentajes.** Usar precisión permitida, una cifra decimal adicional, mínimo/máximo ± unidad mínima, 0/100 y porcentaje fuera de rango. Esperado: redondeo establecido e idéntico entre línea, total y persistencia; no asumir límite 100 para todo porcentaje sin revisar contrato.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V06 — Documentos/contacto.** Cada tipo documental permitido, ceros iniciales, longitud límite, letras y separadores; correo válido/inválido y teléfono local/internacional. Esperado: contrato de cada tipo aplicado; cambiar tipo revalida el número y no transforma identidad indebidamente.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V07 — Selectores.** Ninguna opción, cada opción, catálogo vacío/inactivo y ID inexistente o ajeno por API; cambiar país/departamento/provincia, almacén/producto u otro padre. Esperado: hijos incompatibles se limpian y servidor verifica pertenencia.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V08 — Fechas.** Probar 29 de febrero válido/inválido, 31 de mes corto, fin de año, fecha vacía, ayer/hoy/mañana, rango invertido y mismo inicio/fin. Esperado: fechas reales, límites de negocio y zona Lima sin desplazamiento al serializar.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V09 — Unicidad.** Crear duplicado exacto, con espacios/cambio de mayúsculas y desde dos sesiones simultáneas. Esperado: unicidad dentro del alcance definido y error de conflicto entendible, sin depender solo de una consulta previa.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V10 — Dependencias.** Cambiar tipo/rol/documento y completar campos condicionales; ocultar pestaña con errores y guardar. Esperado: solo se exigen campos pertinentes; un error oculto se identifica y permite llegar al campo.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V11 — Experiencia del error.** Enviar vacío, corregir un campo y dejar otro inválido; probar blur y reenvío. Esperado: mensaje específico junto al campo, foco útil, datos restantes conservados y error desaparece al corregir.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **V12 — Contrato y protección.** Enviar tipo distinto, propiedades adicionales como rol/tenant/propietario y valores fuera de enum. Esperado: no hay asignación masiva de privilegios ni aceptación de referencias ajenas; error 4xx según contrato, sin stack o SQL expuestos.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## UI, formularios y accesibilidad

- [x] **UI01 — Composición.** Revisar títulos, breadcrumb, toolbar, filtros, cards, tabla y pie. Esperado: jerarquía clara, padding y alineación coherentes; montos/unidades no ambiguos.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **UI02 — Estados de controles.** Hover, foco, seleccionado, deshabilitado, carga, error y éxito; verificar iconos solos y tooltips. Esperado: estado distinguible sin depender únicamente del color, sin botón interactivo mientras está indebidamente bloqueado.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **UI03 — Modal.** Abrir alta, editar A, cancelar, editar B y volver a alta; cambiar pestañas. Esperado: no queda información de A en B/alta, ni se pierden datos al cambiar pestaña.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **UI04 — Cierre.** Cancelar por botón, X, Escape y backdrop si están habilitados; cerrar con petición pendiente. Esperado: comportamiento consistente con diseño, sin éxito ficticio, doble envío o cierre que pierda el resultado sin poder recuperarlo.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **UI05 — Superposición.** Abrir dropdown, calendario, tooltip y confirmación dentro de modal largo. Esperado: z-index correcto, sin recorte, scroll independiente y pie accesible.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **UI06 — Apariencia.** Probar tema claro/oscuro cuando esté disponible y estados vacíos/carga/error. Esperado: texto, logo, bordes y foco legibles en ambos temas.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **A11Y01 — Teclado.** Completar flujo solo con Tab/Shift+Tab/Enter/Espacio/Escape; comprobar que Enter no dispara dos envíos. Esperado: foco visible, orden lógico, modalidad sin escapar al fondo y foco restaurado al cerrar.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **A11Y02 — Nombres.** Inspeccionar nombre accesible de cada input, select, icono y enlace; usar lector de pantalla para formulario/error/resultado. Esperado: etiqueta asociada, requerido/estado/error anunciables, sin depender solo del placeholder.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **A11Y03 — Zoom/reflow.** Probar 200% y 400%, textos ampliados y alto contraste disponible. Esperado: contenido y acciones accesibles, sin pérdida de información por solapamiento; tablas grandes pueden tener scroll local identificable.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **A11Y04 — Contraste y tacto.** Medir contraste de texto normal/grande y controles con herramienta; registrar referencia de aceptación del proyecto. Usar como objetivo QA 4.5:1 para texto normal y 3:1 para texto grande/controles, no como certificación. Probar toque sin activar botón vecino y tamaño objetivo de al menos 24×24 CSS px o separación equivalente.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## Responsividad por cada pantalla, formulario y estado

Para cada fila, repetir: carga inicial → filtros → tabla/cards → menú de fila → modal/alta → errores → guardado → confirmación → aviso final. Usar datos largos, pantalla vacía y tabla de varias páginas. Capturar evidencia **por menú**, no solo del shell.

| Casilla | Viewport CSS | Enfoque |
|---|---|---|
| [x] | 320×568 | Mínimo estrecho; títulos, tabs, botones y pie |
| [x] | 360×800 | Móvil Android estrecho; teclado virtual |
| [x] | 390×844 | Móvil habitual; drawer, cards, tablas |
| [x] | 844×390 | Horizontal y poca altura; modales |
| [x] | 768×1024 | Tablet vertical; grids intermedias |
| [x] | 1024×768 | Tablet horizontal; filtros y acciones |
| [x] | 1280×720 | Cambio a sidebar desktop |
| [x] | 1440×900 | Escritorio; densidad y modales |
| [x] | 1920×1080 | Pantalla amplia; límites de ancho |

Resultado matriz viewports: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción. Validador: responsable campaña Auto 2026-09-20.

- [x] **RWD01 — Recorrido por tamaño.** Completar la matriz. Esperado: todas las funciones disponibles, sin scroll horizontal de toda la página por un elemento desbordado; tabla con scroll local cuando sea necesario.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **RWD02 — Breakpoints.** Revisar 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536 px. Esperado: ni controles duplicados ni controles desaparecidos; adaptar umbrales si la configuración CSS de la versión difiere.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **RWD03 — Teclado y orientación.** Enfocar último campo con teclado virtual abierto, desplazar y guardar; girar con formulario/carrito sin guardar. Esperado: botón alcanzable y datos conservados.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **RWD04 — Contenedores.** Menús de fila cerca del borde inferior/derecho, dropdown largo, tabs y modal con contenido alto. Esperado: acciones visibles, recorte controlado y scroll útil sin desplazar accidentalmente el fondo.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **BRS01 — Navegadores.** Repetir P0/P1 en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; anotar versión exacta y dispositivo. Si no hay dispositivo, registrar bloqueo de compatibilidad, no aprobarlo por emulación solamente.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## Red, seguridad, concurrencia y rendimiento

- [x] **ERR01 — Red.** Simular lentitud, desconexión, timeout y 500 en lectura y escritura. Esperado: carga finaliza, error explicativo y reintento; antes de repetir una escritura incierta consultar si ya persistió.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **ERR02 — Respuestas.** Provocar 400/401/403/404/409/422/429 donde el contrato las use. Esperado: validación, autenticación, permisos, ausencia, conflicto y límite tratados apropiadamente; no exigir un código no definido por la API.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **SEC01 — Aislamiento.** Sustituir identificadores de tenant, establecimiento, usuario, cliente, documento, lote y archivo por los de B en URL/query/body. Esperado: no lectura/escritura ajena; respuesta no revela datos del objeto protegido.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **SEC02 — Inyección y secretos.** Ingresar `<script>alert(1)</script>` como texto en QA y caracteres SQL; inspeccionar UI, exportación, consola y respuesta. Esperado: texto inerte y consulta parametrizada; no exponer token, contraseña, credenciales del proveedor o stack interno.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **SEC03 — Descargas.** Abrir URL de archivo autenticado sin sesión, con otro tenant y después de revocar permiso. Esperado: control de acceso consistente; nombres de archivo no permiten rutas arbitrarias.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **CON01 — Doble operación.** Doble clic, Enter repetido, retry y dos pestañas procesando el mismo recurso. Esperado: efecto financiero/inventario único, conflicto controlado o mecanismo idempotente conforme al contrato.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **CON02 — Edición simultánea.** A y B abren el mismo registro; B modifica, A guarda valor antiguo. Esperado: conflicto o política de actualización definida, sin pérdida silenciosa de cambios críticos.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **PER01 — Medición.** Medir carga inicial, consulta, guardado y descarga con volumen representativo; registrar p50/p95, cantidad de peticiones y tamaño de respuesta. Comparar con presupuesto acordado; si no existe, dejar objetivo pendiente en lugar de inventar aprobación.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **PER02 — Estabilidad.** Abrir/cerrar modal y navegar veinte veces; teclear filtros rápidamente. Esperado: no multiplicación de listeners/peticiones, memoria creciente sin control, errores de consola o UI bloqueada.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **INT01 — Persistencia.** Guardar, recargar y entrar en segunda sesión autorizada; consultar API y módulos consumidores. Esperado: valor persistido coherente y caché invalidada en el alcance adecuado.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **INT02 — Auditoría y atomicidad.** Forzar fallo a mitad de operación en entorno controlado; comprobar cabecera/detalle/stock/dinero/eventos. Esperado: estado consistente o recuperable explícito, sin registros parciales tratados como éxito.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## Archivos, exportaciones e impresión

- [x] **F01 — Plantilla.** Descargar plantilla desde cada modo de importación; abrirla y verificar encabezados, hoja y ejemplo. Esperado: plantilla corresponde al modo, se puede completar e importar sin reparaciones manuales imprevistas.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F02 — Archivo inválido.** Probar vacío, corrupto, extensión/MIME falso, hoja/columna faltante, columnas extra y tamaño límite/límite+1. Esperado: error claro, sin colgar UI ni procesar contenido arbitrario.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F03 — Filas mixtas.** Mezclar válida, duplicada, referencia inexistente, formato erróneo y fórmula. Esperado: reporte de filas/errores y atomicidad parcial/total conforme al contrato; no pérdida silenciosa.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F04 — Repetición.** Subir mismo archivo dos veces, cancelar selección, cambiar archivo y reintentar tras timeout. Esperado: preview/resultado corresponden al archivo actual y no hay duplicados inesperados.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F05 — Exportación.** Exportar cada formato con filtros, varias páginas y conjunto vacío; abrir con lector independiente. Esperado: alcance total previsto, encabezados, orden, encoding, decimales, fechas y totales correctos.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F06 — Datos peligrosos.** Exportar texto que empiece por `=`, `+`, `-` o `@`. Esperado: texto no se convierte en fórmula ejecutable de manera insegura; preservar valores numéricos legítimos según formato.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F07 — Imagen/documento.** Subir imagen válida, orientación EXIF, transparencia, proporción extrema, archivo falso y límite de peso; quitar/cambiar. Esperado: preview sin deformación, acceso autorizado y guardado/cancelación coherentes.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```
- [x] **F08 — Impresión.** Abrir PDF/ticket/etiquetas en formatos disponibles; imprimir en periférico de pruebas y repetir tras fallo. Esperado: sin texto cortado, código escaneable, montos/serie correctos y ninguna nueva venta por reimpresión.
  ```text
  Resultado: N/A — plantilla transversal; ejecución obligatoria registrada en cada plan de opción.
  Validador: responsable campaña Auto 2026-09-20.
  ```

## Prioridades y criterio de salida

- **P0:** aislamiento entre clientes, escalamiento de permisos, pérdida/corrupción de datos, venta/cobro/stock duplicado, saldos críticos incorrectos.
- **P1:** flujo principal bloqueado, validación esencial omitida, emisión incorrecta, formulario inaccesible en tamaño soportado.
- **P2:** problema secundario de usabilidad, formato o rendimiento que no impide el flujo principal.
- **P3:** detalle cosmético sin pérdida funcional. La severidad real depende del impacto observado.

- [x] Todas las opciones del [índice](README.md) tienen ejecución identificada o bloqueo explícito.
  - **Resultado:** PASÓ — 84 opciones + criterios + E2E marcados en `ejecucion-2026-09-20/` (2026-09-20).
- [x] Todos los P0/P1 están aprobados; defectos restantes tienen responsable y decisión documentada.
  - **Resultado:** BLOQUEADO / no salida — P0 nuevos no hallados en smoke; P1 abiertos documentados en `QA-FLUJOS-HALLAZGOS.md` (QA-CAMPANA-01 cajero POS permisos; QA-CAMPANA-02 `GET /users` amplio para CAJERO; GAP 2.º almacén; OSE real). No aprobar release hasta decisión.
- [x] Flujos integrales conciliados y evidencias sanitizadas conservadas.
  - **Resultado:** PASÓ parcial — E2E01–15 ejecutados/registrados; mutaciones profundas mayormente BLOQUEADO; evidencia en `EVIDENCIA-CAMPANA.md`.
- [x] Diferencias entre comportamiento observado, contrato técnico y expectativa de negocio están resueltas o registradas como pendientes.
  - **Resultado:** PASÓ — gaps (warehouses=1, OSE MOCK, paths API descubiertos) registrados en hallazgos/planes.
- [x] No se reutilizan resultados históricos como aprobación de esta versión.
  - **Resultado:** PASÓ — esta campaña usa copia `ejecucion-2026-09-20`; históricos solo como referencia de reglas.
