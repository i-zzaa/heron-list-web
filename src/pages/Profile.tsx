import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { ButtonHeron } from '../components/index';
import { useToast } from '../contexts/toast';
import { useAuth } from '../contexts/auth';
import { update } from '../server';
import { buildErrorToast } from '../util/error';

interface FormProps {
  senha: string;
  confirmarSenha: string;
}

const defaultValues: FormProps = { senha: '', confirmarSenha: '' };

const getInitials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

// Mesmo visual de card do filtro (templates/filter): branco, borda clara e
// sombra levemente roxa.
const CARD_CLASS =
  'bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(102,41,119,0.05)]';

interface PasswordFieldProps {
  id: keyof FormProps;
  label: string;
  testId: string;
  error?: string;
  registration: UseFormRegisterReturn;
}

function PasswordField({
  id,
  label,
  testId,
  error,
  registration,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-md text-violet-800 mb-2">
        {label}
      </label>
      <div
        data-testid={testId}
        className={`flex items-center gap-3 h-12 rounded-md border bg-white px-4 transition-colors focus-within:border-violet-800 focus-within:ring-1 focus-within:ring-violet-800 ${
          error ? 'border-red-400' : 'border-gray-300 hover:border-violet-600'
        }`}
      >
        <i className="pi pi-lock text-gray-400" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="auth-input w-full h-full text-[14px] text-gray-800 outline-none bg-transparent"
          autoComplete="new-password"
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((prev) => !prev)}
          className="w-8 h-8 -mr-2 flex items-center justify-center rounded-full text-gray-400 hover:text-violet-800 hover:bg-violet-800/10"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          <i className={visible ? 'pi pi-eye-slash' : 'pi pi-eye'} />
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-md text-red-400 mt-1">
          <i className="pi pi-exclamation-circle" style={{ fontSize: 12 }} />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, perfil } = useAuth();
  const { renderToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    register,
  } = useForm<FormProps>({ defaultValues });

  const onSubmit = async ({ senha }: FormProps) => {
    setLoading(true);

    try {
      // PUT /usuarios/reset-senha troca sempre a senha do usuário do token
      // (não recebe id/login no corpo) e responde 200 com corpo vazio.
      await update('/usuarios/reset-senha', { senha });
      renderToast({
        type: 'success',
        title: '',
        message: 'Senha alterada com sucesso!',
        open: true,
      });
      reset(defaultValues);
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível alterar a senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 max-w-3xl pt-2" data-testid="profile-page">
      <section className={`${CARD_CLASS} overflow-hidden`}>
        {/* Faixa roxa no topo, no tom do menu lateral, com o avatar
            "encaixado" metade pra fora dela. */}
        <div className="relative h-20 bg-violet-800 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.08]" />
          <div className="absolute -bottom-16 right-32 w-32 h-32 rounded-full bg-white opacity-[0.06]" />
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-10 w-20 h-20 rounded-full bg-violet-800 ring-4 ring-white text-white flex items-center justify-center font-bold text-xl shadow-md">
            {getInitials(user?.nome)}
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 break-words">
                {user?.nome}
              </h1>
              <p className="flex items-center gap-2 mt-1 text-[14px] text-gray-800">
                <i className="pi pi-user text-violet-800" />
                {user?.login}
              </p>
            </div>
            {perfil && (
              <span className="self-start sm:self-auto inline-flex items-center gap-2 text-md font-bold uppercase text-violet-800 bg-violet-800/10 rounded-full px-3 py-1">
                <i className="pi pi-id-card" style={{ fontSize: 12 }} />
                {perfil}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className={CARD_CLASS}>
        <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-violet-800/10 text-violet-800">
            <i className="pi pi-lock" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-violet-800">
              Alterar senha
            </h2>
            <p className="text-md text-gray-800">
              A nova senha precisa ter pelo menos 6 caracteres.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          <div className="grid sm:grid-cols-2 gap-4 pt-5">
            <PasswordField
              id="senha"
              label="Nova senha"
              testId="profile-password-field"
              error={errors.senha?.message}
              registration={register('senha', {
                required: 'Campo obrigatório!',
                minLength: { value: 6, message: 'Mínimo de 6 caracteres.' },
              })}
            />
            <PasswordField
              id="confirmarSenha"
              label="Confirmar nova senha"
              testId="profile-confirm-password-field"
              error={errors.confirmarSenha?.message}
              registration={register('confirmarSenha', {
                required: 'Campo obrigatório!',
                validate: (value) =>
                  value === watch('senha') || 'As senhas não coincidem',
              })}
            />
          </div>

          <div className="flex justify-end mt-5 pt-4 border-t border-gray-200">
            <div className="w-full sm:w-auto sm:min-w-[11rem]">
              <ButtonHeron
                text="Salvar nova senha"
                icon="pi pi-check"
                type="primary"
                size="full"
                loading={loading}
                testId="profile-save-password"
              />
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
