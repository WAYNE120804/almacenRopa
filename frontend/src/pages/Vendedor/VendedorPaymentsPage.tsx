import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime, todayISO } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const paymentMethods = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

const initialForm = {
  subCajaId: '',
  monto: '',
  fecha: todayISO(),
  metodoPago: 'EFECTIVO',
  descripcion: '',
};

const VendedorPaymentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clientes, setClientes] = useState<any[]>([]);
  const [subCajas, setSubCajas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSubCajas, setLoadingSubCajas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadClientes = async () => {
    const { data } = await client.get(endpoints.clientes());
    setClientes(data || []);
    return data || [];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadClientes();
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    const loadSubCajas = async () => {
      if (!selectedSale?.rifa?.id) {
        setSubCajas([]);
        return;
      }

      try {
        setLoadingSubCajas(true);
        const { data } = await client.get(endpoints.subCajas(), {
          params: { rifaId: selectedSale.rifa.id },
        });
        setSubCajas(data || []);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingSubCajas(false);
      }
    };

    void loadSubCajas();
  }, [selectedSale?.rifa?.id]);

  const saleRows = useMemo(() => {
    return clientes
      .flatMap((clienteItem) =>
        (clienteItem.ventas || []).map((venta: any) => ({
          ...venta,
          cliente: clienteItem,
        }))
      )
      .filter((venta: any) => Number(venta.saldoPendiente || 0) > 0);
  }, [clientes]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return saleRows;
    }

    return saleRows.filter((venta: any) =>
      [
        venta.cliente?.nombre,
        venta.cliente?.documento,
        venta.rifa?.nombre,
        venta.rifaVendedor?.vendedor?.nombre,
        ...(venta.boletas || []).map((item: any) => item.numero),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [saleRows, search]);

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, venta: any) => {
        acc.ventas += 1;
        acc.saldo += Number(venta.saldoPendiente || 0);
        acc.total += Number(venta.total || 0);
        return acc;
      },
      {
        ventas: 0,
        saldo: 0,
        total: 0,
      }
    );
  }, [filteredRows]);

  const handleOpenPayment = (venta: any) => {
    setSelectedSale(venta);
    setForm({
      ...initialForm,
      monto: String(Number(venta.saldoPendiente || 0)),
      descripcion: `Pago de ${venta.cliente?.nombre || 'cliente'} en ${venta.rifa?.nombre || 'rifa'}`,
    });
    setSubCajas([]);
    setError(null);
    setSuccess('');
  };

  useEffect(() => {
    if (!saleRows.length) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const ventaId = params.get('ventaId');
    const clienteId = params.get('clienteId');

    if (!ventaId) {
      return;
    }

    const targetSale = saleRows.find(
      (venta: any) =>
        venta.id === ventaId && (!clienteId || venta.cliente?.id === clienteId)
    );

    if (!targetSale) {
      return;
    }

    handleOpenPayment(targetSale);
  }, [location.search, saleRows]);

  const handleCreatePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSale?.cliente?.id || !selectedSale?.id) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess('');

      const { data } = await client.post(
        endpoints.clienteVentaPago(selectedSale.cliente.id, selectedSale.id),
        {
          subCajaId: form.subCajaId,
          monto: Number(form.monto),
          fecha: form.fecha,
          metodoPago: form.metodoPago,
          descripcion: form.descripcion,
        }
      );

      await loadClientes();
      setSelectedSale(null);
      setForm(initialForm);
      setSuccess('Pago registrado correctamente.');
      navigate(`/cliente-recibos/${data.id}`);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'cliente',
      header: 'CLIENTE',
      render: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.cliente?.nombre}</p>
          <p className="text-xs text-slate-500">{row.cliente?.documento || 'Sin documento'}</p>
        </div>
      ),
    },
    {
      key: 'rifa',
      header: 'RIFA',
      render: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.rifa?.nombre || 'Sin rifa'}</p>
          <p className="text-xs text-slate-500">{row.rifaVendedor?.vendedor?.nombre || 'Sin canal'}</p>
        </div>
      ),
    },
    {
      key: 'boletas',
      header: 'BOLETAS',
      render: (row: any) => (row.boletas || []).map((item: any) => item.numero).join(', '),
    },
    {
      key: 'createdAt',
      header: 'VENTA',
      render: (row: any) => formatDateTime(row.createdAt),
    },
    {
      key: 'total',
      header: 'TOTAL',
      render: (row: any) => formatCOP(row.total),
    },
    {
      key: 'saldoPendiente',
      header: 'SALDO',
      render: (row: any) => formatCOP(row.saldoPendiente),
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <button
          type="button"
          className="font-semibold text-slate-900 underline"
          onClick={() => handleOpenPayment(row)}
        >
          REGISTRAR PAGO
        </button>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Mis pagos" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {success ? <Toast message={success} /> : null}
        {loading ? <Loading label="Cargando ventas pendientes..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Cobros pendientes
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Registra pagos y abonos sobre las ventas de tus clientes.
              </p>
              <div className="mt-6 max-w-xl">
                <label className="block text-sm">
                  <span className="text-slate-600">Buscar venta</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Cliente, documento, rifa, canal o boleta"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">VENTAS PENDIENTES</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">{summary.ventas}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">SALDO PENDIENTE</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.saldo)}
                </p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">VALOR TOTAL</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.total)}
                </p>
              </div>
            </div>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Ventas por cobrar
              </h3>
              <div className="mt-6">
                {filteredRows.length ? (
                  <DataTable columns={columns} data={filteredRows} />
                ) : (
                  <EmptyState
                    title="Sin ventas pendientes"
                    description="No hay ventas con saldo pendiente dentro del alcance del vendedor."
                  />
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {selectedSale ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={handleCreatePayment} className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-slate-900">Registrar pago</h3>
            <p className="mt-2 text-sm text-slate-500">
              El pago queda ligado al cliente, la venta, la relacion del vendedor y su recibo verificable.
            </p>
            {error ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="theme-summary-card rounded-2xl p-4">
                <p className="theme-summary-label">CLIENTE</p>
                <p className="theme-fit-value mt-2 font-semibold">{selectedSale.cliente?.nombre}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-4">
                <p className="theme-summary-label">RIFA</p>
                <p className="theme-fit-value mt-2 font-semibold">{selectedSale.rifa?.nombre}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-4">
                <p className="theme-summary-label">TOTAL</p>
                <p className="theme-fit-value mt-2 font-semibold">{formatCOP(selectedSale.total)}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-4">
                <p className="theme-summary-label">SALDO</p>
                <p className="theme-fit-value mt-2 font-semibold">{formatCOP(selectedSale.saldoPendiente)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Monto</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.monto}
                  onChange={(event) => setForm((current) => ({ ...current, monto: event.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Fecha</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.fecha}
                  onChange={(event) => setForm((current) => ({ ...current, fecha: event.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Metodo de pago</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.metodoPago}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, metodoPago: event.target.value }))
                  }
                >
                  {paymentMethods.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-sm text-slate-600">Subcaja</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={subCajas.map((item) => ({ value: item.id, label: item.nombre }))}
                    value={form.subCajaId}
                    onChange={(value) => setForm((current) => ({ ...current, subCajaId: value }))}
                    placeholder={loadingSubCajas ? 'Cargando subcajas...' : 'Selecciona una subcaja'}
                  />
                </div>
              </div>
            </div>

            <label className="mt-4 block text-sm">
              <span className="text-slate-600">Descripcion</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({ ...current, descripcion: event.target.value }))
                }
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setSelectedSale(null)}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving || !form.subCajaId || !form.monto}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {saving ? 'REGISTRANDO...' : 'REGISTRAR PAGO'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default VendedorPaymentsPage;
