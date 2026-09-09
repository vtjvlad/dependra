---
title: Анализ зависимостей запуска
status: draft
mvp: false
source: .dep/.blueprint/20-features/runtime-dependency-analysis---U
tags: [U]
---

# Анализ зависимостей запуска (−U, S04)

## Цель

Определить **способ выполнения** целевого файла: интерпретатор / runtime (для JS MVP) и, best-effort, компилятор/сборка если язык явно компилируемый.

## Границы

### Входит (S04)

- Для JavaScript (`.js`/`.mjs`/`.cjs` + AST/language из модели):
  - `runtime.kind`: `"interpreter"`
  - `runtime.name`: `"node"` (default); учёт shebang `#!/usr/bin/env node` / `nodejs`
  - `runtime.commandHint`: например `node <file>` (строка-подсказка, не выполнение)
- Shebang-парсинг первой строки файла
- Best-effort для других интерпретируемых: python, ruby, php, lua, bash — только если расширение или shebang однозначно указывают
- Поле `available`: есть ли runtime в PATH (без запуска скрипта)

### Не входит

- Фактический запуск файла / тест harness
- Полный detect build-system / monorepo (S10–S11)
- Обязательный gcc/cargo/go/dotnet для JS-проекта — только если цель явно C/Rust/Go/… по расширению/shebang
- Установка runtime (S07)

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--runtime` | `-r` | `r` свободна |

Не в default-all.  
Спека: [s04-flags.md](../../50-cli/s04-flags.md).

## Инспектор

- id: `runtime-dependency-analysis`
- text-секция: `runtime`

## Вход

- Целевой файл (+ опционально уже известный `language` из basic/model)
- Чтение shebang / расширение

## Выход (`data`)

```json
{
  "language": "javascript",
  "runtime": {
    "kind": "interpreter",
    "name": "node",
    "available": true,
    "version": "v22.0.0",
    "commandHint": "node src/app.js",
    "shebang": "#!/usr/bin/env node"
  },
  "build": null
}
```

Для компилируемого (если когда-либо сработает эвристика):

```json
{
  "language": "c",
  "runtime": null,
  "build": {
    "compiler": "gcc",
    "available": true,
    "system": null,
    "commandHint": "gcc -o app app.c"
  }
}
```

В S04 AC достаточно JS-ветки; `build` может быть всегда `null` на JS-фикстурах.

## Правила

1. Не выполнять целевой файл.
2. Версия runtime — как в environment-validation (короткий `--version`).
3. `commandHint` использует display path в `pathMode` (relative default).
4. Конфликт shebang vs расширение: shebang побеждает для `runtime.name`, `language` можно оставить по расширению + `details.shebangMismatch` если явно противоречит.
5. `status: "ok"` если анализ завершён; unknown language → `runtime: null`, `details.unsupportedLanguage: true` (не обязательно error).

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `NOT_A_FILE` | validation | Не файл |
| `READ_FAILED` | execution | Не прочитать файл (shebang) |

## Зависимости

- [environment-validation.md](environment-validation.md) (пересекается по node/version; разные секции отчёта)
- [s04-flags.md](../../50-cli/s04-flags.md)
- basic language hints — optional, не жёсткий prerequisite

## Acceptance criteria

- [ ] `-r` / `--runtime` → ключ `runtime-dependency-analysis`
- [ ] JS-файл → `runtime.name === "node"`, `kind === "interpreter"`
- [ ] `commandHint` содержит имя рантайма и путь/имя файла
- [ ] Shebang `node` на фикстуре отражается в `runtime.shebang` или name
- [ ] Целевой файл не запускается
- [ ] Не в default-all
