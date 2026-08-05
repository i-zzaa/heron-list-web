type Listener = () => void;

let listener: Listener | null = null;

// Pequena ponte entre código fora da árvore React (o helper de erro de
// requisição, usado em módulos que não têm acesso a contexto/hooks) e o
// AuthProvider. Permite que um 403 de "troca de senha obrigatória",
// recebido em qualquer chamada da API já autenticada, force a exibição da
// tela de troca de senha mesmo quando o gatilho não veio do login (ex:
// token antigo ainda em uso quando um admin reseta a senha desse usuário
// no meio da sessão). Ver buildErrorToast em util/error.ts.
export const registerMustChangePasswordListener = (fn: Listener | null) => {
  listener = fn;
};

export const notifyMustChangePasswordRequired = () => {
  listener?.();
};
