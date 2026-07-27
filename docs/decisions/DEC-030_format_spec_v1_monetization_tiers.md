# DEC-030 — Content Format Spec v1: Unit Gates, Contest No-Reentry, Tiered Pricing

**Status:** Approved for implementation  
**Date:** 2026-07-27  
**Supersedes (partial):** BR-002 monetization eligibility unit floors; flat ₹99-only reader pricing assumption  
**Source:** `Worklog/27_JUL_2026/Katha_Content_Format_and_Payout_Specification_v1.md`

## Decision

1. **Format word/chapter guidance** is codified in `packages/shared/content-types.ts` (Serialized, Collection, Short, Flash, Chat, Interactive, Interactive Flash).
2. **Contest eligibility:** continuous formats (Serialized, Chat, Interactive) require **≥25 published units**. Short/Flash/Interactive Flash/Collection pieces use **per-story no re-entry** (`stories.contest_won_at`) instead of a chapter floor. Interactive Flash also requires **2–3 branch points**.
3. **Monetization unit gate (in front of SPI):**  
   - Serialized / Chat / Interactive: **≥50 published units**  
   - Story Collection: **≥5 published stories**  
   - Short / Flash / Interactive Flash: **non-monetized** (platform retains 100% of any attributable revenue)
4. **Collection paywall:** Story 1 is **permanently free**; story 2+ paywalled once published. SPI is **collection-level**.
5. **Reader pricing:** Tiered non-coin subscription — Bronze ₹99 / Silver ₹149 / Gold ₹199 / Platform ₹249–299 — gated by **SPI band + cumulative words** (format midpoints convert chapters→words). Story Collection **cannot** enter Platform (Gold ceiling).
6. **Format access:** No format is gated behind contest wins or magazine features.

## Implementation map

| Concern | Module |
|--------|--------|
| Word/chapter specs | `packages/shared/content-types.ts` |
| Contest / monetize unit gates | `packages/shared/formatEligibility.ts` |
| Reader tiers + volume | `packages/shared/readerTiers.ts` |
| CMS checklist | `creator-cms/src/business/monetizationEligibility.ts` |
| Collection free unit 1 | `backend/src/services/freeChapterThreshold.js` |
| Price ladder (API) | `backend/src/config/revenue.js` |
| Schema | `supabase/migrations/046_format_spec_v1_gates_tiers.sql` |

## Non-goals (this DEC)

- Rewriting SPI formula (`spi.ts`)  
- Coin / per-chapter billing  
- Measuring real average chapter length (midpoints are assumptions until content exists)

## Catalog entries

- **BR-002a:** 50-unit monetization floor (Serialized, Chat, Interactive)  
- **BR-002b:** 5-story monetization floor (Story Collection)  
- **BR-009 adjacent:** Collection story-1 permanent free sample (does not change proven/unproven free-chapter system for serials)
