export interface ModalProps {
  children: ReactNode;
  title: string;
  open: boolean;
  width?: string;
  onClose: () => void;
}
import { Dialog } from 'primereact/dialog';
import { ReactNode } from 'react';

export function Modal({
  title,
  children,
  open,
  width = '50vw',
  onClose,
}: ModalProps) {
  return (
    <Dialog
      header={title}
      modal
      visible={open}
      onHide={onClose}
      breakpoints={{ '960px': '75vw', '640px': '95vw' }}
      style={{ width }}
    >
      {children}
    </Dialog>
  );
}
