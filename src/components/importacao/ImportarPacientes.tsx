import { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { ButtonHeron } from '../button';
import { create } from '../../server';
import { useToast } from '../../contexts/toast';
import { buildErrorToast } from '../../util/error';
import {
  emLotes,
  lerPlanilhaPacientes,
  LinhaPlanilhaPaciente,
} from '../../util/importacao';
import {
  ArquivoImportacao,
  EtapaImportacao,
  EtapasImportacao,
  Numero,
  Pilula,
} from './ArquivoImportacao';

// Limites da API (importacao.service.ts): até 100 linhas por envio.
const LOTE_PREVIA = 100;
const LOTE_GRAVACAO = 50;

const COLUNAS = [
  'PACIENTE',
  'CARTEIRINHA',
  'DT NASCIMENTO',
  'RESPONSÁVEL',
  'TELEFONE',
  'CONVENIO',
  'EMISSÃO DO PLANO TERAPEUTICO',
  'EMISSÃO DO LAUDO',
  'ESPECIALIDADES',
  'UNIDADE',
];

type Situacao =
  | 'pronto'
  | 'ja_cadastrado'
  | 'repetido_na_planilha'
  | 'erro'
  | 'importado';

interface LinhaConferida {
  linha: number;
  nome: string;
  situacao: Situacao;
  mensagem?: string;
}

const PILULA: Record<Situacao, { texto: string; tom: 'pronto' | 'ok' | 'neutro' | 'erro' }> = {
  pronto: { texto: 'Pronto para importar', tom: 'pronto' },
  importado: { texto: 'Importado', tom: 'ok' },
  ja_cadastrado: { texto: 'Já cadastrado', tom: 'neutro' },
  repetido_na_planilha: { texto: 'Repetido na planilha', tom: 'neutro' },
  erro: { texto: 'Com erro', tom: 'erro' },
};

const ORDEM: Situacao[] = ['erro', 'pronto', 'importado', 'repetido_na_planilha', 'ja_cadastrado'];

type Filtro = 'todas' | 'erro' | 'pronto' | 'fora';

interface ImportarPacientesProps {
  // `importou` = algum paciente foi gravado (a lista precisa recarregar).
  onClose: (importou: boolean) => void;
}

export function ImportarPacientes({ onClose }: ImportarPacientesProps) {
  const { renderToast } = useToast();
  const [etapa, setEtapa] = useState<EtapaImportacao>('arquivo');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [linhas, setLinhas] = useState<LinhaPlanilhaPaciente[]>([]);
  const [conferidas, setConferidas] = useState<LinhaConferida[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const contagem = useMemo(() => {
    const total: Record<Situacao, number> = {
      pronto: 0,
      importado: 0,
      ja_cadastrado: 0,
      repetido_na_planilha: 0,
      erro: 0,
    };
    conferidas.forEach((l) => (total[l.situacao] += 1));
    return total;
  }, [conferidas]);

  const visiveis = useMemo(
    () =>
      conferidas
        .filter((l) => {
          if (filtro === 'erro') return l.situacao === 'erro';
          if (filtro === 'pronto') return l.situacao === 'pronto' || l.situacao === 'importado';
          if (filtro === 'fora')
            return l.situacao === 'ja_cadastrado' || l.situacao === 'repetido_na_planilha';
          return true;
        })
        .sort(
          (a, b) => ORDEM.indexOf(a.situacao) - ORDEM.indexOf(b.situacao) || a.linha - b.linha
        ),
    [conferidas, filtro]
  );

  const escolherArquivo = async (arquivo: File) => {
    setCarregando(true);
    try {
      const lidas = await lerPlanilhaPacientes(arquivo);
      if (!lidas.length) throw new Error('A planilha não tem nenhum paciente.');

      const situacoes: LinhaConferida[] = [];
      for (const lote of emLotes(lidas, LOTE_PREVIA)) {
        const response: any = await create('importacao/pacientes/previa', { linhas: lote });
        situacoes.push(...response.data);
      }

      setNomeArquivo(arquivo.name);
      setLinhas(lidas);
      setConferidas(situacoes);
      setFiltro(situacoes.some((l) => l.situacao === 'erro') ? 'erro' : 'todas');
      setEtapa('previa');
    } catch (error: any) {
      renderToast(
        error?.response
          ? buildErrorToast(error, 'Não foi possível ler a planilha.')
          : {
              type: 'failure',
              title: 'Não foi possível ler a planilha',
              message: error?.message,
              open: true,
            }
      );
    } finally {
      setCarregando(false);
    }
  };

  const importar = async () => {
    const prontas = new Set(
      conferidas.filter((l) => l.situacao === 'pronto').map((l) => l.linha)
    );
    const aEnviar = linhas.filter((l) => prontas.has(l.linha));
    const lotes = emLotes(aEnviar, LOTE_GRAVACAO);
    const resultados = new Map<number, LinhaConferida>();

    setProgresso(0);
    try {
      for (const [indice, lote] of lotes.entries()) {
        const response: any = await create('importacao/pacientes/confirmar', { linhas: lote });
        response.data.forEach((r: LinhaConferida) => resultados.set(r.linha, r));
        setProgresso(Math.round(((indice + 1) / lotes.length) * 100));
      }
    } catch (error) {
      renderToast(
        buildErrorToast(error, 'A importação parou no meio. Os pacientes já gravados continuam gravados.')
      );
    } finally {
      // Mesmo se parou no meio, mostra o que já foi gravado.
      setConferidas((atuais) => atuais.map((l) => resultados.get(l.linha) || l));
      setProgresso(null);
      setFiltro('todas');
      setEtapa('resultado');
    }
  };

  if (etapa === 'arquivo') {
    return (
      <div className="importacao-heron" data-testid="importar-pacientes">
        <EtapasImportacao atual="arquivo" />
        <ArquivoImportacao
          accept=".xlsx,.xls,.csv"
          formato="Planilha .xlsx, .xls ou .csv"
          carregando={carregando}
          onArquivo={escolherArquivo}
          tituloDicas="Como preparar a planilha"
          dicas={[
            <>Use a planilha de cadastro de pacientes, a mesma da carga inicial.</>,
            <>
              A primeira aba precisa ter as colunas:
              <span className="imp-colunas">
                {COLUNAS.map((c) => (
                  <span key={c} className="imp-coluna">
                    {c}
                  </span>
                ))}
              </span>
            </>,
            <>
              Nada é gravado antes da conferência. Pacientes com o mesmo nome de um já
              cadastrado ficam de fora.
            </>,
          ]}
        />
      </div>
    );
  }

  const prontos = contagem.pronto;
  const foraCount = contagem.ja_cadastrado + contagem.repetido_na_planilha;
  const filtros = [
    { label: `Todas (${conferidas.length})`, value: 'todas' },
    ...(contagem.erro ? [{ label: `Com erro (${contagem.erro})`, value: 'erro' }] : []),
    { label: `A importar (${prontos + contagem.importado})`, value: 'pronto' },
    ...(foraCount ? [{ label: `Já cadastrados (${foraCount})`, value: 'fora' }] : []),
  ];

  return (
    <div className="importacao-heron" data-testid="importar-pacientes">
      <EtapasImportacao atual={etapa} />

      {etapa === 'resultado' && (
        <div className={`imp-concluido ${contagem.pronto ? 'parcial' : ''}`}>
          <i className={contagem.pronto ? 'pi pi-exclamation-circle' : 'pi pi-check-circle'} />
          <div>
            <strong>
              {contagem.importado}{' '}
              {contagem.importado === 1 ? 'paciente importado' : 'pacientes importados'}
            </strong>
            {contagem.pronto
              ? `${contagem.pronto} não chegaram a ser enviados. Feche e importe a planilha de novo para terminar.`
              : 'Os pacientes já aparecem no cadastro, prontos para agendar.'}
          </div>
        </div>
      )}

      <div className="imp-cabecalho">
        <div className="imp-origem">
          <i className="pi pi-file-excel" />
          <div>
            <strong>{nomeArquivo}</strong>
            <small>{conferidas.length} pacientes na planilha</small>
          </div>
        </div>
        <div className="imp-resumo">
          {etapa === 'previa' ? (
            <Numero valor={prontos} rotulo="a importar" tom="destaque" />
          ) : (
            <Numero valor={contagem.importado} rotulo="importados" tom="ok" />
          )}
          {!!foraCount && <Numero valor={foraCount} rotulo="já cadastrados" />}
          {!!contagem.erro && <Numero valor={contagem.erro} rotulo="com erro" tom="erro" />}
        </div>
      </div>

      {filtros.length > 2 && (
        <div className="imp-filtros" role="group" aria-label="Filtrar linhas">
          {filtros.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`imp-filtro ${filtro === f.value ? 'ativo' : ''}`}
              aria-pressed={filtro === f.value}
              onClick={() => setFiltro(f.value as Filtro)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {progresso !== null && <ProgressBar value={progresso} style={{ height: '0.5rem' }} showValue={false} />}

      <div className="imp-tabela pacientes">
        <DataTable
          value={visiveis}
          size="small"
          paginator={visiveis.length > 10}
          rows={10}
          dataKey="linha"
          responsiveLayout="scroll"
          emptyMessage="Nenhuma linha neste filtro."
          rowClassName={(l: LinhaConferida) => ({
            'imp-linha-fora': l.situacao === 'ja_cadastrado' || l.situacao === 'repetido_na_planilha',
          })}
        >
          <Column field="linha" header="Linha" style={{ width: '5rem' }} />
          <Column field="nome" header="Paciente" />
          <Column
            header="Situação"
            style={{ width: '40%' }}
            body={(l: LinhaConferida) => (
              <>
                <Pilula tom={PILULA[l.situacao].tom}>{PILULA[l.situacao].texto}</Pilula>
                {l.mensagem && <span className="imp-mensagem">{l.mensagem}</span>}
              </>
            )}
          />
        </DataTable>
      </div>

      <div className="imp-rodape">
        <span className={`imp-rodape-info ${etapa === 'previa' && contagem.erro ? 'erro' : ''}`}>
          {etapa === 'previa' &&
            (contagem.erro
              ? `${contagem.erro} ${contagem.erro === 1 ? 'linha com erro fica' : 'linhas com erro ficam'} de fora. Corrija na planilha e importe de novo depois.`
              : 'Confira as linhas antes de importar.')}
        </span>
        <div className="imp-rodape-botoes">
          {etapa === 'previa' ? (
            <>
              <ButtonHeron
                text="Trocar planilha"
                icon="pi pi-arrow-left"
                type="outline"
                size="full"
                htmlType="button"
                disabled={progresso !== null}
                onClick={() => setEtapa('arquivo')}
              />
              <ButtonHeron
                text={`Importar ${prontos} ${prontos === 1 ? 'paciente' : 'pacientes'}`}
                icon="pi pi-check"
                type="primary"
                size="full"
                htmlType="button"
                loading={progresso !== null}
                disabled={!prontos}
                onClick={importar}
                testId="importar-pacientes-confirmar"
              />
            </>
          ) : (
            <ButtonHeron
              text="Fechar"
              icon="pi pi-check"
              type="primary"
              size="full"
              htmlType="button"
              onClick={() => onClose(!!contagem.importado)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
