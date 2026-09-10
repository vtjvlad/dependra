---
title: Public API
status: accepted
mvp: false
source: handbook/roadmap/stages/08-tui-surfaces.md
---

# Public API

## Цель

Единая поверхность для CLI, TUI и future surfaces. Модуль: [`src/api/index.js`](../../src/api/index.js).

## Правило

TUI и внешние клиенты **не** импортируют `src/inspectors/*`, `src/parsers/*`, `src/cli/*` (кроме собственного entry). Только `dependra` / `src/api`.

## Поверхность

| Символ | Назначение |
|--------|------------|
| `registerBuiltins()` | Регистрация встроенных инспекторов (идемпотентно) |
| `analyze({ targetPath, cwd, options })` | `createAnalysisContext` + `runPipeline` → `{ report, exitCode, prerequisiteErrors }` |
| `formatText(report, opts)` | Текстовый/JSON отчёт через reporters |
| `listOperations()` | Каталог ops для picker: `{ key, label, group }` |
| `OPERATION_KEYS` | Ключи операций конфига |
| `emptyConfigModel()` | Пустая модель |
| `loadMergedConfig(opts)` | Merge user + project conf |
| `loadConfFile` / `normalizeConfData` | Низкоуровневая загрузка |
| `applyProfile` / `applyLevel` | Применение профиля / level |
| `serializeConf(model)` | Модель → текст `.conf` |
| `saveConf(path, model)` | Запись `.conf` на диск |
| `resolveUserConfPath` / `resolveProjectConfPath` | Пути конфигов |
| `runUndo` / `hasMutateOp` / `resolveModificationMode` | Safety / undo |
| `findProjectRoot` | Корень проекта |

## `analyze` options

Та же форма, что CLI `AnalysisOptions` (bool ops + pathMode + report + ai + mutate safety). См. `src/core/types.js`.

## Acceptance criteria

- [x] TUI зависит только от `src/api`
- [x] `serializeConf` + `parseConf` round-trip сохраняет известные ключи
- [x] `package.json` экспортирует API
