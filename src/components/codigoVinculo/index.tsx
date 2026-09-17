import { useState } from 'react';

interface Props {
  codigo?: string | null;
}

// "K7M29XPF3TQH" -> "K7M2-9XPF-3TQH", mesmo formato do formatarCodigoVinculo
// do backend. O app PEIgo tira hífen/espaço antes de validar, então copiar
// já formatado funciona e fica mais fácil de ler quando colado na conversa
// com a família.
export const formatarCodigoVinculo = (codigo: string) =>
  (codigo.match(/.{1,4}/g) || []).join('-');

// Código que o responsável digita no app PEIgo para vincular a conta dele
// ao paciente.
export const CodigoVinculo = ({ codigo }: Props) => {
  const [copied, setCopied] = useState(false);

  if (!codigo) {
    return null;
  }

  const formatado = formatarCodigoVinculo(codigo);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatado);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Clipboard API pode não estar disponível (ex: contexto não seguro);
      // o código continua selecionável manualmente no texto exibido.
      console.error('Falha ao copiar o código de vínculo:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-800 tracking-wider">
      <span>Código PEIgo:</span>
      <code
        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono select-all"
        data-testid="codigo-vinculo-value"
      >
        {formatado}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 text-violet-800 hover:text-violet-600"
        title="Copiar código de vínculo"
        aria-label="Copiar código de vínculo"
        data-testid="codigo-vinculo-copy"
      >
        <i className={copied ? 'pi pi-check' : 'pi pi-copy'} />
        <span className="text-xs">{copied ? 'Copiado!' : 'Copiar'}</span>
      </button>
    </div>
  );
};
