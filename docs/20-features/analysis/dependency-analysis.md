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

- **слева** — файлы, которые **импортируют** текущий файл (`importedBy`);
- **справа** — файлы / модули, **из которых** импортирует текущий файл (`imports`).

## Границы

### Входит

- Правая колонка — из `ProjectModel.imports` целевого файла (после import-export prerequisite)
- Левая колонка — reverse-scan в корне проекта (см. правила корня), только `.js`/`.mjs`/`.cjs`
- Режимы пути: `name` | `relative` | `absolute`

### Не входит

- Полноценный индексер с кэшем
- npm-граф пакетов
- Runtime-зависимости (`deferred` U)
- Mermaid/Graphviz (`deferred` E)

## Вход

- Целевой файл
- `options.pathMode`: `"name"` \| `"relative"` \| `"absolute"` (default: `"relative"`)
- Инспектор: `dependency-analysis`
- В модели уже должны быть imports целевого файла (pipeline CLI **обязан** прогнать import-export до graph)

## Выход (`data`)

Поле внешнего модуля: **`isExternal`** (единое имя с моделью).

```json
{
  "pathMode": "relative",
  "importedBy": [
    { "display": "src/main.js", "path": "/abs/proj/src/main.js" }
  ],
  "imports": [
    { "display": "src/lib.js", "path": "/abs/proj/src/lib.js", "isExternal": false },
    { "display": "fs", "path": null, "isExternal": true }
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

## Корень проекта для reverse-scan (приоритет)

1. Подняться от директории **целевого файла** к корню FS и взять ближайший каталог с `package.json`.
2. Если не найден — использовать `cwd` из контекста.
3. Сканировать дерево этого корня (исключая `node_modules`, `.git` как минимум).

## Правила

1. `pathMode=name` — basename; `relative` — от `cwd`; `absolute` — abs path.
2. External (bare/builtin) справа: `isExternal: true`, `path: null`.
3. Слева: только файлы, у которых AST содержит import/require на целевой файл с успешным resolve на тот же abs path.
4. Нет imports в модели → ошибка `MODEL_INCOMPLETE` (configuration), не молчаливый пустой граф справа из-за пропуска prerequisite.
5. Ошибка парсинга **целевого** (на этапе prerequisite) — fatal для graph.
6. Ошибка парсинга **кандидата** reverse-scan — skip + `details.skipped[]` (пути), анализ продолжается.
7. Лимит размера дерева в MVP не задан; `node_modules` не сканировать. При необходимости лимита — отдельный ADR позже.
8. Пути: поведение Node `path` на текущей ОС; отдельная Windows-матрица не требуется в AC MVP.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет целевого файла |
| `MODEL_INCOMPLETE` | configuration | Нет подготовленных imports в модели |
| `SCAN_FAILED` | execution | Сбой обхода корня |
| `PARSE_FAILED` | execution | Не разобран целевой (обычно на prerequisite) |

## Зависимости

- [import-export-analysis.md](import-export-analysis.md) (prerequisite)
- [interface.md](../../50-cli/interface.md) (pipeline)
- `dependency` / `graph`, `scanner`
- [project-model.md](../../20-architecture/project-model.md)

## Acceptance criteria

- [ ] Две колонки в JSON и text-reporter
- [ ] Три `pathMode` работают
- [ ] External модули справа с `isExternal: true`
- [ ] Хотя бы один reverse-edge на фикстуре
- [ ] Корень выбирается по правилу package.json → cwd
- [ ] Без prerequisite — `MODEL_INCOMPLETE`, не «пустой успех»
