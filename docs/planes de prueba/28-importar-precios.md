# Plan de pruebas: Importar Precios

- **Menú:** Productos/Servicios → Importar Precios.
- **Ruta:** `/importar-precios`.
- **Permiso de navegación:** `nav.importar_precios`. Verificar además permisos de operación; mostrar el menú no autoriza toda escritura.
- **Fecha de revisión del código:** 2026-09-20.
- **Estado inicial:** todos los casos pendientes; este documento no acredita ejecución.
- **Guía obligatoria:** [criterios comunes](00-criterios-comunes.md), [flujos integrales](00-flujos-integrales.md) e [índice](README.md).

## Preparación y registro

Usar entorno QA con tenant A, tenant B, dos establecimientos de A y usuarios autorizado, lector y sin permiso. Preparar datos `QA-importar-precios-*`, conjunto vacío, una fila y más de dos páginas cuando exista listado. Registrar versión de frontend/API, fecha, navegador, viewport, rol, tenant y establecimiento. No usar datos personales reales ni enviar comprobantes de prueba a producción.

Marcar cada casilla al **ejecutar** el caso, no al darlo por aprobado. Añadir `Resultado: PASÓ / FALLÓ / BLOQUEADO / N/A; evidencia: …; incidencia: …`. N/A exige motivo y validación; un control ausente que se esperaba no se da por aprobado. Cada variante de un caso se registra por separado.

## Pantalla y controles identificados

Etiquetas observadas: `Archivo XLS`.

Botones/textos observados: `Formato Precios-Productos`, `Cancelar`, `{{ uploadMutation.isPending() ? 'Subiendo…' : 'Subir' }}`. Los textos con interpolaciones se contrastan con su valor visible durante ejecución.

## Flujos específicos y reglas de negocio

- [ ] **M28-NEG-01 — Plantilla y columnas (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Descargar plantilla XLS; importar producto existente con nuevo precio, código inexistente y columna faltante.
  - **Esperado:** Solo se modifican productos identificados; se informa error por fila o archivo sin éxito ficticio.
  - **Resultado / evidencia / incidencia:** pendiente.

- [ ] **M28-NEG-02 — Exactitud y reintento (P1; P0 si afecta stock, dinero o aislamiento).**
  - **Pasos y datos:** Importar decimales con punto/coma, cero, negativo, moneda diferente y fila repetida; reintentar archivo.
  - **Esperado:** Decimales no cambian de escala, precios inválidos no se aplican y el reintento no duplica registros ni toca stock.
  - **Resultado / evidencia / incidencia:** pendiente.

## Cada campo y sus validaciones

Cada renglón corresponde a un control enlazado en las plantillas, incluidos formularios secundarios. Ubicarlo por etiqueta visible y enlace técnico. Repetir en alta y edición cuando existan. Aplicar las variantes **V01–V12** de la guía: registrar cada límite real del schema/DTO antes de probarlo; no inventar máximos. Para filtros se comprueba consulta y limpieza, no se exige guardar.

No se detectaron entradas simples en la plantilla local. Revisar controles compartidos, tarjetas y filtros dinámicos mediante las acciones y fuentes listadas; documentar controles adicionales encontrados en ejecución.

## Cada acción, pestaña y formulario secundario

Las expresiones identifican el control exacto en la plantilla. Ejecutar **cada variante visible** si una expresión recibe fila, pestaña, estado o tipo dinámico. Para cerrar/cancelar se espera ausencia de escritura; para búsqueda/paginación, solo consulta; para mutaciones, una sola operación persistida. Los casos de negocio anteriores definen el efecto funcional.

- [ ] **M28-ACC-001 — `downloadTemplate()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M28-ACC-002 — `clearFile()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

- [ ] **M28-ACC-003 — `submitUpload()`.**
  - **Pasos:** activar el control con datos válidos; verificar pantalla/modal destino y estado inicial. Repetir con selección vacía o registro no disponible, cancelar si hay confirmación, confirmar una vez y repetir con doble clic/tecla; recargar.
  - **Esperado:** efecto corresponde al control y al registro seleccionado, carga/error visibles y sin acciones duplicadas. Modal enfoca su contenido y devuelve foco al disparador; cancelar no confirma. Acciones no permitidas no se ejecutan por API.
  - **Resultado / variante / evidencia:** pendiente.

## Integración y contrato de la API

Operaciones referenciadas por los componentes: `importProducts`, `downloadProductImportTemplate`.

- [ ] **M28-API-001 — `importProducts`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

- [ ] **M28-API-002 — `downloadProductImportTemplate`.** Capturar solicitud desde la UI y registrar método, URL, parámetros, cuerpo y respuesta sin secretos. Repetir con datos válidos, requerido omitido/null, tipo incorrecto, ID inexistente y de tenant B; usar token vencido y usuario sin permiso. **Esperado:** contrato del DTO respetado, error 4xx pertinente sin fuga, operación autorizada persistente y atomicidad en fallos; consultas no escriben. Para listas contrastar filtros/paginación; para descargas, contenido y autorización. **Resultado/evidencia:** pendiente.

## Checklist común aplicado a este menú

Estos casos se ejecutan aquí aunque ya se hayan probado en otro módulo. Detalle de variantes, pasos y criterios en la guía común.

- [ ] **M28-NAV01** — Abrir desde sidebar, URL directa, recargar y volver/avanzar; ruta, título y selección correctos. **Resultado/evidencia:** pendiente.
- [ ] **M28-NAV02** — Probar autorizado, lector, sin permiso y permiso revocado; controles y API coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M28-DAT01** — Listado vacío, una fila, muchas filas, valores largos y campos opcionales nulos; sin datos ficticios. **Resultado/evidencia:** pendiente.
- [ ] **M28-DAT02** — Cada filtro solo y combinado, limpiar, búsqueda rápida y respuesta fuera de orden; resultado de la consulta más reciente. **Resultado/evidencia:** pendiente.
- [ ] **M28-DAT03** — Primera/última página y eliminación de última fila; totales/paginación sin duplicados. **Resultado/evidencia:** pendiente.
- [ ] **M28-UI01** — Revisar tipografía, alineación, espaciado, colores, estados activos/deshabilitados, iconos y mensajes. **Resultado/evidencia:** pendiente.
- [ ] **M28-UI02** — Abrir cada modal/pestaña, contenido largo, scroll, Escape/backdrop y cancelar; datos y foco coherentes. **Resultado/evidencia:** pendiente.
- [ ] **M28-RWD01** — Ejecutar recorrido completo a 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. **Resultado/evidencia:** pendiente.
- [ ] **M28-RWD02** — Probar límites 639/640, 767/768, 1023/1024, 1279/1280 y 1535/1536; girar orientación. **Resultado/evidencia:** pendiente.
- [ ] **M28-RWD03** — Probar tabla/cards, menú de fila, dropdown y pie de modal con teclado virtual y altura 568 px. **Resultado/evidencia:** pendiente.
- [ ] **M28-A11Y01** — Completar con Tab/Shift+Tab/Enter/Espacio/Escape; foco visible, orden correcto, sin trampas. **Resultado/evidencia:** pendiente.
- [ ] **M28-A11Y02** — Lectura de etiquetas/errores y botones de icono; zoom 200%/400%, contraste y objetivos táctiles. **Resultado/evidencia:** pendiente.
- [ ] **M28-ERR01** — Carga lenta, sin red, timeout y 500; mensaje claro, reintento útil y sin pérdida/duplicado. **Resultado/evidencia:** pendiente.
- [ ] **M28-ERR02** — 400/401/403/404/409/422/429 según contrato; conservar datos recuperables sin éxito ficticio. **Resultado/evidencia:** pendiente.
- [ ] **M28-SEC01** — Manipular IDs, tenant, establecimiento y archivo de otra cuenta; no leer ni modificar recursos ajenos. **Resultado/evidencia:** pendiente.
- [ ] **M28-SEC02** — Texto HTML/script se muestra inerte; payload extra no altera rol/propiedad; sin secretos en consola/URL. **Resultado/evidencia:** pendiente.
- [ ] **M28-CON01** — Dos sesiones editan o procesan el mismo recurso; no sobrescritura crítica silenciosa ni efecto doble. **Resultado/evidencia:** pendiente.
- [ ] **M28-PER01** — Datos de volumen, filtrado rápido y navegación repetida; medir tiempos y no acumular solicitudes/listeners. **Resultado/evidencia:** pendiente.
- [ ] **M28-INT01** — Reabrir sesión y revisar módulos consumidores, reportes y auditoría; persistencia y alcance correctos. **Resultado/evidencia:** pendiente.
- [ ] **M28-EXP01** — Si hay importación/exportación/impresión, ejecutar todos sus formatos y variantes F01–F08. **Resultado/evidencia:** pendiente.
- [ ] **M28-BRS01** — Recorrido principal en Chrome, Edge, Firefox, Safari/iOS y Chrome/Android disponibles; registrar versiones y bloqueos. **Resultado/evidencia:** pendiente.

## Fuentes y trazabilidad

- [importar-precios.component.html](../../../front-factofarm/src/app/modules/admin/pages/importar-precios/importar-precios.component.html)
- [importar-precios.component.ts](../../../front-factofarm/src/app/modules/admin/pages/importar-precios/importar-precios.component.ts)
- [Servicio: directory-api.service.ts](../../../front-factofarm/src/app/modules/admin/services/directory-api.service.ts) — URLs y payloads de las operaciones anteriores.

## Límites y validadores declarados en los contratos relacionados

Referencia literal del código para concretar V01–V12. Algunos controladores comparten DTO con otras opciones: ejecutar cada regla en la operación de este menú que use ese DTO; anotar N/A justificado si corresponde exclusivamente a otra opción. `IsOptional` cambia el tratamiento de ausencias; los DTO de actualización pueden heredar reglas mediante `PartialType`. Revisar también validadores personalizados y reglas de servicio; esta lista no sustituye los casos funcionales.

- [ ] **M28-DTO-001 — CreateProductLocationDto.establishmentId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product-location.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-002 — CreateProductLocationDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product-location.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-003 — ProductWarehousePriceInputDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-004 — ProductWarehousePriceInputDto.precio.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-005 — ProductWarehouseStockInputDto.warehouseId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-006 — ProductWarehouseStockInputDto.cantidad.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-007 — ProductPresentationInputDto.codigoBarra.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-008 — ProductPresentationInputDto.unitId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-009 — ProductPresentationInputDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-010 — ProductPresentationInputDto.factor.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-011 — ProductPresentationInputDto.precio1.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-012 — ProductPresentationInputDto.precio2.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-013 — ProductPresentationInputDto.precio3.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-014 — ProductPresentationInputDto.precioDefecto.** Reglas declaradas: `@IsOptional() @IsEnum(PresentationDefaultPrice)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-015 — ProductPresentationInputDto.precioPuntos.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-016 — ProductAttributeInputDto.attributeTypeId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-017 — ProductAttributeInputDto.descripcion.** Reglas declaradas: `@IsString() @MaxLength(500)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-018 — CreateProductDto.nombre.** Reglas declaradas: `@IsString() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-019 — CreateProductDto.descripcion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(2000)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-020 — CreateProductDto.principioActivo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(300)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-021 — CreateProductDto.concentracion.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-022 — CreateProductDto.registroSanitario.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-023 — CreateProductDto.registroSanitarioVigencia.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-024 — CreateProductDto.formaFarmaceutica.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-025 — CreateProductDto.codigoBusqueda.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-026 — CreateProductDto.codigoInterno.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-027 — CreateProductDto.codigoBarra.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-028 — CreateProductDto.codigoSunat.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(20)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-029 — CreateProductDto.codigoMedicamentoDigemid.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(80)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-030 — CreateProductDto.lineaProducto.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-031 — CreateProductDto.modelo.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(120)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-032 — CreateProductDto.marcaLaboratorio.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(200)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-033 — CreateProductDto.unitId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-034 — CreateProductDto.currencyId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-035 — CreateProductDto.saleTaxAffectationId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-036 — CreateProductDto.purchaseTaxAffectationId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-037 — CreateProductDto.precioUnitarioVenta.** Reglas declaradas: `@IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-038 — CreateProductDto.precioUnitarioCompra.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-039 — CreateProductDto.incluyeIgvVenta.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-040 — CreateProductDto.incluyeIgvCompra.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-041 — CreateProductDto.generico.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-042 — CreateProductDto.esControlado.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-043 — CreateProductDto.esRefrigerado.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-044 — CreateProductDto.esHospitalario.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-045 — CreateProductDto.necesitaRecetaMedica.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-046 — CreateProductDto.calcularCantidadPorPrecio.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-047 — CreateProductDto.manejaLotes.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-048 — CreateProductDto.incluyeIscVenta.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-049 — CreateProductDto.incluyeIscCompra.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-050 — CreateProductDto.tipoSistemaIscId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-051 — CreateProductDto.porcentajeIsc.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-052 — CreateProductDto.codigoLote.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-053 — CreateProductDto.fechaVencimientoLote.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-054 — CreateProductDto.sujetoDetraccion.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-055 — CreateProductDto.sePuedeCanjearPorPuntos.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-056 — CreateProductDto.numeroPuntos.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-057 — CreateProductDto.aplicaGanancia.** Reglas declaradas: `@IsOptional() @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-058 — CreateProductDto.porcentajeGanancia.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-059 — CreateProductDto.costoUnitario.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-060 — CreateProductDto.stockMinimo.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-061 — CreateProductDto.stockMaximo.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-062 — CreateProductDto.administrationRouteId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-063 — CreateProductDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-064 — CreateProductDto.brandId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-065 — CreateProductDto.productLocationId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-066 — CreateProductDto.defaultWarehouseId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-067 — CreateProductDto.imagenArchivoId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-068 — CreateProductDto.warehousePrices.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-069 — CreateProductDto.warehouseStocks.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-070 — CreateProductDto.presentations.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-071 — CreateProductDto.attributes.** Reglas declaradas: `@IsOptional() @IsArray() @ValidateNested({ each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/create-product.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-072 — ImportProductsDto.mode.** Reglas declaradas: `@IsIn(productImportModes)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/import-products.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-073 — ProductListQueryDto.search.** Reglas declaradas: `@IsOptional() @IsString()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-074 — ProductListQueryDto.field.** Reglas declaradas: `@IsOptional() @IsIn(['all', 'nombre', 'codigoInterno', 'codigoBarra', 'codigoBusqueda', 'descripcion'])`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-075 — ProductListQueryDto.categoryId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-076 — ProductListQueryDto.brandId.** Reglas declaradas: `@IsOptional() @IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-077 — ProductListQueryDto.habilitado.** Reglas declaradas: `@IsOptional() @Transform(({ value }) => value === 'true' \|\| value === true) @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-078 — ProductListQueryDto.generico.** Reglas declaradas: `@IsOptional() @Transform(({ value }) => value === 'true' \|\| value === true) @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-079 — ProductListQueryDto.necesitaRecetaMedica.** Reglas declaradas: `@IsOptional() @Transform(({ value }) => value === 'true' \|\| value === true) @IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-080 — ProductListQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-081 — ProductListQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/product-list-query.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-082 — PaginationQueryDto.page.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-083 — PaginationQueryDto.pageSize.** Reglas declaradas: `@IsOptional() @IsInt() @Min(1) @Max(100)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/common/dto/pagination.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-084 — UpdateProductBarcodeDto.codigoBarra.** Reglas declaradas: `@IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/update-product-barcode.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-085 — UpdateProductStatusDto.habilitado.** Reglas declaradas: `@IsBoolean()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/update-product-status.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-086 — SetProductEquivalentsDto.equivalentProductIds.** Reglas declaradas: `@IsArray() @ArrayUnique() @IsUUID('4', { each: true })`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/set-product-equivalents.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-087 — UpsertProductSupplierDto.supplierId.** Reglas declaradas: `@IsUUID()`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/upsert-product-supplier.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-088 — UpsertProductSupplierDto.codigoProveedor.** Reglas declaradas: `@IsOptional() @IsString() @MaxLength(60)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/upsert-product-supplier.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-089 — UpsertProductSupplierDto.precioCompra.** Reglas declaradas: `@IsOptional() @IsNumber() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/upsert-product-supplier.dto.ts). **Resultado/evidencia:** pendiente.

- [ ] **M28-DTO-090 — UpsertProductSupplierDto.plazoDias.** Reglas declaradas: `@IsOptional() @IsInt() @Min(0)`. Probar valor válido y una violación por regla; para cada mínimo/máximo ejecutar debajo, exactamente y encima, tanto por formulario como petición directa. **Esperado:** contrato respetado sin modificar datos en rechazo; registrar diferencias UI/API. [Fuente](../../src/modules/products/dto/upsert-product-supplier.dto.ts). **Resultado/evidencia:** pendiente.


## Cierre de ejecución

- [ ] Se ejecutaron todas las variantes de campos/acciones y matriz responsive; N/A justificados.
- [ ] Se adjuntaron capturas por viewport, solicitudes sanitizadas y comprobación de persistencia.
- [ ] Fallos enlazados a incidencias con reproducción, esperado y obtenido; correcciones reprobadas.
- [ ] Casos P0/P1 aprobados; bloqueos y dependencias externas explícitos.
- [ ] Datos QA identificados y retirados/revertidos según procedimiento del entorno, sin eliminar historial necesario para evidencia.
