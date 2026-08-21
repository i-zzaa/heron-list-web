type Listener = () => void;

let listener: Listener | null = null;

// Mesma ideia do mustChangePasswordBus: uma ponte simples entre os
// formulários de paciente (que ficam bem fundo na árvore, longe do sino) e
// o NotificationsBell (montado uma única vez, junto do shell de rotas).
// Depois de criar/atualizar um paciente — o que pode ter alterado a data de
// emissão do Plano/Laudo — o sino precisa buscar a lista de novo, senão o
// aviso continua na tela mesmo já resolvido.
export const registerDocumentAlertsListener = (fn: Listener | null) => {
  listener = fn;
};

export const notifyDocumentAlertsMightHaveChanged = () => {
  listener?.();
};
