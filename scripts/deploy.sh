#!/usr/bin/env bash
# Deploy do front para a hospedagem elástica.
#
# O container tem só 1 GB de RAM e o `vite build` é morto lá (OOM), então o
# build é feito localmente e o servidor só recebe o que o serve.js precisa:
# dist/, serve.js, package.json, Procfile e node_modules com express + cors.
#
# Uso:
#   npm run deploy               build + envio + verificação
#   npm run deploy -- --dry-run  só build e checagens, não envia nada
#   npm run deploy -- --yes      não pede confirmação
#   npm run deploy:rollback      volta o dist anterior
#
# Host/porta/usuário podem ser sobrescritos por variável de ambiente.

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-ag-br1-36.hospedagemelastica.com.br}"
DEPLOY_PORT="${DEPLOY_PORT:-28648}"
DEPLOY_USER="${DEPLOY_USER:-application}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/application/app}"
DEPLOY_URL="${DEPLOY_URL:-https://agenda-multialcance.com.br}"

REMOTE="$DEPLOY_USER@$DEPLOY_HOST"
SSH=(ssh -p "$DEPLOY_PORT" -o BatchMode=yes -o ConnectTimeout=15 "$REMOTE")
RSYNC_SSH="ssh -p $DEPLOY_PORT -o BatchMode=yes -o ConnectTimeout=15"

DRY_RUN=false
ASSUME_YES=false
ROLLBACK=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes | -y) ASSUME_YES=true ;;
    --rollback) ROLLBACK=true ;;
    *) echo "Argumento desconhecido: $arg" >&2; exit 1 ;;
  esac
done

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
ok() { printf '\033[32m✓ %s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

cd "$(dirname "$0")/.."

index_bundle() { grep -o 'assets/index\.[a-z0-9]*\.js' | head -1; }

smoke_test() {
  local expected="$1"

  step "Verificando o site"
  local served
  served=$("${SSH[@]}" "curl -s http://localhost:\${PORT:-3000}/" | index_bundle || true)
  [ "$served" = "$expected" ] ||
    fail "Servidor entrega '$served', esperado '$expected'"
  "${SSH[@]}" "curl -sf -o /dev/null http://localhost:\${PORT:-3000}/$expected" ||
    fail "Servidor não entrega $expected"
  ok "Servidor (localhost) entrega $expected"

  local public
  public=$(curl -s "$DEPLOY_URL/" | index_bundle || true)
  if [ "$public" = "$expected" ]; then
    ok "$DEPLOY_URL entrega $expected"
  else
    printf '\033[33m! %s entrega %s (pode ser cache/CDN)\033[0m\n' \
      "$DEPLOY_URL" "${public:-nada}"
  fi
}

step "Testando conexão com $REMOTE:$DEPLOY_PORT"
"${SSH[@]}" true || fail "Não foi possível conectar via SSH"
ok "Conectado"

# ---------------------------------------------------------------- rollback
if $ROLLBACK; then
  step "Voltando para o dist anterior"
  "${SSH[@]}" "set -e; cd '$DEPLOY_DIR'
    [ -d dist-prev ] || { echo 'Não existe dist-prev para voltar' >&2; exit 1; }
    rm -rf .dist-rollback
    mv dist .dist-rollback
    mv dist-prev dist
    mv .dist-rollback dist-prev"
  ok "dist e dist-prev trocados (rodar de novo desfaz o rollback)"
  smoke_test "$("${SSH[@]}" "cat '$DEPLOY_DIR/dist/index.html'" | index_bundle)"
  exit 0
fi

# ------------------------------------------------------------------ deploy
step "Conferindo o que vai ser publicado"
branch=$(git rev-parse --abbrev-ref HEAD)
commit=$(git log -1 --format='%h %s')
version=$(node -p "require('./package.json').version")
echo "Branch:  $branch"
echo "Commit:  $commit"
echo "Versão:  $version"
if [ -n "$(git status --porcelain)" ]; then
  printf '\033[33m! Há alterações sem commit — elas vão junto no build:\033[0m\n'
  git status --short
fi

step "Conferindo variáveis de ambiente com o servidor"
# O Vite grava as VITE_* no bundle; o build local precisa usar a mesma API
# que o servidor. No servidor elas ficam no ~/.bash_profile.
remote_api=$("${SSH[@]}" "grep -o \"VITE_API_URL=.*\" ~/.bash_profile" |
  sed -E "s/^VITE_API_URL=['\"]?([^'\"]*)['\"]?$/\1/")
local_api=$(node --input-type=module -e "
  import { loadEnv } from 'vite';
  console.log(loadEnv('production', process.cwd()).VITE_API_URL ?? '');
")
echo "Servidor: ${remote_api:-<vazio>}"
echo "Local:    ${local_api:-<vazio>}"
[ -n "$local_api" ] || fail "VITE_API_URL não definido no .env local"
if [ -n "$remote_api" ] && [ "$remote_api" != "$local_api" ]; then
  fail "VITE_API_URL local diferente do servidor — ajuste .env.production"
fi
ok "API confere"

if ! $DRY_RUN && ! $ASSUME_YES; then
  printf '\nPublicar em %s? [s/N] ' "$DEPLOY_URL"
  read -r answer
  [[ "$answer" =~ ^[sSyY]$ ]] || fail "Cancelado"
fi

step "Build local (tsc + vite build)"
rm -rf dist
npm run build
bundle=$(index_bundle <dist/index.html)
[ -n "$bundle" ] || fail "dist/index.html sem bundle principal"
ok "Build gerado: $bundle"

if $DRY_RUN; then
  ok "Dry-run: nada foi enviado"
  exit 0
fi

step "Enviando dist para o servidor"
# Sobe numa pasta temporária (reaproveitando os arquivos iguais do dist atual)
# e só troca no final, pra o site nunca ficar com um dist pela metade.
"${SSH[@]}" "mkdir -p '$DEPLOY_DIR' && rm -rf '$DEPLOY_DIR/.dist-next'"
rsync -az --delete -e "$RSYNC_SSH" \
  --link-dest="$DEPLOY_DIR/dist" \
  dist/ "$REMOTE:$DEPLOY_DIR/.dist-next/"
ok "dist enviado"

step "Enviando serve.js, package.json e Procfile"
rsync -az -e "$RSYNC_SSH" serve.js package.json Procfile "$REMOTE:$DEPLOY_DIR/"
ok "Arquivos enviados"

step "Ativando a nova versão"
"${SSH[@]}" "set -e; cd '$DEPLOY_DIR'
  rm -rf dist-prev
  if [ -d dist ]; then mv dist dist-prev; fi
  mv .dist-next dist"
ok "dist ativo (anterior guardado em dist-prev)"

step "Conferindo dependências do serve.js"
"${SSH[@]}" "set -e; cd '$DEPLOY_DIR'
  if node -e \"require.resolve('express'); require.resolve('cors')\" 2>/dev/null; then
    echo 'express e cors já instalados'
  else
    # Instala fora do app: com o package.json do projeto por perto o npm
    # baixaria todas as dependências do front.
    tmp=\$(mktemp -d)
    cd \"\$tmp\"
    npm init -y >/dev/null
    npm install express@4.18.2 cors@2.8.5 --no-audit --no-fund --silent
    rm -rf '$DEPLOY_DIR/node_modules'
    mv node_modules '$DEPLOY_DIR/'
    rm -rf \"\$tmp\"
    echo 'express e cors instalados'
  fi"

# O serve.js resolve o dist pelo caminho absoluto, então o processo em
# execução já entrega os arquivos novos sem reiniciar.
smoke_test "$bundle"

printf '\n\033[1;32mDeploy concluído: %s (%s)\033[0m\n' "$version" "$commit"
