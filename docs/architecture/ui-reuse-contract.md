# UI Reuse Contract

## Goal
Keep screen design consistent and avoid duplicated UI structure across modules.

## Mandatory Shared Building Blocks
- `AppScreen` (page shell)
- `AppHeader` (page title/actions)
- `FilterBar` (search + filters area)
- `PaginationFooter` (paging controls)
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `FormField` (label + input + error text)
- `SectionCard` (standard grouped content card)

## Rules
1. Feature screens must compose from shared building blocks.
2. Do not define module-local custom filter/pagination/page-skeleton unless approved and promoted to shared first.
3. Shared components own spacing, typography, and visual rhythm.
4. Module code can configure shared components, not redesign them.

## Reuse-First Process
1. Check if shared component already exists.
2. If missing, add generic shared component under `src/components`.
3. Reuse shared component in feature screen.
4. Do not ship one-off duplicate implementation.

## Anti-Patterns (Disallowed)
- Duplicated filter bars in multiple modules.
- Duplicated pagination implementations in feature folders.
- Duplicated loading/empty/error layouts per screen.
- Copy-pasted form field structure/styling.

## Acceptance Check
A phase fails if:
- New screens bypass shared page/filter/pagination/skeleton/form wrappers.
- Repeated UI patterns are introduced in module folders instead of shared components.
