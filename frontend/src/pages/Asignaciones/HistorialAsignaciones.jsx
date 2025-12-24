import EmptyState from '../../components/common/EmptyState';
import Topbar from '../../components/Layout/Topbar';

const HistorialAsignaciones = () => {
  return (
    <div>
      <Topbar title="Historial de asignaciones" />
      <div className="px-6 py-6">
        <EmptyState
          title="Endpoint faltante"
          description="El backend actual no expone un endpoint para listar asignaciones. Se recomienda un GET /asignaciones-boletas para habilitar esta pantalla."
        />
      </div>
    </div>
  );
};

export default HistorialAsignaciones;
