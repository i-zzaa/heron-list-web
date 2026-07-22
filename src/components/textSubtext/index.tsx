export interface TextSubtextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  text?: string;
  subtext?: ReactNode;
  color?:
    | 'gray'
    | 'gray-dark'
    | 'gray-light'
    | 'yellow'
    | 'violet'
    | 'black'
    | 'white'
    | 'red';
  display: 'flex' | 'grid' | 'block';
  icon?: string;
  className?: string;
}
import { clsx } from 'clsx';
import { ReactNode } from 'react';

export function TextSubtext({
  size = 'md',
  color = 'gray-dark',
  text,
  display = 'grid',
  subtext,
  icon,
  className,
}: TextSubtextProps) {
  return (
    <div
      className={clsx(
        'flex gap-4 font-normal tracking-wider text-start items-center text-ellipsis overflow-hidden whitespace-nowrap',
        {
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
          'text-red-900': color === 'red',
          'text-black': color === 'black',
        },
        className
      )}
    >
      {icon && (
        <div className="flex items-center">
          <i className={icon}></i>
        </div>
      )}
      <span className={display}>
        {text}&nbsp;
        <strong className='font-inter'> {subtext}</strong>
      </span>
    </div>
  );
}
