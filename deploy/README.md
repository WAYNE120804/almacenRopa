## Produccion En VPS

1. Copia `deploy/.env.production.example` a `.env` en la raiz del proyecto.
2. Ajusta secretos, dominio principal y subdominios del almacen.
3. En DNS del proveedor apunta:
   - dominio principal del almacen -> IP VPS.
   - `www` del dominio principal -> IP VPS o CNAME al raiz.
   - subdominio de API -> IP VPS.
   - subdominio de automatizaciones, si usas n8n -> IP VPS.
   - subdominio de WhatsApp, si usas Evolution API -> IP VPS.
4. Desde la raiz del repositorio ejecuta:

```bash
docker compose up -d --build
```

5. Verifica:

```bash
docker compose ps
docker compose logs -f caddy backend frontend n8n postgres
```

## Variables Principales

- `APP_DOMAIN`: dominio del frontend.
- `API_DOMAIN`: dominio del backend.
- `BOT_DOMAIN`: dominio de n8n.
- `WA_DOMAIN`: dominio de Evolution API.
- `FRONTEND_VITE_API_URL`: URL publica de la API, por ejemplo `https://api.tudominio.com/api`.
- `BACKEND_DATABASE_URL`: conexion PostgreSQL del backend.
- `BACKEND_AUTH_SECRET`: secreto de autenticacion.

## Notas

- Solo `caddy` expone puertos publicos `80` y `443`.
- `backend`, `n8n`, `evolution-api`, `redis` y `postgres` quedan en la red privada de Docker.
- El backend usa PostgreSQL por medio de Prisma.
- `n8n` y `Evolution API` quedan como servicios opcionales de automatizacion y WhatsApp. Si no se usan, se pueden retirar del `docker-compose.yml` junto con sus dominios.
- Si luego sacas PostgreSQL a un servicio externo, elimina el servicio `postgres` del compose y cambia `BACKEND_DATABASE_URL`.
