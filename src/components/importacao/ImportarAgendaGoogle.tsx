import { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { ProgressBar } from 'primereact/progressbar';
import { ButtonHeron } from '../button';
import { api, create } from '../../server';
import { useToast } from '../../contexts/toast';
import { buildErrorToast } from '../../util/error';
import { dataBr, emLotes, quandoAcontece } from '../../util/importacao';
import {
  ArquivoImportacao,
  EtapaImportacao,
  EtapasImportacao,
  Numero,
  Pilula,
} from './ArquivoImportacao';

// Limite da API (importacao.service.ts): até 25 eventos por confirmação.
const LOTE_GRAVACAO = 25;

interface Opcao {
  id: number;
  nome: string;
}

interface Terapeuta extends Opcao {
  especialidadeNome: string;
  funcoes: Opcao[];
}

interface EventoPrevia {
  origemId: string;
  titulo: string;
  descricao: string;
  local: string;
  dataInicio: string;
  dataFim: string;
  start: string;
  end: string;
  recorrente: boolean;
  intervalo: number;
  diasFrequencia: number[];
  exdate: string[];
  problema?: string;
  nomeNoTitulo: string;
  jaNaAgenda: boolean;
  sugestao: {
    pacienteId: number | null;
    localidadeId: number | null;
    statusEventosId: number | null;
  };
}

interface Previa {
  aPartirDe: string;
  nomeCalendario: string;
  terapeutaId: number | null;
  eventos: EventoPrevia[];
  ignoradosPorData: number;
  cancelados: number;
  horariosVagos: number;
  terapeutas: Terapeuta[];
  pacientes: Opcao[];
  localidades: { id: number; casa: string; sala: string }[];
  statusEventos: Opcao[];
  modalidades: Opcao[];
}

// O que a pessoa escolheu para cada evento na conferência.
interface Escolha {
  importar: boolean;
  pacienteId: number | null;
  localidadeId: number | null;
  statusEventosId: number | null;
}

type Resultado =
  | { origemId: string; situacao: 'importado'; eventoId: number }
  | { origemId: string; situacao: 'ja_na_agenda' }
  | { origemId: string; situacao: 'erro'; mensagem: string };

const hoje = () => {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
};

const porNome = (lista: Opcao[], ...nomes: string[]) =>
  lista.find((o) => nomes.some((n) => o.nome.trim().toLowerCase().startsWith(n)));

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

interface ImportarAgendaGoogleProps {
  // `importou` = algum evento foi gravado (o calendário precisa recarregar).
  onClose: (importou: boolean) => void;
}

export function ImportarAgendaGoogle({ onClose }: ImportarAgendaGoogleProps) {
  const { renderToast } = useToast();
  const [etapa, setEtapa] = useState<EtapaImportacao>('arquivo');
  const [aPartirDe, setAPartirDe] = useState(hoje());
  const [carregando, setCarregando] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);

  const [terapeutaId, setTerapeutaId] = useState<number | null>(null);
  const [funcaoId, setFuncaoId] = useState<number | null>(null);
  const [modalidadeId, setModalidadeId] = useState<number | null>(null);
  const [statusPadraoId, setStatusPadraoId] = useState<number | null>(null);
  const [salaPadraoId, setSalaPadraoId] = useState<number | null>(null);
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>({});

  const [progresso, setProgresso] = useState<number | null>(null);
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});

  const terapeuta = previa?.terapeutas.find((t) => t.id === terapeutaId);
  const funcoes = terapeuta?.funcoes || [];

  const salas = useMemo(
    () =>
      (previa?.localidades || []).map((l) => ({
        id: l.id,
        nome: `${l.casa.trim()} - ${l.sala.trim()}`,
      })),
    [previa]
  );

  const escolherTerapeuta = (id: number | null, lista = previa?.terapeutas || []) => {
    setTerapeutaId(id);
    const doTerapeuta = lista.find((t) => t.id === id)?.funcoes || [];
    setFuncaoId(doTerapeuta.length === 1 ? doTerapeuta[0].id : null);
  };

  const escolherArquivo = async (arquivo: File) => {
    setCarregando(true);
    try {
      const formulario = new FormData();
      formulario.append('arquivo', arquivo);
      formulario.append('aPartirDe', aPartirDe);
      const response = await api.post('importacao/google-agenda/previa', formulario, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const dados: Previa = response.data;

      setPrevia(dados);
      escolherTerapeuta(dados.terapeutaId, dados.terapeutas);
      setModalidadeId(porNome(dados.modalidades, 'terapia')?.id ?? dados.modalidades[0]?.id ?? null);
      setStatusPadraoId(porNome(dados.statusEventos, 'confirmado')?.id ?? null);
      setSalaPadraoId(null);
      setEscolhas(
        Object.fromEntries(
          dados.eventos.map((e) => [
            e.origemId,
            {
              importar: !e.problema && !e.jaNaAgenda,
              pacienteId: e.sugestao.pacienteId,
              localidadeId: e.sugestao.localidadeId,
              statusEventosId: e.sugestao.statusEventosId,
            },
          ])
        )
      );
      setResultados({});
      setEtapa('previa');
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível ler a agenda.'));
    } finally {
      setCarregando(false);
    }
  };

  const alterar = (origemId: string, mudanca: Partial<Escolha>) =>
    setEscolhas((atuais) => ({ ...atuais, [origemId]: { ...atuais[origemId], ...mudanca } }));

  // O que vai de fato para a API, com os padrões aplicados.
  const final = (evento: EventoPrevia) => {
    const escolha = escolhas[evento.origemId];
    return {
      ...escolha,
      localidadeId: escolha?.localidadeId || salaPadraoId,
      statusEventosId: escolha?.statusEventosId || statusPadraoId,
    };
  };

  // Gravado ou já na agenda não volta a ser enviado; o que deu erro pode ser
  // corrigido na tabela e enviado de novo.
  const concluido = (origemId: string) =>
    !!resultados[origemId] && resultados[origemId].situacao !== 'erro';

  const eventos = previa?.eventos || [];
  const marcaveis = eventos.filter((e) => !e.problema && !concluido(e.origemId));
  const selecionados = marcaveis.filter((e) => escolhas[e.origemId]?.importar);
  const pendencias = selecionados.filter((e) => {
    const f = final(e);
    return !f.pacienteId || !f.localidadeId || !f.statusEventosId;
  }).length;
  const cabecalhoCompleto = !!terapeutaId && !!funcaoId && !!modalidadeId;
  const todosMarcados = !!marcaveis.length && selecionados.length === marcaveis.length;

  const marcarTodos = (importar: boolean) =>
    setEscolhas((atuais) => {
      const novas = { ...atuais };
      marcaveis.forEach((e) => (novas[e.origemId] = { ...novas[e.origemId], importar }));
      return novas;
    });

  const importar = async () => {
    if (!previa) return;
    const lotes = emLotes(selecionados, LOTE_GRAVACAO);
    const novos: Record<string, Resultado> = {};

    setProgresso(0);
    try {
      for (const [indice, lote] of lotes.entries()) {
        const response: any = await create('importacao/google-agenda/confirmar', {
          terapeutaId,
          funcaoId,
          modalidadeId,
          eventos: lote.map((e) => {
            const f = final(e);
            return {
              origemId: e.origemId,
              titulo: e.titulo,
              descricao: e.descricao,
              dataInicio: e.dataInicio,
              dataFim: e.dataFim,
              start: e.start,
              end: e.end,
              recorrente: e.recorrente,
              intervalo: e.intervalo,
              diasFrequencia: e.diasFrequencia,
              exdate: e.exdate,
              pacienteId: f.pacienteId,
              localidadeId: f.localidadeId,
              statusEventosId: f.statusEventosId,
            };
          }),
        });
        response.data.forEach((r: Resultado) => (novos[r.origemId] = r));
        setProgresso(Math.round(((indice + 1) / lotes.length) * 100));
      }
    } catch (error) {
      renderToast(
        buildErrorToast(error, 'A importação parou no meio. Os eventos já gravados continuam gravados.')
      );
    } finally {
      setResultados((atuais) => ({ ...atuais, ...novos }));
      setProgresso(null);
      setEtapa('resultado');
    }
  };

  if (etapa === 'arquivo' || !previa) {
    return (
      <div className="importacao-heron" data-testid="importar-agenda-google">
        <EtapasImportacao atual="arquivo" />
        <ArquivoImportacao
          accept=".ics,text/calendar"
          formato="Arquivo .ics de uma agenda do Google"
          carregando={carregando}
          onArquivo={escolherArquivo}
          tituloDicas="Como exportar do Google Agenda"
          dicas={[
            <>
              No Google Agenda, abra <b>Configurações › Importar e exportar › Exportar</b>.
            </>,
            <>
              O Google baixa um .zip com um .ics para cada agenda. Descompacte e escolha a agenda
              de <b>uma terapeuta</b> por vez.
            </>,
            <>
              Horários fixos viram eventos recorrentes e &quot;HORARIO VAGO&quot; fica de fora.
              Nada é gravado antes da conferência.
            </>,
          ]}
          campos={
            <label className="imp-campo">
              <span>Importar a partir de</span>
              <input
                type="date"
                value={aPartirDe}
                onChange={(e) => setAPartirDe(e.target.value || hoje())}
                className="p-inputtext p-component"
                data-testid="importacao-a-partir-de"
              />
              <small>O que terminou antes dessa data não é importado.</small>
            </label>
          }
        />
      </div>
    );
  }

  const dropdown = (
    valor: number | null,
    opcoes: Opcao[],
    onChange: (id: number | null) => void,
    props: Record<string, any> = {}
  ) => (
    <Dropdown
      value={valor}
      options={opcoes}
      optionLabel="nome"
      optionValue="id"
      filter={opcoes.length > 8}
      className="w-full"
      onChange={(e) => onChange(e.value ?? null)}
      {...props}
    />
  );

  const situacao = (evento: EventoPrevia) => {
    const resultado = resultados[evento.origemId];
    if (resultado?.situacao === 'importado') return <Pilula tom="ok">Importado</Pilula>;
    if (resultado?.situacao === 'ja_na_agenda') return <Pilula tom="neutro">Já estava na agenda</Pilula>;
    if (resultado?.situacao === 'erro')
      return (
        <>
          <Pilula tom="erro">Erro</Pilula>
          <span className="imp-mensagem">{resultado.mensagem}</span>
        </>
      );
    if (evento.problema)
      return (
        <>
          <Pilula tom="neutro">Fora da importação</Pilula>
          <span className="imp-mensagem">{evento.problema}</span>
        </>
      );
    if (evento.jaNaAgenda && !escolhas[evento.origemId]?.importar)
      return <Pilula tom="neutro">Já na agenda</Pilula>;
    if (!escolhas[evento.origemId]?.importar) return <Pilula tom="neutro">Não importar</Pilula>;
    const f = final(evento);
    if (!f.pacienteId || !f.localidadeId || !f.statusEventosId)
      return <Pilula tom="erro">Falta preencher</Pilula>;
    return <Pilula tom="pronto">Pronto</Pilula>;
  };

  const bloqueado = progresso !== null || etapa === 'resultado';
  const contagemResultado = Object.values(resultados).reduce(
    (total, r) => ({ ...total, [r.situacao]: (total[r.situacao] || 0) + 1 }),
    {} as Record<string, number>
  );
  const importados = contagemResultado.importado || 0;
  const errosResultado = contagemResultado.erro || 0;

  const rodapeInfo = () => {
    if (etapa === 'resultado') {
      return errosResultado
        ? `${plural(errosResultado, 'evento deu erro', 'eventos deram erro')}. Volte, corrija e importe de novo.`
        : '';
    }
    if (!selecionados.length) return 'Marque os eventos que vão para a agenda.';
    if (!cabecalhoCompleto) return 'Escolha terapeuta, função e tipo de atendimento.';
    if (pendencias)
      return `${plural(pendencias, 'evento marcado está', 'eventos marcados estão')} sem paciente, sala ou status.`;
    return `${plural(selecionados.length, 'evento será criado', 'eventos serão criados')} na agenda de ${terapeuta?.nome}.`;
  };
  const infoComErro =
    (etapa === 'previa' && !!selecionados.length && (!cabecalhoCompleto || !!pendencias)) ||
    (etapa === 'resultado' && !!errosResultado);

  const campo = (titulo: string, conteudo: JSX.Element) => (
    <label className="imp-campo">
      <span>{titulo}</span>
      {conteudo}
    </label>
  );

  return (
    <div className="importacao-heron" data-testid="importar-agenda-google">
      <EtapasImportacao atual={etapa} />

      {etapa === 'resultado' && (
        <div className={`imp-concluido ${errosResultado ? 'parcial' : ''}`}>
          <i className={errosResultado ? 'pi pi-exclamation-circle' : 'pi pi-check-circle'} />
          <div>
            <strong>{plural(importados, 'evento importado', 'eventos importados')}</strong>
            {contagemResultado.ja_na_agenda
              ? `${plural(contagemResultado.ja_na_agenda, 'já estava', 'já estavam')} na agenda e ${
                  contagemResultado.ja_na_agenda === 1 ? 'foi pulado' : 'foram pulados'
                }.`
              : 'Os eventos já aparecem no calendário.'}
          </div>
        </div>
      )}

      <div className="imp-cabecalho">
        <div className="imp-origem">
          <i className="pi pi-google" />
          <div>
            <strong>{previa.nomeCalendario || 'Agenda do Google'}</strong>
            <small>
              A partir de {dataBr(previa.aPartirDe)}
              {!!previa.horariosVagos &&
                ` · ${plural(previa.horariosVagos, 'horário vago ignorado', 'horários vagos ignorados')}`}
              {!!previa.ignoradosPorData &&
                ` · ${plural(previa.ignoradosPorData, 'terminou', 'terminaram')} antes da data`}
            </small>
          </div>
        </div>
        <div className="imp-resumo">
          {etapa === 'previa' ? (
            <Numero valor={selecionados.length} rotulo={`de ${eventos.length} marcados`} tom="destaque" />
          ) : (
            <Numero valor={importados} rotulo="importados" tom="ok" />
          )}
          {etapa === 'previa' && !!pendencias && (
            <Numero valor={pendencias} rotulo="falta preencher" tom="erro" />
          )}
          {etapa === 'resultado' && !!errosResultado && (
            <Numero valor={errosResultado} rotulo="com erro" tom="erro" />
          )}
        </div>
      </div>

      <div className="imp-config">
        <h4>Para todos os eventos</h4>
        <div className="imp-config-grid">
          {campo(
            'Terapeuta',
            dropdown(terapeutaId, previa.terapeutas, (id) => escolherTerapeuta(id), {
              showClear: false,
              itemTemplate: (t: Terapeuta) => `${t.nome} (${t.especialidadeNome})`,
              disabled: bloqueado,
              placeholder: 'Escolha',
              className: `w-full ${!terapeutaId ? 'p-invalid' : ''}`,
            })
          )}
          {campo(
            'Função',
            dropdown(funcaoId, funcoes, setFuncaoId, {
              disabled: bloqueado || !terapeuta,
              placeholder: terapeuta ? 'Escolha' : 'Escolha a terapeuta',
              className: `w-full ${terapeuta && !funcaoId ? 'p-invalid' : ''}`,
            })
          )}
          {campo(
            'Tipo de atendimento',
            dropdown(modalidadeId, previa.modalidades, setModalidadeId, {
              disabled: bloqueado,
              placeholder: 'Escolha',
            })
          )}
          {campo(
            'Status (quando não sugerido)',
            dropdown(statusPadraoId, previa.statusEventos, setStatusPadraoId, {
              disabled: bloqueado,
              placeholder: 'Escolha',
            })
          )}
          {campo(
            'Sala (quando não sugerida)',
            dropdown(salaPadraoId, salas, setSalaPadraoId, {
              showClear: true,
              disabled: bloqueado,
              placeholder: 'Escolha',
            })
          )}
        </div>
      </div>

      {progresso !== null && <ProgressBar value={progresso} style={{ height: '0.5rem' }} showValue={false} />}

      <div className="imp-tabela agenda">
        <DataTable
          value={eventos}
          size="small"
          dataKey="origemId"
          responsiveLayout="scroll"
          emptyMessage="Nenhum evento a partir dessa data."
          rowClassName={(e: EventoPrevia) => ({
            'imp-linha-fora':
              !!e.problema || (!escolhas[e.origemId]?.importar && !resultados[e.origemId]),
          })}
        >
          <Column
            header={
              <Checkbox
                checked={todosMarcados}
                disabled={bloqueado || !marcaveis.length}
                onChange={(c) => marcarTodos(!!c.checked)}
                aria-label="Marcar todos"
              />
            }
            style={{ width: '3.25rem' }}
            body={(e: EventoPrevia) => (
              <Checkbox
                checked={!!escolhas[e.origemId]?.importar && !e.problema}
                disabled={bloqueado || !!e.problema || concluido(e.origemId)}
                onChange={(c) => alterar(e.origemId, { importar: !!c.checked })}
              />
            )}
          />
          <Column
            header="Quando"
            style={{ width: '11rem' }}
            body={(e: EventoPrevia) => (
              <div className="imp-quando">
                <strong>{e.recorrente ? 'Recorrente' : 'Único'}</strong>
                <span>{quandoAcontece(e)}</span>
              </div>
            )}
          />
          <Column
            header="No Google"
            style={{ width: '14rem' }}
            body={(e: EventoPrevia) => (
              <div className="imp-google" title={e.descricao}>
                {e.titulo}
                {e.local && <span>{e.local}</span>}
              </div>
            )}
          />
          <Column
            header="Paciente"
            style={{ width: '18rem' }}
            body={(e: EventoPrevia) =>
              dropdown(
                escolhas[e.origemId]?.pacienteId ?? null,
                previa.pacientes,
                (id) => alterar(e.origemId, { pacienteId: id }),
                {
                  filter: true,
                  disabled: bloqueado || !!e.problema || concluido(e.origemId),
                  placeholder: e.nomeNoTitulo ? `Não achei "${e.nomeNoTitulo}"` : 'Escolha',
                  virtualScrollerOptions: { itemSize: 38 },
                  className: `w-full ${
                    escolhas[e.origemId]?.importar && !escolhas[e.origemId]?.pacienteId && !e.problema
                      ? 'p-invalid'
                      : ''
                  }`,
                }
              )
            }
          />
          <Column
            header="Sala"
            style={{ width: '13rem' }}
            body={(e: EventoPrevia) =>
              dropdown(
                escolhas[e.origemId]?.localidadeId ?? null,
                salas,
                (id) => alterar(e.origemId, { localidadeId: id }),
                {
                  disabled: bloqueado || !!e.problema || concluido(e.origemId),
                  placeholder: salaPadraoId
                    ? salas.find((s) => s.id === salaPadraoId)?.nome
                    : 'Escolha',
                }
              )
            }
          />
          <Column
            header="Status"
            style={{ width: '12rem' }}
            body={(e: EventoPrevia) =>
              dropdown(
                escolhas[e.origemId]?.statusEventosId ?? null,
                previa.statusEventos,
                (id) => alterar(e.origemId, { statusEventosId: id }),
                {
                  disabled: bloqueado || !!e.problema || concluido(e.origemId),
                  placeholder: statusPadraoId
                    ? previa.statusEventos.find((s) => s.id === statusPadraoId)?.nome
                    : 'Escolha',
                }
              )
            }
          />
          <Column header="Situação" style={{ width: '9rem' }} body={situacao} />
        </DataTable>
      </div>

      <div className="imp-rodape">
        <span className={`imp-rodape-info ${infoComErro ? 'erro' : ''}`}>{rodapeInfo()}</span>
        <div className="imp-rodape-botoes">
          {etapa === 'previa' ? (
            <>
              <ButtonHeron
                text="Trocar arquivo"
                icon="pi pi-arrow-left"
                type="outline"
                size="full"
                htmlType="button"
                disabled={progresso !== null}
                onClick={() => setEtapa('arquivo')}
              />
              <ButtonHeron
                text={`Importar ${plural(selecionados.length, 'evento', 'eventos')}`}
                icon="pi pi-check"
                type="primary"
                size="full"
                htmlType="button"
                loading={progresso !== null}
                disabled={!selecionados.length || !cabecalhoCompleto || !!pendencias}
                onClick={importar}
                testId="importar-agenda-confirmar"
              />
            </>
          ) : (
            <>
              {!!errosResultado && (
                <ButtonHeron
                  text="Voltar e corrigir"
                  icon="pi pi-arrow-left"
                  type="outline"
                  size="full"
                  htmlType="button"
                  onClick={() => setEtapa('previa')}
                />
              )}
              <ButtonHeron
                text="Fechar"
                icon="pi pi-check"
                type="primary"
                size="full"
                htmlType="button"
                onClick={() => onClose(importados > 0)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
