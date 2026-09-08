---
title: Экспортируемые / импортируемые сущности
status: draft
mvp: false
source: .dep/.blueprint/20-features/exported-entities---M
tags: [M]
---

# Экспортируемые сущности (−M deep, S02)

## Цель

Показать **символьный** уровень: функции, классы, переменные (и типы — если язык/парсер позволяют) для экспорта и импорта целевого файла — глубже MVP export/import records.

## Границы

### Входит (S02)

- Экспортируемые: functions, classes, variables
- Импортируемые (из спецификаторов): functions, classes, variables — best-effort по AST (named import bindings, require destructuring — по мере поддержки)
- Отображение сущности в режимах `--path-mode`: `name` \| `relative` \| `absolute` (для привязки к файлу-источнику / цели)
- JS ESM/CJS в тех же пределах, что S01 parsers

### Не входит

- Полный type-level graph для TypeScript (S09); в S02 типы — только если парсер уже отдаёт и это не ломает JS MVP (`kind: "type"` опционально, иначе пропуск)
- Замена секций `--exports` / `--imports`: MVP-записи остаются; **entities** — отдельная операция
- Рефакторинг / rename (S07)

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--entities` | `-en` | `-e` занят `--exports` → вторая буква → `-en` |

Не входит в default-all.  
Частый комбо: `-e -en`, `-i -en`, `-en -p name`.

Спека флагов: [s02-flags.md](../../50-cli/s02-flags.md).  
Short-алгоритм: [interface.md](../../50-cli/interface.md#короткие-флаги).

## Вход

- Целевой JS-файл с AST (prerequisite загрузки / при необходимости import-export для модели)
- `options.pathMode`
- Инспектор: `exported-entities`

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "exported": [
    {
      "kind": "function",
      "name": "run",
      "display": "run",
      "loc": { "line": 4, "column": 0 }
    },
    {
      "kind": "class",
      "name": "App",
      "display": "App",
      "loc": { "line": 10, "column": 0 }
    }
  ],
  "imported": [
    {
      "kind": "function",
      "name": "helper",
      "display": "src/lib.js",
      "from": "./lib.js",
      "resolvedPath": "/abs/proj/src/lib.js",
      "loc": { "line": 2, "column": 0 }
    }
  ]
}
```

`kind`: `"function"` \| `"class"` \| `"variable"` \| `"type"` \| `"unknown"`.

`display` зависит от `pathMode`:

- для exported: обычно `name` (pathMode влияет, если позже появится qualified path; в S02 — имя символа; pathMode обязателен для **imported** привязки к файлу)
- для imported: `name` → имя символа; `relative`/`absolute` → путь модуля (+ имя в text-reporter)

Уточнение S02: в JSON всегда есть `name`, `from`/`resolvedPath` где применимо; поле `display` — уже отформатированная строка для pathMode (как в graph).

## Text (schematic)

Секция title **`entities`**:

```
┌─ entities ─────────────────────────────────────┐
│  path-mode relative                            │
│  export  ◆  run              function          │
│  export  ◆  App              class             │
│  import  →  helper           function          │
│             ← src/lib.js                       │
└────────────────────────────────────────────────┘
```

## Правила

1. Только AST через `parsers` (без regex-парсинга символов).
2. Default export без имени → `name: "default"`, `kind` по объявлению best-effort.
3. `export * from` / namespace import — `kind: "unknown"` или пропуск с записью в `details.skipped[]` (предпочтение: одна запись `kind: "unknown"`, `name: "*"`).
4. Prerequisite: файл разобран; при `PARSE_FAILED` — ошибка инспектора, exit `2` как в S01.
5. Не обязан класть MVP `import-export-analysis` в `results`, если пользователь не просил `-i`/`-e`.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `PARSE_FAILED` | execution | Сбой парсера |
| `MODEL_INCOMPLETE` | configuration | Нет AST/модели после prerequisite |

## Зависимости

- S01: `parsers`, контракт инспектора, pipeline
- [import-export-analysis.md](import-export-analysis.md) (смежный уровень)
- [s02-flags.md](../../50-cli/s02-flags.md)

## Acceptance criteria

- [ ] `--entities` и `-en` эквивалентны; `-e` по-прежнему только exports
- [ ] Фикстура ESM: хотя бы function/class/variable в `exported`
- [ ] Импортированный named binding попадает в `imported`
- [ ] Три `pathMode` меняют `display` у imported
- [ ] Text-секция `entities`; JSON-ключ `exported-entities`
- [ ] Не входит в default-all
