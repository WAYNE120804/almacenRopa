import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatCOP } from '../../utils/money';
import { printPublicBoletaFicha } from '../../utils/print';
import PublicNavbar from './PublicNavbar';

const statusTone = {
  PAGADA: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ABONANDO: 'border-amber-200 bg-amber-50 text-amber-700',
  RESERVADA: 'border-sky-200 bg-sky-50 text-sky-700',
  VENDIDA: 'border-violet-200 bg-violet-50 text-violet-700',
  ASIGNADA: 'border-slate-200 bg-slate-50 text-slate-700',
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return 'Sin fecha';
  }

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const PublicBoletaSharePage = () => {
  const { token = '' } = useParams();
  const { config } = useAppConfig();
  const [state, setState] = useState({
    loading: true,
    error: '',
    ficha: null as any,
  });
  const [printing, setPrinting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const loadFicha = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: '' }));
        const { data } = await client.get(endpoints.boletaPublicaFicha(token));
        setState({
          loading: false,
          error: '',
          ficha: data,
        });
      } catch (error) {
        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'No se pudo cargar la ficha publica de la boleta.',
          ficha: null,
        });
      }
    };

    void loadFicha();
  }, [token]);

  useEffect(() => {
    let active = true;

    const buildQr = async () => {
      try {
        const nextQr = await QRCode.toDataURL(window.location.href, {
          margin: 1,
          width: 180,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        if (active) {
          setQrDataUrl(nextQr);
        }
      } catch (_error) {
        if (active) {
          setQrDataUrl('');
        }
      }
    };

    void buildQr();

    return () => {
      active = false;
    };
  }, [token]);

  const backgroundStyle = useMemo(() => {
    if (config.publicTicketBackgroundDataUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(10,18,40,0.14), rgba(10,18,40,0.32)), url(${config.publicTicketBackgroundDataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    return {
      background: `linear-gradient(135deg, ${config.themeColors.topbarBg}, ${config.themeColors.sidebarActiveBg})`,
    };
  }, [config]);

  const ficha = state.ficha;
  const tone =
    statusTone[ficha?.boleta?.estado as keyof typeof statusTone] ||
    'border-slate-200 bg-slate-50 text-slate-700';

  const handlePrintFicha = async () => {
    if (!ficha) {
      return;
    }

    try {
      setPrinting(true);
      await printPublicBoletaFicha({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        supportText: config.publicSupportText,
        supportPhone: config.publicContactPhone || config.responsableTelefono,
        supportWhatsapp: config.publicContactWhatsapp,
        supportEmail: config.publicContactEmail,
        backgroundDataUrl: config.publicTicketBackgroundDataUrl,
        publicUrl: window.location.href,
        ficha: {
          numero: ficha.boleta.numero,
          estado: ficha.boleta.estado,
          total: ficha.boleta.total,
          totalAbonado: ficha.boleta.totalAbonado,
          saldoPendiente: ficha.boleta.saldoPendiente,
          juega: ficha.boleta.juega,
          clienteNombre: ficha.cliente?.nombre || null,
          clienteDocumento: ficha.cliente?.documento || null,
          clienteTelefono: ficha.cliente?.telefono || null,
          vendedorNombre: ficha.vendedor,
          rifaNombre: ficha.rifa.nombre,
          boletasRelacionadas: ficha.boletasRelacionadas,
          historialPagos: ficha.historialPagos,
        },
      });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicNavbar
        showBackHome
        ctaHref={ficha?.rifa?.id ? `/publico/rifas/${ficha.rifa.id}` : '/publico'}
        ctaLabel="Ver rifa"
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {state.loading ? <Loading /> : null}
        {!state.loading && state.error ? <ErrorBanner message={state.error} /> : null}

        {!state.loading && ficha ? (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-sm">
              <div className="p-6 md:p-8">
                <div
                  className="relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_25px_60px_rgba(15,23,42,0.14)]"
                  style={{ background: `linear-gradient(135deg, ${config.themeColors.topbarBg}, ${config.themeColors.sidebarActiveBg})` }}
                >
                  <div className="absolute inset-0 opacity-100" style={backgroundStyle} />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950/34 via-slate-950/16 to-white/10" />
                  <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/12 blur-3xl" />
                  <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-black/16 blur-3xl" />

                  <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/72">
                          Ficha compartible
                        </p>
                        <div className="mt-4 flex flex-wrap items-end gap-4">
                          <h1 className="text-5xl font-black tracking-[0.12em] text-white drop-shadow-sm md:text-6xl">
                            {ficha.boleta.numero}
                          </h1>
                          <span className={`rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] shadow-sm backdrop-blur ${tone}`}>
                            {ficha.boleta.estado}
                          </span>
                        </div>
                        <p className="mt-4 text-base font-medium text-white/92">
                          {config.nombreCasaRifera} · {ficha.rifa.nombre}
                        </p>
                        <p className="mt-2 text-sm text-white/80">
                          Vendedor / canal: <span className="font-semibold text-white">{ficha.vendedor}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handlePrintFicha()}
                        disabled={printing}
                        className="rounded-full border border-white/35 bg-white/14 px-5 py-3 text-sm font-semibold text-white backdrop-blur disabled:opacity-60"
                      >
                        {printing ? 'Preparando PDF...' : 'Descargar PDF'}
                      </button>
                    </div>

                    <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[1.8rem] border border-white/14 bg-slate-950/58 p-5 text-white shadow-lg backdrop-blur-md">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/68">Cliente</p>
                        <p className="mt-3 text-2xl font-semibold text-white">
                          {ficha.cliente?.nombre || 'Pendiente de confirmar'}
                        </p>
                        <div className="mt-4 space-y-2 text-sm text-white/82">
                          <p>Documento: {ficha.cliente?.documento || 'Oculto'}</p>
                          <p>Telefono: {ficha.cliente?.telefono || 'Oculto'}</p>
                          <p>Vendedor / canal: {ficha.vendedor}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-white/14 bg-slate-950/62 p-4 text-white shadow-lg backdrop-blur-md">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/62">Total</p>
                          <p className="mt-2 text-xl font-semibold">{formatCOP(ficha.boleta.total)}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/14 bg-slate-950/62 p-4 text-white shadow-lg backdrop-blur-md">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/62">Abonado</p>
                          <p className="mt-2 text-xl font-semibold">{formatCOP(ficha.boleta.totalAbonado)}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/14 bg-slate-950/62 p-4 text-white shadow-lg backdrop-blur-md">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/62">Saldo</p>
                          <p className="mt-2 text-xl font-semibold">{formatCOP(ficha.boleta.saldoPendiente)}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/14 bg-slate-950/62 p-4 text-white shadow-lg backdrop-blur-md">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/62">Juega</p>
                          <p className="mt-2 text-xl font-semibold">{ficha.boleta.juega ? 'SI' : 'NO'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[1.9rem] border border-white/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                      <div className="relative min-h-[28rem]">
                        <div className="absolute inset-0" style={backgroundStyle} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/44 via-transparent to-white/10" />

                        <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-4 p-5">
                          <div className="rounded-[1.4rem] border border-white/16 bg-slate-950/66 px-4 py-3 text-white backdrop-blur-md">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Boletas de la venta</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {ficha.boletasRelacionadas.map((numero: string) => (
                                <span
                                  key={numero}
                                  className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                                    numero === ficha.boleta.numero
                                      ? 'border-white bg-white text-slate-900'
                                      : 'border-white/28 bg-white/12 text-white'
                                  }`}
                                >
                                  {numero}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-white/20 bg-white/92 p-3 text-center text-slate-700 shadow-lg">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                              QR de la ficha
                            </p>
                            {qrDataUrl ? (
                              <img
                                src={qrDataUrl}
                                alt="QR de la ficha publica"
                                className="mt-2 h-24 w-24 rounded-xl bg-white object-contain"
                              />
                            ) : null}
                            <p className="mt-2 max-w-[8rem] text-[10px] leading-4 text-slate-500">
                              Escanea para abrir esta boleta virtual.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Historial de abonos</p>
                <div className="mt-5 space-y-3">
                  {ficha.historialPagos.length ? (
                    ficha.historialPagos.map((pago: any, index: number) => (
                      <div key={`${pago.fecha}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-lg font-semibold text-slate-900">
                            {formatCOP(pago.monto)}
                          </p>
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {pago.metodoPago}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{formatDate(pago.fecha)}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {pago.descripcion || 'Pago registrado'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      Esta boleta aun no tiene abonos registrados.
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Soporte</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>{config.publicSupportText || 'Si tienes dudas sobre tu boleta, contacta al equipo comercial.'}</p>
                  <p>Telefono: {config.publicContactPhone || config.responsableTelefono || 'No disponible'}</p>
                  <p>WhatsApp: {config.publicContactWhatsapp || 'No disponible'}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to={ficha.rifa?.id ? `/publico/rifas/${ficha.rifa.id}` : '/publico'}
                    className="rounded-full px-5 py-3 text-sm font-semibold text-white"
                    style={{ background: config.themeColors.sidebarActiveBg }}
                  >
                    Ver rifa
                  </Link>
                  <Link
                    to="/publico"
                    className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    Ir al inicio
                  </Link>
                </div>
              </article>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default PublicBoletaSharePage;
