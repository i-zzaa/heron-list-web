export interface ButtonProps {
  type?: 'primary' | 'second' | 'transparent';
  color?: string;
  size?: 'full' | 'sm' | 'icon' | 'link' | 'md';
  icon?: string;
  text: string;
  loading?: boolean;
  onClick?: () => void;
  testId?: string;
}
import { clsx } from 'clsx';
import { Button } from 'primereact';

export function ButtonHeron({
  icon,
  size = 'full',
  type = 'primary',
  color = 'white',
  text,
  loading,
  onClick,
  testId,
}: ButtonProps) {
  return (
    <Button
      data-testid={testId}
      icon={icon}
      loading={loading}
      label={size === 'icon' ? '' : text}
      onClick={onClick}
      className={clsx(' text-white text-sm rounded-md border-none ', {
        'bg-violet-800 hover:bg-violet-600': type === 'primary',
        'bg-yellow-400 hover:bg-violet-800': type === 'second',
        'bg-transparent hover:bg-transparent': type === 'transparent',

        'text-white': color === 'white',
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
