---
title: Анализ дополнительных языков (beyond JS/TS)
status: accepted
mvp: false
source: .dep/.blueprint/10-technology/30-interpreted-languages, docs/20-architecture/language-backend.md, handbook/roadmap/stages/09-multilang.md
---

# Анализ дополнительных языков (beyond JS/TS)

## Цель

Зафиксировать **как** подключать новые анализируемые языки после S09 (JavaScript + TypeScript), не ломая публичный контракт инспектора / `analyze` API и не смешивая API парсеров с `core` / inspectors / CLI / TUI.

Документ — рамка реализации. Конкретный язык входит в код только после:

1. ADR «язык» (зачем этот язык сейчас);
2. ADR «парсер / provider» (чем парсим);
3. узкой продуктовой спеки языка (как [`s09-typescript.md`](s09-typescript.md));
4. approve владельца.

## Границы

### Входит

- Очередь кандидатов и приоритет
- Уровни поддержки языка (capability levels) относительно инспекторов
- Стратегии AST / providers
- Процесс подключения (чеклист + размещение кода + тесты)
- Опциональный конфиг включения языков
- Связь с Tree-sitter / LSP (optional providers)

### Не входит

- Обязательная реализация всех языков из очереди в одном PR
- Обязательный typecheck / semantic model для каждого языка
- Смена языка **реализации** Dependra (остаётся JavaScript — [`stack.md`](stack.md))
- Monorepo packaging backends (`packages/inspectors-*`) — решение в [S10](../../handbook/roadmap/stages/10-platform-monorepo.md)
- Build System — [S11](../../handbook/roadmap/stages/11-build-system.md)
- Анализ бинарников / обфусцированного кода

### Уже реализовано (база)

| LanguageId | Расширения | Backend | Парсер |
|------------|------------|---------|--------|
| `javascript` | `.js` `.mjs` `.cjs` | JS | Acorn ([ADR-0001](../../handbook/adr/ADR-0001-js-ast-parser.md)) |
| `typescript` | `.ts` `.tsx` | TS | typescript-estree ([ADR-0002](../../handbook/adr/ADR-0002-first-language-typescript.md), [ADR-0003](../../handbook/adr/ADR-0003-typescript-parser.md)) |

Контракт: [`language-backend.md`](../20-architecture/language-backend.md).

## Очередь языков (приоритет)

Порядок — рекомендация для реализации; смена приоритета только через ADR + запись в roadmap.

| # | LanguageId | Расширения (минимум) | Зачем | Зависимость / заметка |
|---|------------|----------------------|-------|------------------------|
| 1 | `javascript` (+ JSX) | `.jsx` | Закрыть deferred JSX рядом с TSX; один ecosystem | Можно расширить **существующий** JS-backend или тонкий sibling; **не** новый «язык реализации» |
| 2 | `python` | `.py` | Blueprint: interpreted languages; runtime/shebang уже зондируют Python | Другая модель модулей (`import` / `from`); не ESTree |
| 3 | `lua` | `.lua` | Blueprint: interpreted languages; встраиваемые скрипты | Модули `require` / пути по-своему |
| 4 | *(резерв)* | — | Следующий язык только по ADR | Кандидаты не фиксируются здесь как обязательство |

**Явно не в очереди как language-backend анализа импортов:** JSON, Markdown, YAML, lockfiles — остаются metadata / basic-format, не `LanguageBackend` с module graph (см. ADR-0002: JSON/MD как «язык» не закрывают exit criteria multi-lang).

**Не путать:** Rust / Zig / Go в blueprint — про **оптимизацию подсистем Dependra**, не про целевые анализируемые языки пользователя.

## Уровни поддержки (capability)

Каждый новый язык объявляет **целевой уровень** в своей узкой спеке. Инспекторы обязаны либо поддержать уровень, либо дать предсказуемый skip / best-effort без регрессии JS/TS.

| Level | Имя | Минимум |
|-------|-----|---------|
| **L0** | Classify | `basic-file-information`: `language`, `engine` (если известен), format/mime |
| **L1** | Parse + modules | `loadSourceFile` без `UNSUPPORTED_LANGUAGE`; extract imports/exports (или аналог module refs) в `ImportRecord` / `ExportRecord` |
| **L2** | Graph | `dependency-analysis` + resolve спецификаторов (best-effort) + scan расширений языка в проекте |
| **L3** | Deepen | `exported-entities`, `validation` (broken/unused — best-effort), без ломания schema |
| **L4** | Enrich | optional Tree-sitter / LSP providers реально используются хотя бы одним инспектором или отчётом |

| Инспектор | L0 | L1 | L2 | L3+ |
|-----------|----|----|----|-----|
| `basic-file-information` | обязательно | — | — | — |
| `import-export-analysis` | skip/`UNSUPPORTED` недопустим на L1+ | обязательно | — | — |
| `dependency-analysis` | — | model из L1 | обязательно | — |
| `exported-entities` | — | best-effort | best-effort | целевой L3 |
| `validation` | — | best-effort | best-effort | целевой L3 |
| quality / io / viz / mods | JS/TS как сейчас; иначе skip или безопасный no-op | | | |

Правило: **новый язык минимум L1** для статуса «язык beyond JS/TS подключён»; L2 — для сопоставимости с S09 exit («инспекторы beyond JS» + graph). L3/L4 — отдельные задачи.

## Стратегии представления AST

Инспекторы не импортируют API конкретного парсера. Backend выбирает одну стратегию и фиксирует её в ADR парсера:

| Стратегия | Когда | Следствие для инспекторов |
|-----------|-------|---------------------------|
| **A. ESTree-совместимое** | Язык близок к JS (JSX, частично TS) | Переиспользование walkers `import-export-analysis` с ветками по `language` |
| **B. Нормализованный ModuleIR** | Язык далёк от ESTree (Python, Lua) | Backend или тонкий extractor заполняет `imports`/`exports` **без** требования ESTree; `SourceFile.ast` может быть CST/native или `null`, если IR уже в модели |
| **C. Tree-sitter CST** | Optional provider или основной parse, если нет зрелого JS-парсера | `providers.treeSitter`; инспекторы читают через backend helper, не через `tree-sitter` npm API напрямую |
| **D. LSP-обогащение** | Symbols / diagnostics | Только `providers.lsp`; analyze не падает, если `isAvailable() === false` |

Для Python/Lua **предпочтительна B** (ModuleIR из dedicated extractor), Tree-sitter — C как optional (или primary parse, если ADR так решит). Не тащить `typescript` / Acorn в чужие backends.

### ModuleIR (минимум полей)

Совместимо с текущей моделью ([project-model](../20-architecture/project-model.md), S09 `importKind`):

```js
/**
 * @typedef {object} ImportRecord
 * @property {string|null} source
 * @property {"static"|"dynamic"|"require"|string} kind
 * @property {string|null} resolvedPath
 * @property {boolean} isExternal
 * @property {"value"|"type"|"typeof"|string} [importKind]
 * @property {{ line: number, column: number }} [loc]
 */

/**
 * @typedef {object} ExportRecord
 * @property {"named"|"default"|"all"|"commonjs"|string} kind
 * @property {string|null} name
 * @property {string|null} from
 * @property {{ line: number, column: number }} [loc]
 */
```

Новые `kind` допустимы, если репортёры и JSON-схема их терпят (unknown → печать как есть). Ломать обязательные поля нельзя.

## Resolve и scan

- Расширения языка регистрируются в `LanguageBackend.meta.extensions` → попадают в `listExtensions()` → `resolve-specifier` / `listJavaScriptFiles` (имя хелпера может остаться; семантика — «поддерживаемые исходники»).
- Правила resolve (path mapping, `PYTHONPATH`, Lua `package.path`) — **best-effort** в узкой спеке языка; полный аналог toolchain **не** обязателен на L2.
- Bare / stdlib → `isExternal: true` (как `node:` / npm bare в JS).

## Размещение кода

Пока single-package (до S10):

```
src/parsers/
  registry.js
  javascript-backend.js          # + опционально JSX
  typescript-backend.js
  python/
    python-backend.js
    <parser-or-extractor>-adapter.js
  lua/
    lua-backend.js
    <adapter>.js
  providers/
    tree-sitter.js               # реальная реализация или null stub
    lsp.js
```

`registerBuiltInBackends()` идемпотентно регистрирует только языки, разрешённые конфигом (если конфиг включён) или все built-in по умолчанию.

Инспекторы: **без** смены `meta.id`; ветвление по `sourceFile.language` или делегирование shared ModuleIR-walker.

## Конфиг (опционально)

Новые ключи — не обязательны для первого языка после TS; рекомендуемый минимум:

```ini
# [languages]
# enabled = javascript, typescript, python
# # пусто / отсутствует → все built-in backends
# # явный список → только перечисленные id

# [languages.providers]
# treeSitter = false
# lsp = false
```

Приоритет: defaults → user → project → CLI (как S05). Неизвестный id в `enabled` → ошибка в `strict`, иначе warning + skip.

Детали синтаксиса — дополнение к [`s05-config.md`](../35-configuration/s05-config.md) отдельным мини-доком или секцией, когда появится первая реализация ключей.

## Процесс подключения языка (чеклист)

Обязательный порядок:

1. **Roadmap** — задача в backlog (`ожидает подтверждения`) + зависит от закрытого S09 (или явного waive владельца).
2. **ADR языка** — id, расширения, целевой capability level, non-goals.
3. **ADR парсера / extractor** — пакет, стратегия A/B/C/D, изоляция в `parsers/<lang>/`.
4. **Узкая спека** — `docs/10-technology/<lang>.md` (шаблон ниже).
5. **Approve** ADR + спека → статус `accepted` / ADR `Принято`.
6. **Код** — backend + регистрация + классификация basic + L1 extractor + (L2) resolve/scan.
7. **Фикстуры** — `tests/fixtures/<stage-or-lang>/` + `tests/<…>.test.js`.
8. **Регрессия** — весь `npm test` зелёный; JS/TS путь без деградации.
9. **Обновить** [`external-tools.md`](external-tools.md), [`language-backend.md`](../20-architecture/language-backend.md) (таблица языков), roadmap.

### Шаблон узкой спеки языка

```markdown
# S?? — <Language> как анализируемый язык
## Цель
## Границы (входит / не входит)
## Расширения и LanguageId / engine
## Capability level (L1…L4)
## Парсер / ModuleIR (ссылка на ADR)
## Инспекторы (таблица ожиданий)
## Resolve / scan
## Фикстуры и тесты
## Конфиг
## Acceptance criteria
```

## Ошибки

Те же `ParserError`: `FILE_NOT_FOUND` | `UNSUPPORTED_LANGUAGE` | `PARSE_FAILED` | `READ_FAILED`.

- Нет backend / язык выключен конфигом → `UNSUPPORTED_LANGUAGE` (`validation`).
- Парсер упал → `PARSE_FAILED` (`execution`).
- Инспектор выше заявленного level → skip с понятным `status` / сообщением **или** best-effort; не падать всем pipeline.

## Зависимости

- [`language-backend.md`](../20-architecture/language-backend.md) — контракт (стабилен; расширяется таблицей языков)
- [`s09-typescript.md`](s09-typescript.md) — образец узкой спеки
- [`external-tools.md`](external-tools.md) — реестр выбранных инструментов
- [`inspector-contract.md`](../20-architecture/inspector-contract.md) — без ломки
- [`project-model.md`](../20-architecture/project-model.md) — `LanguageId` union растёт строками backend id
- Blueprint: [`.dep/.blueprint/10-technology/30-interpreted-languages/`](../../.dep/.blueprint/10-technology/30-interpreted-languages/README.md)
- Roadmap: после [S09](../../handbook/roadmap/stages/09-multilang.md); упаковка backends — [S10](../../handbook/roadmap/stages/10-platform-monorepo.md)

## Рекомендуемый первый шаг реализации

После approve этой рамки и закрытия S09:

1. **`.jsx` (L1–L2)** — расширение JS-backend / Acorn JSX или согласованный ADR; минимальный риск.
2. Затем **Python L1→L2** — отдельный backend + ModuleIR extractor (ADR парсера обязателен до кода).

Lua — следующим тикетом после стабилизации Python L2.

## Acceptance criteria (рамка)

- [x] Очередь языков и capability levels согласованы с владельцем
- [x] Процесс «ADR → узкая спека → backend → фикстуры» описан и обязателен
- [x] Новый язык не требует изменения публичного `Inspector` / `analyze` контракта
- [x] JS/TS backends остаются регрессионно зелёными
- [x] Providers optional и не блокируют analyze
- [x] Первая узкая спека следующего языка (JSX или Python) заведена отдельным файлом до кодирования
