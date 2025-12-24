const Topbar = ({ title, actions }) => {
  return (
    <header className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-3">{actions}</div>
    </header>
  );
};

export default Topbar;
