import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import PrintButton from '../../components/receipts/PrintButton';
import ClientReceiptTicket from '../../components/receipts/ClientReceiptTicket';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printClientReceiptTicket } from '../../utils/print';

const ClienteReciboView = () => {
  const { id } = useParams();
  const { config } = useAppConfig();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(endpoints.clienteReciboById(id));
      setReceipt(data);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReceipt();
  }, [id]);

  const verificationUrl = useMemo(() => {
    if (!receipt?.codigoUnico) {
      return '';
    }

    return `${window.location.origin}/verificacion/pagos-clientes/${receipt.codigoUnico}`;
  }, [receipt]);

  const handlePrint = async (copies: number) => {
    if (!receipt) {
      return;
    }

    try {
      setPrinting(true);
      await printClientReceiptTicket({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        responsableNombre: config.responsableNombre,
        responsableTelefono: config.responsableTelefono,
        responsableDireccion: config.responsableDireccion,
        responsableCiudad: config.responsableCiudad,
        responsableDepartamento: config.responsableDepartamento,
        numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
        entidadAutoriza: config.entidadAutoriza,
        verificationUrl,
        receipt,
        copies,
      });
      setIsPrintDialogOpen(false);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setPrinting(false);
    }
  };

  const pago = receipt?.pagoCliente;
  const venta = pago?.venta;

  return (
    <div>
      <Topbar
        title="Recibo de cliente"
        actions={
          <>
            {verificationUrl ? (
              <a
                href={verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                VERIFICAR
              </a>
            ) : null}
            <PrintButton onClick={() => setIsPrintDialogOpen(true)} />
          </>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando recibo..." /> : null}
        {!loading && receipt && venta ? (
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <ClientReceiptTicket
              receipt={receipt}
              companyName={config.nombreCasaRifera}
              logoDataUrl={config.logoDataUrl}
              verificationUrl={verificationUrl}
              responsableNombre={config.responsableNombre}
              responsableTelefono={config.responsableTelefono}
              responsableDireccion={config.responsableDireccion}
              responsableCiudad={config.responsableCiudad}
              responsableDepartamento={config.responsableDepartamento}
              numeroResolucionAutorizacion={config.numeroResolucionAutorizacion}
              entidadAutoriza={config.entidadAutoriza}
            />

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Detalle del pago
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Este pago ya quedo registrado sobre la venta del cliente y genera su recibo verificable.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">CLIENTE</p>
                  <p className="theme-summary-value mt-3 text-2xl font-semibold">
                    {venta.cliente?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">PAGO</p>
                  <p className="theme-summary-value mt-3 text-2xl font-semibold">
                    {formatCOP(pago.monto)}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">SALDO</p>
                  <p className="theme-summary-value mt-3 text-2xl font-semibold">
                    {formatCOP(venta.saldoPendiente)}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-5">
                  <p className="theme-summary-label">ESTADO VENTA</p>
                  <p className="theme-summary-value mt-3 text-2xl font-semibold">{venta.estado}</p>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Fecha del pago
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{formatDateTime(receipt.fecha)}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Metodo de pago
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{pago.metodoPago}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Subcaja destino
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{pago.subCaja?.nombre || 'SIN SUBCAJA'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Codigo unico
                  </dt>
                  <dd className="mt-2 break-all text-base text-slate-900">{receipt.codigoUnico}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Registrado por
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{pago.usuario?.nombre || 'SISTEMA'}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Canal
                  </dt>
                  <dd className="mt-2 text-base text-slate-900">{venta.rifaVendedor?.vendedor?.nombre || 'SIN CANAL'}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Boletas
                </p>
                <p className="mt-2 text-base text-slate-900">
                  {(venta.boletas || []).map((item: any) => item.numero).join(', ') || 'SIN BOLETAS'}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Descripcion
                </p>
                <p className="mt-2 text-base text-slate-900">{pago.descripcion || 'SIN DESCRIPCION'}</p>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap gap-3">
                  {Number(venta.saldoPendiente || 0) > 0 ? (
                    <Link
                      to={`/mis-pagos?clienteId=${venta.cliente?.id}&ventaId=${venta.id}`}
                      className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] text-emerald-700"
                    >
                      REGISTRAR OTRO ABONO
                    </Link>
                  ) : null}
                  <Link
                    to="/mis-recibos"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] text-white"
                  >
                    VOLVER A MIS RECIBOS
                  </Link>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {isPrintDialogOpen && receipt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-2xl font-semibold uppercase text-slate-900">
                Imprimir recibo
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Elige si deseas sacar una sola tirilla o dos copias del mismo recibo. Despues se abrira el menu normal de impresion.
              </p>
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => void handlePrint(1)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  IMPRIMIR UNA COPIA
                </button>
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => void handlePrint(2)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  IMPRIMIR DOS COPIAS
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={printing}
                  onClick={() => setIsPrintDialogOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ClienteReciboView;
