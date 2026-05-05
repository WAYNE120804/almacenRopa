# Sistema Administrativo Para Almacen De Ropa

Aplicacion interna para administrar inventario, ventas, clientes, caja, separados, creditos, salidas especiales, gastos, fondos, configuracion e informes de un almacen de ropa.

El proyecto esta orientado al control operativo del almacen: productos reales, movimientos de inventario, ventas directas, pagos, abonos, tirillas, etiquetas y trazabilidad.

## Estado Actual

- Backend en `Express + TypeScript + Prisma`.
- Frontend en `React + TypeScript + Vite`.
- Base de datos objetivo: PostgreSQL.
- Configuracion del negocio persistente: nombre, logo, direccion, telefonos, colores y datos para tirillas.
- Modulos administrativos principales ya integrados en el menu.
- Generacion de etiquetas de producto para impresion termica en formato `50mm x 30mm`.

## Modulos Del Sistema

### Productos E Inventario

- Crear, editar y listar productos.
- Asociar categoria, marca, color, talla, precio, costo, stock y SKU.
- Controlar stock actual.
- Registrar movimientos de inventario.
- Generar codigos de barras.
- Imprimir etiquetas termicas en flujo continuo desde el navegador.

### Categorias

- Administrar categorias de producto.
- Usarlas para clasificar inventario y busquedas.

### Clientes

- Crear clientes desde el modulo de clientes o directamente desde ventas, separados y creditos cuando no existan.
- Buscar por nombre, cedula o telefono.
- Consultar informacion basica para ventas, separados y creditos.

### Ventas

- Crear ventas directas.
- Buscar productos por nombre, SKU o codigo.
- Agregar productos con cantidades.
- Descontar inventario al confirmar.
- Registrar metodo de pago.
- Generar tirilla de venta.

### Caja Diaria Y Caja General

- Registrar ingresos y egresos.
- Controlar movimientos generados por ventas, abonos y gastos.
- Revisar saldos operativos.
- Soportar cierre y seguimiento de caja.

### Gastos Y Pagos

- Registrar gastos administrativos u operativos.
- Clasificar pagos y egresos.
- Mantener trazabilidad para informes.

### Fondos

- Controlar fondos internos del negocio.
- Registrar movimientos asociados.

### Separados

- Crear separado ligado a cliente.
- Reservar inventario sin entregarlo hasta completar el pago.
- Registrar abonos.
- Ver total, abonado y saldo pendiente.
- Manejar fecha de vencimiento automatica desde la fecha del servidor.
- Permitir cambio manual del plazo por el administrador.
- Marcar como entregado cuando queda pagado completo.
- Cancelar o vencer separados.
- Imprimir tirilla con caducidad, saldo, pagos registrados y pagos sugeridos por semana.

### Creditos

- Crear credito ligado a cliente.
- Entregar producto inmediatamente.
- Registrar cuotas o abonos.
- Ver saldo pendiente.
- Controlar estados: activo, pagado, vencido y cancelado.
- Imprimir tirilla del credito.
- Imprimir recibo al registrar abonos.

### Salidas Especiales

Control de productos que salen del inventario sin ser venta directa:

- Prestamo.
- Consignacion.
- Envio a otro almacen.
- Trueque.
- Devolucion.
- Cierre del movimiento.

Cada salida registra quien tiene el producto, fecha de salida, estado actual y como termino.

### Configuracion

- Nombre del almacen.
- Logo.
- Direccion, ciudad, departamento y telefonos.
- Colores del sistema.
- Colores configurables manualmente.
- Opcion para aplicar colores desde el logo solo cuando el administrador lo decida.
- Datos usados en tirillas e impresion.

### Informes

- Ventas.
- Gastos.
- Inventario.
- Separados pendientes.
- Creditos pendientes.
- Salidas especiales.
- Caja.

## Estructura Del Proyecto

```text
backend/
  prisma/
    schema.prisma
  src/
    modules/
      auth/
      cajas/
      categorias/
      clientes/
      configuracion/
      creditos/
      fondos/
      gastos/
      health/
      informes/
      productos/
      salidas/
      separados/
      ventas/

frontend/
  src/
    pages/
      Auth/
      Caja/
      Categorias/
      Clientes/
      Configuracion/
      Creditos/
      Fondos/
      Gastos/
      Informes/
      Productos/
      Salidas/
      Separados/
      Usuarios/
      Ventas/
```

## Requisitos

- Node.js 18 o superior.
- PostgreSQL.
- npm.

## Instalacion

Instalar dependencias del backend:

```bash
cd backend
npm install
```

Instalar dependencias del frontend:

```bash
cd frontend
npm install
```

## Variables De Entorno

Backend:

```env
DATABASE_URL="postgresql://usuario:clave@localhost:5432/almacen_ropa"
PORT=3000
```

Frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

## Base De Datos

Generar Prisma Client:

```bash
cd backend
npm run prisma:generate
```

Aplicar el esquema a la base de datos:

```bash
cd backend
npx prisma db push
```

## Ejecucion En Desarrollo

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Por defecto el frontend corre en Vite y consume la API configurada en `VITE_API_URL`.

## Verificacion

Backend:

```bash
cd backend
npm run typecheck
npm run build
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

## Impresion

El sistema usa vistas HTML optimizadas para impresion desde navegadores Chromium:

- Tirillas de venta.
- Tirillas de separados.
- Tirillas y recibos de creditos.
- Etiquetas termicas de producto.

Las etiquetas de productos se renderizan con HTML y CSS, sin PDF, con tamano exacto de `50mm x 30mm` y flujo continuo para impresora termica.

## Nota De Mantenimiento

El dominio funcional vigente es almacen de ropa. Cualquier funcionalidad nueva debe modelarse con entidades propias del inventario, caja, clientes, ventas y trazabilidad del negocio.
