---
title: Конфигурация (S05)
status: draft
mvp: false
source: .dep/.blueprint/35-configurations
---

# Конфигурация (S05)

## Цель

Расширить MVP-конфиг (defaults + CLI) до **иерархии файлов**, **профилей** и сахарного **`--level`**, не зашивая уровни/профили в инспекторы.

MVP-база: [overview.md](overview.md) (defaults + CLI). Этот документ — рабочая спека S05 поверх неё.

## Границы

### Входит (S05)

- Иерархия источников (см. ниже)
- Файлы: project + user (JSON)
- Профили (`--profile` / `-pr`)
- `--level` / `-l` как сахар → набор operation-флагов
- `--config <path>` / `-cf` — явный путь к project-config (опционально)
- Валидация загруженного JSON по упрощённой схеме S05

### Не входит

- TUI-configurator (S08)
- Произвольные user-aliases переопределения short-флагов CLI (blueprint cli-settings — later)
- Полный набор типов blueprint (float/commands/scripts) — в S05: bool, string, enum, string[], object
- Global system-wide `/etc/dependra` (optional later; слот в иерархии зарезервирован, в S05 не читаем)
- Result persistence / custom report templates

## Иерархия (приоритет ↑)

1. Встроенные defaults  
2. *(global — слот, S05: не читается)*  
3. Конфиг проекта (`dependra.config.json`)  
4. Пользовательский конфиг  
5. Профиль (из project или user, выбранный `--profile` / `defaultProfile`)  
6. Раскрытие `--level` (сахар → операции; см. [analysis-levels.md](../40-development/analysis-levels.md))  
7. Явные параметры CLI (наивысший приоритет)

Правило: более высокий уровень **переопределяет** нижний.  
Явный op-флаг CLI **всегда** сильнее level/profile/defaults.

## Файлы

| Уровень | Путь (S05) |
|---------|------------|
| Project | `<projectRoot>/dependra.config.json` |
| User | `$XDG_CONFIG_HOME/dependra/config.json` или `~/.config/dependra/config.json` |
| Explicit | путь из `--config` / `-cf` **вместо** авто-project (user всё ещё мержится ниже CLI) |

`projectRoot`: ближайший каталог с `package.json` вверх от target, иначе `dirname(target)` (как корень graph).

Формат S05 — **только JSON**. Иные расширения — ошибка валидации CLI, если указаны через `--config`.

## Схема конфига (S05)

```json
{
  "pathMode": "relative",
  "output": "text",
  "defaultProfile": null,
  "operations": {
    "basic": false,
    "imports": false,
    "exports": false,
    "graph": false
  },
  "profiles": {
    "quick": {
      "operations": { "basic": true }
    },
    "deps": {
      "operations": {
        "basic": true,
        "imports": true,
        "exports": true,
        "graph": true
      }
    },
    "validate": {
      "operations": {
        "imports": true,
        "graph": true,
        "validate": true
      }
    }
  }
}
```

### Поля

| Поле | Тип | Смысл |
|------|-----|--------|
| `pathMode` | enum | как CLI `-p` |
| `output` | `"text"` \| `"json"` | эквивалент отсутствия/наличия `-j` |
| `defaultProfile` | string \| null | имя из `profiles`, если нет `--profile` |
| `operations` | object\<string,bool\> | базовые операции до профиля |
| `profiles` | object | именованные наборы; ключи operations — **имена options**, как в JSON-отчёте (`validate`, `envCheck`, `vizJson`, …) |

Неизвестные ключи верхнего уровня → warning в stderr (не fail) **или** fail при `"strict": true` (опциональное поле; default false).

## Профили

| Long | Short |
|------|-------|
| `--profile <name>` | `-pr <name>` |

- Имя должно существовать после merge project+user.
- Нет имени → exit `1`, сообщение.
- Встроенные имена **не** обязательны в коде; примеры `quick` / `deps` / `validate` — для docs/фикстур. Пользователь задаёт свои в JSON.
- Профиль задаёт `operations` (+ опционально `pathMode` / `output`). Не задаёт viz-форматы косвенно, кроме как через operations-ключи `mermaid`/`graphviz`/`vizJson`/`metadata`.

## `--level` (сахар)

См. полную таблицу: [analysis-levels.md](../40-development/analysis-levels.md).

| Long | Short |
|------|-------|
| `--level <n>` | `-l <n>` |

- `n` ∈ {1,2,3,4,5}; иначе exit `1`.
- CLI раскрывает level в набор `operations` **до** мержа с явными флагами.
- Явный `--basic` / `-va` / … **добавляет** операции (OR), не снимает level-набор; чтобы сузить — не указывай level.
- Конфликт level + profile: оба применяются (OR операций); явный CLI всё равно сверху. Рекомендация в help: предпочитать одно из двух.
- Инспекторы **не** читают `level`.

## Default-all после S05

Если после merge **нет ни одной** операции (ни level, ни profile, ни flags, ни config.operations):

→ как S01: четыре операции `basic|imports|exports|graph`.

Операции S02+ / viz / metadata **не** входят в этот fallback.

## Порядок применения (алгоритм)

1. defaults  
2. load user config (если есть)  
3. load project / `--config`  
4. deep-merge objects; arrays не конкатенируем (замена)  
5. если `--profile` или `defaultProfile` → merge profile.operations  
6. если `--level` → OR с таблицей level  
7. argv flags → OR/override (`--json` → output json; `-p` → pathMode; op-флаги → operations)  
8. если operations всё ещё все false → default-all S01  
9. pipeline как сейчас по итоговому `options`

## Ошибки

| Ситуация | Exit |
|----------|------|
| Битый JSON конфига | `1` |
| `--config` путь не файл | `1` |
| Неизвестный `--profile` | `1` |
| `--level` не 1..5 | `1` |
| Схема: неверный тип `pathMode` | `1` |

## Зависимости

- [overview.md](overview.md) (MVP)
- [analysis-levels.md](../40-development/analysis-levels.md)
- [s05-flags.md](../50-cli/s05-flags.md)
- Blueprint archive: [`.dep/.blueprint/35-configurations/`](../../.dep/.blueprint/35-configurations/README.md)

## Acceptance criteria

- [ ] Без конфиг-файлов поведение = MVP (defaults + CLI)
- [ ] `dependra.config.json` с `operations.graph: true` включает graph без `-g`
- [ ] `--profile deps` раскрывает набор операций профиля
- [ ] `--level 3` ≡ basic+imports+exports+graph (при отсутствии сужающих явных off — в S05 нет «anti-flags»)
- [ ] Явный `-va` к `--level 1` даёт basic+validate
- [ ] CLI-флаг перебивает то же поле из конфига (`-p name` vs config pathMode)
- [ ] Инспекторы не содержат `if (level === …)`
- [ ] User + project merge с приоритетом project < profile < level < CLI
