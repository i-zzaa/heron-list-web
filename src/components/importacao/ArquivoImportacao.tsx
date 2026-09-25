import { ReactNode, useRef, useState } from 'react';
import './importacao.css';

export type EtapaImportacao = 'arquivo' | 'previa' | 'resultado';

const ETAPAS: { id: EtapaImportacao; nome: string }[] = [
  { id: 'arquivo', nome: 'Arquivo' },
  { id: 'previa', nome: 'Conferir' },
  { id: 'resultado', nome: 'Concluído' },
];

// Indicador "1 Arquivo — 2 Conferir — 3 Concluído" no topo do modal.
export function EtapasImportacao({ atual }: { atual: EtapaImportacao }) {
  const indiceAtual = ETAPAS.findIndex((e) => e.id === atual);
  return (
    <ol className="imp-etapas" aria-label="Etapas da importação">
      {ETAPAS.map((etapa, indice) => (
        <li key={etapa.id} className="contents">
          {indice > 0 && <span className="imp-etapa-linha" aria-hidden />}
          <span
            className={`imp-etapa ${
              indice === indiceAtual ? 'ativa' : indice < indiceAtual ? 'feita' : ''
            }`}
            aria-current={indice === indiceAtual ? 'step' : undefined}
          >
            <span className="imp-etapa-numero">
              {indice < indiceAtual ? <i className="pi pi-check" /> : indice + 1}
            </span>
            {etapa.nome}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface ArquivoImportacaoProps {
  accept: string;
  // Extensões aceitas, para a dica da área ("Arquivo .ics").
  formato: string;
  carregando: boolean;
  onArquivo: (arquivo: File) => void;
  // Título e passos de onde tirar o arquivo e o que ele precisa ter.
  tituloDicas: string;
  dicas: ReactNode[];
  // Campos extras acima da área do arquivo (ex.: data inicial da agenda).
  campos?: ReactNode;
}

// Primeira etapa das importações: instruções à esquerda, arquivo à direita
// (clique ou arraste).
export function ArquivoImportacao({
  accept,
  formato,
  carregando,
  onArquivo,
  tituloDicas,
  dicas,
  campos,
}: ArquivoImportacaoProps) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  const escolher = () => {
    if (!carregando) input.current?.click();
  };

  return (
    <div className="imp-arquivo">
      <div className="imp-dicas">
        <h4>{tituloDicas}</h4>
        <ol>
          {dicas.map((dica, indice) => (
            <li key={indice}>
              <div>{dica}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="imp-lado">
        {campos}
        <div
          role="button"
          tabIndex={0}
          className={`imp-drop ${arrastando ? 'arrastando' : ''} ${carregando ? 'carregando' : ''}`}
          onClick={escolher}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              escolher();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            const arquivo = e.dataTransfer.files?.[0];
            if (arquivo && !carregando) onArquivo(arquivo);
          }}
          data-testid="importacao-area-arquivo"
        >
          <span className="imp-drop-icone">
            <i className={carregando ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'} />
          </span>
          <span className="imp-drop-titulo">
            {carregando ? 'Lendo o arquivo…' : 'Arraste o arquivo aqui ou clique para escolher'}
          </span>
          <span className="imp-drop-dica">{formato}</span>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        data-testid="importacao-arquivo"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          // Limpa para o mesmo arquivo poder ser escolhido de novo.
          e.target.value = '';
          if (arquivo) onArquivo(arquivo);
        }}
      />
    </div>
  );
}

type TomPilula = 'pronto' | 'ok' | 'neutro' | 'erro';

export function Pilula({ tom, children }: { tom: TomPilula; children: ReactNode }) {
  return <span className={`imp-pilula ${tom}`}>{children}</span>;
}

export function Numero({
  valor,
  rotulo,
  tom,
}: {
  valor: number;
  rotulo: string;
  tom?: 'destaque' | 'ok' | 'erro';
}) {
  return (
    <span className={`imp-numero ${tom || ''}`}>
      <b>{valor}</b>
      {rotulo}
    </span>
  );
}
