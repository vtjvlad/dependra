---
title: Контракт инспектора
status: draft
mvp: true
source: .dep/.blueprint/30-architecture/requirements/module-contract.md, input-schema, output-schema, error-model, public-api
---

# Контракт инспектора

## Цель

Формальный контракт для любого инспектора: стабильный API, предсказуемые данные и ошибки.

## Публичный API (логика)

```js
/**
 * @typedef {object} AnalysisContext
 * @property {string} targetPath Абсолютный путь к целевому файлу
 * @property {string} cwd Рабочая директория
 * @property {object} [projectModel] Разделяемая модель проекта (наращивается pipeline)
 * @property {object} options Опции запуска (флаги, level, pathMode, …)
 */

/**
 * @typedef {object} InspectorMeta
 * @property {string} id Уникальный id, например "basic-file-information"
 * @property {string} version Версия контракта инспектора, semver-подобная строка
 * @property {string[]} tags Приоритетные теги: B, M, …
 */

/**
 * @typedef {object} InspectorResult
 * @property {string} inspectorId
 * @property {"ok"|"error"} status
 * @property {object} [data] Полезная нагрузка при ok
 * @property {InspectorError} [error] При status === "error"
 */

/**
 * @typedef {object} InspectorError
 * @property {"validation"|"execution"|"dependency"|"configuration"|"compatibility"|"internal"} category
 * @property {string} code Машинный код, например "FILE_NOT_FOUND"
 * @property {string} message Человекочитаемое сообщение
 * @property {boolean} retryable
 * @property {object} [details]
 */

/**
 * @typedef {object} Inspector
 * @property {InspectorMeta} meta
 * @property {(ctx: AnalysisContext) => Promise<InspectorResult>} analyze
 */
```

## Вход

- `targetPath` обязателен и должен существовать (для файловых инспекторов MVP).
- `options` не должны ломать инспектор при неизвестных ключах (игнорировать лишнее).
- Инспектор **может** читать/дополнять `projectModel`, но не должен мутировать чужие секции произвольно: только свои ключи / согласованные поля модели.
- Порядок вызовов и prerequisites задаёт `core` ([interface.md](../50-cli/interface.md)); инспектор не предполагает, что stdout — канал результата.

## Выход

- Всегда `InspectorResult`.
- При успехе `status: "ok"` и `data` по схеме конкретной фичи.
- При ошибке `status: "error"` и заполненный `error`; инспектор не глотает сбои молча.

### Пример успешного результата

```json
{
  "inspectorId": "basic-file-information",
  "status": "ok",
  "data": {
    "name": "app.js",
    "ext": ".js",
    "size": 1024
  }
}
```

### Пример ошибки

```json
{
  "inspectorId": "import-export-analysis",
  "status": "error",
  "error": {
    "category": "execution",
    "code": "PARSE_FAILED",
    "message": "Не удалось разобрать файл как JavaScript",
    "retryable": false,
    "details": { "line": 12, "column": 3 }
  }
}
```

## Категории ошибок

| category | Когда |
|----------|--------|
| `validation` | Невалидный вход (нет пути, не файл) |
| `execution` | Сбой анализа/парсинга |
| `dependency` | Внешняя зависимость недоступна |
| `configuration` | Некорректные опции/конфиг |
| `compatibility` | Несовместимость версии интерфейса |
| `internal` | Непредвиденный внутренний сбой |

## Версионирование

- `meta.version` — версия контракта инспектора.
- Несовместимые изменения схемы `data` — major bump + ADR при необходимости.
- Ядро вызывает инспекторы только через этот контракт.

## Запреты

- Обращение к private API других модулей
- Прямой `console.log` как единственный канал результата (вывод — через reporters/CLI)
- Regex-парсинг JS вместо AST в инспекторах импортов/экспортов

## Acceptance criteria

- [ ] Каждый MVP-инспектор реализует `meta` + `analyze`
- [ ] Ошибки всегда категоризированы
- [ ] Схемы `data` описаны в документах фич
