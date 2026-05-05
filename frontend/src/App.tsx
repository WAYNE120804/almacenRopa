import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import CajaDiariaPage from './pages/Caja/CajaDiariaPage';
import CajaGeneralPage from './pages/Caja/CajaGeneralPage';
import CategoriasPage from './pages/Categorias/CategoriasPage';
import ClientesPage from './pages/Clientes/ClientesPage';
import ConfiguracionPage from './pages/Configuracion/ConfiguracionPage';
import CreditoPagoTicketPage from './pages/Creditos/CreditoPagoTicketPage';
import CreditoTicketPage from './pages/Creditos/CreditoTicketPage';
import CreditosPage from './pages/Creditos/CreditosPage';
import FondosPage from './pages/Fondos/FondosPage';
import GastoTicketPage from './pages/Gastos/GastoTicketPage';
import GastosPage from './pages/Gastos/GastosPage';
import InformesPage from './pages/Informes/InformesPage';
import ProductoLabelsPage from './pages/Productos/ProductoLabelsPage';
import ProductosPage from './pages/Productos/ProductosPage';
import SalidasPage from './pages/Salidas/SalidasPage';
import SeparadoTicketPage from './pages/Separados/SeparadoTicketPage';
import SeparadosPage from './pages/Separados/SeparadosPage';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import VentaTicketPage from './pages/Ventas/VentaTicketPage';
import VentasPage from './pages/Ventas/VentasPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/productos" replace />} />
                  <Route
                    path="/categorias"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CategoriasPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/productos"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ProductosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/productos/etiquetas"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ProductoLabelsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/ventas" element={<VentasPage />} />
                  <Route path="/ventas/:id/tirilla" element={<VentaTicketPage />} />
                  <Route path="/separados" element={<SeparadosPage />} />
                  <Route path="/separados/:id/tirilla" element={<SeparadoTicketPage />} />
                  <Route path="/creditos" element={<CreditosPage />} />
                  <Route path="/creditos/:id/tirilla" element={<CreditoTicketPage />} />
                  <Route path="/creditos/:id/pagos/:pagoId/tirilla" element={<CreditoPagoTicketPage />} />
                  <Route path="/salidas" element={<SalidasPage />} />
                  <Route
                    path="/caja"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                        <CajaDiariaPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caja-general"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                        <CajaGeneralPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fondos"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                        <FondosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gastos"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                        <GastosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gastos/:id/tirilla"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
                        <GastoTicketPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/informes"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <InformesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/usuarios"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <UsuariosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracion"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ConfiguracionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/productos" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
