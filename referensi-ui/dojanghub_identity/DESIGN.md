---
name: DojangHub Identity
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#44474e'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777f'
  outline-variant: '#c5c6cf'
  surface-tint: '#4e5e82'
  primary: '#031636'
  on-primary: '#ffffff'
  primary-container: '#1a2b4c'
  on-primary-container: '#8293ba'
  inverse-primary: '#b6c6f0'
  secondary: '#b6171e'
  on-secondary: '#ffffff'
  secondary-container: '#da3433'
  on-secondary-container: '#fffbff'
  tertiary: '#141819'
  on-tertiary: '#ffffff'
  tertiary-container: '#292c2e'
  on-tertiary-container: '#909395'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b6c6f0'
  on-primary-fixed: '#071b3b'
  on-primary-fixed-variant: '#364669'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#930010'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
  deep-navy: '#1A2B4C'
  martial-red: '#D32F2F'
  slate-50: '#F8FAFC'
  slate-200: '#E2E8F0'
  slate-400: '#94A3B8'
  slate-800: '#1E293B'
  success-green: '#10B981'
  belt-yellow: '#FACC15'
  belt-blue: '#2563EB'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is built on the duality of **Authentic Discipline** and **Modern Efficiency**. It honors the Korean heritage of Taekwondo—precision, respect, and controlled energy—while delivering a high-performance SaaS experience for dojang owners and instructors.

The chosen aesthetic is **Corporate / Modern** with **High-Contrast** accents. It utilizes a structured 8px grid to evoke a sense of order and reliability, essential for a management platform. The interface balances high-energy "Martial Red" highlights against an authoritative "Deep Navy" foundation to inspire confidence in both administrative tasks and public-facing marketing.

### Visual Principles
- **Structured Reliability:** Heavy use of vertical and horizontal alignment to reflect the discipline of the martial arts.
- **Dynamic Energy:** Strategic use of red and high-impact photography to convey movement and progress.
- **Operational Clarity:** Data-heavy dashboards utilize generous whitespace and clear typographic hierarchies to reduce cognitive load for instructors.

## Colors

The palette is anchored by **Deep Navy (#1A2B4C)**, representing the authority of the master and the stability of the institution. **Martial Red (#D32F2F)** is used sparingly for primary actions, critical alerts, and brand accents to maintain high energy without causing fatigue.

### Usage Guidelines
- **Primary (Deep Navy):** Use for navigation sidebars, headers, and primary headings in the dashboard.
- **Secondary (Martial Red):** Reserved for "Call to Action" buttons, recording attendance, or highlighting achievements.
- **Neutral (Slate Grays):** Used for borders, secondary text, and UI iconography to keep the interface clean and professional.
- **Backgrounds:** Use `slate-50` for dashboard canvases to differentiate from pure white cards and containers.

## Typography

The system uses **Montserrat** for headings to project a bold, confident, and modern image. **Inter** is utilized for all body copy and UI labels to ensure maximum legibility in data-dense management views.

### Typographic Rules
- **Headings:** Use Montserrat Bold (700) for all display and headline levels. Always use Deep Navy for text color to maintain authority.
- **Body:** Use Inter for all reading text. Keep line heights generous (1.5x) to ensure the interface feels breathable.
- **Labels:** Use uppercase with slight letter spacing for `label-md` to differentiate from body text in table headers and category tags.

## Layout & Spacing

This design system follows a strict **8px linear scale** to ensure consistent rhythm across all components. 

### Layout Model
- **Public Landing Page:** Uses a **Fixed Grid** (max-width 1280px) with centered content. Sections are separated by large `xl` (80px) vertical padding to create an editorial, premium feel.
- **Dashboard:** Uses a **Fluid Grid** with a fixed-width left navigation sidebar (256px). Content expands to fill the screen, using a 12-column system for data cards.
- **Margins & Gutters:** 24px margins on mobile, scaling to 48px on desktop for internal views.

### Breakpoints
- **Mobile:** < 640px (Single column, stacked elements).
- **Tablet:** 640px - 1024px (Reduced margins, 2-column card layouts).
- **Desktop:** > 1024px (Full dashboard layout).

## Elevation & Depth

To maintain a "reliable and organized" feel, the system uses **Low-contrast outlines** combined with **Ambient shadows**. This creates a professional, flat-yet-layered appearance.

- **Level 0 (Base):** `slate-50` background for the dashboard.
- **Level 1 (Cards):** White background with a 1px `slate-200` border and a very subtle shadow (0px 2px 4px rgba(0,0,0,0.05)).
- **Level 2 (Dropdowns/Modals):** White background with a more pronounced, diffused shadow (0px 10px 15px rgba(0,0,0,0.1)) to indicate focus.
- **Active States:** Subtle inset shadows are used for "pressed" states on primary buttons to give a tactile feel.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a clean, modern look that is more approachable than sharp corners but more disciplined and professional than fully rounded UI.

- **Buttons & Inputs:** `rounded` (4px).
- **Cards & Modals:** `rounded-lg` (8px).
- **Badges/Chips:** `rounded-xl` (12px) for a slightly softer "pill" look for status indicators (e.g., Belt levels).

## Components

### Buttons
- **Primary:** Deep Navy background, White text, Montserrat Bold. Used for main navigation or "Save" actions.
- **Action/Energy:** Martial Red background. Used for "Start Training Session," "Register Student," or "Upgrade Now."
- **Ghost:** `slate-200` border, `slate-800` text. Used for secondary actions.

### Inputs & Forms
- Inputs feature a 1px `slate-200` border that transitions to `deep-navy` on focus. 
- Labels are always positioned above the field using `label-sm` in `slate-400`.

### Cards
- Standard containers for dashboard data. They must include a `headline-sm` title and use `md` (24px) padding.

### Status Chips (Belt Progression)
- Use high-contrast backgrounds corresponding to the Taekwondo belt colors (White, Yellow, Green, Blue, Red, Black). Text color must be adjusted for accessibility (e.g., Black text on Yellow, White text on Blue).

### Attendance QR
- A dedicated component for the digital member card. It should be presented in a Level 2 elevated card with the student's photo and current belt color as a top-border accent.