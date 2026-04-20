import QRCode from 'qrcode';

type PrintableBoletaSheetInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  rifaNombre: string;
  vendedorNombre: string;
  vendedorTelefono?: string | null;
  vendedorDireccion?: string | null;
  comisionPct?: number | string | null;
  precioCasa?: number | string | null;
  boletas: string[];
  assignmentSummary?: Array<{
    fecha: string;
    cantidad: number;
  }>;
};

type PrintableReceiptInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  verificationUrl?: string;
  copies?: number;
  receipt: {
    consecutivo: number;
    codigoUnico: string;
    fecha: string;
    abono: {
      valor: number | string;
      saldoAnterior: number | string;
      saldoDespues: number | string;
      boletasActuales: number;
      metodoPago: string;
      descripcion?: string | null;
      usuario?: {
        nombre?: string | null;
      } | null;
      rifaVendedor: {
        rifa: {
          nombre: string;
        };
        vendedor: {
          nombre: string;
          telefono?: string | null;
          documento?: string | null;
          direccion?: string | null;
        };
      };
    };
  };
};

type PrintableClientReceiptInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  verificationUrl?: string;
  copies?: number;
  receipt: {
    consecutivo: number;
    codigoUnico: string;
    fecha: string;
    pagoCliente: {
      monto: number | string;
      metodoPago: string;
      descripcion?: string | null;
      subCaja?: {
        nombre?: string | null;
      } | null;
      usuario?: {
        nombre?: string | null;
      } | null;
      venta: {
        total: number | string;
        saldoPendiente: number | string;
        cliente: {
          nombre: string;
          documento?: string | null;
          telefono?: string | null;
        };
        rifa: {
          nombre: string;
        };
        rifaVendedor?: {
          vendedor?: {
            nombre?: string | null;
          } | null;
        } | null;
        boletas: Array<{
          numero: string;
        }>;
      };
    };
  };
};

type PrintableAbonosSummaryInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  rifaNombre: string;
  vendedorNombre: string;
  vendedorDocumento?: string | null;
  vendedorTelefono?: string | null;
  deudaActual: number | string;
  boletasActuales: number;
  abonos: Array<{
    fecha: string;
    valor: number | string;
    codigoUnico?: string | null;
  }>;
};

type PrintableGastoReceiptInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  copies?: number;
  receipt: {
    consecutivo: number;
    codigoUnico: string;
    fecha: string;
    gasto: {
      categoria?: string;
      valor: number | string;
      descripcion: string;
      usuario?: {
        nombre?: string | null;
      } | null;
      rifa: {
        nombre: string;
      };
    };
  };
};

type PrintableGastoReportInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  reportTitle: string;
  filters?: {
    rifa?: string;
    categoria?: string;
    busqueda?: string;
  };
  gastos: Array<{
    fecha: string;
    valor: number | string;
    categoria: string;
    descripcion: string;
    codigoUnico?: string | null;
    consecutivo?: number | null;
    rifaNombre?: string | null;
  }>;
};

type PrintableCajaReportInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  reportTitle: string;
  rifaNombre: string;
  summary: {
    cajaGeneral: {
      nombre: string;
      saldo: number | string;
    };
    metricas: {
      dineroPorRecoger: number | string;
      dineroRecogido: number | string;
      dineroFaltante: number | string;
      totalIngresos: number | string;
      totalGastos: number | string;
    };
    subcajas: Array<{
      nombre: string;
      saldo: number | string;
      ingresosAbonos: number | string;
      egresosGastos: number | string;
    }>;
    vendedores: Array<{
      vendedor?: {
        nombre?: string | null;
      } | null;
      totalBoletas: number;
      dineroARecoger: number | string;
      dineroRecogido: number | string;
      faltante: number | string;
      estadoCuenta: string;
    }>;
  };
  gastos: Array<{
    categoria: string;
    valor: number | string;
  }>;
};

type PrintableVendorReportInput = {
  companyName: string;
  logoDataUrl?: string | null;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
  reportTitle: string;
  relationLabel: string;
  metrics: {
    totalAbonado: number | string;
    deudaActual: number | string;
    boletasTotales: number;
    boletasPagadas: number;
    boletasPendientes: number;
  };
  paymentMethods: Array<{
    label: string;
    value: number | string;
  }>;
  relations: Array<{
    rifaNombre: string;
    vendedorNombre: string;
    boletas: number;
    totalAbonado: number | string;
    saldoActual: number | string;
  }>;
};

type PrintablePublicBoletaFichaInput = {
  companyName: string;
  logoDataUrl?: string | null;
  supportText?: string | null;
  supportPhone?: string | null;
  supportWhatsapp?: string | null;
  supportEmail?: string | null;
  backgroundDataUrl?: string | null;
  publicUrl?: string | null;
  ficha: {
    numero: string;
    estado: string;
    total: number | string;
    totalAbonado: number | string;
    saldoPendiente: number | string;
    juega: boolean;
    clienteNombre?: string | null;
    clienteDocumento?: string | null;
    clienteTelefono?: string | null;
    vendedorNombre?: string | null;
    rifaNombre: string;
    boletasRelacionadas: string[];
    historialPagos: Array<{
      monto: number | string;
      fecha: string;
      metodoPago: string;
      descripcion?: string | null;
    }>;
  };
};

type PrintablePublicPurchaseSummaryInput = {
  companyName: string;
  logoDataUrl?: string | null;
  supportText?: string | null;
  supportPhone?: string | null;
  supportWhatsapp?: string | null;
  supportEmail?: string | null;
  backgroundDataUrl?: string | null;
  purchase: {
    estadoPago: string;
    referencia: string | null;
    transaccionId: string | null;
    fechaPago?: string | null;
    metodoPago?: string | null;
    descripcionPago?: string | null;
    total: number | string;
    cliente: {
      nombre: string;
      documento?: string | null;
      telefono?: string | null;
      email?: string | null;
    };
    vendedorNombre?: string | null;
    boletas: Array<{
      numero: string;
      estado: string;
    }>;
  };
};

const FIRST_PAGE_ROWS = 55;
const CONTINUED_PAGE_ROWS = 68;
const COLUMN_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildColumnMap(boletas: string[]) {
  const columnMap = new Map<string, string[]>();

  COLUMN_KEYS.forEach((key) => {
    columnMap.set(key, []);
  });

  [...boletas]
    .sort((left, right) => left.localeCompare(right))
    .forEach((numero) => {
      const columnKey = numero.charAt(0);
      const bucket = columnMap.get(columnKey);

      if (bucket) {
        bucket.push(numero);
      }
    });

  return columnMap;
}

function formatPrintDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

function formatReceiptDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatAssignmentSummary(
  items: Array<{
    fecha: string;
    cantidad: number;
  }>
) {
  return items.map((item) => {
    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(item.fecha));

    return `${formattedDate}: ${item.cantidad} boletas`;
  });
}

function paginateBoletaRows(maxRows: number) {
  if (maxRows <= 0) {
    return [{ startRow: 0, rowCount: 0, firstPage: true }];
  }

  const pages: Array<{ startRow: number; rowCount: number; firstPage: boolean }> = [];
  let startRow = 0;
  let remaining = maxRows;
  let firstPage = true;

  while (remaining > 0) {
    const limit = firstPage ? FIRST_PAGE_ROWS : CONTINUED_PAGE_ROWS;
    const rowCount = Math.min(limit, remaining);
    pages.push({ startRow, rowCount, firstPage });
    startRow += rowCount;
    remaining -= rowCount;
    firstPage = false;
  }

  return pages;
}

function formatReceiptMoney(value: string | number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCategoryLabel(value: string) {
  return String(value || 'OTROS')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function printHtmlDocument(title: string, html: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';

  document.body.appendChild(iframe);

  const printDocument = iframe.contentWindow?.document;
  const printWindow = iframe.contentWindow;

  if (!printDocument || !printWindow) {
    document.body.removeChild(iframe);
    throw new Error('No se pudo preparar la impresion en este navegador.');
  }

  printDocument.open();
  printDocument.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
      </head>
      <body>${html}</body>
    </html>
  `);
  printDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  const handlePrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } finally {
      cleanup();
    }
  };

  const waitForImages = () => {
    const images = Array.from(printDocument.images || []);

    if (images.length === 0) {
      handlePrint();
      return;
    }

    let pending = images.length;

    const resolveOne = () => {
      pending -= 1;
      if (pending <= 0) {
        window.setTimeout(handlePrint, 120);
      }
    };

    images.forEach((image) => {
      if (image.complete) {
        resolveOne();
        return;
      }

      image.addEventListener('load', resolveOne, { once: true });
      image.addEventListener('error', resolveOne, { once: true });
    });
  };

  if (printDocument.readyState === 'complete') {
    waitForImages();
    return;
  }

  iframe.onload = () => {
    waitForImages();
  };
}

export function printBoletaSheet({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  rifaNombre,
  vendedorNombre,
  vendedorTelefono,
  vendedorDireccion,
  comisionPct,
  precioCasa,
  boletas,
  assignmentSummary = [],
}: PrintableBoletaSheetInput) {
  if (!boletas.length) {
    throw new Error('No hay boletas para imprimir.');
  }

  const columnMap = buildColumnMap(boletas);
  const maxRows = Math.max(...COLUMN_KEYS.map((key) => columnMap.get(key)?.length || 0));
  const pages = paginateBoletaRows(maxRows);
  const totalPages = pages.length;
  const printedAt = formatPrintDateTime(new Date());
  const summaryLines = formatAssignmentSummary(assignmentSummary);

  const pagesHtml = pages
    .map(({ startRow, rowCount, firstPage }, pageIndex) => {
      const rowIndexes = Array.from({ length: rowCount }, (_, index) => startRow + index);
      const rowsHtml = rowIndexes
        .map((rowIndex) => {
          const cellsHtml = COLUMN_KEYS.map((columnKey) => {
            const value = columnMap.get(columnKey)?.[rowIndex] || '';
            return `<td>${escapeHtml(value)}</td>`;
          }).join('');

          return `<tr>${cellsHtml}</tr>`;
        })
        .join('');

      return `
        <section class="sheet">
          <table class="sheet-table">
            <thead>
              ${
                firstPage
                  ? `
                    <tr>
                      <th colspan="2" class="logo-cell">
                        ${
                          logoDataUrl
                            ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" class="logo" />`
                            : `<div class="logo-fallback">${escapeHtml(companyName.slice(0, 2).toUpperCase())}</div>`
                        }
                      </th>
                      <th colspan="8" class="title-cell">
                        <div class="title-eyebrow">PLANILLA DE BOLETAS</div>
                        <div class="title-main">${escapeHtml(rifaNombre.toUpperCase())}</div>
                        <div class="title-sub">${escapeHtml(companyName)}</div>
                      </th>
                    </tr>
                    <tr>
                      <th colspan="2" class="vendor-label">VENDEDOR</th>
                      <th colspan="3" class="vendor-value">${escapeHtml(vendedorNombre || 'N/A')}</th>
                      <th colspan="2" class="vendor-label">TELEFONO</th>
                      <th colspan="3" class="vendor-value">${escapeHtml(vendedorTelefono || 'N/A')}</th>
                    </tr>
                    <tr>
                      <th colspan="2" class="vendor-label">DIRECCION</th>
                      <th colspan="3" class="vendor-value">${escapeHtml(vendedorDireccion || 'N/A')}</th>
                      <th colspan="2" class="total-label">TOTAL BOLETAS</th>
                      <th colspan="3" class="total-value">${boletas.length}</th>
                    </tr>
                    <tr>
                      <th colspan="2" class="vendor-label">COMISION</th>
                      <th colspan="3" class="vendor-value">${escapeHtml(
                        comisionPct === undefined || comisionPct === null ? 'N/A' : `${comisionPct}%`
                      )}</th>
                      <th colspan="2" class="total-label">PAGA POR BOLETA</th>
                      <th colspan="3" class="total-value">${escapeHtml(
                        precioCasa === undefined || precioCasa === null ? 'N/A' : formatReceiptMoney(precioCasa)
                      )}</th>
                    </tr>
                    <tr>
                      <th colspan="2" class="responsable-label">RESPONSABLE</th>
                      <th colspan="3" class="responsable-value">${escapeHtml(responsableNombre || 'N/A')}</th>
                      <th colspan="2" class="responsable-label">TEL. RESPONSABLE</th>
                      <th colspan="3" class="responsable-value">${escapeHtml(responsableTelefono || 'N/A')}</th>
                    </tr>
                    <tr>
                      <th colspan="2" class="responsable-label">UBICACION</th>
                      <th colspan="3" class="responsable-value">${escapeHtml(
                        [responsableDireccion, responsableCiudad, responsableDepartamento]
                          .filter(Boolean)
                          .join(' - ') || 'N/A'
                      )}</th>
                      <th colspan="2" class="responsable-label">AUTORIZA</th>
                      <th colspan="3" class="responsable-value">${escapeHtml(entidadAutoriza || 'N/A')}</th>
                    </tr>
                    <tr>
                      <th colspan="2" class="responsable-label">RESOLUCION</th>
                      <th colspan="8" class="responsable-value">${escapeHtml(numeroResolucionAutorizacion || 'N/A')}</th>
                    </tr>
                  `
                  : ''
              }
              <tr class="numbers-head">
                ${COLUMN_KEYS.map((key) => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="sheet-footer ${firstPage ? '' : 'sheet-footer-compact'}">
            ${
              firstPage
                ? `
                  <div class="print-meta">Impreso: ${escapeHtml(printedAt)}</div>
                  <div class="assignment-meta">
                    ${
                      summaryLines.length
                        ? summaryLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')
                        : '<div>Sin resumen de asignaciones disponible.</div>'
                    }
                  </div>
                `
                : '<div></div><div></div>'
            }
            <div class="page-indicator">Pagina ${pageIndex + 1}/${totalPages}</div>
          </div>
        </section>
      `;
    })
    .join('');
  printHtmlDocument(
    `${companyName} - ${rifaNombre}`,
    `
    <html>
      <head>
        <title>${escapeHtml(`${companyName} - ${rifaNombre}`)}</title>
        <style>
          @page {
            size: letter portrait;
            margin: 6mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .sheet {
            width: 100%;
            page-break-after: always;
          }

          .sheet:last-child {
            page-break-after: auto;
          }

          .sheet-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .sheet-table th,
          .sheet-table td {
            border: 1px solid #000;
            text-align: center;
            padding: 1px 1px;
            font-size: 9px;
            line-height: 1.05;
            height: 14px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .sheet-table thead th {
            font-weight: 700;
          }

          .vendor-label,
          .vendor-value {
            background: #dbeafe !important;
          }

          .responsable-label,
          .responsable-value {
            background: #e5e7eb !important;
          }

          .total-label,
          .total-value {
            background: #fef3c7 !important;
          }

          .numbers-head th {
            background: #f8fafc !important;
          }

          .title-cell {
            text-align: left !important;
            padding: 6px 8px !important;
          }

          .title-eyebrow {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: .14em;
            color: #64748b;
            margin-bottom: 3px;
          }

          .title-main {
            font-size: 18px;
            line-height: 1.02;
            font-weight: 800;
            color: #000;
          }

          .title-sub {
            margin-top: 2px;
            font-size: 10px;
            color: #475569;
          }

          .logo-cell {
            width: 92px;
            padding: 4px 0 !important;
          }

          .logo {
            max-height: 48px;
            max-width: 72px;
            object-fit: contain;
          }

          .logo-fallback {
            margin: 0 auto;
            width: 42px;
            height: 42px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111827;
            color: #fff;
            font-weight: 700;
            font-size: 13px;
          }

          tbody td {
            font-size: 11px;
            height: 14px;
            font-weight: 600;
          }

          .sheet-footer {
            margin-top: 4px;
            display: grid;
            grid-template-columns: 1fr 2fr auto;
            gap: 12px;
            align-items: end;
          }

          .sheet-footer-compact {
            margin-top: 1px;
            grid-template-columns: 1fr auto;
            min-height: 10px;
          }

          .sheet-footer-compact > :first-child,
          .sheet-footer-compact > :nth-child(2) {
            display: none;
          }

          .print-meta {
            font-size: 9px;
            color: #475569;
          }

          .assignment-meta {
            font-size: 8px;
            color: #64748b;
            line-height: 1.35;
          }

          .page-indicator {
            text-align: right;
            font-size: 10px;
            font-weight: 700;
            line-height: 1;
          }
        </style>
      </head>
      <body>${pagesHtml}</body>
    </html>
  `
  );
}

export async function printReceiptTicket({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  verificationUrl,
  receipt,
  copies = 1,
}: PrintableReceiptInput) {
  const safeCopies = Math.max(1, Math.min(2, Math.floor(copies)));
  const relation = receipt.abono.rifaVendedor;
  const vendedor = relation.vendedor;
  const rifa = relation.rifa;
  const qrDataUrl = verificationUrl
    ? await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 160,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      })
    : '';

  const copiesHtml = Array.from({ length: safeCopies }, (_, index) => {
    const qrHtml = qrDataUrl
      ? `<div class="qr-wrap"><img src="${qrDataUrl}" alt="QR" class="qr-image" /></div>`
      : '';

    return `
      <section class="ticket">
        <div class="ticket-head">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" class="ticket-logo" />`
              : ''
          }
          <div class="ticket-company">${escapeHtml(companyName.toUpperCase())}</div>
          <div class="ticket-subtitle">RECIBO DE ABONO</div>
        </div>

        <div class="divider"></div>

        <div class="block-title">RESPONSABLE Y AUTORIZACION</div>
        <div class="text-line"><span class="label-inline">RESPONSABLE:</span> ${escapeHtml(
          responsableNombre || 'SIN RESPONSABLE'
        )}</div>
        <div class="text-line"><span class="label-inline">TEL. RESPONSABLE:</span> ${escapeHtml(
          responsableTelefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">UBICACION:</span> ${escapeHtml(
          [responsableDireccion, responsableCiudad, responsableDepartamento]
            .filter(Boolean)
            .join(' - ') || 'SIN UBICACION'
        )}</div>
        <div class="text-line"><span class="label-inline">AUTORIZA:</span> ${escapeHtml(
          entidadAutoriza || 'SIN ENTIDAD'
        )}</div>
        <div class="text-line"><span class="label-inline">RESOLUCION:</span> ${escapeHtml(
          numeroResolucionAutorizacion || 'SIN RESOLUCION'
        )}</div>

        <div class="divider"></div>

        <div class="row"><span>RIFA</span><strong>${escapeHtml(rifa.nombre)}</strong></div>
        <div class="row"><span>CONSEC.</span><strong>${escapeHtml(
          `ABN-${String(receipt.consecutivo).padStart(6, '0')}`
        )}</strong></div>
        <div class="row"><span>CODIGO</span><strong class="code">${escapeHtml(
          receipt.codigoUnico
        )}</strong></div>
        <div class="row"><span>FECHA</span><strong>${escapeHtml(
          formatReceiptDateTime(new Date(receipt.fecha))
        )}</strong></div>

        <div class="divider"></div>

        <div class="block-title">VENDEDOR</div>
        <div class="text-line strong">${escapeHtml(vendedor.nombre)}</div>
        <div class="text-line"><span class="label-inline">CEDULA:</span> ${escapeHtml(
          vendedor.documento || 'SIN DOCUMENTO'
        )}</div>
        <div class="text-line"><span class="label-inline">TELEFONO:</span> ${escapeHtml(
          vendedor.telefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">DIRECCION:</span> ${escapeHtml(
          vendedor.direccion || 'SIN DIRECCION'
        )}</div>

        <div class="divider"></div>

        <div class="row"><span>VALOR</span><strong>${escapeHtml(
          formatReceiptMoney(receipt.abono.valor)
        )}</strong></div>
        <div class="row"><span>DEUDA ANT.</span><strong>${escapeHtml(
          formatReceiptMoney(receipt.abono.saldoAnterior)
        )}</strong></div>
        <div class="row"><span>DEUDA REST.</span><strong>${escapeHtml(
          formatReceiptMoney(receipt.abono.saldoDespues)
        )}</strong></div>
        <div class="row"><span>BOLETAS</span><strong>${receipt.abono.boletasActuales}</strong></div>
        <div class="row"><span>METODO</span><strong>${escapeHtml(
          receipt.abono.metodoPago
        )}</strong></div>
        <div class="row"><span>REGISTRO</span><strong>${escapeHtml(
          receipt.abono.usuario?.nombre || 'SISTEMA'
        )}</strong></div>

        <div class="divider"></div>

        <div class="block-title">DESCRIPCION</div>
        <div class="text-box">${escapeHtml(receipt.abono.descripcion || 'SIN DESCRIPCION')}</div>

        <div class="divider"></div>

        ${qrHtml}

        <div class="ticket-foot">
          <div>Verifica este recibo escaneando el QR.</div>
          <div>Copia ${index + 1} de ${safeCopies}</div>
        </div>
      </section>
    `;
  }).join('');

  printHtmlDocument(
    `${companyName} - Recibo de abono`,
    `
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm 0 0 0;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: "Courier New", Courier, monospace;
        }

        .ticket {
          width: 72mm;
          margin: 0;
          padding: 0 0 3mm 2mm;
          page-break-after: always;
        }

        .ticket:last-child {
          page-break-after: auto;
        }

        .ticket-head {
          text-align: center;
        }

        .ticket-logo {
          display: block;
          max-width: 18mm;
          max-height: 18mm;
          margin: 0 auto 2mm;
          object-fit: contain;
        }

        .ticket-company {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
        }

        .ticket-subtitle {
          margin-top: 1mm;
          font-size: 11px;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 3mm;
          font-size: 10px;
          line-height: 1.35;
          margin: 1mm 0;
        }

        .row span:first-child {
          white-space: nowrap;
        }

        .row strong {
          text-align: right;
        }

        .block-title {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 1.5mm;
        }

        .text-line {
          font-size: 10px;
          line-height: 1.35;
          text-align: center;
        }

        .label-inline {
          font-weight: 700;
        }

        .strong {
          font-weight: 700;
        }

        .code {
          font-size: 9px;
          word-break: break-word;
        }

        .text-box {
          font-size: 10px;
          line-height: 1.35;
          text-align: center;
          white-space: pre-wrap;
        }

        .qr-wrap {
          text-align: center;
          margin: 2mm 0;
        }

        .qr-image {
          width: 28mm;
          height: 28mm;
          object-fit: contain;
        }

        .ticket-foot {
          text-align: center;
          font-size: 9px;
          line-height: 1.35;
        }
      </style>
      ${copiesHtml}
    `
  );
}

export async function printClientReceiptTicket({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  verificationUrl,
  receipt,
  copies = 1,
}: PrintableClientReceiptInput) {
  const safeCopies = Math.max(1, Math.min(2, Math.floor(copies)));
  const pago = receipt.pagoCliente;
  const venta = pago.venta;
  const cliente = venta.cliente;
  const qrDataUrl = verificationUrl
    ? await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 160,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      })
    : '';

  const copiesHtml = Array.from({ length: safeCopies }, () => {
    const qrHtml = qrDataUrl
      ? `<div class="qr-wrap"><img src="${qrDataUrl}" alt="QR" class="qr-image" /></div>`
      : '';

    return `
      <section class="ticket">
        <div class="ticket-head">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" class="ticket-logo" />`
              : ''
          }
          <div class="ticket-company">${escapeHtml(companyName.toUpperCase())}</div>
          <div class="ticket-subtitle">RECIBO DE CLIENTE</div>
        </div>

        <div class="divider"></div>

        <div class="block-title">RESPONSABLE Y AUTORIZACION</div>
        <div class="text-line"><span class="label-inline">RESPONSABLE:</span> ${escapeHtml(
          responsableNombre || 'SIN RESPONSABLE'
        )}</div>
        <div class="text-line"><span class="label-inline">TEL. RESPONSABLE:</span> ${escapeHtml(
          responsableTelefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">UBICACION:</span> ${escapeHtml(
          [responsableDireccion, responsableCiudad, responsableDepartamento]
            .filter(Boolean)
            .join(' - ') || 'SIN UBICACION'
        )}</div>
        <div class="text-line"><span class="label-inline">AUTORIZA:</span> ${escapeHtml(
          entidadAutoriza || 'SIN ENTIDAD'
        )}</div>
        <div class="text-line"><span class="label-inline">RESOLUCION:</span> ${escapeHtml(
          numeroResolucionAutorizacion || 'SIN RESOLUCION'
        )}</div>

        <div class="divider"></div>

        <div class="row"><span>RIFA</span><strong>${escapeHtml(venta.rifa.nombre)}</strong></div>
        <div class="row"><span>CONSEC.</span><strong>${escapeHtml(
          `CLI-${String(receipt.consecutivo).padStart(6, '0')}`
        )}</strong></div>
        <div class="row"><span>CODIGO</span><strong class="code">${escapeHtml(
          receipt.codigoUnico
        )}</strong></div>
        <div class="row"><span>FECHA</span><strong>${escapeHtml(
          formatReceiptDateTime(new Date(receipt.fecha))
        )}</strong></div>

        <div class="divider"></div>

        <div class="block-title">CLIENTE</div>
        <div class="text-line"><span class="label-inline">NOMBRE:</span> ${escapeHtml(
          cliente.nombre
        )}</div>
        <div class="text-line"><span class="label-inline">DOCUMENTO:</span> ${escapeHtml(
          cliente.documento || 'SIN DOCUMENTO'
        )}</div>
        <div class="text-line"><span class="label-inline">TELEFONO:</span> ${escapeHtml(
          cliente.telefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">CANAL:</span> ${escapeHtml(
          venta.rifaVendedor?.vendedor?.nombre || 'SIN CANAL'
        )}</div>

        <div class="divider"></div>

        <div class="row"><span>PAGO</span><strong>${escapeHtml(
          formatReceiptMoney(pago.monto)
        )}</strong></div>
        <div class="row"><span>TOTAL VENTA</span><strong>${escapeHtml(
          formatReceiptMoney(venta.total)
        )}</strong></div>
        <div class="row"><span>SALDO</span><strong>${escapeHtml(
          formatReceiptMoney(venta.saldoPendiente)
        )}</strong></div>
        <div class="row"><span>METODO</span><strong>${escapeHtml(pago.metodoPago)}</strong></div>
        <div class="row"><span>SUBCAJA</span><strong>${escapeHtml(
          pago.subCaja?.nombre || 'SIN SUBCAJA'
        )}</strong></div>
        <div class="row"><span>REGISTRO</span><strong>${escapeHtml(
          pago.usuario?.nombre || 'SISTEMA'
        )}</strong></div>

        <div class="divider"></div>

        <div class="block-title">BOLETAS</div>
        <div class="text-box">${escapeHtml(
          (venta.boletas || []).map((item) => item.numero).join(', ') || 'SIN BOLETAS'
        )}</div>

        <div class="divider"></div>

        <div class="block-title">DESCRIPCION</div>
        <div class="text-box">${escapeHtml(pago.descripcion || 'SIN DESCRIPCION')}</div>

        <div class="divider"></div>

        <div class="ticket-foot">
          ${
            qrHtml
              ? `${qrHtml}<div class="verification-copy">Escanea este codigo para verificar el recibo.</div>`
              : '<div class="verification-copy">Recibo interno generado por el sistema.</div>'
          }
        </div>
      </section>
    `;
  }).join('<div class="ticket-gap"></div>');

  printHtmlDocument(
    `${companyName} - Recibo de cliente`,
    `
      <style>
        ${sharedReceiptStyles}
      </style>
      <main class="ticket-sheet">${copiesHtml}</main>
    `
  );
}

export function printAbonosSummaryTicket({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  rifaNombre,
  vendedorNombre,
  vendedorDocumento,
  vendedorTelefono,
  deudaActual,
  boletasActuales,
  abonos,
}: PrintableAbonosSummaryInput) {
  if (!abonos.length) {
    throw new Error('No hay abonos para imprimir en el resumen.');
  }

  const totalAbonado = abonos.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const abonosHtml = abonos
    .map(
      (item) => `
        <div class="entry">
          <div class="entry-row">
            <span class="entry-label">FECHA</span>
            <span class="entry-value">${escapeHtml(formatReceiptDateTime(new Date(item.fecha)))}</span>
          </div>
          <div class="entry-row">
            <span class="entry-label">VALOR</span>
            <span class="entry-value">${escapeHtml(formatReceiptMoney(item.valor))}</span>
          </div>
          <div class="entry-row block">
            <span class="entry-label">CODIGO</span>
            <span class="entry-code">${escapeHtml(item.codigoUnico || 'SIN CODIGO')}</span>
          </div>
        </div>
      `
    )
    .join('');

  printHtmlDocument(
    `${companyName} - Resumen de abonos`,
    `
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm 0 0 0;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: "Courier New", Courier, monospace;
        }

        .ticket {
          width: 72mm;
          margin: 0;
          padding: 0 0 3mm 2mm;
        }

        .head {
          text-align: center;
        }

        .logo {
          display: block;
          max-width: 18mm;
          max-height: 18mm;
          margin: 0 auto 2mm;
          object-fit: contain;
        }

        .company {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
        }

        .subtitle {
          margin-top: 1mm;
          font-size: 11px;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        .text-line,
        .summary-row,
        .entry-row {
          font-size: 10px;
          line-height: 1.35;
        }

        .text-line {
          text-align: center;
        }

        .label-inline,
        .entry-label {
          font-weight: 700;
        }

        .summary-row,
        .entry-row {
          display: flex;
          justify-content: space-between;
          gap: 3mm;
          margin: 1mm 0;
        }

        .summary-value,
        .entry-value {
          text-align: right;
        }

        .entry {
          border-top: 1px dashed #000;
          padding-top: 2mm;
          margin-top: 2mm;
        }

        .entry:first-of-type {
          border-top: 0;
          padding-top: 0;
          margin-top: 0;
        }

        .block {
          display: block;
        }

        .entry-code {
          display: block;
          margin-top: 1mm;
          font-size: 9px;
          word-break: break-word;
          text-align: left;
        }
      </style>
      <section class="ticket">
        <div class="head">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" class="logo" />`
              : ''
          }
          <div class="company">${escapeHtml(companyName.toUpperCase())}</div>
          <div class="subtitle">RESUMEN DE ABONOS</div>
        </div>

        <div class="divider"></div>

        <div class="text-line"><span class="label-inline">RESPONSABLE:</span> ${escapeHtml(
          responsableNombre || 'SIN RESPONSABLE'
        )}</div>
        <div class="text-line"><span class="label-inline">TEL. RESPONSABLE:</span> ${escapeHtml(
          responsableTelefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">AUTORIZA:</span> ${escapeHtml(
          entidadAutoriza || 'SIN ENTIDAD'
        )}</div>
        <div class="text-line"><span class="label-inline">RESOLUCION:</span> ${escapeHtml(
          numeroResolucionAutorizacion || 'SIN RESOLUCION'
        )}</div>

        <div class="divider"></div>

        <div class="text-line"><span class="label-inline">RIFA:</span> ${escapeHtml(rifaNombre)}</div>
        <div class="text-line"><span class="label-inline">VENDEDOR:</span> ${escapeHtml(vendedorNombre)}</div>
        <div class="text-line"><span class="label-inline">CEDULA:</span> ${escapeHtml(
          vendedorDocumento || 'SIN DOCUMENTO'
        )}</div>
        <div class="text-line"><span class="label-inline">TELEFONO:</span> ${escapeHtml(
          vendedorTelefono || 'SIN TELEFONO'
        )}</div>

        <div class="divider"></div>

        <div class="summary-row">
          <span class="entry-label">DEUDA ACTUAL</span>
          <span class="summary-value">${escapeHtml(formatReceiptMoney(deudaActual))}</span>
        </div>
        <div class="summary-row">
          <span class="entry-label">TOTAL BOLETAS</span>
          <span class="summary-value">${boletasActuales}</span>
        </div>
        <div class="summary-row">
          <span class="entry-label">TOTAL ABONADO</span>
          <span class="summary-value">${escapeHtml(formatReceiptMoney(totalAbonado))}</span>
        </div>
        <div class="summary-row">
          <span class="entry-label">CANT. ABONOS</span>
          <span class="summary-value">${abonos.length}</span>
        </div>

        <div class="divider"></div>

        ${abonosHtml}
      </section>
    `
  );
}

export function printGastoReceiptTicket({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  copies = 1,
  receipt,
}: PrintableGastoReceiptInput) {
  const safeCopies = Math.max(1, Math.min(2, Math.floor(copies)));

  const copiesHtml = Array.from({ length: safeCopies }, (_, index) => `
      <section class="ticket">
        <div class="ticket-head">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" class="ticket-logo" />`
              : ''
          }
          <div class="ticket-company">${escapeHtml(companyName.toUpperCase())}</div>
          <div class="ticket-subtitle">RECIBO DE GASTO</div>
        </div>

        <div class="divider"></div>

        <div class="block-title">RESPONSABLE Y AUTORIZACION</div>
        <div class="text-line"><span class="label-inline">RESPONSABLE:</span> ${escapeHtml(
          responsableNombre || 'SIN RESPONSABLE'
        )}</div>
        <div class="text-line"><span class="label-inline">TEL. RESPONSABLE:</span> ${escapeHtml(
          responsableTelefono || 'SIN TELEFONO'
        )}</div>
        <div class="text-line"><span class="label-inline">UBICACION:</span> ${escapeHtml(
          [responsableDireccion, responsableCiudad, responsableDepartamento]
            .filter(Boolean)
            .join(' - ') || 'SIN UBICACION'
        )}</div>
        <div class="text-line"><span class="label-inline">AUTORIZA:</span> ${escapeHtml(
          entidadAutoriza || 'SIN ENTIDAD'
        )}</div>
        <div class="text-line"><span class="label-inline">RESOLUCION:</span> ${escapeHtml(
          numeroResolucionAutorizacion || 'SIN RESOLUCION'
        )}</div>

        <div class="divider"></div>

        <div class="row"><span>RIFA</span><strong>${escapeHtml(receipt.gasto.rifa.nombre)}</strong></div>
        <div class="row"><span>CONSEC.</span><strong>${escapeHtml(
          `GST-${String(receipt.consecutivo).padStart(6, '0')}`
        )}</strong></div>
        <div class="row"><span>CODIGO</span><strong class="code">${escapeHtml(
          receipt.codigoUnico
        )}</strong></div>
        <div class="row"><span>FECHA</span><strong>${escapeHtml(
          formatReceiptDateTime(new Date(receipt.fecha))
        )}</strong></div>
        <div class="row"><span>CATEGORIA</span><strong>${escapeHtml(
          String(receipt.gasto.categoria || 'OTROS').replaceAll('_', ' ')
        )}</strong></div>

        <div class="divider"></div>

        <div class="row"><span>VALOR</span><strong>${escapeHtml(
          formatReceiptMoney(receipt.gasto.valor)
        )}</strong></div>
        <div class="row"><span>REGISTRO</span><strong>${escapeHtml(
          receipt.gasto.usuario?.nombre || 'SISTEMA'
        )}</strong></div>

        <div class="divider"></div>

        <div class="block-title">DESCRIPCION</div>
        <div class="text-box">${escapeHtml(receipt.gasto.descripcion || 'SIN DESCRIPCION')}</div>

        <div class="divider"></div>

        <div class="ticket-foot">
          <div>Comprobante interno de gasto.</div>
          <div>Copia ${index + 1} de ${safeCopies}</div>
        </div>
      </section>
    `).join('');

  printHtmlDocument(
    `${companyName} - Recibo de gasto`,
    `
      <style>
        @page {
          size: 80mm auto;
          margin: 2mm 0 0 0;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: "Courier New", Courier, monospace;
        }

        .ticket {
          width: 72mm;
          margin: 0;
          padding: 0 0 3mm 2mm;
          page-break-after: always;
        }

        .ticket:last-child {
          page-break-after: auto;
        }

        .ticket-head {
          text-align: center;
        }

        .ticket-logo {
          display: block;
          max-width: 18mm;
          max-height: 18mm;
          margin: 0 auto 2mm;
          object-fit: contain;
        }

        .ticket-company {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
        }

        .ticket-subtitle {
          margin-top: 1mm;
          font-size: 11px;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 3mm;
          font-size: 10px;
          line-height: 1.35;
          margin: 1mm 0;
        }

        .row span:first-child {
          white-space: nowrap;
        }

        .row strong {
          text-align: right;
        }

        .block-title {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 1.5mm;
        }

        .text-line {
          font-size: 10px;
          line-height: 1.35;
          text-align: center;
        }

        .label-inline {
          font-weight: 700;
        }

        .code {
          font-size: 9px;
          word-break: break-word;
        }

        .text-box {
          font-size: 10px;
          line-height: 1.35;
          text-align: center;
          white-space: pre-wrap;
        }

        .ticket-foot {
          text-align: center;
          font-size: 9px;
          line-height: 1.35;
        }
      </style>
      ${copiesHtml}
    `
  );
}

export function printGastoLetterReport({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  reportTitle,
  filters,
  gastos,
}: PrintableGastoReportInput) {
  if (!gastos.length) {
    throw new Error('No hay gastos visibles para imprimir el informe.');
  }

  const printedAt = formatPrintDateTime(new Date());
  const grouped = gastos.reduce<Record<string, typeof gastos>>((acc, gasto) => {
    const key = gasto.categoria || 'OTROS';
    acc[key] = acc[key] || [];
    acc[key].push(gasto);
    return acc;
  }, {});

  const categories = Object.entries(grouped)
    .map(([categoria, items]) => {
      const total = items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
      return {
        categoria,
        label: formatCategoryLabel(categoria),
        items: [...items].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
        total,
        count: items.length,
      };
    })
    .sort((a, b) => b.total - a.total);

  const grandTotal = categories.reduce((sum, category) => sum + category.total, 0);
  const maxCategoryTotal = Math.max(...categories.map((category) => category.total), 1);

  const overviewRows = categories
    .map((category) => {
      const percent = Math.max(6, Math.round((category.total / maxCategoryTotal) * 100));
      return `
        <div class="chart-row">
          <div class="chart-meta">
            <div class="chart-name">${escapeHtml(category.label)}</div>
            <div class="chart-detail">${category.count} gastos</div>
          </div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${percent}%"></div>
          </div>
          <div class="chart-value">${escapeHtml(formatReceiptMoney(category.total))}</div>
        </div>
      `;
    })
    .join('');

  const categoryTables = categories
    .map(
      (category) => `
        <section class="category-section">
          <div class="category-head">
            <div>
              <h3>${escapeHtml(category.label)}</h3>
              <p>${category.count} registros en esta categoria</p>
            </div>
            <div class="category-total">${escapeHtml(formatReceiptMoney(category.total))}</div>
          </div>
          <table class="report-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>HORA</th>
                <th>RIFA</th>
                <th>DESCRIPCION</th>
                <th>CODIGO</th>
                <th>VALOR</th>
              </tr>
            </thead>
            <tbody>
              ${category.items
                .map((item) => {
                  const date = new Date(item.fecha);
                  const dateOnly = new Intl.DateTimeFormat('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }).format(date);
                  const timeOnly = new Intl.DateTimeFormat('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }).format(date);

                  return `
                    <tr>
                      <td>${escapeHtml(dateOnly)}</td>
                      <td>${escapeHtml(timeOnly)}</td>
                      <td>${escapeHtml(item.rifaNombre || 'SIN RIFA')}</td>
                      <td>${escapeHtml(item.descripcion || 'SIN DESCRIPCION')}</td>
                      <td>${escapeHtml(item.codigoUnico || item.consecutivo ? `GST-${String(item.consecutivo || '').padStart(6, '0')}` : 'SIN CODIGO')}</td>
                      <td class="money">${escapeHtml(formatReceiptMoney(item.valor))}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </section>
      `
    )
    .join('');

  const summaryTableRows = categories
    .map(
      (category) => `
        <tr>
          <td>${escapeHtml(category.label)}</td>
          <td>${category.count}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(category.total))}</td>
        </tr>
      `
    )
    .join('');

  const filterBlocks = [
    filters?.rifa ? `Rifa: ${filters.rifa}` : '',
    filters?.categoria ? `Categoria: ${filters.categoria}` : '',
    filters?.busqueda ? `Busqueda: ${filters.busqueda}` : '',
  ]
    .filter(Boolean)
    .map((item) => `<span class="filter-pill">${escapeHtml(item)}</span>`)
    .join('');

  printHtmlDocument(
    `${companyName} - Informe de gastos`,
    `
      <style>
        @page {
          size: letter;
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          background: #ffffff;
        }

        .report {
          width: 100%;
        }

        .header {
          display: grid;
          grid-template-columns: 88px 1fr;
          gap: 18px;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px 18px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
        }

        .logo-wrap {
          width: 88px;
          height: 88px;
          border-radius: 18px;
          border: 1px solid #dbeafe;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .logo-wrap img {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #64748b;
          text-transform: uppercase;
        }

        .title {
          margin: 6px 0 0;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 800;
          text-transform: uppercase;
        }

        .subtitle {
          margin: 6px 0 0;
          font-size: 13px;
          color: #475569;
        }

        .meta-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .meta-card {
          border: 1px solid #dbeafe;
          border-radius: 14px;
          padding: 12px;
          background: #f8fafc;
        }

        .meta-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #64748b;
          text-transform: uppercase;
        }

        .meta-value {
          margin-top: 8px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
        }

        .filters {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-pill {
          border-radius: 999px;
          background: #e2e8f0;
          color: #0f172a;
          font-size: 11px;
          padding: 6px 10px;
        }

        .summary-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 16px;
        }

        .panel {
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px;
          background: #fff;
        }

        .panel h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .panel p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .chart-list {
          margin-top: 14px;
          display: grid;
          gap: 12px;
        }

        .chart-row {
          display: grid;
          grid-template-columns: 150px 1fr 110px;
          gap: 12px;
          align-items: center;
        }

        .chart-name {
          font-size: 13px;
          font-weight: 700;
        }

        .chart-detail {
          margin-top: 2px;
          font-size: 11px;
          color: #64748b;
        }

        .chart-bar-wrap {
          width: 100%;
          height: 12px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .chart-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
        }

        .chart-value {
          font-size: 12px;
          font-weight: 700;
          text-align: right;
        }

        .hero-total {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .hero-box {
          border-radius: 14px;
          padding: 14px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .hero-box .big {
          margin-top: 8px;
          font-size: 28px;
          font-weight: 800;
        }

        .section-break {
          page-break-before: always;
        }

        .category-section {
          margin-top: 18px;
          page-break-inside: avoid;
        }

        .category-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
          margin-bottom: 10px;
        }

        .category-head h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .category-head p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .category-total {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .report-table th,
        .report-table td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 11px;
          vertical-align: top;
        }

        .report-table th {
          background: #f1f5f9;
          text-align: left;
          font-weight: 800;
        }

        .money {
          text-align: right;
          white-space: nowrap;
          font-weight: 700;
        }

        .final-summary {
          margin-top: 20px;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px;
          background: #fffaf0;
          page-break-inside: avoid;
        }

        .final-summary h2 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }

        .totals-table th,
        .totals-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 8px;
          font-size: 12px;
        }

        .totals-table th {
          text-align: left;
          color: #475569;
        }

        .totals-table tfoot td {
          border-top: 2px solid #0f172a;
          border-bottom: 0;
          font-size: 15px;
          font-weight: 800;
        }

        .footer-note {
          margin-top: 14px;
          font-size: 11px;
          color: #64748b;
          text-align: right;
        }
      </style>
      <section class="report">
        <section class="header">
          <div class="logo-wrap">
            ${logoDataUrl ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" />` : ''}
          </div>
          <div>
            <div class="eyebrow">Informe administrativo</div>
            <div class="title">${escapeHtml(reportTitle)}</div>
            <div class="subtitle">Resumen ejecutivo de gastos agrupados por categoria, listo para revision del administrador y socios.</div>
          </div>
        </section>

        <section class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Casa rifera</div>
            <div class="meta-value">${escapeHtml(companyName)}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Responsable</div>
            <div class="meta-value">${escapeHtml(responsableNombre || 'Sin responsable')}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Ubicacion</div>
            <div class="meta-value">${escapeHtml(
              [responsableDireccion, responsableCiudad, responsableDepartamento].filter(Boolean).join(' - ') ||
                'Sin ubicacion'
            )}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Autorizacion</div>
            <div class="meta-value">${escapeHtml(
              [entidadAutoriza, numeroResolucionAutorizacion].filter(Boolean).join(' / ') || 'Sin dato'
            )}</div>
          </div>
        </section>

        ${filterBlocks ? `<section class="filters">${filterBlocks}</section>` : ''}

        <section class="summary-grid">
          <div class="panel">
            <h2>Distribucion por categoria</h2>
            <p>Vista rapida para identificar donde se concentra el gasto.</p>
            <div class="chart-list">${overviewRows}</div>
          </div>
          <div class="panel">
            <h2>Resumen general</h2>
            <p>Cifras consolidadas del conjunto filtrado.</p>
            <div class="hero-total">
              <div class="hero-box">
                <div class="meta-label">Total de gastos</div>
                <div class="big">${gastos.length}</div>
              </div>
              <div class="hero-box">
                <div class="meta-label">Valor total</div>
                <div class="big">${escapeHtml(formatReceiptMoney(grandTotal))}</div>
              </div>
              <div class="hero-box">
                <div class="meta-label">Categorias activas</div>
                <div class="big">${categories.length}</div>
              </div>
              <div class="hero-box">
                <div class="meta-label">Impreso</div>
                <div class="meta-value">${escapeHtml(printedAt)}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-break">
          ${categoryTables}
        </section>

        <section class="final-summary">
          <h2>Totales por categoria</h2>
          <table class="totals-table">
            <thead>
              <tr>
                <th>CATEGORIA</th>
                <th>CANTIDAD</th>
                <th class="money">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${summaryTableRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">TOTAL GENERAL DE GASTOS</td>
                <td class="money">${escapeHtml(formatReceiptMoney(grandTotal))}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer-note">Informe generado automaticamente desde el panel administrativo.</div>
        </section>
      </section>
    `
  );
}

export function printCajaLetterReport({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  reportTitle,
  rifaNombre,
  summary,
  gastos,
}: PrintableCajaReportInput) {
  const printedAt = formatPrintDateTime(new Date());
  const groupedGastos = gastos.reduce<Record<string, number>>((acc, item) => {
    const key = item.categoria || 'OTROS';
    acc[key] = (acc[key] || 0) + Number(item.valor || 0);
    return acc;
  }, {});

  const gastoRows = Object.entries(groupedGastos)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([categoria, total]) => `
        <tr>
          <td>${escapeHtml(formatCategoryLabel(categoria))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(total))}</td>
        </tr>
      `
    )
    .join('');

  const subCajaRows = summary.subcajas
    .map(
      (subCaja) => `
        <tr>
          <td>${escapeHtml(subCaja.nombre)}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(subCaja.saldo))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(subCaja.ingresosAbonos))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(subCaja.egresosGastos))}</td>
        </tr>
      `
    )
    .join('');

  const vendedorRows = summary.vendedores
    .map((item) => {
      const stateClass =
        item.estadoCuenta === 'AL_DIA'
          ? 'row-green'
          : item.estadoCuenta === 'PENDIENTE'
            ? 'row-red'
            : 'row-amber';

      const stateLabel =
        item.estadoCuenta === 'AL_DIA'
          ? 'AL DIA'
          : item.estadoCuenta === 'PENDIENTE'
            ? 'DEBE'
            : 'SALDO A FAVOR';

      return `
        <tr class="${stateClass}">
          <td>${escapeHtml(item.vendedor?.nombre || 'SIN VENDEDOR')}</td>
          <td>${item.totalBoletas}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.dineroARecoger))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.dineroRecogido))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.faltante))}</td>
          <td class="state-text">${stateLabel}</td>
        </tr>
      `;
    })
    .join('');

  printHtmlDocument(
    `${companyName} - Informe de caja`,
    `
      <style>
        @page { size: letter; margin: 12mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
        .report { width: 100%; }
        .header {
          display:grid; grid-template-columns:88px 1fr; gap:18px; align-items:center;
          border:1px solid #cbd5e1; border-radius:16px; padding:16px 18px;
          background:linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
        }
        .logo-wrap {
          width:88px; height:88px; border-radius:18px; border:1px solid #dbeafe;
          background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;
        }
        .logo-wrap img { max-width:80px; max-height:80px; object-fit:contain; }
        .eyebrow { font-size:11px; font-weight:700; letter-spacing:.18em; color:#64748b; text-transform:uppercase; }
        .title { margin:6px 0 0; font-size:28px; line-height:1.1; font-weight:800; text-transform:uppercase; }
        .subtitle { margin:6px 0 0; font-size:13px; color:#475569; }
        .meta-grid { margin-top:12px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .meta-card { border:1px solid #dbeafe; border-radius:14px; padding:12px; background:#f8fafc; }
        .meta-label { font-size:10px; font-weight:700; letter-spacing:.12em; color:#64748b; text-transform:uppercase; }
        .meta-value { margin-top:8px; font-size:14px; font-weight:700; line-height:1.3; }
        .summary-grid { margin-top:16px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .summary-card { border:1px solid #cbd5e1; border-radius:14px; padding:14px; background:#fff; min-height:102px; }
        .summary-card-collect { background:#fff7ed; border-color:#fdba74; }
        .summary-card-collected { background:#ecfdf5; border-color:#86efac; }
        .summary-card-missing { background:#fef2f2; border-color:#fca5a5; }
        .summary-value {
          margin-top:10px;
          font-size:18px;
          font-weight:800;
          line-height:1.1;
          letter-spacing:-0.03em;
          white-space:nowrap;
          font-variant-numeric: tabular-nums;
        }
        .summary-value-money {
          font-size:17px;
        }
        .meta-value-print {
          margin-top:8px;
          font-size:13px;
          font-weight:700;
          line-height:1.25;
        }
        .section { margin-top:18px; border:1px solid #cbd5e1; border-radius:16px; padding:16px; page-break-inside:avoid; }
        .section h2 { margin:0; font-size:18px; font-weight:800; text-transform:uppercase; }
        .section p { margin:6px 0 0; color:#64748b; font-size:12px; }
        .grid-2 { margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; }
        th, td { border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; vertical-align:top; }
        th { background:#f1f5f9; text-align:left; font-weight:800; }
        .money { text-align:right; white-space:nowrap; font-weight:700; }
        .row-green td { background:#dcfce7; color:#166534; }
        .row-red td { background:#fee2e2; color:#b91c1c; }
        .row-amber td { background:#fef3c7; color:#92400e; }
        .state-text { font-weight:800; }
        .footer-note { margin-top:14px; font-size:11px; color:#64748b; text-align:right; }
      </style>
      <section class="report">
        <section class="header">
          <div class="logo-wrap">${logoDataUrl ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" />` : ''}</div>
          <div>
            <div class="eyebrow">Informe administrativo</div>
            <div class="title">${escapeHtml(reportTitle)}</div>
            <div class="subtitle">Consolidado de ingresos, egresos, subcajas y estado de pago por vendedor para la rifa ${escapeHtml(rifaNombre)}.</div>
          </div>
        </section>

        <section class="meta-grid">
          <div class="meta-card"><div class="meta-label">Casa rifera</div><div class="meta-value">${escapeHtml(companyName)}</div></div>
          <div class="meta-card"><div class="meta-label">Responsable</div><div class="meta-value">${escapeHtml(responsableNombre || 'Sin responsable')}</div></div>
          <div class="meta-card"><div class="meta-label">Ubicacion</div><div class="meta-value">${escapeHtml([responsableDireccion, responsableCiudad, responsableDepartamento].filter(Boolean).join(' - ') || 'Sin ubicacion')}</div></div>
          <div class="meta-card"><div class="meta-label">Autorizacion</div><div class="meta-value">${escapeHtml([entidadAutoriza, numeroResolucionAutorizacion].filter(Boolean).join(' / ') || 'Sin dato')}</div></div>
        </section>

        <section class="summary-grid">
          <div class="summary-card"><div class="meta-label">Caja general</div><div class="summary-value summary-value-money">${escapeHtml(formatReceiptMoney(summary.cajaGeneral.saldo))}</div></div>
          <div class="summary-card summary-card-collect"><div class="meta-label">Dinero a recoger</div><div class="summary-value summary-value-money">${escapeHtml(formatReceiptMoney(summary.metricas.dineroPorRecoger))}</div></div>
          <div class="summary-card summary-card-collected"><div class="meta-label">Dinero recogido</div><div class="summary-value summary-value-money">${escapeHtml(formatReceiptMoney(summary.metricas.dineroRecogido))}</div></div>
          <div class="summary-card summary-card-missing"><div class="meta-label">Faltante</div><div class="summary-value summary-value-money">${escapeHtml(formatReceiptMoney(summary.metricas.dineroFaltante))}</div></div>
          <div class="summary-card"><div class="meta-label">Impreso</div><div class="meta-value-print">${escapeHtml(printedAt)}</div></div>
        </section>

        <section class="section">
          <h2>Resumen financiero</h2>
          <p>Balance global de ingresos y egresos de la rifa.</p>
          <div class="grid-2">
            <table>
              <thead><tr><th>CONCEPTO</th><th class="money">VALOR</th></tr></thead>
              <tbody>
                <tr><td>Ingresos por abonos</td><td class="money">${escapeHtml(formatReceiptMoney(summary.metricas.totalIngresos))}</td></tr>
                <tr><td>Egresos por gastos</td><td class="money">${escapeHtml(formatReceiptMoney(summary.metricas.totalGastos))}</td></tr>
                <tr><td>Saldo de caja general</td><td class="money">${escapeHtml(formatReceiptMoney(summary.cajaGeneral.saldo))}</td></tr>
              </tbody>
            </table>
            <table>
              <thead><tr><th>CATEGORIA DE GASTO</th><th class="money">TOTAL</th></tr></thead>
              <tbody>${gastoRows || '<tr><td>Sin gastos</td><td class="money">$ 0</td></tr>'}</tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>Subcajas</h2>
          <p>Saldo actual y flujo básico por subcaja.</p>
          <table>
            <thead>
              <tr>
                <th>SUBCAJA</th>
                <th class="money">SALDO</th>
                <th class="money">ABONOS RECIBIDOS</th>
                <th class="money">GASTOS</th>
              </tr>
            </thead>
            <tbody>${subCajaRows}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Estado por vendedor</h2>
          <p>Control de recaudo comparando dinero esperado, recibido y faltante.</p>
          <table>
            <thead>
              <tr>
                <th>VENDEDOR</th>
                <th>TOTAL BOLETAS</th>
                <th class="money">DINERO A RECOGER</th>
                <th class="money">DINERO RECOGIDO</th>
                <th class="money">FALTANTE / SALDO</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>${vendedorRows}</tbody>
          </table>
        </section>

        <div class="footer-note">Informe general de caja generado automaticamente desde el panel administrativo.</div>
      </section>
    `
  );
}

export function printVendorLetterReport({
  companyName,
  logoDataUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
  reportTitle,
  relationLabel,
  metrics,
  paymentMethods,
  relations,
}: PrintableVendorReportInput) {
  const printedAt = formatPrintDateTime(new Date());
  const paymentMethodRows = paymentMethods
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.value))}</td>
        </tr>
      `
    )
    .join('');

  const relationRows = relations
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.rifaNombre)}</td>
          <td>${escapeHtml(item.vendedorNombre)}</td>
          <td>${item.boletas}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.totalAbonado))}</td>
          <td class="money">${escapeHtml(formatReceiptMoney(item.saldoActual))}</td>
        </tr>
      `
    )
    .join('');

  printHtmlDocument(
    `${companyName} - Informe operativo de vendedor`,
    `
      <style>
        @page { size: letter; margin: 12mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
        .report { width: 100%; }
        .header {
          display:grid; grid-template-columns:88px 1fr; gap:18px; align-items:center;
          border:1px solid #cbd5e1; border-radius:16px; padding:16px 18px;
          background:linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
        }
        .logo-wrap {
          width:88px; height:88px; border-radius:18px; border:1px solid #dbeafe;
          background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;
        }
        .logo-wrap img { max-width:80px; max-height:80px; object-fit:contain; }
        .eyebrow { font-size:11px; font-weight:700; letter-spacing:.18em; color:#64748b; text-transform:uppercase; }
        .title { margin:6px 0 0; font-size:28px; line-height:1.1; font-weight:800; text-transform:uppercase; }
        .subtitle { margin:6px 0 0; font-size:13px; color:#475569; }
        .meta-grid { margin-top:12px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
        .meta-card { border:1px solid #dbeafe; border-radius:14px; padding:12px; background:#f8fafc; }
        .meta-label { font-size:10px; font-weight:700; letter-spacing:.12em; color:#64748b; text-transform:uppercase; }
        .meta-value { margin-top:8px; font-size:14px; font-weight:700; line-height:1.3; }
        .summary-grid { margin-top:16px; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }
        .summary-card { border:1px solid #cbd5e1; border-radius:14px; padding:14px; background:#fff; min-height:102px; }
        .summary-value { margin-top:10px; font-size:18px; font-weight:800; line-height:1.1; letter-spacing:-0.03em; }
        .section { margin-top:18px; border:1px solid #cbd5e1; border-radius:16px; padding:16px; page-break-inside:avoid; }
        .section h2 { margin:0; font-size:18px; font-weight:800; text-transform:uppercase; }
        .section p { margin:6px 0 0; color:#64748b; font-size:12px; }
        .grid-2 { margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; }
        th, td { border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; vertical-align:top; }
        th { background:#f1f5f9; text-align:left; font-weight:800; }
        .money { text-align:right; white-space:nowrap; font-weight:700; }
        .footer-note { margin-top:14px; font-size:11px; color:#64748b; text-align:right; }
      </style>
      <section class="report">
        <section class="header">
          <div class="logo-wrap">${logoDataUrl ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" />` : ''}</div>
          <div>
            <div class="eyebrow">Panel vendedor</div>
            <div class="title">${escapeHtml(reportTitle)}</div>
            <div class="subtitle">Consolidado operativo del vendedor sobre el alcance ${escapeHtml(relationLabel)}.</div>
          </div>
        </section>

        <section class="meta-grid">
          <div class="meta-card"><div class="meta-label">Casa rifera</div><div class="meta-value">${escapeHtml(companyName)}</div></div>
          <div class="meta-card"><div class="meta-label">Responsable</div><div class="meta-value">${escapeHtml(responsableNombre || 'Sin responsable')}</div></div>
          <div class="meta-card"><div class="meta-label">Ubicacion</div><div class="meta-value">${escapeHtml([responsableDireccion, responsableCiudad, responsableDepartamento].filter(Boolean).join(' - ') || 'Sin ubicacion')}</div></div>
          <div class="meta-card"><div class="meta-label">Autorizacion</div><div class="meta-value">${escapeHtml([entidadAutoriza, numeroResolucionAutorizacion].filter(Boolean).join(' / ') || 'Sin dato')}</div></div>
        </section>

        <section class="summary-grid">
          <div class="summary-card"><div class="meta-label">Boletas</div><div class="summary-value">${metrics.boletasTotales}</div></div>
          <div class="summary-card"><div class="meta-label">Pagadas</div><div class="summary-value">${metrics.boletasPagadas}</div></div>
          <div class="summary-card"><div class="meta-label">Pendientes</div><div class="summary-value">${metrics.boletasPendientes}</div></div>
          <div class="summary-card"><div class="meta-label">Abonado</div><div class="summary-value">${escapeHtml(formatReceiptMoney(metrics.totalAbonado))}</div></div>
          <div class="summary-card"><div class="meta-label">Deuda actual</div><div class="summary-value">${escapeHtml(formatReceiptMoney(metrics.deudaActual))}</div></div>
        </section>

        <section class="section">
          <h2>Estado por relacion</h2>
          <p>Resumen de boletas, recaudo y saldo en cada relacion del vendedor.</p>
          <table style="margin-top: 14px;">
            <thead>
              <tr>
                <th>RIFA</th>
                <th>VENDEDOR</th>
                <th>BOLETAS</th>
                <th class="money">ABONADO</th>
                <th class="money">SALDO</th>
              </tr>
            </thead>
            <tbody>${relationRows || '<tr><td colspan="5">Sin datos</td></tr>'}</tbody>
          </table>
        </section>

        <section class="section">
          <h2>Recaudo por metodo</h2>
          <p>Distribucion de abonos vigentes por forma de pago.</p>
          <div class="grid-2">
            <table>
              <thead>
                <tr>
                  <th>METODO</th>
                  <th class="money">TOTAL</th>
                </tr>
              </thead>
              <tbody>${paymentMethodRows || '<tr><td>Sin abonos</td><td class="money">$ 0</td></tr>'}</tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>CONCEPTO</th>
                  <th class="money">VALOR</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Abonado acumulado</td><td class="money">${escapeHtml(formatReceiptMoney(metrics.totalAbonado))}</td></tr>
                <tr><td>Deuda actual</td><td class="money">${escapeHtml(formatReceiptMoney(metrics.deudaActual))}</td></tr>
                <tr><td>Impreso</td><td class="money">${escapeHtml(printedAt)}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="footer-note">Informe generado automaticamente desde el panel vendedor.</div>
        </section>
      </section>
    `
  );
}

export async function printPublicBoletaFicha({
  companyName,
  logoDataUrl,
  supportText,
  supportPhone,
  supportWhatsapp,
  supportEmail,
  backgroundDataUrl,
  publicUrl,
  ficha,
}: PrintablePublicBoletaFichaInput) {
  const qrDataUrl = publicUrl
    ? await QRCode.toDataURL(publicUrl, {
        margin: 1,
        width: 160,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
    : '';

  const pagosHtml = ficha.historialPagos.length
    ? ficha.historialPagos
        .map(
          (pago) => `
            <tr>
              <td>${escapeHtml(formatReceiptDateTime(new Date(pago.fecha)))}</td>
              <td>${escapeHtml(pago.metodoPago)}</td>
              <td>${escapeHtml(pago.descripcion || 'Pago registrado')}</td>
              <td class="money">${escapeHtml(formatReceiptMoney(pago.monto))}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="4">Sin abonos registrados</td></tr>';

  printHtmlDocument(
    `${companyName} - Ficha boleta ${ficha.numero}`,
    `
      <style>
        @page { size: letter; margin: 12mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; }
        .sheet { width: 100%; }
        .hero {
          border:1px solid #cbd5e1; border-radius: 22px; overflow: hidden; background: #fff;
        }
        .hero-top {
          padding: 20px 22px;
          background: linear-gradient(135deg, #12385f 0%, #2f8c63 100%);
          color: #fff;
        }
        .brand { display:flex; gap:16px; align-items:center; }
        .brand img { width:72px; height:72px; border-radius:18px; object-fit:contain; background:#fff; border:1px solid #e2e8f0; padding:8px; }
        .eyebrow { font-size:11px; letter-spacing:.28em; font-weight:700; text-transform:uppercase; color:rgba(255,255,255,.72); }
        .title-row { margin-top:14px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .big-number { font-size:44px; line-height:1; font-weight:900; letter-spacing:.08em; }
        .pill { border:1px solid rgba(255,255,255,.34); border-radius:999px; padding:10px 16px; font-size:12px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; background:rgba(255,255,255,.16); color:#fff; }
        .ticket-shell {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #12385f 0%, #2f8c63 100%);
        }
        .ticket-shell::before {
          content:'';
          position:absolute;
          inset:0;
          background:${backgroundDataUrl ? `linear-gradient(rgba(10,18,40,.14), rgba(10,18,40,.32)), url('${backgroundDataUrl}') center/cover no-repeat` : 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))'};
          opacity: 1;
        }
        .ticket-shell::after {
          content:'';
          position:absolute;
          inset:0;
          background: linear-gradient(to top, rgba(15,23,42,.58), rgba(15,23,42,.2));
        }
        .content-top { padding: 18px 22px 0; display:grid; grid-template-columns: 1.15fr .85fr; gap:16px; position: relative; z-index: 2; }
        .card {
          border:1px solid rgba(255,255,255,.12);
          border-radius:18px;
          padding:16px;
          background:rgba(2,6,23,.78);
          color:#fff;
          box-shadow: 0 14px 36px rgba(15,23,42,.24);
        }
        .mini-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
        .label { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.78); font-weight:700; }
        .value { margin-top:8px; font-size:20px; font-weight:900; line-height:1.2; color:#fff; text-shadow:0 1px 1px rgba(0,0,0,.22); }
        .value-money { white-space:nowrap; font-variant-numeric: tabular-nums; }
        .ticket-wrap {
          margin: 18px 22px 0;
          min-height: 320px;
          border:1px solid rgba(255,255,255,.16);
          border-radius: 22px;
          overflow:hidden;
          position: relative;
          background: transparent;
        }
        .ticket-content { position:relative; z-index:1; min-height:320px; display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding: 22px; }
        .ticket-panel {
          max-width: 68%;
          border:1px solid rgba(255,255,255,.12);
          border-radius: 18px;
          padding: 16px;
          background: rgba(2,6,23,.82);
          color:#fff;
          box-shadow: 0 14px 36px rgba(15,23,42,.24);
        }
        .ticket-panel .label {
          color: rgba(255,255,255,.78);
        }
        .ticket-footer {
          margin-top: 18px;
          padding: 0 22px 22px;
          display:grid; grid-template-columns: 1fr 210px; gap:16px;
        }
        .chips { display:flex; flex-wrap:wrap; gap:10px; }
        .chip { border:1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 10px 14px; font-weight: 800; background:rgba(255,255,255,.18); color:#fff; }
        .chip-primary { background:#fff; color:#0f172a; border-color:#fff; }
        .qr-card { text-align:center; background:#ffffffea; color:#0f172a; }
        .qr-card img { width:120px; height:120px; object-fit:contain; }
        .section { margin-top:18px; border:1px solid #cbd5e1; border-radius:18px; padding:18px; }
        table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:12px; }
        th, td { border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; vertical-align:top; }
        th { background:#f1f5f9; text-align:left; font-weight:800; }
        .money { text-align:right; white-space:nowrap; font-weight:800; }
        .support-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:12px; }
      </style>
      <section class="sheet">
        <section class="hero ticket-shell">
          <div class="hero-top">
            <div class="brand">
              ${logoDataUrl ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" />` : ''}
              <div>
                <div class="eyebrow">Ficha compartible</div>
                <div class="value">${escapeHtml(companyName)}</div>
                <div style="margin-top:6px; color:rgba(255,255,255,.84);">${escapeHtml(ficha.rifaNombre)}</div>
              </div>
            </div>
            <div class="title-row">
              <div>
                <div class="big-number">${escapeHtml(ficha.numero)}</div>
                <div style="margin-top:10px; color:rgba(255,255,255,.84);">Vendedor / canal: ${escapeHtml(ficha.vendedorNombre || 'Sin vendedor')}</div>
              </div>
              <div class="pill">${escapeHtml(ficha.estado)}</div>
            </div>
          </div>

          <div class="content-top">
              <div class="card">
                <div class="label">Cliente</div>
                <div class="value">${escapeHtml(ficha.clienteNombre || 'Pendiente de confirmar')}</div>
                <div style="margin-top:10px; color:rgba(255,255,255,.9); line-height:1.75; font-size:13px; font-weight:600;">
                  <div>Documento: ${escapeHtml(ficha.clienteDocumento || 'Oculto')}</div>
                  <div>Telefono: ${escapeHtml(ficha.clienteTelefono || 'Oculto')}</div>
                  <div>Vendedor: ${escapeHtml(ficha.vendedorNombre || 'Sin vendedor')}</div>
                </div>
              </div>
            <div class="mini-grid">
              <div class="card">
                <div class="label">Total</div>
                <div class="value value-money">${escapeHtml(formatReceiptMoney(ficha.total))}</div>
              </div>
              <div class="card">
                <div class="label">Abonado</div>
                <div class="value value-money">${escapeHtml(formatReceiptMoney(ficha.totalAbonado))}</div>
              </div>
              <div class="card">
                <div class="label">Saldo</div>
                <div class="value value-money">${escapeHtml(formatReceiptMoney(ficha.saldoPendiente))}</div>
              </div>
              <div class="card">
                <div class="label">Juega</div>
                <div class="value">${ficha.juega ? 'SI' : 'NO'}</div>
              </div>
            </div>
          </div>

          <div class="ticket-wrap">
            <div class="ticket-content">
              <div class="ticket-panel">
                <div class="label">Boletas de la venta</div>
                <div class="chips" style="margin-top:12px;">
                  ${ficha.boletasRelacionadas
                    .map(
                      (numero) =>
                        `<span class="chip ${numero === ficha.numero ? 'chip-primary' : ''}">${escapeHtml(numero)}</span>`
                    )
                    .join('')}
                </div>
              </div>

              <div class="card qr-card">
                <div class="label" style="color:#64748b;">QR de la ficha</div>
                ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR de ficha publica" />` : ''}
                <div style="font-size:10px; color:#64748b; line-height:1.5;">Escanea para abrir esta boleta virtual.</div>
              </div>
            </div>
          </div>

          <div class="ticket-footer">
            <div class="card">
              <div class="label">Enlace publico</div>
              <div style="margin-top:10px; font-size:12px; line-height:1.6; color:#fff;">${escapeHtml(publicUrl || 'Sin enlace publico')}</div>
            </div>
            <div class="card qr-card">
              <div class="label" style="color:#64748b;">Verificacion</div>
              <div style="margin-top:12px; font-size:12px; font-weight:700;">${escapeHtml(ficha.estado)}</div>
              <div style="margin-top:8px; font-size:11px; color:#64748b;">${escapeHtml(ficha.vendedorNombre || 'Sin vendedor')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="label">Historial de abonos</div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Metodo</th>
                <th>Descripcion</th>
                <th class="money">Valor</th>
              </tr>
            </thead>
            <tbody>${pagosHtml}</tbody>
          </table>
        </section>

        <section class="section">
          <div class="label">Soporte</div>
          <div class="support-grid">
            <div class="card">
              <div class="value" style="font-size:15px;">${escapeHtml(supportText || 'Si tienes dudas sobre tu boleta, contacta al equipo comercial.')}</div>
            </div>
            <div class="card">
              <div>Telefono: ${escapeHtml(supportPhone || 'No disponible')}</div>
              <div style="margin-top:8px;">WhatsApp: ${escapeHtml(supportWhatsapp || 'No disponible')}</div>
              <div style="margin-top:8px;">Email: ${escapeHtml(supportEmail || 'No disponible')}</div>
            </div>
          </div>
        </section>
      </section>
    `
  );
}

export function printPublicPurchaseSummary({
  companyName,
  logoDataUrl,
  supportText,
  supportPhone,
  supportWhatsapp,
  supportEmail,
  backgroundDataUrl,
  purchase,
}: PrintablePublicPurchaseSummaryInput) {
  const boletasHtml = purchase.boletas
    .map(
      (boleta) => `
        <div class="boleta">
          <div class="label">Boleta</div>
          <div class="value boleta-number">${escapeHtml(boleta.numero)}</div>
          <div class="meta">${escapeHtml(boleta.estado)}</div>
        </div>
      `
    )
    .join('');

  printHtmlDocument(
    `${companyName} - Comprobante de compra`,
    `
      <style>
        @page { size: letter; margin: 12mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#0f172a; background:#fff; }
        .sheet { width:100%; }
        .hero { border:1px solid #cbd5e1; border-radius:22px; overflow:hidden; background:#fff; }
        .hero-top { padding:20px 22px; border-bottom:1px solid #e2e8f0; background:linear-gradient(135deg,#f8fafc 0%, #ffffff 100%); }
        .brand { display:flex; gap:16px; align-items:center; }
        .brand img { width:72px; height:72px; border-radius:18px; object-fit:contain; background:#fff; border:1px solid #e2e8f0; padding:8px; }
        .eyebrow { font-size:11px; letter-spacing:.28em; font-weight:700; text-transform:uppercase; color:#64748b; }
        .title { margin-top:12px; font-size:34px; line-height:1.1; font-weight:900; }
        .subtitle { margin-top:8px; color:#475569; }
        .summary-grid { padding:18px 22px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
        .card { border:1px solid #cbd5e1; border-radius:18px; padding:16px; background:#fff; }
        .label { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#64748b; font-weight:700; }
        .value { margin-top:8px; font-size:18px; font-weight:800; line-height:1.25; }
        .value-money { white-space:nowrap; font-variant-numeric: tabular-nums; }
        .banner { margin:0 22px 18px; border:1px solid #dbeafe; border-radius:22px; min-height:220px; background:${backgroundDataUrl ? `url('${backgroundDataUrl}') center/cover no-repeat` : 'linear-gradient(135deg,#eff6ff 0%, #f8fafc 100%)'}; position:relative; overflow:hidden; }
        .banner::after { content:''; position:absolute; inset:0; background:linear-gradient(rgba(255,255,255,.24), rgba(255,255,255,.58)); }
        .section { margin-top:18px; border:1px solid #cbd5e1; border-radius:18px; padding:18px; }
        .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:12px; }
        .boletas-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:14px; }
        .boleta { border:1px solid #cbd5e1; border-radius:18px; padding:16px; background:#f8fafc; }
        .boleta-number { font-size:28px; line-height:1; letter-spacing:.08em; }
        .meta { margin-top:8px; color:#475569; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.14em; }
      </style>
      <section class="sheet">
        <section class="hero">
          <div class="hero-top">
            <div class="brand">
              ${logoDataUrl ? `<img src="${logoDataUrl}" alt="${escapeHtml(companyName)}" />` : ''}
              <div>
                <div class="eyebrow">Comprobante de compra web</div>
                <div class="value">${escapeHtml(companyName)}</div>
              </div>
            </div>
            <div class="title">Pago ${escapeHtml(purchase.estadoPago)}</div>
            <div class="subtitle">Referencia ${escapeHtml(purchase.referencia || 'Sin referencia')} · Vendedor / canal ${escapeHtml(purchase.vendedorNombre || 'PAGINA WEB')}</div>
          </div>

          <div class="summary-grid">
            <div class="card"><div class="label">Total</div><div class="value value-money">${escapeHtml(formatReceiptMoney(purchase.total))}</div></div>
            <div class="card"><div class="label">Metodo</div><div class="value">${escapeHtml(purchase.metodoPago || 'Sin definir')}</div></div>
            <div class="card"><div class="label">Fecha</div><div class="value">${escapeHtml(purchase.fechaPago ? formatReceiptDateTime(new Date(purchase.fechaPago)) : 'Pendiente')}</div></div>
            <div class="card"><div class="label">Transaccion</div><div class="value">${escapeHtml(purchase.transaccionId || 'Pendiente')}</div></div>
          </div>

          <div class="banner"></div>
        </section>

        <section class="section">
          <div class="label">Comprador</div>
          <div class="detail-grid">
            <div class="card">
              <div class="value">${escapeHtml(purchase.cliente.nombre)}</div>
              <div style="margin-top:10px; color:#475569; line-height:1.7;">
                <div>Documento: ${escapeHtml(purchase.cliente.documento || 'No registrado')}</div>
                <div>Telefono: ${escapeHtml(purchase.cliente.telefono || 'No registrado')}</div>
                <div>Email: ${escapeHtml(purchase.cliente.email || 'No registrado')}</div>
              </div>
            </div>
            <div class="card">
              <div class="label">Descripcion del pago</div>
              <div class="value">${escapeHtml(purchase.descripcionPago || 'Pago web confirmado')}</div>
              <div style="margin-top:10px; color:#475569;">Canal responsable: ${escapeHtml(purchase.vendedorNombre || 'PAGINA WEB')}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="label">Boletas compradas</div>
          <div class="boletas-grid">${boletasHtml}</div>
        </section>

        <section class="section">
          <div class="label">Soporte</div>
          <div class="detail-grid">
            <div class="card"><div class="value" style="font-size:15px;">${escapeHtml(supportText || 'Si tienes dudas o no ves tu compra, comunicate con la casa rifera.')}</div></div>
            <div class="card">
              <div>Telefono: ${escapeHtml(supportPhone || 'No disponible')}</div>
              <div style="margin-top:8px;">WhatsApp: ${escapeHtml(supportWhatsapp || 'No disponible')}</div>
              <div style="margin-top:8px;">Email: ${escapeHtml(supportEmail || 'No disponible')}</div>
            </div>
          </div>
        </section>
      </section>
    `
  );
}
