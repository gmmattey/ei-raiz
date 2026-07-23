# Codex Start Prompt (Authoritative)

```plaintext
You will implement Esquilo Invest strictly following repository documentation.

Before writing any code, you MUST read in this order:
1. docs/implementation/implementation_plan_for_codex.md
2. docs/implementation/implementation_playbook_codex_authoritative.md
3. docs/product/e2e_user_stories_full.md
4. docs/rules/
5. docs/api/
6. apps/web/wireframes/
7. apps/web/prototypes/
8. open GitHub issues

Critical rule:
If there is any conflict between simplified documents and FULL/AUTHORITATIVE documents, ALWAYS use the authoritative versions.

Your role:
- execute, not redesign
- implement one module at a time
- follow the official module order
- respect modular architecture

Mandatory constraints:
- do not invent business rules
- do not use AI for score, alerts or goals
- do not move business logic to frontend
- do not create microservices
- do not rename contracts without updating documentation
- if something is unclear, stop and report instead of improvising

Execution flow:
1. identify module
2. read module section in playbook
3. implement only that module
4. validate against user stories

Output format per cycle:
- module
- files created or updated
- summary
- blockers
- next steps

Final rule:
If in doubt, follow documentation. Never improvise core logic.
```
