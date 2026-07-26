---
version: alpha
name: RN CF App
description: Universal Expo app UI for the RN CF launchpad — utilitarian slate surfaces today, with anti-slop constraints for future visual work.
colors:
  background-primary: "#f8fafc"
  background-elevated: "#ffffff"
  foreground-primary: "#0f172a"
  foreground-secondary: "#475569"
  foreground-muted: "#334155"
  border-muted: "#cbd5e1"
  action-primary: "#0f172a"
  action-on-primary: "#ffffff"
  feedback-danger: "#dc2626"
  feedback-success: "#047857"
typography:
  sans:
    fontFamily: system-ui
rounded:
  base: 0.5rem
---

## Overview

RN CF App is the customer-facing Expo Router surface (web, iOS, Android) for a Cloudflare Workers
API. Current screens are scaffold-utilitarian: centered forms and account flows on a light slate
canvas with near-black primary actions. That restraint is intentional for a launchpad, not an
invitation to invent a flashy marketing system.

Product UI work must stay universal (React Native + Uniwind). Prefer composition and hierarchy
over decoration. When evolving the look, keep one clear visual direction and avoid the default
AI-generated clusters listed under Don'ts.

## Colors

Use the slate canvas (`background-primary`) for full-screen scaffolds and
`background-elevated` for bordered secondary controls. Primary CTAs use `action-primary` on
`action-on-primary`. Body copy uses `foreground-secondary` or `foreground-muted`; titles use
`foreground-primary`. Errors and success copy use the feedback tokens only for status text, not
as brand accents.

## Typography

Screens currently rely on the platform system UI stack. Titles are large and bold; supporting
copy is medium weight and secondary-colored. Prefer one expressive display face only after it is
added as a shared Uniwind/theme choice for all platforms — do not introduce Inter, Roboto, Arial,
or ad-hoc web-only font stacks on individual screens.

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

Primary button: filled `action-primary`, medium padding, semibold label. Secondary button: white
elevated surface, muted border, dark label. Prefer `Pressable` + Uniwind classes over nested card
wrappers. Cards, chips, and badge clusters are allowed only when they contain a real interaction
or status the user must act on — not as default section chrome.

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
