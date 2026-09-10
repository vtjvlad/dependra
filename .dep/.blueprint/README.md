---
title: Спецификация Dependra (Blueprint)
source: prompt.md
status: draft
---

# Спецификация Dependra (Blueprint)

Модульная спецификация проекта Dependra — CLI-платформы для исследования файлов, проектов и исходного кода.

> **Роль AI:** опытный архитектор ПО, Senior Node.js разработчик и инженер по статическому анализу кода.  
> Подробнее: [00-project/role.md](00-project/role.md)

Исходный монолитный документ: [prompt.md](prompt.md) (архив, не редактировать).

## Нумерация разделов

| Префикс | Раздел |
|---------|--------|
| `00` | Проект — концепция, цели, правила |
| `10` | Технологии — стек, инструменты, ИИ |
| `15` | Build System — сборка, монорепозиторий, релизы |
| `20` | Функционал — анализ, модификация, зависимости |
| `30` | Архитектура — принципы, требования, ограничения |
| `35` | Конфигурация — профили, сценарии, CLI |
| `40` | Принципы разработки — SOLID, уровни, производительность |
| `50` | Пользователь — CLI-флаги, TUI |
| `60` | Документация — основная, публичная, черновики |
| `70` | ADR — журнал архитектурных решений |
| `80` | Roadmap — процесс разработки, задачи |
| `90` | Контекст — индекс знаний проекта |
| `99` | Терминология — полный глоссарий |

## Дерево спецификации

```
.dep/.blueprint/
├── README.md                          ← вы здесь
├── prompt.md                          ← архив исходной спецификации
│
├── 00-project/                        ← концепция и цели
│   ├── role.md
│   ├── main-rule.md
│   ├── 10-general-concept/
│   ├── 20-main-goal/
│   └── 30-glossary/                   ← краткий указатель терминов
│
├── 10-technology/                     ← технологический стек
├── 15-build-system/                   ← система сборки
├── 20-features/                       ← функционал (анализ + модификация)
│   ├── priority-tags.md
│   ├── unified-project-model.md
│   ├── modifications/                 ← подсистема модификации
│   └── [15 функций анализа]/
│
├── 30-architecture/                   ← архитектурная модель
│   ├── principles/
│   └── requirements/
│
├── 35-configurations/                 ← конфигурация и профили
├── 40-development-guidelines/         ← принципы разработки
├── 50-user/                           ← CLI и TUI
│   ├── cli-flags.md
│   └── tui/
│
├── 60-documentation/                  ← система документации
├── 70-adr/                            ← ADR
├── 80-roadmap/                        ← Roadmap / TODO
├── 90-context/                        ← контекст проекта
└── 99-terminology/                    ← полный глоссарий
```

## Быстрая навигация

### Основа проекта
- [00-project/](00-project/README.md) — что такое Dependra и главное правило
- [00-project/main-rule.md](00-project/main-rule.md) — сначала архитектура, не весь функционал сразу

### Разработка
- [30-architecture/](30-architecture/README.md) — модульность, контракты, структура src/
- [40-development-guidelines/](40-development-guidelines/README.md) — SOLID, минимальная реализация
- [15-build-system/](15-build-system/README.md) — монорепозиторий, CI/CD
- [80-roadmap/](80-roadmap/README.md) — процесс разработки

### Функционал
- [20-features/](20-features/README.md) — все операции анализа и модификации
- [20-features/priority-tags.md](20-features/priority-tags.md) — теги -B/-M/-U/-P/-D/-F/-I
- [50-user/cli-flags.md](50-user/cli-flags.md) — флаги CLI

### Справочники
- [00-project/30-glossary/](00-project/30-glossary/README.md) — краткий указатель
- [99-terminology/](99-terminology/README.md) — полные определения терминов
- [90-context/](90-context/README.md) — индекс знаний для продолжения разработки

## Формат файлов

Каждый файл содержит YAML frontmatter:

```yaml
---
title: Название раздела
source: prompt.md
source_lines: [start, end]
tags: [B, M, ...]   # при необходимости
status: draft
---
```

## Связанные документы

- [prompt.md](prompt.md) — исходная спецификация (2721 строк)
