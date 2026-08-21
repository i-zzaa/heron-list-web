import { AuthProvider } from './contexts/auth';
import { ToastProvider } from './contexts/toast';
import Routes from './routes';

import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.css';

import './styles/primereact.css';
import './styles/label.css';
import './styles/global.css';

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
