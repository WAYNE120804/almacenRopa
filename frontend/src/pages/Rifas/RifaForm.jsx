import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Topbar from '../../components/Layout/Topbar';
import ErrorBanner from '../../components/common/ErrorBanner';
import MoneyInput from '../../components/common/MoneyInput';
import DateInput from '../../components/common/DateInput';

const initialForm = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  precio_boleta: 0,
  activo: true
};

const RifaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRifa = async () => {
      if (!id) return;
      try {
        const { data } = await client.get(endpoints.rifaById(id));
        setForm({
          nombre: data.nombre,
          fecha_inicio: data.fecha_inicio ? data.fecha_inicio.slice(0, 10) : '',
          fecha_fin: data.fecha_fin ? data.fecha_fin.slice(0, 10) : '',
          precio_boleta: data.precio_boleta,
          activo: data.activo
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadRifa();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      if (id) {
        await client.put(endpoints.rifaById(id), form);
      } else {
        await client.post(endpoints.rifas(), form);
      }
      navigate('/rifas');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <Topbar title={id ? 'Editar rifa' : 'Crear rifa'} />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow-sm">
            <label className="text-sm">
              <span className="text-slate-600">Nombre</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <DateInput label="Fecha inicio" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} />
              <DateInput label="Fecha fin" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} />
            </div>
            <MoneyInput
              label="Precio por boleta"
              name="precio_boleta"
              value={form.precio_boleta}
              onChange={handleChange}
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
              Rifa activa
            </label>
            <div className="flex justify-end">
              <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white" type="submit">
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RifaForm;
