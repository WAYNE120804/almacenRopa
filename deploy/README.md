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

Si necesitas dejar `n8n` limpio, estable y separado del backend, crea primero su base dedicada y luego recrea solo ese servicio:

```bash
docker compose exec postgres psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE n8n;"
docker compose up -d --force-recreate n8n
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
- `n8n` debe usar su propia base PostgreSQL (`N8N_DB_POSTGRESDB_DATABASE`, por defecto `n8n`) para no mezclar sus tablas con las del backend.
- Si luego sacas PostgreSQL a un servicio externo, elimina el servicio `postgres` del compose y cambia `BACKEND_DATABASE_URL` y variables `N8N_DB_*`.
- `Evolution API` usa PostgreSQL y Redis segun su documentacion oficial, y `n8n` queda en modo simple de una sola instancia usando PostgreSQL.
