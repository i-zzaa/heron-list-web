import { useState } from 'react';
import { Dialog } from 'primereact/dialog';

import { ButtonHeron } from '../button';

interface Props {
  open: boolean;
  senha: string | null;
  subject?: string;
  onClose: () => void;
}

// Exibe uma senha temporária gerada pelo backend (criação de usuário ou
// reset de senha de terceiro) de forma destacada e copiável. Não é
// persistida em lugar nenhum (nem sessionStorage/localStorage, nem log) —
// vive só no estado do componente que abre este modal, e some ao fechar.
// Esta é a única vez que esse valor aparece; a API não guarda/loga o texto
// plano em nenhum outro lugar.
export const TemporaryPasswordModal = ({
  open,
  senha,
  subject,
  onClose,
}: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!senha) {
      return;
    }

    try {
      await navigator.clipboard.writeText(senha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Clipboard API pode não estar disponível (ex: contexto não seguro);
      // o valor continua selecionável manualmente no texto exibido.
      console.error('Falha ao copiar a senha temporária:', error);
    }
  };

  return (
    <Dialog
      header="Senha temporária gerada"
      visible={open}
      modal
      onHide={onClose}
      style={{ width: '28rem' }}
      breakpoints={{ '960px': '90vw' }}
    >
      {subject && (
        <p className="text-sm font-medium text-gray-700 mb-2">
          Usuário: {subject}
        </p>
      )}

      <p className="text-sm text-gray-600 mb-4">
        Essa senha é exibida apenas uma vez — copie e repasse manualmente ao
        usuário (não existe envio automático por e-mail/SMS). Ele será
        obrigado a trocá-la no próximo login.
      </p>

      <div className="flex items-center gap-2 mb-6">
        <code
          className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-mono break-all select-all"
          data-testid="temporary-password-value"
        >
          {senha}
        </code>
        <ButtonHeron
          text={copied ? 'Copiado!' : 'Copiar'}
          type="second"
          size="md"
          onClick={handleCopy}
          testId="temporary-password-copy"
        />
      </div>

      <ButtonHeron
        text="Fechar"
        type="primary"
        size="full"
        onClick={onClose}
        testId="temporary-password-close"
      />
    </Dialog>
  );
};
