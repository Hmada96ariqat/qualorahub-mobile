# Phase 3 Shared UI Kit (Current State)

## Purpose
Provide reusable, consistent UI building blocks for module screens and enforce reuse-first patterns.

## Delivered Shared Components

### Layout
- `AppScreen` (`src/components/layout/AppScreen.tsx`)
- `AppHeader` (`src/components/layout/AppHeader.tsx`)
- `AppSection` (`src/components/layout/AppSection.tsx`)
- `SectionCard` (`src/components/layout/SectionCard.tsx`)
- `AppTabs` (`src/components/layout/AppTabs.tsx`)

### Primitives
- `AppButton` (`src/components/primitives/AppButton.tsx`)
- `AppIconButton` (`src/components/primitives/AppIconButton.tsx`)
- `AppInput` (`src/components/primitives/AppInput.tsx`)
- `AppPasswordInput` (`src/components/primitives/AppPasswordInput.tsx`)
- `AppSearchInput` (`src/components/primitives/AppSearchInput.tsx`)
- `AppCard` (`src/components/primitives/AppCard.tsx`)
- `AppBadge` (`src/components/primitives/AppBadge.tsx`)
- `AppChip` (`src/components/primitives/AppChip.tsx`)
- `AppAvatar` (`src/components/primitives/AppAvatar.tsx`)

### Feedback
- `EmptyState` (`src/components/feedback/EmptyState.tsx`)
- `ErrorState` (`src/components/feedback/ErrorState.tsx`)
- `Skeleton` (`src/components/feedback/Skeleton.tsx`)
- `LoadingOverlay` (`src/components/feedback/LoadingOverlay.tsx`)
- `NetworkStatusBanner` (`src/components/feedback/NetworkStatusBanner.tsx`)
- `ToastProvider` + Snackbar transport (`src/components/feedback/ToastProvider.tsx`)

### Form
- `FormField` (`src/components/form/FormField.tsx`)
- `AppSelect` (`src/components/form/AppSelect.tsx`)
- `AppDatePicker` (`src/components/form/AppDatePicker.tsx`)
- `AppTextArea` (`src/components/form/AppTextArea.tsx`)

### Lists
- `PullToRefreshContainer` (`src/components/lists/PullToRefreshContainer.tsx`)
- `PaginationFooter` (`src/components/lists/PaginationFooter.tsx`)
- `FilterBar` (`src/components/lists/FilterBar.tsx`)
- `AppListItem` (`src/components/lists/AppListItem.tsx`)

### Guards
- `PermissionGate` (`src/components/guards/PermissionGate.tsx`)

### Overlays
- `ConfirmDialog` (`src/components/overlays/ConfirmDialog.tsx`)
- `ActionSheet` (`src/components/overlays/ActionSheet.tsx`)
- `BottomSheet` (`src/components/overlays/BottomSheet.tsx`)

## Theme & UX Baseline
- Tokens: `src/theme/tokens.ts`
- Paper theme: `src/theme/paperTheme.ts`
- Hook: `src/hooks/useAppTheme.ts`
- Root provider applies `appTheme` and global `ToastProvider` in `app/_layout.tsx`.

## Light SaaS Design Direction (Enterprise Dense)
- Shared palette baseline is now aligned to enterprise light mode:
  - background `#F9FBFA`
  - foreground `#17261F`
  - primary `#248F36` (+ light/dark variants)
  - secondary `#E2DACF`
  - accent `#F0C442`
  - success `#2EB845`
  - warning `#FFC61A`
  - destructive `#EF4343`
  - muted/border `#EDF2F0` / `#DCE5E0`
- Component-level adoption was applied via shared kit (not module-local styling):
  - Buttons, inputs/search/password/textarea
  - Cards/sections/list items
  - Tabs/chips/badges/avatars
  - Dialog/action sheet/bottom sheet
  - Skeleton/loading/banner/toast states
- Fields/Lots were the initial pilot; the same direction is now applied on Auth, Dashboard, and Tasks surfaces.
- Follow-up decision:
  - detached summary strip chips are not part of the default pattern and were removed from Fields/Lots.

## Reuse Enforcement
- ESLint blocks `TextInput`/`Button` imports from `react-native` and `react-native-paper` in `src/modules/**/screens/**`.
- Shared components are exported from `src/components/index.ts` and consumed by active auth/dashboard surfaces.
- `src/modules/dashboard/screens/DashboardShell.tsx` now uses shared `AppTabs`, `AppListItem`, `AppChip`, `AppAvatar`, and `AppBadge` instead of ad-hoc text blocks.

## Accessibility Baseline Evidence
- Touch targets: `AppButton`, `AppIconButton`, `AppChip`, `NetworkStatusBanner` and tab buttons keep >= 44px minimum height.
- Labeling: shared controls expose accessibility labels (`AppInput`, `AppPasswordInput`, `AppTextArea`, `AppAvatar`, `NetworkStatusBanner`).
- State handling: active screens keep loading/empty/error overlays via `Skeleton`, `LoadingOverlay`, `EmptyState`, and `ErrorState`.

## Remaining Phase 3 Signoff Items
- Manual iOS and Android accessibility smoke checks for tabs/dialogs/sheets.
- Manual confirmation that no regressions were introduced in auth/dashboard navigation flows after UI kit migration.
