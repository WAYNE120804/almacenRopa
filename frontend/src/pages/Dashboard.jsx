import { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { endpoints } from '../api/endpoints';
import Topbar from '../components/Layout/Topbar';
import Loading from '../components/common/Loading';
import ErrorBanner from '../components/common/ErrorBanner';
import { formatCOP } from '../utils/money';
import { formatDate } from '../utils/dates';

const Dashboard = () => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    rifas: [],
    gastos: [],
    cajas: [],
    rifaVendedores: [],
    abonos: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifasRes, gastosRes, cajasRes, rifaVendedorRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.gastos()),
          client.get(endpoints.cajas()),
          client.get(endpoints.rifaVendedores())
        ]);

        const rifaVendedores = rifaVendedorRes.data;
        const abonoResponses = await Promise.all(
          rifaVendedores.map((rv) => client.get(endpoints.abonosByRifaVendedor(rv.id)))
        );

        const abonos = abonoResponses.flatMap((res) => res.data);

        setState({
          loading: false,
          error: null,
          rifas: rifasRes.data,
          gastos: gastosRes.data,
          cajas: cajasRes.data,
          rifaVendedores,
          abonos
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, []);

  const todayTotals = useMemo(() => {
    const today = new Date().toDateString();
    const gastosHoy = state.gastos.filter((gasto) => new Date(gasto.fecha).toDateString() === today);
    const abonosHoy = state.abonos.filter((abono) => new Date(abono.fecha).toDateString() === today);

    return {
      gastos: gastosHoy.reduce((sum, gasto) => sum + Number(gasto.valor || 0), 0),
      abonos: abonosHoy.reduce((sum, abono) => sum + Number(abono.valor || 0), 0)
    };
  }, [state.gastos, state.abonos]);

  const activeRifa = state.rifas.find((rifa) => rifa.activo);
  const saldoCaja = state.cajas.reduce((sum, caja) => sum + Number(caja.saldo || 0), 0);

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="space-y-6 px-6 py-6">
        {state.loading && <Loading label="Cargando resumen" />}
        <ErrorBanner message={state.error} />
        {!state.loading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-slate-400">Rifa activa</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">
                {activeRifa ? activeRifa.nombre : 'No hay rifa activa'}
              </p>
              <p className="text-sm text-slate-500">Precio boleta: {activeRifa ? formatCOP(activeRifa.precio_boleta) : 'N/D'}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-slate-400">Abonos del día</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{formatCOP(todayTotals.abonos)}</p>
              <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-slate-400">Gastos del día</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{formatCOP(todayTotals.gastos)}</p>
              <p className="text-sm text-slate-500">{formatDate(new Date())}</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-xs uppercase text-slate-400">Saldo caja</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{formatCOP(saldoCaja)}</p>
              <p className="text-sm text-slate-500">Cajas: {state.cajas.length}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/abonos/crear"
            className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          >
            <span className="text-xs uppercase text-slate-400">Acceso directo</span>
            <p className="mt-2 text-base font-semibold text-slate-900">Crear abono</p>
          </a>
          <a
            href="/asignaciones"
            className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          >
            <span className="text-xs uppercase text-slate-400">Acceso directo</span>
            <p className="mt-2 text-base font-semibold text-slate-900">Asignar boletas</p>
          </a>
          <a
            href="/gastos/crear"
            className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          >
            <span className="text-xs uppercase text-slate-400">Acceso directo</span>
            <p className="mt-2 text-base font-semibold text-slate-900">Registrar gasto</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
