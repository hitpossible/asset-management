# TBKK Digital Design System

> **One Brand. One Standard. One Digital Experience.**  
> Design direction: **Clean, Modern, Professional**  
> Core message: **Driven by Technology. People. A Better Tomorrow.**

---

## 1. Brand Essence

TBKK digital products should consistently communicate three core qualities:

- **Precision** — clear structure, accurate information, predictable interaction.
- **Innovation** — modern UI patterns, efficient workflows, progressive digital experience.
- **Reliability** — stable visual language, strong readability, consistent status communication.

### Brand Statement

**Digital Solutions for a Smarter Tomorrow**

Supporting multilingual communication:

- Thai: `ให้ชีวิต` / `คน` / `ก้าวสู่อนาคตที่ดีกว่า`
- English: `Technology. People. A Better Tomorrow.`
- Japanese: support JP UI using the same typography and spacing principles.

---

## 2. Color Palette

Use a neutral foundation with TBKK Red as the main action and emphasis color.

### 2.1 Core Colors

| Token | Color | Hex | Usage |
|---|---|---:|---|
| `--color-primary` | Primary Red | `#E60012` | Primary action, active state, highlight |
| `--color-charcoal` | Charcoal Black | `#1A1A1A` | Navigation, heading, main text |
| `--color-dark-gray` | Dark Gray | `#4D4D4D` | Secondary text |
| `--color-medium-gray` | Medium Gray | `#A0A0A0` | Divider, disabled text |
| `--color-light-gray` | Light Gray | `#F2F2F2` | Background, section surface |
| `--color-white` | White | `#FFFFFF` | Card, modal, form surface |

### 2.2 Semantic Colors

| Token | Color | Hex | Usage |
|---|---|---:|---|
| `--color-success` | Green | `#00A651` | Completed, success |
| `--color-warning` | Orange | `#F5A623` | Pending, warning |
| `--color-error` | Red | `#D0021B` | Error, critical, NG |
| `--color-info` | Blue | `#0078D4` | Information, in progress |
| `--color-inactive` | Gray | `#BDBDBD` | Disabled, inactive |

### 2.3 Recommended CSS Variables

```css
:root {
  --color-primary: #E60012;
  --color-charcoal: #1A1A1A;
  --color-dark-gray: #4D4D4D;
  --color-medium-gray: #A0A0A0;
  --color-light-gray: #F2F2F2;
  --color-white: #FFFFFF;

  --color-success: #00A651;
  --color-warning: #F5A623;
  --color-error: #D0021B;
  --color-info: #0078D4;
  --color-inactive: #BDBDBD;

  --border-color: #E5E5E5;
  --surface-muted: #F8F8F8;
}
```

### 2.4 Color Usage Rules

- Use **Primary Red** for primary CTA, active navigation, selected state, progress highlight, and key KPI emphasis.
- Avoid large solid-red backgrounds unless used for short emphasis areas.
- Use neutral colors for most layouts so the red remains visually meaningful.
- Use semantic colors only for status meaning; do not reuse them decoratively.
- Ensure text contrast remains readable on all backgrounds.

---

## 3. Typography

### 3.1 Primary Font

**Noto Sans**

Use Noto Sans because it supports Thai, English, and Japanese consistently.

Recommended stack:

```css
font-family: "Noto Sans", "Noto Sans Thai", "Noto Sans JP", Arial, sans-serif;
```

### 3.2 Type Scale

| Style | Weight | Size | Usage |
|---|---:|---:|---|
| H1 | Bold 700 | `32–40px` | Page title |
| H2 | Semibold 600 | `24–28px` | Section title |
| H3 | Semibold 600 | `18–20px` | Sub-title / card title |
| Body | Regular 400 | `14–16px` | Main content |
| Caption | Regular 400 | `12px` | Helper text, metadata |

### 3.3 Typography Rules

- Use **sentence case** for labels and buttons.
- Prefer short, scannable page titles.
- Avoid using more than 3 font weights on one screen.
- Numeric KPIs should use stronger weight than their labels.
- Maintain consistent line-height:
  - Heading: `1.2–1.35`
  - Body: `1.5–1.6`

---

## 4. Layout System

### 4.1 Spacing

Use an 8px spacing system.

| Token | Value |
|---|---:|
| `xs` | `4px` |
| `sm` | `8px` |
| `md` | `16px` |
| `lg` | `24px` |
| `xl` | `32px` |
| `2xl` | `48px` |

### 4.2 Radius

TBKK UI should feel modern but professional.

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

Recommended default:

- Input / Button: `4–6px`
- Card: `8px`
- Modal: `8–12px`

Avoid overly rounded, playful pill layouts for primary enterprise screens.

### 4.3 Shadow

Use subtle elevation only.

```css
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.12);
```

---

## 5. UI Components

## 5.1 Buttons

### Primary Button

Use for the main action on a page.

```css
background: #E60012;
color: #FFFFFF;
border: 1px solid #E60012;
```

Examples:

- Create
- Save
- Submit
- Sign In
- Confirm

### Secondary Button

Use for secondary actions.

```css
background: #FFFFFF;
color: #1A1A1A;
border: 1px solid #A0A0A0;
```

Examples:

- Cancel
- Back
- Preview
- Export

### Disabled Button

```css
background: #BDBDBD;
color: #FFFFFF;
cursor: not-allowed;
```

### Delete / Danger Button

```css
background: #FDEBEC;
color: #D0021B;
border: 1px solid transparent;
```

Use only for destructive actions.

---

## 5.2 Form Elements

### Label

- Font size: `14px`
- Weight: `500–600`
- Color: `#1A1A1A`

### Text Input

- Height: `36–40px`
- Background: `#FFFFFF`
- Border: `1px solid #D9D9D9`
- Radius: `4px`
- Horizontal padding: `12px`

Focus state:

```css
border-color: #E60012;
box-shadow: 0 0 0 2px rgba(230, 0, 18, 0.08);
```

### Select

Use the same visual style as the text input with a clear dropdown indicator.

### Checkbox / Radio

- Selected color: `#E60012`
- Unselected border: `#A0A0A0`
- Label aligned vertically with the control.

### Validation

- Error message uses `#D0021B`.
- Show a concise description directly below the affected field.
- Do not rely on color alone; include text or an icon.

---

## 5.3 Icons

Use **line-style icons** with simple geometry.

Recommended categories:

- Home
- Document
- Analytics
- Settings
- User
- Notification
- Search
- Help
- Edit
- Delete
- More actions

### Icon Rules

- Standard size: `20–24px`
- Stroke should remain visually consistent.
- Active navigation icon may use Primary Red.
- Do not mix filled, outlined, 3D, and illustrated icon families in one product.

---

## 5.4 Cards

Cards are the default surface for summaries and dashboard information.

```css
background: #FFFFFF;
border: 1px solid #EEEEEE;
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
padding: 16px;
```

Recommended KPI card structure:

1. Icon / indicator
2. Large numeric value
3. Short label
4. Optional trend or status

---

## 5.5 Data Table

Recommended structure:

- Table title on the left
- Main CTA such as `+ Create` on the right
- Light gray header row
- Strong alignment between columns
- Status represented by consistent tags
- Row actions grouped to the right

Recommended columns:

```text
No. | ID / Part Number | Name | Status | Action
```

### Table Rules

- Avoid heavy borders.
- Prefer horizontal separators or light grid lines.
- Keep row height between `40–48px`.
- Align numbers to the right where appropriate.
- Use sticky header for long tables.
- On mobile, prioritize essential columns and move extra actions into a menu.

---

## 6. Data Visualization

Use consistent colors and styles across all TBKK applications.

### 6.1 KPI Cards

Example status concepts:

- **12** Ongoing Projects
- **8** Under Review
- **3** Completed

Use semantic icon colors, but keep the overall card surface neutral.

### 6.2 Progress Bar

Recommended style:

```text
Project Progress
██████████████░░░░░░ 68%
```

- Track: light gray
- Fill: Primary Red
- Percentage aligned to the right

### 6.3 Status Tags

| Status | Style |
|---|---|
| Completed | Green / Success |
| In Progress | Blue / Info |
| Pending | Orange / Warning |
| NG / Error | Red / Error |
| Inactive | Gray / Inactive |

Tags should use a light background with readable text rather than a saturated full-color block.

---

## 7. Navigation

## 7.1 Desktop Sidebar

Recommended structure:

```text
TBKK Logo
────────────
Dashboard
Projects
FMEA
Master Data
Reports
Settings
```

### Sidebar Rules

- Background: Charcoal Black
- Default item: white/light-gray text
- Active item: Primary Red highlight
- Icons placed consistently before labels
- Use clear grouping if navigation grows beyond 7–8 items

---

## 7.2 Top Bar

Recommended elements:

```text
Menu / Page Context | Search | Notification | User Profile
```

Use white or very light neutral background with a subtle divider.

---

## 7.3 Mobile Navigation

For mobile, use a bottom navigation for 3–5 high-frequency actions.

Example:

```text
Home | Search | Notification | Menu
```

Rules:

- Current item uses Primary Red.
- Labels remain visible.
- Minimum touch target: `44×44px`.

---

## 8. Visual Elements

Use a recognizable TBKK visual signature without making interfaces visually heavy.

### 8.1 Signature Red Line

A short red line or directional red accent can be used for:

- Section emphasis
- Hero composition
- CTA direction
- Page decoration

Do not overuse it.

### 8.2 Numbered Section Pattern

For high-level content, use a strong numbered title style:

```text
01
PRODUCTION
MANAGEMENT
```

Suitable for:

- Landing pages
- Presentation-style screens
- Module overview
- Kiosk / digital signage

Avoid using this style inside dense forms or transactional workflows.

### 8.3 Geometric Surface

Use subtle gray angular or slanted shapes as decorative accents for branded screens such as login pages or landing pages.

Do not place decorative geometry behind dense content or form fields where it may reduce readability.

---

## 9. Application Patterns

## 9.1 Login Page

Recommended two-column desktop layout:

```text
┌──────────────────────┬──────────────────────────┐
│ TBKK Logo            │                          │
│ Welcome to           │ Branded industrial      │
│ TBKK Digital Systems │ image / visual           │
│                      │                          │
│ Username             │ TECHNOLOGY               │
│ Password             │ PEOPLE                   │
│ [ Sign In ]          │ A BETTER TOMORROW        │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

Rules:

- Keep login form minimal.
- Primary CTA is red.
- Image should reflect engineering, manufacturing, technology, or mobility.
- Keep corporate message short.

---

## 9.2 Dashboard

Recommended desktop structure:

```text
Sidebar
  └─ Dashboard

Top Bar
  └─ Search / Notification / Profile

Main Content
  ├─ Page Title
  ├─ KPI Cards
  ├─ Project Progress
  └─ Recent Activity Table
```

Dashboard hierarchy:

1. Current status
2. Items requiring attention
3. Progress
4. Recent activity
5. Navigation to detailed pages

---

## 9.3 List / Master Data Page

Recommended pattern:

```text
Part List                                  [+ Create]

Search / Filter / Status

| No. | Part Number | Part Name | Status | Action |
|-----|-------------|-----------|--------|--------|
```

Primary actions are red; edit and secondary actions stay visually neutral.

---

## 10. Responsive Design

### Desktop

- Sidebar visible
- Multi-column KPI layout
- Full table columns
- Content max-width can be `1440–1600px`

### Tablet

- Collapsible sidebar
- KPI cards in 2-column grid
- Reduce non-essential table columns

### Mobile

- Bottom navigation or drawer
- Single-column card layout
- Tables become card/list views when necessary
- Minimum body text: `14px`
- Minimum interactive area: `44×44px`

---

## 11. Accessibility

- Ensure text and background color contrast meets WCAG AA where practical.
- Never communicate status using color alone.
- Inputs must have visible labels.
- Buttons should contain descriptive action text.
- Keyboard focus must be clearly visible.
- Avoid placeholder-only forms.
- Error state must include readable text.

---

## 12. Content Guidelines

### Button Labels

Prefer verbs:

- `Create`
- `Save`
- `Submit`
- `Approve`
- `Reject`
- `Download`
- `Edit`
- `Delete`

Avoid vague labels such as:

- `OK`
- `Click Here`
- `Go`

unless the context is already completely clear.

### Page Titles

Good:

```text
Dashboard
Project Management
Part List
Skill Matrix
PFMEA Approval
```

Avoid overly long titles.

---

## 13. Design Tokens

```css
:root {
  /* Brand */
  --tbkk-red: #E60012;
  --tbkk-black: #1A1A1A;

  /* Neutral */
  --gray-900: #1A1A1A;
  --gray-700: #4D4D4D;
  --gray-500: #A0A0A0;
  --gray-300: #D9D9D9;
  --gray-200: #E5E5E5;
  --gray-100: #F2F2F2;
  --gray-050: #F8F8F8;
  --white: #FFFFFF;

  /* Semantic */
  --success: #00A651;
  --warning: #F5A623;
  --error: #D0021B;
  --info: #0078D4;
  --inactive: #BDBDBD;

  /* Typography */
  --font-family: "Noto Sans", "Noto Sans Thai", "Noto Sans JP", Arial, sans-serif;
  --font-size-caption: 12px;
  --font-size-body: 14px;
  --font-size-body-lg: 16px;
  --font-size-h3: 20px;
  --font-size-h2: 28px;
  --font-size-h1: 40px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadow */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

---

## 14. Recommended Component Naming

For React / frontend implementation:

```text
components/
├── Button
├── Input
├── Select
├── Checkbox
├── Radio
├── StatusTag
├── KpiCard
├── ProgressBar
├── DataTable
├── Sidebar
├── TopBar
├── MobileNav
├── Modal
├── EmptyState
└── PageHeader
```

Example variants:

```ts
Button: primary | secondary | danger | ghost
StatusTag: success | info | warning | error | inactive
KpiCard: default | success | warning | error | info
```

---

## 15. Do / Don't

### Do

- Keep interfaces clean and structured.
- Use red for important actions and active states.
- Use white space generously.
- Keep typography consistent across TH / EN / JP.
- Use semantic colors consistently.
- Design reusable components rather than page-specific styles.
- Optimize transactional screens for clarity and speed.

### Don't

- Do not make every button red.
- Do not use multiple icon styles in the same product.
- Do not use heavy gradients or excessive shadows.
- Do not overload dashboards with too many colors.
- Do not use status colors for decoration.
- Do not use overly playful rounded UI for core enterprise workflows.
- Do not introduce a different design language for each TBKK system.

---

## 16. TBKK Digital Experience Principle

Every TBKK digital product should feel like part of the same ecosystem even when the business function is different.

The design should be:

**Precise. Innovative. Reliable.**

And every product should follow the same principle:

> **One TBKK Digital Experience — Different systems. One standard. A stronger TBKK.**

---

**Version:** 1.0  
**Document:** TBKK Digital Design System  
**Reference:** TBKK Digital Theme Guideline
