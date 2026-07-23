# Checklist beta privada — FactoFarm

Objetivo: abrir beta con **clientes reales** prometiendo POS, inventario, usuarios, multi-sucursal y **nota de venta**.  
SUNAT (boleta/factura) solo si el tenant tiene OSE de producción configurado.

Apps Coolify (referencia):

- Front: `https://factofarm.factosysperu.com`
- API: `https://api-factofarm.factosysperu.com`

Datos de empresa (FactoSys):

- WhatsApp: `+51 944 644 276` → `51944644276`
- Correo: `contacto@factosysperu.com`
- RUC: `20614608952`
- Razón social: `FACTOSYS PERU S.A.C.`
- Sede: Trujillo, La Libertad, Perú (atención a todo el Perú)
- Horario: Lun–Vie 9:00–18:00 · Sáb 9:00–14:00
- Web: `https://factosysperu.com` · App: `https://factofarm.factosysperu.com`

---

## Estado de ítems

Leyenda: `[x]` hecho en código/docs · `[ ]` pendiente operativo (Coolify / negocio) · `[~]` parcial

### A. Bloqueadores (antes de invitar)

| # | Ítem | Estado | Notas |
|---|------|--------|-------|
| A1 | SMTP + `SALES_CONTACT_EMAIL` + `COMPLAINTS_EMAIL` | `[~]` | Correos de contacto seteados en Coolify; falta confirmar `SMTP_*` host/user/pass |
| A2 | `JWT_SECRET` (≥32) en prod | `[~]` | No tocado en este deploy (asumir ya existía si API healthy) |
| A3 | `LPDP_SENSITIVE_ENCRYPTION_KEY` (≥32) | `[~]` | No tocado; verificar en Coolify si API arrancó en prod |
| A4 | `BILLING_ENCRYPTION_KEY` (≥32) | `[~]` | Verificar en Coolify (ahora requerida al boot) |
| A5 | `FRONTEND_URL` / `CORS_ORIGINS` → front HTTPS | `[x]` | Actualizado en Coolify API |
| A6 | Datos legales reales (`COMPANY_*` + `NG_APP_COMPANY_*`) | `[x]` | Coolify API + horneado en imagen front |
| A7 | **Nunca** `prisma db seed` en DB de producción | `[~]` | Advertencia en deploy docs |
| A8 | Documentos legales empaquetados en imagen Docker | `[x]` | `docs/` + path fix |
| A9 | CPE SUNAT solo con OSE prod + `modoSandbox=false` | `[ ]` | Beta default = nota de venta / MOCK |

### B. Alto (semana 1 de beta)

| # | Ítem | Estado | Notas |
|---|------|--------|-------|
| B1 | SEO dominio (`robots.txt` / `sitemap`) | `[x]` | `factofarm.factosysperu.com` |
| B2 | Quitar copy “desarrollo / .env / logs” en UX pública | `[x]` | |
| B3 | POS: bloquear cobro sin caja abierta | `[x]` | |
| B4 | FAQ landing: no prometer SUNAT out-of-the-box | `[x]` | |
| B5 | Volumen persistente `UPLOADS_DIR` en Coolify | `[ ]` | Evitar perder logos/archivos |
| B6 | `SENTRY_DSN` | `[ ]` | Observabilidad |
| B7 | Throttle portal delivery público | `[x]` | 5/min |
| B8 | Front build args: WhatsApp, email, site, company | `[ ]` | Horneados en imagen |
| B9 | “Mantener sesión” funcional | `[x]` | localStorage vs sessionStorage |
| B10 | Contacto ARCO/privacidad con correo | `[x]` | |

### C. Medio (post-arranque)

| # | Ítem | Estado |
|---|------|--------|
| C1 | Socket.IO CORS alineado a `FRONTEND_URL`/`CORS_ORIGINS` | `[x]` |
| C2 | Series POS desde catálogo (no texto libre) | `[ ]` |
| C3 | Libro de reclamaciones **por farmacia** (hoy = plataforma) | `[ ]` producto |
| C4 | ARCO anonimización profunda | `[ ]` |
| C5 | WhatsApp Business API / email cotización automático | `[ ]` |
| C6 | Catálogos globales (labs/médicos) solo lectura para tenants | `[ ]` |

---

## Variables Coolify — API

```env
NODE_ENV=production
DATABASE_URL=...
JWT_SECRET=...                 # openssl rand -base64 48
LPDP_SENSITIVE_ENCRYPTION_KEY=...
BILLING_ENCRYPTION_KEY=...
FRONTEND_URL=https://factofarm.factosysperu.com
CORS_ORIGINS=https://factofarm.factosysperu.com
SWAGGER_ENABLED=false

SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=FactoFarm <contacto@factosysperu.com>
SALES_CONTACT_EMAIL=contacto@factosysperu.com
COMPLAINTS_EMAIL=contacto@factosysperu.com

COMPANY_LEGAL_NAME=FACTOSYS PERU S.A.C.
COMPANY_RUC=20614608952
COMPANY_ADDRESS=Trujillo, La Libertad, Perú. Atendemos todo el Perú (24 departamentos y Callao).

SENTRY_DSN=...                 # recomendado
# Volumen: montar /app/uploads → UPLOADS_DIR=uploads
```

## Variables Coolify — Front (build-args)

```env
NG_APP_API_BASE_URL=https://api-factofarm.factosysperu.com/api/v1
NG_APP_PRODUCTION=true
NG_APP_CONTACT_WHATSAPP=51944644276
NG_APP_CONTACT_EMAIL=contacto@factosysperu.com
NG_APP_SITE_URL=https://factofarm.factosysperu.com
NG_APP_COMPANY_LEGAL_NAME=FACTOSYS PERU S.A.C.
NG_APP_COMPANY_RUC=20614608952
NG_APP_COMPANY_ADDRESS=Trujillo, La Libertad, Perú. Atendemos todo el Perú (24 departamentos y Callao).
```

---

## Promesa comercial beta

| Ofrecer | No prometer aún |
|---------|-----------------|
| POS, stock, lotes, compras, usuarios, cotizaciones | SUNAT listo sin configurar OSE |
| Delivery con enlace WhatsApp manual | WhatsApp automático Meta API |
| Soporte FactoSys (WA + correo) | Libro de reclamaciones por cada farmacia |
| Plan BOTICA con módulos reducidos | Hospital / cadena completa al día 1 |

---

## Smoke test pre-invitación

1. Login admin tenant + cajero  
2. Abrir caja → vender → ver stock descontado  
3. Landing: envío de lead llega al correo  
4. Forgot password envía mail real  
5. `/legal/privacidad` y libro muestran RUC real (no `20XXXXXXXXX`)  
6. Platform dashboard SUPER_ADMIN carga KPIs  
7. Redeploy no borra archivos (volumen uploads)  

---

## Relacionado

- Aislamiento SaaS: `docs/SAAS-TENANT-ISOLATION.md`
- Deploy Coolify: `docs/COOLIFY-DOCKER-DEPLOY.md`
- Retención: `docs/DATA-RETENTION-PLAN.md`
