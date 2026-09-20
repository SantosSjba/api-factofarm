# Criterios comunes de ejecución

Fecha de referencia: 2026-09-20. Este documento complementa **cada uno de los 84 planes por opción del sidebar**. Las casillas del plan de cada opción son independientes: aprobar Usuarios no aprueba automáticamente Productos. Son pruebas propuestas, no resultados de una ejecución ni certificación normativa.

## Cómo marcar y registrar resultados

- [ ] Preparar una copia de los planes para la versión que se va a evaluar; conservar el original como plantilla.
- [ ] Marcar `[x]` cuando se haya ejecutado el caso y registrar PASÓ, FALLÓ, BLOQUEADO o N/A. Una casilla marcada no significa por sí sola que pasó.
- [ ] Registrar por variante: ID del caso, datos empleados, rol, tenant, establecimiento, navegador/versión, viewport, pasos, esperado, obtenido, evidencia e incidencia.
- [ ] Si una función no existe en la versión desplegada, identificar si es una diferencia respecto al código, una condición de permisos/plan o una función no implementada. No registrar PASÓ.
- [ ] Para N/A, explicar la razón y quién validó la exclusión. Para BLOQUEADO, indicar dependencia y condición de desbloqueo.
- [ ] En una corrección, conservar el fallo original y añadir fecha, versión y resultado de la repetición.

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

- [ ] **PRE01 — Entorno.** Registrar URLs frontend/API y versiones; comprobar que la aplicación consume la API prevista. Resultado: no hay mezcla de ambientes ni migraciones pendientes que invaliden la prueba.
- [ ] **PRE02 — Identidades.** Crear tenant A y B; dos sucursales en A con almacenes separados; usuarios autorizado, lector, sin acceso y operador de B. Resultado: IDs y alcance conocidos para probar aislamiento.
- [ ] **PRE03 — Roles.** Cubrir SUPER_ADMIN, ADMIN_CADENA, GERENTE_SUCURSAL, FARMACEUTICO_TITULAR, FARMACEUTICO, TECNICO_FARMACEUTICO, CAJERO, ALMACENERO, CONTADOR, ADMINISTRADOR y VENDEDOR según disponibilidad; guardar matriz real de permisos. No asumir que el nombre del rol garantiza una operación.
- [ ] **PRE04 — Catálogos.** Preparar producto normal, servicio, pack, distintas presentaciones, controlado, refrigerado, inactivo, sin stock y con dos lotes; cliente contado/crédito, proveedor, médico, receta y series de prueba. Resultado: cada caso tiene una referencia verificable.
- [ ] **PRE05 — Volumen.** Preparar 0, 1, N, N+1 y 2N+1 registros para tamaño de página N; nombres de una línea y varias líneas; nulos opcionales; lista grande representativa acordada. Resultado: no se depende de una sola página de datos.
- [ ] **PRE06 — Estado financiero.** Anotar saldos de stock/caja/CxC/CxP antes de probar, costos/precios/impuestos y unidades. Resultado: efectos comparables mediante cálculo independiente.
- [ ] **PRE07 — Integraciones.** Confirmar proveedor electrónico de pruebas, almacenamiento de archivos y periféricos. Si falta alguno, dejar los casos dependientes BLOQUEADOS y ejecutar los restantes.
- [ ] **PRE08 — Fecha y moneda.** Usar día civil America/Lima; registrar moneda y precisión configurada. Preparar registros antes y después de medianoche local y cambio de mes/año.

## Sidebar, navegación y sesión

- [ ] **NAV01 — Rutas.** Entrar desde cada hoja, pegar su URL, recargar y usar atrás/adelante. Esperado: pantalla y breadcrumb correctos; estado activo único y sin 404 o bucles.
- [ ] **NAV02 — Permisos.** Repetir con navegación permitida pero escritura denegada, sin permiso y tras revocación. Esperado: UI y servidor aplican la operación autorizada; esconder un botón no sustituye al control API.
- [ ] **NAV03 — Agrupadores.** Abrir/cerrar todos los grupos y los niveles Resúmenes–Anulaciones y SIRE; activar sus hijos. Esperado: no se confunde el agrupador con una página; se conserva la indicación de ruta activa.
- [ ] **NAV04 — Árbol dinámico.** Probar árbol API normal, vacío, etiquetas largas, error de red y permisos parciales. Esperado: fallback estático filtrado; ningún enlace duplicado ni acceso adicional por fallo del árbol.
- [ ] **NAV05 — Permiso compartido.** Con `nav.establecimientos`, comprobar Mi farmacia y Establecimientos como dos destinos distintos. Esperado: ambos se conservan cuando corresponda; no se fusionan por compartir permiso.
- [ ] **NAV06 — Desktop.** Expandir/colapsar sidebar, pasar mouse y navegar con teclado. Esperado: iconos accesibles, tooltips/nombres legibles, contenido sin solapamiento y activo visible.
- [ ] **NAV07 — Móvil.** Abrir drawer, desplazar hasta el último menú, seleccionar hoja y cerrar con botón/backdrop/Escape según comportamiento previsto. Esperado: no hay doble scroll del fondo, logo duplicado o foco oculto.
- [ ] **NAV08 — Sesión.** Expirar token durante lectura y guardado, cerrar sesión y volver con otro tenant; usar atrás. Esperado: sin información recuperable de sesión anterior y sin mutación aceptada sin autorización.

## Listados, búsqueda y filtros

- [ ] **DAT01 — Estados.** Abrir con 0/1/muchos registros, demora y error. Esperado: carga, vacío real, sin coincidencias y error son estados diferentes, sin ceros o filas ficticias.
- [ ] **DAT02 — Filtros.** Ejecutar cada opción del selector y combinaciones relevantes, texto exacto/parcial, mayúsculas, tildes, espacios e inexistente; limpiar. Esperado: resultados y total respetan filtros, y limpiar restaura el conjunto y página inicial.
- [ ] **DAT03 — Paginación.** Recorrer primera, segunda, última, anterior y siguiente; filtrar desde última página y borrar su única fila. Esperado: página válida, contador correcto y ningún registro omitido/duplicado.
- [ ] **DAT04 — Carrera de búsqueda.** En red lenta escribir A→AB→ABC rápidamente y cambiar filtro durante carga. Esperado: resultado final de ABC y filtro actual, no de una respuesta antigua.
- [ ] **DAT05 — Columnas y orden.** Probar cada orden/columna configurable existente, ocultar/restaurar y navegar. Esperado: valores alineados con encabezados; selección no afecta identidad de acciones de fila.
- [ ] **DAT06 — Datos largos.** Nombres largos, tildes, emoji, nulos, importes grandes y fechas. Esperado: no hay `undefined`, `NaN` o fechas inválidas; información truncada se puede consultar y no oculta acciones.

## Matriz de validación por cada campo

Aplicar estas variantes a **cada CAM del documento del menú**, tanto en alta como en edición y envío API cuando corresponda. Registrar la propiedad del DTO y los límites reales. Si la regla no está definida, señalar la decisión pendiente; no convertir la implementación observada en aprobación automática de una regla de negocio.

- [ ] **V01 — Requerido y opcional.** Omitir, enviar `null`, cadena vacía y espacios. Esperado: requerido rechazado; opcional aceptado únicamente en las representaciones admitidas; no borrar valores por una conversión accidental.
- [ ] **V02 — Longitud.** Probar 1, mínimo−1/mínimo/mínimo+1 y máximo−1/máximo/máximo+1 caracteres donde exista límite. Esperado: frontera exacta consistente UI/API, sin truncado silencioso.
- [ ] **V03 — Texto.** Probar tildes, ñ, apóstrofe, guion, Unicode, saltos de línea y espacios externos; escribir y pegar. Esperado: normalización prevista, contenido preservado y mensajes comprensibles.
- [ ] **V04 — Número.** Probar −1, 0, 1, vacío, decimal, coma/punto, notación exponencial, letra, `NaN`, infinito y valor muy grande mediante API. Esperado: tipo/escala/límites reales respetados, sin aceptar conversión parcial ni desbordamiento.
- [ ] **V05 — Moneda y porcentajes.** Usar precisión permitida, una cifra decimal adicional, mínimo/máximo ± unidad mínima, 0/100 y porcentaje fuera de rango. Esperado: redondeo establecido e idéntico entre línea, total y persistencia; no asumir límite 100 para todo porcentaje sin revisar contrato.
- [ ] **V06 — Documentos/contacto.** Cada tipo documental permitido, ceros iniciales, longitud límite, letras y separadores; correo válido/inválido y teléfono local/internacional. Esperado: contrato de cada tipo aplicado; cambiar tipo revalida el número y no transforma identidad indebidamente.
- [ ] **V07 — Selectores.** Ninguna opción, cada opción, catálogo vacío/inactivo y ID inexistente o ajeno por API; cambiar país/departamento/provincia, almacén/producto u otro padre. Esperado: hijos incompatibles se limpian y servidor verifica pertenencia.
- [ ] **V08 — Fechas.** Probar 29 de febrero válido/inválido, 31 de mes corto, fin de año, fecha vacía, ayer/hoy/mañana, rango invertido y mismo inicio/fin. Esperado: fechas reales, límites de negocio y zona Lima sin desplazamiento al serializar.
- [ ] **V09 — Unicidad.** Crear duplicado exacto, con espacios/cambio de mayúsculas y desde dos sesiones simultáneas. Esperado: unicidad dentro del alcance definido y error de conflicto entendible, sin depender solo de una consulta previa.
- [ ] **V10 — Dependencias.** Cambiar tipo/rol/documento y completar campos condicionales; ocultar pestaña con errores y guardar. Esperado: solo se exigen campos pertinentes; un error oculto se identifica y permite llegar al campo.
- [ ] **V11 — Experiencia del error.** Enviar vacío, corregir un campo y dejar otro inválido; probar blur y reenvío. Esperado: mensaje específico junto al campo, foco útil, datos restantes conservados y error desaparece al corregir.
- [ ] **V12 — Contrato y protección.** Enviar tipo distinto, propiedades adicionales como rol/tenant/propietario y valores fuera de enum. Esperado: no hay asignación masiva de privilegios ni aceptación de referencias ajenas; error 4xx según contrato, sin stack o SQL expuestos.

## UI, formularios y accesibilidad

- [ ] **UI01 — Composición.** Revisar títulos, breadcrumb, toolbar, filtros, cards, tabla y pie. Esperado: jerarquía clara, padding y alineación coherentes; montos/unidades no ambiguos.
- [ ] **UI02 — Estados de controles.** Hover, foco, seleccionado, deshabilitado, carga, error y éxito; verificar iconos solos y tooltips. Esperado: estado distinguible sin depender únicamente del color, sin botón interactivo mientras está indebidamente bloqueado.
- [ ] **UI03 — Modal.** Abrir alta, editar A, cancelar, editar B y volver a alta; cambiar pestañas. Esperado: no queda información de A en B/alta, ni se pierden datos al cambiar pestaña.
- [ ] **UI04 — Cierre.** Cancelar por botón, X, Escape y backdrop si están habilitados; cerrar con petición pendiente. Esperado: comportamiento consistente con diseño, sin éxito ficticio, doble envío o cierre que pierda el resultado sin poder recuperarlo.
- [ ] **UI05 — Superposición.** Abrir dropdown, calendario, tooltip y confirmación dentro de modal largo. Esperado: z-index correcto, sin recorte, scroll independiente y pie accesible.
- [ ] **UI06 — Apariencia.** Probar tema claro/oscuro cuando esté disponible y estados vacíos/carga/error. Esperado: texto, logo, bordes y foco legibles en ambos temas.
- [ ] **A11Y01 — Teclado.** Completar flujo solo con Tab/Shift+Tab/Enter/Espacio/Escape; comprobar que Enter no dispara dos envíos. Esperado: foco visible, orden lógico, modalidad sin escapar al fondo y foco restaurado al cerrar.
- [ ] **A11Y02 — Nombres.** Inspeccionar nombre accesible de cada input, select, icono y enlace; usar lector de pantalla para formulario/error/resultado. Esperado: etiqueta asociada, requerido/estado/error anunciables, sin depender solo del placeholder.
- [ ] **A11Y03 — Zoom/reflow.** Probar 200% y 400%, textos ampliados y alto contraste disponible. Esperado: contenido y acciones accesibles, sin pérdida de información por solapamiento; tablas grandes pueden tener scroll local identificable.
- [ ] **A11Y04 — Contraste y tacto.** Medir contraste de texto normal/grande y controles con herramienta; registrar referencia de aceptación del proyecto. Usar como objetivo QA 4.5:1 para texto normal y 3:1 para texto grande/controles, no como certificación. Probar toque sin activar botón vecino y tamaño objetivo de al menos 24×24 CSS px o separación equivalente.

## Responsividad por cada pantalla, formulario y estado

Para cada fila, repetir: carga inicial → filtros → tabla/cards → menú de fila → modal/alta → errores → guardado → confirmación → aviso final. Usar datos largos, pantalla vacía y tabla de varias páginas. Capturar evidencia **por menú**, no solo del shell.

| Casilla | Viewport CSS | Enfoque |
|---|---|---|
| [ ] | 320×568 | Mínimo estrecho; títulos, tabs, botones y pie |
| [ ] | 360×800 | Móvil Android estrecho; teclado virtual |
| [ ] | 390×844 | Móvil habitual; drawer, cards, tablas |
| [ ] | 844×390 | Horizontal y poca altura; modales |
| [ ] | 768×1024 | Tablet vertical; grids intermedias |
| [ ] | 1024×768 | Tablet horizontal; filtros y acciones |
| [ ] | 1280×720 | Cambio a sidebar desktop |
| [ ] | 1440×900 | Escritorio; densidad y modales |
| [ ] | 1920×1080 | Pantalla amplia; límites de ancho |

- [ ] **RWD01 — Recorrido por tamaño.** Completar la matriz. Esperado: todas las funciones disponibles, sin scroll horizontal de toda la página por un elemento desbordado; tabla con scroll local cuando sea necesario.
- [ ] **RWD02 — Breakpoints.** Revisar 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536 px. Esperado: ni controles duplicados ni controles desaparecidos; adaptar umbrales si la configuración CSS de la versión difiere.
- [ ] **RWD03 — Teclado y orientación.** Enfocar último campo con teclado virtual abierto, desplazar y guardar; girar con formulario/carrito sin guardar. Esperado: botón alcanzable y datos conservados.
- [ ] **RWD04 — Contenedores.** Menús de fila cerca del borde inferior/derecho, dropdown largo, tabs y modal con contenido alto. Esperado: acciones visibles, recorte controlado y scroll útil sin desplazar accidentalmente el fondo.
- [ ] **BRS01 — Navegadores.** Repetir P0/P1 en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; anotar versión exacta y dispositivo. Si no hay dispositivo, registrar bloqueo de compatibilidad, no aprobarlo por emulación solamente.

## Red, seguridad, concurrencia y rendimiento

- [ ] **ERR01 — Red.** Simular lentitud, desconexión, timeout y 500 en lectura y escritura. Esperado: carga finaliza, error explicativo y reintento; antes de repetir una escritura incierta consultar si ya persistió.
- [ ] **ERR02 — Respuestas.** Provocar 400/401/403/404/409/422/429 donde el contrato las use. Esperado: validación, autenticación, permisos, ausencia, conflicto y límite tratados apropiadamente; no exigir un código no definido por la API.
- [ ] **SEC01 — Aislamiento.** Sustituir identificadores de tenant, establecimiento, usuario, cliente, documento, lote y archivo por los de B en URL/query/body. Esperado: no lectura/escritura ajena; respuesta no revela datos del objeto protegido.
- [ ] **SEC02 — Inyección y secretos.** Ingresar `<script>alert(1)</script>` como texto en QA y caracteres SQL; inspeccionar UI, exportación, consola y respuesta. Esperado: texto inerte y consulta parametrizada; no exponer token, contraseña, credenciales del proveedor o stack interno.
- [ ] **SEC03 — Descargas.** Abrir URL de archivo autenticado sin sesión, con otro tenant y después de revocar permiso. Esperado: control de acceso consistente; nombres de archivo no permiten rutas arbitrarias.
- [ ] **CON01 — Doble operación.** Doble clic, Enter repetido, retry y dos pestañas procesando el mismo recurso. Esperado: efecto financiero/inventario único, conflicto controlado o mecanismo idempotente conforme al contrato.
- [ ] **CON02 — Edición simultánea.** A y B abren el mismo registro; B modifica, A guarda valor antiguo. Esperado: conflicto o política de actualización definida, sin pérdida silenciosa de cambios críticos.
- [ ] **PER01 — Medición.** Medir carga inicial, consulta, guardado y descarga con volumen representativo; registrar p50/p95, cantidad de peticiones y tamaño de respuesta. Comparar con presupuesto acordado; si no existe, dejar objetivo pendiente en lugar de inventar aprobación.
- [ ] **PER02 — Estabilidad.** Abrir/cerrar modal y navegar veinte veces; teclear filtros rápidamente. Esperado: no multiplicación de listeners/peticiones, memoria creciente sin control, errores de consola o UI bloqueada.
- [ ] **INT01 — Persistencia.** Guardar, recargar y entrar en segunda sesión autorizada; consultar API y módulos consumidores. Esperado: valor persistido coherente y caché invalidada en el alcance adecuado.
- [ ] **INT02 — Auditoría y atomicidad.** Forzar fallo a mitad de operación en entorno controlado; comprobar cabecera/detalle/stock/dinero/eventos. Esperado: estado consistente o recuperable explícito, sin registros parciales tratados como éxito.

## Archivos, exportaciones e impresión

- [ ] **F01 — Plantilla.** Descargar plantilla desde cada modo de importación; abrirla y verificar encabezados, hoja y ejemplo. Esperado: plantilla corresponde al modo, se puede completar e importar sin reparaciones manuales imprevistas.
- [ ] **F02 — Archivo inválido.** Probar vacío, corrupto, extensión/MIME falso, hoja/columna faltante, columnas extra y tamaño límite/límite+1. Esperado: error claro, sin colgar UI ni procesar contenido arbitrario.
- [ ] **F03 — Filas mixtas.** Mezclar válida, duplicada, referencia inexistente, formato erróneo y fórmula. Esperado: reporte de filas/errores y atomicidad parcial/total conforme al contrato; no pérdida silenciosa.
- [ ] **F04 — Repetición.** Subir mismo archivo dos veces, cancelar selección, cambiar archivo y reintentar tras timeout. Esperado: preview/resultado corresponden al archivo actual y no hay duplicados inesperados.
- [ ] **F05 — Exportación.** Exportar cada formato con filtros, varias páginas y conjunto vacío; abrir con lector independiente. Esperado: alcance total previsto, encabezados, orden, encoding, decimales, fechas y totales correctos.
- [ ] **F06 — Datos peligrosos.** Exportar texto que empiece por `=`, `+`, `-` o `@`. Esperado: texto no se convierte en fórmula ejecutable de manera insegura; preservar valores numéricos legítimos según formato.
- [ ] **F07 — Imagen/documento.** Subir imagen válida, orientación EXIF, transparencia, proporción extrema, archivo falso y límite de peso; quitar/cambiar. Esperado: preview sin deformación, acceso autorizado y guardado/cancelación coherentes.
- [ ] **F08 — Impresión.** Abrir PDF/ticket/etiquetas en formatos disponibles; imprimir en periférico de pruebas y repetir tras fallo. Esperado: sin texto cortado, código escaneable, montos/serie correctos y ninguna nueva venta por reimpresión.

## Prioridades y criterio de salida

- **P0:** aislamiento entre clientes, escalamiento de permisos, pérdida/corrupción de datos, venta/cobro/stock duplicado, saldos críticos incorrectos.
- **P1:** flujo principal bloqueado, validación esencial omitida, emisión incorrecta, formulario inaccesible en tamaño soportado.
- **P2:** problema secundario de usabilidad, formato o rendimiento que no impide el flujo principal.
- **P3:** detalle cosmético sin pérdida funcional. La severidad real depende del impacto observado.

- [ ] Todas las opciones del [índice](README.md) tienen ejecución identificada o bloqueo explícito.
- [ ] Todos los P0/P1 están aprobados; defectos restantes tienen responsable y decisión documentada.
- [ ] Flujos integrales conciliados y evidencias sanitizadas conservadas.
- [ ] Diferencias entre comportamiento observado, contrato técnico y expectativa de negocio están resueltas o registradas como pendientes.
- [ ] No se reutilizan resultados históricos como aprobación de esta versión.
