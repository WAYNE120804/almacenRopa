import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const MetricCard = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) => {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'danger'
          ? 'text-rose-700'
          : 'text-slate-900';

  return (
    <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
      <p className="theme-summary-label">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
};

const VendedorSupervisionPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await client.get(endpoints.supervisionCanalesEspeciales());
        setDashboard(data);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const linksPendientes = useMemo(
    () =>
      (dashboard?.linksPago || []).filter(
        (item: any) => item.linkPagoEnviadoAt && !item.linkPagoAbiertoAt
      ),
    [dashboard?.linksPago]
  );

  return (
    <div>
      <Topbar title="Supervision canal" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando supervision del canal..." /> : null}

        {!loading && dashboard ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Canales supervisados
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Vista operativa consolidada para BOT y PAGINA WEB dentro de tu alcance.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(dashboard.channels || []).map((channel: any) => (
                  <div key={channel.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {channel.canalNombre}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{channel.rifaNombre}</p>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>Ventas: {channel.ventas}</p>
                      <p>Total vendido: {formatCOP(channel.totalVendido)}</p>
                      <p>Saldo pendiente: {formatCOP(channel.saldoPendiente)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="CLIENTES NUEVOS HOY" value={dashboard.metrics?.clientesNuevosHoy || 0} />
              <MetricCard label="VENTAS PENDIENTES" value={dashboard.metrics?.ventasPendientes || 0} tone="warning" />
              <MetricCard label="PAGOS PARCIALES" value={dashboard.metrics?.pagosParciales || 0} tone="warning" />
              <MetricCard label="PAGOS HOY" value={dashboard.metrics?.pagosConfirmadosHoy || 0} tone="success" />
              <MetricCard label="SEGUIMIENTO HUMANO" value={dashboard.metrics?.seguimientoHumano || 0} tone="danger" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="RESERVAS ACTIVAS" value={dashboard.metrics?.reservasActivas || 0} />
              <MetricCard label="RESERVAS VENCIDAS" value={dashboard.metrics?.reservasVencidas || 0} tone="danger" />
              <MetricCard label="LINKS ENVIADOS" value={dashboard.metrics?.linksEnviados || 0} />
              <MetricCard label="LINKS ABIERTOS" value={dashboard.metrics?.linksAbiertos || 0} tone="success" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Reservas vencidas
                </h3>
                <div className="mt-6 space-y-4">
                  {(dashboard.reservasVencidas || []).length ? (
                    dashboard.reservasVencidas.map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.rifaNombre} · {item.numero}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.clienteNombre} · {item.clienteTelefono || 'Sin telefono'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                              {item.canalNombre}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-rose-700">
                            {item.reservadaHasta ? formatDateTime(item.reservadaHasta) : 'Sin vencimiento'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin reservas vencidas"
                      description="No hay boletas vencidas en BOT o PAGINA WEB dentro de tu alcance."
                    />
                  )}
                </div>
              </section>

              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Pagos confirmados hoy
                </h3>
                <div className="mt-6 space-y-4">
                  {(dashboard.pagosConfirmadosHoy || []).length ? (
                    dashboard.pagosConfirmadosHoy.map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.clienteNombre} · {item.rifaNombre}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.canalNombre} · Boletas: {(item.boletas || []).join(', ')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.fecha)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-700">{formatCOP(item.monto)}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                              {item.metodoPago}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin pagos hoy"
                      description="Todavia no hay pagos confirmados hoy en los canales especiales."
                    />
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Links enviados y pendientes
                </h3>
                <div className="mt-6 space-y-4">
                  {linksPendientes.length ? (
                    linksPendientes.map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-slate-900">
                          {item.clienteNombre} · {item.rifaNombre}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.canalNombre} · Saldo: {formatCOP(item.saldoPendiente)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Enviado: {item.linkPagoEnviadoAt ? formatDateTime(item.linkPagoEnviadoAt) : 'Sin fecha'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin links pendientes"
                      description="No hay links de pago enviados sin apertura registrada."
                    />
                  )}
                </div>
              </section>

              <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                  Seguimiento humano
                </h3>
                <div className="mt-6 space-y-4">
                  {(dashboard.seguimientoHumano || []).length ? (
                    dashboard.seguimientoHumano.map((item: any) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="font-semibold text-slate-900">
                          {item.clienteNombre} · {item.rifaNombre}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.canalNombre} · Saldo: {formatCOP(item.saldoPendiente)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Boletas:{' '}
                          {(item.boletas || []).map((boleta: any) => boleta.numero).join(', ')}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.seguimientoMotivo || 'Marcada para revision operativa.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Sin seguimiento humano"
                      description="No hay ventas marcadas para intervencion humana en este momento."
                    />
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default VendedorSupervisionPage;
