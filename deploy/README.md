## Produccion en VPS

1. Copia `deploy/.env.production.example` a `.env` en la raiz del proyecto.
2. Ajusta secretos, claves Wompi y dominio `rifasmejia.store`.
3. En DNS del proveedor apunta:
   - `rifasmejia.store` -> IP VPS
   - `www.rifasmejia.store` -> IP VPS o CNAME al raiz
   - `api.rifasmejia.store` -> IP VPS
   - `bot.rifasmejia.store` -> IP VPS
   - `wa.rifasmejia.store` -> IP VPS
4. Desde la raiz del repo ejecuta:

```bash
docker compose up -d --build
```

5. Verifica:

```bash
docker compose ps
docker compose logs -f caddy backend frontend n8n postgres
```

## Notas

- Solo `caddy` expone puertos publicos `80` y `443`.
- `backend`, `n8n`, `evolution-api`, `redis` y `postgres` quedan en la red privada de Docker.
- El backend corre `prisma db push` al iniciar para sincronizar esquema.
- Si luego sacas PostgreSQL a un servicio externo, elimina el servicio `postgres` del compose y cambia `BACKEND_DATABASE_URL` y variables `N8N_DB_*`.
- `Evolution API` usa PostgreSQL y Redis segun su documentacion oficial, y `n8n` queda en modo simple de una sola instancia usando PostgreSQL.
