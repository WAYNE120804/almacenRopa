import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { formatCOP } from '../../utils/money';
import { formatDate } from '../../utils/dates';

const VendedorDetail = () => {
  const { id } = useParams();
  const [state, setState] = useState({
    vendedor: null,
    rifaVendedores: [],
    abonosMap: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vendedorRes, rvRes] = await Promise.all([
          client.get(endpoints.vendedorById(id)),
          client.get(endpoints.rifaVendedores())
        ]);

        const rifaVendedores = rvRes.data.filter((rv) => rv.vendedor_id === id);

        const abonoResponses = await Promise.all(
          rifaVendedores.map((rv) => client.get(endpoints.abonosByRifaVendedor(rv.id)))
        );

        const abonosMap = rifaVendedores.reduce((acc, rv, index) => {
          acc[rv.id] = abonoResponses[index]?.data || [];
          return acc;
        }, {});

        setState({ vendedor: vendedorRes.data, rifaVendedores, abonosMap, loading: false, error: null });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, [id]);

  const totalDeuda = useMemo(() => {
    return state.rifaVendedores.reduce((sum, rv) => sum + Number(rv.saldo_actual || 0), 0);
  }, [state.rifaVendedores]);

  const columns = [
    { key: 'rifa_id', header: 'Rifa ID' },
    { key: 'comision_pct', header: 'Comisión %' },
    { key: 'precio_casa', header: 'Precio casa', render: (row) => formatCOP(row.precio_casa) },
    { key: 'boletas_asignadas', header: 'Boletas' },
    { key: 'saldo_actual', header: 'Saldo', render: (row) => formatCOP(row.saldo_actual) },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Link to={`/asignaciones?rifaVendedor=${row.id}`} className="text-indigo-600">Asignar boletas</Link>
          <Link to={`/abonos/crear?rifaVendedor=${row.id}`} className="text-indigo-600">Registrar abono</Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <Topbar title="Detalle del vendedor" actions={<Link className="text-sm text-slate-600" to="/vendedores">Volver</Link>} />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && state.vendedor && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">{state.vendedor.nombre}</h3>
            <p className="text-sm text-slate-500">Documento: {state.vendedor.documento || 'N/D'}</p>
            <p className="text-sm text-slate-500">Teléfono: {state.vendedor.telefono || 'N/D'}</p>
            <p className="text-sm text-slate-500">Dirección: {state.vendedor.direccion || 'N/D'}</p>
            <div className="mt-4 text-sm text-slate-600">
              <span className="font-semibold">Saldo total:</span> {formatCOP(totalDeuda)}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-base font-semibold">Rifas asociadas</h4>
          {!state.loading && state.rifaVendedores.length === 0 && (
            <EmptyState title="Sin rifas asociadas" description="Vincula este vendedor a una rifa desde Asignaciones." />
          )}
          {!state.loading && state.rifaVendedores.length > 0 && (
            <DataTable columns={columns} data={state.rifaVendedores} />
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-base font-semibold">Historial de abonos</h4>
          {state.rifaVendedores.map((rv) => (
            <div key={rv.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <h5 className="text-sm font-semibold text-slate-700">RifaVendedor {rv.id}</h5>
              {state.abonosMap[rv.id]?.length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {state.abonosMap[rv.id].map((abono) => (
                    <li key={abono.id} className="flex flex-wrap justify-between gap-2">
                      <span>{formatDate(abono.fecha)} - {formatCOP(abono.valor)}</span>
                      <span className="text-xs text-slate-500">Recibo: requiere endpoint por abono</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Sin abonos registrados.</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-base font-semibold">Historial de asignaciones</h4>
          <EmptyState
            title="Endpoint faltante"
            description="El backend no expone un endpoint para listar asignaciones de boletas. Se recomienda agregar GET /asignaciones-boletas o similar."
          />
        </div>
      </div>
    </div>
  );
};

export default VendedorDetail;
