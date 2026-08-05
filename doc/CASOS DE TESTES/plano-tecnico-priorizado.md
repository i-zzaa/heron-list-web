# Plano Tecnico Priorizado de Correcao

## Objetivo

Organizar a correcao das lacunas mais criticas de aderencia as regras de negocio e elevar a confiabilidade dos testes do fluxo principal.

## Andamento atual

- P0.1: concluido no frontend e refletido em testes de agenda.
- P0.2: concluido no frontend (toggle local externo desabilita localidade, exibe km e campo de descricao/endereco).
- P0.3: concluido no frontend (faixa de atendimento ajustada para 08:00-20:00 em agenda e carga horaria).
- P2.1: concluido (cadastro de especialidade com cobertura E2E CRUD).
- P2.2: concluido no frontend (tabela de financeiro do paciente ajustada com horario, valor por km, comissao e valor total).
- P1.2: concluido com cobertura integrada deterministica por API real (matriz de status e flag cobrar validada em backend) e fallback por credenciais reais via variaveis de ambiente.
- P1.1: concluido com suite integrada deterministica por API real cobrindo fila (avaliacao/devolutiva/terapia), baixa e financeiro com contratos validados em backend autenticado.

Validacao final executada em 2026-08-04:
- `npm run test:e2e:financeiro-real` -> 2 passed.
- `npm run test:e2e:fluxo-api-real` -> 1 passed.

## Prioridade P0 (bloqueante para aderencia funcional)

### P0.1 Restringir edicao de campos bloqueados em evento recorrente (Regra 14.3)

Status atual:
- Modalidade, data, horario inicial e horario final ainda podem ser editados em eventos existentes.

Acoes:
1. Bloquear no formulario de agenda, em modo edicao, os campos:
- modalidade
- dataInicio
- start
- end
- frequencia
- intervalo
- diasFrequencia
2. Manter editaveis apenas campos complementares:
- paciente (quando regra permitir)
- especialidade
- terapeuta
- funcao
- localidade
- statusEventos
- observacao
3. Garantir bloqueio extra por validacao de backend para evitar bypass de UI.

Criterios de aceite:
- Em evento recorrente existente, campos bloqueados aparecem desabilitados.
- Tentativa de envio manual de payload alterando esses campos retorna erro de validacao no backend.
- Teste E2E valida que a UI nao permite alterar campos bloqueados.

### P0.2 Corrigir regra de local externo no agendamento (Regra 8.2)

Status atual:
- Toggle de local externo nao desabilita o campo de local cadastrado.
- Campo exibido e km, mas a regra exige descricao/endereco do local externo.

Acoes:
1. Ao ativar local externo, desabilitar campo de localidade cadastrada.
2. Exibir campo textual de descricao/endereco (exemplo: localExternoDescricao).
3. Manter km como campo opcional complementar apenas se regra financeira exigir deslocamento.
4. Ajustar payload e contrato com backend.

Criterios de aceite:
- Toggle ligado: localidade desabilitada, descricao/endereco obrigatorio.
- Toggle desligado: localidade obrigatoria, descricao/endereco oculto.
- Teste E2E cobre ambos os estados.

### P0.3 Alinhar faixa horaria da terapeuta para 08:00 a 20:00

Status atual:
- Existem slots iniciando em 07:00.

Acoes:
1. Ajustar slots da agenda para inicio em 08:00.
2. Ajustar matriz de carga horaria da terapeuta para iniciar em 08:00.
3. Revisar validacoes relacionadas a horario minimo.

Criterios de aceite:
- Agenda nao exibe faixa de 07:00.
- Carga horaria da terapeuta inicia em 08:00.
- Testes automatizados atualizados para nova faixa.

## Prioridade P1 (cobertura do fluxo principal)

### P1.1 Cobrir fluxo principal completo em E2E integrado

Escopo minimo:
1. Cadastro/selecao de paciente de teste.
2. Entrada e agendamento na fila de avaliacao por especialidade.
3. Transicao para devolutiva apos concluir avaliacoes.
4. Transicao para terapia apos concluir devolutiva.
5. Criacao de agendamento terapeutico e saida da fila.
6. Baixa de atendimento realizado.
7. Reflexo no financeiro terapeuta e paciente.

Observacao importante:
- Evitar apenas mocks nesse fluxo. Usar ambiente integrado controlado (staging/local completo).

Criterios de aceite:
- Suite passa em ambiente integrado com dados seedados.
- Evidencia de transicao automatica entre filas.
- Evidencia de impacto em baixa e financeiro.

### P1.2 Cobrir regras de cobranca por status (Regra 15)

Acoes:
1. Criar cenarios para Atendido, Falta, Cancelado sem antecedencia (cobram).
2. Criar cenarios para Atestado, Confirmado, Cancelado pela clinica, Cancelado pela terapeuta, Feriado (nao cobram).
3. Validar resultado em financeiro por periodo.

Criterios de aceite:
- Cada status altera total financeiro conforme regra esperada.
- Relatorio final da suite mostra matriz status x cobrar validada.

## Prioridade P2 (completude de produto)

### P2.1 Disponibilizar cadastro de especialidades na area de Cadastros

Acoes:
1. Adicionar aba de Especialidade no modulo de cadastro.
2. Implementar CRUD simples com permissoes.
3. Integrar dropdowns que dependem de especialidade.

Criterios de aceite:
- Usuario com permissao consegue criar, editar e inativar especialidades.
- Novas especialidades aparecem nos pontos de uso (paciente, funcao, agenda).

### P2.2 Ajustes de financeiro do paciente para aderencia total da tabela

Acoes:
1. Completar colunas faltantes no agrupamento por especialidade:
- horario da sessao
- valor por km
- comissao
- valor total
2. Revisar nomenclaturas e consistencia com financeiro da terapeuta.

Criterios de aceite:
- Tabela por especialidade contem todas as colunas exigidas no documento.

## Ordem sugerida de execucao tecnica

1. P0.1 restricoes de edicao de evento recorrente.
2. P0.2 local externo.
3. P0.3 faixa de horario 08:00-20:00.
4. P1.1 suite E2E integrada do fluxo principal.
5. P1.2 cobranca por status no financeiro.
6. P2.1 cadastro de especialidades.
7. P2.2 ajustes de tabela no financeiro do paciente.

## Arquivos tipicamente impactados

- src/foms/CalendarForm.tsx
- src/components/view-evento/index.tsx
- src/components/calendar/index.tsx
- src/components/dataTable/index.tsx
- src/pages/Financial.tsx
- src/pages/Crud.tsx
- src/constants/formFields.ts
- e2e/fluxo-principal-real.spec.ts
- e2e/agenda-regressivo.spec.ts

## Definicao de pronto

- Regras P0 implementadas e revisadas.
- Suites E2E relevantes passando em CI.
- Matriz de aderencia atualizada no documento de regras.
- Sem regressao de cadastros e agenda regressiva existente.
