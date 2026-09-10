---
title: CLI флаги S07
status: accepted
mvp: false
source: handbook/roadmap/stages/07-modifications.md, docs/50-cli/interface.md
---

# CLI флаги S07

## Цель

Зафиксировать флаги этапа **S07** (modifications / enhancement): safety-режимы + mutate-ops. Версия пакета остаётся `0.0.47` (не повышать без approve).

## Правила short

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).  
Short S01–S06 не переназначать  
(`-b|-i|-e|-g|-j|-p|-h|-v|-a|-en|-va|-env|-c|-ec|-r|-io|-m|-gr|-vj|-me|-l|-pr|-cf|-q|-ex`).

## Safety / control (не analysis ops)

| Long | Short | Аргумент | Смысл |
|------|-------|----------|--------|
| `--apply` | `-ap` | — | Разрешить запись/exec (`-a` занят → `-ap`) |
| `--dry-run` | `-dr` | — | Запрет записи; побеждает `--apply` |
| `--backup` | `-bk` | — | Явно требовать backup при apply (default и так on) |
| `--no-backup` | — | — | Apply без backup (warning) |
| `--undo` | `-u` | — | Восстановить последнюю backup session |
| `--undo-session` | — | `<id>` | Undo конкретной session |
| `--change` | — | `<id>` | Selective apply (repeatable) |
| `--changes` | — | `<id,id>` | Selective apply списком |

## Mutate operations

| Long | Short | Почему short | Op id | Text / report |
|------|-------|--------------|-------|---------------|
| `--format` | `-f` | свободна | `format` | в `modification.changes` |
| `--sort-imports` | `-si` | mnemonic | `sort-imports` | |
| `--fix-imports` | `-fi` | `-f` занят | `fix-imports` | |
| `--fix-exports` | `-fe` | symmetric | `fix-exports` | |
| `--strip-comments` | `-sc` | mnemonic | `strip-comments` | |
| `--comment-banner` | `-cb` | `-c` занят | `add-file-banner` | |
| `--install-deps` | `-id` | `-i` занят | `install-deps` | |
| `--ai-modify` | `-am` | `-a` занят | `ai-modify` | |

Опциональные args:

| Long | Arg |
|------|-----|
| `--pm` | `npm\|pnpm\|yarn\|bun` |
| `--install-package` | `<name>` |
| `--aim-instruction` | `<text>` |

### Запрещено в S07

- Uppercase-short; кластеры (`-fsi`)
- Включать mutate-ops в default-all
- Включать mutate-ops в `--level` 1..5
- Запись без `--apply` (кроме невозможности — всегда preview)
- Секреты AI в argv / `.conf`

## Default и комбинации

- Нет analysis ops и нет mutate/undo → как S01 default-all **только если** есть `<file>` и нет mutate/undo;  
  если указан только mutate-op → **не** разворачивать S01 default-all (только prerequisites нужные ops).
- Mutate без `--apply` → `modification.mode = "preview"`.
- `--dry-run` → mode `dry-run`, никогда write/exec.
- `--undo` — отдельный путь; можно без analysis flags.
- Примеры:
  - `dependra f.js -f` — preview format
  - `dependra f.js -f -si --apply` — backup + write
  - `dependra f.js -fi --apply --change c1`
  - `dependra f.js -id --dry-run`
  - `dependra --undo`
  - `dependra f.js -am --aim-instruction "simplify" --apply` (нужен ai.enabled+key)

## Соответствие `results` / `options`

```json
{
  "format": true,
  "sortImports": true,
  "fixImports": true,
  "fixExports": false,
  "stripComments": false,
  "commentBanner": false,
  "installDeps": false,
  "aiModify": false,
  "apply": false,
  "dryRun": false,
  "backup": true,
  "noBackup": false
}
```

| Условие | Ключ `results` |
|---------|----------------|
| любой mutate-op и/или apply/dry-run plan | `modification` |
| `--undo` | `modification-undo` (или `modification` с `mode: "undo"`) |

Предпочтение: один ключ `modification` ([safety.md](../20-features/modifications/safety.md)).

## Pipeline (дополнение)

1. Argv → config merge → `options` (S05).
2. Analysis inspectors по обычным правилам (S01–S06).
3. Если mutate-ops: построить Changes (порядок: fix-imports → fix-exports → sort-imports → comments → format → install-deps → ai-modify).
4. Safety: preview | dry-run | apply (+ backup).
5. Reporters: секция `modification` только если mutate/undo запрошены.

## Help (schematic)

```
┌─ operations · s07 ─────────────────────────────┐
│ -f,  --format            normalize / format    │
│ -si, --sort-imports      sort import blocks    │
│ -fi, --fix-imports       fix unused/broken     │
│ -fe, --fix-exports       unused exports        │
│ -sc, --strip-comments    remove comments       │
│ -id, --install-deps      PM install (danger)   │
│ -am, --ai-modify         AI patch (opt)        │
│                                                │
│ -ap, --apply             write/exec            │
│ -dr, --dry-run           no write (wins)       │
│ -u,  --undo              restore backup        │
│                                                │
│ default = preview; не default-all / не level   │
└────────────────────────────────────────────────┘
```

## Config

Опционально OR из `.conf`:

```conf
[operations]
format = false
sortImports = false
fixImports = false
installDeps = false
aiModify = false
```

Apply/dry-run **только** CLI (не из conf), чтобы conf не включал запись сам по себе.

## Acceptance criteria

- [ ] Short-флаги S07 не конфликтуют с S01–S06
- [ ] Default-all не включает mutate
- [ ] Level 1..5 не включает mutate
- [ ] Preview без `--apply`; `--dry-run` блокирует apply
- [ ] Help: рамка `operations · s07`
- [ ] JSON `options` содержит булевы mutate/safety
- [ ] `--undo` восстановливает фикстуру после apply
