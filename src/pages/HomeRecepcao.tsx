import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getList } from '../server';
import { permissionAuth } from '../contexts/permission';
import { useToast } from '../contexts/toast';
import { buildErrorToast } from '../util/error';
import { Painel, Vazio } from './Dashboard';

// Home da recepção (secretária): o que precisa dela hoje, recortado pelas
// unidades do cadastro (GET /recepcao/*). Cada bloco tem a própria tag —
// HOME_RECEPCAO_BAIXAS, HOME_RECEPCAO_ATENCAO, HOME_RECEPCAO_ANIVERSARIANTES
// — e a visão inteira depende de HOME_RECEPCAO (ver Home.tsx).

interface BaixasPendentes {
  total: number;
  hoje: number;
  ontem: number;
  doisATresDias: number;
  maisDeTresDias: number;
}

interface ItemAtencao {
  tipo: 'conflito-agenda' | 'ticket' | 'documentos-vencendo' | 'avisar-hoje' | string;
  titulo: string;
  descricao: string;
  quantidade: number;
}

interface Aniversariante {
  pacienteId: number;
  nome: string;
  data: string;
  idade: number;
  hoje: boolean;
  atendimentoHoje: { horario: string; sala: string | null } | null;
}

// Agenda tem duas abas (Agenda, Baixa) e guarda a ativa no sessionStorage
// (usePersistedTabIndex): gravar antes de navegar abre direto na certa.
const ABA_AGENDA = 'tab-index-agenda';

const diaDaSemana = (iso: string) => {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const texto = new Date(ano, mes - 1, dia)
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '')
    .replace(',', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export default function HomeRecepcao({ unidadeId }: { unidadeId?: number }) {
  const { hasPermition } = permissionAuth();
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const pode = (tag: string) => Boolean(hasPermition(tag));

  const [baixas, setBaixas] = useState<BaixasPendentes | null>(null);
  const [atencao, setAtencao] = useState<ItemAtencao[]>([]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const query = unidadeId ? `?unidadeId=${unidadeId}` : '';

    const carregar = async (tag: string, endpoint: string, aplicar: (raw: any) => void) => {
      if (!hasPermition(tag)) return;
      try {
        const raw = await getList(`${endpoint}${query}`);
        if (!cancelado) aplicar(raw);
      } catch (error) {
        if (!cancelado) {
          renderToast(buildErrorToast(error, 'Não foi possível carregar a visão da recepção.'));
        }
      }
    };

    setCarregando(true);
    Promise.allSettled([
      carregar('HOME_RECEPCAO_BAIXAS', '/recepcao/baixas-pendentes', setBaixas),
      carregar('HOME_RECEPCAO_ATENCAO', '/recepcao/atencao', (raw) =>
        setAtencao(Array.isArray(raw) ? raw : [])
      ),
      carregar('HOME_RECEPCAO_ANIVERSARIANTES', '/recepcao/aniversariantes', (raw) =>
        setAniversariantes(Array.isArray(raw) ? raw : [])
      ),
    ]).then(() => !cancelado && setCarregando(false));

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadeId]);

  const abrirAgenda = (aba: 'agenda' | 'baixa') => {
    // Índice entre as abas que a pessoa enxerga: sem a de Agenda, Baixa é a 0.
    const indice = aba === 'baixa' && pode('AGENDA_CALENDARIO') ? 1 : 0;
    try {
      sessionStorage.setItem(ABA_AGENDA, String(indice));
    } catch {
      // sessionStorage indisponível: abre na aba que estiver salva.
    }
    navigate('/agenda');
  };

  // Botão/link só aparece com a permissão da rota (mesma regra dos atalhos
  // do topo); para a aba Baixa, também a da aba.
  const podeBaixa = pode('agenda') && pode('AGENDA_BAIXA');

  const destinoDoItem = (item: ItemAtencao): (() => void) | null => {
    if (item.tipo === 'ticket') return podeBaixa ? () => abrirAgenda('baixa') : null;
    if (item.tipo === 'documentos-vencendo') {
      return pode('relatorios') ? () => navigate('/relatorios') : null;
    }
    return pode('agenda') ? () => abrirAgenda('agenda') : null;
  };

  const deHoje = aniversariantes.filter((a) => a.hoje);
  const daSemana = aniversariantes.filter((a) => !a.hoje);
  const faixasBaixa = baixas
    ? [
        { rotulo: 'de hoje', valor: baixas.hoje, alerta: false },
        { rotulo: 'de ontem', valor: baixas.ontem, alerta: false },
        { rotulo: 'de 2 a 3 dias', valor: baixas.doisATresDias, alerta: false },
        { rotulo: 'há mais de 3 dias', valor: baixas.maisDeTresDias, alerta: true },
      ].filter((faixa) => faixa.valor > 0)
    : [];

  return (
    <div className="home-recepcao" data-testid="home-recepcao">
      <div className="home-secao">
        <div>
          <h2>Visão da recepção</h2>
          <small>
            O que precisa de você hoje
            {carregando && <i className="pi pi-spin pi-spinner home-atualizando" />}
          </small>
        </div>
      </div>

      {pode('HOME_RECEPCAO_BAIXAS') && baixas && (
        <section className="rec-baixas" aria-label="Baixas pendentes">
          <div className="rec-baixas-total">
            <span className="rec-baixas-numero">{baixas.total}</span>
            <div>
              <h3>Baixas pendentes</h3>
              <small>
                {baixas.total
                  ? 'Sessões que já aconteceram e ainda não tiveram baixa'
                  : 'Nenhuma baixa pendente. Tudo em dia!'}
              </small>
            </div>
          </div>
          <div className="rec-baixas-faixas">
            {faixasBaixa.map((faixa) => (
              <span key={faixa.rotulo} className={`rec-faixa ${faixa.alerta ? 'alerta' : ''}`}>
                <b>{faixa.valor}</b> {faixa.rotulo}
              </span>
            ))}
            {!!baixas.total && podeBaixa && (
              <button type="button" className="rec-botao" onClick={() => abrirAgenda('baixa')}>
                Dar baixa
              </button>
            )}
          </div>
        </section>
      )}

      <div className="rec-grade">
        {pode('HOME_RECEPCAO_ATENCAO') && (
          <Painel
            icon="pi pi-bell"
            titulo="Precisa da sua atenção"
            subtitulo="Resolva por aqui, sem procurar em cada tela"
            className="rec-atencao"
          >
            {atencao.length ? (
              <div className="rec-lista">
                {atencao.map((item) => {
                  const abrir = destinoDoItem(item);
                  const conteudo = (
                    <>
                      <span className="rec-item-texto">
                        <b>{item.titulo}</b>
                        <small>{item.descricao}</small>
                      </span>
                      <span className="rec-item-qtd">{item.quantidade}</span>
                    </>
                  );
                  const classe = `rec-item ${item.tipo === 'conflito-agenda' ? 'alerta' : ''}`;
                  return abrir ? (
                    <button
                      key={`${item.tipo}-${item.titulo}`}
                      type="button"
                      className={classe}
                      onClick={abrir}
                    >
                      {conteudo}
                    </button>
                  ) : (
                    <div key={`${item.tipo}-${item.titulo}`} className={classe}>
                      {conteudo}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Vazio texto="Nada pendente por aqui" />
            )}
          </Painel>
        )}

        {pode('HOME_RECEPCAO_ANIVERSARIANTES') && (
          <Painel
            icon="pi pi-gift"
            titulo="Aniversariantes da semana"
            subtitulo="Pacientes em atendimento"
            className="rec-aniversariantes"
          >
            {aniversariantes.length ? (
              <div className="rec-lista">
                {deHoje.map((a) => (
                  <div key={a.pacienteId} className="rec-aniversario-hoje">
                    <i className="pi pi-gift" aria-hidden="true" />
                    <div>
                      <span className="rec-aniversario-rotulo">Hoje</span>
                      <b>{a.nome}</b>
                      <small>
                        faz {a.idade} {a.idade === 1 ? 'ano' : 'anos'}
                        {a.atendimentoHoje &&
                          ` · atende às ${a.atendimentoHoje.horario}${
                            a.atendimentoHoje.sala ? ` (${a.atendimentoHoje.sala})` : ''
                          }`}
                      </small>
                    </div>
                  </div>
                ))}
                {daSemana.map((a) => (
                  <div key={a.pacienteId} className="rec-aniversario">
                    <span>
                      <b>{a.nome}</b> · {a.idade} {a.idade === 1 ? 'ano' : 'anos'}
                    </span>
                    <small>{diaDaSemana(a.data)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <Vazio texto="Nenhum aniversário nesta semana" />
            )}
          </Painel>
        )}
      </div>
    </div>
  );
}
