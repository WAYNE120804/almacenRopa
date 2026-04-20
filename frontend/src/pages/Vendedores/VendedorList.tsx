import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { useAppConfig } from '../../context/AppConfigContext';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printBoletaSheet } from '../../utils/print';

const initialRelationForm = {
  modo: 'EXISTENTE',
  vendedorId: '',
  nombre: '',
  documento: '',
  telefono: '',
  direccion: '',
  comisionPct: '0',
};

const isPaginaWebVendedor = (nombre = '') => nombre.trim().toUpperCase() === 'PAGINA WEB';
const boletaEstadoOptions = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADA', label: 'Asignada' },
  { value: 'DEVUELTA', label: 'Devuelta' },
  { value: 'ANULADA', label: 'Anulada' },
];
const boletaStatusBadge = {
  DISPONIBLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ASIGNADA: 'border-sky-200 bg-sky-50 text-sky-700',
  RESERVADA: 'border-amber-200 bg-amber-50 text-amber-700',
  ABONANDO: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  VENDIDA: 'border-violet-200 bg-violet-50 text-violet-700',
  PAGADA: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DEVUELTA: 'border-orange-200 bg-orange-50 text-orange-700',
  ANULADA: 'border-rose-200 bg-rose-50 text-rose-700',
};

const VendedorList = () => {
  const { config } = useAppConfig();
  const location = useLocation();
  const { rifaId: routeRifaId } = useParams();
  const isAdminGlobalRoute = location.pathname.startsWith('/admin/vendedores');
  const [state, setState] = useState({
    vendedores: [],
    rifaVendedores: [],
    cierreVendedores: [],
    rifa: null,
    loading: true,
    saving: false,
    error: null,
    success: '',
    deleteId: null,
    relationDeleteId: null,
  });
  const [search, setSearch] = useState('');
  const [relationForm, setRelationForm] = useState(initialRelationForm);
  const [editingRelation, setEditingRelation] = useState(null);
  const [editCommission, setEditCommission] = useState('0');
  const [editingVendor, setEditingVendor] = useState(null);
  const [viewMode, setViewMode] = useState('LIBROS');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [bookBoletaModalOpen, setBookBoletaModalOpen] = useState(false);
  const [bookBoletaLoading, setBookBoletaLoading] = useState(false);
  const [bookBoletaSaving, setBookBoletaSaving] = useState(false);
  const [selectedBookBoleta, setSelectedBookBoleta] = useState(null);
  const [bookBoletaForm, setBookBoletaForm] = useState({
    estado: 'ASIGNADA',
    rifaVendedorId: '',
  });
  const bookTabsRef = useRef(new Map());
  const [vendorEditForm, setVendorEditForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
  });
  const requiresAutomaticAccess = !isPaginaWebVendedor(vendorEditForm.nombre);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const [vendedoresRes, relacionesRes, rifaRes, cierreRes] = await Promise.all([
          client.get(endpoints.vendedores()),
          routeRifaId ? client.get(endpoints.rifaVendedores()) : Promise.resolve({ data: [] }),
          routeRifaId ? client.get(endpoints.rifaById(routeRifaId)) : Promise.resolve({ data: null }),
          routeRifaId ? client.get(endpoints.rifaCierreVendedores(routeRifaId)) : Promise.resolve({ data: [] }),
        ]);
        setState((prev) => ({
          ...prev,
          vendedores: vendedoresRes.data,
          rifaVendedores: relacionesRes.data,
          cierreVendedores: cierreRes.data,
          rifa: rifaRes.data,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          vendedores: [],
          rifaVendedores: [],
          cierreVendedores: [],
          loading: false,
          error: error.message,
        }));
      }
    };

    fetchVendedores();
  }, [routeRifaId]);

  const handleDelete = async () => {
    if (!state.deleteId) {
      return;
    }

    try {
      await client.delete(endpoints.vendedorById(state.deleteId));
      setState((prev) => ({
        ...prev,
        vendedores: prev.vendedores.filter((vendedor) => vendedor.id !== state.deleteId),
        deleteId: null,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        deleteId: null,
        error: error.message,
      }));
    }
  };

  const refreshScopedData = async () => {
    const [vendedoresRes, relacionesRes, rifaRes, cierreRes] = await Promise.all([
      client.get(endpoints.vendedores()),
      routeRifaId ? client.get(endpoints.rifaVendedores()) : Promise.resolve({ data: [] }),
      routeRifaId ? client.get(endpoints.rifaById(routeRifaId)) : Promise.resolve({ data: null }),
      routeRifaId ? client.get(endpoints.rifaCierreVendedores(routeRifaId)) : Promise.resolve({ data: [] }),
    ]);

    setState((prev) => ({
      ...prev,
      vendedores: vendedoresRes.data,
      rifaVendedores: relacionesRes.data,
      cierreVendedores: cierreRes.data,
      rifa: rifaRes.data,
    }));
  };

  const handleRelationDelete = async () => {
    if (!state.relationDeleteId) {
      return;
    }

    try {
      await client.delete(endpoints.eliminarRifaVendedor(state.relationDeleteId));
      setState((prev) => ({
        ...prev,
        rifaVendedores: prev.rifaVendedores.filter((item) => item.id !== state.relationDeleteId),
        relationDeleteId: null,
        success: 'Vendedor quitado de esta rifa.',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        relationDeleteId: null,
        error: error.message,
        success: '',
      }));
    }
  };

  const vendedoresVinculadosIds = useMemo(
    () =>
      new Set(
        state.rifaVendedores
          .filter((item) => item.rifaId === routeRifaId)
          .map((item) => item.vendedorId)
      ),
    [routeRifaId, state.rifaVendedores]
  );

  const vendedorOptions = useMemo(
    () =>
      state.vendedores
        .filter((vendedor) => !vendedoresVinculadosIds.has(vendedor.id))
        .map((vendedor) => ({
          value: vendedor.id,
          label: `${vendedor.nombre}${vendedor.documento ? ` - ${vendedor.documento}` : ''}`,
        })),
    [state.vendedores, vendedoresVinculadosIds]
  );

  const precioCasaCalculado = useMemo(() => {
    const precioBoleta = Number(state.rifa?.precioBoleta || 0);
    const comision = Number(relationForm.comisionPct || 0);

    if (!precioBoleta || !Number.isFinite(comision)) {
      return 0;
    }

    return Math.max(0, Number((precioBoleta - (precioBoleta * comision) / 100).toFixed(2)));
  }, [relationForm.comisionPct, state.rifa?.precioBoleta]);

  const editRelationImpact = useMemo(() => {
    if (!editingRelation) {
      return null;
    }

    const precioBoleta = Number(state.rifa?.precioBoleta || editingRelation.rifa?.precioBoleta || 0);
    const previousPrecioCasa = Number(editingRelation.precioCasa || 0);
    const nextCommission = Number(editCommission || 0);
    const nextPrecioCasa = Math.max(
      0,
      Number((precioBoleta - (precioBoleta * nextCommission) / 100).toFixed(2))
    );
    const boletasActivas = Number(editingRelation._count?.boletas || 0);
    const totalAbonos = Number(editingRelation.totalAbonado || 0);
    const deudaAnterior = Number((boletasActivas * previousPrecioCasa - totalAbonos).toFixed(2));
    const deudaNueva = Number((boletasActivas * nextPrecioCasa - totalAbonos).toFixed(2));

    return {
      boletasActivas,
      totalAbonos,
      previousPrecioCasa,
      nextPrecioCasa,
      deudaAnterior,
      deudaNueva,
      diferencia: Number((deudaNueva - deudaAnterior).toFixed(2)),
    };
  }, [editCommission, editingRelation, state.rifa?.precioBoleta]);

  const handleCreateRelation = async (event) => {
    event.preventDefault();

    if (!routeRifaId) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: '' }));

      let vendedorId = relationForm.vendedorId;

      if (relationForm.modo === 'NUEVO') {
        const { data } = await client.post(endpoints.vendedores(), {
          nombre: relationForm.nombre.trim(),
          documento: relationForm.documento.trim() || null,
          telefono: relationForm.telefono.trim() || null,
          direccion: relationForm.direccion.trim() || null,
        });
        vendedorId = data.id;
      }

      if (!vendedorId) {
        throw new Error('Selecciona un vendedor o crea uno nuevo.');
      }

      await client.post(endpoints.crearRifaVendedor(), {
        rifaId: routeRifaId,
        vendedorId,
        comisionPct: Number(relationForm.comisionPct || 0),
      });

      await refreshScopedData();
      setRelationForm(initialRelationForm);
      setState((prev) => ({
        ...prev,
        saving: false,
        success: 'Vendedor vinculado a esta rifa.',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error.message,
        success: '',
      }));
    }
  };

  const openEditRelation = (row) => {
    setEditingRelation(row.rifaRelacion || null);
    setEditCommission(String(row.rifaRelacion?.comisionPct || 0));
    setState((prev) => ({ ...prev, error: null, success: '' }));
  };

  const handleUpdateRelation = async (event) => {
    event.preventDefault();

    if (!editingRelation?.id) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: '' }));
      await client.put(endpoints.actualizarRifaVendedor(editingRelation.id), {
        comisionPct: Number(editCommission || 0),
      });
      await refreshScopedData();
      setEditingRelation(null);
      setEditCommission('0');
      setState((prev) => ({
        ...prev,
        saving: false,
        success: 'Comision actualizada para esta rifa.',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error.message,
        success: '',
      }));
    }
  };

  const openEditVendor = (row) => {
    setEditingVendor(row);
    setVendorEditForm({
      nombre: row.nombre || '',
      documento: row.documento || '',
      telefono: row.telefono || '',
      direccion: row.direccion || '',
    });
    setState((prev) => ({ ...prev, error: null, success: '' }));
  };

  const handleUpdateVendor = async (event) => {
    event.preventDefault();

    if (!editingVendor?.id) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: null, success: '' }));
      await client.put(endpoints.vendedorById(editingVendor.id), {
        nombre: vendorEditForm.nombre.trim(),
        documento: vendorEditForm.documento.trim() || null,
        telefono: vendorEditForm.telefono.trim() || null,
        direccion: vendorEditForm.direccion.trim() || null,
      });
      await refreshScopedData();
      setEditingVendor(null);
      setState((prev) => ({
        ...prev,
        saving: false,
        success: 'Datos del vendedor actualizados.',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error.message,
        success: '',
      }));
    }
  };

  const vendedoresFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return routeRifaId
        ? state.rifaVendedores
            .filter((item) => item.rifaId === routeRifaId)
            .map((item) => ({
              ...item.vendedor,
              rifaRelacion: item,
              _count: item.vendedor?._count,
            }))
        : state.vendedores;
    }

    const baseVendedores = routeRifaId
      ? state.rifaVendedores
          .filter((item) => item.rifaId === routeRifaId)
          .map((item) => ({
            ...item.vendedor,
            rifaRelacion: item,
            _count: item.vendedor?._count,
          }))
      : state.vendedores;

    return baseVendedores.filter((vendedor) => {
      return [
        vendedor.nombre,
        vendedor.documento,
        vendedor.telefono,
        vendedor.direccion,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [routeRifaId, search, state.rifaVendedores, state.vendedores]);

  const cierreByRelationId = useMemo(
    () =>
      new Map(
        (state.cierreVendedores || []).map((item) => [item.rifaVendedorId, item])
      ),
    [state.cierreVendedores]
  );

  const vendedoresConResumen = useMemo(
    () =>
      vendedoresFiltrados.map((item) => ({
        ...item,
        cierre: item.rifaRelacion ? cierreByRelationId.get(item.rifaRelacion.id) || null : null,
      })),
    [cierreByRelationId, vendedoresFiltrados]
  );

  useEffect(() => {
    if (!routeRifaId || !vendedoresConResumen.length) {
      return;
    }

    const selectedStillExists = vendedoresConResumen.some(
      (item) => item.rifaRelacion?.id === selectedBookId
    );

    if (!selectedStillExists) {
      setSelectedBookId(vendedoresConResumen[0]?.rifaRelacion?.id || '');
    }
  }, [routeRifaId, selectedBookId, vendedoresConResumen]);

  useEffect(() => {
    if (!selectedBookId) {
      return;
    }

    const tabElement = bookTabsRef.current.get(selectedBookId);
    tabElement?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selectedBookId]);

  useEffect(() => {
    if (!routeRifaId || !search.trim() || !vendedoresConResumen.length) {
      return;
    }

    const term = search.trim().toLowerCase();
    const match = vendedoresConResumen.find((item) =>
      [item.nombre, item.documento, item.telefono, item.direccion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );

    if (match?.rifaRelacion?.id) {
      setSelectedBookId(match.rifaRelacion.id);
    }
  }, [routeRifaId, search, vendedoresConResumen]);

  const selectedBook = useMemo(
    () =>
      vendedoresConResumen.find((item) => item.rifaRelacion?.id === selectedBookId) || null,
    [selectedBookId, vendedoresConResumen]
  );

  const selectedBookResumen = selectedBook?.cierre || null;
  const activeRelationOptions = useMemo(
    () =>
      state.rifaVendedores
        .filter((item) => item.rifaId === routeRifaId)
        .map((item) => ({
          value: item.id,
          label: `${item.vendedor?.nombre || 'Sin vendedor'} (${item.comisionPct}%)`,
        })),
    [routeRifaId, state.rifaVendedores]
  );

  const selectedBookBoletaColumns = useMemo(() => {
    if (!selectedBookResumen?.boletas?.length) {
      return Array.from({ length: 10 }, (_, index) => ({ digit: String(index), items: [] }));
    }

    const grouped = new Map(Array.from({ length: 10 }, (_, index) => [String(index), []]));

    selectedBookResumen.boletas.forEach((boleta) => {
      const bucket = boleta.numero?.charAt(0) || '0';
      if (!grouped.has(bucket)) {
        grouped.set(bucket, []);
      }
      grouped.get(bucket).push(boleta);
    });

    return Array.from({ length: 10 }, (_, index) => ({
      digit: String(index),
      items: grouped.get(String(index)) || [],
    }));
  }, [selectedBookResumen]);

  const handlePrintVendorBook = () => {
    if (!selectedBook || !selectedBookResumen) {
      return;
    }

    printBoletaSheet({
      companyName: config.nombreCasaRifera,
      logoDataUrl: config.logoDataUrl,
      responsableNombre: config.responsableNombre,
      responsableTelefono: config.responsableTelefono,
      responsableDireccion: config.responsableDireccion,
      responsableCiudad: config.responsableCiudad,
      responsableDepartamento: config.responsableDepartamento,
      numeroResolucionAutorizacion: config.numeroResolucionAutorizacion,
      entidadAutoriza: config.entidadAutoriza,
      rifaNombre: state.rifa?.nombre || selectedBookResumen.rifa?.nombre || 'Sin rifa',
      vendedorNombre: selectedBook.nombre || 'Sin vendedor',
      vendedorTelefono: selectedBook.telefono || 'N/D',
      vendedorDireccion: selectedBook.direccion || 'N/D',
      comisionPct: selectedBook.rifaRelacion?.comisionPct || selectedBookResumen.comisionPct,
      precioCasa: selectedBook.rifaRelacion?.precioCasa || selectedBookResumen.precioCasa,
      boletas: (selectedBookResumen.boletas || []).map((item) => item.numero),
      assignmentSummary: (selectedBookResumen.asignaciones || []).map((item) => ({
        fecha: item.fecha,
        cantidad: item.cantidad,
      })),
    });
  };

  const openBookBoleta = async (boleta) => {
    try {
      setBookBoletaModalOpen(true);
      setBookBoletaLoading(true);
      setState((prev) => ({ ...prev, error: null, success: '' }));
      const { data } = await client.get(endpoints.boletaById(boleta.id));
      setSelectedBookBoleta(data);
      setBookBoletaForm({
        estado: data.estado || 'ASIGNADA',
        rifaVendedorId: data.rifaVendedor?.id || '',
      });
    } catch (error) {
      setBookBoletaModalOpen(false);
      setState((prev) => ({ ...prev, error: error.message, success: '' }));
    } finally {
      setBookBoletaLoading(false);
    }
  };

  const closeBookBoleta = () => {
    setBookBoletaModalOpen(false);
    setBookBoletaLoading(false);
    setBookBoletaSaving(false);
    setSelectedBookBoleta(null);
    setBookBoletaForm({
      estado: 'ASIGNADA',
      rifaVendedorId: '',
    });
  };

  const handleSaveBookBoleta = async (event) => {
    event.preventDefault();

    if (!selectedBookBoleta?.id) {
      return;
    }

    try {
      setBookBoletaSaving(true);
      const payload = {
        estado: bookBoletaForm.estado,
        rifaVendedorId:
          bookBoletaForm.estado === 'DISPONIBLE' ? null : bookBoletaForm.rifaVendedorId || null,
      };
      const { data } = await client.put(endpoints.boletaById(selectedBookBoleta.id), payload);
      setSelectedBookBoleta(data);
      setBookBoletaForm({
        estado: data.estado || 'ASIGNADA',
        rifaVendedorId: data.rifaVendedor?.id || '',
      });
      await refreshScopedData();
      setState((prev) => ({
        ...prev,
        success: `Boleta ${data.numero} actualizada desde el libro del vendedor.`,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message, success: '' }));
    } finally {
      setBookBoletaSaving(false);
    }
  };

  const renderBookBoletaCell = (boleta) => {
    const estado = boleta.estado || 'ASIGNADA';
    const statusColor =
      estado === 'PAGADA'
        ? 'bg-indigo-100 text-indigo-800'
        : estado === 'VENDIDA'
          ? 'bg-blue-100 text-blue-800'
          : estado === 'DEVUELTA'
            ? 'bg-orange-100 text-orange-800'
            : estado === 'DISPONIBLE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-800';

    return (
      <div
        key={boleta.id}
        className={`cursor-pointer rounded-sm border px-2 py-1 text-center text-xs font-medium transition hover:scale-[1.02] hover:border-slate-400 ${
          selectedBookBoleta?.id === boleta.id
            ? 'border-slate-900 ring-2 ring-slate-300'
            : 'border-slate-200'
        } ${statusColor}`}
        title={`${boleta.numero} - ${estado}`}
        onClick={() => void openBookBoleta(boleta)}
      >
        {boleta.numero}
      </div>
    );
  };

  const renderVendorBooks = () => {
    if (!vendedoresConResumen.length) {
      return (
        <EmptyState
          title="Sin vendedores para mostrar"
          description="Vincula un vendedor a esta rifa para abrir su libro."
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex min-w-max gap-2">
            {vendedoresConResumen.map((item) => {
              const active = item.rifaRelacion?.id === selectedBookId;
              return (
                <button
                  key={item.rifaRelacion?.id || item.id}
                  ref={(element) => {
                    if (item.rifaRelacion?.id && element) {
                      bookTabsRef.current.set(item.rifaRelacion.id, element);
                    }
                  }}
                  type="button"
                  className={`rounded-md border px-4 py-2 text-sm transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedBookId(item.rifaRelacion?.id || '')}
                >
                  {item.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {selectedBook ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{selectedBook.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Libro del vendedor dentro de {state.rifa?.nombre || 'esta rifa'}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  onClick={() => openEditVendor(selectedBook)}
                >
                  Editar datos
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  onClick={() => openEditRelation(selectedBook)}
                >
                  Editar comision
                </button>
                <button
                  type="button"
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
                  onClick={handlePrintVendorBook}
                >
                  Imprimir tabla
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Documento</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedBook.documento || 'Sin documento'}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Telefono</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedBook.telefono || 'Sin telefono'}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Direccion</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedBook.direccion || 'Sin direccion'}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Comision</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedBook.rifaRelacion?.comisionPct || 0}% ({formatCOP(selectedBook.rifaRelacion?.precioCasa || 0)})
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Total boletas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedBookResumen?.totalBoletas || 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Devolucion</p>
                <p className="mt-2 text-2xl font-semibold text-orange-700">
                  {selectedBookResumen?.devolucion || 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Boletas actuales</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {selectedBookResumen?.boletasActuales || 0}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Abonos</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">
                  {formatCOP(selectedBookResumen?.totalAbonos || 0)}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Deuda total</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {formatCOP(selectedBookResumen?.deudaTotal || 0)}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Deuda actual</p>
                <p className="mt-2 text-2xl font-semibold text-rose-700">
                  {formatCOP(selectedBookResumen?.deudaActual || 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
              <div className="min-w-[980px] bg-white">
                <div className="grid grid-cols-10 border-b border-slate-200 bg-cyan-800 text-center text-xs font-semibold uppercase tracking-[0.08em] text-white">
                  {selectedBookBoletaColumns.map((column) => (
                    <div key={column.digit} className="border-r border-cyan-900 px-2 py-2 last:border-r-0">
                      {column.digit}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-10">
                  {selectedBookBoletaColumns.map((column) => (
                    <div key={column.digit} className="min-h-64 border-r border-slate-200 p-2 last:border-r-0">
                      <div className="space-y-2">
                        {column.items.length ? column.items.map(renderBookBoletaCell) : <div className="h-6" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'documento', header: 'Documento' },
    { key: 'telefono', header: 'Telefono' },
    { key: 'direccion', header: 'Direccion' },
    {
      key: 'resumen',
      header: 'Resumen',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {routeRifaId
            ? `Comision ${row.rifaRelacion?.comisionPct || 0}% - Precio casa ${formatCOP(row.rifaRelacion?.precioCasa || 0)}`
            : `${row._count?.rifas || 0} rifas asociadas`}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          {!routeRifaId ? (
            <Link
              className="text-indigo-600"
              to={`${isAdminGlobalRoute ? '/admin' : ''}/vendedores/${row.id}`}
            >
              Detalle
            </Link>
          ) : null}
          {routeRifaId ? (
            <button
              type="button"
              className="text-indigo-600"
              onClick={() => openEditVendor(row)}
            >
              Editar datos
            </button>
          ) : null}
          {routeRifaId ? (
            <button
              type="button"
              className="text-slate-600"
              onClick={() => openEditRelation(row)}
            >
              Editar comision
            </button>
          ) : (
            <Link
              className="text-slate-600"
              to={`/admin/vendedores/${row.id}/editar`}
            >
              Editar
            </Link>
          )}
          <button
            type="button"
            className="text-rose-600"
            onClick={() =>
              setState((prev) =>
                routeRifaId
                  ? { ...prev, relationDeleteId: row.rifaRelacion?.id, error: null }
                  : { ...prev, deleteId: row.id, error: null }
              )
            }
          >
            {routeRifaId ? 'Quitar de rifa' : 'Eliminar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar
        title="Vendedores"
        actions={
          routeRifaId ? null : (
            <Link
              to={`${isAdminGlobalRoute ? '/admin' : ''}/vendedores/crear`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Crear vendedor
            </Link>
          )
        }
      />
      <div className="space-y-4 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}
        {state.loading && <Loading />}
        {!state.loading && routeRifaId ? (
          <form
            onSubmit={handleCreateRelation}
            className="theme-section-card rounded-lg p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="theme-main-title theme-content-title text-base font-semibold">
                  Vincular vendedor a esta rifa
                </h3>
                <p className="theme-content-subtitle text-sm">
                  Busca un vendedor global o crea uno rapido y define la comision para esta rifa.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
                <p className="text-slate-500">Precio boleta</p>
                <p className="font-semibold text-slate-900">
                  {formatCOP(state.rifa?.precioBoleta || 0)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-md border px-4 py-2 text-sm ${
                  relationForm.modo === 'EXISTENTE'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-700'
                }`}
                onClick={() =>
                  setRelationForm((prev) => ({ ...prev, modo: 'EXISTENTE', nombre: '', documento: '', telefono: '', direccion: '' }))
                }
              >
                Vendedor existente
              </button>
              <button
                type="button"
                className={`rounded-md border px-4 py-2 text-sm ${
                  relationForm.modo === 'NUEVO'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-700'
                }`}
                onClick={() => setRelationForm((prev) => ({ ...prev, modo: 'NUEVO', vendedorId: '' }))}
              >
                Crear rapido
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {relationForm.modo === 'EXISTENTE' ? (
                <div className="lg:col-span-2">
                  <span className="text-sm text-slate-600">Vendedor global</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={vendedorOptions}
                      value={relationForm.vendedorId}
                      onChange={(value) =>
                        setRelationForm((prev) => ({ ...prev, vendedorId: value }))
                      }
                      placeholder="Buscar vendedor..."
                      clearable
                      clearLabel="Quitar vendedor"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <label className="block text-sm">
                    <span className="text-slate-600">Nombre</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={relationForm.nombre}
                      onChange={(event) =>
                        setRelationForm((prev) => ({ ...prev, nombre: event.target.value }))
                      }
                      required={relationForm.modo === 'NUEVO'}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600">Documento</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={relationForm.documento}
                      onChange={(event) =>
                        setRelationForm((prev) => ({ ...prev, documento: event.target.value }))
                      }
                      required={relationForm.modo === 'NUEVO'}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600">Telefono</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={relationForm.telefono}
                      onChange={(event) =>
                        setRelationForm((prev) => ({ ...prev, telefono: event.target.value }))
                      }
                      required={relationForm.modo === 'NUEVO'}
                    />
                  </label>
                  <label className="block text-sm lg:col-span-2">
                    <span className="text-slate-600">Direccion</span>
                    <input
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={relationForm.direccion}
                      onChange={(event) =>
                        setRelationForm((prev) => ({ ...prev, direccion: event.target.value }))
                      }
                    />
                  </label>
                </>
              )}

              <label className="block text-sm">
                <span className="text-slate-600">Comision (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={relationForm.comisionPct}
                  onChange={(event) =>
                    setRelationForm((prev) => ({ ...prev, comisionPct: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="block text-sm">
                <span className="text-slate-600">Precio casa</span>
                <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">
                  {formatCOP(precioCasaCalculado)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={state.saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {state.saving ? 'Vinculando...' : 'Vincular a rifa'}
              </button>
            </div>
          </form>
        ) : null}
        {!state.loading && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="block text-sm">
                <span className="text-slate-600">Buscar vendedor</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre, documento, telefono o direccion"
                />
              </label>
              {routeRifaId ? (
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className={`rounded-md border px-4 py-2 text-sm ${
                      viewMode === 'LIBROS'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700'
                    }`}
                    onClick={() => setViewMode('LIBROS')}
                  >
                    Vista libros
                  </button>
                  <button
                    type="button"
                    className={`rounded-md border px-4 py-2 text-sm ${
                      viewMode === 'LISTA'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700'
                    }`}
                    onClick={() => setViewMode('LISTA')}
                  >
                    Vista simple
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
        {!state.loading && vendedoresFiltrados.length === 0 && (
          <EmptyState
            title={state.vendedores.length === 0 ? 'No hay vendedores' : 'Sin resultados'}
            description={
              routeRifaId
                ? 'Todavia no hay vendedores vinculados a esta rifa.'
                : state.vendedores.length === 0
                ? 'Registra tu primer vendedor para empezar.'
                : 'No hay vendedores que coincidan con la busqueda actual.'
            }
          />
        )}
        {!state.loading && vendedoresFiltrados.length > 0 && (
          routeRifaId && viewMode === 'LIBROS' ? (
            renderVendorBooks()
          ) : (
            <DataTable columns={columns} data={vendedoresConResumen} />
          )
        )}
      </div>
      <ConfirmDialog
        open={Boolean(state.deleteId)}
        title="Eliminar vendedor"
        description="Esta accion eliminara el vendedor solo si no tiene rifas ni movimientos asociados."
        onCancel={() => setState((prev) => ({ ...prev, deleteId: null }))}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={Boolean(state.relationDeleteId)}
        title="Quitar vendedor de la rifa"
        description="Esta accion solo se permite si la relacion no tiene boletas, asignaciones, devoluciones o abonos asociados."
        onCancel={() => setState((prev) => ({ ...prev, relationDeleteId: null }))}
        onConfirm={handleRelationDelete}
      />
      {editingRelation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={handleUpdateRelation}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Editar comision
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editingRelation.vendedor?.nombre || 'Vendedor'} en esta rifa.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={() => setEditingRelation(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block text-sm">
                <span className="text-slate-600">Comision (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={editCommission}
                  onChange={(event) => setEditCommission(event.target.value)}
                  required
                />
              </label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">Precio casa actualizado</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCOP(editRelationImpact?.nextPrecioCasa || 0)}
                </p>
              </div>
              {editRelationImpact ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-800">
                  <p className="font-semibold text-amber-900">Alerta de recalculo</p>
                  <p className="mt-2">
                    Este cambio actualizara la deuda del vendedor en esta rifa usando la nueva
                    comision y las boletas activas actuales.
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p>Boletas activas: <strong>{editRelationImpact.boletasActivas}</strong></p>
                    <p>Abonos confirmados: <strong>{formatCOP(editRelationImpact.totalAbonos)}</strong></p>
                    <p>Precio casa actual: <strong>{formatCOP(editRelationImpact.previousPrecioCasa)}</strong></p>
                    <p>Precio casa nuevo: <strong>{formatCOP(editRelationImpact.nextPrecioCasa)}</strong></p>
                    <p>Deuda actual: <strong>{formatCOP(editRelationImpact.deudaAnterior)}</strong></p>
                    <p>Deuda nueva: <strong>{formatCOP(editRelationImpact.deudaNueva)}</strong></p>
                  </div>
                  <p className="mt-3">
                    Ajuste en deuda:{' '}
                    <strong
                      className={
                        editRelationImpact.diferencia > 0
                          ? 'text-rose-700'
                          : editRelationImpact.diferencia < 0
                            ? 'text-emerald-700'
                            : 'text-slate-900'
                      }
                    >
                      {editRelationImpact.diferencia >= 0 ? '+' : ''}
                      {formatCOP(editRelationImpact.diferencia)}
                    </strong>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setEditingRelation(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={state.saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {state.saving ? 'Guardando...' : 'Guardar y recalcular deuda'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {editingVendor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={handleUpdateVendor}
            className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Editar datos del vendedor
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Actualiza la ficha del vendedor sin salir de esta rifa.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={() => setEditingVendor(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-600">Nombre</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={vendorEditForm.nombre}
                  onChange={(event) =>
                    setVendorEditForm((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Documento</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={vendorEditForm.documento}
                  onChange={(event) =>
                    setVendorEditForm((prev) => ({ ...prev, documento: event.target.value }))
                  }
                  required={requiresAutomaticAccess}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {requiresAutomaticAccess
                    ? 'Se usa como login del vendedor.'
                    : 'PAGINA WEB no crea usuario automatico.'}
                </p>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Telefono</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={vendorEditForm.telefono}
                  onChange={(event) =>
                    setVendorEditForm((prev) => ({ ...prev, telefono: event.target.value }))
                  }
                  required={requiresAutomaticAccess}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {requiresAutomaticAccess
                    ? 'Se usa como contrasena inicial del vendedor.'
                    : 'Si luego creas acceso manual, se define aparte.'}
                </p>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Direccion</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={vendorEditForm.direccion}
                  onChange={(event) =>
                    setVendorEditForm((prev) => ({ ...prev, direccion: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setEditingVendor(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={state.saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {state.saving ? 'Guardando...' : 'Guardar datos'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {bookBoletaModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedBookBoleta?.numero ? `Boleta ${selectedBookBoleta.numero}` : 'Detalle de boleta'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Edita la boleta desde el libro del vendedor sin salir de esta rifa.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={closeBookBoleta}
              >
                Cerrar
              </button>
            </div>

            {bookBoletaLoading ? (
              <div className="mt-6">
                <Loading />
              </div>
            ) : selectedBookBoleta ? (
              <form onSubmit={handleSaveBookBoleta} className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Estado</p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                          boletaStatusBadge[selectedBookBoleta.visualState || selectedBookBoleta.estado] ||
                          'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {selectedBookBoleta.visualState || selectedBookBoleta.estado}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Fecha entrega</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {selectedBookBoleta.fechaEntrega ? formatDate(selectedBookBoleta.fechaEntrega) : 'Sin entrega'}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Cliente</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {selectedBookBoleta.cliente?.nombre || 'Sin cliente'}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Saldo</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {formatCOP(selectedBookBoleta.venta?.saldoPendiente || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-slate-600">Estado</span>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                      value={bookBoletaForm.estado}
                      onChange={(event) =>
                        setBookBoletaForm((prev) => ({
                          ...prev,
                          estado: event.target.value,
                          rifaVendedorId:
                            event.target.value === 'DISPONIBLE' ? '' : prev.rifaVendedorId,
                        }))
                      }
                      disabled={!selectedBookBoleta.editable?.estado}
                    >
                      {boletaEstadoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div>
                    <span className="text-sm text-slate-600">Vendedor</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={activeRelationOptions}
                        value={bookBoletaForm.rifaVendedorId}
                        onChange={(value) =>
                          setBookBoletaForm((prev) => ({
                            ...prev,
                            rifaVendedorId: value,
                            estado: value ? (prev.estado === 'DISPONIBLE' ? 'ASIGNADA' : prev.estado) : 'DISPONIBLE',
                          }))
                        }
                        placeholder="Selecciona vendedor"
                        clearable
                        clearLabel="Quitar vendedor"
                        disabled={!selectedBookBoleta.editable?.vendedor}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {selectedBookBoleta.bloqueadaMotivo || 'La boleta puede editarse desde este libro.'}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                    onClick={closeBookBoleta}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bookBoletaSaving}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                  >
                    {bookBoletaSaving ? 'Guardando...' : 'Guardar boleta'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VendedorList;
