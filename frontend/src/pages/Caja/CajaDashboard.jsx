import { useEffect, useState } from 'react';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { Link } from 'react-router-dom';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import { formatCOP } from '../../utils/money';

const CajaDashboard = () => {
  const [state, setState] = useState({ cajas: [], loading: true, error: null });

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const { data } = await client.get(endpoints.cajas());
        setState({ cajas: data, loading: false, error: null });
      } catch (error) {
        setState({ cajas: [], loading: false, error: error.message });
      }
    };

    fetchCajas();
  }, []);

  const totalSaldo = state.cajas.reduce((sum, caja) => sum + Number(caja.saldo || 0), 0);

  return (
    <div>
      <Topbar
        title="Caja"
        actions={
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" to="/caja/movimientos">
            Ver movimientos
          </Link>
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading && <Loading />}
        {!state.loading && (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">Saldo total</div>
            <div className="text-2xl font-semibold text-slate-800">{formatCOP(totalSaldo)}</div>
            <div className="mt-4 grid gap-3">
              {state.cajas.map((caja) => (
                <div key={caja.id} className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-800">{caja.nombre}</div>
                    <div className="text-xs text-slate-500">ID: {caja.id}</div>
                  </div>
                  <div className="font-semibold">{formatCOP(caja.saldo)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CajaDashboard;
