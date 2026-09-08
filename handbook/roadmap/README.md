---
title: Roadmap
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap
---

# Roadmap

Полный процесс разработки Dependra: большие этапы `S01`–`S10`, подэтапы и задачи.  
Активный этап сейчас: **S01 (MVP core)**. Версию пакета на S01 **не повышать** (`0.0.1`).

## Документы

| Документ | Назначение |
|----------|------------|
| [development-sequence.md](development-sequence.md) | Порядок этапов S01–S10 |
| [stages/](stages/) | Детали каждого большого этапа |
| [mvp-backlog.md](mvp-backlog.md) | Задачи этапа S01 (`MVP-001`…`011`) |
| [todo-checklist.md](todo-checklist.md) | Сводный TODO-чеклист всех этапов |
| [task-template.md](task-template.md) | Шаблон задачи |

## Большие этапы

| ID | Название | Статус | dependsOn | Файл |
|----|----------|--------|-----------|------|
| S01 | MVP core | `в работе` | — | [stages/01-mvp-core.md](stages/01-mvp-core.md) |
| S02 | Углубление анализа B/M | `запланировано` | S01 | [stages/02-deepen-analysis.md](stages/02-deepen-analysis.md) |
| S03 | Validation (D) | `запланировано` | S02 | [stages/03-validation.md](stages/03-validation.md) |
| S04 | Environment / runtime (P+U) | `запланировано` | S02 | [stages/04-environment-runtime.md](stages/04-environment-runtime.md) |
| S05 | Visualization + config (E) | `запланировано` | S03 | [stages/05-visualization-config.md](stages/05-visualization-config.md) |
| S06 | Quality + AI explain (F+I) | `запланировано` | S03 | [stages/06-quality-ai.md](stages/06-quality-ai.md) |
| S07 | Modifications / enhancement | `запланировано` | S05, S06 | [stages/07-modifications.md](stages/07-modifications.md) |
| S08 | TUI и поверхности | `запланировано` | S07 | [stages/08-tui-surfaces.md](stages/08-tui-surfaces.md) |
| S09 | Multi-language + LSP/Tree-sitter | `запланировано` | S08 | [stages/09-multilang.md](stages/09-multilang.md) |
| S10 | Platform / monorepo / releases | `запланировано` | S09 | [stages/10-platform-monorepo.md](stages/10-platform-monorepo.md) |

S04 может идти параллельно с S03 после закрытия S02. S05 и S06 — параллельно после S03. S07 ждёт оба.

## Статусы задач

| Статус | Смысл |
|--------|--------|
| `запланировано` | В backlog, можно брать |
| `ожидает подтверждения` | Нужен approve владельца |
| `в работе` | Исполняется |
| `завершено` | Готово |
| `отложено` | Перенесено |
| `отменено` | Снято |

## Правила

1. Задачи декомпозируются до проверяемого результата.
2. Зависимости указываются явно (`dependsOn`).
3. Смена порядка — с учётом зависимостей и спеки в `docs/`.
4. Новые идеи сначала в backlog со статусом `ожидает подтверждения` / `отложено`, не сразу в код.
5. Roadmap не заменяет продуктовую спеку.
6. Фича из deferred → следующий этап только через запись здесь и спеку в `docs/` до уровня `_template.md`.
7. Закрытие большого этапа — только после exit criteria и approve владельца.

## Связь

- Спека: [`docs/`](../../docs/README.md)
- Deferred → этапы: [`docs/20-features/deferred/README.md`](../../docs/20-features/deferred/README.md)
- Контекст: [`../context/`](../context/README.md)
- Архив: [`.dep/.blueprint/80-roadmap/`](../../.dep/.blueprint/80-roadmap/README.md)
