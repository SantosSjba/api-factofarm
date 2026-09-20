# Flujos integrales de prueba

Ejecutar además de cada plan por opción. Usar datos sintéticos, proveedores de pruebas y saldos iniciales conocidos. Cada casilla indica ejecución; anotar PASÓ/FALLÓ/BLOQUEADO/N/A y evidencia por paso conforme a [criterios comunes](00-criterios-comunes.md). P0 para dinero, stock, permisos y aislamiento; P1 para el resto del recorrido principal.

## E2E01 — Alta de farmacia hasta primera venta

- [ ] Como plataforma, crear cliente SaaS y aprovisionar establecimiento/administrador. **Esperado:** recursos vinculados al tenant correcto, sin duplicados.
- [ ] Entrar como administrador de ese tenant; completar Mi farmacia y configuración inicial si se presenta. **Esperado:** perfil propio y acceso restringido a su farmacia.
- [ ] Crear establecimiento/almacén, serie, usuario cajero, cliente y producto. **Esperado:** catálogos visibles solo dentro de alcance autorizado.
- [ ] Abrir caja; registrar nota de venta de una unidad con pago exacto. **Esperado:** un documento, un pago, una salida de stock.
- [ ] Consultar Dashboard, caja, movimientos y Kardex. **Esperado:** indicadores conciliables con la misma venta y fecha.
- [ ] Repetir aprovisionamiento/envío y consultar desde tenant B. **Esperado:** sin duplicados ni exposición cruzada.

## E2E02 — Compra, recepción parcial, lotes y deuda

- [ ] Crear proveedor con documento válido y producto QA con stock inicial 0; generar OC por 5 unidades a costo conocido; aprobar/enviar. **Esperado:** OC disponible para recepción; no se suma stock anticipadamente.
- [ ] Recibir 2 unidades en lote L1 con vencimiento válido. **Esperado:** stock 2, recibidas 2, pendientes 3.
- [ ] Recibir las 3 restantes en L2. **Esperado:** stock 5, dos lotes y OC completa conforme a estados implementados.
- [ ] Repetir recepción y exceder cantidad pendiente. **Esperado:** no se añaden otras 5 unidades ni queda cabecera incompleta.
- [ ] Consultar Kardex, valorizado, historial proveedor y CxP cuando la compra genere deuda. **Esperado:** cantidad/costo/documento coinciden.
- [ ] Abonar deuda parcial y luego totalmente; consultar pagos/finanzas. **Esperado:** saldo exacto, sin pago duplicado.

## E2E03 — Venta contado, mixta y a crédito

- [ ] Preparar 10 unidades; vender 2 al contado con precio e impuesto conocidos. **Esperado:** quedan 8, pago y caja concilian.
- [ ] Vender una unidad con dos medios de pago. **Esperado:** queda 7; suma de medios = total y cada parte aparece una vez en reporte por medio.
- [ ] Vender una unidad a crédito a cliente habilitado. **Esperado:** queda 6; deuda por el importe financiado, sin efectivo ficticio.
- [ ] Abonar 30 y luego 70 a una deuda de 100 creada para el caso. **Esperado:** saldo 100→70→0, cambios visibles en CxC/pagos/finanzas.
- [ ] Reimprimir ticket y descargar PDF. **Esperado:** no cambian stock ni caja ni deuda.
- [ ] Comparar resumen de ventas, balance y exportación contable bajo mismos filtros. **Esperado:** totales conciliados y estados de documento considerados.

## E2E04 — Anulación y documentos correctivos

- [ ] Crear venta con usuario A; intentar anularla con A. **Esperado:** se rechaza anulación propia conforme a regla documentada en QA histórico.
- [ ] Anular con B autorizado de la misma sucursal. **Esperado:** restauración de stock y efecto financiero una sola vez, con actor/motivo auditables.
- [ ] Repetir anulación, también en dos pestañas. **Esperado:** no se duplica reverso.
- [ ] Solicitar devolución con NC sobre NOTA_VENTA. **Esperado:** rechazo según regla documentada; no generar documento electrónico ficticio.
- [ ] Con proveedor habilitado, emitir boleta/factura y generar correctivo permitido con monto/cantidad parcial y total. **Esperado:** vínculo e importes correctos, sin exceder el documento origen.
- [ ] Comparar stock, deuda, caja, comprobante y reportes después del correctivo. **Esperado:** misma operación reflejada coherentemente en cada módulo.

## E2E05 — Inventario, traslado y conteo físico

- [ ] Preparar origen con 10 unidades y destino con 0; crear traslado de 3. **Esperado:** estado inicial sin recepción ficticia.
- [ ] Despachar y consultar saldos/en tránsito; recibir. **Esperado:** estado final origen 7, destino 3; trazabilidad de lote conservada.
- [ ] Intentar recibir dos veces y en paralelo. **Esperado:** destino permanece 3.
- [ ] Contar 6 donde sistema indica 7; aplicar ajuste permitido. **Esperado:** diferencia −1 y stock 6, con movimiento justificable.
- [ ] Generar ajuste superior al umbral; probar aprobación propia/ajena conforme configuración. **Esperado:** pendiente no altera stock, aprobación válida aplica una vez.
- [ ] Conciliar inventario, Kardex y valorizado en ambos almacenes. **Esperado:** diferencias explicadas por traslado/ajuste, no por pérdida de movimientos.

## E2E06 — Farmacia, receta y dispensación

- [ ] Registrar médico, paciente, producto controlado y receta con cantidades/vigencia. **Esperado:** referencias del mismo tenant, datos profesionales y del paciente correctos.
- [ ] Dispensar parte y luego completar por POS o dispensación hospitalaria según flujo habilitado. **Esperado:** entregado y pendiente concilian con receta y stock.
- [ ] Intentar dispensación excesiva, duplicada, vencida y de paciente ajeno. **Esperado:** rechazo sin salida ni cobro parcial.
- [ ] Revisar lote, receta y reportes DIGEMID/psicotrópicos cuando corresponda. **Esperado:** clasificación y cantidades rastreables, sin incluir producto común como controlado.
- [ ] Probar sustitución permitida y receta validada manualmente con/sin permiso. **Esperado:** referencia de producto y autorización conservadas.

## E2E07 — Cadena de frío y recepción no conforme

- [ ] Recibir producto refrigerado en almacén/zona adecuada con controles sanitarios. **Esperado:** lote y condición de recepción trazables.
- [ ] Registrar lectura normal y fuera de rango configurado. **Esperado:** clasificación/alerta disponible corresponde al límite, unidad y hora correctos.
- [ ] Ejecutar tratamiento de no conformidad/cuarentena si está implementado; intentar vender el lote restringido. **Esperado:** restricción efectiva en servidor; si integración no existe, registrar brecha funcional, no aprobarla por tener un aviso visual.

## E2E08 — Emisión electrónica, resumen y baja

- [ ] Con proveedor MOCK/incompleto, intentar nota de venta y boleta/factura. **Esperado:** NV permite el flujo autorizado y CPE sin proveedor real falla de manera explícita.
- [ ] Configurar proveedor de pruebas; emitir y consultar respuesta, XML/PDF/CDR según disponibilidad. **Esperado:** estado real y archivos del documento correcto.
- [ ] Simular timeout tras envío y consultar antes de reintentar. **Esperado:** no emitir dos comprobantes por incertidumbre de red.
- [ ] Generar resumen de documentos elegibles y una baja con motivo. **Esperado:** alcance correcto, ticket trazable y estados sin aceptación ficticia.
- [ ] Verificar series/correlativos, ventas y reportes. **Esperado:** unicidad documental y consistencia tras rechazo/baja.

## E2E09 — Logística y delivery

- [ ] Crear transportista, conductor, vehículo y dirección de partida; relacionarlos con guía de prueba. **Esperado:** datos maestros coherentes y propios.
- [ ] Crear pedido con productos, destinatario, dirección y delivery; recorrer estados permitidos. **Esperado:** total incluye delivery una sola vez y stock se afecta según estado.
- [ ] Emitir guía remitente/transportista disponible vinculada al despacho. **Esperado:** cantidades, participantes y origen/destino correctos.
- [ ] Cancelar pedido en estado permitido y repetir. **Esperado:** reverso/reserva/pago coherentes, sin duplicación.

## E2E10 — Promociones, packs y convenios

- [ ] Crear pack de dos componentes con cantidades conocidas y una campaña/cupón vigente. **Esperado:** composición y regla de descuento persistentes.
- [ ] Vender pack con cupón y comprobar precio, impuestos y stock de componentes. **Esperado:** cálculo exacto y sin descuento doble.
- [ ] Probar cupón vencido/inactivo/límite agotado y componente sin stock. **Esperado:** rechazo consistente UI/API.
- [ ] Crear convenio de cobertura conocida y aplicar a venta elegible. **Esperado:** copago + cobertura = total y deuda atribuida correctamente.
- [ ] Anular venta de prueba autorizadamente. **Esperado:** stock y efectos financieros se revierten; tratamiento del uso del cupón coincide con regla acordada.

## E2E11 — Finanzas y contabilidad al cierre

- [ ] Preparar ventas contado/crédito, compra, abono, ingreso, egreso y anulación con importes conocidos. **Esperado:** libro de referencias de prueba completo.
- [ ] Cerrar caja y consultar finanzas/transacciones/reporte por medio. **Esperado:** saldo inicial + entradas − salidas = saldo esperado y diferencia de arqueo explicable.
- [ ] Conciliar movimiento bancario con transacción interna; probar ambigüedad y repetición. **Esperado:** relación única y pendientes identificables.
- [ ] Consultar Libro Mayor, resumen, balance y SIRE ventas/compras, exportar formatos disponibles. **Esperado:** mismos periodos y fuentes, ajustes incluidos correctamente, archivos verificables contra especificación del proyecto.
- [ ] Repetir con otra moneda y cambio de mes en Lima. **Esperado:** moneda/conversión explícita, periodos sin solapamientos.

## E2E12 — Permisos, sesión y aislamiento

- [ ] Como administrador A, crear usuario con acceso limitado y abrir sesión nueva. **Esperado:** sidebar/panel reflejan exactamente permisos efectivos.
- [ ] Intentar rutas no visibles, escritura con permiso lector e IDs de tenant B por API. **Esperado:** sin acceso ni cambios externos.
- [ ] Revocar permiso con sesión del operador activa. **Esperado:** servidor rechaza nueva operación; UI se actualiza conforme estrategia de sesión, sin dejar escritura autorizada solo por caché.
- [ ] Cambiar de sucursal y volver a abrir POS, stock, reportes y archivos. **Esperado:** no mezcla de caja/almacén/clientes fuera de alcance.
- [ ] Cerrar sesión e iniciar como B; usar atrás. **Esperado:** caché y páginas no muestran datos de A.

## E2E13 — Personal, productividad y comisión

- [ ] Asignar horario, registrar asistencia y solicitar/aprobar licencia de un empleado. **Esperado:** todo vinculado al mismo empleado y fechas correctas.
- [ ] Configurar comisión, registrar ventas con ese vendedor y anular una. **Esperado:** productividad y comisión corresponden a ventas elegibles y su tratamiento de anulaciones.
- [ ] Cambiar empleado y consultar mismo periodo. **Esperado:** no arrastre de horario, comisión ni licencia del anterior.

## E2E14 — Privacidad, reclamos y auditoría

- [ ] Registrar cliente sintético con consentimiento y solicitud ARCO; atenderla desde LPDP. **Esperado:** identidad, estado, acción y respuesta trazables, acceso limitado.
- [ ] Registrar reclamación de prueba en flujo público y atenderla desde plataforma. **Esperado:** seguimiento del mismo reclamo sin exposición cruzada.
- [ ] Consultar auditoría de operaciones soportadas. **Esperado:** actor/fecha/entidad correctos, sin secretos ni información innecesaria.
- [ ] Comprobar tratamiento de eliminación/retención con la política configurada. **Esperado:** comportamiento documentado y registros relacionados consistentes; no afirmar cumplimiento legal por el mero éxito técnico.

## E2E15 — Importaciones y continuidad móvil

- [ ] Descargar/importar plantillas de clientes, productos, packs, lotes/series y precios desde cada menú correspondiente. **Esperado:** modos y validación por fila correctos.
- [ ] Consultar lo importado desde formularios consumidores, POS y reportes. **Esperado:** relaciones y valores utilizables, sin archivos procesados parcialmente como éxito total.
- [ ] Ejecutar un recorrido compra/recepción/venta/consulta a 390 px y en tablet; girar con carrito o formulario abierto. **Esperado:** persistencia de estado y todas las acciones alcanzables.
- [ ] Interrumpir red al guardar y recuperar la sesión. **Esperado:** consultar resultado antes de repetir; ningún doble cargo, stock o documento.

## Cierre

- [ ] Adjuntar por flujo IDs de documentos, operaciones y saldos antes/después, con datos sensibles ocultos.
- [ ] Conciliar cantidades físicas, valorización, pagos, deudas y documentos afectados.
- [ ] Registrar dependencias bloqueadas y brechas de implementación por separado de los errores reproducidos.
- [ ] Repetir pasos afectados por correcciones y confirmar que no rompen los módulos consumidores.
