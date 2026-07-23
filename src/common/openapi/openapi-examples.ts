/** Ejemplos reales (Perú) para documentación OpenAPI / Scalar. */
export const OPENAPI_EXAMPLES = {
  loginRequest: {
    email: 'admin@factosysperu.com',
    password: 'Admin123!',
  },
  loginResponse: {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    user: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nombre: 'Administrador',
      email: 'admin@factosysperu.com',
      role: 'ADMINISTRADOR',
      establecimientoId: '660e8400-e29b-41d4-a716-446655440001',
      permissionCodes: ['users.read', 'sales.write', 'products.read'],
    },
  },
  createCustomer: {
    nombre: 'Juan Pérez García',
    tipoDocumento: 'DNI',
    numeroDocumento: '45678912',
    nacionalidad: 'PERU',
    diasCredito: 0,
    limiteCredito: 0,
    habilitado: true,
    esCliente: true,
    esProveedor: false,
  },
  createSale: {
    warehouseId: '770e8400-e29b-41d4-a716-446655440002',
    documentType: 'BOLETA_VENTA_ELECTRONICA',
    paymentMethod: 'EFECTIVO',
    items: [
      {
        productId: '880e8400-e29b-41d4-a716-446655440003',
        quantity: 2,
      },
    ],
  },
  healthReady: {
    status: 'ok',
    info: { database: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' } },
  },
} as const;
