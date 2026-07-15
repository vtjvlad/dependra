---
title: Архитектура
source: prompt.md
source_lines: [715, 1081]
status: draft
---

# Архитектура

Общая архитектурная модель проекта Dependra: модульность, контракты, расширяемость.

## Содержание раздела

- [general.md](general.md) — общие положения
- [principles/](principles/README.md) — принципы архитектуры
  - [modularity-and-responsibility.md](principles/modularity-and-responsibility.md)
  - [contract-based-design.md](principles/contract-based-design.md)
  - [implementation-isolation.md](principles/implementation-isolation.md)
  - [loose-coupling.md](principles/loose-coupling.md)
  - [scalability.md](principles/scalability.md)
  - [extensibility.md](principles/extensibility.md)
  - [operation-composition.md](principles/operation-composition.md)
  - [reuse.md](principles/reuse.md)
- [requirements/](requirements/README.md) — требования к архитектуре
  - [modules-and-responsibilities.md](requirements/modules-and-responsibilities.md)
  - [module-contract.md](requirements/module-contract.md)
  - [public-api.md](requirements/public-api.md)
  - [input-schema.md](requirements/input-schema.md)
  - [output-schema.md](requirements/output-schema.md)
  - [error-model.md](requirements/error-model.md)
  - [interface-versioning.md](requirements/interface-versioning.md)
  - [interaction-boundaries.md](requirements/interaction-boundaries.md)
  - [project-structure.md](requirements/project-structure.md)
- [limitations.md](limitations.md) — ограничения и запреты
- [recommendations.md](recommendations.md) — рекомендации

## Связанные разделы

- [../20-features/unified-project-model.md](../20-features/unified-project-model.md) — единая модель проекта
- [../70-adr/README.md](../70-adr/README.md) — журнал архитектурных решений
