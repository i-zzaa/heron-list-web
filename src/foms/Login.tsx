import { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { loginFields } from '../constants/formFields';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';
import { buildErrorToast } from '../util/error';

const usernameField = loginFields.find((field: any) => field.id === 'username');
const passwordField = loginFields.find((field: any) => field.id === 'password');

interface FormProps {
  username: string;
  password: string;
}

export default function Login() {
  const defaultValues = {
    username: '',
    password: '',
  };

  const [checkState, setCheck] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    return sessionStorage.getItem('rememberCheck') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { renderToast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    register,
  } = useForm<FormProps>({ defaultValues });
  const { Login } = useAuth();

  const onSubmit = async ({ username, password }: FormProps) => {
    setLoading(true);

    try {
      await Login({ username, password });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Falha na conexão'));
    } finally {
      setLoading(false);
    }
  };

  const handleRememberPassword = async (checked: boolean) => {
    setCheck(checked);

    sessionStorage.setItem('rememberCheck', checked ? 'true' : 'false');
    if (checked) {
      sessionStorage.setItem(
        'rememberLogin',
        JSON.stringify({
          username: watch('username') ?? '',
          password: watch('password') ?? '',
        })
      );
    } else {
      sessionStorage.removeItem('rememberLogin');
    }
  };

  useEffect(() => {
    const rememberLogin = sessionStorage.getItem('rememberLogin');
    const rememberCheck = sessionStorage.getItem('rememberCheck') === 'true';

    if (rememberLogin) {
      const { username, password } = JSON.parse(rememberLogin);
      setCheck(rememberCheck);
      setValue('username', username);
      setValue('password', password);
    } else {
      setCheck(false);
    }
  }, [setValue]);

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="username" className="block text-sm text-violet-800 mb-1">
          {usernameField?.labelText || 'Login'}
        </label>
        <div
          data-testid="username-field"
          className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-violet-800 focus-within:ring-1 focus-within:ring-violet-800"
        >
          <i className="pi pi-user text-gray-400" style={{ fontSize: 14 }} />
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder={usernameField?.placeholder}
            className="auth-input w-full py-2 text-sm outline-none bg-transparent"
            {...register('username', usernameField?.validate)}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-red-400 text-end mt-1">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-violet-800 mb-1">
          {passwordField?.labelText || 'Senha'}
        </label>
        <div
          data-testid="password-field"
          className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-violet-800 focus-within:ring-1 focus-within:ring-violet-800"
        >
          <i className="pi pi-lock text-gray-400" style={{ fontSize: 14 }} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={passwordField?.placeholder}
            className="auth-input w-full py-2 text-sm outline-none bg-transparent"
            {...register('password', passwordField?.validate)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-gray-400 hover:text-violet-800"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <i className={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'} style={{ fontSize: 14 }} />
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 text-end mt-1">{errors.password.message}</p>
        )}
      </div>

      <Input
        id="checkbox-login"
        labelText="Lembrar login"
        type="checkbox"
        control={control}
        onChange={handleRememberPassword}
        value={checkState}
      />

      <ButtonHeron text="Entrar" type="primary" size="full" loading={loading} />
    </form>
  );
}
