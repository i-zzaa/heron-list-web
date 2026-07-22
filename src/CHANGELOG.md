[0.11.0-beta.1]
Refatoracao do projeto
Ajuste de seguranca hardening
Ajuste de assets em prd
Ajuste no COMPONENTE DE CALENDARIO
Data default no filtro do financeiro

[0.11.0-beta.0]
Relatório das alterações
Implementamos um novo módulo de consulta e acompanhamento de guias Amil no frontend, sem impactar o fluxo existente das telas já presentes.

O que foi entregue
Nova tela de guias Amil em AmilGuides.tsx

filtro por número, protocolo, status e período
cards de resumo
lista das guias
modal com detalhes
ação de reenviar guia
Integração com navegação e permissões:

rota guias-amil adicionada em OtherRoutes.tsx
menu lateral atualizado em Nav.tsx
Conexão com o backend via camada de servidor em index.ts

consulta: guia-amil/filtro
ação: guia-amil/:id/reenviar
Ajustes menores de tipagem para manter a aplicação estável:

index.tsx
index.tsx


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
