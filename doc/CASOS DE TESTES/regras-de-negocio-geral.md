# Regras de Negócio — Sistema de Gestão de Terapias

## 1. Objetivo do sistema

O principal objetivo da aplicação web é gerenciar o atendimento terapêutico de crianças autistas, contemplando o cadastro de usuários, pacientes, profissionais, filas de atendimento, agenda, execução de sessões e controle financeiro.

## 2. Identidade visual

* Cor primária: `#662977`
* Cor secundária: `#FACC15`

---

# 3. Cadastros

## 3.1. Usuários

O sistema deve permitir o cadastro dos seguintes tipos de usuário:

* Administrador;
* Coordenadora;
* Terapeuta;
* Secretária.

Cada usuário deverá estar vinculado a um grupo de permissões, responsável por definir quais telas, informações e ações poderão ser acessadas.

### Dados específicos da terapeuta

Quando o usuário for do tipo terapeuta, deverão ser informados:

* Especialidade;
* Função, filtrada de acordo com a especialidade selecionada;
* Informações das sessões:

  * Função exercida;
  * Valor da sessão, permitindo edição;
  * Tipo de comissão;
* Horário de trabalho por dia da semana;
* Faixas de horário disponíveis entre 8h e 20h.

## 3.2. Grupos de permissões

O sistema deve permitir o cadastro de grupos de permissões contendo:

* Nome do grupo;
* Permissões vinculadas.

As permissões serão cadastradas no banco de dados com:

* Nome;
* Tag identificadora.

Essas tags controlarão:

* A navegação entre as telas;
* A visualização de informações;
* As ações disponíveis em cada funcionalidade;
* A criação, edição e exclusão de registros.

## 3.3. Especialidades

O sistema deve permitir o cadastro de especialidades terapêuticas.

As especialidades poderão ser vinculadas a:

* Terapeutas;
* Funções;
* Pacientes;
* Sessões;
* Eventos da agenda.

## 3.4. Funções

O cadastro de função deve conter:

* Nome;
* Especialidade vinculada.

Ao selecionar uma terapeuta em um agendamento, o sistema deverá apresentar somente as funções vinculadas àquela profissional.

## 3.5. Pacientes

O cadastro do paciente deve conter:

* Nome;
* Número da carteirinha;
* Data de nascimento;
* Data do contrato;
* Nome do responsável;
* Telefone;
* Convênio;
* Especialidades vinculadas;
* Informações das sessões:

  * Nome da especialidade;
  * Valor da sessão, permitindo edição;
* Observações.

## 3.6. Status de evento

O cadastro de status de evento deve conter:

* Nome;
* Indicador de cobrança.

O indicador de cobrança define se uma sessão com aquele status deverá ou não ser considerada nos cálculos financeiros.

## 3.7. Localidades

O sistema deve permitir o cadastro de localidades, como:

* Casa;
* Sala;
* Outros locais internos da clínica.

Também deve ser possível informar um local externo diretamente no agendamento.

---

# 4. Filas de atendimento

O sistema deverá possuir três filas principais:

1. Avaliação;
2. Devolutiva;
3. Terapia.

O paciente deverá avançar automaticamente entre as filas conforme a conclusão de cada etapa.

---

# 5. Fila de avaliação

## 5.1. Regra de negócio

A fila de avaliação será utilizada para pacientes que estão iniciando o atendimento na clínica e precisam ser avaliados para identificação do diagnóstico e das necessidades terapêuticas.

A avaliação poderá ser composta por aproximadamente três atendimentos e deverá ser agendada individualmente para cada especialidade vinculada ao paciente.

## 5.2. Filtros

A tela deverá possuir os seguintes filtros:

* Paciente;
* Convênio;
* Especialidade;
* Prioridade;
* Período;
* Tipo de sessão;
* Exibir inativos, por meio de toggle.

Os filtros deverão ser carregados pelo backend e apresentados, preferencialmente, como campos de seleção.

A tela também deverá conter:

* Botão **Cadastrar**;
* Botão **Limpar**;
* Botão **Pesquisar**.

O botão **Cadastrar** deverá direcionar o usuário para o formulário de inclusão na fila.

## 5.3. Listagem

A listagem deverá apresentar:

* Nome do paciente;
* Idade;
* Carteirinha;
* Responsável;
* Período;
* Tipo de sessão;
* Prioridade;
* Telefone;
* Convênio;
* Especialidade.

## 5.4. Ações

Cada registro deverá possuir as seguintes ações:

* Editar;
* Excluir;
* Agendar por especialidade.

As especialidades que já tiverem sido agendadas deverão aparecer desabilitadas para novos agendamentos.

Ao selecionar a opção de agendamento, o sistema deverá abrir o modal da agenda com os seguintes campos previamente preenchidos:

* Modalidade: **Avaliação**;
* Frequência: **Recorrente**;
* Intervalo: **Todas as semanas**;
* Paciente;
* Especialidade selecionada.

Após a conclusão das avaliações de todas as especialidades vinculadas, o paciente deverá sair automaticamente da fila de avaliação e ser incluído na fila de devolutiva.

---

# 6. Fila de devolutiva

## 6.1. Regra de negócio

Após a realização das avaliações de todas as especialidades, os terapeutas deverão apresentar o diagnóstico e as orientações aos responsáveis pelo paciente.

Esse atendimento será denominado devolutiva e deverá ocorrer em uma única sessão.

## 6.2. Filtros

A tela deverá possuir os seguintes filtros:

* Paciente;
* Convênio;
* Especialidade;
* Prioridade;
* Período;
* Tipo de sessão;
* Exibir devolutivas agendadas, por meio de toggle.

Os filtros deverão ser carregados pelo backend.

A tela também deverá conter:

* Botão **Cadastrar**;
* Botão **Limpar**;
* Botão **Pesquisar**.

## 6.3. Listagem

A listagem deverá apresentar:

* Nome do paciente;
* Idade;
* Carteirinha;
* Responsável;
* Período;
* Tipo de sessão;
* Prioridade;
* Telefone;
* Convênio.

## 6.4. Ações

Cada registro deverá possuir as seguintes ações:

* Editar;
* Excluir;
* Agendar.

Ao selecionar a opção de agendamento, o sistema deverá abrir o modal da agenda com os seguintes campos previamente preenchidos:

* Modalidade: **Devolutiva**;
* Frequência: **Única**;
* Sem intervalo de recorrência;
* Paciente;
* Especialidades vinculadas ao paciente.

Após a realização da devolutiva, o paciente deverá sair automaticamente da fila de devolutiva e ser incluído na fila de terapia.

---

# 7. Fila de terapia

## 7.1. Regra de negócio

Após a conclusão da devolutiva, o paciente deverá ser incluído automaticamente na fila de terapia.

## 7.2. Filtros

A tela deverá possuir os seguintes filtros:

* Paciente;
* Convênio;
* Especialidade;
* Prioridade;
* Período;
* Tipo de sessão;
* Exibir inativos, por meio de toggle;
* Exibir agendados, por meio de toggle.

Os filtros deverão ser carregados pelo backend.

A tela também deverá conter:

* Botão **Cadastrar**;
* Botão **Limpar**;
* Botão **Pesquisar**.

## 7.3. Listagem

A listagem deverá apresentar:

* Nome do paciente;
* Idade;
* Carteirinha;
* Responsável;
* Período;
* Tipo de sessão;
* Prioridade;
* Telefone;
* Convênio.

## 7.4. Ações

Cada registro deverá possuir as seguintes ações:

* Editar;
* Excluir;
* Agendar.

Ao selecionar a opção de agendamento, o sistema deverá abrir o modal da agenda com os seguintes campos previamente preenchidos:

* Modalidade: **Terapia**;
* Paciente.

Após a criação do agendamento terapêutico, o paciente deverá sair da fila de terapia.

---

# 8. Agenda

## 8.1. Modal de agendamento

O modal de agendamento deverá conter os seguintes campos:

* Modalidade;
* Data;
* Horário inicial;
* Horário final;
* Frequência;
* Intervalo;
* Dias da semana;
* Paciente;
* Especialidade;
* Terapeuta;
* Função;
* Local externo;
* Local;
* Status do evento;
* Observação.

## 8.2. Regras de exibição e dependência dos campos

### Intervalo

O campo intervalo deverá ser exibido apenas quando a frequência selecionada for **Recorrente**.

### Dias da semana

O campo de dias da semana deverá ser exibido apenas quando a frequência selecionada for **Recorrente**.

### Especialidade

As opções deverão ser filtradas de acordo com as especialidades vinculadas ao paciente selecionado.

### Terapeuta

As opções deverão ser filtradas de acordo com a especialidade selecionada.

### Função

As opções deverão ser filtradas de acordo com as funções vinculadas à terapeuta selecionada.

### Local externo

Ao ativar o toggle de local externo:

* O campo de local cadastrado deverá ser desabilitado;
* O campo de km deverá ser apresentado;
* O sistema deverá permitir informar a descrição ou o endereço do local externo.

---

# 9. Visualização da agenda

A agenda deverá permitir:

* Criar eventos;
* Visualizar todos os eventos do período selecionado;
* Consultar eventos por mês, semana, dia ou lista;
* Navegar entre períodos;
* Visualizar os horários vagos de uma terapeuta.

Quando o filtro de terapeuta estiver preenchido, o calendário deverá apresentar também os horários disponíveis da profissional, considerando:

* Horário de trabalho cadastrado;
* Eventos já agendados;
* Dias da semana disponíveis;
* Intervalos já ocupados.

## 9.1. Filtros

A tela deverá possuir os seguintes filtros:

* Paciente;
* Terapeuta;
* Status do evento;
* Modalidade.

Também deverá conter:

* Botão **Agendar**;
* Botão **Limpar**;
* Botão **Pesquisar**.

## 9.2. Controles do calendário

A agenda deverá possuir:

* Botão para avançar o período;
* Botão para retornar ao período anterior;
* Exibição do mês, semana ou dia atual;
* Opções de visualização:

  * Mês;
  * Semana;
  * Dia;
  * Lista.

O calendário deverá adaptar sua apresentação de acordo com a visualização selecionada.

---

# 10. Baixa de atendimentos

A funcionalidade de baixa será utilizada para registrar a execução dos atendimentos realizados.

## 10.1. Filtros

A tela deverá possuir:

* Paciente;
* Convênio;
* Terapeuta;
* Casa;
* Data inicial;
* Data final;
* Baixa executada, por meio de toggle;
* Botão **Limpar**;
* Botão **Pesquisar**.

## 10.2. Tabela

A tabela deverá apresentar:

* Paciente;
* Carteirinha;
* Convênio;
* Data do evento;
* Especialidade;
* Carga horária;
* Local;
* Data e hora da baixa;
* Usuário responsável pela baixa.

## 10.3. Ações

Cada registro deverá possuir:

* Botão **Realizar baixa**;
* Botão **Excluir baixa**.

---

# 11. Financeiro

## 11.1. Financeiro da terapeuta

### Filtros

A tela deverá possuir:

* Terapeuta;
* Data inicial, preenchida inicialmente com o primeiro dia do mês atual;
* Data final, preenchida inicialmente com o último dia do mês atual;
* Status do evento;
* Botão **Limpar**;
* Botão **Pesquisar**.

### Indicadores

A tela deverá apresentar cards com:

* Valor total referente às horas de sessões realizadas;
* Valor total das comissões das sessões realizadas;
* Valor total da quilometragem percorrida.

### Tabela

A tabela deverá apresentar:

* Data da sessão;
* Horário da sessão;
* Quilometragem percorrida;
* Valor por quilômetro;
* Comissão da sessão;
* Valor total.

## 11.2. Financeiro do paciente

### Filtros

A tela deverá possuir:

* Paciente;
* Data inicial, preenchida inicialmente com o primeiro dia do mês atual;
* Data final, preenchida inicialmente com o último dia do mês atual;
* Status do evento;
* Botão **Limpar**;
* Botão **Pesquisar**.

### Indicadores

A tela deverá apresentar cards com:

* Valor total referente às horas de sessões realizadas;
* Valor total das sessões ou comissões calculadas;
* Valor total referente à quilometragem.

### Agrupamento por especialidade

Os resultados deverão ser agrupados por especialidade.

Cada grupo deverá apresentar uma tabela contendo:

* Data da sessão;
* Horário da sessão;
* Quilometragem percorrida;
* Valor por quilômetro;
* Comissão da sessão;
* Valor total.

---

# 12. Regras dos eventos de agendamento

## 12.1. Evento recorrente

Um evento recorrente deverá ser repetido de acordo com o intervalo selecionado:

* Todas as semanas;
* A cada duas semanas;
* A cada três semanas.

A recorrência deverá respeitar:

* Dias da semana selecionados;
* Horário inicial;
* Horário final;
* Data de início;
* Intervalo informado.

## 12.2. Evento único

Um evento único deverá gerar somente uma ocorrência na data e no horário informados.

## 12.3. Atualização do calendário

Após a criação de um evento, ele deverá ser exibido imediatamente no calendário, na data e no horário selecionados, sem necessidade de recarregar manualmente a página.

---

# 13. Detalhes do evento

Ao clicar em um evento do calendário, o sistema deverá abrir um modal contendo:

* Especialidade;
* Nome do paciente;
* Modalidade;
* Dia da semana;
* Data por extenso;
* Horário inicial;
* Horário final;
* Status do evento;
* Frequência;
* Dias da semana selecionados;
* Local;
* Nome da terapeuta;
* Função;
* Observação;
* Opção para fechar o modal.

## 13.1. Alteração de status

O modal deverá permitir a alteração do status do evento conforme as regras de data e horário.

Quando o horário do evento já tiver passado:

* O evento não poderá ser editado;
* O evento não poderá ser excluído;
* O sistema deverá permitir apenas a alteração para os status autorizados para eventos passados, incluindo **Atestado**.

Quando o evento ainda não tiver ocorrido:

* O sistema deverá permitir a edição;
* O sistema deverá permitir a exclusão;
* O sistema deverá permitir a alteração do status.

---

# 14. Edição de eventos recorrentes

Ao editar um evento recorrente, o sistema deverá apresentar as seguintes opções:

## 14.1. Editar somente este evento

A alteração será aplicada apenas à ocorrência selecionada, sem modificar os eventos futuros da recorrência.

## 14.2. Editar este e os próximos eventos

A alteração será aplicada à ocorrência selecionada e a todas as ocorrências futuras da mesma recorrência.

Eventos anteriores à ocorrência selecionada não poderão ser alterados.

## 14.3. Restrições de edição

Não deverá ser permitido alterar os seguintes campos de um evento já criado:

* Modalidade;
* Data;
* Horário inicial;
* Horário final;
* Frequência;
* Intervalo;
* Dias da semana.

Somente as informações complementares da consulta poderão ser alteradas, como:

* Paciente, quando permitido pela regra da aplicação;
* Especialidade;
* Terapeuta;
* Função;
* Local;
* Status do evento;
* Observação.

Eventos já realizados ou com data e horário anteriores ao momento atual não poderão ser editados.

---

# 15. Regras de cobrança por status

Os status dos eventos deverão seguir as seguintes regras:

| Status                     | Cobrar |
| -------------------------- | -----: |
| Atendido                   |    Sim |
| Atestado                   |    Não |
| Avisar                     |    Não |
| Cancelado com antecedência |    Não |
| Cancelado pela clínica     |    Não |
| Cancelado sem antecedência |    Sim |
| Cancelado pela terapeuta   |    Não |
| Confirmado                 |    Não |
| Falta                      |    Sim |
| Feriado                    |    Não |
| Terapeuta de férias        |    Não |

## 15.1. Regras específicas de cancelamento

* Um evento cancelado com pelo menos um dia de antecedência não deverá ser cobrado.
* Um evento cancelado sem a antecedência mínima de um dia deverá ser cobrado.
* Um evento cancelado pela clínica não deverá ser cobrado.
* Um evento cancelado pela terapeuta não deverá ser cobrado.
* Um evento cancelado devido às férias da terapeuta não deverá ser cobrado.
* Um evento com status **Falta** deverá ser cobrado.
* Um evento com status **Atestado** não deverá ser cobrado.

---

# 16. Valores padronizados

## 16.1. Modalidades

* Avaliação;
* Devolutiva;
* Terapia.

## 16.2. Frequências

* Recorrente;
* Única.

## 16.3. Intervalos

* Todas as semanas;
* A cada duas semanas;
* A cada três semanas.

## 16.4. Especialidade

A especialidade será cadastrável.

Quando um paciente estiver selecionado, o sistema deverá exibir apenas as especialidades vinculadas ao cadastro dele.

## 16.5. Terapeuta

A terapeuta será cadastrável.

Quando uma especialidade estiver selecionada, o sistema deverá exibir apenas as terapeutas vinculadas àquela especialidade.

## 16.6. Função

A função será cadastrável.

Quando uma terapeuta estiver selecionada, o sistema deverá exibir apenas as funções vinculadas a ela.

## 16.7. Local

O local será cadastrável e poderá representar salas, casas ou outras localidades de atendimento.

## 16.8. Status dos eventos

Os status serão cadastráveis e deverão possuir, no mínimo, os seguintes registros iniciais:

```json
[
  {
    "nome": "Atendido",
    "cobrar": true
  },
  {
    "nome": "Atestado",
    "cobrar": false
  },
  {
    "nome": "Avisar",
    "cobrar": false
  },
  {
    "nome": "Cancelado com Antecedência",
    "cobrar": false
  },
  {
    "nome": "Cancelado pela Clínica",
    "cobrar": false
  },
  {
    "nome": "Cancelado sem Antecedência",
    "cobrar": true
  },
  {
    "nome": "Cancelado pela Terapeuta",
    "cobrar": false
  },
  {
    "nome": "Confirmado",
    "cobrar": false
  },
  {
    "nome": "Falta",
    "cobrar": true
  },
  {
    "nome": "Feriado",
    "cobrar": false
  },
  {
    "nome": "Terapeuta de Férias",
    "cobrar": false
  }
]
```

---

# 17. Matriz de aderência e cobertura (implementação x testes)

## 17.1. Legenda

* Implementação: **Atendido**, **Parcial**, **Ausente**
* Cobertura de testes: **Coberto**, **Parcial**, **Ausente**

## 17.2. Resumo executivo

* O sistema possui base funcional relevante para cadastros, filas, agenda, baixa e financeiro.
* Existem divergências importantes nas regras de edição de eventos recorrentes e local externo no agendamento.
* A suíte E2E atual cobre principalmente cadastros e agenda regressiva com mock de API, sem validar o fluxo principal completo fim a fim com backend real.

## 17.3. Matriz por requisito

| Requisito | Implementação | Cobertura de testes | Observação |
| --- | --- | --- | --- |
| 1. Objetivo do sistema (escopo macro) | Parcial | Ausente | Módulos existem, porém sem validação fim a fim do processo completo (entrada em fila até fechamento financeiro). |
| 2. Identidade visual (#662977 / #FACC15) | Atendido | Ausente | Cores definidas em estilos globais e Tailwind. |
| 3.1 Cadastro de usuários por tipo + grupo de permissões | Parcial | Parcial | Cadastro existe e é testado CRUD básico; cenários específicos por perfil (Administrador, Coordenadora, Terapeuta, Secretária) não são validados em E2E. |
| 3.1 Dados específicos da terapeuta | Parcial | Ausente | Especialidade, função, comissão e carga horária existem; faixa inclui 07:00, divergindo da regra 08:00 a 20:00. |
| 3.2 Grupo de permissões | Parcial | Coberto | CRUD de grupos validado; efeito prático das tags em navegação/ações não está coberto de forma sistemática. |
| 3.3 Cadastro de especialidades terapêuticas | Ausente | Ausente | Não há aba de cadastro dedicada para especialidade no módulo de cadastros. |
| 3.4 Cadastro de funções + vínculo por especialidade/terapeuta | Atendido | Coberto | CRUD de função existe e agenda filtra função por terapeuta via dropdown dependente. |
| 3.5 Cadastro de pacientes com dados e sessão | Parcial | Parcial | Principais campos existem; nomenclatura de data está como dataContato (não dataContrato). |
| 3.6 Status de evento com indicador de cobrança | Atendido | Parcial | CRUD de status com cobrar existe; regra financeira por status não é validada ponta a ponta com backend real. |
| 3.7 Localidades + local externo no agendamento | Parcial | Parcial | Cadastro de localidade coberto; no agendamento, local externo não desabilita local e usa km ao invés de descrição/endereço. |
| 4. Três filas e avanço automático entre etapas | Parcial | Ausente | Estrutura das filas existe, mas transição automática entre avaliação, devolutiva e terapia não está coberta em E2E fim a fim. |
| 5. Fila de avaliação (filtros/listagem/ações) | Parcial | Ausente | Tela existe com filtros e ação de agendar; ausência de testes dedicados da fila e de comportamento completo da listagem. |
| 6. Fila de devolutiva (filtros/listagem/ações) | Parcial | Ausente | Tela existe; regras de sessão única e avanço automático pós-devolutiva não cobertas em E2E. |
| 7. Fila de terapia (filtros/listagem/ações) | Parcial | Ausente | Tela existe; saída automática da fila após agendamento não coberta em E2E. |
| 8. Modal de agendamento (campos) | Parcial | Parcial | Campos principais existem; local externo diverge da regra e alguns comportamentos dependem apenas de permissão. |
| 8.2 Dependências de campos (intervalo/dias/especialidade/terapeuta/função) | Parcial | Parcial | Dependências principais implementadas; cobertura concentrada na agenda regressiva mockada. |
| 9. Visualização da agenda (mês/semana/dia/lista e navegação) | Atendido | Parcial | Funcionalidades de calendário presentes; sem teste dedicado de disponibilidade de horários da terapeuta. |
| 10. Baixa (filtros/tabela/ações) | Parcial | Ausente | Tela e ações existem; não há E2E de baixa executada/exclusão de baixa no fluxo principal. |
| 11. Financeiro terapeuta | Parcial | Ausente | Filtros e tabelas existem; reset de filtro e validação de cálculos não cobertos fim a fim. |
| 11.2 Financeiro paciente agrupado por especialidade | Parcial | Ausente | Agrupamento existe; colunas exigidas pelo documento não estão completas na tabela do paciente. |
| 12. Regras de recorrência e evento único | Parcial | Coberto | Agenda regressiva cobre recorrência e status em mock; nomenclaturas de intervalo/frequência divergem do texto formal. |
| 12.3 Atualização imediata do calendário após criar evento | Atendido | Parcial | Fluxo de atualização imediato existe; validado em regressivo com mock. |
| 13. Modal de detalhes do evento | Parcial | Parcial | Modal existe com dados centrais; sem verificação formal de todos os campos do documento. |
| 13.1 Regras de alteração de status por data/horário | Parcial | Parcial | Existe lógica para Atestado em evento passado; permissões e bloqueios não cobrem integralmente todas as combinações previstas. |
| 14. Edição de recorrentes (atual e futuros) | Parcial | Coberto | Opções de aplicar no atual e futuros existem e são testadas no regressivo. |
| 14.3 Restrição de campos não editáveis em evento criado | Ausente | Ausente | Modalidade, data e horários seguem editáveis na prática, contrariando regra formal. |
| 15. Regras de cobrança por status | Parcial | Parcial | Status e flag cobrar existem; validação ponta a ponta no financeiro por regra de cancelamento não está coberta. |
| 16. Valores padronizados (modalidade/frequência/intervalo/status) | Parcial | Parcial | Padrões existem com diferenças de nomenclatura (ex.: "Único" e "2 Semanas"). |

## 17.4. Cobertura atual de testes automatizados (inventário)

* Cobertos hoje:
  * Cadastros: usuários, grupos de permissões, funções, localidades, pacientes, status de eventos.
  * Agenda regressiva: criação recorrente, edição atual/futuros, alteração de status, exdate, validação visual.
  * Logout por inatividade.
* Não cobertos hoje:
  * Fluxo principal real: fila avaliação -> fila devolutiva -> fila terapia -> agenda -> baixa -> financeiro.
  * Regras de transição automática entre filas com backend real.
  * Baixa e financeiro fim a fim.

## 17.5. Prioridade de lacunas críticas

1. Restrições de edição de eventos recorrentes (item 14.3).
2. Regra de local externo no agendamento (item 8.2).
3. Cobertura E2E fim a fim do fluxo principal em ambiente integrado.
4. Cadastro de especialidade como módulo de cadastro (item 3.3).
5. Faixa horária da terapeuta alinhada a 08:00-20:00.
