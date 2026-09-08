---
title: Отложенный функционал
status: deferred
mvp: false
source: .dep/.blueprint/20-features
---

# Отложенный функционал (deferred)

Всё перечисленное **не** входит в этап **S01** (`0.0.1`). Детали blueprint — в [`.dep/.blueprint/20-features/`](../../../.dep/.blueprint/20-features/README.md).  
Целевые большие этапы — в [`handbook/roadmap`](../../../handbook/roadmap/README.md).

## Анализ

| Раздел blueprint | Тег | Целевой этап | Заметка |
|------------------|-----|--------------|---------|
| additional-file-information | B | [S02](../../../handbook/roadmap/stages/02-deepen-analysis.md) | Спека: [analysis/additional-file-information.md](../analysis/additional-file-information.md); CLI: [s02-flags.md](../../50-cli/s02-flags.md) |
| exported-entities (глубокий) | M | [S02](../../../handbook/roadmap/stages/02-deepen-analysis.md) | Спека: [analysis/exported-entities.md](../analysis/exported-entities.md); short `-en` |
| validation | D | [S03](../../../handbook/roadmap/stages/03-validation.md) | Проверка корректности |
| file-environment-analysis | P | [S04](../../../handbook/roadmap/stages/04-environment-runtime.md) | Окружение файла |
| commands | P | [S04](../../../handbook/roadmap/stages/04-environment-runtime.md) | Доступные команды |
| environment-validation | P | [S04](../../../handbook/roadmap/stages/04-environment-runtime.md) | Проверка окружения |
| runtime-dependency-analysis | U | [S04](../../../handbook/roadmap/stages/04-environment-runtime.md) | Зависимости runtime |
| file-operations | U | [S04](../../../handbook/roadmap/stages/04-environment-runtime.md) | I/O-анализ |
| visualization | E | [S05](../../../handbook/roadmap/stages/05-visualization-config.md) | Mermaid/Graphviz и др. |
| metadata | U | [S05](../../../handbook/roadmap/stages/05-visualization-config.md) | Расширенные метаданные |
| code-quality-analysis | F | [S06](../../../handbook/roadmap/stages/06-quality-ai.md) | Качество кода |
| file-enhancement-functions | E/I/F | [S07](../../../handbook/roadmap/stages/07-modifications.md) | Усовершенствование (обзор) |

## Модификации

Вся подсистема [modifications/](../../../.dep/.blueprint/20-features/modifications/README.md) → этап **[S07](../../../handbook/roadmap/stages/07-modifications.md)** (safety, AI mods, imports/exports ops, comments, environment, …).

## Пользовательский UI

TUI и blueprint `50-user/tui` → этап **[S08](../../../handbook/roadmap/stages/08-tui-surfaces.md)**.  
CLI MVP — в [docs/50-cli](../../50-cli/interface.md) (S01).

## Прочее (вне feature-таблицы)

| Тема | Целевой этап |
|------|--------------|
| Config profiles / `--level` | [S05](../../../handbook/roadmap/stages/05-visualization-config.md) |
| AI explain (без мутаций) | [S06](../../../handbook/roadmap/stages/06-quality-ai.md) |
| Multi-language / LSP / Tree-sitter | [S09](../../../handbook/roadmap/stages/09-multilang.md) |
| Build-system / monorepo / releases | [S10](../../../handbook/roadmap/stages/10-platform-monorepo.md) |

## Правило возврата

Фича переводится из deferred в активный этап только через запись в [`handbook/roadmap`](../../../handbook/roadmap/README.md) и уточнение спеки в `docs/` до уровня шаблона (`_template.md`).
