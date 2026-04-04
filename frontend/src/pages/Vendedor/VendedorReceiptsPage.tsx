import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../../api/client';
import { endpoints } from '../../api/endpoints';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Loading from '../../components/common/Loading';
import SearchableSelect from '../../components/common/SearchableSelect';
import Topbar from '../../components/Layout/Topbar';
import { formatDateTime, todayISO } from '../../utils/dates';
import { formatCOP } from '../../utils/money';

type ClientReceiptRow = {
  id: string;
  clienteId: string;
  ventaId: string;
  relationId: string;
  fecha: string;
  consecutivo: number;
  codigoUnico: string;
  monto: number;
  metodoPago: string;
  estadoVenta: string;
  clienteNombre: string;
  rifaNombre: string;
  vendedorNombre: string;
  saldoPendiente: number;
};

const startOfMonthISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const VendedorReceiptsPage = () => {
  const [rows, setRows] = useState<ClientReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    relationId: '',
    dateFrom: startOfMonthISO(),
    dateTo: todayISO(),
    search: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await client.get(endpoints.clienteRecibos());
        setRows(
          (data || []).map((item: any) => ({
            id: item.id,
            clienteId: item.pagoCliente?.venta?.cliente?.id || '',
            ventaId: item.pagoCliente?.venta?.id || '',
            relationId: item.pagoCliente?.venta?.rifaVendedor?.id || '',
            fecha: item.fecha,
            consecutivo: item.consecutivo,
            codigoUnico: item.codigoUnico,
            monto: Number(item.pagoCliente?.monto || 0),
            metodoPago: item.pagoCliente?.metodoPago || 'SIN METODO',
            estadoVenta: item.pagoCliente?.venta?.estado || 'PENDIENTE',
            clienteNombre: item.pagoCliente?.venta?.cliente?.nombre || 'SIN CLIENTE',
            rifaNombre: item.pagoCliente?.venta?.rifa?.nombre || 'SIN RIFA',
            vendedorNombre:
              item.pagoCliente?.venta?.rifaVendedor?.vendedor?.nombre || 'SIN CANAL',
            saldoPendiente: Number(item.pagoCliente?.venta?.saldoPendiente || 0),
          }))
        );
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const relationOptions = useMemo(() => {
    const map = new Map<string, string>();

    rows.forEach((row) => {
      if (!row.relationId || map.has(row.relationId)) {
        return;
      }

      map.set(row.relationId, `${row.rifaNombre} - ${row.vendedorNombre}`);
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : 0;
    const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;

    return rows.filter((row) => {
      const rowTime = new Date(row.fecha).getTime();
      const matchesRelation = filters.relationId ? row.relationId === filters.relationId : true;
      const matchesDate = rowTime >= fromTime && rowTime <= toTime;
      const matchesSearch = normalizedSearch
        ? row.codigoUnico.toLowerCase().includes(normalizedSearch) ||
          String(row.consecutivo).includes(normalizedSearch) ||
          row.clienteNombre.toLowerCase().includes(normalizedSearch)
        : true;

      return matchesRelation && matchesDate && matchesSearch;
    });
  }, [filters, rows]);

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.total += 1;
        acc.valor += row.monto;
        if (row.estadoVenta === 'PAGADA') {
          acc.pagadas += 1;
        } else {
          acc.pendientes += 1;
        }
        return acc;
      },
      {
        total: 0,
        valor: 0,
        pagadas: 0,
        pendientes: 0,
      }
    );
  }, [filteredRows]);

  const columns = [
    {
      key: 'fecha',
      header: 'FECHA',
      render: (row: ClientReceiptRow) => formatDateTime(row.fecha),
    },
    {
      key: 'clienteNombre',
      header: 'CLIENTE',
    },
    {
      key: 'rifaNombre',
      header: 'RIFA',
    },
    {
      key: 'consecutivo',
      header: 'CONSECUTIVO',
      render: (row: ClientReceiptRow) => `CLI-${String(row.consecutivo).padStart(6, '0')}`,
    },
    {
      key: 'codigoUnico',
      header: 'CODIGO',
      render: (row: ClientReceiptRow) => (
        <span className="block max-w-[260px] break-all">{row.codigoUnico}</span>
      ),
    },
    {
      key: 'monto',
      header: 'VALOR',
      render: (row: ClientReceiptRow) => formatCOP(row.monto),
    },
    {
      key: 'saldoPendiente',
      header: 'SALDO',
      render: (row: ClientReceiptRow) => formatCOP(row.saldoPendiente),
    },
    {
      key: 'acciones',
      header: 'ACCIONES',
      render: (row: ClientReceiptRow) => (
        <div className="flex gap-3">
          <Link className="font-semibold text-slate-900 underline" to={`/cliente-recibos/${row.id}`}>
            VER RECIBO
          </Link>
          {row.saldoPendiente > 0 && row.clienteId && row.ventaId ? (
            <Link
              className="font-semibold text-emerald-700 underline"
              to={`/mis-pagos?clienteId=${row.clienteId}&ventaId=${row.ventaId}`}
            >
              OTRO ABONO
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Mis recibos" />
      <div className="space-y-6 px-6 py-6">
        <ErrorBanner message={error} />
        {loading ? <Loading label="Cargando recibos del vendedor..." /> : null}

        {!loading ? (
          <>
            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Filtros de recibos
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Consulta y reimprime recibos de pagos registrados a tus clientes.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <div>
                  <span className="text-sm text-slate-600">Relacion</span>
                  <div className="mt-1">
                    <SearchableSelect
                      options={relationOptions}
                      value={filters.relationId}
                      onChange={(value) => setFilters((current) => ({ ...current, relationId: value }))}
                      placeholder="Todas mis relaciones"
                      clearable
                      clearLabel="Quitar filtro"
                    />
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="text-slate-600">Desde</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.dateFrom}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, dateFrom: event.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Hasta</span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    value={filters.dateTo}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, dateTo: event.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">Buscar</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Cliente, codigo o consecutivo"
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, search: event.target.value }))
                    }
                  />
                </label>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">RECIBOS</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">{summary.total}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">VENTAS PAGADAS</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-700">{summary.pagadas}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">VENTAS PENDIENTES</p>
                <p className="mt-3 text-3xl font-semibold text-amber-700">{summary.pendientes}</p>
              </div>
              <div className="theme-summary-card rounded-2xl p-5 shadow-sm">
                <p className="theme-summary-label">VALOR TOTAL</p>
                <p className="theme-summary-value mt-3 text-3xl font-semibold">
                  {formatCOP(summary.valor)}
                </p>
              </div>
            </div>

            <section className="theme-section-card rounded-2xl p-6 shadow-sm">
              <h3 className="theme-main-title theme-content-title text-2xl font-semibold">
                Historial de recibos
              </h3>
              <p className="theme-content-subtitle mt-2 text-sm">
                Todos los recibos emitidos sobre pagos del cliente dentro de tu alcance.
              </p>

              <div className="mt-6">
                {filteredRows.length ? (
                  <DataTable columns={columns} data={filteredRows} />
                ) : (
                  <EmptyState
                    title="Sin recibos"
                    description="No hay recibos que coincidan con los filtros actuales."
                  />
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default VendedorReceiptsPage;
