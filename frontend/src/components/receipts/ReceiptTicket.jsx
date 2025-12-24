import { formatCOP } from '../../utils/money';
import { formatDateTime } from '../../utils/dates';

const ReceiptTicket = ({ receipt, vendor, rifa }) => {
  if (!receipt) return null;

  const payload = receipt.payload || {};
  const dateTime = payload.fecha || receipt.fecha_impresion;

  return (
    <div className="receipt-ticket mx-auto w-full max-w-xs bg-white p-4 text-[12px] text-slate-900">
      <div className="text-center font-semibold">Casa Rifera</div>
      <div className="mt-2 text-center text-xs">Recibo de Abono</div>
      <div className="my-2 border-t border-dashed border-slate-300"></div>
      <div>
        <div><span className="font-semibold">Rifa:</span> {payload.rifa_nombre || rifa?.nombre || 'N/D'}</div>
        <div><span className="font-semibold">Consecutivo:</span> {payload.consecutivo ? `RIFA-${String(payload.consecutivo).padStart(6, '0')}` : receipt.consecutivo_rifa}</div>
        <div><span className="font-semibold">Código único:</span> {receipt.codigo_unico}</div>
        <div><span className="font-semibold">Fecha:</span> {formatDateTime(dateTime)}</div>
      </div>
      <div className="my-2 border-t border-dashed border-slate-300"></div>
      <div>
        <div className="font-semibold">Vendedor</div>
        <div>{vendor?.nombre || payload.vendedor_nombre || 'N/D'}</div>
        <div>{vendor?.documento || ''} {vendor?.telefono ? `| ${vendor.telefono}` : ''}</div>
      </div>
      <div className="my-2 border-t border-dashed border-slate-300"></div>
      <div>
        <div className="flex justify-between"><span>Valor abonado:</span> <span>{formatCOP(payload.valor_abonado)}</span></div>
        <div className="flex justify-between"><span>Saldo anterior:</span> <span>{formatCOP(payload.saldo_anterior)}</span></div>
        <div className="flex justify-between"><span>Saldo nuevo:</span> <span>{formatCOP(payload.saldo_nuevo)}</span></div>
        <div className="flex justify-between"><span>Medio de pago:</span> <span>{payload.medio_pago || 'N/D'}</span></div>
      </div>
      <div className="my-3 border-t border-dashed border-slate-300"></div>
      <div className="text-center text-xs">¡Gracias por su pago!</div>
    </div>
  );
};

export default ReceiptTicket;
