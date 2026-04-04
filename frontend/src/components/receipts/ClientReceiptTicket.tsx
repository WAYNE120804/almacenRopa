import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

type ClientReceiptTicketProps = {
  receipt: any;
  companyName: string;
  logoDataUrl?: string | null;
  verificationUrl: string;
  responsableNombre?: string | null;
  responsableTelefono?: string | null;
  responsableDireccion?: string | null;
  responsableCiudad?: string | null;
  responsableDepartamento?: string | null;
  numeroResolucionAutorizacion?: string | null;
  entidadAutoriza?: string | null;
};

const ClientReceiptTicket = ({
  receipt,
  companyName,
  logoDataUrl,
  verificationUrl,
  responsableNombre,
  responsableTelefono,
  responsableDireccion,
  responsableCiudad,
  responsableDepartamento,
  numeroResolucionAutorizacion,
  entidadAutoriza,
}: ClientReceiptTicketProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  useEffect(() => {
    const generateQr = async () => {
      if (!verificationUrl) {
        setQrCodeDataUrl('');
        return;
      }

      const nextQr = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 180,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });

      setQrCodeDataUrl(nextQr);
    };

    void generateQr();
  }, [verificationUrl]);

  if (!receipt?.pagoCliente?.venta) {
    return null;
  }

  const pago = receipt.pagoCliente;
  const venta = pago.venta;
  const cliente = venta.cliente;
  const rifa = venta.rifa;
  const relation = venta.rifaVendedor;

  return (
    <div className="receipt-ticket mx-auto w-full max-w-sm rounded-2xl bg-white p-5 text-[12px] text-slate-900 shadow-lg">
      <div className="text-center">
        {logoDataUrl ? (
          <img
            src={logoDataUrl}
            alt={companyName}
            className="mx-auto h-20 w-20 rounded-full border border-slate-200 object-contain p-2"
          />
        ) : null}
        <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Casa rifera</p>
        <h1 className="mt-2 text-xl font-bold uppercase">{companyName}</h1>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Recibo de cliente</p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Responsable y autorizacion
        </p>
        <p className="text-center">
          <span className="font-semibold">Responsable:</span> {responsableNombre || 'SIN RESPONSABLE'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Tel. responsable:</span> {responsableTelefono || 'SIN TELEFONO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Ubicacion:</span>{' '}
          {[responsableDireccion, responsableCiudad, responsableDepartamento]
            .filter(Boolean)
            .join(' - ') || 'SIN UBICACION'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Autoriza:</span> {entidadAutoriza || 'SIN ENTIDAD'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Resolucion:</span>{' '}
          {numeroResolucionAutorizacion || 'SIN RESOLUCION'}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Rifa</span>
          <span className="text-right">{rifa.nombre}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Consecutivo</span>
          <span>CLI-{String(receipt.consecutivo).padStart(6, '0')}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Codigo</span>
          <span className="text-right">{receipt.codigoUnico}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="font-semibold">Fecha</span>
          <span className="text-right">{formatDateTime(receipt.fecha)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1.5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Cliente
        </p>
        <p className="text-center text-lg font-semibold uppercase">{cliente.nombre}</p>
        <p className="text-center">
          <span className="font-semibold">Documento:</span> {cliente.documento || 'SIN DOCUMENTO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Telefono:</span> {cliente.telefono || 'SIN TELEFONO'}
        </p>
        <p className="text-center">
          <span className="font-semibold">Canal:</span> {relation?.vendedor?.nombre || 'SIN CANAL'}
        </p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-2">
        <div className="flex justify-between gap-3">
          <span>Pago recibido</span>
          <span className="font-semibold">{formatCOP(pago.monto)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Total venta</span>
          <span>{formatCOP(venta.total)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Saldo pendiente</span>
          <span>{formatCOP(venta.saldoPendiente)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Metodo de pago</span>
          <span>{pago.metodoPago}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Subcaja</span>
          <span>{pago.subCaja?.nombre || 'SIN SUBCAJA'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Registrado por</span>
          <span>{pago.usuario?.nombre || 'SISTEMA'}</span>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Boletas
          </p>
          <p className="mt-1 leading-relaxed">
            {(venta.boletas || []).map((item: any) => item.numero).join(', ') || 'SIN BOLETAS'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Descripcion
          </p>
          <p className="mt-1 leading-relaxed">{pago.descripcion || 'SIN DESCRIPCION'}</p>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Verificacion
        </p>
        {qrCodeDataUrl ? (
          <img src={qrCodeDataUrl} alt="QR del recibo" className="mx-auto mt-3 h-36 w-36" />
        ) : null}
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Escanea este codigo para confirmar que el recibo es real y revisar el detalle completo del pago.
        </p>
      </div>
    </div>
  );
};

export default ClientReceiptTicket;
