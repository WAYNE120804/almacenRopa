import { useEffect, useState } from 'react';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const HistorialAbonos = () => {
  const [state, setState] = useState({
    rifaVendedores: [],
    selected: '',
    abonos: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadRifaVendedores = async () => {
      try {
        const { data } = await client.get(endpoints.rifaVendedores());
        setState((prev) => ({ ...prev, rifaVendedores: data, loading: false }));
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadRifaVendedores();
  }, []);

  const fetchAbonos = async (rifaVendedorId) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data } = await client.get(endpoints.abonosByRifaVendedor(rifaVendedorId));
      setState((prev) => ({ ...prev, abonos: data, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  };

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
    { key: 'valor', header: 'Valor', render: (row) => formatCOP(row.valor) },
    { key: 'medio_pago', header: 'Medio pago' }
  ];

  return (
    <div>
      <Topbar title="Historial de abonos" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="text-slate-600">Selecciona vínculo rifa-vendedor</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={state.selected}
              onChange={(event) => {
                const value = event.target.value;
                setState((prev) => ({ ...prev, selected: value }));
                if (value) fetchAbonos(value);
              }}
            >
              <option value="">Selecciona un vínculo</option>
              {state.rifaVendedores.map((rv) => (
                <option key={rv.id} value={rv.id}>
                  {rv.rifa_id} - {rv.vendedor_id}
                </option>
              ))}
            </select>
          </label>
        </div>
        {state.loading && <Loading />}
        {!state.loading && !state.selected && (
          <EmptyState title="Selecciona un vínculo" description="El historial se mostrará al seleccionar un vínculo rifa-vendedor." />
        )}
        {!state.loading && state.selected && state.abonos.length === 0 && (
          <EmptyState title="Sin abonos" description="No hay abonos registrados para este vendedor." />
        )}
        {!state.loading && state.abonos.length > 0 && <DataTable columns={columns} data={state.abonos} />}
      </div>
    </div>
  );
};

export default HistorialAbonos;
