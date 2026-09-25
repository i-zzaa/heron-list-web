import { useNavigate } from 'react-router-dom';
import { permissionAuth } from '../contexts/permission';
import { useAuth } from '../contexts/auth';
import Dashboard from './Dashboard';
import './home.css';

// Atalhos para as telas mais usadas, cada um com a mesma tag do menu lateral
// (ver routes/OtherRoutes.tsx) — quem não enxerga a tela no menu também não
// vê o atalho.
const ATALHOS = [
  { rota: '/agenda', permissao: 'agenda', texto: 'Agenda', icone: 'pi pi-calendar', principal: true },
  { rota: '/cadastro', permissao: 'cadastro', texto: 'Pacientes', icone: 'pi pi-users' },
  { rota: '/fila', permissao: 'fila', texto: 'Fila', icone: 'pi pi-sort-amount-down' },
  { rota: '/financeiro', permissao: 'financeiro', texto: 'Financeiro', icone: 'pi pi-money-bill' },
];

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

export default function Home() {
  // Dashboard operacional embutido na home (não é rota própria) — só
  // aparece pra quem tem a tag DASHBOARD (perfis Administrador e Developer,
  // este último via bypass de hasPermition). Ver Dashboard.tsx.
  //
  // "Alterar senha" mora na tela de Perfil (ver pages/Profile.tsx).
  const { hasPermition } = permissionAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const showDashboard = !!hasPermition('DASHBOARD');

  const primeiroNome = (user?.nome || '').trim().split(' ')[0];
  const data = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // "quinta-feira, 24 de setembro de 2026" -> só a primeira letra maiúscula.
  const hoje = data.charAt(0).toUpperCase() + data.slice(1);
  const atalhos = ATALHOS.filter((a) => hasPermition(a.permissao));

  return (
    <div className="home-heron" data-testid="home-page">
      <header className="home-topo">
        <div>
          <span className="home-data">{hoje}</span>
          <h1 className="home-ola">
            {saudacao()}
            {primeiroNome ? `, ${primeiroNome}` : ''}
          </h1>
        </div>

        {!!atalhos.length && (
          <nav className="home-atalhos" aria-label="Atalhos">
            {atalhos.map((atalho) => (
              <button
                key={atalho.rota}
                type="button"
                className={`home-atalho ${atalho.principal ? 'principal' : ''}`}
                onClick={() => navigate(atalho.rota)}
              >
                <i className={atalho.icone} />
                {atalho.texto}
              </button>
            ))}
          </nav>
        )}
      </header>

      {showDashboard ? (
        <Dashboard />
      ) : (
        <section className="home-painel home-boas-vindas">
          <span className="home-icone">
            <i className="pi pi-home" />
          </span>
          <div>
            <strong>Bem-vindo(a) ao sistema da clínica</strong>
            <div className="home-data">
              Use os atalhos acima ou o menu ao lado para navegar pelas telas.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
