---
title: Дополнительная информация о файле
status: draft
mvp: false
source: .dep/.blueprint/20-features/additional-file-information---B
tags: [B]
---

# Дополнительная информация о файле (−B, S02)

## Цель

Расширить карточку файла сверх MVP `basic-file-information`: пути, права доступа, эвристика копий.

## Границы

### Входит (S02)

- Абсолютный и относительный (от `cwd`) путь
- Права доступа файла (mode / rwx для owner·group·other — best-effort по платформе)
- Оценка, нужны ли повышенные права (sudo/root) для read / write / change mode / delete — **эвристика**, не гарантия безопасности
- Поиск вероятных копий: не только по имени; учитываются размер, префикс содержимого, контрольная сумма, степень совпадения; слабое совпадение → не копия
- Расположение найденных копий (с учётом `--path-mode` / `-p`)

### Не входит

- Полноценный ACL / SELinux / capability-граф (→ позже / S04 permissions-heavy)
- Индексатор всего диска; корень поиска копий — как у graph: `package.json` вверх от файла, иначе `cwd`; skip `node_modules`, `.git`
- Замена MVP-секции `file` (basic): **additional** — отдельная операция и секция

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--additional` | `-a` | Первая буква; `a` свободна (S01) |

Не входит в default-all. Комбинируется с `-b`, `-j`, `-p`, …

Спека флагов: [s02-flags.md](../../50-cli/s02-flags.md).  
Общие short-правила: [interface.md](../../50-cli/interface.md#короткие-флаги).

## Вход

- `targetPath` — существующий файл
- `options.pathMode` — отображение путей копий (`name` \| `relative` \| `absolute`)
- Инспектор: `additional-file-information`

## Выход (`data`)

```json
{
  "absolutePath": "/abs/proj/src/app.js",
  "relativePath": "src/app.js",
  "permissions": {
    "modeOctal": "0644",
    "modeString": "rw-r--r--",
    "uid": "1000",
    "gid": "1000"
  },
  "privilegeHints": {
    "read": "ok",
    "write": "ok",
    "chmod": "may-need-elevated",
    "delete": "ok"
  },
  "copies": [
    {
      "display": "src/app.copy.js",
      "path": "/abs/proj/src/app.copy.js",
      "score": 0.92,
      "matchedBy": ["size", "checksum"]
    }
  ]
}
```

`privilegeHints.*`: `"ok"` \| `"may-need-elevated"` \| `"unknown"`.

## Text (schematic)

Секция с title **`additional`** (рамка как у S01 reporters):

```
┌─ additional ───────────────────────────────────┐
│  abs    /abs/proj/src/app.js                   │
│  rel    src/app.js                             │
│  mode   rw-r--r--  ·  0644  ·  uid 1000        │
│  priv   read ok · write ok · chmod ? · delete ok│
│  copies                                        │
│  →  src/app.copy.js              score 0.92    │
└────────────────────────────────────────────────┘
```

## Правила

1. Relative path — от `cwd` контекста (как `shortPath` в reporters).
2. Копии: порог совпадения задаётся константой инспектора (документировать в коде + AC); ниже порога — не включать.
3. Ошибка stat/access → коды как у basic (`FILE_NOT_FOUND`, `NOT_A_FILE`, `STAT_FAILED`) плюс при сбое скана копий — `SCAN_FAILED` (execution), не глушить весь отчёт прав/путей если скан опционально деградирует: предпочтительно `status: "ok"` с `copies: []` и `details.scanWarning`, либо полный `error` — выбрать одно в реализации и зафиксировать в AC тестом (рекомендация: degrade + warning).
4. Не дублировать весь MVP-basic; при желании полного досье пользователь делает `-b -a`.

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет пути |
| `NOT_A_FILE` | validation | Не файл |
| `STAT_FAILED` | execution | Не удалось прочитать метаданные |
| `SCAN_FAILED` | execution | Фатальный сбой обхода при поиске копий (если не degrade) |

## Зависимости

- S01: `basic-file-information`, `scanner`-helpers (корень/`list` как у graph)
- [s02-flags.md](../../50-cli/s02-flags.md)
- [inspector-contract.md](../../20-architecture/inspector-contract.md)

## Acceptance criteria

- [ ] CLI: `--additional` и `-a` эквивалентны
- [ ] В `results` ключ `additional-file-information` только при флаге
- [ ] JSON содержит abs/rel, permissions, privilegeHints, copies
- [ ] Text schematic-секция `additional`
- [ ] `--path-mode` влияет на `copies[].display`
- [ ] Не входит в default-all
