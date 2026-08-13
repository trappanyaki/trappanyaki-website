# Brand Guidelines v1.0 — Trappanyaki LLC

Source: extracted from the live site (`style.css` `:root`, `TRAPPANYAKI_ManyChat_ORDER_Flow.md`, `.claude/instagram-captions.md`). Every value below is what's actually shipping — this file documents the incumbent system, it doesn't invent one.

## Quick Reference
| Field | Value |
|---|---|
| Primary Color | #c1121f |
| Secondary Color | #d8b45a |
| Accent Color | #e8433a |
| Primary Font | Cinzel (display) / Archivo (body) |
| Voice | direct, street-fluent, confident — no adjective stacking, no salesy pitch |

## 1. Color Palette

### Primary
| Name | Hex | Usage |
|---|---|---|
| Red | `#c1121f` | Base accent |
| Red Hot | `#e8433a` | CTAs, primary buttons — lifted from `#e63329` to clear 4.5:1 body-text contrast (measures 4.79:1 on menu cards, 4.64:1 on specialty rows) |
| Red Deep | `#7a0b12` | Shadows, pressed states |

### Secondary
| Name | Hex | Usage |
|---|---|---|
| Gold | `#d8b45a` | Section labels, dividers, footer tagline |
| Gold Light | `#f2dfa6` | Gold hover/highlight state |

### Neutral (dark-mode ground)
| Name | Hex | Usage |
|---|---|---|
| Char 900 | `#08080a` | Page background |
| Char 850 | `#0b0b0d` | Section background |
| Char 800 | `#101014` | Card surfaces |
| Char 700 | `#16161b` | Elevated card surfaces |
| Char 600 | `#1e1e24` | Borders, dividers |
| Bone | `#f4f1ea` | Primary text on dark |
| Ash | `#9a978f` | Secondary/muted text |
| Ash Dim | `#88867f` | Tertiary/disabled text |

### Accessibility
- Red Hot on dark ground: 4.79:1 (menu cards), 4.64:1 (specialty rows) — both clear WCAG AA body-text floor (4.5:1)
- Every other accent is decorative/large-text only; verify contrast before using Red/Gold for body copy

## 2. Typography

### Font Stack
```css
--display: 'Cinzel', Georgia, serif;
--sans: 'Archivo', system-ui, -apple-system, sans-serif;
```
Both self-hosted (`cinzel.woff2`, `archivo.woff2`) — same-origin, no external font request.

### Type Scale (as tokenized in `:root`)
| Token | Size | Use |
|---|---|---|
| `--fs-micro` | .58rem | smallest meta text |
| `--fs-meta` | .62rem | tick labels |
| `--fs-label` | .68rem | form labels |
| `--fs-caption` | .74rem | captions |
| `--fs-body-sm` | .8rem | small body |
| `--fs-body` | .88rem | default body |
| `--fs-body-lg` | .95rem | lead body |
| `--fs-subtitle` | 1.05rem | subtitles |
| `--fs-title` | 1.18rem | card/section titles |
| `--display-lg-size` | 96px | hero display type |

Body line-height 1.68, letter-spacing .004em — deliberately looser than a light-on-white face would need, to compensate for near-black background.

## 3. Logo Usage

- **Primary mark:** crossed spatula + cleaver over "TRAPPANYAKI" wordmark (`logo.webp`, `logo.png`)
- **Icon-only:** `icon-192.png` / `icon-512.png` (PWA), `apple-touch-icon.png`, `favicon.ico`
- Used at 320×200 aspect in nav and footer — don't distort the ratio
- Don't recolor outside the red/gold/bone palette; don't add drop shadows or gradients not already baked into the asset

## 4. Voice & Tone

Two registers, evidenced across the site and Instagram — pick by channel, not by preference.

### Register A — "Spec Ledger" (site copy: menu, ledger, FAQ, builder)
Direct, plain-stated, proof over adjectives. Reads like a kitchen printout, not an ad. Real examples from the live site:
- *"Every tray that leaves the flat-top hits the same marks. No off-nights."*
- *"Rice, veg, protein, crossed drizzle. Every layer lands in order."*
- *"One glistening piece of seared chicken. That's the whole argument."*

### Register B — "DM Voice" (Instagram captions, ManyChat flow)
Street-fluent, high-energy, gratitude-first. Real examples:
- *"My thug comin thru for the bussdown! appreicate you everytime fuckin with it"*
- *"Aye you already know what it is 🔥"*
- Constant sign-off: **"Bless Ya Taste Buds."**

### Voice Chart
| Trait | We Are | We Are Not |
|---|---|---|
| Direct | Say it in four words | Curt or cold |
| Proof-driven | State the product plainly (USDA Prime, black tiger shrimp) with prices | Stuffy or fine-dining adjective-stacked |
| Street-fluent (DM only) | Native register, not costume | Performative or try-hard |
| Warm at the close | "Bless Ya Taste Buds." | Saccharine or corporate |

### Tone by Context
| Context | Register | Example |
|---|---|---|
| Site prose (menu/ledger/FAQ) | A | "Fried rice, mixed veggies & yumyum sauce" |
| Instagram captions | B | "Blessing the taste buds!" |
| ManyChat DM | B | "Say less. Here's the current menu:" |
| Corporate catering copy | Neither — zero slang | "We handle setup, cooking, and service. You handle headcount." (deliberate register shift, not an inconsistency) |

### Prohibited
- "Exclusive," "artisanal," "for those who command the best" — flagged and removed from the old site copy for reading as a different, stuffier brand than the one customers meet on Instagram
- Square references (payment processor retired — see project memory)

## 5. Imagery

- Real photography only — no stock, no illustration for food
- Warm, high-contrast, flat-top/flame lighting; steam and char are a feature, not a flaw to retouch out
- WebP delivered alongside JPG fallback for hero/menu/gallery images (`food2.webp`, `catering.webp`, etc.)
- Layered "ingredient" cutout PNGs/WebP (`layerrice.webp`, `layerchicken.webp`, `layersteak.webp`, `layersauce.webp`, `layerveg.webp`) power the scroll-scrubbed hero build sequence — keep new protein/sauce assets cut to the same style if extending it
