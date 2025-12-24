import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import RifaList from './pages/Rifas/RifaList';
import RifaForm from './pages/Rifas/RifaForm';
import RifaDetail from './pages/Rifas/RifaDetail';
import VendedorList from './pages/Vendedores/VendedorList';
import VendedorForm from './pages/Vendedores/VendedorForm';
import VendedorDetail from './pages/Vendedores/VendedorDetail';
import AsignarBoletas from './pages/Asignaciones/AsignarBoletas';
import HistorialAsignaciones from './pages/Asignaciones/HistorialAsignaciones';
import CrearAbono from './pages/Abonos/CrearAbono';
import HistorialAbonos from './pages/Abonos/HistorialAbonos';
import GastoList from './pages/Gastos/GastoList';
import GastoForm from './pages/Gastos/GastoForm';
import CajaDashboard from './pages/Caja/CajaDashboard';
import MovimientosCaja from './pages/Caja/MovimientosCaja';
import ReciboView from './pages/Recibos/ReciboView';

const App = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rifas" element={<RifaList />} />
          <Route path="/rifas/crear" element={<RifaForm />} />
          <Route path="/rifas/:id/editar" element={<RifaForm />} />
          <Route path="/rifas/:id" element={<RifaDetail />} />
          <Route path="/vendedores" element={<VendedorList />} />
          <Route path="/vendedores/crear" element={<VendedorForm />} />
          <Route path="/vendedores/:id/editar" element={<VendedorForm />} />
          <Route path="/vendedores/:id" element={<VendedorDetail />} />
          <Route path="/asignaciones" element={<AsignarBoletas />} />
          <Route path="/asignaciones/historial" element={<HistorialAsignaciones />} />
          <Route path="/abonos" element={<HistorialAbonos />} />
          <Route path="/abonos/crear" element={<CrearAbono />} />
          <Route path="/gastos" element={<GastoList />} />
          <Route path="/gastos/crear" element={<GastoForm />} />
          <Route path="/caja" element={<CajaDashboard />} />
          <Route path="/caja/movimientos" element={<MovimientosCaja />} />
          <Route path="/recibos/:id" element={<ReciboView />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
