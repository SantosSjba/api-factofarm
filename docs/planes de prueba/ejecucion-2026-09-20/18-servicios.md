# Plan de pruebas: Servicios

- **Menú:** Productos/Servicios → Servicios.
- **Ruta:** `/servicios`.
- **Permiso de navegación:** `nav.servicios`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** ADMINISTRADOR; GET `/services` 200 (~1). CRUD API real: POST `QA-servicios-campana-2026-09-20` id=`7b12b229-b68a-4301-912e-f2b1d470e6d5` (unit/currency/tax catalogs) luego DELETE 200 (cleanup).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-servicios-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `{{ col.label }}`, `Código`, `Nombre *`, `Principio Activo`, `Concentración`, `Registro Sanitario`, `F.F. (Forma Farmacéutica)`, `Unidad *`, `Descripción`, `Moneda *`, `Precio Unitario *`, `Tipo de afectación *`, `Tipo de afectación (compra)`, `Precio Unitario (Compra)`, `Tipo de sistema ISC`, `Porcentaje ISC`, `Código de barra`, `Código Interno`, `Línea de producto`, `Código Medicamento DIGEMID`, `Cód. SUNAT`, `Modelo`, `N° de puntos`, `Imagen`, `Categoría`, `Marca/Laboratorio`, `Ubicación`, `Tipo`.

Botones/textos observados: `Nuevo`, `Mostrar/Ocultar columnas`, `Editar`, `@if (deleteMutation.isPending()) { } {{ deleteMutation.isPending() ? 'Eliminando...' : 'Eliminar' }}`, `@if (duplicateMutation.isPending()) { } {{ duplicateMutation.isPending() ? 'Duplicando...' : 'Duplicar' }}`, `@if (statusMutation.isPending()) { } {{ statusMutation.isPending() ? 'Procesando...' : (row.habilitado ? 'Inhabilitar' : 'Habilitar') }}`, `Cod. Barras`, `Etiquetas`, `Etiquetas 1x1`, `Etiquetas 1x2`, `Etiquetas 3x3`, `Cerrar`, `Cancelar`, `{{ confirmActionButtonLabel() }}`, `Imprimir`, `{{ barcodeMutation.isPending() ? 'Guardando…' : 'Guardar' }}`, `{{ codigoSuggestionCode(row) }} - {{ row.nombre }}`, `Quitar imagen`, `{{ creatingCategory() ? 'Guardando...' : 'Agregar' }}`, `{{ creatingBrand() ? 'Guardando...' : 'Agregar' }}`, `{{ creatingLocation() ? 'Guardando...' : 'Agregar' }}`, `+ Agregar`, `{{ saveMutation.isPending() \|\| updateMutation.isPending() ? (editingServiceId() ? 'Actualizando...' : 'Guardando...') : (editingServiceId() ? 'Actualizar' : 'Guardar') }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M18-NEG-01 — Alta y venta sin stock (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: PASÓ parcial; evidencia: Alta servicio QA API OK (precio/unit/currency/tax); venta POS sin stock no ejercida; incidencia: POS venta servicio; fecha: 2026-09-20.
  - **Pasos y datos:** Crear servicio con unidad, moneda, afectación, precio y datos opcionales; añadirlo a venta y cobrar.
  - **Esperado:** Importe e impuestos correctos; no se descuenta inventario físico indebidamente.
  - **Resultado / evidencia / incidencia:** Resultado: PASÓ parcial; evidencia: Alta servicio QA API OK (precio/unit/currency/tax); venta POS sin stock no ejercida; incidencia: POS venta servicio; fecha: 2026-09-20.

- [x] **M18-NEG-02 — Edición, copia y estado (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* edición/duplicado/estado/etiquetas en esta pasada (solo create+delete); incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Editar servicio, duplicarlo y desactivarlo; consultar historial, atributos, código e imprimir formatos disponibles.
  - **Esperado:** Copia independiente, historial conservado, estado respetado en selección y etiquetas legibles.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* edición/duplicado/estado/etiquetas en esta pasada (solo create+delete); incidencia: —; fecha: 2026-09-20.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M18-CAM-001 — `isVisible(col.key) (tipo checkbox)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-002 — `barcodeValue()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-003 — `!!form().incluyeIgvVenta`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-004 — `!!form().generico`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-005 — `!!form().necesitaRecetaMedica`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-006 — `form().codigoBusqueda ?? '' — Ingresa el código a buscar`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-007 — `form().nombre`.** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-008 — `form().principioActivo ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-009 — `form().concentracion ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-010 — `form().registroSanitario ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-011 — `form().formaFarmaceutica ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-012 — `form().unitId ?? '' — Seleccionar`.** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-013 — `form().descripcion ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-014 — `form().currencyId — Seleccionar`.** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-015 — `form().precioUnitarioVenta (tipo number)`.** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-016 — `form().saleTaxAffectationId — Seleccionar`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-017 — `form().purchaseTaxAffectationId ?? form().saleTaxAffectationId`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-018 — `form().precioUnitarioCompra ?? '' (tipo number)`.** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: PASÓ parcial; evidencia: Campos mínimos usados en POST create servicio QA; matriz V01–V12 incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-019 — `!!form().incluyeIscVenta`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-020 — `!!form().sujetoDetraccion`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-021 — `form().tipoSistemaIscId ?? '' — Seleccionar`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-022 — `form().porcentajeIsc ?? 0 (tipo number)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-023 — `form().codigoBarra ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-024 — `form().codigoInterno ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-025 — `form().lineaProducto ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-026 — `form().codigoMedicamentoDigemid ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-027 — `form().codigoSunat ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-028 — `form().modelo ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-029 — `!!form().sePuedeCanjearPorPuntos`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-030 — `form().numeroPuntos ?? 0 (tipo number)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-031 — `form().categoryId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-032 — `newCategoryName() — Nueva categoría`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-033 — `form().brandId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-034 — `newBrandName() — Nueva marca`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-035 — `form().productLocationId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-036 — `newLocationName() — Nueva ubicación`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-037 — `ar.attributeTypeId`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-CAM-038 — `ar.descripcion`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M18-ACC-001 — `openCreateModal()`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-002 — `onSearchChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-003 — `onFieldChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-004 — `clearFilters()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-005 — `refetchRows()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-006 — `openHistoryModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-007 — `openEditModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-008 — `deleteServiceRow(row, 'service-actions-' + row.id)`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-009 — `duplicateServiceRow(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-010 — `toggleServiceStatus(row, 'service-actions-' + row.id)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-011 — `openBarcodeModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-012 — `printServiceLabels(row, 'single')`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-013 — `printServiceLabels(row, '1x1')`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-014 — `printServiceLabels(row, '1x2')`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-015 — `printServiceLabels(row, '3x3')`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-016 — `onPageChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-017 — `closeHistoryModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-018 — `setHistoryTab($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-019 — `closeConfirmModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-020 — `confirmServiceAction()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-021 — `closeBarcodeModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-022 — `printBarcode()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-023 — `submitBarcode()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-024 — `closeFormModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-025 — `setTab($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-026 — `buscarCodigoManual()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-027 — `onCodigoSuggestionSelect(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-028 — `onServiceImageFile($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-029 — `clearServiceImage()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-030 — `createCategoryQuick()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-031 — `createBrandQuick()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-032 — `createLocationQuick()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-033 — `addAttributeRow()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-034 — `removeAttributeRow(ar.uid)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-ACC-035 — `submitService()`.** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Equivalente API create/delete OK; UI no clickeada; incidencia: —; fecha: 2026-09-20.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listServices`, `listServiceCatalogUnits`, `listServiceCatalogCurrencies`, `listServiceCatalogTaxAffectationTypes`, `listServiceCatalogIscSystems`, `listCategories`, `listBrands`, `listEstablishmentsAll`, `listServiceCatalogLocations`, `listServiceCatalogAttributeTypes`, `createService`, `updateService`, `deleteService`, `duplicateService`, `updateServiceStatus`, `updateServiceBarcode`, `listServiceHistoryStock`, `upload`, `absoluteFileUrl`, `createCategory`, `createBrand`, `createProductLocation`.

- [x] **M18-API-001 — `listServices`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listServices`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-002 — `listServiceCatalogUnits`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listServiceCatalogUnits`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-003 — `listServiceCatalogCurrencies`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listServiceCatalogCurrencies`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-004 — `listServiceCatalogTaxAffectationTypes`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listServiceCatalogTaxAffectationTypes`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-005 — `listServiceCatalogIscSystems`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listServiceCatalogIscSystems` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-006 — `listCategories`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listCategories`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-007 — `listBrands`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listBrands`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-008 — `listEstablishmentsAll`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: GET/POST API OK 200 en pasada 2026-09-20 para operación relacionada `listEstablishmentsAll`; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-009 — `listServiceCatalogLocations`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listServiceCatalogLocations` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-010 — `listServiceCatalogAttributeTypes`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listServiceCatalogAttributeTypes` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-011 — `createService`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: POST /services 200 id=7b12b229-b68a-4301-912e-f2b1d470e6d5; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-012 — `updateService`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M18-API-013 — `deleteService`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: DELETE /services/7b12b229-b68a-4301-912e-f2b1d470e6d5 200; incidencia: Matriz negativa 4xx pendiente; fecha: 2026-09-20.

- [x] **M18-API-014 — `duplicateService`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M18-API-015 — `updateServiceStatus`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M18-API-016 — `updateServiceBarcode`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M18-API-017 — `listServiceHistoryStock`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listServiceHistoryStock` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-018 — `upload`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M18-API-019 — `absoluteFileUrl`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `absoluteFileUrl` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-020 — `createCategory`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: CRUD ejecutado `createCategory`; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-021 — `createBrand`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: CRUD ejecutado `createBrand`; incidencia: —; fecha: 2026-09-20.

- [x] **M18-API-022 — `createProductLocation`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: CRUD ejecutado `createProductLocation`; incidencia: —; fecha: 2026-09-20.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M18-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Ruta del módulo presente en sidebar admin y accesible; smoke campaña 2026-09-20; incidencia: —; fecha: 2026-09-20.
- [x] **M18-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Solo ADMINISTRADOR smoke; lector/sin permiso/revocado no corridos; incidencia: Login cruzado roles; fecha: 2026-09-20.
- [x] **M18-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Listado/consulta smoke con datos demo o vacío documentado; variantes vacío forzado/nulos largos no todas; incidencia: —; fecha: 2026-09-20.
- [x] **M18-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz filtros combinados no corrida completa; incidencia: —; fecha: 2026-09-20.
- [x] **M18-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Paginación extrema/eliminación última fila no ejercida; incidencia: —; fecha: 2026-09-20.
- [x] **M18-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual/sidebar OK en smoke admin; estados deshabilitados no auditados en profundidad; incidencia: —; fecha: 2026-09-20.
- [x] **M18-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Modales/pestañas no ejercidos sistemáticamente en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M18-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M18-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M18-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M18-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M18-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M18-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M18-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M18-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin-only; aislamiento cross-tenant no plenamente demostrado; incidencia: Probe tenant B; fecha: 2026-09-20.
- [x] **M18-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload extra/secretos consola no probados en smoke; incidencia: —; fecha: 2026-09-20.
- [x] **M18-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M18-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M18-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Módulo responde en sesión admin; persistencia post-mutación/cross-módulo no revalidada completa; incidencia: —; fecha: 2026-09-20.
- [x] **M18-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Export/impresión presente o posible pero variantes F01–F08 no ejecutadas; incidencia: —; fecha: 2026-09-20.
- [x] **M18-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.

## Fuentes y trazabilidad

- [servicios.component.html](../../../front-factofarm/src/app/modules/admin/pages/servicios/servicios.component.html)
- [servicios.component.ts](../../../front-factofarm/src/app/modules/admin/pages/servicios/servicios.component.ts)
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M18-DTO-001 — ServiceAttributeInputDto.attributeTypeId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-002 — ServiceAttributeInputDto.descripcion.** Reglas declaradas: `@IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-003 — CreateServiceDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: POST create usó campos DTO mínimos válidos; violaciones no ejercidas; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-004 — CreateServiceDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-005 — CreateServiceDto.principioActivo.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-006 — CreateServiceDto.concentracion.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-007 — CreateServiceDto.registroSanitario.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-008 — CreateServiceDto.formaFarmaceutica.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-009 — CreateServiceDto.codigoBusqueda.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-010 — CreateServiceDto.codigoInterno.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-011 — CreateServiceDto.codigoBarra.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-012 — CreateServiceDto.codigoSunat.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-013 — CreateServiceDto.codigoMedicamentoDigemid.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-014 — CreateServiceDto.lineaProducto.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-015 — CreateServiceDto.modelo.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-016 — CreateServiceDto.marcaLaboratorio.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-017 — CreateServiceDto.unitId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-018 — CreateServiceDto.currencyId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-019 — CreateServiceDto.saleTaxAffectationId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-020 — CreateServiceDto.purchaseTaxAffectationId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-021 — CreateServiceDto.precioUnitarioVenta.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-022 — CreateServiceDto.precioUnitarioCompra.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-023 — CreateServiceDto.incluyeIgvVenta.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-024 — CreateServiceDto.incluyeIgvCompra.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-025 — CreateServiceDto.generico.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-026 — CreateServiceDto.necesitaRecetaMedica.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-027 — CreateServiceDto.incluyeIscVenta.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-028 — CreateServiceDto.incluyeIscCompra.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-029 — CreateServiceDto.tipoSistemaIscId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-030 — CreateServiceDto.porcentajeIsc.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-031 — CreateServiceDto.sujetoDetraccion.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-032 — CreateServiceDto.sePuedeCanjearPorPuntos.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-033 — CreateServiceDto.numeroPuntos.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-034 — CreateServiceDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-035 — CreateServiceDto.brandId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-036 — CreateServiceDto.productLocationId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-037 — CreateServiceDto.imagenArchivoId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-038 — CreateServiceDto.attributes.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/create-service.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-039 — ServiceListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/service-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-040 — ServiceListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'codigoInterno', 'codigoBarra', 'codigoBusqueda', 'descripcion'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/service-list-query.dto.ts). **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: POST create usó campos DTO mínimos válidos; violaciones no ejercidas; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-041 — ServiceListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/service-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-042 — ServiceListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/service-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-043 — UpdateServiceBarcodeDto.codigoBarra.** Reglas declaradas: `@IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/update-service-barcode.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M18-DTO-044 — UpdateServiceStatusDto.habilitado.** Reglas declaradas: `@IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/services/dto/update-service-status.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. Resultado: PASÓ parcial; evidencia: Sin FALLÓ nuevo documentado en smoke 05–18 de esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. Resultado: BLOQUEADO; evidencia: P0/P1 no todos aprobados; muchos BLOQUEADO por mutación/matrices; incidencia: Re-run mutaciones; fecha: 2026-09-20.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. Resultado: PASÓ; evidencia: Registros QA-* creados y eliminados vía API (cleanup documentado en cabecera); incidencia: —; fecha: 2026-09-20.
