# Esquilo Invest - Codex Implementation Playbook (Authoritative)

## Objective
Execute the product in a modular, predictable way without improvisation.

## Global rules
- implement one module at a time
- follow this document as the main operational source
- do not invent business rules
- do not use AI for calculations
- do not move business logic to the frontend
- keep a single modular backend
- stop and report if a critical gap exists

## Execution mechanism
1. identify the requested module
2. locate the module section in this document
3. execute only the prompt for that module
4. validate the done criteria

If revisiting a module:
- ignore old conversational context
- use this module section again as the source of truth

## Global execution prompt
Read all required documents before coding.
Implement only the requested module.
Do not improvise outside the repository documentation.

## Official module order
1. foundation
2. profile
3. portfolio
4. score
5. import
6. alerts
7. goals
8. recommendations
9. notifications
10. ia_translation
11. frontend_mvp

## Module: foundation
Goal:
Create the technical base.

Expected outputs:
- project structure
- D1 configuration
- request validation base
- global error handling
- shared utilities base

Prompt:
Implement the technical foundation only. Create the base structure, database configuration, validation layer and global error handling. Do not implement business logic yet.

Done criteria:
- project boots correctly
- folders exist in the expected structure
- database connection is configured
- validation and error handling are reusable

## Module: profile
Goal:
Persist and read the financial profile.

Expected files:
- profile.routes.ts
- profile.service.ts
- profile.repository.ts
- profile.types.ts

Expected routes:
- GET /profile
- POST /profile

Prompt:
Implement the profile module. Persist and return the financial profile using D1. Validate inputs and keep response contracts stable. Do not integrate with other modules yet.

Done criteria:
- profile can be saved
- profile can be read
- invalid payloads are rejected clearly

## Module: portfolio
Goal:
Represent the consolidated portfolio.

Expected outputs:
- position structure
- consolidated summary
- aggregation by category
- aggregation by institution

Prompt:
Implement the portfolio module. Represent positions and return consolidated portfolio views for summary and listing use cases.

Done criteria:
- portfolio summary works
- listing works
- aggregation by category and institution works

## Module: score
Goal:
Calculate deterministic portfolio score.

Expected files:
- OLD/codigo_solto/score.routes.ts
- score.service.ts
- score.rules.ts
- score.types.ts

Expected output:
- score
- breakdown
- classification
- main_problem
- main_action

Prompt:
Implement the score module. Use only deterministic rules from documentation. Do not use AI. Keep calculation rules isolated in score.rules.ts.

Done criteria:
- same input gives same output
- breakdown is returned
- main problem and main action are returned

## Module: import
Goal:
Enable portfolio input by file with review and confirmation.

Expected outputs:
- upload entrypoint
- parsing
- preview
- confirmation
- result
- import history
- error handling and fallback path

Prompt:
Implement the import module. Support upload, read, preview, confirm and return the result. Include import history and clear failure handling.

Done criteria:
- user can upload and preview
- user can confirm import
- result is persisted correctly
- failures are explained clearly

## Module: alerts
Goal:
Detect relevant portfolio events.

Expected rules:
- high concentration
- fund under CDI
- no contribution for a period
- relevant drawdown
- cooldown
- deduplication

Prompt:
Implement the alerts module using deterministic rules. Persist alerts, avoid duplicates and apply cooldown.

Done criteria:
- alerts are generated consistently
- duplicates are prevented
- cooldown is respected

## Module: goals
Goal:
Simulate goals and viability.

Expected outputs:
- projected value
- goal gap
- feasible flag
- deterministic suggested action

Prompt:
Implement the goals module using deterministic calculations only. Return projection, gap and viability.

Done criteria:
- same input gives same output
- simulation response is stable and useful to the frontend

## Module: recommendations
Goal:
Map a main problem to one clear action.

Expected outputs:
- problem to action mapping
- recommendation keys
- stable response contract for frontend

Prompt:
Implement the recommendations module. Always return one main action for one main problem.

Done criteria:
- no ambiguity in output
- one main problem maps to one main action

## Module: notifications
Goal:
Send relevant alerts through external channels.

Expected outputs:
- Telegram integration
- Email via Apps Script integration
- channel routing rule
- send history

Prompt:
Implement the notifications module. Send alerts through Telegram and Email, keep send history and avoid duplicate sends.

Done criteria:
- external send works
- duplicate sends are prevented
- channel routing is explicit

## Module: ia_translation
Goal:
Translate technical output into product language.

Prompt:
Implement the AI translation layer. It may transform technical outputs into short human explanations, but it must not calculate, score, classify or decide alerts.

Done criteria:
- AI only translates
- business decisions remain deterministic

## Module: frontend_mvp
Goal:
Consume ready backend contracts with no business logic.

Official order:
1. onboarding
2. import
3. home
4. portfolio
5. asset detail
6. score
7. alerts
8. goals

Prompt:
Implement the MVP frontend only after backend contracts are stable. The frontend must consume APIs and must not contain business rules.

Done criteria:
- main MVP flow is navigable
- frontend only consumes stable contracts

## Global done criteria
A module is done only when:
- routes work
- validation exists
- errors are handled
- outputs are predictable
- the module respects product rules and contracts

## Final rule
If there is any conflict between improvising and following documentation, follow documentation.
This file should be treated as the authoritative operational playbook when it conflicts with simplified versions.
