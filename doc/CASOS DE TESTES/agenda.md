Documento de Caso de Teste / Caso de Uso
Testes Automatizados Regressivos — Agenda
1. Identificação

Nome do caso de uso: Validar fluxo regressivo da Agenda
Módulo: Agenda
Tipo de teste: Automatizado regressivo / E2E
Perfil do usuário: Usuário autenticado com permissão para criar e editar agendamentos
Objetivo: Garantir que os principais fluxos da Agenda continuem funcionando após alterações no sistema, validando criação, recorrência, edição, alteração de status e exibição correta dos eventos no calendário.

2. Contexto

A Agenda possui regras de negócio complexas relacionadas à criação de eventos, recorrência, status de atendimento, cobrança e edição de eventos atuais ou futuros.

O teste deve simular o comportamento real de um usuário, garantindo que:

o evento seja criado corretamente;
a recorrência respeite o intervalo selecionado;
a edição de evento atual não altere eventos futuros;
a edição de evento atual e futuros altere corretamente a recorrência;
não existam eventos duplicados;
os status com cobrar = true e cobrar = false sejam tratados corretamente;
os eventos apareçam visualmente corretos na agenda.
3. Pré-condições

Antes de iniciar os testes:

O usuário deve estar autenticado no sistema.
O usuário deve possuir permissão para acessar a Agenda.
O backend deve estar disponível em:
http://localhost:3001
Os dropdowns obrigatórios devem retornar dados válidos.
A página da Agenda deve estar acessível.
O calendário deve estar carregando eventos corretamente.
O teste deve iniciar sempre com o status:
Avisar
4. Dados utilizados no teste
4.1 Status de eventos

Endpoint:

GET /api/status-eventos/dropdown

Dados relevantes:

Status	Cobrar
Avisar	false
Atendido	true
Falta	true
Cancelado s/ Antecedência	true
Confirmado	false
Atestado	false
Cancelado c/ Antecedência	false
Cancelado Clínica	false
Cancelado Terapeuta	false
Feriado	false
Terapeuta de Férias	false

Regra obrigatória:

Todo cenário deve iniciar com Status Eventos = Avisar

Durante as edições, o teste deve validar pelo menos:

1 status com cobrar = true
1 status com cobrar = false
1 status Atendido
1 status Cancelado
4.2 Modalidades

Endpoint:

GET /api/modalidade/dropdown?statusPacienteCod=therapy

Modalidades a serem testadas:

Avaliação
Devolutiva
Terapia

Todos os cenários devem ser executados para cada modalidade.

4.3 Frequência

Endpoint:

GET /api/frequencia/dropdown

Frequência usada no cenário principal:

Recorrente
4.4 Localidade

Endpoint:

GET /api/localidade/dropdown

Valor usado:

Casa 1 - Sala Rei Leão
4.5 Função

Endpoint:

GET /api/funcao/dropdown

Valor usado:

Acompanhante Terapêutica
4.6 Terapeuta

Endpoint:

GET /api/terapeuta/dropdown

Valor usado:

ALDA CARRARA
4.7 Intervalos

Endpoint:

GET /api/intervalo/dropdown

Intervalos a serem testados:

Todas Semanas
2 Semanas
3 Semanas
5. Matriz de cenários

O teste deve ser executado para todas as combinações abaixo:

Cenário	Modalidade	Intervalo
01	Avaliação	Todas Semanas
02	Avaliação	2 Semanas
03	Avaliação	3 Semanas
04	Devolutiva	Todas Semanas
05	Devolutiva	2 Semanas
06	Devolutiva	3 Semanas
07	Terapia	Todas Semanas
08	Terapia	2 Semanas
09	Terapia	3 Semanas
6. Caso de uso principal
UC-01 — Criar agendamento recorrente na Agenda
Ator principal

Usuário autenticado.

Objetivo

Criar um agendamento recorrente na Agenda e validar se os eventos foram exibidos corretamente no calendário.

Fluxo principal
O usuário acessa a página de Agenda.
O usuário clica em Novo Agendamento.
O sistema exibe o formulário de cadastro.
O usuário preenche os campos obrigatórios.
O usuário seleciona a modalidade conforme a matriz de teste.
O usuário seleciona a frequência Recorrente.
O usuário seleciona o intervalo conforme a matriz de teste.
O usuário seleciona o dia da semana Segunda-feira.
O usuário seleciona o status inicial Avisar.
O usuário salva o agendamento.
O sistema cria o evento e suas recorrências.
O sistema exibe os eventos no calendário.
Dados padrão do cadastro
Data inicial: 2026-08-03
Hora inicial: 08:00
Hora final: 09:00
Frequência: Recorrente
Dia da semana: Segunda-feira
Quantidade semanal: 1x
Status Eventos: Avisar
Localidade: Casa 1 - Sala Rei Leão
Função: Acompanhante Terapêutica
Terapeuta: ALDA CARRARA
Resultado esperado

O sistema deve:

- Criar o evento na data correta.
- Criar o evento no horário correto.
- Exibir o evento na Agenda.
- Exibir as recorrências nas datas corretas.
- Não duplicar evento no mesmo slot.
- Criar todos os eventos inicialmente com status Avisar.
7. Validação da recorrência

A data inicial fixa será:

2026-08-03

Essa data representa uma segunda-feira.

Para intervalo “Todas Semanas”

Eventos esperados:

2026-08-03
2026-08-10
2026-08-17
2026-08-24
Para intervalo “2 Semanas”

Eventos esperados:

2026-08-03
2026-08-17
2026-08-31
2026-09-14
Para intervalo “3 Semanas”

Eventos esperados:

2026-08-03
2026-08-24
2026-09-14
2026-10-05
Resultado esperado

Para cada intervalo, o teste deve validar:

- Os eventos aparecem exatamente nas datas esperadas.
- Os eventos aparecem no horário configurado.
- Não há evento em datas fora da recorrência esperada.
- Não há duplicidade de evento no mesmo dia e horário.
8. Casos de teste detalhados
CT-01 — Criar agendamento recorrente com status inicial Avisar
Objetivo

Garantir que o usuário consiga criar um agendamento recorrente iniciando com status Avisar.

Passos
Acessar a Agenda.
Clicar em Novo Agendamento.
Preencher os dados obrigatórios.
Selecionar uma modalidade da matriz.
Selecionar frequência Recorrente.
Selecionar um intervalo da matriz.
Selecionar segunda-feira.
Selecionar status Avisar.
Salvar.
Resultado esperado
- Evento criado com sucesso.
- Evento exibido na Agenda.
- Recorrência criada corretamente.
- Todos os eventos iniciam com status Avisar.
- Não existe duplicidade no slot inicial.
CT-02 — Editar somente o evento atual alterando modalidade
Objetivo

Validar que a opção Atual altera apenas o evento selecionado.

Pré-condição

O agendamento recorrente deve existir na Agenda.

Passos
Selecionar o primeiro evento da recorrência.
Clicar em editar.
Alterar a modalidade para outra diferente da original.
Selecionar a opção Atual.
Salvar.
Resultado esperado
- Apenas o evento atual é alterado.
- Os eventos futuros permanecem com a modalidade original.
- O evento atual permanece na mesma data.
- O evento atual permanece no mesmo horário.
- Não existe duplicidade no slot atual.
CT-03 — Editar evento atual e eventos futuros alterando modalidade
Objetivo

Validar que a opção Atual e eventos futuros altera o evento selecionado e todos os próximos eventos da recorrência.

Pré-condição

O agendamento recorrente deve existir na Agenda.

Passos
Selecionar o evento atual.
Clicar em editar.
Alterar a modalidade.
Selecionar a opção Atual e eventos futuros.
Salvar.
Resultado esperado
- O evento atual é alterado.
- Todos os eventos futuros são alterados.
- Eventos anteriores, se existirem, não são alterados.
- Não existe duplicidade no evento atual.
- Não existe duplicidade nos eventos futuros.
CT-04 — Alterar data somente do evento atual
Objetivo

Garantir que a alteração de data usando a opção Atual não afete a recorrência inteira.

Pré-condição

O agendamento recorrente deve existir na Agenda.

Passos
Selecionar o evento atual.
Clicar em editar.
Alterar a data do evento.
Manter a alteração apenas para Atual.
Salvar.
Resultado esperado
- Apenas o evento atual muda de data.
- Os demais eventos permanecem nas datas originais.
- O evento deixa de aparecer na data antiga.
- O evento aparece na nova data.
- Não existe duplicidade na data antiga.
- Não existe duplicidade na nova data.
CT-05 — Alterar status do evento atual para Atendido
Objetivo

Validar o comportamento do status Atendido, que possui cobrar = true.

Pré-condição

O agendamento recorrente deve existir na Agenda.

Passos
Selecionar um evento da recorrência.
Clicar em editar.
Alterar o status para Atendido.
Selecionar a opção Atual.
Salvar.
Resultado esperado
- Apenas o evento atual tem o status alterado.
- Os eventos futuros não são alterados.
- Não existe duplicidade no slot atual.
- O evento atual exibe o ícone de check.
Validação visual obrigatória

O slot do evento deve conter o ícone:

pi pi-check flex-shrink-0
CT-06 — Alterar status do evento atual para cancelado
Objetivo

Validar o comportamento visual de eventos cancelados.

Pré-condição

O agendamento recorrente deve existir na Agenda.

Status que podem ser usados
Cancelado c/ Antecedência
Cancelado s/ Antecedência
Cancelado Clínica
Cancelado Terapeuta
Passos
Selecionar um evento da recorrência.
Clicar em editar.
Alterar o status para um status cancelado.
Selecionar a opção Atual.
Salvar.
Resultado esperado
- Apenas o evento atual tem o status alterado.
- Os eventos futuros não são alterados.
- Não existe duplicidade no slot atual.
- O nome do evento aparece riscado.
- O slot do evento aparece com indicação visual de cancelamento.
- O slot deve aparecer vermelho ou com a classe visual definida para cancelamento.
Validação visual obrigatória

Validar:

line-through

E validar também a classe ou estilo responsável pelo slot vermelho.

CT-07 — Alterar status para um status com cobrar = true
Objetivo

Garantir que status com cobrança sejam tratados corretamente.

Status possíveis
Atendido
Falta
Cancelado s/ Antecedência
Passos
Selecionar um evento da recorrência.
Clicar em editar.
Alterar o status para um status com cobrar = true.
Selecionar a opção Atual.
Salvar.
Resultado esperado
- Apenas o evento atual é alterado.
- Eventos futuros permanecem inalterados.
- Não existe duplicidade.
- O status salvo no evento possui cobrar = true.
- A Agenda reflete corretamente o status selecionado.
CT-08 — Alterar status para um status com cobrar = false
Objetivo

Garantir que status sem cobrança sejam tratados corretamente.

Status possíveis
Confirmado
Atestado
Cancelado c/ Antecedência
Cancelado Clínica
Cancelado Terapeuta
Feriado
Terapeuta de Férias
Passos
Selecionar um evento da recorrência.
Clicar em editar.
Alterar o status para um status com cobrar = false.
Selecionar a opção Atual.
Salvar.
Resultado esperado
- Apenas o evento atual é alterado.
- Eventos futuros permanecem inalterados.
- Não existe duplicidade.
- O status salvo no evento possui cobrar = false.
- A Agenda reflete corretamente o status selecionado.
9. Fluxos alternativos
FA-01 — Erro ao salvar agendamento
Condição

O backend retorna erro ao salvar o agendamento.

Resultado esperado
- O sistema deve exibir mensagem de erro.
- Nenhum evento deve ser criado na Agenda.
- Não deve haver evento parcial ou duplicado.
FA-02 — Erro ao editar evento
Condição

O backend retorna erro ao editar evento.

Resultado esperado
- O sistema deve exibir mensagem de erro.
- O evento deve permanecer com os dados anteriores.
- A Agenda não deve refletir alteração não confirmada.
FA-03 — Dropdown não carrega
Condição

Um dos dropdowns obrigatórios retorna erro.

Resultado esperado
- O sistema deve tratar o erro.
- O usuário não deve conseguir salvar o agendamento sem dados obrigatórios.
- O erro deve ser exibido ou tratado conforme padrão do sistema.
10. Regras de negócio a validar
Regra	Resultado esperado
Todo evento inicia com status Avisar	Status inicial deve ser Avisar
Frequência recorrente cria múltiplos eventos	Eventos devem aparecer nas datas esperadas
Intervalo Todas Semanas	Recorrência semanal
Intervalo 2 Semanas	Recorrência a cada 14 dias
Intervalo 3 Semanas	Recorrência a cada 21 dias
Edição Atual	Altera somente o evento selecionado
Edição Atual e eventos futuros	Altera evento selecionado e próximos eventos
Alteração de data Atual	Move apenas o evento selecionado
Status Atendido	Deve exibir ícone de check
Status Cancelado	Deve exibir nome riscado e slot vermelho
Evento no mesmo slot	Não pode haver duplicidade
11. Critérios de aceite

Os testes serão considerados concluídos quando:

- O fluxo de criação de agendamento recorrente estiver automatizado.
- Todas as modalidades forem testadas.
- Todos os intervalos forem testados.
- O status inicial sempre for Avisar.
- Status com cobrar = true forem testados.
- Status com cobrar = false forem testados.
- Status cancelados forem testados.
- O status Atendido validar o ícone de check.
- O status cancelado validar texto riscado e slot vermelho.
- A edição Atual não alterar eventos futuros.
- A edição Atual e eventos futuros alterar corretamente a recorrência.
- A alteração de data mover apenas o evento atual.
- A Agenda não apresentar eventos duplicados.
- A recorrência aparecer nas datas corretas.
- Os testes puderem ser executados pelo pipeline ou comando local.
12. Sugestão de comando para execução

Adicionar ao package.json:

{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:agenda": "playwright test agenda-regressivo.spec.ts"
  }
}
13. Observações para implementação

Os testes devem ser automatizados como fluxo de usuário, preferencialmente E2E.

Evitar validar apenas API. A validação principal deve acontecer na Agenda, garantindo que o evento esteja visualmente correto no calendário.

Sempre que possível, usar seletores estáveis com data-testid.

Sugestões de data-testid:

agenda-page
novo-agendamento-button
modalidade-select
frequencia-select
intervalo-select
status-evento-select
localidade-select
funcao-select
terapeuta-select
data-inicial-input
hora-inicio-input
hora-fim-input
salvar-agendamento-button
botao-aplicar-atual
botao-aplicar-atual-futuros
calendar-event-slot
calendar-event-title

As classes visuais só devem ser usadas diretamente quando fizerem parte da regra de negócio, como:

pi pi-check flex-shrink-0
line-through
classe de slot vermelho para evento cancelado
