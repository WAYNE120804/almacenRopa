import Sidebar from './Sidebar';

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-50">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
