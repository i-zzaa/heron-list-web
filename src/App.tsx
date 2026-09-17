// Estilos globais primeiro: assim os CSS importados pelos próprios
// componentes (filtro, agenda, picklist) entram depois e conseguem
// sobrescrever o tema.
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.css';

import './styles/primereact.css';
import './styles/label.css';
import './styles/global.css';
import './styles/theme.css';

import { AuthProvider } from './contexts/auth';
import { ToastProvider } from './contexts/toast';
import Routes from './routes';

// import "primereact/resources/themes/lara-light-indigo/theme.css";

function App() {
  return (
    <div className="App">
      <ToastProvider>
        <AuthProvider>
          <Routes />
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}

export default App;
