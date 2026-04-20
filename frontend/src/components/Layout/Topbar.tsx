import type { ReactNode } from 'react';

import { useRifaContext } from '../../hooks/useRifaContext';

type TopbarProps = {
  title: string;
  actions?: ReactNode;
};

const Topbar = ({ title, actions }: TopbarProps) => {
  const { rifa, isRifaScope, loading } = useRifaContext();
  const rifaTitle = rifa?.nombre || (loading ? 'Cargando rifa...' : '');

  return (
    <header className="theme-topbar no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
      <div>
        {isRifaScope && rifaTitle ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
              Rifa
            </p>
            <h2 className="theme-main-title text-3xl font-semibold leading-tight">
              {rifaTitle}
            </h2>
            <p className="mt-1 text-sm opacity-80">{title}</p>
          </>
        ) : (
          <h2 className="theme-main-title text-xl font-semibold">{title}</h2>
        )}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
};

export default Topbar;
