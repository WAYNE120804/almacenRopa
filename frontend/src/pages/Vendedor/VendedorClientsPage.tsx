import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

const initialClientForm = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
};

const VendedorClientsPage = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [availableBoletas, setAvailableBoletas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [saleForm, setSaleForm] = useState({
    relationId: '',
    selectedBoletaIds: [] as string[],
  });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);

  const loadClientes = async (searchValue = '') => {
    const { data } = await client.get(endpoints.clientes(), {
      params: searchValue.trim() ? { search: searchValue.trim() } : {},
    });
    setClientes(data);
    return data;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [relationRes] = await Promise.all([client.get(endpoints.rifaVendedores())]);
        setRelations(relationRes.data || []);
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
    const loadBoletas = async () => {
      if (!isSaleDialogOpen || !saleForm.relationId) {
        setAvailableBoletas([]);
        return;
      }

      try {
        const { data } = await client.get(endpoints.boletas(), {
          params: {
            rifaVendedorId: saleForm.relationId,
            estado: 'ASIGNADA',
          },
        });
        setAvailableBoletas(data || []);
      } catch (requestError) {
        setError((requestError as Error).message);
      }
    };

    void loadBoletas();
  }, [isSaleDialogOpen, saleForm.relationId]);

  const relationOptions = useMemo(
    () =>
      relations.map((item) => ({
        value: item.id,
        label: `${item.rifa?.nombre || 'Sin rifa'} - ${item.vendedor?.nombre || 'Sin vendedor'}`,
      })),
    [relations]
  );

  const relationSummary = useMemo(
    () => relations.find((item) => item.id === saleForm.relationId) || null,
    [relations, saleForm.relationId]
  );

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return clientes;
    }

    return clientes.filter((item) =>
      [item.nombre, item.documento, item.telefono, item.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [clientes, search]);

  const selectedBoletas = useMemo(
    () => availableBoletas.filter((item) => saleForm.selectedBoletaIds.includes(item.id)),
    [availableBoletas, saleForm.selectedBoletaIds]
  );

  const totalSelected = useMemo(
    () => selectedBoletas.reduce((sum, item) => sum + Number(item.precio || 0), 0),
    [selectedBoletas]
  );

  const openCreateClient = () => {
    setSelectedClient(null);
    setClientForm(initialClientForm);
    setIsClientDialogOpen(true);
    setError(null);
    setSuccess('');
  };

  const openEditClient = (cliente: any) => {
    setSelectedClient(cliente);
    setClientForm({
      nombre: cliente.nombre || '',
      documento: cliente.documento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
    });
    setIsClientDialogOpen(true);
    setError(null);
    setSuccess('');
  };

  const openSaleDialog = (cliente: any) => {
    setSelectedClient(cliente);
    setSaleForm({
      relationId: relations.length === 1 ? relations[0].id : '',
      selectedBoletaIds: [],
    });
    setAvailableBoletas([]);
    setIsSaleDialogOpen(true);
    setError(null);
    setSuccess('');
  };

  const handleSaveClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      const payload = {
        nombre: clientForm.nombre,
        documento: clientForm.documento || null,
        telefono: clientForm.telefono || null,
        email: clientForm.email || null,
      };

      if (selectedClient?.id) {
        await client.put(endpoints.clienteById(selectedClient.id), payload);
      } else {
        await client.post(endpoints.clientes(), payload);
      }

      await loadClientes(search);
      setIsClientDialogOpen(false);
      setSelectedClient(null);
      setClientForm(initialClientForm);
      setSuccess(selectedClient?.id ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBoletas = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient?.id) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      await client.post(endpoints.clienteVentas(selectedClient.id), {
        rifaVendedorId: saleForm.relationId,
        boletaIds: saleForm.selectedBoletaIds,
      });

      await loadClientes(search);
      setIsSaleDialogOpen(false);
      setSaleForm({ relationId: '', selectedBoletaIds: [] });
      setSelectedClient(null);
      setSuccess('Boletas asignadas al cliente correctamente.');
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'nombre',
      header: 'CLIENTE',
      render: (row: any) => (
        <div>
          <p className="font-semibold text-slate-900">{row.nombre}</p>
          <p className="text-xs text-slate-500">{row.documento || 'Sin documento'}</p>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'CONTACTO',
      render: (row: any) => (
        <div>
          <p>{row.telefono || 'Sin telefono'}</p>
          <p className="text-xs text-slate-500">{row.email || 'Sin email'}</p>
        </div>
      ),
    },
    {
      key: 'ventas',
      header: 'VENTAS',
      render: (row: any) => (row.ventas || []).length,
    },
    {
      key: 'boletas',
      header: 'BOLETAS',
      render: (row: any) => (row.boletas || []).length,
    },
    {
      key: 'saldo',
      header: 'SALDO',
      render: (row: any) =>
        formatCOP(
          (row.ventas || []).reduce(
            (sum: number, item: any) => sum + Number(item.saldoPendiente || 0),
            0
          )
        ),
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: any) => (
        <div className="flex gap-3">
          <button type="button" className="font-semibold text-slate-700 underline" onClick={() => openEditClient(row)}>
            Editar
          </button>
          <button type="button" className="font-semibold text-slate-900 underline" onClick={() => openSaleDialog(row)}>
            Asignar boletas
          </button>
          {(row.ventas || []).some((item: any) => Number(item.saldoPendiente || 0) > 0) ? (
            <Link className="font-semibold text-emerald-700 underline" to="/mis-pagos">
              Cobrar
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar
        title="Mis clientes"
        actions={
          <button
            type="button"
            onClick={openCreateClient}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            NUEVO CLIENTE
          </button>
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {success ? <Toast message={success} /> : null}
        {loading ? <Loading label="Cargando clientes del vendedor..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Cartera de clientes
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Clientes creados por esta cuenta o vinculados a ventas de su alcance.
              </p>
              <div className="mt-6 max-w-xl">
                <label className="block text-sm">
                  <span className="text-slate-600">Buscar cliente</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Nombre, documento, telefono o email"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Mis clientes
              </h3>
              <div className="mt-6">
                {filteredClients.length ? (
                  <DataTable columns={columns} data={filteredClients} />
                ) : (
                  <EmptyState
                    title="Sin clientes"
                    description="Todavia no hay clientes registrados dentro del alcance del vendedor."
                  />
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {isClientDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={handleSaveClient} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-slate-900">
              {selectedClient ? 'Editar cliente' : 'Nuevo cliente'}
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Nombre</span>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={clientForm.nombre} onChange={(event) => setClientForm((current) => ({ ...current, nombre: event.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Documento</span>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={clientForm.documento} onChange={(event) => setClientForm((current) => ({ ...current, documento: event.target.value }))} />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Telefono</span>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={clientForm.telefono} onChange={(event) => setClientForm((current) => ({ ...current, telefono: event.target.value }))} />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Email</span>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={clientForm.email} onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm" onClick={() => setIsClientDialogOpen(false)}>
                CANCELAR
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
                {saving ? 'GUARDANDO...' : 'GUARDAR CLIENTE'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isSaleDialogOpen && selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={handleAssignBoletas} className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-slate-900">Asignar boletas a {selectedClient.nombre}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta operacion crea una venta del cliente amarrada a la relacion rifa-vendedor.
            </p>

            <div className="mt-6 max-w-xl">
              <span className="text-sm text-slate-600">Relacion rifa-vendedor</span>
              <div className="mt-1">
                <SearchableSelect
                  options={relationOptions}
                  value={saleForm.relationId}
                  onChange={(value) => setSaleForm({ relationId: value, selectedBoletaIds: [] })}
                  placeholder="Selecciona una relacion"
                />
              </div>
            </div>

            {relationSummary ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">RIFA</p>
                  <p className="theme-fit-value mt-2 font-semibold">{relationSummary.rifa?.nombre}</p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">VENDEDOR</p>
                  <p className="theme-fit-value mt-2 font-semibold">{relationSummary.vendedor?.nombre}</p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">BOLETAS DISPONIBLES</p>
                  <p className="theme-fit-value mt-2 font-semibold">{availableBoletas.length}</p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">TOTAL SELECCIONADO</p>
                  <p className="theme-fit-value mt-2 font-semibold">{formatCOP(totalSelected)}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              {saleForm.relationId ? (
                availableBoletas.length ? (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    {availableBoletas.map((boleta) => {
                      const selected = saleForm.selectedBoletaIds.includes(boleta.id);
                      return (
                        <button
                          key={boleta.id}
                          type="button"
                          onClick={() =>
                            setSaleForm((current) => ({
                              ...current,
                              selectedBoletaIds: selected
                                ? current.selectedBoletaIds.filter((id) => id !== boleta.id)
                                : [...current.selectedBoletaIds, boleta.id],
                            }))
                          }
                          className={`rounded-lg border px-2 py-3 text-center text-sm transition ${
                            selected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="font-semibold">{boleta.numero}</div>
                          <div className="mt-1 text-[11px]">{formatCOP(boleta.precio)}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="Sin boletas disponibles"
                    description="Esta relacion no tiene boletas en estado ASIGNADA listas para vender."
                  />
                )
              ) : (
                <EmptyState
                  title="Selecciona una relacion"
                  description="Primero elige la relacion rifa-vendedor para cargar boletas disponibles."
                />
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm" onClick={() => setIsSaleDialogOpen(false)}>
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving || !saleForm.relationId || !saleForm.selectedBoletaIds.length}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {saving ? 'ASIGNANDO...' : 'CREAR VENTA'}
              </button>
            </div>

            {selectedClient.ventas?.length ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-base font-semibold text-slate-900">Historial del cliente</h4>
                <div className="mt-4 space-y-3">
                  {selectedClient.ventas.map((venta: any) => (
                    <div key={venta.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{venta.rifa?.nombre || 'Sin rifa'}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(venta.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatCOP(venta.total)}</p>
                          <p className="text-xs text-slate-500">Saldo {formatCOP(venta.saldoPendiente)}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        Boletas: {(venta.boletas || []).map((item: any) => item.numero).join(', ') || 'Sin boletas'}
                      </p>
                      {Number(venta.saldoPendiente || 0) > 0 ? (
                        <div className="mt-3">
                          <Link
                            to={`/mis-pagos?clienteId=${selectedClient.id}&ventaId=${venta.id}`}
                            className="text-sm font-semibold text-emerald-700 underline"
                          >
                            Registrar abono
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default VendedorClientsPage;
