# Timecapsule Pixel Specification & Design Tokens

Derived from computed styles and layout telemetry extracted directly from `muapi.ai`.

## 1. Global Token Sheet

| Token Name | Reference Value | Tailwind Equivalent | Role |
|---|---|---|---|
| `--tc-bg-page` | `#f8fafc` (`rgb(248, 250, 252)`) | `bg-slate-50` | Primary page background |
| `--tc-bg-card` | `#ffffff` (`rgb(255, 255, 255)`) | `bg-white` | Card container background |
| `--tc-border-divider` | `rgba(226, 232, 240, 0.8)` | `border-slate-200/80` | Card borders, navbar dividers, list dividers |
| `--tc-text-primary` | `#0f172a` (`rgb(15, 23, 42)`) | `text-slate-900` | Headings, model titles, primary copy |
| `--tc-text-secondary` | `#475569` (`rgb(71, 85, 105)`) | `text-slate-600` | Descriptions, metadata labels, subtexts |
| `--tc-text-muted` | `#94a3b8` (`rgb(148, 163, 184)`) | `text-slate-400` | Placeholders, inactive indicators |
| `--tc-accent-primary` | `#3b82f6` (`rgb(59, 130, 246)`) | `text-blue-500` / `bg-blue-500` | Primary brand accent, active tabs, buttons |
| `--tc-accent-discount` | `#D9FF00` (`rgb(217, 255, 0)`) | `bg-[#D9FF00] text-black` | Discount pill badge |
| `--tc-accent-price` | `#22c55e` (`rgb(34, 197, 94)`) | `text-emerald-500` | Executable model price |
| `--tc-glass-bg` | `rgba(255, 255, 255, 0.85)` | `backdrop-blur-md bg-white/85` | Glass header background |
| `--tc-radius-card` | `6px` | `rounded-[6px]` | Model cards, preview containers |
| `--tc-radius-pill` | `4px` | `rounded-[4px]` | Filter chips, buttons, badges |

---

## 2. Component Layout & Spacing Spec

### A. Navigation Chrome
- **Header Top Row**: `h-[64px]` to `h-[72px]`, container `max-w-[1400px]`, flex items centered, gap `32px`.
  - Brand Logo + Wordmark on left (`w-36`).
  - Nav links: `text-[13px] font-semibold text-slate-600 hover:text-slate-900`, active indicator: `absolute -bottom-[20px] left-0 right-0 h-0.5 bg-blue-500`.
  - Right cluster: Circular search icon button (`w-9 h-9 border border-slate-200 rounded-full`), blue `Sign In` pill (`bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-full`), user workspace avatar.
- **Secondary Sub-Nav**: `h-[44px]`, border-top and border-bottom `1px solid rgba(226, 232, 240, 0.6)`, `max-w-[1400px]`, gap `24px` horizontal scroll with `.no-scrollbar`.
  - Links: `text-[12px] font-semibold text-slate-600 hover:text-slate-900`, active indicator: `absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 rounded-t-full`.
  - Badges: `Apps $` (green text `text-emerald-500 text-[10px] font-bold`), `Studio HOT` (yellow flame pill `bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-sm`).

### B. Billboard Announcement Banner
- Outer container: `w-full min-h-[220px] rounded-lg overflow-hidden relative border border-slate-200/80 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between`.
- Top tag: `px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/40`.
- Headline: `text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight max-w-2xl`.
- Paragraph: `text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed mt-2`.
- Action buttons:
  - Primary button: `px-4 py-2.5 bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all rounded-sm`.
  - Secondary button: `px-4 py-2.5 bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all rounded-sm border border-white/20`.

### C. Search & Filter Bar
- Input field: `w-full h-[48px] rounded-[4px] border border-slate-200 bg-white px-4 pl-12 text-[14px] text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none`.
- Filter chips: Flex wrap or horizontal scroll, `gap-2`, pills: `h-8 px-3 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-400 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors`.

### D. 2-Column Model Grid & Cards
- Container: `grid grid-cols-1 xl:grid-cols-2 gap-6`.
- Card container: `flex bg-white border border-slate-200 rounded-[6px] overflow-hidden group hover:border-blue-500/60 hover:shadow-md transition-all duration-300 min-h-[160px]`.
- Media Thumbnail: `w-32 sm:w-36 aspect-square shrink-0 overflow-hidden relative bg-slate-100 flex items-center justify-center`.
  - Discount tag: `absolute top-2 left-2 bg-[#D9FF00] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs`.
- Content Area: `flex-1 p-4 flex flex-col justify-between min-w-0`.
  - Top meta: category label `text-[11px] font-bold text-blue-600 uppercase tracking-widest truncate` vs price `text-[13px] font-black text-emerald-600` (with strikethrough original `text-[11px] text-slate-400 line-through mr-1.5`).
  - Model Name: `text-[15px] font-bold text-slate-950 leading-tight group-hover:text-blue-600 transition-colors break-words`.
  - Description: `text-[12px] text-slate-600 line-clamp-3 leading-relaxed font-medium`.
  - Bottom row: provider credit `Provider: timecapsule` vs `Try Model →` action.

### E. Sidebar Facets
- Width: `w-[240px] shrink-0`.
- Items: `py-1.5 flex items-center justify-between text-[13px] font-medium text-slate-700 hover:text-slate-900 cursor-pointer`.
- Count badges: `text-[11px] font-mono text-slate-400`.

### F. SaaS Multi-Column Footer
- Background: `#f8fafc`, top border `1px solid rgba(226, 232, 240, 0.8)`.
- Columns: 7 columns (Brand + Description + Copyright, Product, Resources, Models, Tools, Model Pages, Company).
- Links: `text-[12px] text-slate-500 hover:text-slate-900 transition-colors`.
