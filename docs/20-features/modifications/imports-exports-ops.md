---
title: Imports / exports operations
status: accepted
mvp: false
source: .dep/.blueprint/20-features/modifications/imports-exports-operations.md
tags: [M, D, E]
---

# Imports / exports operations (S07)

## Цель

Автокоррекция импортов/экспортов целевого файла **на основе сигналов анализа** (validation S03, import-export), без «угадывания» архитектуры проекта.

## Границы

### Входит

| Op id | CLI | Суть | Источник сигнала |
|-------|-----|------|------------------|
| `fix-imports` | `--fix-imports` / `-fi` | Удалить unused imports; поправить broken local specifier path, если однозначный кандидат | `UNUSED_IMPORT`, `BROKEN_IMPORT` |
| `remove-unused-exports` | часть `-fi` или флаг `--fix-exports` / `-fe` | Пометить/убрать `UNUSED_EXPORT` **только** если export не используется в сканированных локальных consumers (как S03) | `UNUSED_EXPORT` |

Min S07: реализовать **`--fix-imports` / `-fi`** полностью; `--fix-exports` / `-fe` — тот же каркас, можно тем же PR или сразу следом.

### Не входит

- Перенос импортов/экспортов между произвольными файлами (blueprint «перенос» → later)
- Автодобавление npm-пакетов в код + install одним флагом (install — [environment-ops.md](environment-ops.md); add import — только если есть явный локальный символ)
- TypeScript path mapping
- «Умный» barrel-оптимизатор всего monorepo

## CLI

| Long | Short | Почему short |
|------|-------|--------------|
| `--fix-imports` | `-fi` | `-f` = format → `-fi` |
| `--fix-exports` | `-fe` | symmetric `-fe` |

`--fix-imports` **OR-включает** анализ `validate` (и при необходимости import-export) как prerequisite, даже без `-va` в отчёте — аналогично graph→imports.  
В `results` ключ `validation` кладётся **только** если пользователь явно просил `-va`; иначе diagnostics используются внутри op.

## Вход

- Target file + AST
- Diagnostics / или пересчёт validation внутри mutate-pass
- Project scan policy как у S03 (локальные `.js` consumers)

## Выход (Change)

- `op: "fix-imports" | "fix-exports"`
- `risk: "caution"` (меняет семантику доступности символов)
- `kind: "update"` (редко `update` на consumer — **не** в min; только target)
- Связь с diagnostic: `details.refCode`, `details.loc`

## Правила

1. Без однозначного фикса для `BROKEN_IMPORT` → Change **не** угадывает; пропускает с note в summary / change `skippedReason`.
2. Не удалять side-effect import (`import './x.js'`) как UNUSED.
3. Bare specifier (`fs`, `lodash`) не «чинить» путём записи в node_modules.
4. После apply рекомендуется (не обязательно в том же process) возможность re-validate — out of scope min; AC проверяют текст файла.
5. Комбинация с `-si`: сначала fix-imports, потом sort-imports (если оба), потом format.

Порядок mutate-ops (глобальный): **fix-imports / fix-exports → sort-imports → format → comments → env → ai**.

## Ошибки

| code | смысл |
|------|--------|
| `AMBIGUOUS_FIX` | несколько кандидатов пути — skip change |
| `PARSE_FAILED` | нет AST |

## Зависимости

- [validation.md](../analysis/validation.md)
- [import-export-analysis.md](../analysis/import-export-analysis.md)
- [safety.md](safety.md)
- [s07-flags.md](../../50-cli/s07-flags.md)

## Acceptance criteria

- [ ] Фикстура с `UNUSED_IMPORT`: `-fi` preview показывает удаление; `--apply` удаляет строку импорта
- [ ] `BROKEN_IMPORT` с одним кандидатом — правка specifier; с нулём/множеством — skip без записи пути-угадайки
- [ ] Side-effect import не удаляется
- [ ] Без `--apply` файл неизменен
- [ ] Default-all не включает `-fi`
