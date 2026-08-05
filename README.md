<h1 align="center">

👾  Multialcance WEB 👾
</h1>
<p align="center">🚀  Esse projeto tem como objetivo principal permitir que a clinica Multialcance cadastre, gerencie  e acompanhe usuários, pacientes e sessões.
</p>

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina as seguintes ferramentas:
[Git](https://git-scm.com/), [Node.js](https://nodejs.org/en/), ReactJs18, Yarn.
Além disto é bom ter um editor para trabalhar com o código como [VSCode](https://code.visualstudio.com/)

### 🎲 Rodando o Front

```
# Clone este repositório
$ git https://github.com/i-zzaa/heron-list-web.git

# Acesse a pasta do projeto no terminal/cmd
$ cd heron-list-we

# Instale as dependências 
$ yarn install

# Execute a aplicação em modo de desenvolvimento
$ yarn dev

# O servidor inciará na porta:5173 - acesse <http://127.0.0.1:5173/>

```

### ⚙️ Configurações

É necessário criar um arquivo .env  na raiz do projeto com a variável de ambiente VITE_API_URL com a url do backend

.*env*

```
VITE_API_URL=http://localhost:3333
```

### ✅ Testes E2E Integrados (API Real)

Os cenarios P1.1 e P1.2 possuem suites deterministicas por API integrada.

Variaveis necessarias em runtime:

```
E2E_API_URL=https://seu-backend
E2E_LOGIN=seu.login
E2E_PASSWORD=sua_senha
E2E_FINANCIAL_PERIOD_START=2026-01-01
E2E_FINANCIAL_PERIOD_END=2026-12-31
```

Execucao P1.2 (cobranca por status):

```bash
E2E_API_URL='https://seu-backend' \
E2E_LOGIN='seu.login' \
E2E_PASSWORD='sua_senha' \
E2E_FINANCIAL_PERIOD_START='2026-01-01' \
E2E_FINANCIAL_PERIOD_END='2026-12-31' \
npm run test:e2e:financeiro-real
```

Execucao P1.1 (fluxo principal integrado por API):

```bash
E2E_API_URL='https://seu-backend' \
E2E_LOGIN='seu.login' \
E2E_PASSWORD='sua_senha' \
E2E_FINANCIAL_PERIOD_START='2026-01-01' \
E2E_FINANCIAL_PERIOD_END='2026-12-31' \
npm run test:e2e:fluxo-api-real
```

Observacao:
- Nao persistir credenciais em arquivo versionado.
- Use apenas variaveis em runtime, shell local ou secret store do CI.

### 🛠 Tecnologias

As seguintes ferramentas foram usadas na construção do projeto:

- [ReactJs](https://react.dev/) 18
- [Vite](https://vitejs.dev/)
- [Axios](https://axios-http.com/ptbr/docs/intro)
- [Context API](https://legacy.reactjs.org/docs/context.html)
- [Eslint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [PrimeReact](https://primereact.org/)


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
