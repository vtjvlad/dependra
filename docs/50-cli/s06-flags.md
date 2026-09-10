---
title: CLI флаги S06
status: accepted
mvp: false
source: handbook/roadmap/stages/06-quality-ai.md, docs/50-cli/interface.md
---

# CLI флаги S06

## Цель

Зафиксировать operation-флаги этапа **S06** (quality F + AI explain I) в правилах S01–S05: long/short, pipeline/`results`, schematic help/text.

Версия пакета остаётся `0.0.39` (не повышать без approve).

## Правила short

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).  
Short S01–S05 не переназначать  
(`-b|-i|-e|-g|-j|-p|-h|-v|-a|-en|-va|-env|-c|-ec|-r|-io|-m|-gr|-vj|-me|-l|-pr|-cf`).

## Флаги операций S06

| Long | Short | Почему short | Инспектор / модуль | Text-секция |
|------|-------|--------------|-------------------|-------------|
| `--quality` | `-q` | `q` свободна | `code-quality-analysis` | `quality` |
| `--explain` | `-ex` | `-e` = exports → `-ex` | `ai-explain` (pass) | `ai-explain` |

### Запрещено в S06

- Uppercase-short; кластеры (`-qex`)
- Включать quality/explain в default-all
- Делать AI обязательным для `-q`
- Хранить API key в argv / `.conf`

## Default и комбинации

- Нет ops после merge → default-all **только S01**.
- Quality / explain — только явное включение (или через `--level` / profile / `ai.explain`).
- `--explain` **OR-включает** `quality` (в `options` и в `results`).
- Примеры:
  - `dependra f.js -q`
  - `dependra f.js -q -j`
  - `dependra f.js -q -va`
  - `dependra f.js -ex` (нужны `ai.enabled` + ключ в env для реального вызова)
  - `dependra f.js -l 4` (после S06 level 4 включает `quality`, **не** explain)

## Соответствие флагов и `results`

| Флаги / options | Ключ в `results` | Text title |
|-----------------|------------------|------------|
| `--quality` / `-q` или explain→OR | `code-quality-analysis` | `quality` |
| `--explain` / `-ex` или `ai.explain` | `ai-explain` | `ai-explain` |

`options` в JSON-отчёте дополняется:

```json
{
  "quality": true,
  "explain": true
}
```

Булевы — итог после merge (CLI ∨ config operations ∨ level ∨ `ai.explain` для explain).

## Pipeline (дополнение)

1. Разобрать argv → load configs → merge → итоговый `options` ([s05-config.md](../35-configuration/s05-config.md)).
2. Если `options.explain` → `options.quality = true`.
3. Если `options.quality`:
   - инспектор `code-quality-analysis` → `results["code-quality-analysis"]`.
4. Если `options.explain`:
   - после quality (и validation, если была) — AI explain pass → `results["ai-explain"]` (возможно `skipped`).
5. Reporters: секции только для включённых ops.

Детали: [code-quality-analysis.md](../20-features/analysis/code-quality-analysis.md), [ai-explain.md](../20-features/analysis/ai-explain.md).

## Help (schematic)

```
┌─ operations · s06 ─────────────────────────────┐
│ -q, --quality           code quality metrics   │
│ -ex, --explain          AI explanations (opt)  │
│                                                │
│ quality offline; explain нужен ai.enabled+key  │
│ не default-all                                 │
└────────────────────────────────────────────────┘
```

## Text (идея секций)

См. [output-formats.md](output-formats.md#секции-s06).

```
┌─ quality ──────────────────────────────────────┐
│  scores · metrics · findings (UNUSED_LOCAL…)   │
└────────────────────────────────────────────────┘

┌─ ai-explain ───────────────────────────────────┐
│  provider · explanations | skipped: reason     │
└────────────────────────────────────────────────┘
```

## Config / levels

- `operations.quality` / (опц.) профиль — OR с CLI.
- `ai.explain` → `options.explain` (и тем самым quality).
- `--level 4` включает `quality` (см. [analysis-levels.md](../40-development/analysis-levels.md)); explain **никогда** из level.

## Acceptance criteria

- [ ] Short `-q` / `-ex` документированы и не конфликтуют с S01–S05
- [ ] Default-all не включает quality/explain
- [ ] `-ex` без `-q` всё равно даёт ключ `code-quality-analysis`
- [ ] Help: рамка `operations · s06`
- [ ] JSON `options` содержит `quality` / `explain`
- [ ] `-q` не требует сети; `-ex` при выключенном AI не валит exit
