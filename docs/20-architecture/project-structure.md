---
title: Структура проекта
status: accepted
mvp: true
source: .dep/.blueprint/30-architecture/requirements/project-structure.md
---

# Структура проекта

## Цель

Целевое дерево каталогов, отражающее модульную архитектуру.

## Целевое дерево

```
src/
├── api/           # public surface (S08)
├── cli/
├── tui/           # neo-blessed TUI (S08)
├── core/
├── scanner/
├── inspectors/
├── analyzers/
├── parsers/
├── dependency/
├── graph/
├── metadata/
├── permissions/
├── runtime/
├── plugins/
├── reporters/
├── modifications/
├── config/
├── cache/
├── utils/
└── types/

docs/          # рабочая продуктовая спека
handbook/      # ADR, roadmap, context
tests/
examples/      # по мере необходимости
```

## Правила

1. Создавать каталог модуля, когда появляется **используемый** код модуля (не пустые папки «на будущее»).
2. Расширение дерева допускается при соблюдении принципов архитектуры.
3. Рабочая документация — в `docs/` и `handbook/`, не в `.dep/.blueprint/`.

## Acceptance criteria

- [ ] Реализация MVP не требует сразу всех каталогов
- [ ] Новые модули не ломают границы ответственности
