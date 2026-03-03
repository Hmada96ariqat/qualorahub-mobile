# Mobile Screen Map (Phase 13 Update)

## Public Routes
- `/(public)/auth/login`
  - Backing screen: `src/modules/auth/screens/LoginScreen.tsx`
  - API dependencies: `POST /auth/login`
  - State requirements: loading + error
- `/(public)/forgot-password`
  - Backing screen: `src/modules/auth/screens/ForgotPasswordScreen.tsx`
  - API dependencies: `POST /auth/forgot-password`
  - State requirements: loading + success + error
- `/(public)/reset-password`
  - Backing screen: `src/modules/auth/screens/ResetPasswordScreen.tsx`
  - API dependencies: `POST /auth/reset-password`
  - State requirements: loading + success + error

## Protected Routes
- `/(protected)/dashboard`
  - Backing screen: `src/modules/dashboard/screens/DashboardShell.tsx`
  - API dependencies: `GET /dashboard/snapshot`, `GET /auth/context`, `GET /auth/rbac`, `GET /subscriptions/me/entitlements`, `GET /subscriptions/me/menus`
  - State requirements: loading + empty + error + retry + permission-gate
- `/(protected)/fields`
  - Backing screen: `src/modules/fields/screens/FieldsScreen.tsx`
  - API dependencies: `GET /fields`, `GET /fields/inactive/with-lots`, `POST /fields`, `PATCH /fields/{fieldId}`, `PATCH /fields/{fieldId}/reactivate`
  - State requirements: loading + empty + error + retry + mutation feedback
- `/(protected)/lots`
  - Backing screen: `src/modules/lots/screens/LotsScreen.tsx`
  - API dependencies: `GET /lots`, `GET /lots/inactive/with-fields`, `POST /lots`, `PATCH /lots/{lotId}`, `PATCH /lots/{lotId}/reactivate`
  - State requirements: loading + empty + error + retry + mutation feedback
- `/(protected)/tasks`
  - Backing screen: `src/modules/tasks/screens/TasksScreen.tsx`
  - API dependencies: `GET /tasks`, `POST /tasks`, `PATCH /tasks/{taskId}`, `DELETE /tasks/{taskId}`, `GET /tasks/assets/options`, `GET /tasks/{taskId}/comments`, `GET /tasks/{taskId}/activity`
  - State requirements: loading + empty + error + retry + mutation feedback + permission-gate
- `/(protected)/equipment`
  - Backing screen: `src/modules/equipment/screens/EquipmentScreen.tsx`
  - API dependencies: `GET /dashboard/snapshot` (equipment list source), `GET /equipment/upcoming-maintenance`, `GET /equipment/references/operators/active`, `GET /equipment/{equipmentId}`, `POST /equipment`, `PATCH /equipment/{equipmentId}`, `DELETE /equipment/{equipmentId}`, `GET /equipment/{equipmentId}/usage-logs`, `POST /equipment/{equipmentId}/usage-logs`, `PATCH /equipment/usage-logs/{usageLogId}`, `DELETE /equipment/usage-logs/{usageLogId}`, `GET /equipment/{equipmentId}/maintenance-records/detailed`, `POST /equipment/{equipmentId}/maintenance-records`, `PATCH /equipment/maintenance-records/{recordId}`, `DELETE /equipment/maintenance-records/{recordId}`
  - State requirements: loading + empty + error + retry + mutation feedback + permission-gate
- `/(protected)/finance`
  - Backing screen: `src/modules/finance/screens/FinanceScreen.tsx`
  - API dependencies: `GET /dashboard/snapshot` (transaction list source), `POST /transactions`, `PATCH /transactions/{transactionId}`, `DELETE /transactions/{transactionId}`, `POST /transactions/{transactionId}/commands/reverse`, `GET /finance-groups`, `POST /finance-groups`, `PATCH /finance-groups/{financeGroupId}`, `DELETE /finance-groups/{financeGroupId}`
  - State requirements: loading + empty + error + retry + mutation feedback + permission-gate
- `/(protected)/livestock`
  - Backing screen: `src/modules/livestock/screens/LivestockScreen.tsx`
  - API dependencies: `GET/POST/PATCH/DELETE /animals...`, `GET/POST/PATCH/DELETE /animal-groups...`, `GET/POST/PATCH/DELETE /animal-health-checks...`, `GET/POST/PATCH/DELETE /animal-yield-records...`, `GET/POST/PATCH/DELETE /housing-units...`, `GET/POST/PATCH/DELETE /housing-unit-maintenance-records...`, `GET/POST/PATCH/DELETE /housing-unit-consumption-logs...`, `GET/POST/PATCH/DELETE /weather-alert-rules...`
  - State requirements: loading + empty + error + retry + mutation feedback + permission-gate
- `/(protected)/management`
  - Backing screen: `src/modules/management/screens/ManagementScreen.tsx`
  - API dependencies: `GET/PATCH /user-management/users...`, `GET/POST/PATCH/DELETE /user-management/roles...`, `GET/POST/DELETE /user-management/invites...`, `GET/POST/PATCH /contacts...`, `GET/POST/PATCH /integrations/storefront/settings...`, `GET/POST/PATCH/DELETE /notifications...`, `GET /subscriptions/me`, `GET /subscriptions/me/entitlements`, `GET /subscriptions/me/menus`
  - State requirements: loading + empty + error + retry + mutation feedback + subscription access-state UX + permission-gate

## Route Guard Rules
- Public layout redirects authenticated users to `/(protected)/dashboard`.
- Protected layout redirects unauthenticated users to `/(public)/auth/login`.
- Both layouts show a loading state while auth bootstrap is running.
- Module routes apply menu permission gating and show locked state when blocked; management route keeps visibility when role is eligible so subscription-locked tabs can show upgrade prompts.
