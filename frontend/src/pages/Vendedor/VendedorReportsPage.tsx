import { useEffect, useMemo, useState } from 'react';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatCOP } from '../../utils/money';
import { printVendorLetterReport } from '../../utils/print';

const VendedorReportsPage = () => {
  const { config } = useAppConfig();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relationId, setRelationId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(endpoints.clientes());
        setClientes(data || []);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const sales = useMemo(
    () =>
      clientes.flatMap((clienteItem) =>
        (clienteItem.ventas || []).map((venta: any) => ({
          ...venta,
          cliente: clienteItem,
        }))
      ),
    [clientes]
  );

  const relationOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();

    sales.forEach((venta: any) => {
      const relation = venta.rifaVendedor;
      if (!relation?.id || map.has(relation.id)) {
        return;
      }

      map.set(relation.id, {
        value: relation.id,
        label: `${venta.rifa?.nombre || 'Sin rifa'} - ${relation.vendedor?.nombre || 'Sin vendedor'}`,
      });
    });

    return Array.from(map.values());
  }, [sales]);

  const filteredSales = useMemo(
    () =>
      relationId
        ? sales.filter((venta: any) => venta.rifaVendedor?.id === relationId)
        : sales,
    [relationId, sales]
  );

  const metrics = useMemo(() => {
    const pagos = filteredSales.flatMap((venta: any) => venta.pagos || []);
    const totalVendido = filteredSales.reduce((sum: number, venta: any) => sum + Number(venta.total || 0), 0);
    const totalAbonado = pagos.reduce((sum: number, pago: any) => sum + Number(pago.monto || 0), 0);
    const carteraPendiente = filteredSales.reduce(
      (sum: number, venta: any) => sum + Number(venta.saldoPendiente || 0),
      0
    );
    const boletasPagadas = filteredSales.reduce(
      (sum: number, venta: any) =>
        sum + (venta.boletas || []).filter((item: any) => item.estado === 'PAGADA').length,
      0
    );
    const boletasPendientes = filteredSales.reduce(
      (sum: number, venta: any) =>
        sum + (venta.boletas || []).filter((item: any) => item.estado !== 'PAGADA').length,
      0
    );

    return {
      totalAbonado,
      deudaActual: carteraPendiente,
      boletasTotales: boletasPagadas + boletasPendientes,
      boletasPagadas,
      boletasPendientes,
      totalVendido,
      clientes: new Set(filteredSales.map((venta: any) => venta.cliente?.id)).size,
      ventas: filteredSales.length,
    };
  }, [filteredSales]);

  const paymentMethodRows = useMemo(() => {
    const grouped = filteredSales
      .flatMap((venta: any) => venta.pagos || [])
      .reduce<Record<string, number>>((acc, pago: any) => {
        const key = pago.metodoPago || 'SIN_METODO';
        acc[key] = (acc[key] || 0) + Number(pago.monto || 0);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);
  }, [filteredSales]);

  const relationRows = useMemo(() => {
    const map = new Map<string, any>();

    filteredSales.forEach((venta: any) => {
      const relation = venta.rifaVendedor;
      if (!relation?.id) {
        return;
      }

      if (!map.has(relation.id)) {
        map.set(relation.id, {
          id: relation.id,
          rifaNombre: venta.rifa?.nombre || 'SIN RIFA',
          vendedorNombre: relation.vendedor?.nombre || 'SIN VENDEDOR',
          boletas: 0,
          totalAbonado: 0,
          saldoActual: 0,
        });
      }

      const current = map.get(relation.id);
      current.boletas += (venta.boletas || []).length;
      current.totalAbonado += (venta.pagos || []).reduce(
        (sum: number, pago: any) => sum + Number(pago.monto || 0),
        0
      );
      current.saldoActual += Number(venta.saldoPendiente || 0);
    });

    return Array.from(map.values());
  }, [filteredSales]);

  const moraRows = useMemo(
    () =>
      filteredSales
        .filter((venta: any) => Number(venta.saldoPendiente || 0) > 0)
        .sort((left: any, right: any) => Number(right.saldoPendiente || 0) - Number(left.saldoPendiente || 0))
        .slice(0, 8),
    [filteredSales]
  );

  const handlePrint = () => {
    if (!relationRows.length) {
      return;
    }

    printVendorLetterReport({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      reportTitle: 'Informe comercial del vendedor',
      relationLabel:
        relationOptions.find((item) => item.value === relationId)?.label || 'Todas mis relaciones',
      metrics: {
        totalAbonado: metrics.totalAbonado,
        deudaActual: metrics.deudaActual,
        boletasTotales: metrics.boletasTotales,
        boletasPagadas: metrics.boletasPagadas,
        boletasPendientes: metrics.boletasPendientes,
      },
      paymentMethods: paymentMethodRows,
      relations: relationRows,
    });
  };

  return (
    <div>
      <Topbar
        title="Mis informes"
        actions={
          <button
            type="button"
            onClick={handlePrint}
            disabled={!relationRows.length}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            IMPRIMIR INFORME
          </button>
        }
      />

      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando informe comercial..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Alcance del informe
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Consulta ventas, cartera y recaudo por relacion o consolidados sobre todo tu canal.
              </p>
              <div className="mt-6 max-w-xl">
                <SearchableSelect
                  options={relationOptions}
                  value={relationId}
                  onChange={setRelationId}
                  placeholder="Todas mis relaciones"
                  clearable
                  clearLabel="Quitar filtro"
                />
              </div>
            </section>

            {relationRows.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                    <p className="theme-summary-label">CLIENTES</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {metrics.clientes}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                    <p className="theme-summary-label">VENTAS</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {metrics.ventas}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                    <p className="theme-summary-label">VENDIDO</p>
                    <p className="theme-summary-value mt-3 text-3xl font-semibold">
                      {formatCOP(metrics.totalVendido)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                    <p className="theme-summary-label">RECAUDADO</p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-700">
                      {formatCOP(metrics.totalAbonado)}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                    <p className="theme-summary-label">CARTERA</p>
                    <p className="mt-3 text-3xl font-semibold text-amber-700">
                      {formatCOP(metrics.deudaActual)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                    <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                      Estado por relacion
                    </h3>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead className="theme-table-head">
                          <tr className="text-left text-sm">
                            <th className="px-4 py-3 font-semibold">RIFA</th>
                            <th className="px-4 py-3 font-semibold">VENDEDOR</th>
                            <th className="px-4 py-3 font-semibold">BOLETAS</th>
                            <th className="px-4 py-3 text-right font-semibold">RECAUDADO</th>
                            <th className="px-4 py-3 text-right font-semibold">CARTERA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relationRows.map((item) => (
                            <tr key={item.id} className="border-t border-slate-200 text-sm">
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.rifaNombre}</td>
                              <td className="px-4 py-3 text-slate-700">{item.vendedorNombre}</td>
                              <td className="px-4 py-3 text-slate-700">{item.boletas}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCOP(item.totalAbonado)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCOP(item.saldoActual)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                    <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                      Recaudo por metodo
                    </h3>
                    <div className="mt-6 space-y-4">
                      {paymentMethodRows.length ? (
                        paymentMethodRows.map((item) => (
                          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {item.label}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                              {formatCOP(item.value)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          title="Sin recaudo"
                          description="Todavia no hay pagos registrados en el alcance seleccionado."
                        />
                      )}
                    </div>
                  </section>
                </div>

                <section className="theme-section-card rounded-2xl p-6 shadow-sm">
                  <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                    Seguimiento de cartera
                  </h3>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="theme-summary-card rounded-2xl p-5">
                      <p className="theme-summary-label">BOLETAS PAGADAS</p>
                      <p className="theme-summary-value mt-3 text-3xl font-semibold">
                        {metrics.boletasPagadas}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-5">
                      <p className="theme-summary-label">BOLETAS PENDIENTES</p>
                      <p className="theme-summary-value mt-3 text-3xl font-semibold">
                        {metrics.boletasPendientes}
                      </p>
                    </div>
                    <div className="theme-summary-card rounded-2xl p-5">
                      <p className="theme-summary-label">PAGADO / TOTAL</p>
                      <p className="theme-summary-value mt-3 text-3xl font-semibold">
                        {formatCOP(metrics.totalAbonado)} / {formatCOP(metrics.totalVendido)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {moraRows.length ? (
                      moraRows.map((venta: any) => (
                        <div key={venta.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="font-semibold text-slate-900">{venta.cliente?.nombre}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {venta.rifa?.nombre} · {(venta.boletas || []).map((item: any) => item.numero).join(', ')}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-500">Saldo pendiente</span>
                            <span className="font-semibold text-amber-700">
                              {formatCOP(venta.saldoPendiente)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="Sin cartera pendiente"
                        description="No hay ventas abiertas con saldo pendiente en el alcance seleccionado."
                      />
                    )}
                  </div>
                </section>
              </>
            ) : (
              <EmptyState
                title="Sin ventas"
                description="No hay datos comerciales para construir el informe del vendedor."
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default VendedorReportsPage;
