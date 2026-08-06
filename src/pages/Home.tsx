import { Card, TextSubtext } from '../components/index';
import { permissionAuth } from '../contexts/permission';
import { useAuth } from '../contexts/auth';
import Dashboard from './Dashboard';

export default function Home() {
  // Dashboard operacional embutido na home (não é rota própria) — só
  // aparece pra quem tem a tag DASHBOARD (perfis Administrador e Developer,
  // este último via bypass de hasPermition). Ver Dashboard.tsx.
  //
  // "Alterar senha" saiu daqui e virou a tela própria de Perfil (ver
  // pages/Profile.tsx) — a home tava sobrecarregada agora que o dashboard
  // mora nela também. Quem não vê o dashboard ainda precisa de algo aqui,
  // por isso a saudação abaixo.
  const { hasPermition } = permissionAuth();
  const { user } = useAuth();
  const showDashboard = hasPermition('DASHBOARD');

  return (
    <>
      {!showDashboard && (
        <Card>
          <TextSubtext
            text={`Bem-vindo(a), ${user?.nome || ''}`}
            subtext="Use o menu ao lado para navegar pelas telas do sistema."
            color="violet"
            size="md"
            icon="pi pi-home"
            display="grid"
          />
        </Card>
      )}

      {showDashboard ? <Dashboard /> : null}
    </>
  );
}
