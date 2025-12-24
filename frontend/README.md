# Frontend - Sistema de Rifas

Frontend en React + Vite para administrar rifas, vendedores, abonos, gastos y caja.

## Requisitos
- Node.js 18+
- Backend ejecutándose (ver `.env.example`)

## Instalación
```bash
cd frontend
npm install
```

## Variables de entorno
Copia el archivo de ejemplo y ajusta la URL del backend:

```bash
cp .env.example .env
```

Editar `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Ejecución
```bash
npm run dev
```

## Impresión de recibos
- Abre un recibo en `#/recibos/:id`.
- Presiona el botón **Imprimir**.
- El CSS de impresión oculta el menú y deja solo la tirilla.

## Notas sobre endpoints faltantes
El backend no expone endpoints para:
- Listar historial de asignaciones de boletas (solo se registra en `AsignacionBoletas`).
- Consultar recibo por `abono_id` (solo existe `/recibos/:id` y `/recibos/codigo/:codigo`).

Se recomienda agregar endpoints para cubrir esas pantallas.
