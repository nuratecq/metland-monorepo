---
name: Metland Kinetic System
colors:
  surface: '#f6faf9'
  surface-dim: '#d6dbda'
  surface-bright: '#f6faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f4'
  surface-container: '#eaefee'
  surface-container-high: '#e4e9e8'
  surface-container-highest: '#dfe3e3'
  on-surface: '#171d1c'
  on-surface-variant: '#3d4949'
  inverse-surface: '#2c3131'
  inverse-on-surface: '#edf2f1'
  outline: '#6d7979'
  outline-variant: '#bcc9c8'
  surface-tint: '#006a6a'
  primary: '#006767'
  on-primary: '#ffffff'
  primary-container: '#008282'
  on-primary-container: '#f3fffe'
  inverse-primary: '#6fd7d6'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#8f4922'
  on-tertiary: '#ffffff'
  tertiary-container: '#ad6038'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8cf3f3'
  primary-fixed-dim: '#6fd7d6'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#341000'
  on-tertiary-fixed-variant: '#74340f'
  background: '#f6faf9'
  on-background: '#171d1c'
  surface-variant: '#dfe3e3'
  status-green: '#10B981'
  status-yellow: '#F59E0B'
  status-red: '#EF4444'
  status-blue: '#3B82F6'
  data-mono: '#64748B'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter-dense: 12px
  gutter-discovery: 24px
  margin-page: 32px
  margin-mobile: 16px
---

## Brand & Style

The design system is built on a foundation of **Professionalism, Precision, and Intelligence**. It serves as a bridge between high-stakes operational management and cutting-edge AI discovery. The visual language is **Corporate Modern**, prioritizing high-density information display and systematic clarity.

The personality is authoritative yet helpful—minimizing cognitive load for project managers while providing an expansive, exploratory environment for procurement teams. The aesthetic leverages a clean, utility-first approach with a focus on structured data, clear semantic signaling, and a sophisticated use of the brand’s signature teal.

Key style principles include:
- **Operational Efficiency:** Every pixel serves a functional purpose; whitespace is used intentionally to group related data rather than as mere decoration.
- **Data Fidelity:** High-contrast text and robust status indicators ensure critical metrics are legible at a glance.
- **Smart Assistance:** The AI Catalogue uses softer depth cues to signify intelligence and non-linear search experiences.

## Colors

The color palette is anchored by the **Metland Teal**, used strategically for primary actions and brand recognition. A deep slate is utilized for secondary elements to provide high-contrast grounding for the "operational" side of the ecosystem.

The system relies heavily on a **Semantic Status Palette**:
- **Teal (Primary):** Key navigation, primary CTA buttons, and active identity states.
- **Success (Green):** Indicates "On Track" health, "Resolved" tasks, and "Approved" workflows.
- **Warning (Yellow):** Used for "At Risk" projects and medium-priority warnings.
- **Critical (Red):** Reserved for "Delayed" projects, "Overdue" tasks, and critical system errors.
- **Information (Blue):** Represents items "In Review" or "Planned" status.
- **Neutral (Gray):** Used for "Draft" or "Archived" states and background architectural elements.

Backgrounds follow a tiered approach: pure white (`#FFFFFF`) for primary surfaces and a very light gray (`#F8FAFC`) for secondary containers to provide subtle contrast in data-heavy tables.

## Typography

This design system uses a dual-font strategy to balance character with utility. 
- **Hanken Grotesk** is used for headlines and KPIs, providing a sharp, modern, and high-energy feel that aligns with the "Digital Ecosystem" narrative. 
- **Inter** is the workhorse for body copy, forms, and labels, selected for its exceptional legibility at small sizes in data-dense tables. 
- **JetBrains Mono** is introduced specifically for technical identifiers like Project IDs (`PRJ-001`) and UUIDs to prevent character confusion.

Type is scaled to ensure hierarchy in dashboards:
- Large displays for high-level KPIs.
- Tight, semi-bold labels for status badges.
- Standardized body sizes for AI-generated explanations and audit logs.

## Layout & Spacing

The system employs a **dual-grid strategy** based on the application context:

1.  **Operational Density (Project Management):** A tight 4px baseline grid. Content uses a 12-column fluid grid with narrow gutters (12px) to maximize the "above-the-fold" data visibility. Tables should use condensed row heights (32-40px).
2.  **Discovery Layout (AI Catalogue):** A more generous spacing rhythm. It utilizes the same 12-column grid but increases gutters to 24px and margins to allow for a card-based search result layout that feels approachable and "intelligent."

**Breakpoints:**
- **Mobile (< 600px):** Single column, 16px margins.
- **Tablet (600px - 1024px):** 6-column grid, fluid.
- **Desktop (> 1024px):** 12-column grid, max-width 1440px for central content.

## Elevation & Depth

Visual hierarchy is established through a **Tonal Layering** approach rather than heavy shadows, maintaining a professional and "flat" operational feel.

- **Surface Levels:** The background is the lowest level (`#F8FAFC`). Cards and primary containers sit on top with a pure white (`#FFFFFF`) surface and a subtle 1px border (`#E2E8F0`).
- **Discovery Depth:** In the AI Catalogue, search result cards use an **Ambient Shadow** (Low opacity: 4%, Blur: 8px) to suggest interactivity and separate them from the search filter panel.
- **Functional Overlays:** Modals and dropdowns use a medium elevation shadow to clearly separate them from the underlying data tables. 
- **AI Highlight:** Sections containing AI-generated content may use a very subtle teal-tinted background gradient to signify "Intelligence" layers.

## Shapes

The shape language is **Soft and Precise**. A 4px (0.25rem) standard radius is applied to most UI components—buttons, input fields, and status badges—to maintain a professional, slightly technical appearance. 

Larger components like Modals and Search Cards use a `rounded-lg` (8px) radius to soften the discovery experience. Progress bars and toggle switches are the only elements that utilize a fully rounded (pill-shaped) geometry to denote "track-based" movement and status.

## Components

### Buttons & Inputs
- **Primary Button:** Solid Metland Teal with white text. 4px border radius.
- **Secondary Button:** Outline teal or slate for less critical actions.
- **Input Fields:** 1px slate border (`#CBD5E1`) that transitions to Teal on focus.

### Tables & Data
- **Density:** High-density rows for project management. 
- **Status Badges:** Small caps, semi-bold text inside a light-tinted background of the semantic color (e.g., Green text on light green background for "On Track").

### AI Catalogue Cards
- **Structure:** Image/Icon placeholder, Title, Meta-tags (Teal), and a "Smart Snippet" area.
- **AI Recommendation:** Highlighted with a subtle teal left-border accent to distinguish from standard search results.

### Project Health Indicators
- **Meters:** A horizontal track (`#E2E8F0`) with a filled progress bar using the primary teal for standard progress and semantic colors for health (Red/Yellow/Green).
- **KPI Tiles:** Large numeric display with a label below and a small trend sparkline if data is temporal.

### Feedback & Overlays
- **Modals:** Centered, clear header with "X" close, and distinct footer for actions.
- **AI Loading:** A shimmering "skeleton" state rather than a traditional spinner to represent active computation.