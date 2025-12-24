import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';

const GastoForm = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({ rifas: [], cajas: [], loading: true, error: null });
  const [form, setForm] = useState({
    rifa_id: '',
    caja_id: '',
    valor: 0,
    descripcion: '',
    fecha: '',
    tipo: 'NORMAL'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rifasRes, cajasRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.cajas())
        ]);
        setState({ rifas: rifasRes.data, cajas: cajasRes.data, loading: false, error: null });
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    };

    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, error: null }));
    try {
      await client.post(endpoints.gastos(), {
        ...form,
        valor: Number(form.valor),
        fecha: form.fecha || undefined
      });
      navigate('/gastos');
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  return (
    <div>
      <Topbar title="Registrar gasto" />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow-sm">
            <label className="block text-sm">
              <span className="text-slate-600">Rifa</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="rifa_id"
                value={form.rifa_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una rifa</option>
                {state.rifas.map((rifa) => (
                  <option key={rifa.id} value={rifa.id}>
                    {rifa.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Caja</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="caja_id"
                value={form.caja_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una caja</option>
                {state.cajas.map((caja) => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre}
                  </option>
                ))}
              </select>
            </label>
            <MoneyInput label="Valor" name="valor" value={form.valor} onChange={handleChange} required />
            <label className="block text-sm">
              <span className="text-slate-600">Fecha</span>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Tipo</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="DEVOLUCION">DEVOLUCION</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Descripción</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
              />
            </label>
            <div className="flex justify-end">
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white" type="submit">
                Guardar gasto
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GastoForm;
