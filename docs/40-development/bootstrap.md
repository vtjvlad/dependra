---
title: Bootstrap-установка
status: draft
mvp: false
source: scripts/install.sh
---

# Bootstrap-установка

Временный способ поставить Dependra на Linux до полноценного release pipeline (S11).

## Скрипт

[`scripts/install.sh`](../../scripts/install.sh)

- Каталог: `$HOME/server/dependra`
- Symlink папки: `$HOME/server/fds` → `dependra`
- Команды: `$HOME/.local/bin/{fds,dependra,deps,dep}`
- Клон: `https://github.com/vtjvlad/dependra.git`, ветка `dev`
- Node.js ≥ 20 (при необходимости предлагает nvm + Node 22 **без sudo**)
- `git` через `apt` — только после явного `y/N` (с sudo)
- Повторный запуск при полной установке: сообщение «уже установлена» и выход

## Запуск

Интерактивно (рекомендуется — нужны ответы y/N):

```bash
curl -fsSL https://raw.githubusercontent.com/vtjvlad/dependra/dev/scripts/install.sh -o /tmp/dependra-install.sh
bash /tmp/dependra-install.sh
```

Или из уже клонированного репозитория:

```bash
bash scripts/install.sh
```

Переменные окружения (опционально): `DEPENDRA_INSTALL_DIR`, `DEPENDRA_REPO_URL`, `DEPENDRA_REPO_BRANCH`, `DEPENDRA_NODE_VERSION`.

## После установки

```bash
source ~/.bashrc   # если добавили PATH
dependra --version
fds -t
```
