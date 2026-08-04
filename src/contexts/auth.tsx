import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { api, intercepttRoute } from '../server';
import { permissionAuth } from './permission';
import { useToast } from './toast';

const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
const idleTimeoutMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
const IDLE_TIMEOUT_MS = Number.isFinite(idleTimeoutMinutes) && idleTimeoutMinutes > 0
  ? idleTimeoutMinutes * 60 * 1000
  : DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;

interface AuthContextData {
  signed: boolean;
  user: any;
  perfil: string ;
  Login(user: object): Promise<void>;
  Logout(): void;
}

interface Props {
  children: JSX.Element;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {

  const [user, setUser] = useState();
  const [perfil, setPerfil] = useState<string>('');
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setPermissionsLogin } = permissionAuth();
  const { renderToast } = useToast();

  useEffect(() => {
    const storagedToken = sessionStorage.getItem('token');
    const storagedUser = sessionStorage.getItem('auth');
    const storagedPerfil = sessionStorage.getItem('perfil') ||  '';

    if (storagedToken && storagedUser) {
      const _user = JSON.parse(storagedUser);
      setUser(_user);
      setPerfil(storagedPerfil);
      intercepttRoute(storagedToken, _user.login);
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (!inactivityTimerRef.current) {
      return;
    }

    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }, []);

  const Logout = useCallback(async() => {
    clearInactivityTimer();
    setUser(undefined);
    sessionStorage.clear();

    try {
      await api.get('/logout');
    } catch (error) {
      console.log(error);
    }
  }, [clearInactivityTimer]);

  const logoutByInactivity = useCallback(async () => {
    await Logout();
    renderToast({
      type: 'failure',
      title: 'Sessão encerrada',
      message: 'Você foi deslogado por inatividade.',
      open: true,
    });
  }, [Logout, renderToast]);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      void logoutByInactivity();
    }, IDLE_TIMEOUT_MS);
  }, [clearInactivityTimer, logoutByInactivity]);

  useEffect(() => {
    if (!user) {
      clearInactivityTimer();
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    const handleUserActivity = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      resetInactivityTimer();
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity);
    });

    document.addEventListener('visibilitychange', handleUserActivity);
    resetInactivityTimer();

    return () => {
      clearInactivityTimer();

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });

      document.removeEventListener('visibilitychange', handleUserActivity);
    };
  }, [user, resetInactivityTimer, clearInactivityTimer]);

  const Login = async (loginState: { username: string, password: string}) => {
    try {
      const response = await api.post('/login', {
        ...loginState,
        password: parseInt(loginState.password)
      });

      const auth = response.data;

      const user = auth?.user || auth.data;
      const accessToken = auth?.accessToken || auth.data.accessToken;

      const perfilName = user.perfil?.nome
        ? user.perfil.nome.toLowerCase()
        : user.perfil.toLowerCase();

      sessionStorage.setItem('token', accessToken);
      sessionStorage.setItem('auth', JSON.stringify(user));
      sessionStorage.setItem('perfil', perfilName);

      if (user.permissoes.length && setPermissionsLogin)
        setPermissionsLogin(user.permissoes);

      setPerfil(perfilName);
      setUser(user);

      await intercepttRoute(accessToken, user.login);

      renderToast({
        type: 'success',
        title: ' ',
        message: 'Bem vindo!',
        open: true,
      });
    } catch (error) {
      msgError(error);
    }
  };

  const msgError = (data: any) => {
    const message = data?.data || data?.message || 'Usuário não encontrado!';
    renderToast({
      type: 'failure',
      title: data.status || '',
      message: message,
      open: true,
    });
  };

  return (
    <AuthContext.Provider
      value={{ signed: Boolean(user), user, Login, Logout, perfil }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
