import { Injectable, Logger } from '@nestjs/common';

const DEFAULT_CONSULTA_URL = 'https://api.factiliza.com/v1';

export type FactilizaDniInfo = {
  numero: string;
  nombre_completo: string;
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
};

export type FactilizaRucInfo = {
  numero: string;
  nombre_o_razon_social: string;
  estado: string;
  condicion: string;
  direccion_completa?: string;
};

export type FactilizaCpeStatus = {
  comprobante_estado_codigo: string;
  comprobante_estado_descripcion: string;
  empresa_estado_codigo?: string;
  empresa_condicion_descripcion?: string;
};

@Injectable()
export class FactilizaConsultaClient {
  private readonly logger = new Logger(FactilizaConsultaClient.name);

  async validateRuc(apiUrl: string | null, token: string, ruc: string): Promise<FactilizaRucInfo> {
    const base = (apiUrl?.trim() || DEFAULT_CONSULTA_URL).replace(/\/$/, '');
    const url = `${base}/ruc/info/${ruc.trim()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: FactilizaRucInfo;
    };
    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message ?? `RUC no válido (${res.status})`);
    }
    return payload.data;
  }

  async validateDni(apiUrl: string | null, token: string, dni: string): Promise<FactilizaDniInfo> {
    const base = (apiUrl?.trim() || DEFAULT_CONSULTA_URL).replace(/\/$/, '');
    const url = `${base}/dni/info/${dni.trim()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: FactilizaDniInfo;
    };
    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message ?? `DNI no válido (${res.status})`);
    }
    return payload.data;
  }

  async queryCpeStatus(
    apiUrl: string | null,
    token: string,
    input: {
      rucEmisor: string;
      tipoDoc: string;
      serie: string;
      numero: string;
      fechaEmision: string;
      total: number;
    },
  ): Promise<FactilizaCpeStatus> {
    const base = (apiUrl?.trim() || DEFAULT_CONSULTA_URL).replace(/\/$/, '');
    const url = `${base}/sunat/cpe`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ruc_emisor: input.rucEmisor,
        codigo_tipo_documento: input.tipoDoc,
        serie_documento: input.serie,
        numero_documento: input.numero.replace(/^0+/, '') || input.numero,
        fecha_emision: input.fechaEmision,
        monto_total: input.total,
      }),
    });
    const payload = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: FactilizaCpeStatus;
    };
    if (!res.ok || !payload.data) {
      this.logger.warn(`Consulta CPE fallida: ${payload.message ?? res.status}`);
      throw new Error(payload.message ?? 'No se pudo consultar el CPE');
    }
    return payload.data;
  }
}
