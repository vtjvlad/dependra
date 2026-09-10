---
title: CLI флаги S02
status: draft
mvp: false
source: handbook/roadmap/stages/02-deepen-analysis.md, docs/50-cli/interface.md
---

# CLI флаги S02

## Цель

Зафиксировать новые operation-флаги этапа **S02** в тех же правилах, что и S01: long/short, pipeline/`results`, schematic-секции и help.

Версия пакета остаётся `0.0.47` (не повышать без approve).

## Правила short (наследство S01)

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).

Кратко: одна буква → при коллизии **вторая** буква; short S01 не трогать.

## Флаги операций S02

| Long | Short | Почему short | Инспектор / секция |
|------|-------|--------------|--------------------|
| `--additional` | `-a` | `a` свободна | `additional-file-information` → schematic **additional** |
| `--entities` | `-en` | `-e` занят `--exports` → две буквы `en` | `exported-entities` → schematic **entities** |

### Не флаги S02 (уже есть)

| Long | Short | Роль для S02 |
|------|-------|----------------|
| `--path-mode` | `-p` | Режимы `name\|relative\|absolute` для путей в **additional** (abs/rel display) и **entities** |
| `--json` | `-j` | JSON-отчёт без schematic |
| `--basic` / `--exports` / … | S01 | Без изменений; комбинируются с S02 |

### Запрещено в S02

- Переназначать `-e` на entities
- Uppercase-short ради коллизии (`-E`) — вместо этого `-en`
- Кластеры (`-aen`); только отдельные токены: `-a`, `-en`
- Включать `--additional` / `--entities` в default-all без явных флагов

## Default и комбинации

- Нет op-флагов S01 → по-прежнему **четыре операции S01** (`basic|imports|exports|graph`).
- `-a` / `--additional` и `-en` / `--entities` включаются **только явно**.
- Можно комбинировать с S01, например: `dependra file.js -b -a`, `dependra file.js -en -p name`, `dependra file.js -e -en -j`.

## Соответствие флагов и `results`

| Запрошенные флаги | Ключ в `results` | Text-секция (schematic title) |
|-------------------|------------------|--------------------------------|
| `--additional` / `-a` | `additional-file-information` | `additional` |
| `--entities` / `-en` | `exported-entities` | `entities` |

`options` в JSON-отчёте дополняется полями:

```json
{
  "basic": false,
  "imports": false,
  "exports": false,
  "graph": false,
  "additional": true,
  "entities": true,
  "pathMode": "relative"
}
```

Поля S01 сохраняются; новые — `additional`, `entities` (boolean).

## Pipeline (дополнение к S01)

После шагов S01 (или вместо них, если запрошены только S02):

1. Если `--additional` / `-a` → инспектор `additional-file-information` → ключ в `results`.
2. Если `--entities` / `-en` → нужен AST/модель файла (как у import-export): при необходимости prerequisite загрузки/`import-export-analysis` **внутри** pipeline без обязательного ключа в `results`, затем `exported-entities`.
3. Reporters: schematic-секции только для включённых операций (S01 + S02).

Детали данных:  
[additional-file-information.md](../20-features/analysis/additional-file-information.md),  
[exported-entities.md](../20-features/analysis/exported-entities.md).

## Help (schematic)

Блок **operations** в `--help` остаётся для S01. Добавить отдельную рамку:

```
┌─ operations · s02 ─────────────────────────────┐
│ -a, --additional          пути, права, копии   │
│ -en, --entities           символы import/export│
│                                                │
│ только явное включение (не в default-all)      │
└────────────────────────────────────────────────┘
```

Стиль — тот же schematic (`src/cli/help.js` + `reporters/style.js`): рамки, short+long в одной колонке, баннер внизу без изменений.

## Text (schematic)

Идея секций (точный layout — reporters):

```
┌─ additional ───────────────────────────────────┐
│  abs   /abs/proj/src/app.js                    │
│  rel   src/app.js                              │
│  mode  rw-r--r--  ·  uid 1000                  │
│  copies                                        │
│  →  src/app.copy.js              match high    │
└────────────────────────────────────────────────┘

┌─ entities ─────────────────────────────────────┐
│  path-mode name                                │
│  export  ◆  run           function             │
│  export  ◆  App           class                │
│  import  →  helper        function  ← ./lib.js │
└────────────────────────────────────────────────┘
```

См. также [output-formats.md](output-formats.md#секции-s02).

## Acceptance criteria

- [ ] Short `-a` и `-en` документированы и не конфликтуют с S01
- [ ] Правило «вторая буква при коллизии» применено к `--entities`
- [ ] Default-all не включает additional/entities
- [ ] Help содержит рамку `operations · s02`
- [ ] Text schematic имеет секции `additional` и `entities` только при соответствующих флагах
- [ ] JSON `options` содержит `additional` / `entities`
