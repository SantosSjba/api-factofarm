# Planes de prueba de FactoFarm

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

- [ ] [Dashboard](01-platform-dashboard.md) — `/platform/dashboard`.
- [ ] [Clientes SaaS](02-platform-clientes.md) — `/platform/clientes`.
- [ ] [Leads comerciales](03-platform-leads.md) — `/platform/leads`.
- [ ] [Libro de reclamaciones](04-platform-reclamaciones.md) — `/platform/reclamaciones`.

### Dashboard

- [ ] [Mi panel](05-dashboard.md) — `/dashboard`.

### Usuarios/Establecimientos

- [ ] [Usuarios](06-usuarios.md) — `/usuarios`.
- [ ] [Gestión personal](07-gestion-personal.md) — `/gestion-personal`.
- [ ] [Auditoría](08-auditoria.md) — `/auditoria`.
- [ ] [LPDP / ARCO](09-lpdp.md) — `/lpdp`.
- [ ] [Farmacéutico titular](10-farmaceutico-titular.md) — `/farmaceutico-titular`.
- [ ] [Mi farmacia](11-mi-farmacia.md) — `/mi-farmacia`.
- [ ] [Establecimientos](12-establecimientos.md) — `/establecimientos`.

### Clientes

- [ ] [Clientes](13-clientes.md) — `/clientes`.
- [ ] [Tipos de Clientes](14-tipo-clientes.md) — `/tipo-clientes`.

### Productos/Servicios

- [ ] [Productos](15-productos.md) — `/productos`.
- [ ] [Precios regulados DIGEMED](16-precios-regulados.md) — `/precios-regulados`.
- [ ] [Conjuntos/Packs/Promociones](17-conjuntos-packs-promociones.md) — `/conjuntos-packs-promociones`.
- [ ] [Servicios](18-servicios.md) — `/servicios`.
- [ ] [Categorias](19-categorias.md) — `/categorias`.
- [ ] [Marcas](20-marcas.md) — `/marcas`.
- [ ] [Laboratorios](21-laboratorios.md) — `/laboratorios`.
- [ ] [Unidades](22-unidades.md) — `/unidades`.
- [ ] [Formas farmacéuticas](23-formas-farmaceuticas.md) — `/formas-farmaceuticas`.
- [ ] [Principios activos](24-principios-activos.md) — `/principios-activos`.
- [ ] [Vías de administración](25-vias-administracion.md) — `/vias-administracion`.
- [ ] [Series](26-series.md) — `/series`.
- [ ] [Zonas](27-zonas.md) — `/zonas`.
- [ ] [Importar Precios](28-importar-precios.md) — `/importar-precios`.

### Compras

- [ ] [Proveedores](29-proveedores.md) — `/proveedores`.
- [ ] [Órdenes de compra](30-ordenes-compra.md) — `/ordenes-compra`.
- [ ] [Recepción mercadería](31-recepcion-mercaderia.md) — `/recepcion-mercaderia`.
- [ ] [Sugerido de compras](32-reporte-compras-sugerido.md) — `/reporte-compras-sugerido`.
- [ ] [Comparativo precios](33-comparativo-precios.md) — `/comparativo-precios`.

### Ventas y caja

- [ ] [Punto de venta](34-punto-venta.md) — `/punto-venta`.
- [ ] [Caja chica POS](35-caja-chica-pos.md) — `/caja-chica-pos`.
- [ ] [Comprobante electronico](36-comprobante-electronico.md) — `/comprobante-electronico`.
- [ ] [Notas de venta](37-notas-venta.md) — `/notas-venta`.
- [ ] [Resumenes - Anulaciones → Resumenes](38-resumenes.md) — `/resumenes`.
- [ ] [Resumenes - Anulaciones → Anulaciones](39-anulaciones.md) — `/anulaciones`.
- [ ] [Cotizaciones](40-cotizaciones.md) — `/cotizaciones`.
- [ ] [Promociones y cupones](41-promociones-campanas.md) — `/promociones-campanas`.
- [ ] [Convenios y seguros](42-convenios-seguros.md) — `/convenios-seguros`.

### Inventario

- [ ] [Movimientos](43-inventario-movimientos.md) — `/inventario-movimientos`.
- [ ] [Traslados](44-traslados.md) — `/traslados`.
- [ ] [Devolucion-retiro](45-devolucion-retiro.md) — `/devolucion-retiro`.
- [ ] [Reporte Kardex](46-reporte-kardex.md) — `/reporte-kardex`.
- [ ] [Reporte Inventario](47-reporte-inventario.md) — `/reporte-inventario`.
- [ ] [Kardex valorizado](48-kardex-valorizado.md) — `/kardex-valorizado`.
- [ ] [Lotes](49-lotes.md) — `/lotes`.
- [ ] [Salida venta (lotes)](50-salida-venta-lotes.md) — `/salida-venta-lotes`.
- [ ] [Cadena de frío](51-cadena-frio.md) — `/cadena-frio`.

### Comprobantes Avanzados

- [ ] [Retenciones](52-retenciones.md) — `/retenciones`.
- [ ] [Percepciones](53-percepciones.md) — `/percepciones`.
- [ ] [Ordenes de pedido](54-ordenes-pedido.md) — `/ordenes-pedido`.

### Guias de remision

- [ ] [G.R. Remitente](55-gr-remitente.md) — `/gr-remitente`.
- [ ] [G.R. Transportista](56-gr-transportista.md) — `/gr-transportista`.
- [ ] [Transportistas](57-transportistas.md) — `/transportistas`.
- [ ] [Conductores](58-conductores.md) — `/conductores`.
- [ ] [Vehiculos](59-vehiculos.md) — `/vehiculos`.
- [ ] [Direcciones de partida](60-direcciones-partida.md) — `/direcciones-partida`.

### Reportes

- [ ] [Reportes](61-reportes.md) — `/reportes`.

### Contabilidad

- [ ] [Exportar Reporte](62-contabilidad-exportar-reporte.md) — `/contabilidad-exportar-reporte`.
- [ ] [Resumen de venta](63-contabilidad-resumen-venta.md) — `/contabilidad-resumen-venta`.
- [ ] [Exportar formatos sistema contable](64-contabilidad-exportar-formatos.md) — `/contabilidad-exportar-formatos`.
- [ ] [Reporte resumido de ventas](65-contabilidad-reporte-resumido.md) — `/contabilidad-reporte-resumido`.
- [ ] [Libro Mayor](66-libro-mayor.md) — `/libro-mayor`.
- [ ] [SIRE → Ventas](67-sire-ventas.md) — `/sire-ventas`.
- [ ] [SIRE → Compras](68-sire-compras.md) — `/sire-compras`.

### Finanzas

- [ ] [Movimientos](69-finanzas-movimientos.md) — `/finanzas-movimientos`.
- [ ] [Transacciones](70-transacciones.md) — `/transacciones`.
- [ ] [Ingresos](71-finanzas-ingresos.md) — `/finanzas-ingresos`.
- [ ] [Cuentas por cobrar](72-cuentas-cobrar.md) — `/cuentas-cobrar`.
- [ ] [Cuentas por pagar](73-cuentas-pagar.md) — `/cuentas-pagar`.
- [ ] [Pagos](74-pagos.md) — `/pagos`.
- [ ] [Balance](75-balance.md) — `/balance`.
- [ ] [Conciliación bancaria](76-conciliacion-bancaria.md) — `/conciliacion-bancaria`.
- [ ] [Ingresos y Egresos M. pago](77-ingresos-egresos-medio-pago.md) — `/ingresos-egresos-medio-pago`.

### Farmacos

- [ ] [Reporte Digemid](78-reporte-digemid.md) — `/reporte-digemid`.
- [ ] [Recetas](79-recetas.md) — `/recetas`.
- [ ] [Medicos](80-medicos.md) — `/medicos`.
- [ ] [CIE 10](81-cie-10.md) — `/cie-10`.
- [ ] [Reporte de psicotropicos y estupefacientes](82-reporte-psicotropicos-estupefacientes.md) — `/reporte-psicotropicos-estupefacientes`.
- [ ] [Recepcion de productos farmaceuticos](83-recepcion-productos-farmaceuticos.md) — `/recepcion-productos-farmaceuticos`.
- [ ] [Dispensación hospitalaria](84-hospital-dispensacion.md) — `/hospital-dispensacion`.

## Alcance y estado

Esta entrega documenta pruebas; **no ejecuta ni aprueba la aplicación**. Todas las casillas comienzan pendientes. Cubre las 84 rutas del sidebar estático actual, sus formularios locales y contratos relacionados; los componentes dinámicos, integraciones, permisos y configuración pueden añadir variantes que deben registrarse durante la ejecución. No existe garantía de detectar todos los defectos posibles.

Login, onboarding, pantalla del cliente POS, formulario público de reclamaciones y navegación hacia otras pantallas se verifican como dependencias de los flujos integrales, sin presentarlos como opciones nuevas del sidebar. Una función esperada pero ausente debe registrarse como brecha o bloqueo, no marcarse automáticamente N/A.

Las notas históricas de [QA de flujos](../QA-FLUJOS-HALLAZGOS.md) sirven como referencia de regresión (por ejemplo, anulación por otro usuario, NC sobre documento elegible y proveedor electrónico configurado). Sus resultados no sustituyen la ejecución en la versión que se vaya a probar.

## Resumen para seguimiento

- Opciones del sidebar documentadas: **84**.
- Controles de entrada identificados en plantillas locales: **564** (un mismo campo puede aparecer en varios contextos).
- Expresiones de acciones/eventos identificadas: **721** (incluyen controles compartidos y filtros).
- Las casillas incluyen escenarios, variantes de contratos, comprobaciones transversales y cierre; no representan todas pruebas funcionales distintas ni evidencia de ejecución.

- [ ] Registrar versión y responsable de la campaña.
- [ ] Completar cada documento y anotar bloqueos/dependencias.
- [ ] Ejecutar los 15 flujos integrales.
- [ ] Resolver o documentar P0/P1 antes de aprobar salida.
- [ ] Adjuntar evidencias y resumen de defectos por módulo.
