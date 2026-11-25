# TEXTiPRO Web v2.1 – Repository Quick Reference

## Tech Stack Overview
- **Frontend Framework**: React (TypeScript, Vite build tooling)
- **State Management**: Redux Toolkit slices under `src/state`
- **Styling**: Tailwind CSS (see `tailwind.config.js`), global themes in `src/styles`
- **Routing**: React Router with route configs in `src/routes`
- **API Layer**: `ApiService` abstraction in `src/services/ApiService.tsx`

## Redux Conventions
1. **Slice Location**: One slice per domain inside `src/state`. Naming follows `{domain}Slice.ts`.
2. **Async Logic**: Use `createAsyncThunk`. API endpoints live in `ApiService` and reuse `apiService.get/post/put/delete`.
3. **State Flags**: Most slices expose `loading`, `error`, and domain-specific collections/results.
4. **Toast Notifications**: Success/error messages handled in thunks using `react-toastify`.

## UI Patterns
1. **Forms**: Built with controlled components; validation logic typically lives in component state.
2. **Tables**: Implemented using reusable table components under `src/components`.
3. **Filters**: Dedicated filter components under `src/components/filters`; ensure new filters align with existing pattern.
4. **Modals & Drawers**: Shared UI elements under `src/components/ui`.

## Coding Standards
- **TypeScript First**: Provide interfaces/types for API payloads and component state.
- **Formatting**: Prettier-compatible spacing, 4-space indentation where applicable (follow existing file style).
- **Error Handling**: Surface API errors via toasts, log details to console only when debugging.
- **Naming**: PascalCase for components, camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants.

## Testing & Verification
- **Manual QA**: Focus on validating forms, table interactions, and Redux state updates.
- **Pending**: Automated tests are minimal; if adding significant logic, consider unit tests under `src/__tests__` (create directory if missing).

## Deployment Notes
- Build with `npm run build`; output in `/dist`.
- Core configuration files: `vite.config.ts`, `tsconfig*.json`, and `tailwind.config.js`.

## Common Pitfalls
- **API Contract Drift**: Verify backend response shapes before relying on nested properties.
- **State Reset**: Ensure slices reset relevant state after successful mutations to avoid stale UI.
- **Date Handling**: Use utilities in `src/utils/dateUtils.ts` for consistent formatting.

Keep this reference up to date when major architectural or process changes occur.