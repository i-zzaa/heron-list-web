import { ReactNode } from 'react';

export interface TitleProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  color?:
    | 'gray'
    | 'gray-dark'
    | 'gray-light'
    | 'yellow'
    | 'violet'
    | 'black'
    | 'white';
}
import { clsx } from 'clsx';

export function Title({
  size = 'md',
  color = 'gray-dark',
  children,
}: TitleProps) {
  return (
    <span
      className={clsx('font-bold', {
        'text-xs': size === 'xs',
        'text-sm': size === 'sm',
        'text-md': size === 'md',
        'text-lg': size === 'lg',

        'text-white': color === 'white',
        'text-gray-300': color === 'gray-light',
        'text-gray-400': color === 'gray',
        'text-gray-800': color === 'gray-dark',
        'text-violet-800': color === 'violet',
        'text-yellow-400': color === 'yellow',
        'text-black': color === 'black',
      })}
    >
      {children}
    </span>
  );
}
