---
title: MVP backlog
status: draft
mvp: true
source: .dep/.blueprint/80-roadmap
---

# MVP backlog (0.0.1)

Детализация задач большого этапа **[S01 — MVP core](stages/01-mvp-core.md)**. Версию пакета **не повышать**.

| ID | Название | Приоритет | dependsOn | Статус |
|----|----------|-----------|-----------|--------|
| MVP-001 | Утвердить рабочую спеку `docs/` + `handbook/` | высокий | — | `завершено` |
| MVP-002 | Каркас `src/`: cli, core, регистрация инспекторов | высокий | MVP-001 | `завершено` |
| MVP-003 | ADR: выбор JS AST-парсера | высокий | MVP-001 | `завершено` |
| MVP-004 | Модуль `parsers` + загрузка SourceFile | высокий | MVP-002, MVP-003 | `завершено` |
| MVP-005 | Инспектор basic-file-information | высокий | MVP-002 | `завершено` |
| MVP-006 | Инспектор import-export-analysis | высокий | MVP-004 | `завершено` |
| MVP-007 | Инспектор dependency-analysis | высокий | MVP-006 | `запланировано` |
| MVP-008 | Reporters text + json (все MVP-секции) | высокий | MVP-005, MVP-006, MVP-007 | `запланировано` |
| MVP-009 | CLI флаги MVP + pipeline + коды выхода | высокий | MVP-005, MVP-006, MVP-007, MVP-008 | `запланировано` |
| MVP-010 | Фикстуры и тесты AC | высокий | MVP-009 | `запланировано` |
| MVP-011 | Обновить handbook/context после стабилизации | средний | MVP-010 | `запланировано` |

Детали спеки:

- [mvp-scope.md](../../docs/20-features/mvp-scope.md)
- [interface.md](../../docs/50-cli/interface.md)

Шаблон новой задачи: [task-template.md](task-template.md).
