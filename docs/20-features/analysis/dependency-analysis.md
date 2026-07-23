---
title: Отображение зависимостей
status: draft
mvp: true
source: .dep/.blueprint/20-features/dependency-analysis---M
tags: [M]
---

# Отображение зависимостей (−M)

## Цель

Показать зависимости целевого файла в двух колонках:

- **слева** — файлы, которые **импортируют** текущий файл (`imported-by`);
- **справа** — файлы / модули, **из которых** импортирует текущий файл (`imports`).

## Границы

### Входит

- Построение рёбер на основе результатов import-анализа целевого файла (правая колонка)
- Поиск обратных ссылок в ограниченной области (левая колонка): для MVP — сканирование каталога проекта с эвристикой корня (cwd или ближайший `package.json`), только `.js`/`.mjs`/`.cjs`
- Режимы пути: `name` | `relative` | `absolute`

### Не входит

- Полный project-wide индексер с кэшем (упрощённый скан допустим)
- npm-граф пакетов
- Runtime-зависимости (`deferred` U)
- Mermaid/Graphviz визуализация (`deferred` E)

## Вход

- Целевой файл
- `options.pathMode`: `"name"` \| `"relative"` \| `"absolute"` (default: `"relative"`)
- Инспектор: `dependency-analysis`
- Желательно уже заполненные imports в модели

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "importedBy": [
    { "display": "src/main.js", "path": "/abs/proj/src/main.js" }
  ],
  "imports": [
    { "display": "src/lib.js", "path": "/abs/proj/src/lib.js", "external": false },
    { "display": "fs", "path": null, "external": true }
  ]
}
```

### Текстовый режим (идея)

```
imported-by                    imports
----------------------------   ----------------------------
src/main.js                    src/lib.js
                               fs
```

## Правила

1. `pathMode=name` — basename; `relative` — от cwd; `absolute` — abs path.
2. External (bare/builtin) показываются в `imports` с `external: true`, `path: null`.
3. Левая колонка: только файлы, у которых в AST найден import/require на целевой файл (resolved).
4. Производительность MVP: допустим наивный скан; при росте — cache (ADR).

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `SCAN_FAILED` | execution | Сбой обхода проекта |
| `PARSE_FAILED` | execution | Не разобран целевой или кандидат (кандидат можно пропустить с подсчётом skipped — зафиксировать в details) |

Для MVP: ошибка парсинга **целевого** файла — fatal; ошибка парсинга кандидата — skip + `details.skipped[]` допустим.

## Зависимости

- [import-export-analysis.md](import-export-analysis.md)
- `dependency` / `graph`, `scanner`
- [project-model.md](../../20-architecture/project-model.md)

## Acceptance criteria

- [ ] Две колонки в JSON и в text-reporter
- [ ] Три `pathMode` работают
- [ ] External модули видны справа
- [ ] Хотя бы один reverse-edge находится на фикстуре
