import React from 'react'

// ==========================================================
// RAVAGE '26 — ICON SET
// ==========================================================
// Hand-coded inline SVGs, Lucide-style thin strokes. No icon
// package/dependency — every icon below is a plain functional
// component so it can be dropped into any JSX file.
//
// EVENT_ICONS is keyed EXACTLY to the `key` values in
// src/data/eventsConfig.js (ppt, quiz, prompt, bioscope, bgm,
// esports) so Dashboard.jsx / EventDetails.jsx can look an icon
// up with EVENT_ICONS[event.key] without any extra mapping logic.
// ==========================================================

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, size = 18, ...rest }) {
  return (
    <svg width={size} height={size} {...base} {...rest}>
      {children}
    </svg>
  )
}

export function IconPPT(props) {
  // presentation / screen
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
      <path d="M7 9l3 2-3 2M13 9h4" />
    </Svg>
  )
}

export function IconQuiz(props) {
  // question / quiz
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.5a2.8 2.8 0 015.4 1c0 1.8-2.6 1.6-2.6 3.5" />
      <path d="M12 17.2v.1" />
    </Svg>
  )
}

export function IconPrompt(props) {
  // pencil / edit
  return (
    <Svg {...props}>
      <path d="M4 20l1-4.2L15.6 5.2a1.5 1.5 0 012.1 0l1.1 1.1a1.5 1.5 0 010 2.1L8.2 19 4 20z" />
      <path d="M13.3 7l3.7 3.7" />
    </Svg>
  )
}

export function IconBioscope(props) {
  // camera / photo-video
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="12" height="10" rx="1.5" />
      <path d="M15 10.5l5.5-3v9l-5.5-3" />
      <circle cx="9" cy="12" r="2.2" />
    </Svg>
  )
}

export function IconBGM(props) {
  // music note
  return (
    <Svg {...props}>
      <path d="M9 17V5l10-2v12" />
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
    </Svg>
  )
}

export function IconEsports(props) {
  // gamepad
  return (
    <Svg {...props}>
      <rect x="2.5" y="8" width="19" height="9" rx="4.5" />
      <path d="M7 10.5v4M5 12.5h4" />
      <circle cx="16" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.2" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconEntry(props) {
  // ticket / entry
  return (
    <Svg {...props}>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
      <path d="M9 6v12" strokeDasharray="2 2" />
    </Svg>
  )
}

export function IconFood(props) {
  // utensils / food
  return (
    <Svg {...props}>
      <path d="M6 2v9a2 2 0 002 2v9M6 2v20M9 2v9M4 2v9" />
      <path d="M18 2c-2 0-3 2-3 5v6h6" />
      <path d="M18 13v9" />
    </Svg>
  )
}

// Fallback used only if a future event key has no matching icon yet.
export function IconGeneric(props) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8M8 13h5" />
    </Svg>
  )
}

// Keyed exactly to eventsConfig.js `key` values.
export const EVENT_ICONS = {
  ppt: IconPPT,
  quiz: IconQuiz,
  prompt: IconPrompt,
  bioscope: IconBioscope,
  bgm: IconBGM,
  esports: IconEsports,
}
