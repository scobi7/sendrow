# DESIGN.md — UI rules for this project. Read before touching any UI.

Reference: greptile.com (wide bold type, the real product as the proof, handwritten notes pointing at it), built as direction 4c: one green, layered sheets, and a still 3D view of how one number is built from its bill and factor.
Tone in three words: precise, calm, plain
Audience: independent sustainability consultants (1 to 5 people) at a laptop between client deadlines, checking whether Sendrow can replace email and spreadsheets for collecting client data.

Theme (approved 2026-11-13): every color is a step of one green, except amber for warnings and red for errors in the app. Ink #0D2A1E, accent #0A7346, page #EEF4F0, surfaces #FFFFFF and #DCEAE1, lines #C8DCCF. Archivo for everything, headings at normal width; Nanum Pen Script for handwritten notes on the homepage only. One radius, 10px. Shadows at most 24px blur. Tokens live in `app/globals.css`; the 3D stack (a deliberate exception to the tilted-3D ban, asked for by name) stays on the homepage.

## Process

1. Before writing any UI code, output a design brief: the palette as
   named tokens with hex values, the two typefaces and why, the layout
   idea in two sentences, the one motion idea, and how the reference
   shows up. Wait for my approval. Do not build from an unapproved brief.
2. Build the whole page from that brief. If you drift from it, say so.
3. When done, run the self-review at the bottom and fix what it finds
   before showing me.

## Banned. Never, without me asking by name.

- Slate-900 or any near-black blue-gray page background.
- Radial gradient blobs, blurred glows, or "orbs" as backgrounds.
- Gradient text. Purple-to-pink, blue-to-cyan, any of it.
- Purple as a primary accent. If the brief needs purple, justify it.
- Icons inside rounded-square or circular badges. Icons in feature lists
  at all, unless the icon carries meaning a word cannot.
- Three-column feature grids with icon, title, two lines of copy.
- Bento grids, unless every cell shows real data from this product.
- Fake charts, fake sparklines, fake toggles, fake cursors, fake
  dashboards. If it isn't real, it doesn't ship.
- Tilted or 3D-perspective screenshots. Screenshots are flat, at 1x,
  and real.
- Drop shadows with a blur over 24px. Glowing borders. Border-beam
  effects.
- A taller, glowing, or "Most Popular" pricing card. All tiers equal;
  recommend with copy, not with height.
- Testimonials, logo bars, star ratings, or "Trusted by N" counts that
  are not literally true with named, real sources. No proof beats fake
  proof.
- Stock photos of people. No Unsplash headshots, ever.
- Pills above the headline. "Now with AI." "New." Sparkle emoji.
- Emoji anywhere in UI text.
- The words: supercharge, seamless, effortless, unlock, elevate,
  empower, revolutionize, next-generation, AI-powered, all-in-one,
  game-changing, unleash. Any headline that could sit on a
  competitor's site unchanged.
- Inter, Roboto, Open Sans, or the system font as the display face.
  Fine for body. Never for the words people read first.
- Bouncing, pulsing, or looping animations that exist to look alive.
- Marquees of anything.
- Rounded-2xl on everything. Pick one radius and mean it.

## Required

- One background color, one ink color, one accent. Tokens named for
  their job (bg, ink, accent), never Tailwind palette names.
- Two typefaces max: a display face with a point of view, and a body
  face built for reading at 17 to 19px. Real type scale: the hero is
  4 to 6 times body size, tight tracking on display, 1.5 to 1.7 line
  height on body.
- Whitespace is a feature. Sections breathe. Nothing is fighting for
  attention because only one thing on each screen deserves it.
- Asymmetry somewhere. A pulled-left headline, an offset image, a
  column that is narrower than the others on purpose.
- The headline names what the product does for whom, in words the
  customer would use. Specific beats clever.
- Every number on the page is true. Every quote has a real name and a
  real company. Otherwise the section does not exist.
- Motion: one idea, used consistently. Ease-out entrances under 400ms.
  Nothing loops. Nothing moves unless the user did something or the
  content just arrived.
- Screenshots and product imagery are real captures from this product,
  flat, with a 1px border or no border.
- Buttons look like buttons: one primary, one secondary, no gradients.
- Mobile is designed, not squeezed. Check it at 390px before showing me.

## Self-review before showing me

Go through the page and list every element that:
1. Appears on the banned list.
2. Could be deleted with zero loss of information.
3. Would look at home on a generic SaaS template.
4. Contains a claim you cannot prove.
5. Uses a color, radius, or shadow not in the brief.
Fix all of it, then show me the page and the list of what you changed.
