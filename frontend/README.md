# Frontend - Almacen De Ropa

Frontend en React + Vite para administrar el sistema interno del almacen: productos, categorias, clientes, ventas, caja, separados, creditos, salidas especiales, gastos, fondos, informes y configuracion.

## Requisitos

- Node.js 18 o superior.
- Backend ejecutandose.

## Instalacion

```bash
cd frontend
npm install
```

## Variables De Entorno

Copia el archivo de ejemplo y ajusta la URL del backend:

```bash
cp .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Ejecucion

```bash
npm run dev
```

## Verificacion

```bash
npm run typecheck
npm run build
```

## Impresion

El frontend incluye vistas de impresion para:

- Tirillas de venta.
- Tirillas de separados.
- Tirillas y recibos de creditos.
- Etiquetas termicas de productos.

Las etiquetas de producto se imprimen desde HTML/CSS en formato `50mm x 30mm`, en flujo continuo y sin generar PDF.
