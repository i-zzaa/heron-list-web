export interface ButtonProps {
  type?: 'primary' | 'second' | 'transparent' | 'outline';
  color?: string;
  size?: 'full' | 'sm' | 'icon' | 'link' | 'md';
  icon?: string;
  text: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  testId?: string;
  // Tipo do <button>. Sem ele o navegador trata como submit, e um botão
  // dentro de formulário (ex.: o filtro) também dispara a pesquisa.
  htmlType?: 'button' | 'submit';
}
import { clsx } from 'clsx';
import { Button } from 'primereact/button';

export function ButtonHeron({
  icon,
  size = 'full',
  type = 'primary',
  color = 'white',
  text,
  loading,
  disabled,
  onClick,
  testId,
  htmlType,
}: ButtonProps) {
  return (
    <Button
      data-testid={testId}
      type={htmlType}
      icon={icon}
      loading={loading}
      disabled={disabled}
      label={size === 'icon' ? '' : text}
      onClick={onClick}
      className={clsx('text-sm rounded-md', {
        'border-none': type !== 'outline',
        'bg-violet-800 hover:bg-violet-900': type === 'primary',
        'bg-yellow-400 hover:bg-violet-800': type === 'second',
        'bg-transparent hover:bg-transparent': type === 'transparent',
        'bg-white hover:bg-background border border-solid border-gray-300 hover:border-violet-800 text-violet-800':
          type === 'outline',

        'text-white': color === 'white' && type !== 'outline',
        'text-red-400 hover:text-violet-800 focus:text-violet-600':
          color === 'red',
        'text-green-400 hover:text-violet-800 focus:text-violet-600':
          color === 'green',
        'text-yellow-400 hover:text-violet-800 focus:text-violet-600':
          color === 'yellow',
        'text-violet-800 hover:text-violet-600 focus:text-violet-600':
          color === 'violet',

        'w-full': size === 'full',
        'sm:w-2/5 w-full': size === 'md',
      })}
    />
  );
}
