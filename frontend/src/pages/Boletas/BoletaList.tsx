import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Toast from '../../components/common/Toast';
import Topbar from '../../components/Layout/Topbar';
import { formatDate } from '../../utils/dates';
import { formatCOP } from '../../utils/money';
import { printBoletaSheet, printPublicBoletaFicha } from '../../utils/print';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';

const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADA', label: 'Asignada' },
  { value: 'RESERVADA', label: 'Reservada' },
  { value: 'ABONANDO', label: 'Abonando' },
  { value: 'VENDIDA', label: 'Vendida' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'DEVUELTA', label: 'Devuelta' },
  { value: 'ANULADA', label: 'Anulada' },
];

const statusClasses = {
  DISPONIBLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ASIGNADA: 'border-sky-200 bg-sky-50 text-sky-700',
  RESERVADA: 'border-amber-200 bg-amber-50 text-amber-700',
  ABONANDO: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  VENDIDA: 'border-violet-200 bg-violet-50 text-violet-700',
  PAGADA: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DEVUELTA: 'border-orange-200 bg-orange-50 text-orange-700',
  ANULADA: 'border-rose-200 bg-rose-50 text-rose-700',
};

const statusRowClasses = {
  DISPONIBLE: 'bg-emerald-100/80 hover:bg-emerald-100',
  ASIGNADA: 'bg-sky-100/80 hover:bg-sky-100',
  RESERVADA: 'bg-amber-100/80 hover:bg-amber-100',
  ABONANDO: 'bg-fuchsia-100/80 hover:bg-fuchsia-100',
  VENDIDA: 'bg-blue-100/80 hover:bg-blue-100',
  PAGADA: 'bg-indigo-100/80 hover:bg-indigo-100',
  DEVUELTA: 'bg-orange-100/80 hover:bg-orange-100',
  ANULADA: 'bg-rose-100/80 hover:bg-rose-100',
};

const editableEstadoOptions = estadoOptions.filter((option) =>
  ['DISPONIBLE', 'ASIGNADA', 'DEVUELTA', 'ANULADA'].includes(option.value)
);

const getInitialRifaId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('rifaId') || '';
};

const initialEditForm = {
  estado: 'DISPONIBLE',
  rifaVendedorId: '',
  juega: false,
};

const initialQuickClientForm = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
};

const BOLETAS_PAGE_SIZE = 200;

const BoletaList = () => {
  const { config } = useAppConfig();
  const { user } = useAuth();
  const location = useLocation();
  const { rifaId: routeRifaId } = useParams();
  const [state, setState] = useState({
    rifas: [],
    rifaVendedores: [],
    boletas: [],
    pagination: {
      page: 1,
      pageSize: BOLETAS_PAGE_SIZE,
      totalItems: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    clientes: [],
    loadingSetup: true,
    loadingBoletas: false,
    loadingClientes: false,
    error: null,
    success: '',
    editing: null,
    confirmRestoreReturned: false,
  });

  const [filters, setFilters] = useState({
    rifaId: routeRifaId || getInitialRifaId(),
    rifaVendedorId: '',
    estado: '',
    numero: '',
    vendedorNombre: '',
  });

  const [editForm, setEditForm] = useState(initialEditForm);
  const isVendorView = user?.rol === 'VENDEDOR';
  const [selectedBoletaIds, setSelectedBoletaIds] = useState([]);
  const [assignClientDialogOpen, setAssignClientDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [quickClientForm, setQuickClientForm] = useState(initialQuickClientForm);
  const [assigningClient, setAssigningClient] = useState(false);
  const [detailBoleta, setDetailBoleta] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [releasingClient, setReleasingClient] = useState(false);
  const [sharingPublicLink, setSharingPublicLink] = useState(false);
  const [printingPublicFicha, setPrintingPublicFicha] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const [page, setPage] = useState(1);
  const [debouncedNumero, setDebouncedNumero] = useState(filters.numero);
  const [debouncedVendedorNombre, setDebouncedVendedorNombre] = useState(filters.vendedorNombre);
  const boletasPageCache = useRef(new Map());

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      rifaId: routeRifaId || new URLSearchParams(location.search).get('rifaId') || prev.rifaId,
    }));
  }, [location.search, routeRifaId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedNumero(filters.numero);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters.numero]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedVendedorNombre(filters.vendedorNombre);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters.vendedorNombre]);

  useEffect(() => {
    setPage(1);
  }, [filters.rifaId, filters.rifaVendedorId, filters.estado, debouncedNumero, debouncedVendedorNombre]);

  useEffect(() => {
    boletasPageCache.current.clear();
  }, [filters.rifaId, filters.rifaVendedorId, filters.estado, debouncedNumero, debouncedVendedorNombre]);

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const [rifasRes, relacionesRes] = await Promise.all([
          client.get(endpoints.rifas()),
          client.get(endpoints.rifaVendedores()),
        ]);

        setState((prev) => ({
          ...prev,
          rifas: rifasRes.data,
          rifaVendedores: relacionesRes.data,
          loadingSetup: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loadingSetup: false,
          error: error.message,
        }));
      }
    };

    loadSetup();
  }, []);

  useEffect(() => {
    const loadClientes = async () => {
      if (!isVendorView) {
        return;
      }

      try {
        setState((prev) => ({ ...prev, loadingClientes: true }));
        const { data } = await client.get(endpoints.clientes());
        setState((prev) => ({
          ...prev,
          clientes: data,
          loadingClientes: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loadingClientes: false,
          error: error.message,
        }));
      }
    };

    void loadClientes();
  }, [isVendorView]);

  useEffect(() => {
    if (!isVendorView || state.loadingSetup) {
      return;
    }

    const ownRelations = state.rifaVendedores || [];

    if (ownRelations.length === 1) {
      const [onlyRelation] = ownRelations;
      setFilters((prev) => ({
        ...prev,
        rifaId: prev.rifaId || onlyRelation.rifaId || '',
        rifaVendedorId: onlyRelation.id,
      }));
    }
  }, [isVendorView, state.loadingSetup, state.rifaVendedores]);

  useEffect(() => {
    if (!filters.rifaId) {
      setState((prev) => ({
        ...prev,
        boletas: [],
        loadingBoletas: false,
        pagination: {
          page: 1,
          pageSize: BOLETAS_PAGE_SIZE,
          totalItems: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      }));
      return;
    }

    const devolucionPorVendedor =
      filters.estado === 'DEVUELTA' && filters.rifaVendedorId && !debouncedVendedorNombre
        ? state.rifaVendedores.find((item) => item.id === filters.rifaVendedorId)?.vendedor?.nombre || ''
        : '';

    const cacheKey = JSON.stringify({
      rifaId: filters.rifaId,
      rifaVendedorId: filters.estado === 'DEVUELTA' ? '' : filters.rifaVendedorId || '',
      estado: filters.estado || '',
      numero: debouncedNumero || '',
      vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || '',
      page,
      pageSize: BOLETAS_PAGE_SIZE,
    });

    const fetchBoletasPage = async (targetPage, { allowCache = true, prefetch = false } = {}) => {
      const targetKey = JSON.stringify({
        rifaId: filters.rifaId,
        rifaVendedorId: filters.estado === 'DEVUELTA' ? '' : filters.rifaVendedorId || '',
        estado: filters.estado || '',
        numero: debouncedNumero || '',
        vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || '',
        page: targetPage,
        pageSize: BOLETAS_PAGE_SIZE,
      });

      if (allowCache && boletasPageCache.current.has(targetKey)) {
        return boletasPageCache.current.get(targetKey);
      }

      const { data } = await client.get(endpoints.boletas(), {
        params: {
          rifaId: filters.rifaId,
          rifaVendedorId:
            filters.estado === 'DEVUELTA'
              ? undefined
              : filters.rifaVendedorId || undefined,
          estado: filters.estado || undefined,
          numero: debouncedNumero || undefined,
          vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || undefined,
          page: targetPage,
          pageSize: BOLETAS_PAGE_SIZE,
        },
      });

      boletasPageCache.current.set(targetKey, data);

      if (!prefetch && data.pagination?.hasNext) {
        const nextPage = data.pagination.page + 1;
        const nextKey = JSON.stringify({
          rifaId: filters.rifaId,
          rifaVendedorId: filters.estado === 'DEVUELTA' ? '' : filters.rifaVendedorId || '',
          estado: filters.estado || '',
          numero: debouncedNumero || '',
          vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || '',
          page: nextPage,
          pageSize: BOLETAS_PAGE_SIZE,
        });

        if (!boletasPageCache.current.has(nextKey)) {
          void fetchBoletasPage(nextPage, { allowCache: true, prefetch: true }).catch(() => {});
        }
      }

      return data;
    };

    const loadBoletas = async () => {
      try {
        setState((prev) => ({ ...prev, loadingBoletas: true, error: null }));
        const data = await fetchBoletasPage(page);

        setState((prev) => ({
          ...prev,
          boletas: data.items || [],
          pagination: data.pagination || prev.pagination,
          loadingBoletas: false,
        }));
        setPage(data.pagination?.page || 1);
        setSelectedBoletaIds((prev) =>
          prev.filter((id) => (data.items || []).some((item) => item.id === id))
        );
      } catch (error) {
        setState((prev) => ({
          ...prev,
          boletas: [],
          pagination: {
            page: 1,
            pageSize: BOLETAS_PAGE_SIZE,
            totalItems: 0,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
          loadingBoletas: false,
          error: error.message,
        }));
      }
    };

    loadBoletas();
  }, [filters.rifaId, filters.rifaVendedorId, filters.estado, debouncedNumero, debouncedVendedorNombre, state.rifaVendedores, page]);

  useEffect(() => {
    if (state.editing) {
      setEditForm({
        estado: state.editing.estado,
        rifaVendedorId: state.editing.rifaVendedor?.id || '',
        juega: Boolean(state.editing.juega),
      });
    }
  }, [state.editing]);

  const rifaOptions = useMemo(
    () =>
      state.rifas.map((rifa) => ({
        value: rifa.id,
        label: `${rifa.nombre} (${rifa.numeroCifras} cifras)`,
      })),
    [state.rifas]
  );

  const relationOptions = useMemo(() => {
    return state.rifaVendedores
      .filter((item) => (filters.rifaId ? item.rifaId === filters.rifaId : true))
      .map((item) => ({
        value: item.id,
        label: `${item.vendedor?.nombre || 'Sin vendedor'} (${item.comisionPct}%)`,
      }));
  }, [state.rifaVendedores, filters.rifaId]);

  const selectedRifa = useMemo(
    () => state.rifas.find((item) => item.id === filters.rifaId) || null,
    [state.rifas, filters.rifaId]
  );

  const selectedRelation = useMemo(
    () =>
      state.rifaVendedores.find((item) => item.id === filters.rifaVendedorId) || null,
    [state.rifaVendedores, filters.rifaVendedorId]
  );

  const selectedBoletas = useMemo(
    () => state.boletas.filter((item) => selectedBoletaIds.includes(item.id)),
    [state.boletas, selectedBoletaIds]
  );

  const assignableSelectedBoletas = useMemo(
    () => selectedBoletas.filter((item) => item.estado === 'ASIGNADA' && item.rifaVendedor?.id),
    [selectedBoletas]
  );

  const selectedBoletasRelation = useMemo(() => {
    if (!assignableSelectedBoletas.length) {
      return null;
    }

    const relationId = assignableSelectedBoletas[0].rifaVendedor?.id;
    if (!relationId) {
      return null;
    }

    const allSameRelation = assignableSelectedBoletas.every(
      (item) => item.rifaVendedor?.id === relationId
    );

    if (!allSameRelation) {
      return null;
    }

    return state.rifaVendedores.find((item) => item.id === relationId) || null;
  }, [assignableSelectedBoletas, state.rifaVendedores]);

  const clientOptions = useMemo(
    () =>
      (state.clientes || []).map((item) => ({
        value: item.id,
        label: `${item.nombre}${item.documento ? ` - ${item.documento}` : ''}`,
      })),
    [state.clientes]
  );

  const resumen = useMemo(() => {
    return state.boletas.reduce(
      (acc, boleta) => {
        const visualState =
          boleta.estado === 'PAGADA'
            ? 'PAGADA'
            : boleta.venta?.estado === 'ABONANDO' ||
                (boleta.estado === 'VENDIDA' && Number(boleta.venta?.saldoPendiente || 0) > 0)
              ? 'ABONANDO'
              : boleta.estado;
        acc.total += 1;
        acc[visualState] = (acc[visualState] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        DISPONIBLE: 0,
        ASIGNADA: 0,
        RESERVADA: 0,
        ABONANDO: 0,
        VENDIDA: 0,
        PAGADA: 0,
        DEVUELTA: 0,
        ANULADA: 0,
      }
    );
  }, [state.boletas]);

  const openEdit = (boleta) => {
    setState((prev) => ({
      ...prev,
      editing: boleta,
      success: '',
      error: null,
    }));
    void loadBoletaDetail(boleta.id);
  };

  const closeEdit = () => {
    setState((prev) => ({
      ...prev,
      editing: null,
    }));
    setEditForm(initialEditForm);
    setDetailBoleta(null);
  };

  const getBoletaVisualState = (boleta) => {
    if (boleta.estado === 'PAGADA') {
      return 'PAGADA';
    }

    if (
      boleta.venta?.estado === 'ABONANDO' ||
      (boleta.estado === 'VENDIDA' && Number(boleta.venta?.saldoPendiente || 0) > 0)
    ) {
      return 'ABONANDO';
    }

    return boleta.estado;
  };

  const buildLocalEditState = (boleta) => {
    const hasClientOwnership = Boolean(boleta.cliente?.id || boleta.clienteId || boleta.venta?.id || boleta.ventaId);
    const visualState = getBoletaVisualState(boleta);
    const isLockedState = ['RESERVADA', 'ABONANDO', 'VENDIDA', 'PAGADA'].includes(visualState);
    const canEditAdministrativeFields = !hasClientOwnership && !isLockedState;

    return {
      visualState,
      editable: {
        estado: canEditAdministrativeFields,
        vendedor: canEditAdministrativeFields,
        juega: !hasClientOwnership && visualState !== 'PAGADA',
      },
      bloqueadaMotivo: canEditAdministrativeFields
        ? null
        : hasClientOwnership
          ? 'La boleta ya tiene cliente o venta asociada.'
          : `La boleta esta en estado ${visualState}.`,
    };
  };

  const buildOptimisticBoleta = (boleta, payload) => {
    const nextEstado = payload.estado ?? boleta.estado;
    const nextRifaVendedorId =
      nextEstado === 'DISPONIBLE' || nextEstado === 'DEVUELTA'
        ? null
        : payload.rifaVendedorId ?? boleta.rifaVendedor?.id ?? null;
    const nextRelation = nextRifaVendedorId
      ? state.rifaVendedores.find((item) => item.id === nextRifaVendedorId) || null
      : null;
    const nextBoleta = {
      ...boleta,
      estado: nextEstado,
      juega: Boolean(payload.juega ?? boleta.juega),
      rifaVendedorId: nextRifaVendedorId,
      rifaVendedor: nextRelation,
      devueltaPorVendedorNombre:
        nextEstado === 'DEVUELTA'
          ? boleta.rifaVendedor?.vendedor?.nombre || boleta.devueltaPorVendedorNombre || null
          : null,
      devueltaObservacion:
        nextEstado === 'DEVUELTA'
          ? boleta.devueltaObservacion || 'Boleta devuelta'
          : null,
    };
    const editState = buildLocalEditState(nextBoleta);

    return {
      ...nextBoleta,
      visualState: editState.visualState,
      editable: editState.editable,
      bloqueadaMotivo: editState.bloqueadaMotivo,
    };
  };

  const boletaMatchesCurrentFilters = (boleta) => {
    if (filters.rifaId && boleta.rifa?.id !== filters.rifaId && boleta.rifaId !== filters.rifaId) {
      return false;
    }

    if (filters.rifaVendedorId && filters.estado !== 'DEVUELTA') {
      if ((boleta.rifaVendedor?.id || boleta.rifaVendedorId || '') !== filters.rifaVendedorId) {
        return false;
      }
    }

    if (filters.estado) {
      const visualState = boleta.visualState || getBoletaVisualState(boleta);

      if (filters.estado === 'ABONANDO') {
        if (visualState !== 'ABONANDO') {
          return false;
        }
      } else if (boleta.estado !== filters.estado) {
        return false;
      }
    }

    if (debouncedNumero) {
      const normalizedNumero = debouncedNumero.trim();

      if (normalizedNumero) {
        const matchesNumero =
          filters.rifaId && normalizedNumero.length >= 2
            ? String(boleta.numero).startsWith(normalizedNumero)
            : String(boleta.numero).includes(normalizedNumero);

        if (!matchesNumero) {
          return false;
        }
      }
    }

    if (debouncedVendedorNombre) {
      const searchTerm = debouncedVendedorNombre.trim().toLowerCase();
      const vendedorTexto = [
        boleta.rifaVendedor?.vendedor?.nombre,
        boleta.devueltaPorVendedorNombre,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!vendedorTexto.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  };

  const applyBoletaToCurrentPage = (updatedBoleta, fallbackBoleta) => {
    setState((prev) => {
      const previousBoleta =
        prev.boletas.find((item) => item.id === updatedBoleta.id) || fallbackBoleta;
      const previousWasVisible = previousBoleta ? boletaMatchesCurrentFilters(previousBoleta) : false;
      const nextIsVisible = boletaMatchesCurrentFilters(updatedBoleta);
      let totalItems = prev.pagination.totalItems;

      if (previousWasVisible && !nextIsVisible) {
        totalItems = Math.max(0, totalItems - 1);
      } else if (!previousWasVisible && nextIsVisible) {
        totalItems += 1;
      }

      const boletas = nextIsVisible
        ? prev.boletas.map((item) => (item.id === updatedBoleta.id ? updatedBoleta : item))
        : prev.boletas.filter((item) => item.id !== updatedBoleta.id);

      return {
        ...prev,
        boletas,
        pagination: {
          ...prev.pagination,
          totalItems,
        },
      };
    });
  };

  const loadBoletaDetail = async (boletaId) => {
    try {
      setLoadingDetail(true);
      const { data } = await client.get(endpoints.boletaById(boletaId));
      setDetailBoleta(data);
      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDetail = async (boleta) => {
    setDetailOpen(true);
    await loadBoletaDetail(boleta.id);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailBoleta(null);
  };

  const toggleBoletaSelection = (boleta) => {
    if (boleta.estado !== 'ASIGNADA' || !boleta.rifaVendedor?.id) {
      return;
    }

    setSelectedBoletaIds((current) =>
      current.includes(boleta.id)
        ? current.filter((id) => id !== boleta.id)
        : [...current, boleta.id]
    );
  };

  const closeAssignClientDialog = () => {
    setAssignClientDialogOpen(false);
    setSelectedClientId('');
    setQuickClientForm(initialQuickClientForm);
  };

  const refreshBoletas = async () => {
    const devolucionPorVendedor =
      filters.estado === 'DEVUELTA' && filters.rifaVendedorId && !debouncedVendedorNombre
        ? state.rifaVendedores.find((item) => item.id === filters.rifaVendedorId)?.vendedor?.nombre || ''
        : '';
    const cacheKey = JSON.stringify({
      rifaId: filters.rifaId || '',
      rifaVendedorId: filters.estado === 'DEVUELTA' ? '' : filters.rifaVendedorId || '',
      estado: filters.estado || '',
      numero: debouncedNumero || '',
      vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || '',
      page,
      pageSize: BOLETAS_PAGE_SIZE,
    });
    boletasPageCache.current.delete(cacheKey);

    const { data } = await client.get(endpoints.boletas(), {
      params: {
        rifaId: filters.rifaId || undefined,
        rifaVendedorId:
          filters.estado === 'DEVUELTA'
            ? undefined
            : filters.rifaVendedorId || undefined,
        estado: filters.estado || undefined,
        numero: debouncedNumero || undefined,
        vendedorNombre: debouncedVendedorNombre || devolucionPorVendedor || undefined,
        page,
        pageSize: BOLETAS_PAGE_SIZE,
      },
    });

    const items = data.items || [];
    boletasPageCache.current.set(cacheKey, data);
    setState((prev) => ({
      ...prev,
      boletas: items,
      pagination: data.pagination || prev.pagination,
    }));
    setPage(data.pagination?.page || 1);
    return items;
  };

  const refreshClientes = async () => {
    const { data } = await client.get(endpoints.clientes());
    setState((prev) => ({ ...prev, clientes: data }));
    return data;
  };

  const createQuickClient = async () => {
    const payload = {
      nombre: quickClientForm.nombre.trim(),
      documento: quickClientForm.documento.trim() || null,
      telefono: quickClientForm.telefono.trim() || null,
      email: quickClientForm.email.trim() || null,
    };

    const { data } = await client.post(endpoints.clientes(), payload);
    await refreshClientes();
    setSelectedClientId(data.id);
    setQuickClientForm(initialQuickClientForm);
    return data;
  };

  const handleAssignSelectedBoletasToClient = async () => {
    if (!selectedBoletasRelation?.id || !assignableSelectedBoletas.length) {
      setState((prev) => ({
        ...prev,
        error: 'Selecciona boletas asignadas de una misma relacion para venderlas al cliente.',
      }));
      return;
    }

    let clientId = selectedClientId;
    let selectedClient =
      state.clientes.find((item) => item.id === selectedClientId) || null;

    if (!clientId && quickClientForm.nombre.trim()) {
      selectedClient = await createQuickClient();
      clientId = selectedClient.id;
    }

    if (!clientId) {
      setState((prev) => ({
        ...prev,
        error: 'Selecciona un cliente existente o crea uno rapido antes de continuar.',
      }));
      return;
    }

    setAssigningClient(true);
    setState((prev) => ({ ...prev, error: null, success: '' }));

    try {
      await client.post(endpoints.clienteVentas(clientId), {
        rifaVendedorId: selectedBoletasRelation.id,
        boletaIds: assignableSelectedBoletas.map((item) => item.id),
      });

      setState((prev) => ({
        ...prev,
        success: `${assignableSelectedBoletas.length} boletas reservadas al cliente correctamente.`,
        boletas: prev.boletas
          .map((item) => {
            if (!assignableSelectedBoletas.some((selected) => selected.id === item.id)) {
              return item;
            }

            const nextBoleta = {
              ...item,
              estado: 'RESERVADA',
              clienteId: clientId,
              cliente: selectedClient
                ? {
                    id: selectedClient.id,
                    nombre: selectedClient.nombre,
                    documento: selectedClient.documento,
                    telefono: selectedClient.telefono,
                    email: selectedClient.email,
                  }
                : item.cliente,
              ventaId: `pending-${item.id}`,
              venta: {
                id: `pending-${item.id}`,
                estado: 'PENDIENTE',
                total: item.precio,
                saldoPendiente: item.precio,
                cliente: selectedClient
                  ? {
                      id: selectedClient.id,
                      nombre: selectedClient.nombre,
                      documento: selectedClient.documento,
                      telefono: selectedClient.telefono,
                    }
                  : null,
              },
              juega: false,
            };
            const editState = buildLocalEditState(nextBoleta);

            return {
              ...nextBoleta,
              visualState: editState.visualState,
              editable: editState.editable,
              bloqueadaMotivo: editState.bloqueadaMotivo,
            };
          })
          .filter((item) => boletaMatchesCurrentFilters(item)),
        pagination: {
          ...prev.pagination,
          totalItems:
            filters.estado === 'ASIGNADA'
              ? Math.max(0, prev.pagination.totalItems - assignableSelectedBoletas.length)
              : prev.pagination.totalItems,
        },
      }));
      setSelectedBoletaIds([]);
      closeAssignClientDialog();
      await refreshClientes();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setAssigningClient(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!state.editing) {
      return;
    }

    try {
      const payload = {
        estado: editForm.estado,
        rifaVendedorId:
          editForm.estado === 'DISPONIBLE' ? null : editForm.rifaVendedorId || null,
        juega: Boolean(editForm.juega),
      };

      const { data } = await client.put(
        endpoints.boletaById(state.editing.id),
        payload
      );

      setState((prev) => ({
        ...prev,
        boletas: prev.boletas.map((item) => (item.id === data.id ? data : item)),
        editing: null,
        success: `Boleta ${data.numero} actualizada correctamente.`,
        error: null,
      }));
      setEditForm(initialEditForm);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const handleInlineBoletaUpdate = async (boleta, changes, cellKey) => {
    if (!boleta?.id) {
      return;
    }

    const currentEstado = boleta.estado;
    const currentRifaVendedorId = boleta.rifaVendedor?.id || '';
    const nextEstado = changes.estado ?? currentEstado;
    const nextRifaVendedorId =
      Object.prototype.hasOwnProperty.call(changes, 'rifaVendedorId')
        ? changes.rifaVendedorId
        : currentRifaVendedorId;

    if (nextEstado === 'ASIGNADA' && !nextRifaVendedorId) {
      setState((prev) => ({
        ...prev,
        error: 'Para marcar una boleta como asignada debes escoger un vendedor.',
        success: '',
      }));
      return;
    }

    const payload = {
      estado: nextEstado,
      rifaVendedorId: nextEstado === 'DISPONIBLE' ? null : nextRifaVendedorId || null,
      juega: Boolean(changes.juega ?? boleta.juega),
    };

    try {
      setSavingCell(`${boleta.id}:${cellKey}`);
      const optimisticBoleta = buildOptimisticBoleta(boleta, payload);
      applyBoletaToCurrentPage(optimisticBoleta, boleta);
      const { data } = await client.put(endpoints.boletaById(boleta.id), payload);
      applyBoletaToCurrentPage(data, boleta);
      setState((prev) => ({
        ...prev,
        success: `Boleta ${data.numero} actualizada.`,
        error: null,
      }));
    } catch (error) {
      applyBoletaToCurrentPage(boleta, boleta);
      setState((prev) => ({
        ...prev,
        error: error.message,
        success: '',
      }));
    } finally {
      setSavingCell(null);
    }
  };

  const handleReleaseClient = async () => {
    const targetBoletaId = detailBoleta?.id || state.editing?.id;

    if (!targetBoletaId) {
      return;
    }

    try {
      setReleasingClient(true);
      const { data } = await client.post(endpoints.boletaLiberarCliente(targetBoletaId));
      setDetailBoleta(data);
      applyBoletaToCurrentPage(data, detailBoleta || state.editing);
      setState((prev) => ({
        ...prev,
        success: `La boleta ${data.numero} volvio a quedar asignada al vendedor y se libero del cliente.`,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setReleasingClient(false);
    }
  };

  const handleOpenPublicFicha = async (boleta) => {
    if (!boleta?.id) {
      return;
    }

    try {
      setSharingPublicLink(true);
      const { data } = await client.post(endpoints.boletaPublicLink(boleta.id));
      const publicUrl = `${window.location.origin}${data.path}`;
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSharingPublicLink(false);
    }
  };

  const handleCopyPublicFicha = async (boleta) => {
    if (!boleta?.id) {
      return;
    }

    try {
      setSharingPublicLink(true);
      const { data } = await client.post(endpoints.boletaPublicLink(boleta.id));
      const publicUrl = `${window.location.origin}${data.path}`;
      await navigator.clipboard.writeText(publicUrl);
      setState((prev) => ({
        ...prev,
        success: `Enlace publico de la boleta ${boleta.numero} copiado al portapapeles.`,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setSharingPublicLink(false);
    }
  };

  const handlePrintPublicFicha = async (boleta) => {
    if (!boleta?.id) {
      return;
    }

    try {
      setPrintingPublicFicha(true);
      const { data } = await client.post(endpoints.boletaPublicLink(boleta.id));
      const publicUrl = `${window.location.origin}${data.path}`;
      const boletaCompleta =
        detailBoleta?.id === boleta.id ? detailBoleta : await loadBoletaDetail(boleta.id);

      if (!boletaCompleta) {
        return;
      }

      const visualState = getBoletaVisualState(boletaCompleta);
      const total = Number(boletaCompleta.venta?.total || boletaCompleta.precio || 0);
      const saldoPendiente = Number(boletaCompleta.venta?.saldoPendiente || 0);
      const totalAbonado = Math.max(0, total - saldoPendiente);

      await printPublicBoletaFicha({
        companyName: config.nombreCasaRifera,
        logoDataUrl: config.logoDataUrl,
        supportText: config.publicSupportText,
        supportPhone: config.publicContactPhone || config.responsableTelefono,
        supportWhatsapp: config.publicContactWhatsapp,
        supportEmail: config.publicContactEmail,
        backgroundDataUrl: config.publicTicketBackgroundDataUrl,
        publicUrl,
        ficha: {
          numero: boletaCompleta.numero,
          estado: visualState,
          total,
          totalAbonado,
          saldoPendiente,
          juega: Boolean(boletaCompleta.juega),
          clienteNombre: boletaCompleta.cliente?.nombre || null,
          clienteDocumento: boletaCompleta.cliente?.documento || null,
          clienteTelefono: boletaCompleta.cliente?.telefono || null,
          vendedorNombre: boletaCompleta.rifaVendedor?.vendedor?.nombre || null,
          rifaNombre: boletaCompleta.rifa?.nombre || 'Sin rifa',
          boletasRelacionadas:
            (boletaCompleta.venta?.boletas || []).map((item) => item.numero) || [boletaCompleta.numero],
          historialPagos: (boletaCompleta.venta?.pagos || []).map((pago) => ({
            monto: pago.monto,
            fecha: pago.fecha,
            metodoPago: pago.metodoPago,
            descripcion: pago.descripcion || null,
          })),
        },
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    } finally {
      setPrintingPublicFicha(false);
    }
  };

  const handleCopyBoletas = async () => {
    if (!state.boletas.length) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas visibles para copiar con los filtros actuales.',
      }));
      return;
    }

    const content = state.boletas.map((boleta) => boleta.numero).join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setState((prev) => ({
        ...prev,
        success: `${state.boletas.length} boletas copiadas al portapapeles.`,
        error: null,
      }));
    } catch (_error) {
      setState((prev) => ({
        ...prev,
        error: 'No se pudieron copiar las boletas al portapapeles.',
      }));
    }
  };

  const handlePrintBoletas = async () => {
    if (!selectedRelation) {
      setState((prev) => ({
        ...prev,
        error: 'Para imprimir la planilla debes filtrar por un vendedor especifico.',
      }));
      return;
    }

    if (!state.boletas.length) {
      setState((prev) => ({
        ...prev,
        error: 'No hay boletas visibles para imprimir con los filtros actuales.',
      }));
      return;
    }

    try {
      const { data: assignmentHistory } = await client.get(
        endpoints.asignacionesHistory(selectedRelation.id)
      );

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
          rifaNombre: selectedRelation.rifa?.nombre || selectedRifa?.nombre || 'Sin rifa',
          vendedorNombre: selectedRelation.vendedor?.nombre || 'N/A',
          vendedorTelefono: selectedRelation.vendedor?.telefono || 'N/A',
          vendedorDireccion: selectedRelation.vendedor?.direccion || 'N/A',
          comisionPct: selectedRelation.comisionPct,
          precioCasa: selectedRelation.precioCasa,
          boletas: state.boletas.map((boleta) => boleta.numero),
          assignmentSummary: assignmentHistory.map((item) => ({
            fecha: item.fecha,
            cantidad: item.cantidad,
          })),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo abrir la impresion de boletas.',
      }));
    }
  };

  const handleRestoreReturnedBoletas = async () => {
    try {
      await Promise.all(
        state.boletas.map((boleta) =>
          client.put(endpoints.boletaById(boleta.id), {
            estado: 'DISPONIBLE',
            rifaVendedorId: null,
          })
        )
      );

      setState((prev) => ({
        ...prev,
        confirmRestoreReturned: false,
        success: `${state.boletas.length} boletas volvieron a estar disponibles.`,
        error: null,
      }));

      setFilters((prev) => ({
        ...prev,
        estado: '',
        rifaVendedorId: '',
        vendedorNombre: '',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        confirmRestoreReturned: false,
        error: error instanceof Error ? error.message : 'No se pudieron reactivar las boletas.',
      }));
    }
  };

  const renderBoletaHistory = (boleta) => {
    if (!boleta) {
      return null;
    }

    const visualState = getBoletaVisualState(boleta);
    const isFullyPaid = visualState === 'PAGADA';
    const canReleaseFromClient =
      Boolean(boleta.cliente?.id && boleta.venta?.id) && !isFullyPaid;
    const canSharePublicFicha = Boolean(boleta.cliente?.id || boleta.venta?.id);

    return (
      <div className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">ESTADO</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{visualState}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">CLIENTE</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {boleta.cliente?.nombre || 'SIN CLIENTE'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">TOTAL VENTA</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatCOP(boleta.venta?.total || boleta.precio || 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">SALDO</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatCOP(boleta.venta?.saldoPendiente || 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">HOJA DE VIDA</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Rifa:</span> {boleta.rifa?.nombre}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Vendedor:</span>{' '}
                {boleta.rifaVendedor?.vendedor?.nombre || 'SIN VENDEDOR'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Documento cliente:</span>{' '}
                {boleta.cliente?.documento || 'SIN DOCUMENTO'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Telefono cliente:</span>{' '}
                {boleta.cliente?.telefono || 'SIN TELEFONO'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Boletas de la venta:</span>{' '}
                {(boleta.venta?.boletas || []).map((item) => item.numero).join(', ') || boleta.numero}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">ABONOS / PAGOS</p>
            <div className="mt-3 space-y-3">
              {boleta.venta?.pagos?.length ? (
                boleta.venta.pagos.map((pago) => (
                  <div key={pago.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{formatCOP(pago.monto)}</span>
                      <span className="text-slate-500">{new Date(pago.fecha).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="mt-1 text-slate-700">
                      {pago.metodoPago} · {pago.usuario?.nombre || 'SISTEMA'}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {pago.descripcion || 'SIN DESCRIPCION'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Todavia no tiene abonos registrados.</p>
              )}
            </div>
          </div>
        </div>

        {canReleaseFromClient || canSharePublicFicha ? (
          <div className="flex flex-wrap justify-end gap-3">
            {canSharePublicFicha ? (
              <>
                <button
                  type="button"
                  disabled={sharingPublicLink}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  onClick={() => void handleOpenPublicFicha(boleta)}
                >
                  {sharingPublicLink ? 'ABRIENDO...' : 'ABRIR FICHA PUBLICA'}
                </button>
                <button
                  type="button"
                  disabled={sharingPublicLink}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  onClick={() => void handleCopyPublicFicha(boleta)}
                >
                  {sharingPublicLink ? 'COPIANDO...' : 'COPIAR ENLACE'}
                </button>
                <button
                  type="button"
                  disabled={printingPublicFicha}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  onClick={() => void handlePrintPublicFicha(boleta)}
                >
                  {printingPublicFicha ? 'PREPARANDO PDF...' : 'DESCARGAR FICHA PDF'}
                </button>
              </>
            ) : null}
            {canReleaseFromClient ? (
            <button
              type="button"
              disabled={releasingClient}
              className="rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 disabled:opacity-60"
              onClick={() => void handleReleaseClient()}
            >
              {releasingClient ? 'DEVOLVIENDO...' : 'QUITAR DEL CLIENTE / DEVOLVER'}
            </button>
            ) : null}
          </div>
        ) : isFullyPaid ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Esta boleta ya esta pagada completamente. No se puede quitar ni devolver desde aqui.
          </div>
        ) : null}
      </div>
    );
  };

  const renderAdminExcelBoletas = () => {
    if (state.loadingBoletas) {
      return <Loading />;
    }

    if (!state.boletas.length) {
      return (
        <EmptyState
          title="Sin boletas para mostrar"
          description="Ajusta los filtros para encontrar la boleta o el grupo de boletas que necesitas."
        />
      );
    }

    return (
      <div className="overflow-x-auto rounded-md border border-slate-300 bg-white">
        <table className="min-w-[1120px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-cyan-800 text-left text-xs font-semibold uppercase tracking-[0.08em] text-white">
              <th className="w-32 border border-cyan-900 px-3 py-2">Numero</th>
              <th className="w-72 border border-cyan-900 px-3 py-2">Vendedor</th>
              <th className="w-48 border border-cyan-900 px-3 py-2">Estado</th>
              <th className="w-44 border border-cyan-900 px-3 py-2">Fecha entrega</th>
              <th className="w-56 border border-cyan-900 px-3 py-2">Cliente</th>
              <th className="w-40 border border-cyan-900 px-3 py-2">Saldo</th>
              <th className="w-64 border border-cyan-900 px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {state.boletas.map((boleta) => {
              const visualState = boleta.visualState || getBoletaVisualState(boleta);
              const rowClass = statusRowClasses[visualState] || 'bg-white hover:bg-slate-50';
              const canEditEstado = Boolean(boleta.editable?.estado);
              const canEditVendedor = Boolean(boleta.editable?.vendedor);
              const savingEstado = savingCell === `${boleta.id}:estado`;
              const savingVendedor = savingCell === `${boleta.id}:vendedor`;
              const vendedorLabel =
                boleta.rifaVendedor?.vendedor?.nombre ||
                boleta.devueltaPorVendedorNombre ||
                'Sin vendedor';

              return (
                <tr key={boleta.id} className={`${rowClass} align-middle`}>
                  <td className="border border-slate-300 px-3 py-2 font-semibold tabular-nums text-slate-950">
                    <button
                      type="button"
                      className="cursor-pointer font-semibold text-slate-950 underline-offset-2 transition hover:text-cyan-800 hover:underline"
                      onClick={() => void openDetail(boleta)}
                      title={`Ver detalle de la boleta ${boleta.numero}`}
                    >
                      {boleta.numero}
                    </button>
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {canEditVendedor ? (
                      <div className="min-w-64">
                        <SearchableSelect
                          options={relationOptions}
                          value={boleta.rifaVendedor?.id || ''}
                          onChange={(value) =>
                            handleInlineBoletaUpdate(
                              boleta,
                              {
                                rifaVendedorId: value || null,
                                estado: value ? (boleta.estado === 'DISPONIBLE' ? 'ASIGNADA' : boleta.estado) : 'DISPONIBLE',
                              },
                              'vendedor'
                            )
                          }
                          placeholder="Buscar vendedor..."
                          clearable
                          clearLabel="Quitar vendedor"
                        />
                        {savingVendedor ? <p className="mt-1 text-xs text-slate-500">Guardando...</p> : null}
                      </div>
                    ) : (
                      <span title={boleta.bloqueadaMotivo || ''}>{vendedorLabel}</span>
                    )}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    {canEditEstado ? (
                      <div>
                        <select
                          className="w-full rounded-sm border border-slate-300 bg-white px-2 py-2 text-sm"
                          value={boleta.estado}
                          onChange={(event) =>
                            handleInlineBoletaUpdate(
                              boleta,
                              {
                                estado: event.target.value,
                                rifaVendedorId:
                                  event.target.value === 'DISPONIBLE'
                                    ? null
                                    : boleta.rifaVendedor?.id || '',
                              },
                              'estado'
                            )
                          }
                        >
                          {editableEstadoOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {savingEstado ? <p className="mt-1 text-xs text-slate-500">Guardando...</p> : null}
                      </div>
                    ) : (
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                          statusClasses[visualState] || 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                        title={boleta.bloqueadaMotivo || ''}
                      >
                        {visualState}
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-800">
                    {boleta.fechaEntrega ? formatDate(boleta.fechaEntrega) : 'Sin entrega'}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-800">
                    {boleta.cliente?.nombre || 'Sin cliente'}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-800">
                    {boleta.venta?.saldoPendiente ? formatCOP(boleta.venta.saldoPendiente) : '-'}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <span>{boleta.bloqueadaMotivo || 'Editable'}</span>
                      <button
                        type="button"
                        className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-cyan-800"
                        onClick={() => void openDetail(boleta)}
                        title={`Ver detalle de la boleta ${boleta.numero}`}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <Topbar
        title={isVendorView ? 'Mis boletas' : 'Boletas'}
        actions={
          filters.rifaId ? (
            <Link
              to={`/rifas/${filters.rifaId}`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Ver rifa
            </Link>
          ) : null
        }
      />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={state.error} />
        {state.success ? <Toast message={state.success} /> : null}
        {state.loadingSetup ? <Loading /> : null}

        {!state.loadingSetup && (
          <>
            <div className="theme-section-card rounded-lg p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="theme-main-title theme-content-title text-base font-semibold">
                    Filtros de boletas
                  </h3>
                  <p className="theme-content-subtitle text-sm">
                    Filtra por estado, vendedor o numero dentro de la rifa seleccionada.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-slate-600"
                  onClick={() =>
                    setFilters({
                      rifaId: routeRifaId || '',
                      rifaVendedorId: '',
                      estado: '',
                      numero: '',
                      vendedorNombre: '',
                    })
                  }
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                {!routeRifaId ? (
                  <div>
                    <span className="text-sm text-slate-600">Rifa</span>
                    <div className="mt-1">
                      <SearchableSelect
                        options={rifaOptions}
                        value={filters.rifaId}
                        onChange={(value) =>
                          setFilters({
                            rifaId: value,
                            rifaVendedorId: '',
                            estado: '',
                            numero: '',
                            vendedorNombre: '',
                          })
                        }
                        placeholder="Buscar rifa..."
                        clearable
                        clearLabel="Quitar filtro de rifa"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <span className="text-sm text-slate-600">
                    {isVendorView ? 'Mi relacion' : 'Vendedor asignado'}
                  </span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={relationOptions}
                      value={filters.rifaVendedorId}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, rifaVendedorId: value }))
                      }
                      placeholder={isVendorView ? 'Todas mis relaciones' : 'Todos los vendedores'}
                      clearable={!isVendorView || relationOptions.length > 1}
                      clearLabel={
                        isVendorView
                          ? 'Quitar filtro de mi relacion'
                          : 'Quitar filtro de vendedor'
                      }
                    />
                  </div>
                </div>

                <label className="text-sm">
                  <span className="text-slate-600">Estado</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.estado}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, estado: event.target.value }))
                    }
                  >
                    {estadoOptions.map((option) => (
                      <option key={option.value || 'ALL'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {!filters.rifaId ? (
              <div className="theme-section-card rounded-lg p-6 shadow-sm">
                <EmptyState
                  title="Selecciona una rifa"
                  description="La vista de boletas trabaja por rifa para que la busqueda y la asignacion sean mas claras."
                />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Rifa</p>
                    <p className="theme-summary-value mt-2 text-base font-semibold">
                      {selectedRifa?.nombre || 'N/D'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Precio: {selectedRifa ? formatCOP(selectedRifa.precioBoleta) : 'N/D'}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Total visible</p>
                    <p className="theme-summary-value mt-2 text-2xl font-semibold">
                      {resumen.total}
                    </p>
                    <p className="text-sm text-slate-500">
                      Pagina {state.pagination.page} de {state.pagination.totalPages}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Total encontrados</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {state.pagination.totalItems}
                    </p>
                    <p className="text-sm text-slate-500">200 por pagina</p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Disponibles</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-700">
                      {resumen.DISPONIBLE}
                    </p>
                  </div>
                  <div className="theme-summary-card rounded-lg p-5 shadow-sm">
                    <p className="theme-summary-label">Asignadas</p>
                    <p className="mt-2 text-2xl font-semibold text-sky-700">
                      {resumen.ASIGNADA}
                    </p>
                  </div>
                </div>

                <div className="theme-section-card rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="theme-main-title theme-content-title text-base font-semibold">
                        Numeros de la rifa
                      </h3>
                      <p className="theme-content-subtitle text-sm">
                        {isVendorView
                          ? 'Vista restringida a las boletas dentro de tu alcance. Haz clic sobre boletas asignadas para seleccionarlas y reservarlas a un cliente. Las boletas con cliente muestran su hoja de vida.'
                          : 'Edita vendedor y estado directamente en la tabla. Las boletas con cliente, reserva, abono o pago quedan bloqueadas.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isVendorView ? (
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            if (!assignableSelectedBoletas.length) {
                              setState((prev) => ({
                                ...prev,
                                error: 'Selecciona una o varias boletas asignadas para venderlas a un cliente.',
                              }));
                              return;
                            }

                            if (!selectedBoletasRelation?.id) {
                              setState((prev) => ({
                                ...prev,
                                error: 'Las boletas seleccionadas deben pertenecer a una misma relacion.',
                              }));
                              return;
                            }

                            setAssignClientDialogOpen(true);
                          }}
                          disabled={state.loadingBoletas || !selectedBoletaIds.length}
                        >
                          Asignar a cliente
                        </button>
                      ) : null}
                      {!isVendorView && filters.estado === 'DEVUELTA' && state.boletas.length > 0 ? (
                        <button
                          type="button"
                          className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              confirmRestoreReturned: true,
                              error: null,
                              success: '',
                            }))
                          }
                        >
                          Hacer disponibles
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleCopyBoletas}
                        disabled={state.loadingBoletas || state.boletas.length === 0}
                      >
                        Copiar boletas
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handlePrintBoletas}
                        disabled={
                          state.loadingBoletas ||
                          state.boletas.length === 0 ||
                          !filters.rifaVendedorId
                        }
                      >
                        Imprimir planilla
                      </button>
                      {state.loadingBoletas ? (
                        <span className="text-sm text-slate-500">Cargando boletas...</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="theme-content-title font-medium">Buscar numero</span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={filters.numero}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, numero: event.target.value }))
                        }
                        placeholder={
                          selectedRifa
                            ? `Ej: ${'0'.repeat(selectedRifa.numeroCifras)}`
                            : 'Selecciona una rifa'
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="theme-content-title font-medium">
                        {isVendorView ? 'Buscar devolucion propia' : 'Buscar vendedor o devolucion'}
                      </span>
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        value={filters.vendedorNombre}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            vendedorNombre: event.target.value,
                          }))
                        }
                        placeholder={
                          isVendorView
                            ? 'Ej: tu nombre o devolucion propia'
                            : 'Ej: Sebastian o Jorge Perez'
                        }
                      />
                    </label>
                  </div>

                  <div className="mt-6">
                    {!isVendorView ? (
                      renderAdminExcelBoletas()
                    ) : state.loadingBoletas ? (
                      <Loading />
                    ) : state.boletas.length ? (
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                        {state.boletas.map((boleta) => (
                          <button
                            key={boleta.id}
                            type="button"
                            onClick={() => {
                              if (isVendorView) {
                                if (boleta.estado === 'ASIGNADA' && !boleta.cliente?.id && !boleta.venta?.id) {
                                  toggleBoletaSelection(boleta);
                                } else {
                                  void openDetail(boleta);
                                }
                              } else {
                                openEdit(boleta);
                              }
                            }}
                            className={`rounded-lg border px-2 py-3 text-center transition hover:scale-[1.02] ${
                              selectedBoletaIds.includes(boleta.id)
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : statusClasses[getBoletaVisualState(boleta)] || 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="text-base font-semibold">{boleta.numero}</div>
                            <div className="mt-1 text-[11px] uppercase tracking-wide">
                              {getBoletaVisualState(boleta)}
                            </div>
                            <div className="mt-1 truncate text-[11px] normal-case">
                              {boleta.cliente?.nombre ||
                                boleta.rifaVendedor?.vendedor?.nombre ||
                                boleta.devueltaPorVendedorNombre ||
                                'Sin asignar'}
                            </div>
                            <div className="mt-1 truncate text-[10px] normal-case opacity-80">
                              {boleta.venta?.saldoPendiente
                                ? `Saldo ${formatCOP(boleta.venta.saldoPendiente)}`
                                : boleta.estado === 'ASIGNADA'
                                  ? 'Sin cliente'
                                  : ' '}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Sin boletas para mostrar"
                        description="Ajusta los filtros para encontrar la boleta o el grupo de boletas que necesitas."
                      />
                    )}
                  </div>

                  {filters.rifaId && state.pagination.totalPages > 1 ? (
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <div className="text-slate-600">
                        Mostrando{' '}
                        <strong>
                          {state.pagination.totalItems === 0
                            ? 0
                            : (state.pagination.page - 1) * state.pagination.pageSize + 1}
                        </strong>{' '}
                        -{' '}
                        <strong>
                          {Math.min(
                            state.pagination.page * state.pagination.pageSize,
                            state.pagination.totalItems
                          )}
                        </strong>{' '}
                        de <strong>{state.pagination.totalItems}</strong> boletas
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                          disabled={state.loadingBoletas || !state.pagination.hasPrev}
                        >
                          Anterior
                        </button>
                        <span className="px-2 text-slate-700">
                          Pagina {state.pagination.page} de {state.pagination.totalPages}
                        </span>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                          onClick={() =>
                            setPage((current) =>
                              Math.min(state.pagination.totalPages, current + 1)
                            )
                          }
                          disabled={state.loadingBoletas || !state.pagination.hasNext}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!isVendorView && state.editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Editar boleta {state.editing.numero}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {state.editing.rifa?.nombre} - Precio {formatCOP(state.editing.precio)}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={closeEdit}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {detailBoleta ? renderBoletaHistory(detailBoleta) : null}
              <label className="text-sm">
                <span className="text-slate-600">Estado</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={editForm.estado}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      estado: event.target.value,
                      rifaVendedorId:
                        event.target.value === 'DISPONIBLE' ? '' : prev.rifaVendedorId,
                    }))
                  }
                >
                  {estadoOptions
                    .filter((option) => option.value)
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <div>
                <span className="text-sm text-slate-600">Asignar a vendedor</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={relationOptions}
                    value={editForm.rifaVendedorId}
                    onChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        rifaVendedorId: value,
                        estado: prev.estado === 'DISPONIBLE' ? 'ASIGNADA' : prev.estado,
                      }))
                    }
                    placeholder="Sin vendedor asignado"
                    disabled={Boolean(
                      detailBoleta?.cliente?.id ||
                        detailBoleta?.venta?.id ||
                        ['RESERVADA', 'ABONANDO', 'VENDIDA', 'PAGADA'].includes(
                          getBoletaVisualState(detailBoleta || state.editing)
                        )
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Si la boleta ya esta tomada por un cliente no se puede quitar del vendedor desde el panel administrativo. Solo las totalmente pagadas quedan bloqueadas para devolver al cliente.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={Boolean(editForm.juega)}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      juega: event.target.checked,
                    }))
                  }
                />
                <span>
                  Marcar manualmente para juego
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={closeEdit}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(state.confirmRestoreReturned)}
        title="Volver boletas a disponibles"
        description={`Estas boletas volveran a quedar disponibles para la rifa${filters.rifaVendedorId && selectedRelation?.vendedor?.nombre ? ` y dejaran de figurar como devolucion de ${selectedRelation.vendedor.nombre}` : ''}.`}
        onCancel={() =>
          setState((prev) => ({ ...prev, confirmRestoreReturned: false }))
        }
        onConfirm={handleRestoreReturnedBoletas}
      />

      {isVendorView && assignClientDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-slate-900">Asignar boletas a cliente</h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta operacion reserva las boletas al cliente desde tu panel. Luego los abonos y el pago total iran moviendo su estado.
            </p>

            {selectedBoletasRelation ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">RIFA</p>
                  <p className="theme-fit-value mt-2 font-semibold">
                    {selectedBoletasRelation.rifa?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">RELACION</p>
                  <p className="theme-fit-value mt-2 font-semibold">
                    {selectedBoletasRelation.vendedor?.nombre}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">BOLETAS</p>
                  <p className="theme-fit-value mt-2 font-semibold">
                    {assignableSelectedBoletas.length}
                  </p>
                </div>
                <div className="theme-summary-card rounded-2xl p-4">
                  <p className="theme-summary-label">TOTAL</p>
                  <p className="theme-fit-value mt-2 font-semibold">
                    {formatCOP(
                      assignableSelectedBoletas.reduce(
                        (sum, item) => sum + Number(item.precio || 0),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <span className="text-sm text-slate-600">Cliente existente</span>
                <div className="mt-1">
                  <SearchableSelect
                    options={clientOptions}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder={state.loadingClientes ? 'Cargando clientes...' : 'Selecciona un cliente'}
                    clearable
                    clearLabel="Quitar cliente seleccionado"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Boletas seleccionadas
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  {assignableSelectedBoletas.map((item) => item.numero).join(', ') || 'Sin boletas'}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-base font-semibold text-slate-900">O crear cliente rapido</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-slate-600">Nombre</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={quickClientForm.nombre}
                    onChange={(event) =>
                      setQuickClientForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Documento</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={quickClientForm.documento}
                    onChange={(event) =>
                      setQuickClientForm((current) => ({ ...current, documento: event.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Telefono</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={quickClientForm.telefono}
                    onChange={(event) =>
                      setQuickClientForm((current) => ({ ...current, telefono: event.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Email</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={quickClientForm.email}
                    onChange={(event) =>
                      setQuickClientForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                onClick={closeAssignClientDialog}
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={assigningClient}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                onClick={() => void handleAssignSelectedBoletasToClient()}
              >
                {assigningClient ? 'RESERVANDO...' : 'RESERVAR BOLETAS'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Boleta {detailBoleta?.numero || ''}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Hoja de vida de la boleta con cliente, saldo y abonos registrados.
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500"
                onClick={closeDetail}
              >
                Cerrar
              </button>
            </div>

            {loadingDetail ? <div className="mt-6"><Loading /></div> : null}
            {!loadingDetail && detailBoleta ? renderBoletaHistory(detailBoleta) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BoletaList;
