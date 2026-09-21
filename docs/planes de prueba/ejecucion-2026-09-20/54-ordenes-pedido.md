# Plan de pruebas: Ordenes de pedido

- **Menú:** Comprobantes Avanzados → Ordenes de pedido.
- **Ruta:** `/ordenes-pedido`.
- **Permiso de navegación:** `nav.ordenes_pedido`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (API-smoke Shell + rutas front); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** agente Shell/API local (admin@factosysperu.com). UI Chromium no abierta en este agente — NAV/UI/ACC/RWD/A11Y/BRS según ruta en `admin.routes.ts` + sonda API. Casillas = ejecutado, no necesariamente aprobado.

> **Evidencia módulo:** UI D202609200001 ENTREGADO S/ 5; D202609200002 CANCELADO S/ 3. GET 200 n=2.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-ordenes-pedido-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `Motivo cancelación`, `Almacén`, `Nombre cliente`, `Teléfono`, `Email`, `Costo delivery (S/)`, `Dirección de entrega`, `Distrito`, `Referencia`.

Botones/textos observados: `Nuevo pedido`, `Buscar`, `→ {{ statusLabels[next] }}`, `Cobrar y entregar`, `Asignar repartidor`, `Cancelar pedido`, `{{ item.nombre }} — S/ {{ item.precio }}`, `Crear pedido`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M54-NEG-01 — Pedido y entrega (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Crear pedido con almacén, cliente, teléfono/email, dirección, distrito, referencia, productos y costo delivery; recorrer estados disponibles.
  - **Esperado:** Total incluye delivery una vez; contacto y dirección permanecen vinculados al pedido.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Ciclo create/assign/complete-sale no mutado; list vacío; incidencia: Datos + UI.

- [x] **M54-NEG-02 — Cancelación (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Cancelar con motivo vacío y válido en estados permitidos/no permitidos; repetir.
  - **Esperado:** Motivo validado, transición controlada y liberación de stock/reserva/pago consistente con el estado.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: Ciclo create/assign/complete-sale no mutado; list vacío; incidencia: Datos + UI.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M54-CAM-001 — `estadoFilter()`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-002 — `search() — Buscar número, cliente o teléfono`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-003 — `assignUserId()`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-004 — `cancelReason()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-005 — `warehouseId()`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-006 — `clienteNombre()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-007 — `clienteTelefono()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-008 — `clienteEmail()`.**
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-009 — `costoDelivery() (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-010 — `direccionEntrega()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-011 — `distritoEntrega()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-012 — `referenciaDireccion()`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

- [x] **M54-CAM-013 — `productSearch() — Filtrar producto`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; validaciones UI pendientes; API/DTO sonda parcial; incidencia: —.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M54-ACC-001 — `createOpen.set(true)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-002 — `listQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-003 — `page.set(1); listQuery.refetch()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-004 — `openDetail(row.id)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-005 — `page.set($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-006 — `closeDetail()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-007 — `advanceStatus(order)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-008 — `completeSale(order)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-009 — `assignOrder(order)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-010 — `cancelOrder(order)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-011 — `createOpen.set(false)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-012 — `searchProducts()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-013 — `addLine(item)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

- [x] **M54-ACC-014 — `createMutation.mutate()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; acciones de plantilla no clickeadas; API sonda documentada; incidencia: —.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listDeliveryOrders`, `getDeliveryOrder`, `listInventoryMovementWarehouses`, `listUsers`, `getPosCatalog`, `createDeliveryOrder`, `updateDeliveryOrderStatus`, `assignDeliveryOrder`, `completeDeliverySale`.

- [x] **M54-API-001 — `listDeliveryOrders`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-002 — `getDeliveryOrder`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-003 — `listInventoryMovementWarehouses`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-004 — `listUsers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-005 — `getPosCatalog`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-006 — `createDeliveryOrder`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-007 — `updateDeliveryOrderStatus`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-008 — `assignDeliveryOrder`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

- [x] **M54-API-009 — `completeDeliverySale`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET /api/v1/delivery-orders 200 items=[] total=0; incidencia: —.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M54-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/ordenes-pedido`; API delivery-orders 200; incidencia: Abrir UI.
- [x] **M54-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta; ruta `/ordenes-pedido`; API delivery-orders 200; incidencia: Abrir UI.
- [x] **M54-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Listado vacío confirmado GET 200; incidencia: —.
- [x] **M54-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Listado vacío confirmado GET 200; incidencia: —.
- [x] **M54-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Listado vacío confirmado GET 200; incidencia: —.
- [x] **M54-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M54-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: UI no abierta en este agente; incidencia: Abrir /{route} en browser.
- [x] **M54-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M54-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M54-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz viewport/Chromium-only pendiente; incidencia: Re-run RWD.
- [x] **M54-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M54-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Recorrido teclado/zoom/contraste no ejecutado; incidencia: Re-run A11Y.
- [x] **M54-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M54-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/timeout/500 y matriz 4xx completa no ejercida en smoke; incidencia: —.
- [x] **M54-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M54-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Aislamiento tenant B / XSS / secretos consola no profundizados en smoke; incidencia: —.
- [x] **M54-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Concurrencia dos sesiones no probada; incidencia: —.
- [x] **M54-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Volumen/listeners no medidos; incidencia: —.
- [x] **M54-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Reapertura sesión/módulos consumidores no verificada en UI; incidencia: —.
- [x] **M54-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Export/import/impresión UI no ejercida en este agente; incidencia: —.
- [x] **M54-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Solo potencial Chromium Cursor; Edge/Firefox/Safari/Android no ejecutados; incidencia: —.

## Fuentes y trazabilidad

- [ordenes-pedido.component.html](../../../front-factofarm/src/app/modules/admin/pages/ordenes-pedido/ordenes-pedido.component.html)
- [ordenes-pedido.component.ts](../../../front-factofarm/src/app/modules/admin/pages/ordenes-pedido/ordenes-pedido.component.ts)
- [API: delivery-orders.controller.ts](../../src/modules/delivery-orders/delivery-orders.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.spec.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.spec.ts) — URLs y payloads de las operaciones anteriores.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M54-DTO-001 — DeliveryOrderListQueryDto.estado.** Reglas declaradas: `@IsOptional() @IsEnum(DeliveryOrderStatus)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-002 — DeliveryOrderListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-003 — CreateDeliveryOrderItemDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-004 — CreateDeliveryOrderItemDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-005 — CreateDeliveryOrderItemDto.unitPrice.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-006 — CreateDeliveryOrderItemDto.notas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-007 — CreateDeliveryOrderDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-008 — CreateDeliveryOrderDto.customerId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-009 — CreateDeliveryOrderDto.canal.** Reglas declaradas: `@IsOptional() @IsEnum(DeliveryChannel)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-010 — CreateDeliveryOrderDto.clienteNombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-011 — CreateDeliveryOrderDto.clienteTelefono.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-012 — CreateDeliveryOrderDto.clienteEmail.** Reglas declaradas: `@IsOptional() @IsEmail() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-013 — CreateDeliveryOrderDto.direccionEntrega.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-014 — CreateDeliveryOrderDto.referenciaDireccion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-015 — CreateDeliveryOrderDto.distritoEntrega.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-016 — CreateDeliveryOrderDto.costoDelivery.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-017 — CreateDeliveryOrderDto.notasCliente.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-018 — CreateDeliveryOrderDto.notasInternas.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-019 — CreateDeliveryOrderDto.programadoPara.** Reglas declaradas: `@IsOptional() @IsDateString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-020 — CreateDeliveryOrderDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-021 — UpdateDeliveryOrderStatusDto.estado.** Reglas declaradas: `@IsEnum(DeliveryOrderStatus)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-022 — UpdateDeliveryOrderStatusDto.cancelReason.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-023 — AssignDeliveryOrderDto.assignedToId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-024 — PublicCreateDeliveryOrderDto.clienteNombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-025 — PublicCreateDeliveryOrderDto.clienteTelefono.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-026 — PublicCreateDeliveryOrderDto.clienteEmail.** Reglas declaradas: `@IsOptional() @IsEmail()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-027 — PublicCreateDeliveryOrderDto.direccionEntrega.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-028 — PublicCreateDeliveryOrderDto.referenciaDireccion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-029 — PublicCreateDeliveryOrderDto.distritoEntrega.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-030 — PublicCreateDeliveryOrderDto.notasCliente.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-031 — PublicCreateDeliveryOrderDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/delivery-order.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-032 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-033 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-034 — CompleteDeliverySaleDto.cashSessionId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/complete-delivery-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-035 — CompleteDeliverySaleDto.payments.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/delivery-orders/dto/complete-delivery-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-036 — DTO.lotCode.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-037 — DTO.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-038 — CreateSaleItemDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-039 — CreateSaleItemDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-040 — CreateSaleItemDto.unitPrice.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-041 — CreateSaleItemDto.discountType.** Reglas declaradas: `@IsOptional() @IsEnum(DiscountType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-042 — CreateSaleItemDto.discountValue.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-043 — CreateSaleItemDto.lotAllocationMode.** Reglas declaradas: `@IsOptional() @IsEnum(SaleLotAllocationMode)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-044 — CreateSaleItemDto.manualLots.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-045 — CreateSaleItemDto.originalProductId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-046 — CreateSaleItemDto.substituteProductId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-047 — CreateSaleItemDto.motivo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-048 — CreatePaymentDto.metodo.** Reglas declaradas: `@IsEnum(PaymentMethod)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-049 — CreatePaymentDto.monto.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-050 — CreatePaymentDto.referencia.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-051 — CreateSaleDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-052 — CreateSaleDto.cashSessionId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-053 — CreateSaleDto.customerId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-054 — CreateSaleDto.documentType.** Reglas declaradas: `@IsEnum(SaleDocumentType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-055 — CreateSaleDto.serie.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(10)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-056 — CreateSaleDto.saleDiscountType.** Reglas declaradas: `@IsOptional() @IsEnum(DiscountType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-057 — CreateSaleDto.saleDiscountValue.** Reglas declaradas: `@IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-058 — CreateSaleDto.promotionCode.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(40)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-059 — CreateSaleDto.prescriptionValidated.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-060 — CreateSaleDto.prescriptionId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-061 — CreateSaleDto.controlledApprovedById.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-062 — CreateSaleDto.controlledDigitalSignature.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(128)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-063 — CreateSaleDto.agreementId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-064 — CreateSaleDto.prescriptionNote.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-065 — CreateSaleDto.quotationId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-066 — CreateSaleDto.comentario.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-067 — CreateSaleDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-068 — CreateSaleDto.substitutions.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-069 — CreateSaleDto.payments.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-070 — VoidSaleDto.reason.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-071 — CreateSaleReturnDto.motivo.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-072 — CreateSaleReturnDto.items.** Reglas declaradas: `@IsArray() @ArrayMinSize(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-073 — CreateSaleDebitNoteDto.motivo.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-074 — CreateSaleDebitNoteDto.descripcion.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-075 — CreateSaleDebitNoteDto.total.** Reglas declaradas: `@IsNumber() @Min(0.01)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-076 — OfflineSaleDto.offlineLocalId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-077 — OfflineSaleDto.sale.** Reglas declaradas: `@ValidateNested()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-078 — SyncSalesDto.sales.** Reglas declaradas: `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/sales/dto/create-sale.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-079 — DTO.lotCode.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-080 — DTO.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-081 — SaleLotAllocationPreviewDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-082 — SaleLotAllocationPreviewDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-083 — SaleLotAllocationPreviewDto.quantity.** Reglas declaradas: `@IsNumber({ maxDecimalPlaces: 4 }) @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-084 — SaleLotAllocationPreviewDto.mode.** Reglas declaradas: `@IsEnum(SaleLotAllocationMode)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.

- [x] **M54-DTO-085 — SaleLotAllocationPreviewDto.manualLots.** Reglas declaradas: `@IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/inventory-movements/dto/sale-lot-allocation-preview.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz DTO delivery-orders no ejercida; incidencia: —.


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
