# Design System - shapework.

A premium, modern light-mode design system built for serious residential brokerage operations. It is designed to look calm, minimal, operational, and AI-native without generic SaaS card overload or glowing purple neon gradients.

---

## 1. Palette Tokens

The theme variables are configured in the Tailwind CSS theme definition under `/src/index.css`:

| Variable | HEX Color | Purpose |
| :--- | :--- | :--- |
| `--color-canvas` | `#F6F6F3` | The main warm white page canvas background |
| `--color-surface` | `#FFFFFF` | Core surfaces and dashboard widget panels |
| `--color-secondary-surface` | `#FAFAF8` | Secondary sub-panes, sidebars, and code blocks |
| `--color-text-primary` | `#141619` | Deep charcoal for readable primary typography |
| `--color-text-secondary` | `#5E6369` | Muted charcoal for descriptions and labels |
| `--color-text-tertiary` | `#8B9096` | Muted gray for timestamps and helper indicators |
| `--color-border-subtle` | `#E6E5E0` | Hairline border separations between panels |
| `--color-border-strong` | `#CCCAC4` | Highlighted borders on interactive focus states |
| `--color-brand-green` | `#245C73` | Teal/Evergreen brand primary accent |
| `--color-brand-green-hover` | `#1F5E6D` | Darker hover color accent |
| `--color-brand-green-soft` | `#EAECE9` | Muted background highlight for navigation active items |

### Semantic Status Colors
* **Healthy (Muted Evergreen)**: `#2D6A4F` (Soft bg: `#E8F5E9`)
* **Attention (Restrained Amber)**: `#D97706` (Soft bg: `#FEF3C7`)
* **Risk (Warm Red)**: `#DC2626` (Soft bg: `#FEE2E2`)

---

## 2. Typography

* **Sans-serif (UI/Metadata)**: `Inter`, `Geist`, or `Manrope`. Excellent readability at small metadata sizes.
* **Serif (Editorial Titles/Headings)**: `Playfair Display` or `Georgia`. Used sparingly on screen headers to establish a premium, calm, newspaper-style layout.
* **Monospace (Numerals & Financials)**: `JetBrains Mono`. Used exclusively for dollar figures, dates, and percentages to enable fast tabular scanning.

---

## 3. UI Guidelines & Component Guidelines

1. **Gradients**: Avoid purple neon AI gradients. If highlighting AI features, use hairline borders, soft cyan glows, or controlled brand teal highlights.
2. **Spacing**: Maintain generous `px-6 py-4` margins. Brokerage COOs handle significant stress; shapework must feel spacious and calm.
3. **Badges**: Standardize status labels using `<StatusBadge>` and risk indicators using `<RiskBadge>` to prevent inconsistent inline coloring.
4. **Actionability**: Every card or report view must suggest a clear next-action or provide a direct Approve/Dismiss button group.
