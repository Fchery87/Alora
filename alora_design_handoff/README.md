# Alora AAA Design Handoff

This folder is intended to be copied directly into the Alora repository, e.g.:

`docs/design/alora-aaa/`

## Start here

Use this order inside the Alora repository:

1. **Inspect the existing implementation**
2. `IMPLEMENTED_BEHAVIOR_CONTRACT.md` — behavior that must survive the redesign
3. `screen-contracts.json` — machine-readable screen behavior
4. `content-contracts.json` — pinned vs data-driven content
5. `design.md` — visual/interaction specification
6. `design-tokens.json`
7. `alora-theme.ts`
8. `assets/reference/` + `assets/screens/` — visual-only references
9. `LLM_IMPLEMENTATION_PROMPT.md` — ready-to-paste coding-agent prompt

`RECONCILIATION_MATRIX.md` records the audit findings closed in v1.2.

## Important

The reference PNGs are for visual comparison only and should generally not be embedded as UI screenshots. Their copy, filters, controls, resources, dates, and feature inventory are not authoritative.

No font files are included. Load Playfair Display and Inter through Expo/Google Fonts.

The design specification intentionally preserves Alora's core coordination, local-first, privacy, and non-clinical behavior while replacing the previous visual composition.

## Implementation clarifications

- **Public brand:** use `Alora`. Where the Settings/About footer needs a brand line, use `Alora · The calm in the chaos.` Do not ship `Alora · Quiet Dawn`, `Alora AAA`, or `Warm Editorial` as public branding.
- **Support resources:** content is repository/data-driven. The screenshots only define visual treatment. Do not hard-code 988 or replace current mock/live resources with prototype text.
