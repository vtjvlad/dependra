---
title: Конфигурация (S05)
status: accepted
mvp: false
source: .dep/.blueprint/35-configurations
---

# Конфигурация (S05)

## Цель

Расширить MVP-конфиг (defaults + CLI) до **иерархии файлов**, **профилей**, сахарного **`--level`**, поведения/оформления вывода, алиасов флагов и слота **AI provider** — без зашивания уровней/профилей в инспекторы.

MVP-база: [overview.md](overview.md). Наглядный шаблон: [`dependra.conf.example`](dependra.conf.example).

## Границы

### Входит (S05)

- Формат **`dependra.conf`** (INI-like, см. диалект ниже) — **единственный** формат конфига
- Иерархия: user + project (+ explicit `--config`)
- Профили (`--profile` / `-pr`), `--level` / `-l`, `--config` / `-cf`
- Секции: корневые поля, `[defaults]`, `[operations]`, `[report]`, `[flags.*]`, `[profiles.*]`, `[ai]`
- Валидация по схеме S05 после парсинга в внутреннюю модель (та же, что раньше описывалась JSON-объектом)

### Не входит

- JSON / YAML / TOML / `.mjs` как форматы конфига
- TUI-configurator (S08)
- Global `/etc/dependra` (слот зарезервирован, S05 не читает)
- Произвольные шаблоны отчётов (custom template engine)
- Хранение API-ключей в файле (только `apiKeyEnv`)
- Отбор/переназначение **встроенных** short S01–S04 (`-b|-i|-e|-g|-j|-p|-h|-v|-a|-en|-va|-env|-c|-ec|-r|-io`) — только **добавление** aliases; rename long допустим, short S01–S04 — нет
- Использование AI в pipeline до S06 (секция `[ai]` **резервируется и валидируется** в S05; вызовы provider — S06+)

## Иерархия (приоритет ↑)

1. Встроенные defaults  
2. *(global — слот, S05: не читается)*  
3. Конфиг проекта (`dependra.conf`)  
4. Пользовательский конфиг  
5. Профиль (`--profile` / `defaultProfile`)  
6. Раскрытие `--level`  
7. Явные параметры CLI (наивысший приоритет)

Явный op-флаг CLI **всегда** сильнее level/profile/config.

## Файлы

| Уровень | Путь (S05) |
|---------|------------|
| Project | `<projectRoot>/dependra.conf` |
| User | `$XDG_CONFIG_HOME/dependra/dependra.conf` или `~/.config/dependra/dependra.conf` |
| Explicit | путь из `--config` / `-cf` **вместо** авто-project (user мержится как обычно) |
| Example | [`dependra.conf.example`](dependra.conf.example) (канон) и копия в корне репо — все ключи в комментариях |

`projectRoot`: ближайший каталог с `package.json` вверх от target, иначе `dirname(target)`.

`--config` должен указывать на файл с расширением `.conf` (или basename `dependra.conf`); иначе exit `1`.

## Диалект `.conf` (обязательный)

1. Кодировка UTF-8; перевод строк `\n` или `\r\n`.
2. Комментарии: строка, начинающаяся с `#` (после optional whitespace), или хвост строки после `#` (кроме значений в кавычках).
3. Пустые строки игнорируются.
4. Секции: `[name]` или вложенный путь `[a.b.c]` (точки = вложенность).
5. Ключи вне секции — **корень** модели.
6. Присваивание: `key = value` (пробелы вокруг `=` опциональны).
7. Типы значений:
   - bool: `true` / `false` (lowercase)
   - integer: цифры (`timeoutMs = 30000`)
   - string: без кавычек до `#`/EOL; или `"..."` / `'...'` если нужны пробелы
   - null / сброс: пустое значение (`defaultProfile =`) или слово `null`
   - list: через запятую (`sectionOrder = file, imports, exports`)
8. Имена ключей/секций — case-sensitive.
9. Дубликат ключа в одной секции → побеждает **последний**.
10. Неизвестная секция/ключ при `strict = false` → warning stderr; при `strict = true` → exit `1`.

Парсер → внутренняя объектная модель (для merge/тестов); пользователю показывается только `.conf`.

## Схема (логическая модель после парсинга)

Эквивалент разобранного конфига:

| Путь | Тип | Смысл |
|------|-----|--------|
| `pathMode` | enum `name\|relative\|absolute` | как `-p` |
| `output` | `text\|json` | как `-j` |
| `defaultProfile` | string \| null | профиль без `--profile` |
| `strict` | bool | fail на неизвестных ключах |
| `defaults.whenNoFlags` | `s01-all` \| `none` \| имя профиля | поведение без op-флагов |
| `defaults.mergeMode` | `or` | пока только OR с CLI |
| `operations.*` | bool | базовые операции (имена как в JSON-отчёте options) |
| `report.format` | `text\|json` | дубль/уточнение `output` (CLI `-j` сильнее) |
| `report.style` | `schematic\|plain` | оформление text |
| `report.color` | `auto\|always\|never` | ANSI; `auto` = TTY && !NO_COLOR |
| `report.banner` | bool | баннер dependra |
| `report.sectionOrder` | string[] | порядок text-секций |
| `report.hideSections` | string[] | скрыть секции |
| `report.verbosity` | `quiet\|normal\|verbose` | детализация text |
| `report.unicode` | bool | box-drawing vs ASCII |
| `report.width` | int \| null | wrap; `null` = auto |
| `flags.aliases.<canonicalLong>` | string[] | доп. long/short **поверх** встроенных |
| `flags.rename.<canonicalLong>` | string | альтернативное **long**-имя (канон остаётся валиден) |
| `flags.disable` | string[] | запретить canonical long (CLI → ошибка) |
| `profiles.<name>.operations.*` | bool | |
| `profiles.<name>.pathMode` / `output` | optional | |
| `ai.enabled` | bool | мастер-выключатель (S06+) |
| `ai.provider` | string | id адаптера |
| `ai.baseUrl` | string \| null | |
| `ai.apiKeyEnv` | string | имя env с ключом (**не** сам ключ) |
| `ai.model` | string \| null | |
| `ai.timeoutMs` | int | |
| `ai.explain` | bool | AI explain (S06) |

Ключи `operations` / profile operations — те же имена, что `options` в отчёте:  
`basic`, `imports`, `exports`, `graph`, `additional`, `entities`, `validate`, `environment`, `commands`, `envCheck`, `runtime`, `io`, `mermaid`, `graphviz`, `vizJson`, `metadata`, … (S06+ добавят свои).

## Пример синтаксиса

```conf
pathMode = relative
output = text
defaultProfile =
strict = false

[defaults]
whenNoFlags = s01-all
mergeMode = or

[operations]
graph = true

[report]
style = schematic
color = auto
banner = true
sectionOrder = file, imports, exports, graph
hideSections =
verbosity = normal
unicode = true
width =

[flags.aliases]
--graph = --deps, -D

[flags.rename]
--validate = --check

[flags]
disable =

[profiles.quick.operations]
basic = true

[ai]
enabled = false
provider = openai
apiKeyEnv = DEPENDRA_AI_API_KEY
explain = false
```

Полный закомментированный шаблон: [`dependra.conf.example`](dependra.conf.example).

## Правила `defaults.whenNoFlags`

| Значение | Поведение, если после merge нет op-флагов CLI и все `operations` false |
|----------|------------------------------------------------------------------------|
| `s01-all` | как S01: basic+imports+exports+graph (**default**) |
| `none` | не включать ops автоматически (нужен явный флаг/profile/level/operations) |
| `<profileName>` | применить указанный профиль как defaultProfile |

## Правила `flags`

1. Canonical long из спеки CLI **всегда** принимается.
2. `aliases` — дополнительные токены → тот же canonical.
3. `rename` — новое long-имя; canonical тоже валиден; short S01–S04 **не** менять через rename.
4. Конфликт alias/rename с уже занятым токеном другого флага → exit `1` при загрузке конфига.
5. `disable` — canonical long в списке → использование → exit `1`.

## Профили и `--level`

| Long | Short |
|------|-------|
| `--profile <name>` | `-pr <name>` |
| `--level <n>` | `-l <n>` |
| `--config <path>` | `-cf <path>` |

- Профиль должен существовать после merge user+project.
- Level 1..5 — [analysis-levels.md](../40-development/analysis-levels.md); инспекторы level не читают.
- Level + profile → OR операций; явный CLI сверху.

## Порядок применения (алгоритм)

1. Встроенные defaults (включая `whenNoFlags = s01-all`)  
2. Load user `dependra.conf` (если есть)  
3. Load project / `--config`  
4. Deep-merge объектной модели (list/string — замена, не concat)  
5. `--profile` или `defaultProfile` → merge profile  
6. `--level` → OR с таблицей levels  
7. Argv → OR/override  
8. Если ops всё ещё пусты → применить `defaults.whenNoFlags`  
9. Pipeline по итоговому `options`; `report.*` → reporters; `ai.*` → зарезервировано до S06

## Ошибки

| Ситуация | Exit |
|----------|------|
| Синтаксис `.conf` / битый файл | `1` |
| `--config` не файл / не `.conf` | `1` |
| Неизвестный `--profile` | `1` |
| `--level` не 1..5 | `1` |
| Неверный тип (`pathMode`, bool, …) | `1` |
| Конфликт alias/rename | `1` |
| `strict` + неизвестный ключ | `1` |
| `apiKey` / секреты прямо в файле (если ключ запрещённой формы) | `1` |

## Зависимости

- [overview.md](overview.md)
- [dependra.conf.example](dependra.conf.example)
- [analysis-levels.md](../40-development/analysis-levels.md)
- [s05-flags.md](../50-cli/s05-flags.md)
- Blueprint: [`.dep/.blueprint/35-configurations/`](../../.dep/.blueprint/35-configurations/README.md)

## Acceptance criteria

- [ ] Канонический формат — только `.conf` (INI-like диалект выше)
- [ ] Без конфиг-файлов поведение = MVP (`whenNoFlags = s01-all`)
- [ ] `dependra.conf` с `[operations] graph = true` включает graph без `-g`
- [ ] `--profile` / `--level` / `--config` работают по спеке
- [ ] `[report]` влияет на text (style/color/banner/order) без смены семантики ops
- [ ] `[flags.aliases]` принимает доп. токен; short S01 не отбираются
- [ ] `[ai]` парсится; ключ только через `apiKeyEnv`; вызов AI не обязателен в S05
- [ ] Пример [`dependra.conf.example`](dependra.conf.example) содержит все ключи закомментированными
- [ ] Инспекторы не содержат `if (level === …)`
- [ ] CLI перебивает конфиг
