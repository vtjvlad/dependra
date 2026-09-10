---
title: Проверка окружения
status: draft
mvp: false
source: .dep/.blueprint/20-features/environment-validation---P
tags: [P]
---

# Проверка окружения (−P, S04)

## Цель

Проверить **наличие инструментов**, нужных для работы с целевым файлом / проектом, и показать отсутствующие.

## Границы

### Входит (S04)

- Набор required tools по эвристике:
  - JS/Node цель (`.js`/`.mjs`/`.cjs` или `package.json` рядом): `node`; package manager — по lockfile (`package-lock.json` → `npm`, `pnpm-lock.yaml` → `pnpm`, `yarn.lock` → `yarn`, `bun.lockb`/`bun.lock` → `bun`); если lockfile нет — проверить `npm` как default hint (severity `info` через `required: false` или отдельное поле — в S04: `required: true` только при lockfile/engines, иначе `npm` с `required: false`)
  - Shebang `python` / `python3` → python3; `ruby` → ruby; `bash`/`sh` → bash/sh
- Для каждого инструмента: `name`, `required` (bool), `available` (bool), `version` (строка или null — best-effort `--version` / `-v` с таймаутом, **без** установки чего-либо)
- `missing[]` — имена required, у которых `available: false`

### Не входит

- Установка missing tools (S07 environment ops)
- Полная матрица всех языков blueprint (gcc/cargo/go/dotnet/…) как обязательная для JS-фикстур — достаточно JS + shebang-хитов; расширенный каталог языков — best-effort если shebang/расширение ясно указывают
- Проверка semver range из `engines` в package.json — optional `details.engines` без fail AC в S04
- Сетевые проверки registry

## CLI

| Long | Short | Правило short |
|------|-------|---------------|
| `--env-check` | `-ec` | `-e` занят → `-ec` (env-check) |

Не в default-all.  
Не путать с `--environment` / `-env` (file-environment).  
Спека: [s04-flags.md](../../50-cli/s04-flags.md).

## Инспектор

- id: `environment-validation`
- text-секция: `env-check`

## Вход

- Целевой файл
- Корень проекта (package.json вверх / cwd) для lockfiles
- `PATH`

## Выход (`data`)

```json
{
  "tools": [
    {
      "name": "node",
      "required": true,
      "available": true,
      "version": "v22.0.0"
    },
    {
      "name": "pnpm",
      "required": true,
      "available": false,
      "version": null
    }
  ],
  "missing": ["pnpm"]
}
```

## Правила

1. Только чтение PATH / запуск `tool --version` (или `-v`) с коротким timeout; **не** `npm install`.
2. `required: false` допустим для informational tools; в `missing` только `required && !available`.
3. Несколько lockfile — все соответствующие managers `required: true` (редко, но явно).
4. Версия: первая строка stdout/stderr; parse fail → `version: null`, `available: true` если binary найден.
5. Инспектор `status: "ok"` даже при non-empty `missing` (это diagnostics окружения, не сбой анализа).

## Ошибки

| code | category | Условие |
|------|----------|---------|
| `FILE_NOT_FOUND` | validation | Нет файла |
| `NOT_A_FILE` | validation | Не файл |

## Зависимости

- [file-environment-analysis.md](file-environment-analysis.md) (корень; не prerequisite)
- [runtime-dependency-analysis.md](runtime-dependency-analysis.md) (дополняет «чем запускать»)
- [s04-flags.md](../../50-cli/s04-flags.md)

## Acceptance criteria

- [ ] `-ec` / `--env-check` → ключ `environment-validation`
- [ ] Для JS-фикстуры с `package.json` в `tools` есть `node`
- [ ] Lockfile pnpm/npm на фикстуре включает соответствующий manager в `tools`
- [ ] `missing` согласован с `required && !available`
- [ ] Нет мутаций / install
- [ ] Не в default-all
