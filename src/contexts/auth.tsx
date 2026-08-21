import {
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
import { buildErrorToast } from '../util/error';
import { registerMustChangePasswordListener } from '../util/mustChangePasswordBus';

const DEFAULT_IDLE_TIMEOUT_MINUTES = 20;
const idleTimeoutMinutes = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
const IDLE_TIMEOUT_MS = Number.isFinite(idleTimeoutMinutes) && idleTimeoutMinutes > 0
  ? idleTimeoutMinutes * 60 * 1000
  : DEFAULT_IDLE_TIMEOUT_MINUTES * 60 * 1000;

interface AuthContextData {
  signed: boolean;
  user: any;
  perfil: string ;
  mustChangePassword: boolean;
  Login(user: object): Promise<void>;
  Logout(): void;
  clearMustChangePassword(): void;
}

interface Props {
  children: JSX.Element;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: Props) => {

  const [user, setUser] = useState();
  const [perfil, setPerfil] = useState<string>('');
  // Estado próprio (não apenas derivado de user.mustChangePassword): também
  // precisa poder ser forçado a true por um 403 vindo de qualquer chamada
  // da API já autenticada (ver mustChangePasswordBus), não só pelo login.
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
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
      setMustChangePassword(Boolean(_user.mustChangePassword));
      intercepttRoute(storagedToken, _user.login);
    }
  }, []);

  // Registra este provider no barramento para que buildErrorToast (fora da
  // árvore React) consiga forçar a tela de troca de senha a partir de um
  // 403 recebido em qualquer requisição.
  useEffect(() => {
    registerMustChangePasswordListener(() => setMustChangePassword(true));
    return () => registerMustChangePasswordListener(null);
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
    setMustChangePassword(false);
    sessionStorage.clear();

    try {
      await api.get('/logout');
    } catch (error) {
      console.error(error);
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

  // Mantido em ref para que `resetInactivityTimer` não precise depender de
  // `logoutByInactivity`: essa função muda de identidade sempre que o
  // contexto de toast re-renderiza (ex: qualquer toast exibido em qualquer
  // tela), e se ela fosse dependência, o efeito abaixo reiniciaria os
  // listeners E o timer a cada uma dessas ocorrências, fazendo a contagem
  // de inatividade nunca chegar ao fim de fato.
  const logoutByInactivityRef = useRef(logoutByInactivity);

  useEffect(() => {
    logoutByInactivityRef.current = logoutByInactivity;
  }, [logoutByInactivity]);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      void logoutByInactivityRef.current();
    }, IDLE_TIMEOUT_MS);
  }, [clearInactivityTimer]);

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
      // Senhas geradas pelo backend (§2.2/2.3 do contrato de reset) são
      // alfanuméricas (ex: "kx7Rmp9q2T"), não numéricas — parseInt() aqui
      // devolvia NaN pra qualquer senha que não começasse com dígito, e
      // JSON.stringify(NaN) vira null no corpo da requisição.
      const response = await api.post('/login', loginState);

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
      // Sempre presente na resposta do login (nunca undefined) — se true,
      // o app não deve deixar o usuário passar da tela de troca de senha
      // obrigatória (ver MustChangePasswordModal).
      setMustChangePassword(Boolean(user.mustChangePassword));

      await intercepttRoute(accessToken, user.login);

      renderToast({
        type: 'success',
        title: ' ',
        message: 'Bem vindo!',
        open: true,
      });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Usuário não encontrado!'));
    }
  };

  // Chamado após PUT /usuarios/reset-senha responder 200 (troca obrigatória
  // concluída). O backend já limpou a flag no banco — não é preciso logar
  // de novo nem re-buscar o usuário, só refletir isso localmente para
  // liberar a navegação.
  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    setUser((prev: any) => {
      if (!prev) {
        return prev;
      }

      const updated = { ...prev, mustChangePassword: false };
      sessionStorage.setItem('auth', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signed: Boolean(user),
        user,
        Login,
        Logout,
        perfil,
        mustChangePassword,
        clearMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
