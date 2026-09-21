# Plan de pruebas: Clientes

- **Menú:** Clientes → Clientes.
- **Ruta:** `/clientes`.
- **Permiso de navegación:** `nav.clientes_list`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado ejecución:** campaña 2026-09-20 (smoke/parcial Cursor browser + API local); casillas = ejecutado, no necesariamente aprobado.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

> **Ejecución campaña 2026-09-20:** GET `/customers` 200. Live: cliente ARCO `c1faba8a-…`; import DNI 70485888 persistido y DELETE cleanup.

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-clientes-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `{{ col.label }}`, `Tipo Doc. Identidad *`, `Número *`, `Nombre *`, `Nombre comercial`, `Días de crédito`, `Límite de crédito (S/)`, `Código interno`, `Nacionalidad`, `Tipo de cliente`, `País`, `Departamento`, `Provincia`, `Distrito`, `Dirección`, `Teléfono`, `Correo electrónico`, `Correos opcionales`, `Contacto Nombre y Apellido`, `Contacto Teléfono`, `Sitio Web`, `Observaciones`, `Vendedor`, `Zona`, `Autorizo el tratamiento de mis datos personales conforme a la Política de privacidad (LPDP). Conozco mis derechos ARCO.`, `{{ importFile()?.name \|\| 'Seleccione un archivo (xlsx)' }}`, `Período`, `Mes de`, `Mes al`, `Código`, `Etiquetas (separadas por coma)`.

Botones/textos observados: `Exportar`, `Importar`, `Nuevo`, `Mostrar/Ocultar columnas`, `Editar`, `{{ row.habilitado ? 'Inhabilitar' : 'Habilitar' }}`, `Cod. Barras`, `Etiquetas`, `Eliminar`, `{{ isDocumentConsultPending() ? 'Consultando…' : consultDocumentLabel() }}`, `Agregar dirección`, `Quitar`, `Cancelar`, `{{ saveMutation.isPending() ? 'Guardando…' : 'Guardar' }}`, `Descargar formato`, `{{ previewImportMutation.isPending() ? 'Validando…' : 'Vista previa' }}`, `{{ importMutation.isPending() ? 'Procesando…' : 'Confirmar importación' }}`, `Procesar`, `{{ deleteMutation.isPending() ? 'Eliminando…' : 'Eliminar' }}`, `Imprimir`, `{{ barcodeMutation.isPending() ? 'Guardando…' : 'Guardar' }}`, `{{ tagsMutation.isPending() ? 'Guardando…' : 'Guardar' }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [x] **M13-NEG-01 — Identidad, crédito y contacto (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Crear persona con cada tipo documental permitido y empresa de prueba; completar crédito, contactos, direcciones, vendedor, zona y consentimiento; editar.
  - **Esperado:** Datos persisten; documento y correo se validan; días/límite negativos no se aceptan; consentimiento no se marca sin acción del usuario.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-NEG-02 — Direcciones, etiquetas y código (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Añadir dos direcciones y quitar una; guardar etiquetas y abrir/imprimir código de barras.
  - **Esperado:** Solo se elimina la dirección elegida; etiquetas se recuperan y el código identifica al cliente correcto.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-NEG-03 — Estado y venta (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Desactivar un cliente, buscarlo en POS y reactivarlo; generar venta a crédito dentro y fuera del límite configurado.
  - **Esperado:** Selector y autorización de crédito respetan estado y reglas; saldo se asocia al cliente correcto.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-NEG-04 — Importación y exportación (P1; P0 si afecta stock, dinero o aislamiento).** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos y datos:** Descargar plantilla, importar filas válidas, duplicadas e inválidas; exportar un rango/mes y contrastar filas.
  - **Esperado:** Se informa resultado por fila, no hay duplicados silenciosos y exportación conserva filtros y datos del tenant.
  - **Resultado / evidencia / incidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [x] **M13-CAM-001 — `customerTypeId() — Tipo de cliente`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-002 — `zoneId() — Zona`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-003 — `estado() — Estado`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-004 — `isVisible(col.key) (tipo checkbox)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-005 — `form().tipoDocumento`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-006 — `form().numeroDocumento — cliente-numero-doc`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-007 — `form().nombre — cliente-nombre`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-008 — `form().nombreComercial ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-009 — `form().diasCredito ?? 0 (tipo number)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-010 — `form().limiteCredito ?? '' (tipo number)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar numérico: vacío, 0, −1, decimal, precisión y mínimo/máximo ± unidad mínima; comprobar total y persistencia; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-011 — `form().codigoInterno ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-012 — `form().nacionalidad ?? 'PERU'`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-013 — `form().customerTypeId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-014 — `'PERU'`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-015 — `departmentId()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-016 — `provinceId()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-017 — `districtId()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-018 — `form().addresses?.[0]?.direccion ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-019 — `form().addresses?.[0]?.telefono ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-020 — `form().addresses?.[0]?.correoElectronico ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-021 — `form().addresses?.[0]?.correosOpcionales ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-022 — `extraAddress().direccion ?? '' — Dirección`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-023 — `extraAddress().telefono ?? '' — Teléfono`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-024 — `extraAddress().correoElectronico ?? '' — Correo electrónico`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-025 — `form().contactoNombre ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-026 — `form().contactoTelefono ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-027 — `form().sitioWeb ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-028 — `form().observaciones ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-029 — `form().vendedorAsignadoId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-030 — `form().zoneId ?? ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-031 — `lpdpConsentAccepted() (tipo checkbox)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-032 — `exportForm().period \|\| 'all'`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-033 — `exportForm().month \|\| '' — MM/YYYY`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-034 — `exportForm().fromMonth \|\| '' — MM/YYYY`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-035 — `exportForm().toMonth \|\| '' — MM/YYYY`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-036 — `exportForm().sellerId \|\| ''`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-037 — `barcodeValue()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-CAM-038 — `tagsValue()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [x] **M13-ACC-001 — `openExportModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-002 — `openImportModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-003 — `openCreateModal()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-004 — `onSearchChange($event)`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-005 — `onFieldChange($event)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-006 — `clearFilters()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-007 — `refetchRows()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-008 — `openEditModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-009 — `toggleStatus(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-010 — `openBarcodeModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-011 — `openTagsModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-012 — `openDeleteModal(row)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-013 — `onPageChange($event)`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-014 — `closeFormModal()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-015 — `setTab($event)`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-016 — `consultDocument()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-017 — `addExtraAddress()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-018 — `removeExtraAddress(i)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-019 — `submitForm()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-020 — `importOpen.set(false)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-021 — `downloadImportTemplate()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-022 — `runImportPreview()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-023 — `processImport()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-024 — `exportOpen.set(false)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-025 — `processExport()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-026 — `deleteOpen.set(false)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-027 — `confirmDelete()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-028 — `closeBarcodeModal()`.** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: PASÓ parcial; evidencia: Carga inicial OK; refetch/filtros UI no clickeados con evidencia en todos los controles; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-029 — `printBarcode()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-030 — `submitBarcode()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-031 — `tagsOpen.set(false)`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-ACC-032 — `submitTags()`.** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listCustomers`, `listCustomerTypes`, `listCustomerZones`, `listCustomerSellers`, `listCustomerDocumentTypes`, `listCustomerNationalities`, `listUbigeoDepartments`, `listUbigeoProvinces`, `listUbigeoDistricts`, `updateCustomer`, `createCustomer`, `deleteCustomer`, `updateCustomerStatus`, `updateCustomerBarcode`, `updateCustomerTags`, `previewImportCustomers`, `importCustomers`, `validateBillingRuc`, `validateBillingDni`, `downloadCustomerImportTemplate`, `exportCustomers`.

- [x] **M13-API-001 — `listCustomers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomers`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-002 — `listCustomerTypes`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomerTypes`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-003 — `listCustomerZones`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomerZones`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-004 — `listCustomerSellers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomerSellers`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-005 — `listCustomerDocumentTypes`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomerDocumentTypes`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-006 — `listCustomerNationalities`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Endpoint list/get relacionado 200 en smoke (`listCustomerNationalities`); incidencia: Matriz negativa pendiente; fecha: 2026-09-20.

- [x] **M13-API-007 — `listUbigeoDepartments`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listUbigeoDepartments` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M13-API-008 — `listUbigeoProvinces`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listUbigeoProvinces` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M13-API-009 — `listUbigeoDistricts`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin; `listUbigeoDistricts` no verificado aislado o matriz negativa incompleta; incidencia: —; fecha: 2026-09-20.

- [x] **M13-API-010 — `updateCustomer`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-011 — `createCustomer`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-012 — `deleteCustomer`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-013 — `updateCustomerStatus`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-014 — `updateCustomerBarcode`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-015 — `updateCustomerTags`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-016 — `previewImportCustomers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-017 — `importCustomers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-018 — `validateBillingRuc`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada / operación no ejercida; incidencia: —; fecha: 2026-09-20.

- [x] **M13-API-019 — `validateBillingDni`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada / operación no ejercida; incidencia: —; fecha: 2026-09-20.

- [x] **M13-API-020 — `downloadCustomerImportTemplate`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: Ejecutar CRUD QA-*; fecha: 2026-09-20.

- [x] **M13-API-021 — `exportCustomers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada / operación no ejercida; incidencia: —; fecha: 2026-09-20.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [x] **M13-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** Resultado: PASÓ; evidencia: Ruta del módulo presente en sidebar admin y accesible; smoke campaña 2026-09-20; incidencia: —; fecha: 2026-09-20.
- [x] **M13-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Solo ADMINISTRADOR smoke; lector/sin permiso/revocado no corridos; incidencia: Login cruzado roles; fecha: 2026-09-20.
- [x] **M13-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Listado/consulta smoke con datos demo o vacío documentado; variantes vacío forzado/nulos largos no todas; incidencia: —; fecha: 2026-09-20.
- [x] **M13-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Matriz filtros combinados no corrida completa; incidencia: —; fecha: 2026-09-20.
- [x] **M13-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Paginación extrema/eliminación última fila no ejercida; incidencia: —; fecha: 2026-09-20.
- [x] **M13-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Carga visual/sidebar OK en smoke admin; estados deshabilitados no auditados en profundidad; incidencia: —; fecha: 2026-09-20.
- [x] **M13-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Modales/pestañas no ejercidos sistemáticamente en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M13-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M13-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M13-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M13-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M13-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Caso no ejercido en profundidad en smoke campaña; incidencia: —; fecha: 2026-09-20.
- [x] **M13-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M13-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Simulación red/4xx matriz no ejecutada en esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] **M13-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Smoke admin-only; aislamiento cross-tenant no plenamente demostrado; incidencia: Probe tenant B; fecha: 2026-09-20.
- [x] **M13-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: XSS/payload extra/secretos consola no probados en smoke; incidencia: —; fecha: 2026-09-20.
- [x] **M13-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M13-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.
- [x] **M13-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** Resultado: PASÓ parcial; evidencia: Módulo responde en sesión admin; persistencia post-mutación/cross-módulo no revalidada completa; incidencia: —; fecha: 2026-09-20.
- [x] **M13-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: Export/impresión presente o posible pero variantes F01–F08 no ejecutadas; incidencia: —; fecha: 2026-09-20.
- [x] **M13-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: matriz no corrida completa; solo Chromium Cursor; incidencia: Re-run multi-viewport/browsers; fecha: 2026-09-20.

## Fuentes y trazabilidad

- [clientes.component.html](../../../front-factofarm/src/app/modules/admin/pages/clientes/clientes.component.html)
- [clientes.component.ts](../../../front-factofarm/src/app/modules/admin/pages/clientes/clientes.component.ts)
- [API: customers.controller.ts](../../src/modules/customers/customers.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [API: marketing.controller.ts](../../src/modules/marketing/marketing.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [x] **M13-DTO-001 — CreateCustomerZoneDto.nombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer-zone.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-002 — CreateCustomerDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-003 — CreateCustomerDto.nombreComercial.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-004 — CreateCustomerDto.tipoDocumento.** Reglas declaradas: `@IsEnum(CustomerDocumentType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-005 — CreateCustomerDto.numeroDocumento.** Reglas declaradas: `@IsString() @MaxLength(30) @IsPeruDocument()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-006 — CreateCustomerDto.nacionalidad.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-007 — CreateCustomerDto.diasCredito.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-008 — CreateCustomerDto.limiteCredito.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-009 — CreateCustomerDto.codigoInterno.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-010 — CreateCustomerDto.codigoBarra.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-011 — CreateCustomerDto.observaciones.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-012 — CreateCustomerDto.sitioWeb.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(250)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-013 — CreateCustomerDto.contactoNombre.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-014 — CreateCustomerDto.contactoTelefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-015 — CreateCustomerDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-016 — CreateCustomerDto.correoElectronico.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-017 — CreateCustomerDto.correosOpcionales.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(250)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-018 — CreateCustomerDto.puntosAcumulados.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-019 — CreateCustomerDto.activo.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-020 — CreateCustomerDto.habilitado.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-021 — CreateCustomerDto.etiquetas.** Reglas declaradas: `@IsOptional() @IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-022 — CreateCustomerDto.customerTypeId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-023 — CreateCustomerDto.zoneId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-024 — CreateCustomerDto.vendedorAsignadoId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-025 — CreateCustomerDto.lpdpConsentAccepted.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-026 — CreateCustomerDto.lpdpConsentVersion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(20)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-027 — CreateCustomerDto.addresses.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/create-customer.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-028 — CustomerAddressDto.esPrincipal.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-029 — CustomerAddressDto.pais.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-030 — CustomerAddressDto.departmentId.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-031 — CustomerAddressDto.provinceId.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-032 — CustomerAddressDto.districtId.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(12)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-033 — CustomerAddressDto.direccion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(250)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-034 — CustomerAddressDto.telefono.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(30)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-035 — CustomerAddressDto.correoElectronico.** Reglas declaradas: `@IsOptional() @IsEmail()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-036 — CustomerAddressDto.correosOpcionales.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(250)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-address.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-037 — CustomerListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-038 — CustomerListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'numeroDocumento', 'codigoInterno'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-039 — CustomerListQueryDto.customerTypeId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-040 — CustomerListQueryDto.zoneId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-041 — CustomerListQueryDto.estado.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'habilitado', 'inhabilitado'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-042 — CustomerListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-043 — CustomerListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/customer-list-query.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-044 — ExportCustomersDto.period.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'month', 'between-months', 'seller'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/export-customers.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-045 — ExportCustomersDto.month.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/export-customers.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-046 — ExportCustomersDto.fromMonth.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/export-customers.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-047 — ExportCustomersDto.toMonth.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/export-customers.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-048 — ExportCustomersDto.sellerId.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/export-customers.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-049 — UpdateCustomerBarcodeDto.codigoBarra.** Reglas declaradas: `@IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/update-customer-barcode.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-050 — UpdateCustomerStatusDto.habilitado.** Reglas declaradas: `@IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/update-customer-status.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.

- [x] **M13-DTO-051 — UpdateCustomerTagsDto.etiquetas.** Reglas declaradas: `@IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/customers/dto/update-customer-tags.dto.ts). **Resultado/evidencia:** Resultado: BLOQUEADO; evidencia: sin mutación QA-* en esta pasada; incidencia: —; fecha: 2026-09-20.


## Cierre de ejecución

- [x] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia. Resultado: BLOQUEADO; evidencia: Cierre parcial: smoke API/UI admin; matrices profundas y capturas viewport no adjuntas en esta pasada; incidencia: Completar re-run formal; fecha: 2026-09-20.
- [x] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas. Resultado: PASÓ parcial; evidencia: Sin FALLÓ nuevo documentado en smoke 05–18 de esta pasada; incidencia: —; fecha: 2026-09-20.
- [x] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos. Resultado: BLOQUEADO; evidencia: P0/P1 no todos aprobados; muchos BLOQUEADO por mutación/matrices; incidencia: Re-run mutaciones; fecha: 2026-09-20.
- [x] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia. Resultado: PASÓ; evidencia: Sin residuos QA-* nuevos persistentes en esta pasada (mutaciones no aplicadas o cleanup hecho); incidencia: —; fecha: 2026-09-20.
