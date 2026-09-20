# Plan de pruebas: Libro de reclamaciones

- **Menú:** Plataforma → Libro de reclamaciones.
- **Ruta:** `/platform/reclamaciones`.
- **Permiso de navegación:** `nav.platform_reclamaciones`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-platform-reclamaciones-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: la pantalla usa controles inline o componentes con etiquetas dinámicas; ver los campos y acciones siguientes.

Botones/textos observados: `Cancelar`, `{{ submitLabel() }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M04-NEG-01 — Reclamo y seguimiento (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Registrar una reclamación de prueba por el formulario público disponible; localizarla por identificador en plataforma, abrirla y ejecutar sus acciones de atención.
  - **Esperado:** Contenido y contacto se conservan; cada cambio de estado y respuesta corresponde al reclamo correcto.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M04-NEG-02 — Datos personales y aislamiento (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Consultar un reclamo de otro tenant con usuario de farmacia y manipular el identificador en API.
  - **Esperado:** Se impide el acceso; exportaciones y respuestas no incluyen información de otros reclamantes.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [ ] **M04-CAM-001 — `status()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M04-CAM-002 — `internalNotes()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M04-CAM-003 — `responseNotes() — Texto de respuesta conforme Ley 29571 (15 días hábiles)`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M04-ACC-001 — `onClose()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-002 — `submit()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-003 — `onSearchChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-004 — `onStatusChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-005 — `clearFilters()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-006 — `refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-007 — `openDetail(row)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-008 — `currentPage.set($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M04-ACC-009 — `closeDetail()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `updateComplaint`, `listComplaints`.

- [ ] **M04-API-001 — `updateComplaint`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M04-API-002 — `listComplaints`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M04-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M04-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M04-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M04-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M04-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M04-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M04-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M04-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M04-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M04-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M04-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M04-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M04-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M04-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M04-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M04-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M04-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M04-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M04-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M04-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M04-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [complaint-detail-modal.component.html](../../../front-factofarm/src/app/modules/admin/pages/platform-reclamaciones/complaint-detail-modal/complaint-detail-modal.component.html)
- [complaint-detail-modal.component.ts](../../../front-factofarm/src/app/modules/admin/pages/platform-reclamaciones/complaint-detail-modal/complaint-detail-modal.component.ts)
- [platform-reclamaciones.component.html](../../../front-factofarm/src/app/modules/admin/pages/platform-reclamaciones/platform-reclamaciones.component.html)
- [platform-reclamaciones.component.ts](../../../front-factofarm/src/app/modules/admin/pages/platform-reclamaciones/platform-reclamaciones.component.ts)
- [API: tenants.controller.ts](../../src/modules/tenants/tenants.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M04-DTO-001 — ComplaintRequestDto.tipo.** Reglas declaradas: `@IsEnum(ComplaintKind)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-002 — ComplaintRequestDto.nombresApellidos.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-003 — ComplaintRequestDto.domicilio.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-004 — ComplaintRequestDto.documentoIdentidad.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(20)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-005 — ComplaintRequestDto.telefono.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-006 — ComplaintRequestDto.email.** Reglas declaradas: `@IsOptional() @IsEmail() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-007 — ComplaintRequestDto.bienContratado.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-008 — ComplaintRequestDto.montoReclamado.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-009 — ComplaintRequestDto.detalle.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(4000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-010 — ComplaintRequestDto.pedido.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/complaint-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-011 — ContactRequestDto.nombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/contact-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-012 — ContactRequestDto.farmacia.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/contact-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-013 — ContactRequestDto.telefono.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/contact-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-014 — ContactRequestDto.email.** Reglas declaradas: `@IsEmail() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/contact-request.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M04-DTO-015 — ContactRequestDto.mensaje.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/public/dto/contact-request.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
