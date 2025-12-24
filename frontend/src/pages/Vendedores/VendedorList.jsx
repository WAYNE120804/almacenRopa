import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import DataTable from '../../components/common/DataTable';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';

const VendedorList = () => {
  const [state, setState] = useState({ vendedores: [], loading: true, error: null });

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const { data } = await client.get(endpoints.vendedores());
        setState({ vendedores: data, loading: false, error: null });
      } catch (error) {
        setState({ vendedores: [], loading: false, error: error.message });
      }
    };

    fetchVendedores();
  }, []);

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'documento', header: 'Documento' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'direccion', header: 'Dirección' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Link className="text-indigo-600" to={`/vendedores/${row.id}`}>Detalle</Link>
          <Link className="text-slate-600" to={`/vendedores/${row.id}/editar`}>Editar</Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <Topbar
        title="Vendedores"
        actions={
          <Link to="/vendedores/crear" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
            Crear vendedor
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.vendedores.length === 0 && (
          <EmptyState title="No hay vendedores" description="Registra tu primer vendedor para empezar." />
        )}
        {!state.loading && state.vendedores.length > 0 && <DataTable columns={columns} data={state.vendedores} />}
      </div>
    </div>
  );
};

export default VendedorList;
