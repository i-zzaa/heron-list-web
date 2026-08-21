import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <fieldset className="px-8 items-center bg-white rounded-lg border border-gray-200 shadow-md mt-4 ">
      <div className="py-4">{children}</div>
    </fieldset>
  );
}
