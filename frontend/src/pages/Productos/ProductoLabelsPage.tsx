import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { formatCOP } from '../../utils/money';

type ProductLabel = {
  productoId: string;
  varianteId: string;
  marca: string;
  categoria: string;
  nombre: string;
  codigo: string;
  precio: number;
  color: string;
  talla: string;
  sku: string;
};

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212',
  '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221',
  '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221',
  '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321',
  '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131',
  '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131',
  '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111',
  '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242',
  '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311',
  '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

const START_CODE_B = 104;
const STOP_CODE = 106;

function normalizeBarcodeValue(value: string) {
  return String(value || '')
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, 32);
}

function encodeCode128B(value: string) {
  const normalized = normalizeBarcodeValue(value);
  const codes = [START_CODE_B];

  for (const char of normalized) {
    codes.push(char.charCodeAt(0) - 32);
  }

  const checksum = codes.reduce((sum, code, index) => {
    if (index === 0) {
      return code;
    }

    return sum + code * index;
  }, 0) % 103;

  return [...codes, checksum, STOP_CODE];
}

function BarcodeSvg({ value }: { value: string }) {
  const encoded = encodeCode128B(value);
  const quietZone = 10;
  let cursor = quietZone;
  const bars: Array<{ x: number; width: number }> = [];

  for (const code of encoded) {
    const pattern = CODE128_PATTERNS[code];

    if (!pattern) {
      continue;
    }

    [...pattern].forEach((char, index) => {
      const width = Number(char);

      if (index % 2 === 0) {
        bars.push({ x: cursor, width });
      }

      cursor += width;
    });
  }

  const viewBoxWidth = cursor + quietZone;

  return (
    <svg
      className="label-barcode"
      viewBox={`0 0 ${viewBoxWidth} 54`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Codigo de barras ${value}`}
    >
      <rect width={viewBoxWidth} height="54" fill="#fff" />
      {bars.map((bar, index) => (
        <rect key={`${bar.x}-${index}`} x={bar.x} y="0" width={bar.width} height="54" fill="#000" />
      ))}
    </svg>
  );
}

const cleanText = (value: string, fallback = '') => String(value || fallback).trim();

const displayVariantValue = (value: string) => {
  const normalized = String(value || '').trim();
  return normalized.toUpperCase() === 'NO APLICA' || !normalized ? 'N/A' : normalized.toUpperCase();
};

const ProductoLabelsPage = () => {
  const [labels, setLabels] = useState<ProductLabel[]>([]);

  useEffect(() => {
    const raw = window.sessionStorage.getItem('producto_labels');

    if (!raw) {
      setLabels([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setLabels(Array.isArray(parsed) ? parsed : []);
    } catch (_error) {
      setLabels([]);
    }
  }, []);

  const validLabels = useMemo(
    () => labels.filter((label) => normalizeBarcodeValue(label.codigo).length > 0),
    [labels]
  );

  return (
    <div className="label-page">
      <style>
        {`
          .label-page {
            min-height: 100vh;
            background: #f8fafc;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
          }

          .label-toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
          }

          .label-sheet {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            width: fit-content;
            margin: 16px auto;
            background: #fff;
          }

          .label-slot {
            box-sizing: border-box;
            width: 50mm;
            min-height: 45mm;
            padding: 0 0 15mm;
            page-break-inside: avoid;
            break-inside: avoid;
            background: #fff;
          }

          .product-label {
            box-sizing: border-box;
            width: 50mm;
            height: 30mm;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            overflow: hidden;
            padding: 1mm 2.2mm 0.8mm;
            color: #000;
            background: #fff;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
          }

          .label-brand {
            width: 100%;
            font-size: 8.5px;
            line-height: 1;
            font-weight: 800;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .label-category {
            width: 100%;
            margin-top: 0.4mm;
            font-size: 7.2px;
            line-height: 1;
            font-weight: 700;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .label-name {
            width: 100%;
            margin-top: 0.4mm;
            font-size: 9px;
            line-height: 1.05;
            font-weight: 900;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .label-barcode {
            width: 43mm;
            height: 7.8mm;
            margin-top: 0.9mm;
            display: block;
          }

          .label-code {
            width: 100%;
            margin-top: 0.45mm;
            font-size: 10.5px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .label-price {
            width: 100%;
            margin-top: 0.45mm;
            font-size: 8.5px;
            line-height: 1;
            font-weight: 900;
          }

          .label-variant {
            width: 100%;
            margin-top: 0.45mm;
            display: flex;
            justify-content: center;
            gap: 2.4mm;
            font-size: 7px;
            line-height: 1;
            font-weight: 900;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .label-sku {
            width: 100%;
            margin-top: 0.45mm;
            font-size: 7px;
            line-height: 1;
            font-weight: 900;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          @media print {
            @page {
              margin: 0;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            .no-print,
            .label-toolbar,
            aside {
              display: none !important;
            }

            .app-shell,
            main,
            main > div,
            main > div > div,
            .label-page {
              display: block !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #fff !important;
            }

            .label-sheet {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 50mm !important;
              background: #fff !important;
            }

            .label-slot {
              width: 50mm !important;
              min-height: 45mm !important;
              margin: 0 !important;
              padding: 0 0 15mm !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background: #fff !important;
            }

            .product-label {
              width: 50mm !important;
              height: 30mm !important;
              margin: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="label-toolbar no-print">
        <Link to="/productos" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
          Volver a productos
        </Link>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
          onClick={() => window.print()}
          disabled={validLabels.length === 0}
        >
          Imprimir
        </button>
        <span className="text-sm text-slate-600">{validLabels.length} etiqueta(s)</span>
      </div>

      {validLabels.length === 0 ? (
        <div className="no-print mx-auto mt-8 max-w-lg rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No hay etiquetas para imprimir. Vuelve a productos y selecciona cantidades por variante.
        </div>
      ) : (
        <main className="label-sheet">
          {validLabels.map((label, index) => (
            <div className="label-slot" key={`${label.varianteId}-${index}`}>
              <div className="product-label">
                <div className="label-brand">{cleanText(label.marca, 'SIN MARCA').toUpperCase()}</div>
                <div className="label-category">{cleanText(label.categoria, 'SIN CATEGORIA').toUpperCase()}</div>
                <div className="label-name">{cleanText(label.nombre, 'PRODUCTO').toUpperCase()}</div>
                <BarcodeSvg value={label.codigo} />
                <div className="label-code">{label.codigo}</div>
                <div className="label-price">{formatCOP(label.precio)}</div>
                <div className="label-variant">
                  <span>COLOR: {displayVariantValue(label.color)}</span>
                  <span>TALLA: {displayVariantValue(label.talla)}</span>
                </div>
                <div className="label-sku">SKU: {cleanText(label.sku, 'SIN SKU').toUpperCase()}</div>
              </div>
            </div>
          ))}
        </main>
      )}
    </div>
  );
};

export default ProductoLabelsPage;
