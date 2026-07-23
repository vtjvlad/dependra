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
| `mimeType` | string \| null | MIME, если определим; иначе null |
| `size` | number | Размер в байтах |
| `createdAt` | string \| null | ISO-8601 birthtime, если доступно |
| `modifiedAt` | string | ISO-8601 mtime |
| `accessedAt` | string \| null | ISO-8601 atime, если доступно |
| `owner` | string \| null | uid/имя владельца, если доступно на платформе |
| `group` | string \| null | gid/имя группы, если доступно |
| `language` | string | Для MVP: `"javascript"` \| `"unknown"` |
| `engine` | string \| null | Для MVP: `"node"` если JS, иначе null |
| `fileType` | string | `"file"` (симлинки: следовать или пометить — см. правила) |

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

## Правила

1. Путь нормализуется; относительный путь разрешается от `cwd`.
2. Если birthtime недоступен — `createdAt: null`, не ошибка.
3. Симлинк на файл: анализировать цель; при необходимости позже добавить `isSymlink` (не блокер MVP).
4. Каталог вместо файла — ошибка `validation` / `NOT_A_FILE`.

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
- [ ] Для `.js` / `.mjs` / `.cjs` `language` = `"javascript"`
- [ ] Ошибка на каталоге и отсутствующем пути
