// Централізована палітра кольорів гри
// Всі кольори в компонентах і шарах Mapbox беруться звідси

// --- Сторони конфлікту ---
export const SIDE_COLORS = {
  ukraine:     '#4caf50',
  ukraineBar:  '#4caf50',
  russia:      '#e74c3c',
  russiaBar:   '#e74c3c',
}

// --- Акцентні кольори UI ---
export const ACCENT = {
  yellow:      '#ffdd00',   // виділення, рух, стрілки
  yellowDim:   'rgba(255,221,0,0.35)',
  yellowFaint: 'rgba(255,221,0,0.15)',
  yellowGlow:  'rgba(255,221,0,0.25)',
  yellowBorder:'rgba(255,221,0,0.6)',
  blue:        '#00cfff',   // UI заголовки, сітка гексів
  blueDim:     'rgba(0,207,255,0.3)',
  blueFaint:   'rgba(0,207,255,0.07)',
  blueSubtle:  'rgba(0,207,255,0.2)',
}

// --- Ландшафт ---
export const TERRAIN_COLORS = {
  open:    '#8bc34a',
  forest:  '#2e7d32',
  urban:   '#90a4ae',
  water:   '#1e88e5',
  // Для статусу юніта (темніші відтінки)
  openStatus:   '#a8b820',
  forestStatus: '#388e3c',
  urbanStatus:  '#78909c',
  waterStatus:  '#1976d2',
}

// --- Статус юніта ---
export const STATUS_COLORS = {
  marching: '#ff9800',
  holding:  '#3498db',
  idle:     '#8899aa',
  combat:   '#e74c3c',
}

// --- Боєздатність (Readiness) ---
export const READINESS_COLORS = {
  ready:    '#4caf50',
  strained: '#ff9800',
  exhausted:'#f44336',
}

// --- Мораль (Morale) ---
export const MORALE_COLORS = {
  high:   '#4caf50',
  steady: '#e8eaf0',
  shaken: '#ff9800',
  panic:  '#f44336',
}

// --- Окопування ---
export const ENTRENCH_COLORS = {
  amber:       '#ffc107',
  amberBg:     'rgba(255,193,7,0.12)',
  amberBorder: 'rgba(255,193,7,0.4)',
  shield:      '#7aadff',
  leaveBg:     'rgba(76,175,80,0.12)',
  leaveBorder: 'rgba(76,175,80,0.4)',
}

// --- UI панелі ---
export const UI = {
  bg:          'rgba(10, 14, 20, 0.92)',
  bgDark:      'rgba(10, 14, 20, 0.88)',
  border:      'rgba(0, 207, 255, 0.3)',
  text:        '#e8eaf0',
  textMuted:   '#8899aa',
  white:       '#fff',
  divider:     'rgba(255,255,255,0.06)',
  overlay:     'rgba(255,255,255,0.15)',
  overlayFaint:'rgba(255,255,255,0.04)',
  black60:     'rgba(0,0,0,0.6)',
  black80:     'rgba(0,0,0,0.8)',
  borderMuted: '#555',
  borderSubtle:'#444',
  borderDark:  'rgba(0,0,0,0.6)',
}

// --- Карта (Mapbox шари) ---
export const MAP = {
  hexGrid:          '#00cfff',
  hexOccupied:      '#00ff88',
  hexMoving:        '#ffdd00',
  fog:              '#000000',
  mask:             '#000000',
  zoc:              '#ff8c00',
  artilleryRange:   '#e74c3c',
}

// --- Dev-режим ---
export const DEV = {
  on:        '#e74c3c',
  mapEdit:   '#1565c0',
  unitPlace: '#2e7d32',
  ukraine:   '#1565c0',
  russia:    '#b71c1c',
  deleteBtn: '#e74c3c',
}

// --- Директиви бригад ---
export const DIRECTIVE_COLORS = {
  cautious: '#3498db',   // синій — обережність
  advance:  '#f39c12',   // помаранчевий — наступ
  allout:   '#e74c3c',   // червоний — будь-якою ціною
}
