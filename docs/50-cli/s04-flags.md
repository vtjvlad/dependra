---
title: CLI флаги S04
status: draft
mvp: false
source: handbook/roadmap/stages/04-environment-runtime.md, docs/50-cli/interface.md
---

# CLI флаги S04

## Цель

Зафиксировать operation-флаги этапа **S04** (P+U: environment / runtime) в правилах S01–S03: long/short, pipeline/`results`, schematic help/text.

Версия пакета остаётся `0.0.39` (не повышать без approve).

## Правила short

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).  
Short S01–S03 не переназначать (`-b|-i|-e|-g|-j|-p|-h|-v|-a|-en|-va`).

## Флаги операций S04

| Long | Short | Почему short | Инспектор | Text-секция |
|------|-------|--------------|-----------|-------------|
| `--environment` | `-env` | `-e`/`-en` заняты → `-env` | `file-environment-analysis` | `environment` |
| `--commands` | `-c` | `c` свободна | `commands` | `commands` |
| `--env-check` | `-ec` | env-check; не путать с `-env` | `environment-validation` | `env-check` |
| `--runtime` | `-r` | `r` свободна | `runtime-dependency-analysis` | `runtime` |
| `--io` | `-io` | `-i` = imports → `-io` | `file-operations` | `io` |

### Запрещено в S04

- Путать `-env` (окружение файла) и `-ec` (проверка tools)
- Uppercase-short; кластеры (`-cr`)
- Включать S04-флаги в default-all
- Мутации FS / `npm install` из этих операций

## Default и комбинации

- Нет S01/S02/S03/S04 op-флагов → default-all **только S01** (четыре операции).
- Любой S04-флаг — только явное включение.
- Примеры: `dependra f.js -env`, `dependra f.js -c -ec -j`, `dependra f.js -r -io -p name`.

## Соответствие флагов и `results`

| Флаги | Ключ в `results` | Text title |
|-------|------------------|-----------|
| `--environment` / `-env` | `file-environment-analysis` | `environment` |
| `--commands` / `-c` | `commands` | `commands` |
| `--env-check` / `-ec` | `environment-validation` | `env-check` |
| `--runtime` / `-r` | `runtime-dependency-analysis` | `runtime` |
| `--io` / `-io` | `file-operations` | `io` |

`options` в JSON дополняется boolean-полями:

```json
{
  "environment": true,
  "commands": true,
  "envCheck": true,
  "runtime": true,
  "io": true
}
```

Имена полей options: `environment`, `commands`, `envCheck`, `runtime`, `io` (camelCase для env-check).

## Pipeline (дополнение)

1. S04-флаги не требуют import-export, **кроме** `--io` / `-io` (нужен AST → `ensureTargetSourceFile`).
2. Environment / commands / env-check / runtime — FS + PATH (+ shebang read).
3. При только S04-флагах S01-секции в `results` не появляются.
4. Reporters: schematic-секции только для включённых флагов.

Детали данных — feature-спеки в [docs/20-features/analysis/](../20-features/analysis/).

## Help (schematic)

```
┌─ operations · s04 ─────────────────────────────┐
│ -env, --environment     ссылки, скрипты, entry │
│ -c, --commands          утилиты файла (PATH)   │
│ -ec, --env-check        наличие node/npm/…     │
│ -r, --runtime           чем запускать файл     │
│ -io, --io               fs read/write/… (AST)  │
│                                                │
│ только явное включение (не в default-all)      │
└────────────────────────────────────────────────┘
```

## Text (идея секций)

```
┌─ environment ──────────────────────────────────┐
│  symlink / hardlink / scripts / entry-points   │
└────────────────────────────────────────────────┘

┌─ commands ─────────────────────────────────────┐
│  cat ✓ · less ✓ · hexdump ✗ · …                │
└────────────────────────────────────────────────┘

┌─ env-check ────────────────────────────────────┐
│  node ✓ v22 · pnpm ✗ missing                   │
└────────────────────────────────────────────────┘

┌─ runtime ──────────────────────────────────────┐
│  interpreter node · hint: node src/app.js      │
└────────────────────────────────────────────────┘

┌─ io ───────────────────────────────────────────┐
│  read  readFileSync  ./data.json               │
│  write writeFile     (dynamic)                  │
└────────────────────────────────────────────────┘
```

См. [output-formats.md](output-formats.md#секции-s04).

## Acceptance criteria

- [ ] Все пять short документированы и не конфликтуют с S01–S03
- [ ] `-env` ≠ `-ec`
- [ ] Default-all не включает S04
- [ ] Help: рамка `operations · s04`
- [ ] JSON `options` содержит `environment` / `commands` / `envCheck` / `runtime` / `io`
- [ ] Text-секции появляются только при соответствующих флагах
