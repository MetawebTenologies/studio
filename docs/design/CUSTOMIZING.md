# Timecapsule UI Customization Guide

## 1. Architectural Philosophy: The Single-File Token Layer

Timecapsule decouples the structural layout and UX components from the visual theme layer.

Every visual dimension (background colors, card surfaces, borders, primary accents, discount pills, price tags, and border radii) is bound to CSS custom properties defined in two files:

1. `app/themes/theme.muapi.css` (Base Reference Theme):
   Establishes faithful tokens matching the high-fidelity SaaS reference build (`#f8fafc` canvas, `#ffffff` cards, `rgba(226, 232, 240, 0.85)` borders, `#0f172a` primary typography, `#3b82f6` brand accents, `#D9FF00` electric lime discount tags, and `6px` card radii).

2. `app/themes/theme.timecapsule.css` (Operator Override Layer):
   Loaded immediately *after* the base theme in `app/globals.css`. By default, this file is empty. Any variable declared here overrides the reference token globally across every screen without touching a single line of JSX or component styling.

```css
/* app/globals.css */
@import "./themes/theme.muapi.css";
@import "./themes/theme.timecapsule.css";
```

---

## 2. Available Customization Tokens

| Variable | Reference Value | Purpose |
|---|---|---|
| `--tc-bg-page` | `#f8fafc` | Page-wide background |
| `--tc-bg-card` | `#ffffff` | Model cards, dashboard widgets, and modals |
| `--tc-bg-glass` | `rgba(255, 255, 255, 0.85)` | Sticky header backdrop blur surface |
| `--tc-border-divider` | `rgba(226, 232, 240, 0.85)` | Card boundaries, dividers, and nav lines |
| `--tc-text-primary` | `#0f172a` | Primary headlines, model titles, metrics |
| `--tc-text-secondary` | `#475569` | Descriptions, metadata, secondary copy |
| `--tc-text-muted` | `#94a3b8` | Placeholders, inactive breadcrumbs |
| `--tc-color-primary` | `#3b82f6` | Brand accent, active tab bars, primary CTAs |
| `--tc-color-primary-hover`| `#2563eb` | Hover state for primary CTAs |
| `--tc-color-accent-discount`| `#D9FF00` | Discount pill badge background |
| `--tc-color-price-green`| `#22c55e` | Executable model rate highlight |
| `--tc-radius-card` | `6px` | Border radius for cards and containers |
| `--tc-radius-pill` | `4px` | Border radius for category chips and buttons |

---

## 3. Customization Examples

### A. Switching to Brand Cyan (`#00e5ff`)
To change the primary accent to Timecapsule's signature cinema cyan, add to `app/themes/theme.timecapsule.css`:

```css
:root {
  --tc-color-primary: #00e5ff;
  --tc-color-primary-hover: #00b4d8;
  --tc-color-accent-discount: #00e5ff;
}
```

### B. Switching to Modern Dark Mode
To convert the platform to dark slate:

```css
:root {
  --tc-bg-page: #09090b;
  --tc-bg-card: #121217;
  --tc-bg-glass: rgba(18, 18, 23, 0.85);
  --tc-border-divider: rgba(39, 39, 42, 0.8);
  --tc-text-primary: #f8fafc;
  --tc-text-secondary: #94a3b8;
  --tc-text-muted: #52525b;
}
```

### C. Rounded Modern Pill Style
To increase border radii to modern pill aesthetic:

```css
:root {
  --tc-radius-card: 16px;
  --tc-radius-pill: 9999px;
}
```

---

## 4. Verification Check
After making changes to `app/themes/theme.timecapsule.css`, rebuild and run tests:

```bash
npm test
npm run build
```

All 25 automated regression tests will remain green because layout structures, contracts, and invariants are preserved.
