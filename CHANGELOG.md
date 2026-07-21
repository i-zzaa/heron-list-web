[0.10.0-beta.0]
1. Correção de erros por dados ausentes
Foram adicionadas proteções para evitar que campos nulos ou indefinidos quebrassem a renderização da lista de pacientes e o fluxo de edição.

Lista de pacientes passou a funcionar mesmo quando faltam dados como vaga, especialidades ou convenio.
A função de montar o objeto do paciente para edição ficou mais resiliente.
O modal de cadastro/edição agora consegue abrir com dados parciais sem causar crash.
2. Ajustes no fluxo de formulários
Os principais fluxos de submit e loading foram padronizados para evitar inconsistências e comportamentos duplicados.

Submit passou a encerrar o estado de carregamento corretamente em sucesso e erro.
Botões de formulário foram alinhados para não dispararem múltiplas vezes.
O carregamento agora fica mais estável em telas como login, cadastro, agendamento e CRUD.
3. Tratamento mais seguro de dropdowns e requisições
As chamadas de dropdown e outras requisições assíncronas foram protegidas para não quebrar a tela quando alguma resposta falhar.

Erros de dropdown não derrubam mais a interface.
Requisições passaram a tratar falhas de forma mais segura.
4. Redução de requisições duplicadas
Foi identificado que a duplicação vinha do StrictMode do React em ambiente de desenvolvimento.

O StrictMode foi removido do bootstrap da aplicação em main.tsx, reduzindo a execução dupla de efeitos e requisições na montagem.
5. Ajustes específicos na tela de pacientes
A tela de pacientes recebeu melhorias para manter a experiência mesmo com dados incompletos.

A listagem de pacientes continua aparecendo.
Ações de agendamento e edição passaram a verificar se há dados de vaga antes de tentar acessar campos internos.
O componente de lista ficou mais robusto para exibir tags e informações opcionais sem erro.
