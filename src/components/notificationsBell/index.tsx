import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayPanel } from 'primereact/overlaypanel';
import { getList } from '../../server';
import { formatdate } from '../../util/util';
import { resolveResponseData } from '../../util/pagination';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { registerDocumentAlertsListener } from '../../util/documentAlertsBus';

// Cada notificação é identificada por paciente + tipo de documento + data de
// vencimento — é o que a distingue de uma vez pra outra (se a data de
// vencimento mudar, é um vencimento novo, então conta como não visualizada
// de novo).
const alertKey = (alerta: any) =>
  `${alerta.pacienteId}-${alerta.tipo}-${alerta.dataVencimento}`;

// "Visualizada" é conceito só do front (o backend não guarda isso): fica
// salvo no localStorage do navegador, então some se o usuário limpar os
// dados do site, mas persiste entre sessões normalmente.
const SEEN_ALERTS_STORAGE_KEY = 'notificationsBell:seenAlerts';

const readSeenAlertKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SEEN_ALERTS_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (error) {
    return new Set();
  }
};

const writeSeenAlertKeys = (keys: Set<string>) => {
  try {
    localStorage.setItem(SEEN_ALERTS_STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch (error) {
    // localStorage indisponível (aba anônima, storage cheio etc.) — o sino
    // segue funcionando, só sem lembrar quem já foi visualizado.
  }
};

// `tipo` vem como "plano_terapeutico" / "laudo_medico" — só isso, sem
// envelope de rótulo pronto (ver GET /paciente/documentos-vencendo).
const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  plano_terapeutico: 'Plano Terapêutico',
  laudo_medico: 'Laudo Médico',
};

// Sino de notificações fixo no topo direito, presente em toda a aplicação
// (renderizado uma vez, junto do shell de rotas — não em cada página).
// Hoje mostra só os avisos de Plano/Laudo vencendo; a ideia é esse mesmo
// painel ir recebendo outros tipos de notificação nas próximas etapas, sem
// mudar onde o sino mora nem como ele abre.
export const NotificationsBell = () => {
  const overlayRef = useRef<OverlayPanel>(null);
  const navigate = useNavigate();

  // O backend já devolve a lista pronta (quem, qual documento, quando
  // vence, se já venceu) — o front só soma quantos itens vieram e mostra a
  // lista. Resposta é um array puro (sem `{ data: [...] }`), daí o
  // resolveResponseData — ele já trata Array.isArray antes de tentar
  // `.data`.
  const [documentAlerts, setDocumentAlerts] = useState<any[]>([]);
  const [seenAlertKeys, setSeenAlertKeys] = useState<Set<string>>(() => readSeenAlertKeys());

  const loadDocumentAlerts = useCallback(async () => {
    try {
      const response = await getList('paciente/documentos-vencendo');
      setDocumentAlerts(resolveResponseData(response) || []);
    } catch (error) {
      // Endpoint pode não existir ainda / usuário pode não ter permissão
      // pra isso — nesses casos a lista fica vazia, mas o sino continua
      // aparecendo (sem notificação nenhuma).
      setDocumentAlerts([]);
    }
  }, []);

  useEffect(() => {
    loadDocumentAlerts();

    // Depois de criar/atualizar um paciente (em qualquer tela — Cadastro,
    // Avaliação, Terapia, Devolutiva), o formulário avisa por esse bus.
    // Sem isso, atualizar a data de emissão do Plano/Laudo (resolvendo o
    // vencimento) não tirava o aviso da tela até recarregar a página.
    registerDocumentAlertsListener(loadDocumentAlerts);
    return () => registerDocumentAlertsListener(null);
  }, [loadDocumentAlerts]);

  const unseenCount = documentAlerts.filter(
    (alerta) => !seenAlertKeys.has(alertKey(alerta))
  ).length;

  // Ao abrir o painel o usuário já viu a lista inteira — marca tudo que
  // está sendo exibido agora como visualizado, então o badge só volta a
  // contar vencimentos que ainda não apareceram pra esse usuário.
  const handleShow = () => {
    setSeenAlertKeys((previous) => {
      const updated = new Set(previous);
      documentAlerts.forEach((alerta) => updated.add(alertKey(alerta)));
      writeSeenAlertKeys(updated);
      return updated;
    });
  };

  // Leva pro cadastro do paciente já filtrado por ele (Patient.tsx lê
  // `pacienteId` da URL e abre o formulário de edição sozinho).
  const handleClickAlert = (alerta: any) => {
    overlayRef.current?.hide();
    navigate(`/${CONSTANTES_ROUTERS.CRUD}?pacienteId=${alerta.pacienteId}`);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Notificações"
        data-testid="notifications-bell-button"
        className="fixed top-[0.5rem] right-[1.5rem] z-50 w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 duration-200"
        onClick={(e) => overlayRef.current?.toggle(e)}
      >
        <i className="pi pi-bell text-violet-800 text-lg" />
        {unseenCount > 0 && (
          <span
            data-testid="notifications-bell-badge"
            className="absolute top-[2px] left-[0.25rem] bg-red-400 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center"
          >
            {unseenCount}
          </span>
        )}
      </button>

      {/* OverlayPanel do PrimeReact já se posiciona logo abaixo do elemento
          que disparou o toggle — é o "modal embaixo dele" pedido. */}
      <OverlayPanel ref={overlayRef} onShow={handleShow} data-testid="notifications-panel">
        <div className="w-72">
          <p className="text-sm font-semibold text-violet-800 mb-2">
            Notificações
          </p>

          {documentAlerts.length === 0 ? (
            <p className="text-xs text-gray-400">
              Nenhuma notificação no momento.
            </p>
          ) : (
            <ul className="text-sm space-y-1 max-h-72 overflow-y-auto">
              {documentAlerts.map((alerta: any) => (
                <li key={`${alerta.pacienteId}-${alerta.tipo}`}>
                  <button
                    type="button"
                    onClick={() => handleClickAlert(alerta)}
                    className="block w-full text-left rounded-md px-2 py-2 -mx-2 hover:bg-gray-200 duration-150"
                  >
                    <span className="block font-medium text-gray-800">
                      {alerta.pacienteNome}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {TIPO_DOCUMENTO_LABEL[alerta.tipo] || alerta.tipo}
                      {' • '}
                      {alerta.vencido ? 'vencido em' : 'vence em'}{' '}
                      {formatdate(alerta.dataVencimento)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </OverlayPanel>
    </>
  );
};
