import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import DataTable from '../../components/common/DataTable';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const GastoList = () => {
  const [state, setState] = useState({ gastos: [], loading: true, error: null });

  useEffect(() => {
    const fetchGastos = async () => {
      try {
        const { data } = await client.get(endpoints.gastos());
        setState({ gastos: data, loading: false, error: null });
      } catch (error) {
        setState({ gastos: [], loading: false, error: error.message });
      }
    };

    fetchGastos();
  }, []);

  const columns = [
    { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha) },
    { key: 'valor', header: 'Valor', render: (row) => formatCOP(row.valor) },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'tipo', header: 'Tipo' }
  ];

  return (
    <div>
      <Topbar
        title="Gastos"
        actions={
          <Link to="/gastos/crear" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
            Registrar gasto
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.gastos.length === 0 && (
          <EmptyState title="Sin gastos" description="Registra un gasto para empezar." />
        )}
        {!state.loading && state.gastos.length > 0 && <DataTable columns={columns} data={state.gastos} />}
      </div>
    </div>
  );
};

export default GastoList;
