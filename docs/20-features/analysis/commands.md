---
title: Команды для файла
status: draft
mvp: false
source: .dep/.blueprint/20-features/commands---P
tags: [P]
---

# Команды (−P, S04)

## Цель

Список **CLI-команд**, которые могут работать с данным файлом **без sudo** (просмотр / копирование / сравнение и т.п.) — из фиксированного каталога утилит, отфильтрованного по наличию в `PATH`.

## Границы

### Входит (S04)

- Каталог утилит работы с файлом (не рантаймы запуска): например `cat`, `less`, `head`, `tail`, `grep`, `sed`, `awk`, `diff`, `cp`, `mv`, `ln`, `stat`, `file`, `strings`, `hexdump`, `wc`, `od`, `base64`, `sha256sum` / `shasum` (платформенные алиасы)
- Проверка: команда резолвится в `PATH` (`which`-like, без выполнения самой утилиты на файле)
- Пометка `available: true|false`
- Не включать интерпретаторы/рантаймы запуска файла: `node`, `nodejs`, `python`, `python3`, `java`, `ruby`, `php`, `lua`, `deno`, `bun` (как **рантайм**; `bun` как package-manager — в environment-validation, не здесь)

### Не входит

- Подбор флагов/примеров команд с путём файла (можно кратко в `example` позже; в S04 — имя + availability)
- `sudo`-варианты и privilege escalation
- Windows-specific (`type`, `findstr`) как обязательные — optional best-effort если `process.platform === 'win32'`
- Запуск файла через runtime (это [runtime-dependency-analysis](runtime-dependency-analysis.md))

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--commands` | `-c` | `c` свободна |

Не в default-all.  
Спека: [s04-flags.md](../../50-cli/s04-flags.md).

## Инспектор

- id: `commands`
- Text-секция: `commands`

## Вход

- Существующий файл (команды «про файл», не зависят от языка жёстко)
- `PATH` из `process.env`

## Выход (`data`)

```json
{
  "commands": [
    { "name": "cat", "available": true },
    { "name": "less", "available": true },
    { "name": "hexdump", "available": false }
  ]
}
```

Порядок: стабильный по каталогу спеки (не по locale PATH).

## Правила

1. Только проверка существования исполняемого в PATH — **не** запускать утилиту на целевом файле.
2. Каталог имён — константа в модуле инспектора (документированный список ≥ blueprint examples).
3. Дубликаты имён не допускаются.
4. Отсутствие PATH → все `available: false` + не ошибка инспектора (или `details.pathMissing`).

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `NOT_A_FILE` | validation | Не файл |

## Зависимости

- [s04-flags.md](../../50-cli/s04-flags.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] `-c` / `--commands` → ключ `commands`
- [ ] В списке есть `cat` / `stat` (или платформенные эквиваленты в каталоге)
- [ ] Нет `node` / `python` в `commands[]`
- [ ] `available` отражает PATH на тестовой машине хотя бы для одной утилиты `true`
- [ ] Не в default-all
