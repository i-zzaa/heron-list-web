import { ReactNode } from 'react';
import { LoadingHeron } from '../../components/loading';

// Peças da tela de Cadastros (pages/Crud.tsx): cabeçalho de cada seção e a
// lista em linhas. As ações usam os mesmos ícones de antes (pi-pencil,
// pi-trash, pi-replay), que os testes e2e procuram.

export interface SecaoCadastro {
  titulo: string;
  descricao: string;
  icone: string;
}

export function CabecalhoCadastro({
  secao,
  acoes,
}: {
  secao: SecaoCadastro;
  acoes?: ReactNode;
}) {
  return (
    <header className="cad-cabecalho">
      <div className="cad-cabecalho-titulo">
        <span className="cad-cabecalho-icone">
          <i className={secao.icone} />
        </span>
        <div>
          <h1>{secao.titulo}</h1>
          <p>{secao.descricao}</p>
        </div>
      </div>
      {acoes && <div className="cad-cabecalho-acoes">{acoes}</div>}
    </header>
  );
}

export interface AcaoLinha {
  icone: string;
  rotulo: string;
  onClick: () => void;
  // Ação principal da linha aparece com o texto; as demais só com o ícone
  // (o rótulo vira tooltip e aria-label).
  comTexto?: boolean;
  perigo?: boolean;
}

export interface EtiquetaLinha {
  texto: string;
  cor?: string;
  pendente?: boolean;
  onClick?: () => void;
}

export const iniciais = (nome?: string) =>
  (nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') || '?';

export function LinhaCadastro({
  titulo,
  avatar,
  corAvatar,
  selos = [],
  detalhes = [],
  etiquetas = [],
  inativo = false,
  acoes = [],
}: {
  titulo: string;
  // Texto do círculo (iniciais) — ou um ícone, quando a entidade não é pessoa.
  avatar?: ReactNode;
  // Cor cadastrada (especialidade, status): no lugar do avatar, um ponto dessa cor.
  corAvatar?: string;
  selos?: { texto: string; destaque?: boolean }[];
  detalhes?: { icone?: string; texto: ReactNode }[];
  etiquetas?: EtiquetaLinha[];
  inativo?: boolean;
  acoes?: AcaoLinha[];
}) {
  return (
    <li className={`cad-linha ${inativo ? 'inativa' : ''}`}>
      <span className={`cad-avatar ${corAvatar ? 'cor' : ''}`} aria-hidden>
        {corAvatar ? (
          <span className="cad-avatar-ponto" style={{ background: corAvatar }} />
        ) : (
          avatar ?? iniciais(titulo)
        )}
      </span>

      <div className="cad-linha-corpo">
        <div className="cad-linha-titulo">
          <span>{titulo}</span>
          {selos.map((selo) => (
            <span
              key={selo.texto}
              className={`cad-selo ${selo.destaque ? 'destaque' : ''}`}
            >
              {selo.texto}
            </span>
          ))}
          {inativo && <span className="cad-selo inativo">Inativo</span>}
        </div>

        {detalhes.some((d) => d.texto) && (
          <div className="cad-detalhes">
            {detalhes
              .filter((d) => d.texto)
              .map((detalhe, indice) => (
                <span key={indice}>
                  {detalhe.icone && <i className={detalhe.icone} />}
                  {detalhe.texto}
                </span>
              ))}
          </div>
        )}

        {!!etiquetas.length && (
          <div className="cad-etiquetas">
            {etiquetas.map((etiqueta, indice) => {
              const conteudo = (
                <>
                  <span
                    className="ponto"
                    style={{ background: etiqueta.cor || '#a1a1aa' }}
                  />
                  {etiqueta.texto}
                </>
              );
              const classe = `cad-etiqueta ${etiqueta.pendente ? 'pendente' : ''}`;
              return etiqueta.onClick ? (
                <button
                  key={indice}
                  type="button"
                  className={classe}
                  onClick={etiqueta.onClick}
                  title={etiqueta.pendente ? 'Ainda não agendada' : 'Agendada'}
                >
                  {conteudo}
                </button>
              ) : (
                <span key={indice} className={classe}>
                  {conteudo}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {!!acoes.length && (
        <div className="cad-acoes">
          {acoes.map((acao) => (
            <button
              key={acao.rotulo}
              type="button"
              className={`cad-acao ${acao.perigo ? 'perigo' : ''} ${acao.comTexto ? 'com-texto' : ''}`}
              onClick={acao.onClick}
              title={acao.rotulo}
              aria-label={acao.rotulo}
            >
              <i className={acao.icone} />
              {acao.comTexto && <span>{acao.rotulo}</span>}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

export function ListaCadastro({
  loading,
  total,
  rotuloTotal,
  vazio,
  rodape,
  children,
}: {
  loading: boolean;
  total?: number;
  rotuloTotal: [string, string];
  vazio: string;
  rodape?: ReactNode;
  children: ReactNode[];
}) {
  const quantidade = total ?? children.length;

  return (
    <section className="cad-lista">
      {!loading && !!children.length && (
        <div className="cad-lista-topo">
          <span>
            <b>{quantidade}</b>{' '}
            {quantidade === 1 ? rotuloTotal[0] : rotuloTotal[1]}
          </span>
        </div>
      )}

      {loading ? (
        <div className="cad-vazio">
          <LoadingHeron />
        </div>
      ) : children.length ? (
        <ul className="cad-linhas">{children}</ul>
      ) : (
        <div className="cad-vazio">
          <i className="pi pi-inbox" />
          {vazio}
        </div>
      )}

      {!loading && rodape && <div className="cad-paginacao">{rodape}</div>}
    </section>
  );
}
