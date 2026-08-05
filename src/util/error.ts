import { notifyMustChangePasswordRequired } from './mustChangePasswordBus';

const DEFAULT_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente.';

// Mensagem fixa que o backend devolve em qualquer rota com tag de permissão
// enquanto mustChangePassword estiver true para o usuário do token (ver
// §2.5 do contrato: "Troca de senha obrigatória antes de continuar. Use PUT
// /usuarios/reset-senha."). Casado por substring (case-insensitive) em vez
// de string exata pra não quebrar se o backend ajustar pontuação/sufixo.
const MUST_CHANGE_PASSWORD_MESSAGE_HINT = 'troca de senha obrigat';

const isMustChangePasswordError = (error: any): boolean => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  return (
    status === 403 &&
    typeof message === 'string' &&
    message.toLowerCase().includes(MUST_CHANGE_PASSWORD_MESSAGE_HINT)
  );
};

export interface ErrorInfo {
  code: string;
  message: string;
}

// Extrai código e mensagem de erro vindos do backend a partir de um erro do
// axios (error.response.data / error.response.status). Cobre também erros
// sem resposta do servidor (falha de rede) usando error.message como
// fallback, e nunca deixa a mensagem em branco.
export const getErrorInfo = (
  error: any,
  fallbackMessage: string = DEFAULT_ERROR_MESSAGE
): ErrorInfo => {
  const response = error?.response;
  const data = response?.data;

  const backendMessage =
    (typeof data === 'string' ? data : undefined) ||
    data?.message ||
    data?.mensagem ||
    data?.error ||
    data?.erro ||
    (typeof data?.data === 'string' ? data.data : undefined);

  const message = backendMessage || error?.message || fallbackMessage;

  const code =
    data?.codigo ?? data?.code ?? data?.errorCode ?? response?.status ?? '';

  return {
    code: code === undefined || code === null ? '' : String(code),
    message,
  };
};

// Monta diretamente o payload esperado por renderToast, já com o código de
// erro do backend como título e a mensagem do backend como corpo.
//
// Caso especial: se o erro for o 403 de troca de senha obrigatória pendente
// (§2.5), não mostra o toast genérico de "sem permissão" — em vez disso,
// avisa o AuthProvider (via mustChangePasswordBus) para redirecionar à tela
// de troca de senha, que já deixa claro o motivo. O toast retornado fica
// com open:false para que os call sites (que sempre fazem
// `renderToast(buildErrorToast(...))`) não precisem de nenhuma mudança.
export const buildErrorToast = (
  error: any,
  fallbackMessage?: string
): { type: 'failure'; title: string; message: string; open: boolean } => {
  const { code, message } = getErrorInfo(error, fallbackMessage);

  if (isMustChangePasswordError(error)) {
    notifyMustChangePasswordRequired();

    return {
      type: 'failure',
      title: code || 'Erro',
      message,
      open: false,
    };
  }

  return {
    type: 'failure',
    title: code || 'Erro',
    message,
    open: true,
  };
};
