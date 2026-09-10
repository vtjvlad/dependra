---
title: Файловые операции (I/O-анализ)
status: draft
mvp: false
source: .dep/.blueprint/20-features/file-operations---U
tags: [U]
---

# Работа с файлами / I/O (−U, S04)

## Цель

По AST определить, какие **файловые I/O-операции** целевой JS-файл потенциально выполняет: чтение, запись, создание, удаление, изменение.

## Границы

### Входит (S04)

- Node.js `fs` / `fs/promises` / `fs.promises` и `require('fs')`:
  - read: `readFile`, `readFileSync`, `createReadStream`, `readdir`, `readdirSync`, `read`, `readSync`, `open`+флаги read (best-effort)
  - write: `writeFile`, `writeFileSync`, `appendFile`, `createWriteStream`, `write`, `writeSync`
  - create: `mkdir`, `mkdirSync`, `writeFile` (как create-or-overwrite — также в write), `open` с `'w'`/`'a'` (best-effort)
  - delete: `unlink`, `unlinkSync`, `rm`, `rmSync`, `rmdir`, `rmdirSync`
  - change: `rename`, `renameSync`, `chmod`, `chown`, `truncate`, `copyFile`
- Статический строковый путь аргумента → `pathLiteral`; иначе `pathLiteral: null`
- `kind`: `"read"` \| `"write"` \| `"create"` \| `"delete"` \| `"change"`
- `api`: имя метода; `module`: `"fs"` \| `"fs/promises"` \| `"unknown"`
- `loc` строки вызова

### Не входит

- Динамический анализ / выполнение
- `child_process` exec, сеть (`http`, `fetch`) — не file I/O в S04
- Автофикс / песочница (S07)
- TypeScript-only path aliases
- Regex-парсинг вместо AST

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--io` | `-io` | `-i` = imports → вторая буква → `-io` |

Не в default-all.  
Спека: [s04-flags.md](../../50-cli/s04-flags.md).

## Инспектор

- id: `file-operations`
- text-секция: `io`
- Нужен AST → pipeline обеспечивает load/`ensureTargetSourceFile` (как entities)

## Вход

- JS-файл с доступным AST
- `options.pathMode` — для display строковых путей, если путь resolved относительно файла (optional resolve; иначе показывать литерал)

## Выход (`data`)

```json
{
  "pathMode": "relative",
  "operations": [
    {
      "kind": "read",
      "api": "readFileSync",
      "module": "fs",
      "pathLiteral": "./data.json",
      "display": "./data.json",
      "loc": { "line": 4, "column": 0 }
    },
    {
      "kind": "write",
      "api": "writeFile",
      "module": "fs/promises",
      "pathLiteral": null,
      "display": null,
      "loc": { "line": 10, "column": 2 }
    }
  ],
  "summary": {
    "read": 1,
    "write": 1,
    "create": 0,
    "delete": 0,
    "change": 0
  }
}
```

Один вызов может дать **один** primary `kind` (приоритет: delete > create > write > change > read, если метод неоднозначен — зафиксировать таблицу в реализации по имени API).

## Правила

1. Только AST (Acorn / parsers модуль).
2. Методы через `fs.readFile`, `fsPromises.writeFile`, деструктуринг `const { readFile } = fs` — best-effort: MemberExpression на идентификатор, связанный с require/import `fs`; если связь не прослежена — можно пропустить (не обязаны все alias).
3. `import fs from 'fs'` / `import * as fs` / named imports из `fs`/`node:fs` / `fs/promises` / `node:fs/promises`.
4. Не выполнять I/O.
5. PARSE_FAILED на цели → error инспектора.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `UNSUPPORTED_LANGUAGE` | validation | Не JS MVP |
| `PARSE_FAILED` | execution | Сбой парсера |
| `READ_FAILED` | execution | Не прочитать файл |

## Зависимости

- [import-export-analysis.md](import-export-analysis.md) / parsers (AST)
- [s04-flags.md](../../50-cli/s04-flags.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] `-io` / `--io` → ключ `file-operations`
- [ ] Фикстура с `fs.readFileSync('…')` → operation `kind: "read"`
- [ ] Фикстура с `fs.writeFileSync` / `unlinkSync` → write/delete
- [ ] Динамический путь → `pathLiteral: null`, анализ не падает
- [ ] Нет regex-парсера I/O
- [ ] Не в default-all
