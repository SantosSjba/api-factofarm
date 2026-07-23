# Aislamiento multi-tenant (cliente SaaS)

Unidad de aislamiento: **`Tenant`** (cliente SaaS: botica, farmacia o cadena).

Las **sucursales** (`Establishment`) pertenecen a un tenant. Gran parte de la operación se scopea por `establishmentId`, siempre validando que esa sucursal sea del tenant del actor.

Los **catálogos de referencia** (SUNAT, ubigeo, farmacológicos genéricos, etc.) son **globales a propósito** y se comparten entre clientes.

---

## 1. Independiente por cliente SaaS (`tenantId` directo)

| Dominio | Modelos / datos |
|--------|------------------|
| Organización | `Tenant`, `Establishment`, usuarios del cliente (`User.tenantId`; `SUPER_ADMIN` puede ser null) |
| Catálogo comercial propio | `Product`, `Service`, `CompoundProduct`, `Category`, `Brand` |
| Terceros | `Customer`, `CustomerZone`, `CustomerType`, `Supplier` |
| Archivos / auditoría | `Archivo` (opcional), `AuditLog` (opcional) |
| Comercial / plataforma | `TenantLead` (opcional al convertir), `PlatformPanelHandoff` |

Regla: listados y escrituras deben filtrar o afirmar `tenantId` del actor (salvo plataforma).

Helpers: `assertProductInTenant`, `assertCustomerInTenant`, `assertSupplierInTenant`, `assertEstablishmentInTenant`.

---

## 2. Independiente por sucursal → tenant (vía `establishmentId` / almacén)

No tienen `tenantId` en la fila, pero **no se comparten entre clientes** porque cuelgan de un establecimiento (o almacén) del tenant.

| Dominio | Ejemplos |
|--------|----------|
| Inventario | `Warehouse`, `WarehouseZone`, stock/lotes/series, movimientos in/out, ajustes, conteos físicos, transferencias |
| Ventas / caja | `Sale`, ítems, pagos, devoluciones, `CashRegister` / sesiones, promociones de sede, precios por cliente |
| Compras | `PurchaseOrder`, recepción, CxP, notas de crédito proveedor |
| Facturación | config CPE de sede, `ElectronicDocument`, jobs SUNAT de la operación |
| Cotizaciones / delivery | `Quotation`, `DeliveryOrder` |
| Hospital / convenios | áreas, consumos internos, `Agreement`, CxC institucionales, presupuestos, cuentas bancarias de sede |
| Pharma operativo | `Prescription` (y vínculos), libro de controlados, eventos adversos ligados a la operación |
| Personal | horarios, asistencia, comisiones, vacaciones, anulaciones de venta |
| Compliance operativo | consentimientos LPDP / ARCO ligados a clientes del tenant, licencias de químico de sede |
| Guías / envío | carriers/drivers/vehicles/direcciones de partida de la sede |
| Retención / archivo | corridas y ventas/movimientos archivados con contexto de sede |

Regla: resolver sucursal con `EstablishmentScopeService.resolve` / `assertAccess`, y en FKs de almacén usar `assertWarehouseInTenant`.

---

## 3. Independiente por vínculo (FK a entidad del tenant)

Datos sin `tenantId` ni `establishmentId` propios, pero **aislados** porque apuntan a producto/cliente/proveedor/venta del tenant.

Ejemplos: `SupplierProduct`, `ProductWarehouseStock` / precios, ítems de venta/compra/cotización/delivery, redenciones de promo, transacciones de fidelización, precios de convenio.

Regla: al crear o adjuntar, validar que el padre (producto, cliente, proveedor, venta) sea del tenant del actor.

---

## 4. Globales (compartidos entre todos los clientes SaaS)

No llevan `tenantId`. Son referencia de plataforma / normativa / maestros comunes.

| Tipo | Modelos |
|------|---------|
| Ubigeo Perú | `Department`, `Province`, `District` |
| Unidades / moneda / impuestos | `UnitOfMeasure`, `Currency`, `TaxAffectationType`, `ProductIscSystem`, `SunatWithholdingRate` |
| Atributos genéricos | `ProductAttributeType` |
| Motivos de transferencia (catálogo) | `InventoryTransferReason` |
| Plataformas de compuestos | `CompoundProductPlatform` |
| Catálogo farmacológico de referencia | `Laboratory`, `PharmaceuticalForm`, `ActivePrinciple`, `DrugInteraction`, `AdministrationRoute` |
| Médicos / CIE-10 / precios regulados de referencia | `Medico`, `Cie10Code`, `RegulatedDrugPrice`, `ControlledSubstanceCategory` |
| Permisos de plataforma | `Permission` (matriz de permisos del sistema) |
| Auth técnico | `RefreshToken`, `LoginAttempt`, `PasswordResetToken` (sesión; no son “catálogo de farmacia”) |

Si un maestro debe personalizarse por cliente (p. ej. “mis laboratorios”), se modela aparte con `tenantId` o se deja de usar el global como único origen.

---

## 5. Roles y alcance

| Actor | Alcance |
|-------|---------|
| Usuario de cliente | Solo su `tenantId`. Sucursal propia, o varias del mismo tenant si tiene alcance de cadena. |
| Admin de cadena | Sucursales del **mismo** tenant. |
| `SUPER_ADMIN` / plataforma | Puede cruzar tenants (panel / soporte). |

Realtime (`join-sale`, etc.) y exports LPDP deben respetar el mismo alcance.

---

## 6. Checklist al agregar un endpoint o modelo

1. ¿Es dato del negocio del cliente? → `tenantId` o cadena clara a `Establishment` / entidad con tenant.
2. ¿Es maestro SUNAT/ubigeo/farmacológico genérico? → global OK.
3. Escritura con FK (`productId`, `customerId`, `supplierId`, `warehouseId`) → assert de tenant correspondiente.
4. Seed / backfill → nunca reasignar filas que ya tienen otro `tenantId`.
5. Listados → `where` por tenant o por establecimientos del actor.

---

## Dashboards por rol

| Rol | Panel | Ruta |
|-----|-------|------|
| `ADMINISTRADOR` / `ADMIN_CADENA` | Admin / cadena | `/dashboard` |
| `GERENTE_SUCURSAL` | Gerente | `/dashboard` |
| `FARMACEUTICO*` / técnico | Farmacéutico | `/dashboard` |
| `CAJERO` / `VENDEDOR` | Caja (home POS) | `/dashboard` · `/punto-venta` |
| `ALMACENERO` | Almacén | `/dashboard` |
| `CONTADOR` | Contabilidad | `/dashboard` |
| `SUPER_ADMIN` | Plataforma | `/platform/dashboard` |

API: `GET /dashboard/{stats\|manager\|pharmacist\|cashier\|warehouse\|accountant\|platform}`.

## Referencia de código

- Scope: `src/common/scoping/establishment-scope.service.ts`
- Tenant util: `src/common/scoping/tenant-scope.util.ts`
- Seed tenant-aware: `prisma/seed/steps/tenants.ts` (backfill solo `tenantId: null` en usuarios)
