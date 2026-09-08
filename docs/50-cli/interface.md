---
title: CLI интерфейс
status: accepted
mvp: true
source: .dep/.blueprint/50-user/cli-flags.md
---

# CLI интерфейс (MVP)

## Цель

Минимальный командный интерфейс для запуска MVP-операций. Версия пакета: `0.0.2`.

## Entrypoint

```
node src/cli/index.js <file> [options]
```

После `npm link` / install доступны команды из `package.json` → `bin`:

```
dependra <file> [options]
fds <file> [options]
deps <file> [options]
dep <file> [options]
```

Все четыре имени указывают на один и тот же entrypoint. Версию пакета не повышать без approve владельца.

## Синтаксис

```
dependra|fds|deps|dep <file> [options]
```

## Флаги MVP

| Long | Short | Действие |
|------|-------|----------|
| `--basic` | `-b` | Операция basic → инспектор `basic-file-information` |
| `--imports` | `-i` | Операция imports → инспектор `import-export-analysis` (в отчёте — секция imports) |
| `--exports` | `-e` | Операция exports → тот же инспектор (в отчёте — секция exports) |
| `--graph` | `-g` | Операция graph → инспектор `dependency-analysis` |
| `--json` | `-j` | Вывод JSON вместо текста |
| `--path-mode <name\|relative\|absolute>` | `-p <…>` | Режим путей для graph (default: `relative`) |
| `--help` | `-h` | Справка |
| `--version` | `-v` | Версия пакета: `Dependra v0.0.2` |

### Короткие флаги

- Short = первая буква имени long-опции (`--basic` → `-b`).
- При коллизии первых букв у более значимой опции — **заглавная** буква; у менее значимой — строчная.
- Приоритет значимости (выше → uppercase при коллизии): `graph` > `imports` > `exports` > `basic` > `json` > `path-mode` > `help` > `version`.
- У текущих MVP-флагов буквы не пересекаются → все short-формы lowercase.
- Кластеры вроде `-bg` не поддерживаются: только отдельные аргументы (`-b -g`).

**Не в MVP:** `--level` (уровни — только концептуальная карта, см. [analysis-levels.md](../40-development/analysis-levels.md)).

Если не указан ни один из `--basic|-b|--imports|-i|--exports|-e|--graph|-g`, по умолчанию: **все четыре операции**.

Комбинации флагов разрешены (long и short взаимозаменяемы).

## Соответствие флагов и `results`

| Запрошенные флаги | Инспекторы в `results` | Примечание |
|-------------------|------------------------|------------|
| `--basic` | `basic-file-information` | |
| `--imports` и/или `--exports` | `import-export-analysis` | Один запуск инспектора; `data` фильтруется по флагам |
| `--graph` | `dependency-analysis` | См. pipeline: imports считаются внутри, даже если нет `--imports` |
| только `--graph` | только `dependency-analysis` | Ключ `import-export-analysis` **не** попадает в `results` |
| `--imports` + `--graph` | оба ключа | |

Фильтрация `data` у `import-export-analysis`:

- только `--imports` → в `data` поля `moduleKind` + `imports` (без `exports`);
- только `--exports` → `moduleKind` + `exports`;
- оба флага → `moduleKind` + `imports` + `exports`.

Подробности инспектора: [import-export-analysis.md](../20-features/analysis/import-export-analysis.md).

## Pipeline (обязанности `core`)

Порядок для одного запуска:

1. Разобрать argv → `options` + `targetPath`.
2. Валидация: файл существует и это файл (иначе exit `1`).
3. Создать `AnalysisContext` / пустую `ProjectModel`.
4. Если нужна операция **basic** → `basic-file-information`.
5. Если нужны **imports**, **exports** или **graph** → один раз `import-export-analysis` (заполнить модель: `imports` / `exports` / AST).  
   - В `results` этот инспектор кладётся **только** если пользователь запросил `--imports` и/или `--exports` (с фильтрацией `data`).  
   - Для `--graph` без этих флагов результат инспектора используется как **внутренний prerequisite**, не как секция отчёта.
6. Если нужен **graph** → `dependency-analysis` (читает imports из модели; при отсутствии — ошибка `configuration` / `MODEL_INCOMPLETE`).
7. `reporters` формируют text/JSON **только** по ключам в `results` и флагам секций.

Инспекторы не печатают в stdout сами.

## Вход

- `<file>` — обязательный путь к файлу
- `cwd` — `process.cwd()`

## Выход

См. [output-formats.md](output-formats.md).

## Коды выхода

| Code | Значение |
|------|----------|
| `0` | Успех (все инспекторы, попавшие в `results`, имеют `status: "ok"`) |
| `1` | Ошибка валидации CLI / нет файла / не файл |
| `2` | Хотя бы один инспектор в `results` завершился `error` |
| `3` | Внутренняя ошибка CLI/ядра |

Ошибка внутреннего prerequisite (import для graph), если она не попала в `results`, всё равно даёт exit `2` и сообщение в stderr (при `--json` — stderr; в JSON можно добавить `"prerequisiteErrors": [...]` опционально; минимум — ненулевой exit + stderr).

## Ошибки CLI

- Нет `<file>` → help + exit 1
- Неизвестный флаг → сообщение + exit 1
- Конфликт не предусмотрен для MVP-флагов

## Зависимости

- `core`, инспекторы, `reporters`
- [mvp-scope.md](../20-features/mvp-scope.md)
- [pipeline в этом документе](#pipeline-обязанности-core)

## Acceptance criteria

- [ ] Каждый флаг операции включает только свою **секцию отчёта** (кроме default-all)
- [ ] `--imports` и `--exports` дают один ключ `import-export-analysis` с отфильтрованным `data`
- [ ] `--graph` без `--imports` не добавляет import-export в `results`, но reverse/forward graph работает
- [ ] `--version` / `-v` печатает `Dependra v0.0.2`
- [ ] `--json` / `-j` даёт валидный JSON по схеме отчёта
- [ ] Короткие флаги `-b|-i|-e|-g|-j|-p` эквивалентны long-формам
- [ ] Коды выхода соответствуют таблице
- [ ] Нет флага `--level` в MVP
- [ ] npm `bin` содержит `dependra`, `fds`, `deps`, `dep`
