# Plan de pruebas: Usuarios

- **Menú:** Usuarios/Establecimientos → Usuarios.
- **Ruta:** `/usuarios`.
- **Permiso de navegación:** `nav.usuarios`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-usuarios-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `Nombre`, `Correo electrónico`, `Establecimiento`, `Perfil`, `{{ passwordLabel() }}`, `Confirmar contraseña`, `Tipo Doc. Identidad`, `Número`, `Nombres`, `Apellidos`, `Fecha de nacimiento`, `Correo electrónico personal`, `Nº Celular personal`, `Dirección`, `Correo electrónico corporativo`, `Nº Celular corporativo`, `Fecha de contratación`, `Cargo`, `Foto`.

Botones/textos observados: `Cancelar`, `{{ submitLabel() }}`, `Nuevo`, `{{ deleteUserMutation.isPending() ? 'Eliminando…' : 'Eliminar' }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M06-NEG-01 — Alta completa en cuatro pestañas (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Crear QA-Usuario completando Datos de Usuario, Permisos y Datos personales; consultar Config. Documentos; guardar, buscar y volver a editar.
  - **Esperado:** Persisten datos, establecimiento, rol y permisos; la pestaña documental muestra las series del establecimiento. La contraseña nunca aparece en listados o respuestas.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-02 — Consulta de series del usuario (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Abrir Config. Documentos sin establecimiento, con uno sin series y con otro con series; cambiar establecimiento y seguir enlaces Series/Establecimientos.
  - **Esperado:** Se muestran aviso, vacío o tabla correctos; tipo, serie y contingencia pertenecen al establecimiento actual. La pestaña consulta series; su administración ocurre en los enlaces indicados.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-03 — Contraseña al crear y editar (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar longitudes 0, 7, 8, 100 y 101; confirmación diferente; editar sin contraseña y luego con una nueva.
  - **Esperado:** Alta exige al menos 8 y máximo 100 caracteres y confirmación coincidente; edición vacía conserva la clave; la nueva permite iniciar sesión.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-04 — Nombre y correos (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar nombre de 150/151 caracteres, correo válido e inválido, correo de 150/151 y duplicado; probar espacios al inicio y final.
  - **Esperado:** Se aplican trim, obligatoriedad y máximo 150 donde está declarado; no se crean cuentas duplicadas.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-05 — Identidad y teléfonos (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Probar DNI de 7/8/9 dígitos y letras mezcladas; CE de 8/9/12/13 alfanuméricos; pasaporte de 5/6/12/13; OTRO de 20/21; teléfono de 6/7/15/16 dígitos con y sin +.
  - **Esperado:** UI y API concuerdan con las reglas declaradas; letras en DNI no se aceptan silenciosamente; tipo y número se validan juntos. Registrar cualquier discrepancia de normalización.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-06 — Árbol de permisos (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Elegir plantilla de rol; marcar padre, desmarcar hijo y guardar; probar árbol vacío y cambio posterior de rol; iniciar otra sesión con ese usuario.
  - **Esperado:** Selección parcial y completa son coherentes; se asignan los permisos técnicos previstos sin escalamiento y los accesos revocados dejan de funcionar por URL/API.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-07 — Foto protegida (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Subir imagen válida, sustituirla y cancelar; probar archivo falso, demasiado grande y URL sin token desde otra sesión.
  - **Esperado:** Previsualización y persistencia corresponden al usuario; el acceso al archivo exige autorización; cancelar no confirma cambios del perfil.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M06-NEG-08 — Eliminar y permisos de escritura (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Cancelar y confirmar eliminación de usuario QA; probar sesión sin users.write y eliminación del último registro de la página.
  - **Esperado:** Cancelar no modifica; confirmar actualiza lista y paginación; la API rechaza escritura no autorizada. Verificar regla de cuentas protegidas sin eliminar administradores operativos.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

- [ ] **M06-CAM-001 — `nombre() — Nombre completo`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-002 — `email() — correo@ejemplo.com (tipo email)`.**
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-003 — `establecimientoId() — usuario-campo-3`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-004 — `role() — usuario-campo-4`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-005 — `password() — usuario-campo-5 (tipo password)`.**
  - **Pasos:** localizar el control; probar contraseña: requerida según alta/edición, longitud en límites, confirmación, enmascaramiento y ausencia en respuestas; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-006 — `password2() — •••••••• (tipo password)`.**
  - **Pasos:** localizar el control; probar contraseña: requerida según alta/edición, longitud en límites, confirmación, enmascaramiento y ausencia en respuestas; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-007 — `tipoDoc() — usuario-campo-7`.**
  - **Pasos:** localizar el control; probar selección: sin opción, cada opción válida, ID inexistente/inactivo/ajeno y cambio del selector padre; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-008 — `numeroDoc() — usuario-campo-8`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-009 — `nombres() — usuario-campo-9`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-010 — `apellidos() — usuario-campo-10`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-011 — `fechaNac() — usuario-campo-11 (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-012 — `emailPersonal() — usuario-campo-12 (tipo email)`.**
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-013 — `celPersonal() — usuario-campo-13`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-014 — `direccion() — usuario-campo-14`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-015 — `emailCorp() — usuario-campo-15 (tipo email)`.**
  - **Pasos:** localizar el control; probar correo: válido, sin @, sin dominio, espacios, longitud límite y normalización; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-016 — `celCorp() — usuario-campo-16`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-017 — `fechaContratacion() — usuario-campo-17 (tipo date)`.**
  - **Pasos:** localizar el control; probar fecha/hora: vacío, fecha imposible, año bisiesto, rango invertido, mismo día y límite de periodo Lima; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

- [ ] **M06-CAM-018 — `cargo() — usuario-campo-18`.**
  - **Pasos:** localizar el control; probar texto/valor: vacío, solo espacios, Unicode, longitud 1/límite/límite+1, pegado, limpieza y contenido especial como texto literal; disparar blur y envío/consulta; corregir; guardar o filtrar y recargar. Repetir payload inválido directamente en API para campos persistidos.
  - **Esperado:** valor válido conservado o filtro exacto; inválido rechazado según contrato, mensaje junto al control, sin pérdida de otros datos ni petición mutante aceptada. No confundir cero con vacío.
  - **Resultado / límites usados / evidencia:** pendiente.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M06-ACC-001 — `onClose()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-002 — `setTab($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-003 — `onPermissionParent($event.tree, $event.checked)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-004 — `onPermissionChild($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-005 — `onFotoFile($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-006 — `onSave()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-007 — `openModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-008 — `onSearchChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-009 — `onRoleFilterChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-010 — `clearFilters()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-011 — `refetchUsers()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-012 — `rowAction(u, 'editar')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-013 — `rowAction(u, 'eliminar')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-014 — `rowAction(u, 'permisos')`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-015 — `onPageChange($event)`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-016 — `closeModal()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-017 — `closeDeleteConfirm()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M06-ACC-018 — `confirmDelete()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `listEstablishmentSeries`, `createUser`, `updateUser`, `listEstablishmentsAll`, `getPermissionMenuTrees`, `getRoleTemplates`, `fetchObjectUrl`, `upload`, `listUsers`, `deleteUser`.

- [ ] **M06-API-001 — `listEstablishmentSeries`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-002 — `createUser`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-003 — `updateUser`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-004 — `listEstablishmentsAll`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-005 — `getPermissionMenuTrees`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-006 — `getRoleTemplates`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-007 — `fetchObjectUrl`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-008 — `upload`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-009 — `listUsers`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M06-API-010 — `deleteUser`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M06-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M06-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M06-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M06-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M06-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M06-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M06-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M06-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M06-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M06-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M06-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M06-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M06-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M06-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M06-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M06-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M06-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M06-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M06-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M06-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M06-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [usuario-form-modal.component.html](../../../front-factofarm/src/app/modules/admin/pages/usuarios/usuario-form-modal/usuario-form-modal.component.html)
- [usuario-form-modal.component.ts](../../../front-factofarm/src/app/modules/admin/pages/usuarios/usuario-form-modal/usuario-form-modal.component.ts)
- [usuarios.component.html](../../../front-factofarm/src/app/modules/admin/pages/usuarios/usuarios.component.html)
- [usuarios.component.ts](../../../front-factofarm/src/app/modules/admin/pages/usuarios/usuarios.component.ts)
- [API: audit.controller.ts](../../src/modules/audit/audit.controller.ts) — DTO, permisos y estados de respuesta del contrato.
- [Servicio: directory-api.service.spec.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.spec.ts) — URLs y payloads de las operaciones anteriores.
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M06-DTO-001 — CreateUserDto.nombre.** Reglas declaradas: `@IsString() @IsNotEmpty() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-002 — CreateUserDto.email.** Reglas declaradas: `@IsEmail() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-003 — CreateUserDto.password.** Reglas declaradas: `@IsString() @MinLength(8) @MaxLength(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-004 — CreateUserDto.role.** Reglas declaradas: `@IsEnum(UserRole)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-005 — CreateUserDto.establecimientoId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-006 — CreateUserDto.tenantId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-007 — CreateUserDto.profile.** Reglas declaradas: `@IsOptional() @ValidateNested()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-008 — CreateUserDto.permissionCodes.** Reglas declaradas: `@IsOptional() @IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/create-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-009 — UserProfileDto.tipoDocumento.** Reglas declaradas: `@IsOptional() @IsEnum(IdentityDocumentType)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-010 — UserProfileDto.numeroDocumento.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(20) @IsPeruDocument()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-011 — UserProfileDto.nombres.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-012 — UserProfileDto.apellidos.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-013 — UserProfileDto.fechaNacimiento.** Reglas declaradas: `@IsOptional() @IsDate()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-014 — UserProfileDto.emailPersonal.** Reglas declaradas: `@IsOptional() @IsEmail() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-015 — UserProfileDto.direccion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(250)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-016 — UserProfileDto.celularPersonal.** Reglas declaradas: `@ValidateIf((_, v) => v != null && String(v).trim() !== '') @IsString() @MaxLength(30) @Matches(/^\+?\d{7,15}$/, { message: 'Celular personal no válido (use dígitos, 7 a 15).', })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-017 — UserProfileDto.emailCorporativo.** Reglas declaradas: `@IsOptional() @IsEmail() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-018 — UserProfileDto.celularCorporativo.** Reglas declaradas: `@ValidateIf((_, v) => v != null && String(v).trim() !== '') @IsString() @MaxLength(30) @Matches(/^\+?\d{7,15}$/, { message: 'Celular corporativo no válido (use dígitos, 7 a 15).', })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-019 — UserProfileDto.fechaContratacion.** Reglas declaradas: `@IsOptional() @IsDate()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-020 — UserProfileDto.cargo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-021 — UserProfileDto.fotoUrl.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2048)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-022 — UserProfileDto.fotoArchivoId.** Reglas declaradas: `@ValidateIf((_, v) => v !== undefined && v !== null) @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-profile.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-023 — UpdateUserDto.nombre.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-024 — UpdateUserDto.email.** Reglas declaradas: `@IsOptional() @IsEmail() @MaxLength(150)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-025 — UpdateUserDto.password.** Reglas declaradas: `@IsOptional() @IsString() @MinLength(8) @MaxLength(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-026 — UpdateUserDto.role.** Reglas declaradas: `@IsOptional() @IsEnum(UserRole)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-027 — UpdateUserDto.establecimientoId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-028 — UpdateUserDto.profile.** Reglas declaradas: `@IsOptional() @ValidateNested()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-029 — UpdateUserDto.permissionCodes.** Reglas declaradas: `@IsOptional() @IsArray() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-030 — UpdateUserPermissionsDto.permissionCodes.** Reglas declaradas: `@IsArray() @ArrayNotEmpty() @IsString({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/update-user-permissions.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-031 — UserListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-032 — UserListQueryDto.role.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-033 — UserListQueryDto.tenantId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/users/application/dto/user-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-034 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M06-DTO-035 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
