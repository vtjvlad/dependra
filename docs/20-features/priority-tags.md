---
title: Приоритетные теги
status: accepted
mvp: true
source: .dep/.blueprint/20-features/priority-tags.md
---

# Приоритетные теги

## Цель

Внутренняя классификация фич для порядка разработки. **Не** являются CLI-флагами (хотя часть имён может совпасть позже).

| Тег | Длинное имя | Смысл |
|-----|-------------|--------|
| `-B` | base | Базовая |
| `-M` | main | Основная |
| `-U` | unfolded | Расширенная |
| `-P` | pro | Продвинутая |
| `-D` | deep | Глубокая |
| `-F` | full | Полная |
| `-I` | intelligence | С использованием ИИ |
| `-E` | enhance / visual | Визуализация (Mermaid/Graphviz) и file-enhancement в blueprint; **не** CLI-флаг MVP |

## Для MVP (0.0.1)

Реализуем фичи с тегами **B** и **M** из [mvp-scope.md](mvp-scope.md). Остальные теги — deferred.

## Acceptance criteria

- [ ] В документах фич указан тег
- [ ] CLI не путает внутренние теги с флагами запуска
