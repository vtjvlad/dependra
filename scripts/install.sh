#!/usr/bin/env bash
# Dependra bootstrap installer (Linux).
# Installs to $HOME/server/dependra, symlink $HOME/server/fds, bins in $HOME/.local/bin.
# Source: https://github.com/vtjvlad/dependra.git (branch dev)
set -euo pipefail

REPO_URL="${DEPENDRA_REPO_URL:-https://github.com/vtjvlad/dependra.git}"
REPO_BRANCH="${DEPENDRA_REPO_BRANCH:-dev}"
INSTALL_DIR="${DEPENDRA_INSTALL_DIR:-$HOME/server/dependra}"
SERVER_DIR="$(dirname "$INSTALL_DIR")"
FOLDER_LINK="${DEPENDRA_FOLDER_LINK:-$SERVER_DIR/fds}"
BIN_DIR="${DEPENDRA_BIN_DIR:-$HOME/.local/bin}"
MARKER_FILE="$INSTALL_DIR/.dependra-installed"
MIN_NODE_MAJOR=20
NVM_NODE_VERSION="${DEPENDRA_NODE_VERSION:-22}"
CLI_REL="src/cli/index.js"
BIN_NAMES=(fds dependra deps dep)

log()  { printf '%s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*" >&2; }
die()  { printf '✗ %s\n' "$*" >&2; exit 1; }

ask_yn() {
  local prompt="$1"
  local reply=""
  if [[ ! -t 0 ]]; then
    warn "Нет интерактивного ввода — ответ «нет» на: $prompt"
    return 1
  fi
  read -r -p "$prompt [y/N] " reply || true
  case "${reply,,}" in
    y|yes|д|да) return 0 ;;
    *) return 1 ;;
  esac
}

realpath_safe() {
  if command -v realpath >/dev/null 2>&1; then
    realpath "$1" 2>/dev/null || true
  else
    # fallback: resolve one level of symlink
    local target="$1"
    if [[ -L "$target" ]]; then
      local link
      link="$(readlink "$target")"
      if [[ "$link" != /* ]]; then
        link="$(dirname "$target")/$link"
      fi
      printf '%s\n' "$link"
    else
      printf '%s\n' "$target"
    fi
  fi
}

same_path() {
  local a b
  a="$(realpath_safe "$1")"
  b="$(realpath_safe "$2")"
  [[ -n "$a" && -n "$b" && "$a" == "$b" ]]
}

bin_points_to_cli() {
  local name="$1"
  local link="$BIN_DIR/$name"
  local expected="$INSTALL_DIR/$CLI_REL"
  [[ -L "$link" || -e "$link" ]] || return 1
  same_path "$link" "$expected"
}

is_fully_installed() {
  [[ -f "$INSTALL_DIR/package.json" ]] || return 1
  [[ -d "$INSTALL_DIR/node_modules" ]] || return 1
  [[ -e "$FOLDER_LINK" ]] && same_path "$FOLDER_LINK" "$INSTALL_DIR" || return 1
  bin_points_to_cli fds || return 1
  bin_points_to_cli dependra || return 1
  [[ -f "$MARKER_FILE" ]] || return 1
  return 0
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    ok "git найден: $(git --version)"
    return 0
  fi
  warn "git не найден."
  if command -v apt-get >/dev/null 2>&1; then
    if ask_yn "Установить git через sudo apt-get (нужен sudo)?"; then
      sudo apt-get update
      sudo apt-get install -y git
      command -v git >/dev/null 2>&1 || die "git всё ещё недоступен после установки"
      ok "git установлен"
      return 0
    fi
    die "Нужен git. Установите вручную: sudo apt-get install -y git"
  fi
  die "Нужен git. Установите его пакетным менеджером ОС и повторите запуск."
}

node_major() {
  local v
  v="$(node -v 2>/dev/null | sed 's/^v//' || true)"
  [[ -n "$v" ]] || { echo 0; return; }
  echo "${v%%.*}"
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"
}

install_node_via_nvm() {
  load_nvm
  if ! command -v nvm >/dev/null 2>&1 && [[ ! -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    log "Установка nvm в \$HOME/.nvm (без sudo)…"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    load_nvm
  else
    load_nvm
  fi
  command -v nvm >/dev/null 2>&1 || type nvm >/dev/null 2>&1 || {
    # nvm is a shell function; after sourcing should exist
    load_nvm
  }
  if ! type nvm >/dev/null 2>&1; then
    die "Не удалось загрузить nvm. Откройте новый shell и повторите: bash scripts/install.sh"
  fi
  log "Установка Node.js ${NVM_NODE_VERSION} через nvm…"
  nvm install "$NVM_NODE_VERSION"
  nvm use "$NVM_NODE_VERSION"
  nvm alias default "$NVM_NODE_VERSION" >/dev/null 2>&1 || true
  ok "Node $(node -v), npm $(npm -v)"
}

ensure_node() {
  load_nvm || true
  local major
  major="$(node_major)"
  if [[ "$major" -ge "$MIN_NODE_MAJOR" ]]; then
    ok "Node.js $(node -v) (требуется ≥ ${MIN_NODE_MAJOR})"
    return 0
  fi
  if [[ "$major" -gt 0 ]]; then
    warn "Найден Node.js $(node -v) — нужен ≥ ${MIN_NODE_MAJOR} (TUI / nerd-fonts)."
  else
    warn "Node.js не найден (нужен ≥ ${MIN_NODE_MAJOR})."
  fi
  if ask_yn "Установить Node.js ${NVM_NODE_VERSION} через nvm в \$HOME (без sudo)?"; then
    install_node_via_nvm
    major="$(node_major)"
    [[ "$major" -ge "$MIN_NODE_MAJOR" ]] || die "После nvm версия Node всё ещё < ${MIN_NODE_MAJOR}"
    return 0
  fi
  die "Установите Node.js ≥ ${MIN_NODE_MAJOR} (рекомендуется 22 LTS) и повторите запуск."
}

clone_or_prepare_repo() {
  mkdir -p "$SERVER_DIR"
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    ok "Репозиторий уже есть: $INSTALL_DIR"
    log "Обновление ветки ${REPO_BRANCH}…"
    git -C "$INSTALL_DIR" fetch origin "$REPO_BRANCH"
    git -C "$INSTALL_DIR" checkout "$REPO_BRANCH"
    git -C "$INSTALL_DIR" pull --ff-only origin "$REPO_BRANCH" || warn "pull не удался — используем текущее состояние"
    return 0
  fi
  if [[ -e "$INSTALL_DIR" ]] && [[ ! -d "$INSTALL_DIR/.git" ]]; then
    if [[ -f "$INSTALL_DIR/package.json" ]]; then
      warn "$INSTALL_DIR уже существует без .git — пропускаем clone, ставим зависимости на месте"
      return 0
    fi
    die "Путь $INSTALL_DIR занят и это не репозиторий Dependra. Освободите путь или задайте DEPENDRA_INSTALL_DIR."
  fi
  log "Клонирование ${REPO_URL} (ветка ${REPO_BRANCH}) → ${INSTALL_DIR}"
  git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$INSTALL_DIR"
  ok "Клонирование завершено"
}

npm_install_deps() {
  [[ -f "$INSTALL_DIR/package.json" ]] || die "Нет package.json в $INSTALL_DIR"
  log "npm install в $INSTALL_DIR…"
  (cd "$INSTALL_DIR" && npm install)
  ok "Зависимости npm установлены"
}

create_symlinks() {
  mkdir -p "$BIN_DIR"
  ln -sfn "$INSTALL_DIR" "$FOLDER_LINK"
  ok "Папка: $FOLDER_LINK → $INSTALL_DIR"

  local cli="$INSTALL_DIR/$CLI_REL"
  [[ -f "$cli" ]] || die "Не найден CLI: $cli"
  chmod +x "$cli" || true

  local name
  for name in "${BIN_NAMES[@]}"; do
    ln -sfn "$cli" "$BIN_DIR/$name"
  done
  ok "Команды: ${BIN_NAMES[*]} → $BIN_DIR"
}

ensure_path() {
  case ":$PATH:" in
    *":$BIN_DIR:"*) ok "\$PATH уже содержит $BIN_DIR"; return 0 ;;
  esac
  warn "$BIN_DIR нет в PATH текущей сессии."
  local line='export PATH="$HOME/.local/bin:$PATH"'
  local bashrc="$HOME/.bashrc"
  if [[ -f "$bashrc" ]] && grep -Fqs '.local/bin' "$bashrc"; then
    ok "В $bashrc уже есть упоминание .local/bin — выполните: source ~/.bashrc"
    return 0
  fi
  if ask_yn "Добавить $line в ~/.bashrc?"; then
    {
      echo ""
      echo "# Dependra installer — commands fds / dependra"
      echo "$line"
    } >> "$bashrc"
    ok "Строка добавлена в $bashrc"
    # shellcheck disable=SC1090
    # Apply for remainder of this script if possible
    export PATH="$BIN_DIR:$PATH"
    log "Для текущего терминала также выполните: source ~/.bashrc"
  else
    log "Добавьте вручную в ~/.bashrc:"
    log "  $line"
    log "Затем: source ~/.bashrc"
    export PATH="$BIN_DIR:$PATH"
  fi
}

write_marker() {
  local version="unknown"
  if [[ -f "$INSTALL_DIR/package.json" ]]; then
    version="$(node -p "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).version" "$INSTALL_DIR/package.json" 2>/dev/null || echo unknown)"
  fi
  cat > "$MARKER_FILE" <<EOF
installed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
install_dir=$INSTALL_DIR
folder_link=$FOLDER_LINK
bin_dir=$BIN_DIR
repo=$REPO_URL
branch=$REPO_BRANCH
version=$version
node=$(node -v 2>/dev/null || echo unknown)
EOF
  ok "Маркер: $MARKER_FILE"
}

print_done() {
  log ""
  ok "Dependra установлена."
  log "  Каталог:  $INSTALL_DIR"
  log "  Symlink:  $FOLDER_LINK"
  log "  Команды:  $BIN_DIR/{fds,dependra,deps,dep}"
  log ""
  log "Проверка:"
  log "  dependra --version"
  log "  fds -t"
  log ""
  if command -v dependra >/dev/null 2>&1; then
    dependra --version || true
  else
    "$BIN_DIR/dependra" --version || true
  fi
}

main() {
  log "=== Установщик Dependra ==="
  log "HOME=$HOME"
  log "→ $INSTALL_DIR (ветка $REPO_BRANCH)"
  log ""

  if is_fully_installed; then
    ok "Dependra уже установлена в $INSTALL_DIR"
    log "  Symlink: $FOLDER_LINK"
    log "  Команды: $BIN_DIR/fds, $BIN_DIR/dependra"
    if [[ -f "$MARKER_FILE" ]]; then
      log "  Маркер:"
      sed 's/^/    /' "$MARKER_FILE"
    fi
    log "Повторная установка не требуется."
    exit 0
  fi

  ensure_git
  ensure_node
  clone_or_prepare_repo
  npm_install_deps
  create_symlinks
  ensure_path
  write_marker
  print_done
}

main "$@"
