import { useEffect, useState } from 'react';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const MovimientosCaja = () => {
  const [state, setState] = useState({ cajas: [], cajaId: '', movimientos: [], loading: true, error: null });

  useEffect(() => {
    const loadCajas = async () => {
      try {
        const { data } = await client.get(endpoints.cajas());
        setState((prev) => ({ ...prev, cajas: data, loading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadCajas();
  }, []);

  const fetchMovimientos = async (cajaId) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data } = await client.get(endpoints.cajaById(cajaId));
      setState((prev) => ({ ...prev, movimientos: data.MovimientoCajas || [], loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
    { key: 'tipo', header: 'Tipo' },
    { key: 'valor', header: 'Valor', render: (row) => formatCOP(row.valor) },
    { key: 'descripcion', header: 'Descripción' }
  ];

  return (
    <div>
      <Topbar title="Movimientos de caja" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="text-slate-600">Caja</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={state.cajaId}
              onChange={(event) => {
                const value = event.target.value;
                setState((prev) => ({ ...prev, cajaId: value }));
                if (value) fetchMovimientos(value);
              }}
            >
              <option value="">Selecciona una caja</option>
              {state.cajas.map((caja) => (
                <option key={caja.id} value={caja.id}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        {state.loading && <Loading />}
        {!state.loading && !state.cajaId && (
          <EmptyState title="Selecciona una caja" description="El listado de movimientos se carga al seleccionar la caja." />
        )}
        {!state.loading && state.cajaId && state.movimientos.length === 0 && (
          <EmptyState title="Sin movimientos" description="No hay movimientos registrados para esta caja." />
        )}
        {!state.loading && state.movimientos.length > 0 && <DataTable columns={columns} data={state.movimientos} />}
        {!state.loading && state.cajaId && (
          <p className="text-xs text-slate-500">
            Nota: el backend entrega máximo 10 movimientos por caja.
          </p>
        )}
      </div>
    </div>
  );
};

export default MovimientosCaja;
