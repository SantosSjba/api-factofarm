# Plan de pruebas: Conjuntos/Packs/Promociones

- **Menú:** Productos/Servicios → Conjuntos/Packs/Promociones.
- **Ruta:** `/conjuntos-packs-promociones`.
- **Permiso de navegación:** `nav.conjuntos_packs`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-conjuntos-packs-promociones-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `{{ col.label }}`, `{{ importFile()?.name \|\| 'Seleccione un archivo (xlsx)' }}`, `Producto`, `Cantidad`, `Nombre *`, `Nombre secundario`, `Descripción`, `Modelo`, `Unidad *`, `Moneda *`, `Precio Unitario (Venta) *`, `Plataforma`, `Imagen`, `Tipo de afectación (Venta) *`, `Código Sunat`, `Código Interno`, `Total P. Compra (Referencia)`, `Precio Unitario (Compra) *`, `Categoría`, `Marca/Laboratorio`.

Botones/textos observados: `Importar`, `Productos compuestos`, `Detalle productos compuestos`, `Nuevo`, `Mostrar/Ocultar columnas`, `Editar`, `Eliminar`, `Descargar formato`, `Cancelar`, `{{ importMutation.isPending() ? 'Procesando...' : 'Procesar' }}`, `{{ deleteMutation.isPending() ? 'Eliminando...' : 'Eliminar' }}`, `-`, `+`, `Cerrar`, `Agregar`, `Agregar productos`, `Quitar imagen`, `{{ creatingCategory() ? 'Guardando...' : 'Agregar' }}`, `{{ creatingBrand() ? 'Guardando...' : 'Agregar' }}`, `{{ createMutation.isPending() \|\| updateMutation.isPending() ? (editingId() ? 'Actualizando...' : 'Guardando...') : (editingId() ? 'Actualizar' : 'Guardar') }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M17-NEG-01 — Composición y cantidades (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Crear pack de dos productos; probar cantidad cero, negativa y repetida; quitar componente y modificar precio.
  - **Esperado:** Componentes y cantidades persisten; total de referencia y precio final corresponden a la composición.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M17-NEG-02 — Venta del pack (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Vender pack con stock suficiente y luego con un componente insuficiente.
  - **Esperado:** Descuento de componentes es consistente y atómico; no queda una venta parcial sin stock.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M17-NEG-03 — Importaciones separadas (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Importar PRODUCTOS_COMPUESTOS y DETALLE_PRODUCTOS_COMPUESTOS con pack existente, inexistente y componente duplicado.
  - **Esperado:** Cabecera y detalle se vinculan correctamente; errores por fila no generan packs rotos.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [ ] **M17-CAM-001 — `isVisible(col.key) (tipo checkbox)`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-002 — `addProductId() — Seleccionar`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-003 — `addProductQty() (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-004 — `form().nombre`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-005 — `form().nombreSecundario ?? ''`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-006 — `form().descripcion ?? ''`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-007 — `form().modelo ?? ''`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-008 — `form().unitId — Seleccionar`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-009 — `form().currencyId — Seleccionar`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-010 — `form().precioUnitarioVenta (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-011 — `form().plataformaId ?? '' — Seleccionar`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-012 — `form().saleTaxAffectationId — Seleccionar`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-013 — `form().codigoSunat ?? ''`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-014 — `form().codigoInterno ?? ''`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-015 — `detailTotal()`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-016 — `form().precioUnitarioCompra (tipo number)`.**
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-017 — `form().categoryId ?? ''`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-018 — `newCategoryName() — Nueva categoría`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-019 — `form().brandId ?? ''`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M17-CAM-020 — `newBrandName() — Nueva marca`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M17-ACC-001 — `openImportModal('PRODUCTOS_COMPUESTOS')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-002 — `openImportModal('DETALLE_PRODUCTOS_COMPUESTOS')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-003 — `openCreateModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-004 — `onSearchChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-005 — `onFieldChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-006 — `clearFilters()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-007 — `refetchRows()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-008 — `openEditModal(row)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-009 — `askDelete(row)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-010 — `onPageChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-011 — `closeImportModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-012 — `downloadImportTemplate()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-013 — `processImport()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-014 — `closeConfirmModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-015 — `confirmDelete()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-016 — `closeAddProductModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-017 — `addProductQtyStep(-1)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-018 — `addProductQtyStep(1)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-019 — `addDetailProduct()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-020 — `closeFormModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-021 — `openAddProductModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-022 — `patchRowQty(row.uid, -1)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-023 — `patchRowQty(row.uid, 1)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-024 — `removeRow(row.uid)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-025 — `onImageFile($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-026 — `clearImage()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-027 — `createCategoryQuick()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-028 — `createBrandQuick()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M17-ACC-029 — `submitForm()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listCompoundProducts`, `listCompoundProductCatalogUnits`, `listCompoundProductCatalogCurrencies`, `listCompoundProductCatalogTaxAffectationTypes`, `listCompoundProductCatalogPlatforms`, `listCategories`, `listBrands`, `listProducts`, `createCompoundProduct`, `updateCompoundProduct`, `deleteCompoundProduct`, `importCompoundProducts`, `downloadCompoundProductImportTemplate`, `getCompoundProduct`, `upload`, `absoluteFileUrl`, `createCategory`, `createBrand`.

- [ ] **M17-API-001 — `listCompoundProducts`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-002 — `listCompoundProductCatalogUnits`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-003 — `listCompoundProductCatalogCurrencies`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-004 — `listCompoundProductCatalogTaxAffectationTypes`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-005 — `listCompoundProductCatalogPlatforms`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-006 — `listCategories`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-007 — `listBrands`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-008 — `listProducts`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-009 — `createCompoundProduct`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-010 — `updateCompoundProduct`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-011 — `deleteCompoundProduct`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-012 — `importCompoundProducts`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-013 — `downloadCompoundProductImportTemplate`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-014 — `getCompoundProduct`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-015 — `upload`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-016 — `absoluteFileUrl`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-017 — `createCategory`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M17-API-018 — `createBrand`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M17-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M17-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M17-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M17-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M17-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M17-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M17-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M17-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M17-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M17-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M17-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M17-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M17-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M17-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M17-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M17-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M17-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M17-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M17-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M17-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M17-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [conjuntos-packs-promociones.component.html](../../../front-factofarm/src/app/modules/admin/pages/conjuntos-packs-promociones/conjuntos-packs-promociones.component.html)
- [conjuntos-packs-promociones.component.ts](../../../front-factofarm/src/app/modules/admin/pages/conjuntos-packs-promociones/conjuntos-packs-promociones.component.ts)
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M17-DTO-001 — CompoundProductListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/compound-product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-002 — CompoundProductListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'codigoInterno', 'descripcion'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/compound-product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-003 — CompoundProductListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/compound-product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-004 — CompoundProductListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/compound-product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-005 — CompoundProductItemInputDto.productId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-006 — CompoundProductItemInputDto.cantidad.** Reglas declaradas: `@IsNumber() @Min(0.0001)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-007 — CompoundProductItemInputDto.precioUnitario.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-008 — CreateCompoundProductDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-009 — CreateCompoundProductDto.nombreSecundario.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-010 — CreateCompoundProductDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-011 — CreateCompoundProductDto.modelo.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-012 — CreateCompoundProductDto.unitId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-013 — CreateCompoundProductDto.currencyId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-014 — CreateCompoundProductDto.saleTaxAffectationId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-015 — CreateCompoundProductDto.precioUnitarioVenta.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-016 — CreateCompoundProductDto.incluyeIgvVenta.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-017 — CreateCompoundProductDto.plataformaId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-018 — CreateCompoundProductDto.codigoSunat.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-019 — CreateCompoundProductDto.codigoInterno.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-020 — CreateCompoundProductDto.precioUnitarioCompra.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-021 — CreateCompoundProductDto.totalPrecioCompraReferencia.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-022 — CreateCompoundProductDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-023 — CreateCompoundProductDto.brandId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-024 — CreateCompoundProductDto.imagenArchivoId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-025 — CreateCompoundProductDto.items.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/create-compound-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M17-DTO-026 — ImportCompoundProductsDto.mode.** Reglas declaradas: `@IsIn(compoundProductImportModes)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/compound-products/dto/import-compound-products.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
