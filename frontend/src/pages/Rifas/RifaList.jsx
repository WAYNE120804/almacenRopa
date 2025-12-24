import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import DataTable from '../../components/common/DataTable';
import Loading from '../../components/common/Loading';
import ErrorBanner from '../../components/common/ErrorBanner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const RifaList = () => {
  const [state, setState] = useState({ rifas: [], loading: true, error: null });

  const fetchRifas = async () => {
    try {
      const { data } = await client.get(endpoints.rifas());
      setState({ rifas: data, loading: false, error: null });
    } catch (error) {
      setState({ rifas: [], loading: false, error: error.message });
    }
  };

  useEffect(() => {
    fetchRifas();
  }, []);

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'activo',
      header: 'Estado',
      render: (row) => (
        <span className={`rounded-full px-2 py-1 text-xs ${row.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.activo ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
    { key: 'fecha_inicio', header: 'Inicio', render: (row) => formatDate(row.fecha_inicio) },
    { key: 'fecha_fin', header: 'Fin', render: (row) => formatDate(row.fecha_fin) },
    { key: 'precio_boleta', header: 'Precio boleta', render: (row) => formatCOP(row.precio_boleta) },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Link className="text-indigo-600" to={`/rifas/${row.id}`}>Detalle</Link>
          <Link className="text-slate-600" to={`/rifas/${row.id}/editar`}>Editar</Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <Topbar
        title="Rifas"
        actions={
          <Link to="/rifas/crear" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
            Crear rifa
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.rifas.length === 0 && (
          <EmptyState title="No hay rifas" description="Crea la primera rifa para empezar." />
        )}
        {!state.loading && state.rifas.length > 0 && <DataTable columns={columns} data={state.rifas} />}
      </div>
    </div>
  );
};

export default RifaList;
