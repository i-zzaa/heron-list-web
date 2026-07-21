import { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { loginFields } from '../constants/formFields';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';

const fields = loginFields;

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

    return localStorage.getItem('rememberCheck') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { renderToast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormProps>({ defaultValues });
  const { Login } = useAuth();

  const onSubmit = async ({ username, password }: FormProps) => {
    setLoading(true);

    try {
      await Login({ username, password });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRememberPassword = async (checked: boolean) => {
    setCheck(checked);

    localStorage.setItem('rememberCheck', checked ? 'true' : 'false');
    if (checked) {
      localStorage.setItem(
        'rememberLogin',
        JSON.stringify({
          username: watch('username') ?? '',
          password: watch('password') ?? '',
        })
      );
    } else {
      localStorage.removeItem('rememberLogin');
    }
  };

  useEffect(() => {
    const rememberLogin = localStorage.getItem('rememberLogin');
    const rememberCheck = localStorage.getItem('rememberCheck') === 'true';

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
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        {fields.map((item: any) => (
          <Input
            key={item.id}
            id={item.id}
            type={item.type}
            labelText={item.labelText}
            control={control}
            validate={item.validate}
            errors={errors}
          />
        ))}
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
