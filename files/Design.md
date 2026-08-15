# Design.md — SignBridge AI

## Palette

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#12141c` | page background |
| `--panel` | `#191c28` | cards, panels |
| `--line` | `#2b2f40` | borders, hairlines |
| `--teal` | `#2dd6c0` | Sign→Speech mode accent |
| `--amber` | `#f6ac3f` | Speech→Sign mode accent |
| `--coral` | `#ff6a5b` | brand/primary accent (CTAs, logo dot) |
| `--mist` | `#8c93ab` | secondary/muted text |
| `--white` | `#f5f6fb` | primary text |

Dark theme throughout. No light-mode variant in v1.

## Typography

- Display (headings): `Space Grotesk` — weight 600–700
- Body: `Inter` — weight 400–500
- Mono (labels, captions, data, eyebrows): `IBM Plex Mono`

Type scale: hero H1 `clamp(38px, 6vw, 68px)`, section H2 `clamp(26px, 3.4vw,
38px)`, body ~15.5–17px, mono labels ~11.5–13px with letter-spacing ~0.1em
uppercase for eyebrows/tags.

## Layout

- Max content width ~1120px, centered.
- Card radius 12–20px, hairline 1px borders in `--line`.
- Section rhythm: consistent vertical padding (~88px desktop) with a
  top hairline divider between sections.
- Mode-specific accents apply locally (teal for sign-mode cards/buttons,
  amber for speech-mode) — the coral brand accent stays reserved for
  primary CTAs, the logo, and the bridge pulse origin, not general decoration.

## Signature element — the bridge motif

An SVG arc connecting two nodes: an ISL signer node (left) and a speaker node
(right). A pulse travels along the arc in the direction of the active
communication mode — teal pulse left→right for Sign→Speech, amber pulse
right→left for Speech→Sign. This motif appears full-size in the hero and as
a small toggle indicator in the app panel. It is the one deliberately
animated, memorable element — everything else stays quiet.

## Motion

- Motion is restrained and purposeful: the bridge pulse, chip/tile
  entrance animations, subtle hover states. No decorative motion beyond that.
- Respect `prefers-reduced-motion`: disable the bridge pulse loop and
  chip-entrance animation, keep state changes instant instead.

## Accessibility floor

- Visible keyboard focus rings on every interactive element (don't rely on
  browser default outline alone — style it deliberately, but never remove it).
- Color is never the only signal: mode state, confidence level, and
  connection status should also be conveyed in text/labels, not color alone.
- Responsive down to ~320px width.

## Voice / copy tone

- Plain, direct, active voice. Buttons say what they do: "Start detecting,"
  "Speak sentence," "Play as signs" — not vague labels like "Submit" or "Go."
- Empty/error states explain what happened and what to do next, in the
  interface's voice — e.g. "Camera access denied — enable it in your browser
  settings to use Sign→Speech" rather than a generic permissions error.
