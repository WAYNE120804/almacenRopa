import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/rifas', label: 'Rifas' },
  { to: '/vendedores', label: 'Vendedores' },
  { to: '/asignaciones', label: 'Asignaciones' },
  { to: '/abonos', label: 'Abonos' },
  { to: '/gastos', label: 'Gastos' },
  { to: '/caja', label: 'Caja' }
];

const Sidebar = () => {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-800">Rifas Admin</h1>
      <nav className="mt-6 flex flex-col gap-2 text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
