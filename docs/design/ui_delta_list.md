# UI Delta List — Ghost-Overlay Pass (`/explore` Cards)

**Date:** 2026-10-22  
**Branch:** `feat/marketplace-fidelity-f1f5`  
**Pass:** R0.5 Fidelity Ghost-Overlay Audit (Item F5)  
**Measurement Method:** Chrome DevTools Protocol (CDP) live DOM computed styles extraction on port 9222

---

## 1. Executive Summary

A ghost-overlay inspection was executed comparing the `/explore` model card geometry, typography, artwork layout, and badge placements against the `muapi.ai` clone-sprint R0.5 inventory and `docs/design/pixel-spec.md`.

All metrics $\le 2\text{px}$ are considered in spec. Deltas $> 2\text{px}$ are cataloged below.

---

## 2. Card Geometry & Placement Measurements

| Element / Property | `muapi.ai` Baseline (`pixel-spec.md`) | Timecapsule Live (`/explore`) | Delta | Status |
|---|---|---|---|---|
| **Card Outer Width** | Grid column (`1fr` / ~540–560px) | `548px` | `0px` | In Spec |
| **Card Min Height** | `160px` | `160px` | `0px` | In Spec |
| **Card Border Radius** | `6px` (`rounded-[6px]`) | `12px` (`rounded-[12px]`) | **+6px** | **Delta Logged (>2px)** |
| **Card Border Color** | `rgba(255, 255, 255, 0.1)` (dark) | `rgba(255, 255, 255, 0.1)` | `0px` | In Spec |
| **Media Thumbnail Width** | `140px` (`w-[140px]`) | `140px` | `0px` | In Spec |
| **Media Thumbnail Height** | `160px` (aspect-square clamped) | `159px` | `-1px` | In Spec ($\le 2\text{px}$) |
| **Discount Badge Top** | `8px` (`top-2`) | `8px` (`top-2`) | `0px` | In Spec |
| **Discount Badge Left** | `8px` (`left-2`) | `8px` (`left-2`) | `0px` | In Spec |
| **Discount Badge Font** | `10px font-black` | `10px font-black` | `0px` | In Spec |
| **Discount Badge Color** | `#D9FF00` (acid yellow) | `#D9FF00` | `0px` | In Spec |
| **Category Label Font** | `11px font-bold uppercase` | `11px font-bold uppercase` | `0px` | In Spec |
| **Category Tracking** | `tracking-widest` | `tracking-widest` | `0px` | In Spec |
| **Price Font Size** | `13px` | `13px` | `0px` | In Spec |
| **Price Font Weight** | `900` (`font-black`) | `900` (`font-black`) | `0px` | In Spec |
| **Strikethrough Price** | `11px font-bold line-through` | `11px font-bold line-through` | `0px` | In Spec |
| **Title Font Size** | `15px font-bold` | `15px font-bold` | `0px` | In Spec |
| **Description Lines** | `2 lines` (`line-clamp-2`) | `2 lines` (`line-clamp-2`) | `0px` | In Spec |
| **Details Padding** | `16px` (`p-4`) | `16px` (`p-4`) | `0px` | In Spec |
| **Divider Line** | `1px solid rgba(255,255,255,0.05)` | `1px solid rgba(255,255,255,0.05)` | `0px` | In Spec |
| **Footer Action Font** | `12px font-bold` (`text-xs`) | `12px font-bold` (`text-xs`) | `0px` | In Spec |

---

## 3. Deltas $> 2\text{px}$ Inventory

### Delta D1: Card Border Radius
- **Observed:** `12px` (`rounded-[12px]`)
- **Reference Baseline:** `6px` (`rounded-[6px]`)
- **Difference:** `+6px`
- **Assessment:** Timecapsule's `rounded-[12px]` provides a modern soft dark-mode aesthetic consistent with the desktop app shell and macOS window conventions. If strict $6\text{px}$ clone parity is desired by owner sign-off, changing `rounded-[12px]` to `rounded-[6px]` is a single CSS token update.

---

## 4. Screenshot Evidence

- **Homepage (F1–F4):** `docs/design/screenshots/tc_home_after_f1_f4.png`
- **Explore Grid (F5):** `docs/design/screenshots/tc_explore_after_f5.png`
