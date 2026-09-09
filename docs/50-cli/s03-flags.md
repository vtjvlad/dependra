---
title: CLI флаги S03
status: draft
mvp: false
source: handbook/roadmap/stages/03-validation.md, docs/50-cli/interface.md
---

# CLI флаги S03

## Цель

Зафиксировать operation-флаг этапа **S03** (validation / diagnostics) в тех же правилах, что S01/S02: long/short, pipeline/`results`, schematic-секции и help.

Версия пакета остаётся `0.0.39` (не повышать без approve).

## Правила short (наследство S01)

См. [interface.md — Короткие флаги](interface.md#короткие-флаги).

Кратко: одна буква → при коллизии **вторая** буква; short S01/S02 не трогать.

## Флаги операций S03

| Long | Short | Почему short | Инспектор / секция |
|------|-------|--------------|--------------------|
| `--validate` | `-va` | `-v` = `--version` → две буквы `va` | `validation` → schematic **diagnostics** |

### Не флаги S03 (уже есть)

| Long | Short | Роль для S03 |
|------|-------|----------------|
| `--path-mode` | `-p` | Display-пути в `CYCLE.paths` / `display` |
| `--json` | `-j` | JSON-отчёт |
| S01 / S02 ops | … | Комбинируются; validate независим |

### Запрещено в S03

- Переназначать `-v` на validate
- Uppercase-short (`-V`) — вместо этого `-va`
- Кластеры (`-bva`); только отдельные токены: `-va`
- Включать `--validate` в default-all без явного флага
- Отдельные флаги на cycles/unused/broken в S03 — один `--validate` включает все checks спеки

## Default и комбинации

- Нет op-флагов S01 → по-прежнему **четыре операции S01**.
- `-va` / `--validate` включается **только явно**.
- Можно комбинировать, например: `dependra file.js -va`, `dependra file.js -g -va -j`, `dependra file.js -va -p name`.

## Соответствие флагов и `results`

| Запрошенные флаги | Ключ в `results` | Text-секция (schematic title) |
|-------------------|------------------|--------------------------------|
| `--validate` / `-va` | `validation` | `diagnostics` |

`options` в JSON-отчёте дополняется:

```json
{
  "basic": false,
  "imports": false,
  "exports": false,
  "graph": false,
  "additional": false,
  "entities": false,
  "validate": true,
  "pathMode": "relative"
}
```

Поля S01/S02 сохраняются; новое — `validate` (boolean).

## Pipeline (дополнение)

После шагов S01/S02 (или вместо них, если запрошен только validate):

1. Если `--validate` / `-va`:
   - обеспечить imports целевого (prerequisite `import-export-analysis` без обязательного ключа в `results`);
   - при необходимости scan/граф для cycles и unused exports (внутри инспектора или shared scanner — как у graph);
   - инспектор `validation` → ключ в `results`.
2. Reporters: schematic-секция `diagnostics` только при включённом validate.

Детали данных: [validation.md](../20-features/analysis/validation.md).

## Help (schematic)

Добавить рамку:

```
┌─ operations · s03 ─────────────────────────────┐
│ -va, --validate         cycles, unused, broken │
│                                                │
│ только явное включение (не в default-all)      │
└────────────────────────────────────────────────┘
```

Стиль — тот же schematic (`src/cli/help.js` + `reporters/style.js`).

## Text (schematic)

Идея секции:

```
┌─ diagnostics ──────────────────────────────────┐
│  path-mode relative                            │
│  1 error · 2 warnings                          │
│  ✖ CYCLE          src/a.js → src/b.js → a.js   │
│  ⚠ UNUSED_IMPORT  ./unused.js           :2:0   │
│  ⚠ UNUSED_EXPORT  helper                :10:0  │
│  ✖ BROKEN_IMPORT  ./missing.js          :3:0   │
└────────────────────────────────────────────────┘
```

Точный layout — reporters; смысл: severity + code + краткий контекст.

См. также [output-formats.md](output-formats.md#секции-s03).

## Acceptance criteria

- [ ] Short `-va` документирован и не конфликтует с `-v` / S01 / S02
- [ ] Default-all не включает validate
- [ ] Help содержит рамку `operations · s03`
- [ ] Text schematic: секция `diagnostics` только при `-va` / `--validate`
- [ ] JSON `options` содержит `validate`
- [ ] Один флаг включает все checks S03 (нет отдельных CLI switches на cycle/unused)
