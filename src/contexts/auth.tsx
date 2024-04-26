import React, { createContext, useState, useEffect, useContext } from 'react';
import { api, intercepttRoute } from '../server';
import { permissionAuth } from './permission';
import { useToast } from './toast';

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

  const Login = async (loginState: { username: string, password: string}) => {
    try {
      const response = await api.post('/login', {
        ...loginState,
        password: parseInt(loginState.password)
      });
      
      const auth = response.data;

      setTimeout(() => {
         Logout()
      //  },  import.meta.env.VITE_API_URL_EXPIRES_IN_SECONDS);
       },  8000000);

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

   const Logout = async() => {
    setUser(undefined);
    sessionStorage.clear();

    try {
      await api.get('/logout');
    } catch (error) {
      console.log(error);
    }
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
