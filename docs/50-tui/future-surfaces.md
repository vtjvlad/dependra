---
title: Future surfaces (S08)
status: accepted
mvp: false
source: .dep/.blueprint/50-user/tui/future-interfaces.md
---

# Future surfaces (контракты)

Каркас контрактов без полной реализации UI. Все surfaces используют `src/api`.

## Node library

```js
import {
  registerBuiltins,
  analyze,
  formatText,
  listOperations,
  loadMergedConfig,
  saveConf,
} from "dependra";
```

Пакет экспортирует API через `package.json` → `exports` / `main`.

## REST (stub)

| Method | Path | Тело / ответ |
|--------|------|----------------|
| `POST` | `/v1/analyze` | `{ targetPath, options }` → `AnalysisReport` |
| `GET` | `/v1/operations` | список `listOperations()` |
| `GET` | `/v1/config` | merged model |
| `PUT` | `/v1/config` | model → save |

Сервер **не** реализуется в S08.

## IDE hook (stub)

- Команда «Analyze file» → `analyze({ targetPath, options })`
- Панель результатов → `formatText` или JSON `report`
- Settings → те же ключи configurator

Плагины VS Code / JetBrains — вне S08.

## Правила

- Новый surface не дублирует бизнес-логику
- Не требуется менять инспекторы при добавлении UI
