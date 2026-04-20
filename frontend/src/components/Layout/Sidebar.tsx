import { NavLink } from 'react-router-dom';
import { useAppConfig } from '../../context/AppConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useRifaContext } from '../../hooks/useRifaContext';

const adminNavItems = [
  { to: '/admin/rifas', label: 'Rifas' },
  { to: '/admin/vendedores', label: 'Vendedores globales' },
  { to: '/admin/usuarios', label: 'Usuarios', adminOnly: true },
  { to: '/admin/configuracion', label: 'Configuracion', adminOnly: true },
  { to: '/admin/configuracion-web', label: 'Configuracion pagina web', adminOnly: true },
];

const getRifaNavItems = (rifaId: string) => [
  { to: `/rifas/${rifaId}`, label: 'Rifa', end: true },
  { to: `/rifas/${rifaId}/boletas`, label: 'Boletas' },
  { to: `/rifas/${rifaId}/juego`, label: 'Juego' },
  { to: `/rifas/${rifaId}/vendedores`, label: 'Vendedores' },
  { to: `/rifas/${rifaId}/asignaciones`, label: 'Asignaciones' },
  { to: `/rifas/${rifaId}/devoluciones`, label: 'Devoluciones' },
  { to: `/rifas/${rifaId}/abonos`, label: 'Abonos' },
  { to: `/rifas/${rifaId}/gastos`, label: 'Gastos', adminOnly: true },
  { to: `/rifas/${rifaId}/caja`, label: 'Caja', adminOnly: true },
];

const vendedorNavItems = [
  { to: '/', label: 'Inicio' },
  { to: '/boletas', label: 'Mis boletas' },
  { to: '/mis-clientes', label: 'Mis clientes' },
  { to: '/mis-pagos', label: 'Mis pagos' },
  { to: '/abonos', label: 'Mi cuenta' },
  { to: '/mis-recibos', label: 'Mis recibos' },
  { to: '/mis-informes', label: 'Mis informes' },
];

const Sidebar = () => {
  const { config } = useAppConfig();
  const { user, logout } = useAuth();
  const { rifaId, rifa, isRifaScope } = useRifaContext();
  const specialScopeName =
    user?.rol === 'VENDEDOR'
      ? user.scopes.items?.find((item) => {
          const name = item.vendedorNombre?.toUpperCase() || '';
          return name === 'PAGINA WEB' || name.includes('BOT');
        })?.vendedorNombre || null
      : null;
  const visibleNavItems =
    user?.rol === 'VENDEDOR'
      ? [
          ...vendedorNavItems,
          ...(specialScopeName ? [{ to: '/supervision-canal', label: 'Supervision canal' }] : []),
        ]
      : (isRifaScope && rifaId ? getRifaNavItems(rifaId) : adminNavItems).filter(
          (item) => !item.adminOnly || user?.rol === 'ADMIN'
        );

  return (
    <aside className="theme-sidebar flex h-screen w-60 flex-col border-r border-slate-200 p-6">
      <div className="flex items-center gap-3">
        {config.logoDataUrl ? (
          <img
            src={config.logoDataUrl}
            alt={config.nombreCasaRifera}
            className="h-12 w-12 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {config.nombreCasaRifera.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="theme-main-title text-lg font-semibold text-slate-800">
            {config.nombreCasaRifera}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.rol === 'VENDEDOR'
              ? specialScopeName
                ? `Panel ${specialScopeName.toLowerCase()}`
                : 'Panel vendedor'
              : isRifaScope
                ? rifa?.nombre || 'Panel de rifa'
                : 'Panel administrativo'}
          </p>
        </div>
      </div>
      <nav className="mt-6 flex flex-col gap-2 text-sm">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `theme-nav-label rounded-md px-3 py-2 transition-colors ${
                isActive ? 'theme-sidebar-link-active' : 'theme-sidebar-link'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
          <p className="font-semibold uppercase tracking-[0.08em] text-slate-500">Sesion</p>
          <p className="mt-2 font-semibold text-slate-900">{user?.nombre || 'Usuario'}</p>
          <p className="mt-1 break-all">{user?.email || ''}</p>
          <p className="mt-1 uppercase tracking-[0.08em] text-slate-500">{user?.rol || ''}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="theme-nav-label w-full rounded-md border border-slate-300 px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
