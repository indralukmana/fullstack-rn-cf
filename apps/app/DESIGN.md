---
version: alpha
name: RN CF App
description: Universal Expo app UI for the RN CF launchpad — utilitarian slate surfaces with light/dark semantic tokens and anti-slop constraints.
colors:
  canvas: "#f8fafc"
  canvas-dark: "#0f172a"
  elevated: "#ffffff"
  elevated-dark: "#1e293b"
  foreground: "#0f172a"
  foreground-dark: "#f8fafc"
  foreground-secondary: "#475569"
  foreground-secondary-dark: "#cbd5e1"
  foreground-muted: "#64748b"
  foreground-muted-dark: "#94a3b8"
  border: "#cbd5e1"
  border-dark: "#475569"
  action: "#0f172a"
  action-dark: "#f8fafc"
  on-action: "#ffffff"
  on-action-dark: "#0f172a"
  danger: "#dc2626"
  success: "#047857"
typography:
  display:
    fontFamily: Source Serif 4
  sans:
    fontFamily: Source Sans 3
rounded:
  base: 0.5rem
---

## Overview

RN CF App is the customer-facing Expo Router surface (web, iOS, Android) for a Cloudflare Workers
API. Current screens are scaffold-utilitarian: centered forms and account flows on a slate canvas
with high-contrast primary actions. That restraint is intentional for a launchpad, not an
invitation to invent a flashy marketing system.

Product UI work must stay universal (React Native + Uniwind). Prefer composition and hierarchy
over decoration. When evolving the look, keep one clear visual direction and avoid the default
AI-generated clusters listed under Don'ts.

## Colors

Semantic Uniwind tokens live in `global.css` (`canvas`, `elevated`, `foreground*`, `border*`,
`action`, `on-action`, feedback, and warning). Prefer those utilities over raw `slate-*` so light
and dark both work. Primary CTAs use `bg-action` / `text-on-action`. Errors and success copy use
feedback tokens only for status text, not as brand accents. Dev-only warning surfaces use the
`warning-*` tokens.

## Typography

Load shared faces through `lib/fonts.ts` / `expo-font`: Source Serif 4 for screen titles and
Source Sans 3 for body, labels, and controls. Do not introduce Inter, Roboto, Arial, or ad-hoc
web-only font stacks on individual screens.

## Layout

Auth and account screens are single-column, vertically centered compositions with generous
horizontal padding and consistent vertical gaps. Prefer one job per screen: header, short
explanation, primary fields or actions, then a quiet secondary link. Do not turn these flows into
dashboards, card grids, or multi-panel marketing layouts.

## Shapes

Interactive controls use a medium radius (`rounded.base` / Uniwind `rounded-lg`). Keep radius
consistent across buttons and bordered actions; do not mix pill (`rounded-full`) and sharp
treatments without a shared primitive.

## Components

Primary button: filled `action`, full width, `min-h-12`, medium padding, semibold label, and
pressed opacity via Uniwind `active:`. Secondary button: elevated surface, muted border,
foreground label, pressed `bg-selected`. Prefer `Pressable` + Uniwind classes over nested card
wrappers.

`NavRow`: navigation destination in a list (label, optional hint, chevron). Use for account and
settings destinations that are not primary CTAs. Keep one primary `Button` for the main action on
a screen; do not stack secondary buttons when `NavRow` fits.

`QuietLink`: muted underlined text for secondary navigation (for example Home). Keep session-ending
actions such as Sign out as a bordered secondary `Button`, not quiet text. Cards, chips, and badge
clusters are allowed only when they contain a real interaction or status the user must act on —
not as default section chrome.

Dev-only panels (for example local mailbox helpers) may use a distinct warning surface so they
never read as production brand UI.

## Do's and Don'ts

**Do**

- Keep web, iOS, and Android behavior aligned; isolate platform differences behind `.web` /
  `.native` modules or `Platform` checks.
- Style with Uniwind / Tailwind v4 utilities; load the Uniwind skill for syntax and troubleshooting.
- Preserve loading, empty, error, offline, and accessible labels on customer flows.
- Read this file plus `launchpad-architecture` before applying generic frontend or “deslop” skills.

**Don't**

- Do not apply NativeWind, shadcn/Next layout kits, or DOM-only CSS Grid dashboard patterns to
  shared RN screens.
- Do not default to purple-on-white / indigo glow themes, warm cream + terracotta “AI landing”
  looks, broadsheet newspaper columns, emoji ornament, or multi-layer soft shadows.
- Do not put stats strips, promo chips, floating badges, or secondary marketing blocks in the
  first viewport of branded/marketing surfaces.
- Do not invent a second design system beside this document; extend tokens here when a shared
  visual decision is intentional.
