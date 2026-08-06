import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Card } from '../components/index';
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

export default function Profile() {
  const { user, perfil } = useAuth();
  const { renderToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="grid gap-4 max-w-2xl" data-testid="profile-page">
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-800 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {getInitials(user?.nome)}
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800">{user?.nome}</div>
            <div className="text-sm text-gray-400">{user?.login}</div>
            {perfil && (
              <span className="inline-block mt-1 text-xs uppercase tracking-wide text-violet-800 bg-[#662977]/10 rounded-full px-2 py-0.5">
                {perfil}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Alterar senha</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 max-w-sm">
          <div>
            <label htmlFor="senha" className="block text-sm text-violet-800 mb-1">
              Nova senha
            </label>
            <div
              data-testid="profile-password-field"
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-violet-800 focus-within:ring-1 focus-within:ring-violet-800"
            >
              <i className="pi pi-lock text-gray-400" style={{ fontSize: 14 }} />
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                className="auth-input w-full py-2 text-sm outline-none bg-transparent"
                {...register('senha', {
                  required: 'Campo obrigatório!',
                  minLength: { value: 6, message: 'Mínimo de 6 caracteres.' },
                })}
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
            {errors.senha && <p className="text-xs text-red-400 mt-1">{errors.senha.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm text-violet-800 mb-1">
              Confirmar nova senha
            </label>
            <div
              data-testid="profile-confirm-password-field"
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-violet-800 focus-within:ring-1 focus-within:ring-violet-800"
            >
              <i className="pi pi-lock text-gray-400" style={{ fontSize: 14 }} />
              <input
                id="confirmarSenha"
                type={showConfirmPassword ? 'text' : 'password'}
                className="auth-input w-full py-2 text-sm outline-none bg-transparent"
                {...register('confirmarSenha', {
                  required: 'Campo obrigatório!',
                  validate: (value) => value === watch('senha') || 'As senhas não coincidem',
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-gray-400 hover:text-violet-800"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'} style={{ fontSize: 14 }} />
              </button>
            </div>
            {errors.confirmarSenha && (
              <p className="text-xs text-red-400 mt-1">{errors.confirmarSenha.message}</p>
            )}
          </div>

          <div>
            <ButtonHeron
              text="Salvar nova senha"
              type="primary"
              size="md"
              loading={loading}
              testId="profile-save-password"
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
