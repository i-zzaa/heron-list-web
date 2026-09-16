export interface TagProps {
  onClick?: () => void;
  type: 'to' | 'fono' | 'psico' | 'PsicoPEDAG' | 'Motricidade' | 'Musicoterapia' | string;
  // Cor cadastrada na especialidade (`especialidade.cor`). Quando informada,
  // tem prioridade sobre as classes fixas abaixo — que ficam como fallback
  // apenas para especialidades antigas ainda sem cor cadastrada.
  color?: string;
  disabled: boolean;
}
import { clsx } from 'clsx';

const CLASSFIX =
  'text-sm items-center flex text-white py-2 px-6 rounded-full disabled:opacity-25 disabled:cursor-not-allowed';

export function Tag({ onClick, type, color, disabled }: TagProps) {
  // `type` já veio quebrado como objeto/undefined vindo de alguma tela —
  // normaliza pra string em vez de deixar `.toUpperCase()` estourar e
  // sumir com a linha inteira da tabela/lista.
  const label = String(type ?? '').toUpperCase();
  const hasFixedColor = [
    'TO',
    'FONO',
    'PSICO',
    'PSICOPEDAG',
    'MOTRICIDADE',
    'MUSICOTERAPIA',
  ].includes(label);

  return (
    <button
      onClick={onClick}
      className={clsx(CLASSFIX, {
        // Só mostra a "mãozinha" quando a pílula é clicável de fato.
        'cursor-pointer': !disabled && !!onClick,
        'cursor-default': !disabled && !onClick,
        'bg-to': !color && label === 'TO',
        'bg-fono': !color && label === 'FONO',
        'bg-psico': !color && label === 'PSICO',
        'bg-black': !color && label === 'PSICOPEDAG',
        'bg-motricidade': !color && label === 'MOTRICIDADE',
        'bg-musicoterapia': !color && label === 'MUSICOTERAPIA',
        // Sem cor cadastrada e sem correspondência na paleta fixa: cai
        // aqui — sem isso a tag ficava com texto branco sobre fundo
        // transparente, invisível.
        'bg-violet-800': !color && !hasFixedColor,
      })}
      style={color ? { backgroundColor: color } : undefined}
      // `disabled` = especialidade já agendada: pílula apagada e sem clique.
      disabled={disabled}
    >
      {label || '—'}
    </button>
  );
}
