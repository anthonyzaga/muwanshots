# Admin UI Audit — Muwan Shots Photography

**Date:** 2026-09-09
**Auditor:** Phase 3.4 — before UI changes
**Scope:** `src/pages/admin/*`, `src/components/admin/*`, `src/layouts`, `src/components/ui`, `src/pages/admin/AdminLayout`, `Dashboard`, `Photos`, `Categories`, `Albums`, `Settings`, `AdminLogin`, `ProtectedRoute`

## 1. Layout & Navigation

### Sidebar (Desktop, `lg:flex`, `w-[260px]`)
- **Strengths:** Fixed width, clear `NavLink` active state (`bg-[var(--text-primary)]`), readable labels, consistent `gap-3`/`py-2.5`, `border-r`.
- **Issues:**
  - No collapse on 1024px (tablet) — sidebar hidden only below `lg` (1024px), so 768-1023px shows mobile pills but no sidebar, wastes horizontal space. Should be `md` or `xl` breakpoint or collapsible.
  - No keyboard focus trap for sidebar (desktop not needed, but mobile drawer missing).
  - `Admin` footer with `admin?.name` may overflow long email (has `truncate`, good, but `px-3 py-2` tight).

### Mobile Header + Pills
- **Current:** `lg:hidden` top bar `sticky top-0` with `Logout`, plus `lg:hidden` pills `overflow-x-auto no-scrollbar` with `shrink-0` `rounded-full`.
- **Strengths:** Pills are touch-friendly (`px-4 py-2`), `no-scrollbar` hides ugly scrollbar, `shrink-0` prevents wrap.
- **Issues:**
  - No drawer/backdrop — pills are always visible, but spec expects collapsible drawer with `overlay/backdrop`, `close button`, `keyboard` handling. Current pills are not a drawer, so they don't match spec's "collapsible drawer" requirement.
  - No `aria-label` on nav pills container, no `role="navigation"` for mobile.
  - `Logout` in header is small `rounded-full px-4 py-1.5` — okay but `hover` not obvious.
  - Header `Camera` icon + `Muwan Shots Admin` may truncate at 320px (needs `min-w-0` + `truncate`).

## 2. Dashboard (`Dashboard.jsx`)

- **Cards:** `grid grid-cols-2 lg:grid-cols-3 gap-4` — on 320px, 2 columns with `p-5` may be cramped, but still readable. `gap-4` is okay, but `lg:grid-cols-3` on 1024px leaves 1 card on second row (6 cards → 2+2+2 on mobile, 3+3 on desktop). Could be `md:grid-cols-3`.
- **Loading:** `h-40 shimmer` — okay, but no skeleton for cards (layout shift).
- **Recent photos:** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3` — on 320px, 2 columns with `aspect-[4/3]` is okay, but `p-2 text-xs truncate` may overflow long titles.
- **Issues:** No empty state for stats when D1 empty (shows 0, okay), but no `processing/pending` metric as spec suggests. Quick actions are 3 pills, okay.

## 3. Photos (`Photos.jsx`, 360 lines)

- **Header:** `flex flex-col sm:flex-row` with `Upload` button `rounded-full px-6 py-2.5` — on 320px, button full-width (`sm:flex-row` stacks), okay, but `Upload` label may wrap.
- **Filters:** `rounded-2xl p-4 space-y-3` with `form flex-col sm:flex-row` — search `pl-9` with `Search` absolute, `Filter` selects `rounded-full px-4 py-1.5 text-xs` — on 320px, selects wrap and may cause horizontal overflow if many categories (6 categories → 6 options, okay). `Clear` button appears conditionally, good.
- **Bulk actions:** `flex flex-wrap gap-2` with `rounded-xl bg-[var(--accent)]/10` — on 320px, wraps, okay, but buttons `bg-white` may not have enough contrast in light mode (white on white). Should use `bg-[var(--surface)]`.
- **Grid:** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` — on 320px, 2 columns with `aspect-[4/3]` is okay, but `p-3` with `text-xs truncate` may overflow, `w-5 h-5` checkbox may be too small for touch (should be 44px min, currently 20px). `Star`/`Eye` buttons `w-8 h-8` are okay (32px, still <44px but close).
- **Card:** `rounded-2xl border overflow-hidden` — good, but `group` hover `scale` not disabled on touch, okay. `absolute top-2 left-2` checkboxes may overlap image.
- **Pagination:** `w-9 h-9 rounded-full` — 36px, slightly below 44px, but usable. `Page X of Y` text `text-sm px-3` may wrap on 320px.
- **Modals (Edit/Preview):** `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4` with `max-w-lg`/`max-w-2xl` and `max-h-[90vh] overflow-y-auto` — good, but `p-4` on 320px leaves 16px margin, okay. Inputs `rounded-xl px-4 py-2.5` — on 320px, may be 44px height, good. `grid grid-cols-2 gap-4` for sort order — on 320px, 2 columns may be cramped, should be `sm:grid-cols-2`.
- **Accessibility:** Buttons have `aria-label` for toggle publish (via `title`), but `input type="checkbox"` has no `aria-label` (should have). `X` close buttons have `aria-label` via icon? No, they rely on `X` icon only, need `aria-label="Close"`.

## 4. Categories (`Categories.jsx`)

- **List:** `flex items-center gap-4 rounded-2xl p-4` with `flex-col` for arrow buttons (`w-8 h-8` up/down) — on 320px, `gap-4` may be tight, `w-16 h-16` cover image `rounded-xl` okay.
- **Actions:** `w-8 h-8` for publish/edit/delete — 32px, below 44px, but usable. `Eye/EyeOff` toggle same as Photos.
- **Reorder:** `ArrowUp/Down` with `disabled:opacity-30` — works, but drag-and-drop would be more intuitive (not required, up/down is acceptable, but spec says drag-and-drop or intuitive).
- **Form modal:** Similar to Photos, `w-full max-w-lg` with `grid` for inputs — on 320px, `grid` may need `sm:`.
- **Delete safety:** Uses `prompt` for reassign → not ideal UX, should be select dropdown. Works but poor mobile (prompt on mobile is okay but not polished).

## 5. Albums (`Albums.jsx`)

- **Similar to Categories:** `grid gap-4` with `flex items-center gap-4` — same 32px button issue.
- **Manage Photos modal:** `w-full max-w-4xl max-h-[90vh]` with `grid grid-cols-2 sm:grid-cols-3` for photos — on 320px, 2 columns okay, but `max-h-[90vh]` with `overflow-y-auto` is good, but inner `max-h-64 overflow-y-auto` for add-photos grid may be small on mobile.
- **Add Photos:** `grid-cols-2 sm:grid-cols-3` with search `pl-8` — okay, but `+ Add Photos` button `rounded-full px-6 py-2.5` may wrap.

## 6. Settings (`Settings.jsx`)

- **Groups:** `rounded-2xl border p-6` with `space-y-4` — on 320px, `p-6` may be 24px, okay, but `grid` not used, so single column, good.
- **Inputs:** `w-full rounded-xl px-4 py-2.5` — 44px height, good, labels `block text-sm font-medium` clear.
- **Hero/OG image picker:** `flex gap-2` with `input` + `button` `shrink-0` — on 320px, `flex` may overflow, should be `flex-col sm:flex-row`.
- **Image preview:** `w-full max-h-48 object-cover rounded-xl` — okay.
- **Sticky save bar:** `sticky bottom-4 flex items-center justify-between rounded-2xl border backdrop-blur px-6 py-4 shadow-lg` — on 320px, `flex` may wrap, `px-6` may be too wide, should be `px-4 sm:px-6`.
- **Toast:** `role="alert"` and `role="status"` present, good.

## 7. Login (`AdminLogin.jsx`)

- **Form:** `w-full max-w-md` centered `min-h-screen flex items-center` — good, `rounded-[1.5rem] p-7 sm:p-8` — on 320px, `max-w-md` with `px-4` leaves 16px margin, good.
- **Inputs:** `rounded-xl px-4 py-3` — 44px, good.
- **Button:** `h-11 rounded-full` — 44px, good.

## 8. General Responsive & Accessibility

- **Breakpoints:** Uses `sm` (640), `lg` (1024) but not `xs` (320) or `md` (768) consistently. 320px tested manually: no horizontal overflow due to `overflow-x-auto no-scrollbar` on pills, but tables (if any) would overflow (Photos uses grid, not table, so okay).
- **Typography:** `font-serif text-2xl` for `h1` may be large on 320px (`24px`), but okay. `text-xs` for labels may be small but readable.
- **Buttons:** Most `h-11`/`py-2.5` are 44px, good, but some `w-8 h-8` (32px) are below WCAG 44px, should be `w-10 h-10` or `w-11 h-11`.
- **Focus:** `focus:outline-none focus:ring-2 focus:ring-[var(--accent)]` present on inputs, but not on all buttons (some have `focus-visible:ring`, good, but not consistent).
- **Modals:** `fixed inset-0 z-50 bg-black/50` with `onClick` backdrop close, `onClick={e=>e.stopPropagation()}` — good, but no `role="dialog"` or `aria-modal` on all (Photos has, Categories has, Albums has, Settings picker has, but not consistently).
- **Overflow:** `min-w-0` on flex children is used in some places (`flex-1 min-w-0` in AdminLayout), but not everywhere (e.g., `Photos` card `flex-1 min-w-0` missing, may cause overflow).

## 9. Summary

**Current admin is functional but needs polish for 320-414px and 768-1440px:**
- Improve touch targets (32→44px)
- Add proper collapsible drawer for tablet (768-1024) instead of just pills
- Add `AdminHeader` with breadcrumb, account menu, logout, responsive trigger
- Improve `Dashboard` skeletons and `processing/pending` metric
- Refine `Photos` grid to use `srcset` correctly (already via `LazyImage`, but ensure `actual width/height` not hardcoded `1600x1067`)
- Make `Upload` UI show 6 states (selecting, uploading, completed, pending, ready, failed) more clearly
- Ensure forms have `aria-label`, `required`, `disabled` states, `focus` rings
- Add `aria-label` to icon-only buttons
- Ensure no horizontal overflow at 320px (test with `overflow-x-hidden` on `body`)
