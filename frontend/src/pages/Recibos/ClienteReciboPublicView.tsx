import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import ClientReceiptTicket from '../../components/receipts/ClientReceiptTicket';
import { useAppConfig } from '../../context/AppConfigContext';

const ClienteReciboPublicView = () => {
  const { codigo } = useParams();
  const { config } = useAppConfig();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(endpoints.clienteReciboByCodigo(codigo));
        setReceipt(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadReceipt();
  }, [codigo]);

  const verificationUrl = useMemo(() => {
    if (!receipt?.codigoUnico) {
      return '';
    }

    return `${window.location.origin}/verificacion/pagos-clientes/${receipt.codigoUnico}`;
  }, [receipt]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Verificacion publica
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Recibo de pago cliente
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Esta pagina confirma que el recibo corresponde a un pago registrado en el sistema.
              </p>
            </div>
            <Link
              to="/publico"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              VOLVER A LA WEB
            </Link>
          </div>
        </div>

        <ErrorBanner message={error} />
        {loading ? <Loading label="Consultando recibo..." /> : null}

        {!loading && receipt ? (
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

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Validacion del recibo</h2>
              <p className="mt-2 text-sm text-slate-600">
                Esta vista muestra mas detalle que la tirilla para facilitar soporte, cobranza y verificacion.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Codigo unico
                  </p>
                  <p className="mt-2 break-all text-base font-semibold text-slate-900">
                    {receipt.codigoUnico}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Cliente
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {receipt.pagoCliente?.venta?.cliente?.nombre}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ClienteReciboPublicView;
