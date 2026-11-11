import type { ImportColumn } from '../../common/utils/import-template.util';

/** Columnas de la plantilla de clientes. `key` es lo que lee el importador (no cambiar). */
export const CUSTOMER_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'Código documento de identidad', header: 'Tipo de documento', aliases: ['Codigo documento de identidad'], required: true, help: 'DNI, RUC, CE, PASAPORTE u OTRO. También se aceptan los códigos SUNAT: 1 = DNI, 6 = RUC, 4 = CE, 7 = pasaporte.', example: 'DNI' },
  { key: 'Número de documento', header: 'Número de documento', required: true, help: 'Número del documento, sin espacios. Si ya existe un cliente con ese documento, se actualiza.', example: '41784438' },
  { key: 'Nombre/Razón Social', header: 'Nombre o razón social', aliases: ['Nombre / Razón Social', 'Razón social'], required: true, help: 'Nombre completo de la persona o razón social de la empresa.', example: 'JUAN PINEDO RÍOS' },
  { key: 'Nombre Comercial', header: 'Nombre comercial', help: 'Solo para empresas, si es distinto de la razón social.', example: '' },
  { key: 'Teléfono', header: 'Teléfono', help: 'Opcional.', example: '987654321' },
  { key: 'Correo electrónico', header: 'Correo electrónico', help: 'Para enviarle sus comprobantes. Opcional.', example: 'juan@correo.com' },
  { key: 'Dirección', header: 'Dirección', help: 'Opcional.', example: 'Av. Los Pinos 125' },
  { key: 'Código de Ubigeo', header: 'Ubigeo (distrito)', aliases: ['Código de Ubigeo'], help: 'Código de 6 dígitos del distrito según INEI. Ej.: 150101 = Lima. Opcional.', example: '150101' },
  { key: 'Código del Páis', header: 'País (código)', aliases: ['Código del País', 'Codigo del Pais'], help: 'Código del país, por ejemplo PE para Perú. Si lo dejas vacío, se toma Perú.', example: 'PE' },
  { key: 'Tipo Cliente', header: 'Tipo de cliente', help: 'Nombre de un tipo de cliente ya creado en Clientes → Tipos de cliente. Opcional.', example: '' },
];
