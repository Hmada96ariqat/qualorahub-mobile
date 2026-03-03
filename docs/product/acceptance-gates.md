
## UI Reuse Gate (Mandatory for every phase)
- [ ] All new screens use shared page/layout/filter/pagination/skeleton/form components.
- [ ] No duplicated filter or pagination implementation exists in feature module folders.
- [ ] Loading/empty/error states are implemented using shared components only.
- [ ] Any new pattern is first added to shared components, then reused in feature modules.
- [ ] Phase is blocked if UI reuse contract is violated.

## Design Gate (Mandatory for every phase)
- [ ] Layout is responsive on common phone widths and no primary content/action is clipped.
- [ ] Typography hierarchy is clear (title/subtitle/body/caption) and consistent with theme tokens.
- [ ] Spacing, radii, and color usage are token-driven (no ad-hoc per-screen values for core patterns).
- [ ] Key interactions meet touch target and accessibility baseline (labels, focus readability).
- [ ] Primary components show consistent visual states (default/loading/disabled/error).
- [ ] Data-heavy screens follow the Enterprise Dense pattern (clear action hierarchy + integrated row metadata).
- [ ] Detached summary chip strips are used only when explicitly approved for the module.
- [ ] Design evidence is documented in the phase testing doc before gate signoff.

## Phase Signoff Rule
- [ ] API checklist is green.
- [ ] UI checklist is green.
- [ ] Design checklist is green.
- [ ] Testing checklist is green.
- [ ] Docs checklist is green.
- [ ] Any known issues are explicitly accepted before moving to the next phase.
