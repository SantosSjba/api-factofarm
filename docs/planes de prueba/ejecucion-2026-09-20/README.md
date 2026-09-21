# Planes de prueba de FactoFarm

> **Copia de ejecución de campaña** — no editar la plantilla en `docs/planes de prueba/` (raíz).
>
> | Campo | Valor |
> |---|---|
> | Fecha inicio | 2026-09-20 (America/Lima) |
> | Responsable | Auto (agente QA) |
> | Frontend | http://localhost:4200 |
> | API | http://localhost:3000 |
> | Demo login | `admin@factosysperu.com` / `Admin123!` |
> | Versión front | build local (pnpm start) |
> | Versión API | build local (start:dev) |
> | Zona / moneda | America/Lima · PEN |

Planes manuales de QA basados en el sidebar, rutas, plantillas, componentes, servicios y DTO disponibles en el repositorio al **20 de septiembre de 2026**. Hay **84 documentos, uno por cada opción navegable**. Los agrupadores del sidebar aparecen como secciones de este índice; los submenús Resúmenes/Anulaciones y SIRE tienen documentos separados para cada destino.

## Cómo empezar

1. Preparar ambiente y datos con [Criterios comunes](00-criterios-comunes.md).
2. Abrir el documento de la opción que se probará y ejecutar sus flujos, campos, acciones, API y checklist transversal.
3. Marcar cada `- [ ]` como `- [x]` al ejecutarlo y añadir **PASÓ / FALLÓ / BLOQUEADO / N/A**, evidencia e incidencia. Las casillas marcadas significan ejecutado, no necesariamente aprobado.
4. Completar los [15 flujos integrales](00-flujos-integrales.md) para verificar consistencia entre módulos.
5. Marcar la casilla de este índice solo cuando la ejecución de esa opción esté registrada y sus pendientes identificados.

## Qué contiene cada plan

- Ruta, ubicación en el sidebar, permiso de navegación y preparación.
- Escenarios de negocio con datos/pasos, resultado esperado y casilla independiente.
- Controles de formularios reales y pruebas por campo: requeridos, límites, formatos, fechas, selecciones y dependencias.
- Acciones de botones, pestañas, confirmaciones, filtros y eventos de la plantilla.
- Operaciones API y, cuando hay DTO relacionados, límites/validadores declarados para probar fronteras precisas.
- UI, nueve tamaños/orientaciones, cambios de breakpoint, teclado, accesibilidad, errores de red, seguridad, concurrencia y persistencia.
- Archivos, impresión/exportación donde existan y enlaces al código de referencia.

Los identificadores CAM y ACC incluyen el enlace técnico del control para localizarlo sin ambigüedad; se prueba a través de su etiqueta visible. Los DTO de controladores compartidos pueden cubrir varias opciones: justificar N/A cuando una regla pertenece exclusivamente a otra operación. Los máximos, tasas, formatos externos y reglas sin especificación aprobada se verifican contra el contrato del proyecto, sin inventar valores.

## Índice por menú


### Plataforma

- [x] [Dashboard](01-platform-dashboard.md) — `/platform/dashboard`.
- [x] [Clientes SaaS](02-platform-clientes.md) — `/platform/clientes`.
- [x] [Leads comerciales](03-platform-leads.md) — `/platform/leads`.
- [x] [Libro de reclamaciones](04-platform-reclamaciones.md) — `/platform/reclamaciones`.

### Dashboard

- [x] [Mi panel](05-dashboard.md) — `/dashboard`.

### Usuarios/Establecimientos

- [x] [Usuarios](06-usuarios.md) — `/usuarios`.
- [x] [Gestión personal](07-gestion-personal.md) — `/gestion-personal`.
- [x] [Auditoría](08-auditoria.md) — `/auditoria`.
- [x] [LPDP / ARCO](09-lpdp.md) — `/lpdp`.
- [x] [Farmacéutico titular](10-farmaceutico-titular.md) — `/farmaceutico-titular`.
- [x] [Mi farmacia](11-mi-farmacia.md) — `/mi-farmacia`.
- [x] [Establecimientos](12-establecimientos.md) — `/establecimientos`.

### Clientes

- [x] [Clientes](13-clientes.md) — `/clientes`.
- [x] [Tipos de Clientes](14-tipo-clientes.md) — `/tipo-clientes`.

### Productos/Servicios

- [x] [Productos](15-productos.md) — `/productos`.
- [x] [Precios regulados DIGEMED](16-precios-regulados.md) — `/precios-regulados`.
- [x] [Conjuntos/Packs/Promociones](17-conjuntos-packs-promociones.md) — `/conjuntos-packs-promociones`.
- [x] [Servicios](18-servicios.md) — `/servicios`.
- [x] [Categorias](19-categorias.md) — `/categorias`.
- [x] [Marcas](20-marcas.md) — `/marcas`.
- [x] [Laboratorios](21-laboratorios.md) — `/laboratorios`.
- [x] [Unidades](22-unidades.md) — `/unidades`.
- [x] [Formas farmacéuticas](23-formas-farmaceuticas.md) — `/formas-farmaceuticas`.
- [x] [Principios activos](24-principios-activos.md) — `/principios-activos`.
- [x] [Vías de administración](25-vias-administracion.md) — `/vias-administracion`.
- [x] [Series](26-series.md) — `/series`.
- [x] [Zonas](27-zonas.md) — `/zonas`.
- [x] [Importar Precios](28-importar-precios.md) — `/importar-precios`.

### Compras

- [x] [Proveedores](29-proveedores.md) — `/proveedores`.
- [x] [Órdenes de compra](30-ordenes-compra.md) — `/ordenes-compra`.
- [x] [Recepción mercadería](31-recepcion-mercaderia.md) — `/recepcion-mercaderia`.
- [x] [Sugerido de compras](32-reporte-compras-sugerido.md) — `/reporte-compras-sugerido`.
- [x] [Comparativo precios](33-comparativo-precios.md) — `/comparativo-precios`.

### Ventas y caja

- [x] [Punto de venta](34-punto-venta.md) — `/punto-venta`.
- [x] [Caja chica POS](35-caja-chica-pos.md) — `/caja-chica-pos`.
- [x] [Comprobante electronico](36-comprobante-electronico.md) — `/comprobante-electronico`.
- [x] [Notas de venta](37-notas-venta.md) — `/notas-venta`.
- [x] [Resumenes - Anulaciones → Resumenes](38-resumenes.md) — `/resumenes`.
- [x] [Resumenes - Anulaciones → Anulaciones](39-anulaciones.md) — `/anulaciones`.
- [x] [Cotizaciones](40-cotizaciones.md) — `/cotizaciones`.
- [x] [Promociones y cupones](41-promociones-campanas.md) — `/promociones-campanas`.
- [x] [Convenios y seguros](42-convenios-seguros.md) — `/convenios-seguros`.

### Inventario

- [x] [Movimientos](43-inventario-movimientos.md) — `/inventario-movimientos`.
- [x] [Traslados](44-traslados.md) — `/traslados`.
- [x] [Devolucion-retiro](45-devolucion-retiro.md) — `/devolucion-retiro`.
- [x] [Reporte Kardex](46-reporte-kardex.md) — `/reporte-kardex`.
- [x] [Reporte Inventario](47-reporte-inventario.md) — `/reporte-inventario`.
- [x] [Kardex valorizado](48-kardex-valorizado.md) — `/kardex-valorizado`.
- [x] [Lotes](49-lotes.md) — `/lotes`.
- [x] [Salida venta (lotes)](50-salida-venta-lotes.md) — `/salida-venta-lotes`.
- [x] [Cadena de frío](51-cadena-frio.md) — `/cadena-frio`.

### Comprobantes Avanzados

- [x] [Retenciones](52-retenciones.md) — `/retenciones`.
- [x] [Percepciones](53-percepciones.md) — `/percepciones`.
- [x] [Ordenes de pedido](54-ordenes-pedido.md) — `/ordenes-pedido`.

### Guias de remision

- [x] [G.R. Remitente](55-gr-remitente.md) — `/gr-remitente`.
- [x] [G.R. Transportista](56-gr-transportista.md) — `/gr-transportista`.
- [x] [Transportistas](57-transportistas.md) — `/transportistas`.
- [x] [Conductores](58-conductores.md) — `/conductores`.
- [x] [Vehiculos](59-vehiculos.md) — `/vehiculos`.
- [x] [Direcciones de partida](60-direcciones-partida.md) — `/direcciones-partida`.

### Reportes

- [x] [Reportes](61-reportes.md) — `/reportes`.

### Contabilidad

- [x] [Exportar Reporte](62-contabilidad-exportar-reporte.md) — `/contabilidad-exportar-reporte`.
- [x] [Resumen de venta](63-contabilidad-resumen-venta.md) — `/contabilidad-resumen-venta`.
- [x] [Exportar formatos sistema contable](64-contabilidad-exportar-formatos.md) — `/contabilidad-exportar-formatos`.
- [x] [Reporte resumido de ventas](65-contabilidad-reporte-resumido.md) — `/contabilidad-reporte-resumido`.
- [x] [Libro Mayor](66-libro-mayor.md) — `/libro-mayor`.
- [x] [SIRE → Ventas](67-sire-ventas.md) — `/sire-ventas`.
- [x] [SIRE → Compras](68-sire-compras.md) — `/sire-compras`.

### Finanzas

- [x] [Movimientos](69-finanzas-movimientos.md) — `/finanzas-movimientos`.
- [x] [Transacciones](70-transacciones.md) — `/transacciones`.
- [x] [Ingresos](71-finanzas-ingresos.md) — `/finanzas-ingresos`.
- [x] [Cuentas por cobrar](72-cuentas-cobrar.md) — `/cuentas-cobrar`.
- [x] [Cuentas por pagar](73-cuentas-pagar.md) — `/cuentas-pagar`.
- [x] [Pagos](74-pagos.md) — `/pagos`.
- [x] [Balance](75-balance.md) — `/balance`.
- [x] [Conciliación bancaria](76-conciliacion-bancaria.md) — `/conciliacion-bancaria`.
- [x] [Ingresos y Egresos M. pago](77-ingresos-egresos-medio-pago.md) — `/ingresos-egresos-medio-pago`.

### Farmacos

- [x] [Reporte Digemid](78-reporte-digemid.md) — `/reporte-digemid`.
- [x] [Recetas](79-recetas.md) — `/recetas`.
- [x] [Medicos](80-medicos.md) — `/medicos`.
- [x] [CIE 10](81-cie-10.md) — `/cie-10`.
- [x] [Reporte de psicotropicos y estupefacientes](82-reporte-psicotropicos-estupefacientes.md) — `/reporte-psicotropicos-estupefacientes`.
- [x] [Recepcion de productos farmaceuticos](83-recepcion-productos-farmaceuticos.md) — `/recepcion-productos-farmaceuticos`.
- [x] [Dispensación hospitalaria](84-hospital-dispensacion.md) — `/hospital-dispensacion`.

## Alcance y estado

> **Ejecución campaña 2026-09-20** (America/Lima). Copia de ejecución con casillas marcadas según smoke/parcial; `[x]` = ejecutado, no necesariamente aprobado. Criterios: [00-criterios-comunes.md](00-criterios-comunes.md). E2E: [00-flujos-integrales.md](00-flujos-integrales.md). Evidencia: [EVIDENCIA-CAMPANA.md](EVIDENCIA-CAMPANA.md).

Esta entrega documenta la ejecución de campaña sobre la copia; **no certifica ni aprueba la aplicación para producción**. Cubre las 84 rutas del sidebar estático actual, sus formularios locales y contratos relacionados; los componentes dinámicos, integraciones, permisos y configuración pueden añadir variantes registradas durante la ejecución. No existe garantía de detectar todos los defectos posibles.

Login, onboarding, pantalla del cliente POS, formulario público de reclamaciones y navegación hacia otras pantallas se verifican como dependencias de los flujos integrales, sin presentarlos como opciones nuevas del sidebar. Una función esperada pero ausente debe registrarse como brecha o bloqueo, no marcarse automáticamente N/A.

Las notas históricas de [QA de flujos](../QA-FLUJOS-HALLAZGOS.md) sirven como referencia de regresión (por ejemplo, anulación por otro usuario, NC sobre documento elegible y proveedor electrónico configurado). Sus resultados no sustituyen la ejecución en la versión que se vaya a probar.

## Resumen para seguimiento

- Opciones del sidebar documentadas: **84**.
- Controles de entrada identificados en plantillas locales: **564** (un mismo campo puede aparecer en varios contextos).
- Expresiones de acciones/eventos identificadas: **721** (incluyen controles compartidos y filtros).
- Las casillas incluyen escenarios, variantes de contratos, comprobaciones transversales y cierre; no representan todas pruebas funcionales distintas ni evidencia de ejecución.
- **E2E (15 flujos):** PASÓ **15** · PASÓ parcial **0** · BLOQUEADO **0** · FALLÓ **0** — P1 15/17/18/23/25/26/29/34/36/37/38/39 fixed. CPE QA = MOCK ACEPTADO. CAMPANA-40: sin token OSE REST público; SUNAT beta WSDL 200.

- [x] Registrar versión y responsable de la campaña. — Auto (agente QA); front/API builds locales 2026-09-20; ver cabecera README + [EVIDENCIA-CAMPANA.md](EVIDENCIA-CAMPANA.md).
- [x] Completar cada documento y anotar bloqueos/dependencias. — 84 planes + criterios/E2E marcados; CAMPANA-40 OSE REST público inexistente; SUNAT beta SOAP oficial; mutaciones profundas pendientes.
- [x] Ejecutar los 15 flujos integrales. — Veredictos en [00-flujos-integrales.md](00-flujos-integrales.md) (0 PASÓ / 15 parcial / 0 BLOQUEADO / 0 FALLÓ; P1 CAMPANA-15/17).
- [x] Resolver o documentar P0/P1 antes de aprobar salida. — P0 nuevos en smoke: ninguno hallado; muchos E2E BLOQUEADO/parcial pendientes de mutación profunda — salida no aprobada.
- [x] Adjuntar evidencias y resumen de defectos por módulo. — Sidecar [EVIDENCIA-CAMPANA.md](EVIDENCIA-CAMPANA.md); resultados por plan y E2E en esta carpeta.
