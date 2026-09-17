import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <fieldset className="px-4 sm:px-8 items-center bg-white rounded-xl border border-gray-200 shadow-heron mt-4">
      <div className="py-5">{children}</div>
    </fieldset>
  );
}
