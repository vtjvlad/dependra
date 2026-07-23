---
title: Базовая информация о файле
status: draft
mvp: true
source: .dep/.blueprint/20-features/basic-file-information---B
tags: [B]
---

# Базовая информация о файле (−B)

## Цель

Вывести базовые метаданные целевого файла.

## Границы

**Входит:** поля таблицы ниже для обычного файла на локальной FS.

**Не входит (deferred / additional-B):** расширенная классификация, «движок» runtime проекта, глубокое определение языка beyond JS MVP.

## Вход

- `targetPath` — существующий файл
- Инспектор: `basic-file-information`

## Выход (`data`)

| Поле | Тип | Описание |
|------|-----|----------|
| `name` | string | Имя файла |
| `ext` | string | Расширение (с точкой или `""`) |
| `format` | string | Краткий формат (`"javascript"`, `"json"`, `"unknown"`, …) |
| `mimeType` | string \| null | По карте расширений MVP (ниже); иначе null |
| `size` | number | Размер в байтах |
| `createdAt` | string \| null | ISO-8601 birthtime, если доступно |
| `modifiedAt` | string | ISO-8601 mtime |
| `accessedAt` | string \| null | ISO-8601 atime, если доступно |
| `owner` | string \| null | Десятичная строка **uid** (`"1000"`); резолв имени — deferred |
| `group` | string \| null | Десятичная строка **gid**; резолв имени — deferred |
| `language` | `"javascript"` \| `"unknown"` | |
| `engine` | `"node"` \| null | `"node"` если language = javascript |
| `fileType` | `"file"` | Симлинки: следовать к цели (см. правила) |

### Пример

```json
{
  "name": "app.js",
  "ext": ".js",
  "format": "javascript",
  "mimeType": "text/javascript",
  "size": 2048,
  "createdAt": "2026-01-10T12:00:00.000Z",
  "modifiedAt": "2026-07-20T15:30:00.000Z",
  "accessedAt": "2026-07-23T10:00:00.000Z",
  "owner": "1000",
  "group": "1000",
  "language": "javascript",
  "engine": "node",
  "fileType": "file"
}
```

## MIME и format (MVP)

Только по расширению (без magic-bytes):

| ext | format | mimeType |
|-----|--------|----------|
| `.js`, `.mjs`, `.cjs` | `javascript` | `text/javascript` |
| `.json` | `json` | `application/json` |
| `.md` | `markdown` | `text/markdown` |
| иное / пусто | `unknown` | `null` |

`language`: `javascript` для `.js`/`.mjs`/`.cjs`, иначе `unknown`.

## Правила

1. Путь нормализуется; относительный путь разрешается от `cwd`.
2. Если birthtime недоступен — `createdAt: null`, не ошибка.
3. Симлинк на файл: `stat`/`read` цели; поле `isSymlink` — deferred.
4. Каталог вместо файла — `NOT_A_FILE`.
5. `owner`/`group`: строка от `uid`/`gid` через `String(n)`; если платформа не даёт — `null` (не ошибка).
6. Типы полей согласованы с `BasicFileInfo` в [project-model.md](../../20-architecture/project-model.md).

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет пути |
| `NOT_A_FILE` | validation | Не файл |
| `STAT_FAILED` | execution | Не удалось прочитать stat |

## Зависимости

- Node `fs.promises` / `path`
- Контракт: [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] Все поля таблицы присутствуют в JSON-выводе
- [ ] Для `.js` / `.mjs` / `.cjs` — `language` = `"javascript"`, MIME из таблицы
- [ ] `owner`/`group` — десятичные строки uid/gid или null
- [ ] Ошибка на каталоге и отсутствующем пути
