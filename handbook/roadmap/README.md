---
title: Roadmap
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap
---

# Roadmap

Полный процесс разработки Dependra: большие этапы `S01`–`S11`, подэтапы и задачи.  
Активный этап сейчас: **S09 (Multi-language + LSP/Tree-sitter)**. S01–S08 — `завершено`; S09-A–C и тесты S09-D — готовы (ждёт approve этапа). Версию пакета **не повышать** (`0.0.47`), пока владелец не решит иначе.

## Документы

| Документ | Назначение |
|----------|------------|
| [development-sequence.md](development-sequence.md) | Порядок этапов S01–S11 |
| [stages/](stages/) | Детали каждого большого этапа |
| [mvp-backlog.md](mvp-backlog.md) | Задачи этапа S01 (`MVP-001`…`011`) |
| [todo-checklist.md](todo-checklist.md) | Сводный TODO-чеклист всех этапов |
| [task-template.md](task-template.md) | Шаблон задачи |

## Большие этапы

| ID | Название | Статус | dependsOn | Файл |
|----|----------|--------|-----------|------|
| S01 | MVP core | `завершено` | — | [stages/01-mvp-core.md](stages/01-mvp-core.md) |
| S02 | Углубление анализа B/M | `завершено` | S01 | [stages/02-deepen-analysis.md](stages/02-deepen-analysis.md) |
| S03 | Validation (D) | `завершено` | S02 | [stages/03-validation.md](stages/03-validation.md) |
| S04 | Environment / runtime (P+U) | `завершено` | S02 | [stages/04-environment-runtime.md](stages/04-environment-runtime.md) |
| S05 | Visualization + config (E) | `завершено` | S03 | [stages/05-visualization-config.md](stages/05-visualization-config.md) |
| S06 | Quality + AI explain (F+I) | `завершено` | S03 | [stages/06-quality-ai.md](stages/06-quality-ai.md) |
| S07 | Modifications / enhancement | `завершено` | S05, S06 | [stages/07-modifications.md](stages/07-modifications.md) |
| S08 | TUI и поверхности | `завершено` | S07 | [stages/08-tui-surfaces.md](stages/08-tui-surfaces.md) |
| S09 | Multi-language + LSP/Tree-sitter | `в работе` (тесты готовы → approve этапа) | S08 | [stages/09-multilang.md](stages/09-multilang.md) |
| S10 | Platform / monorepo | `запланировано` | S09 | [stages/10-platform-monorepo.md](stages/10-platform-monorepo.md) |
| S11 | Build System | `запланировано` | S10 | [stages/11-build-system.md](stages/11-build-system.md) |

S04 может идти параллельно с S03 после закрытия S02. S05 и S06 — параллельно после S03. S07 ждёт оба. S11 — только после остальных этапов (после S10).

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
