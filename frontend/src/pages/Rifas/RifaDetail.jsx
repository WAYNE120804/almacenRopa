import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { formatCOP } from '../../utils/money';

const RifaDetail = () => {
  const { id } = useParams();
  const [state, setState] = useState({ rifa: null, rifaVendedores: [], loading: true, error: null });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifaRes, rvRes] = await Promise.all([
          client.get(endpoints.rifaById(id)),
          client.get(endpoints.rifaVendedores())
        ]);

        setState({
          rifa: rifaRes.data,
          rifaVendedores: rvRes.data.filter((rv) => rv.rifa_id === id),
          loading: false,
          error: null
        });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, [id]);

  const columns = [
    { key: 'vendedor_id', header: 'Vendedor ID' },
    { key: 'comision_pct', header: 'Comisión %' },
    { key: 'precio_casa', header: 'Precio casa', render: (row) => formatCOP(row.precio_casa) },
    { key: 'boletas_asignadas', header: 'Boletas' },
    { key: 'saldo_actual', header: 'Saldo', render: (row) => formatCOP(row.saldo_actual) },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <Link to={`/vendedores/${row.vendedor_id}`} className="text-indigo-600">
          Ver vendedor
        </Link>
      )
    }
  ];

  return (
    <div>
      <Topbar title="Detalle de rifa" actions={<Link className="text-sm text-slate-600" to="/rifas">Volver</Link>} />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.rifa && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{state.rifa.nombre}</h3>
                <p className="text-sm text-slate-500">Consecutivo actual: {state.rifa.consecutivo_actual}</p>
              </div>
              <Link to={`/rifas/${id}/editar`} className="rounded-md border border-slate-300 px-3 py-1 text-sm">
                Editar rifa
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-xs uppercase text-slate-400">Precio boleta</span>
                <p className="text-base font-semibold">{formatCOP(state.rifa.precio_boleta)}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-slate-400">Estado</span>
                <p className="text-base font-semibold">{state.rifa.activo ? 'Activa' : 'Inactiva'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">Vendedores asociados</h4>
            <Link to="/asignaciones" className="text-sm text-indigo-600">Asignar boletas</Link>
          </div>
          {!state.loading && state.rifaVendedores.length === 0 && (
            <EmptyState title="Sin vendedores" description="Vincula vendedores a la rifa desde Asignaciones." />
          )}
          {!state.loading && state.rifaVendedores.length > 0 && (
            <DataTable columns={columns} data={state.rifaVendedores} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RifaDetail;
