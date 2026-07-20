// ==UserScript==
// @name         Whiteboard (tldraw-style)
// @namespace    https://userscripts.local/whiteboard
// @version      2.6.0
// @description  Full-featured whiteboard overlay. Alt+W to toggle. Drawings persist via localStorage.
// @author       Whiteboard
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  if (document.getElementById('__wb_overlay__')) return;

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
  /* ── Apple Design System Variables ─────────────────────────────────── */
  :root {
    --wb-bg: #f5f5f7;
    --wb-canvas-bg: #fafafa;
    --wb-surface: rgba(255,255,255,0.82);
    --wb-surface-solid: #ffffff;
    --wb-surface-raised: rgba(255,255,255,0.95);
    --wb-border: rgba(0,0,0,0.07);
    --wb-separator: rgba(60,60,67,0.12);
    --wb-text: #1d1d1f;
    --wb-text-sec: rgba(60,60,67,0.55);
    --wb-text-tert: rgba(60,60,67,0.3);
    --wb-accent: #007AFF;
    --wb-accent-bg: rgba(0,122,255,0.1);
    --wb-accent-deep: rgba(0,122,255,0.18);
    --wb-danger: #FF3B30;
    --wb-danger-bg: rgba(255,59,48,0.08);
    --wb-hover: rgba(0,0,0,0.04);
    --wb-active: rgba(0,0,0,0.07);
    --wb-blur: blur(24px) saturate(180%);
    --wb-shadow-xs: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04);
    --wb-shadow: 0 4px 24px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.05);
    --wb-shadow-lg: 0 16px 60px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.04);
    --wb-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
    --wb-radius-sm: 8px;
    --wb-radius: 12px;
    --wb-radius-lg: 16px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --wb-bg: #000000;
      --wb-canvas-bg: #141414;
      --wb-surface: rgba(28,28,30,0.88);
      --wb-surface-solid: #1c1c1e;
      --wb-surface-raised: rgba(44,44,46,0.96);
      --wb-border: rgba(255,255,255,0.08);
      --wb-separator: rgba(84,84,88,0.48);
      --wb-text: #f5f5f7;
      --wb-text-sec: rgba(235,235,245,0.55);
      --wb-text-tert: rgba(235,235,245,0.28);
      --wb-accent: #0A84FF;
      --wb-accent-bg: rgba(10,132,255,0.15);
      --wb-accent-deep: rgba(10,132,255,0.25);
      --wb-danger: #FF453A;
      --wb-danger-bg: rgba(255,69,58,0.1);
      --wb-hover: rgba(255,255,255,0.05);
      --wb-active: rgba(255,255,255,0.09);
      --wb-shadow-xs: 0 1px 3px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.055);
      --wb-shadow: 0 4px 24px rgba(0,0,0,0.48), 0 1px 6px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(255,255,255,0.055);
      --wb-shadow-lg: 0 16px 60px rgba(0,0,0,0.68), 0 4px 16px rgba(0,0,0,0.36), 0 0 0 0.5px rgba(255,255,255,0.055);
    }
  }

  #__wb_overlay__ {
    position: fixed !important; inset: 0 !important;
    z-index: 2147483640 !important; display: none !important;
    overflow: hidden !important; background: var(--wb-bg) !important;
    font-family: var(--wb-font) !important;
  }
  #__wb_overlay__.wb-open { display: block !important; }
  #__wb_grid__ {
    position: fixed !important; inset: 0 !important; pointer-events: none !important;
    z-index: 2147483639 !important; display: none !important;
  }
  #__wb_grid__.wb-open { display: block !important; }
  #__wb_toggle_btn__ {
    position: fixed !important; bottom: 24px !important; right: 24px !important;
    z-index: 2147483645 !important;
    width: auto !important; height: 50px !important;
    border-radius: 25px !important;
    border: 0.5px solid rgba(255,255,255,0.12) !important;
    background: rgba(44,44,46,0.72) !important;
    backdrop-filter: saturate(180%) blur(20px) !important;
    -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
    color: rgba(255,255,255,0.92) !important; cursor: pointer !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    gap: 8px !important;
    padding: 0 22px 0 18px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'SF Pro Display', system-ui, sans-serif !important;
    font-size: 15px !important;
    font-weight: 590 !important;
    letter-spacing: -0.022em !important;
    white-space: nowrap !important;
    box-shadow:
      0 8px 32px rgba(0,0,0,0.52),
      0 2px 8px rgba(0,0,0,0.28),
      inset 0 0.5px 0 rgba(255,255,255,0.14) !important;
    transition:
      transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.15),
      box-shadow 0.2s ease,
      background 0.15s ease,
      border-color 0.15s ease !important;
    -webkit-font-smoothing: antialiased !important;
    text-rendering: optimizeLegibility !important;
  }
  #__wb_toggle_btn__.wb-hidden { display: none !important; }
  #__wb_toggle_btn__:hover {
    transform: scale(1.03) translateY(-1px) !important;
    background: rgba(62,62,66,0.78) !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow:
      0 12px 40px rgba(0,0,0,0.60),
      0 4px 12px rgba(0,0,0,0.32),
      inset 0 0.5px 0 rgba(255,255,255,0.18) !important;
  }
  #__wb_toggle_btn__:active {
    transform: scale(0.96) !important;
    background: rgba(32,32,34,0.82) !important;
    border-color: rgba(255,255,255,0.08) !important;
    box-shadow:
      0 4px 16px rgba(0,0,0,0.40),
      inset 0 0.5px 0 rgba(255,255,255,0.08) !important;
    transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease !important;
  }
  #__wb_close_btn__ {
    position: fixed !important; top: 14px !important; right: 16px !important;
    z-index: 2147483647 !important; width: 32px !important; height: 32px !important;
    border-radius: 50% !important; border: none !important;
    background: rgba(120,120,128,0.18) !important;
    color: var(--wb-text-sec) !important; cursor: pointer !important;
    font-size: 13px !important; display: none !important;
    align-items: center !important; justify-content: center !important;
    backdrop-filter: var(--wb-blur) !important; -webkit-backdrop-filter: var(--wb-blur) !important;
    transition: background 0.15s ease !important; font-weight: 600 !important;
  }
  #__wb_close_btn__:hover { background: rgba(120,120,128,0.28) !important; }
  #__wb_close_btn__.wb-open { display: flex !important; }
  /* ── canvas ── */
  #__wb_overlay__ * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  #wb-canvas-container { position: absolute; inset: 0; overflow: hidden; cursor: default; contain: layout style; }
  /* GPU compositor layer — pan/zoom transform runs entirely on GPU without CPU repaint */
  #wb-canvas { position: absolute; top: 0; left: 0; transform-origin: 0 0; will-change: transform; }
  #wb-draw-svg, #wb-arrow-svg { position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible; }
  /* Live-stroke SVG: own GPU compositor tile — setAttribute on the in-progress
     path never triggers a repaint of the finalized-stroke layer (wb-draw-svg). */
  #wb-live-svg { position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible; will-change: transform; transform: translateZ(0); }
  #wb-arrow-svg .wb-hit, #wb-arrow-svg circle, #wb-arrow-svg polygon { pointer-events: all; }
  #wb-sel-rect { position: absolute; border: 1.5px solid var(--wb-accent); background: var(--wb-accent-bg); pointer-events: none; display: none; z-index: 500; border-radius: 4px; }
  #wb-laser {
    position: absolute; width: 8px; height: 8px; border-radius: 50%;
    pointer-events: none; display: none;
    transform: translate(-50%, -50%); z-index: 9999;
    background: radial-gradient(circle, #ffffff 0%, #ffffff 25%, #ff2222 55%, transparent 100%);
    box-shadow:
      0 0 2px 1px #fff,
      0 0 5px 2px #ff4444,
      0 0 12px 5px rgba(255,30,30,0.8),
      0 0 28px 10px rgba(255,0,0,0.45),
      0 0 55px 18px rgba(255,0,0,0.18);
    mix-blend-mode: screen;
  }
  #wb-laser-trail { position: absolute; top:0; left:0; pointer-events:none; z-index:9998; overflow:visible; mix-blend-mode: screen; }
  /* ── toolbar ── */
  #wb-toolbar {
    position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
    display: flex; align-items: center; gap: 1px;
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: 18px;
    padding: 5px 8px;
    box-shadow: var(--wb-shadow);
    z-index: 2147483643;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    font-family: var(--wb-font);
  }
  .wb-tbtn {
    width: 36px; height: 36px; border: none; background: transparent; border-radius: 10px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--wb-text-sec); transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease;
    position: relative;
  }
  .wb-tbtn:hover { background: var(--wb-hover); color: var(--wb-text); }
  .wb-tbtn:active { transform: scale(0.92); }
  .wb-tbtn.active { background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-tbtn[data-tip]:hover::after {
    content: attr(data-tip); position: absolute; bottom: calc(100% + 10px);
    left: 50%; transform: translateX(-50%);
    background: var(--wb-surface-solid); color: var(--wb-text);
    border: 0.5px solid var(--wb-border);
    padding: 5px 9px; border-radius: 8px; font-size: 11px;
    font-family: var(--wb-font); font-weight: 500;
    white-space: nowrap; pointer-events: none; z-index: 9999;
    box-shadow: var(--wb-shadow-xs);
    letter-spacing: -0.01em;
  }
  .wb-divider { width: 1px; height: 22px; background: var(--wb-separator); margin: 0 4px; flex-shrink:0; }
  /* ── style panel ── */
  #wb-style-panel {
    position: fixed; left: 12px; top: 50%; transform: translateY(-50%);
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border); border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow); padding: 8px 6px;
    z-index: 2147483643; display: flex; flex-direction: column; gap: 3px;
    width: 132px; max-height: calc(100vh - 20px); overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: var(--wb-separator) transparent;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    font-family: var(--wb-font);
  }
  #wb-style-panel::-webkit-scrollbar { width: 3px; }
  #wb-style-panel::-webkit-scrollbar-thumb { background: var(--wb-separator); border-radius: 2px; }
  .wb-plabel { font-size: 9.5px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .06em; color: var(--wb-text-tert); text-align: center; margin-bottom: 1px; }
  .wb-color-row { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
  .wb-swatch {
    width: 19px; height: 19px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; transition: transform 0.12s ease, border-color 0.12s ease; flex-shrink: 0;
  }
  .wb-swatch:hover { transform: scale(1.2); }
  .wb-swatch.active { border-color: var(--wb-text) !important; box-shadow: 0 0 0 1.5px var(--wb-surface-solid); }
  /* saved custom colors row */
  #wb-saved-colors { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; min-height: 0; }
  #wb-saved-colors:empty { display: none; }
  #wb-fill-saved-colors { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; min-height: 0; }
  #wb-fill-saved-colors:empty { display: none; }
  #wb-bg-custom-colors { display: flex; flex-wrap: wrap; gap: 5px; min-height: 0; margin-top: 4px; }
  #wb-bg-custom-colors:empty { display: none; }
  /* mini context menu for color swatch deletion */
  #wb-color-ctx {
    position: fixed; background: var(--wb-surface);
    border: 0.5px solid var(--wb-border); border-radius: 12px;
    box-shadow: var(--wb-shadow-lg); padding: 5px; z-index: 2147483647;
    min-width: 140px; display: none;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    font-family: var(--wb-font);
  }
  /* size row — horizontal */
  .wb-size-row { display: flex; align-items: center; justify-content: center; gap: 5px; flex-direction: row; }
  .wb-sbtn {
    border: 1.5px solid var(--wb-separator); background: transparent; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .wb-sbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-sbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-sbtn.s1{width:14px;height:14px;} .wb-sbtn.s2{width:19px;height:19px;}
  .wb-sbtn.s3{width:25px;height:25px;} .wb-sbtn.s4{width:31px;height:31px;}
  .wb-sdot { background: var(--wb-text); border-radius: 50%; }
  .wb-sbtn.s1 .wb-sdot{width:4px;height:4px;} .wb-sbtn.s2 .wb-sdot{width:7px;height:7px;}
  .wb-sbtn.s3 .wb-sdot{width:11px;height:11px;} .wb-sbtn.s4 .wb-sdot{width:16px;height:16px;}
  .wb-dash-row { display: flex; gap: 3px; flex-direction: column; align-items: center; }
  .wb-dbtn {
    width: 46px; height: 18px; border: 1.5px solid var(--wb-separator); border-radius: 6px;
    cursor: pointer; background: transparent; display: flex; align-items: center; justify-content: center;
    color: var(--wb-text-sec);
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .wb-dbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-dbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-fill-row { display: flex; gap: 4px; justify-content: center; }
  .wb-fbtn {
    width: 28px; height: 22px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    cursor: pointer; background: transparent; font-size: 11px; color: var(--wb-text-sec);
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .wb-fbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-fbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-op-row { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .wb-op-row input[type=range] {
    -webkit-appearance: none; width: 84px; height: 3px; border-radius: 2px; outline: none; cursor: pointer;
    background: linear-gradient(to right, var(--wb-accent) 0%, var(--wb-accent) var(--pct,100%), var(--wb-separator) var(--pct,100%), var(--wb-separator) 100%);
  }
  .wb-op-row input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    background: var(--wb-surface-solid); border: 2px solid var(--wb-accent);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  /* ── stroke effects & pattern brushes — single scrollable row ── */
  .wb-eff-row {
    display: flex; flex-wrap: nowrap; gap: 3px;
    overflow-x: auto; padding-bottom: 2px;
    scrollbar-width: thin; scrollbar-color: var(--wb-separator) transparent;
  }
  .wb-eff-row::-webkit-scrollbar { height: 3px; }
  .wb-eff-row::-webkit-scrollbar-thumb { background: var(--wb-separator); border-radius: 2px; }
  .wb-effbtn {
    height: 21px; padding: 0 6px; border: 1.5px solid var(--wb-separator); border-radius: 6px;
    cursor: pointer; background: transparent; font-size: 9.5px; font-weight: 600;
    color: var(--wb-text-sec); display: flex; align-items: center; gap: 2px; white-space: nowrap;
    font-family: var(--wb-font);
    transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease; flex-shrink: 0;
  }
  .wb-effbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-effbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-patbtn {
    width: 28px; height: 21px; border: 1.5px solid var(--wb-separator); border-radius: 6px;
    cursor: pointer; background: transparent; display: flex; align-items: center;
    justify-content: center; transition: border-color 0.12s ease, background 0.12s ease; flex-shrink: 0;
  }
  .wb-patbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-patbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  /* ── topbar ── */
  #wb-topbar {
    position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center;
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: 14px;
    padding: 5px 8px;
    gap: 2px;
    z-index: 2147483643;
    box-shadow: var(--wb-shadow);
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    white-space: nowrap;
  }
  .wb-topbtn {
    height: 34px; border: none; border-radius: 9px;
    background: transparent; color: var(--wb-text); cursor: pointer; padding: 0 13px;
    font-size: 12.5px; font-family: var(--wb-font); font-weight: 500;
    display: flex; align-items: center; gap: 7px; letter-spacing: -0.01em;
    transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease;
    flex-shrink: 0;
  }
  .wb-topbtn:hover { background: var(--wb-hover); }
  .wb-topbtn:active { transform: scale(0.94); }
  .wb-topbtn:disabled { opacity: .32; cursor: default; pointer-events: none; }
  .wb-topbtn svg { flex-shrink: 0; }
  .wb-top-divider { width: 1px; height: 20px; background: var(--wb-separator); margin: 0 3px; flex-shrink: 0; }
  #wb-snap-btn.snap-on { background: var(--wb-accent-bg); color: var(--wb-accent); }
  /* ── zoom ── */
  #wb-zoom-ctrl {
    position: fixed; right: 12px; bottom: 28px;
    display: flex; flex-direction: column; gap: 3px; z-index: 2147483643;
  }
  .wb-zbtn {
    width: 34px; height: 34px; border: 0.5px solid var(--wb-border); border-radius: 10px;
    background: var(--wb-surface); color: var(--wb-text); cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: var(--wb-shadow-xs);
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    transition: background 0.12s ease, transform 0.1s ease;
    font-family: var(--wb-font);
  }
  .wb-zbtn:hover { background: var(--wb-surface-raised); }
  .wb-zbtn:active { transform: scale(0.93); }
  #wb-zoom-lbl { text-align: center; font-size: 10.5px; font-weight: 600; color: var(--wb-text-tert); padding: 3px 0; font-family: var(--wb-font); letter-spacing: -0.01em; }
  /* ── context menu ── */
  #wb-ctx {
    position: fixed;
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border); border-radius: 14px;
    box-shadow: var(--wb-shadow-lg); padding: 6px; z-index: 2147483646;
    min-width: 178px; display: none;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    font-family: var(--wb-font);
  }
  .wb-citem {
    padding: 7px 12px; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 400; color: var(--wb-text); letter-spacing: -0.01em;
    display: flex; align-items: center; gap: 9px;
    transition: background 0.1s ease;
  }
  .wb-citem:hover { background: var(--wb-hover); }
  .wb-citem:active { background: var(--wb-active); }
  .wb-citem.danger { color: var(--wb-danger); }
  .wb-citem.danger:hover { background: var(--wb-danger-bg); }
  .wb-csep { height: 0.5px; background: var(--wb-separator); margin: 4px 0; }
  .wb-cshort { margin-left: auto; font-size: 11px; color: var(--wb-text-tert); font-weight: 400; }
  /* image-only context items hidden by default, shown when image selected */
  .wb-img-only { display: none !important; }
  #wb-ctx.img-sel .wb-img-only { display: flex !important; }
  /* arrow/line/connector-only context items */
  .wb-arr-only { display: none !important; }
  #wb-ctx.arr-sel .wb-arr-only { display: flex !important; }
  /* group-only context items hidden by default, shown when grouped strokes selected */
  .wb-grp-only { display: none !important; }
  #wb-ctx.grp-sel .wb-grp-only { display: flex !important; }
  /* shown when 2+ draw/highlighter strokes are selected (can be grouped) */
  .wb-can-group { display: none !important; }
  #wb-ctx.can-group .wb-can-group { display: flex !important; }
  /* rotate/flip items shown for ANY selected shape */
  .wb-rot-only { display: none !important; }
  #wb-ctx.any-sel .wb-rot-only { display: flex !important; }
  /* ── crop modal ── */
  #wb-crop-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,0.72); z-index: 2147483647;
    display: none; align-items: center; justify-content: center; flex-direction: column; gap: 14px;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  #wb-crop-modal.open { display: flex; }
  #wb-crop-title {
    color: rgba(255,255,255,0.92); font-size: 14px; font-weight: 600; letter-spacing: -0.01em;
    font-family: var(--wb-font); display: flex; align-items: center; gap: 10px;
  }
  #wb-crop-canvas { border-radius: 10px; cursor: crosshair; display: block; touch-action: none; }
  #wb-crop-hint { font-size: 11px; color: rgba(255,255,255,0.45); font-family: var(--wb-font); }
  .wb-crop-btns { display: flex; gap: 8px; }
  .wb-modal-btn {
    padding: 8px 20px; border-radius: 10px; border: none; cursor: pointer;
    font-size: 13px; font-weight: 500; font-family: var(--wb-font); letter-spacing: -0.01em;
    transition: opacity 0.12s ease, transform 0.1s ease;
  }
  .wb-modal-btn:hover { opacity: .88; }
  .wb-modal-btn:active { transform: scale(0.96); }
  .wb-modal-btn.primary { background: var(--wb-accent); color: #fff; }
  .wb-modal-btn.ghost { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.85); border: 0.5px solid rgba(255,255,255,0.12); }
  /* ── effects modal ── */
  #wb-fx-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483647;
    display: none; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  #wb-fx-modal.open { display: flex; }
  #wb-fx-inner {
    background: var(--wb-surface-raised); border-radius: var(--wb-radius-lg);
    border: 0.5px solid var(--wb-border);
    padding: 20px 22px; width: 370px;
    max-width: 94vw; max-height: 90vh; overflow-y: auto;
    box-shadow: var(--wb-shadow-lg); font-family: var(--wb-font);
  }
  #wb-fx-inner h3 {
    font-size: 15px; font-weight: 600; color: var(--wb-text); margin: 0 0 14px;
    letter-spacing: -0.02em;
    display: flex; align-items: center; justify-content: space-between;
  }
  .wb-fx-close {
    width: 28px; height: 28px; border: 0.5px solid var(--wb-separator); border-radius: 8px;
    background: var(--wb-hover); cursor: pointer; font-size: 12px; color: var(--wb-text-sec);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s ease;
  }
  .wb-fx-close:hover { background: var(--wb-active); }
  .wb-fx-presets { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
  .wb-fx-preset {
    padding: 4px 11px; border: 1px solid var(--wb-separator); border-radius: 20px;
    background: transparent; cursor: pointer; font-size: 11.5px; font-weight: 500;
    color: var(--wb-text-sec); font-family: var(--wb-font); letter-spacing: -0.01em;
    transition: all 0.12s ease;
  }
  .wb-fx-preset:hover { border-color: var(--wb-accent); color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-fx-preset.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-fx-sep { height: 0.5px; background: var(--wb-separator); margin: 10px 0 10px; }
  .wb-fx-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .wb-fx-lbl { font-size: 11.5px; font-weight: 500; color: var(--wb-text-sec); width: 76px; flex-shrink: 0; letter-spacing: -0.01em; }
  .wb-fx-row input[type=range] { flex: 1; accent-color: var(--wb-accent); cursor: pointer; }
  .wb-fx-val { font-size: 10.5px; color: var(--wb-text-tert); width: 38px; text-align: right; flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .wb-fx-footer { display: flex; gap: 6px; margin-top: 16px; }
  .wb-fx-footer button { flex: 1; padding: 9px 0; border-radius: 10px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; font-family: var(--wb-font); letter-spacing: -0.01em; transition: opacity 0.12s ease; }
  .wb-fx-footer button:hover { opacity: .85; }
  .wb-fx-footer .fx-apply { background: var(--wb-accent); color: #fff; }
  .wb-fx-footer .fx-reset { background: var(--wb-hover); color: var(--wb-text-sec); border: 0.5px solid var(--wb-separator); }
  .wb-fx-footer .fx-cancel { background: var(--wb-hover); color: var(--wb-text-sec); border: 0.5px solid var(--wb-separator); }
  /* ── shapes ── */
  .wb-shape { position: absolute; cursor: move; transform-origin: center center; }
  /* ── eraser cursor override: force cell cursor on ALL interactive elements ── */
  #__wb_overlay__[data-tool="eraser"] .wb-shape,
  #__wb_overlay__[data-tool="eraser"] .wb-shape *,
  #__wb_overlay__[data-tool="eraser"] .wb-rh,
  #__wb_overlay__[data-tool="eraser"] .wb-rot,
  #__wb_overlay__[data-tool="eraser"] .wb-hit { cursor: cell !important; }
  /* ── eraser mode popup — floats above toolbar eraser button ── */
  #wb-eraser-popup {
    position: fixed;
    bottom: calc(28px + 36px + 14px); /* toolbar bottom + btn height + gap */
    left: 50%; /* repositioned via JS */
    transform: translateX(-50%);
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow);
    padding: 10px 10px 8px;
    z-index: 2147483644;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    white-space: nowrap;
    font-family: var(--wb-font);
    /* hidden by default */
    opacity: 0; pointer-events: none;
    translate: 0 4px;
    transition: opacity 0.11s ease, translate 0.11s ease;
  }
  #wb-eraser-popup.visible { opacity: 1; pointer-events: auto; translate: 0 0; }
  /* ── connector options popup ── */
  #wb-connector-popup {
    position: fixed;
    bottom: calc(28px + 36px + 14px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow);
    padding: 10px 12px 10px;
    z-index: 2147483644;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 200px;
    font-family: var(--wb-font);
    /* hidden by default */
    opacity: 0; pointer-events: none;
    translate: 0 4px;
    transition: opacity 0.11s ease, translate 0.11s ease;
  }
  #wb-connector-popup.visible { opacity: 1; pointer-events: auto; translate: 0 0; }
  .wb-conn-row { display: flex; align-items: center; gap: 6px; }
  .wb-conn-lbl { font-size: 9.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--wb-text-tert); width: 38px; flex-shrink: 0; }
  .wb-conn-btn {
    flex: 1; height: 26px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: border-color .12s, background .12s;
  }
  .wb-conn-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-conn-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-conn-btn svg { pointer-events: none; }
  .wb-eraser-row { display: flex; gap: 4px; justify-content: center; }
  .wb-eraser-btn {
    flex: 1; height: 22px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    cursor: pointer; background: transparent; font-size: 10.5px; font-weight: 600;
    color: var(--wb-text-sec); display: flex; align-items: center; justify-content: center;
    font-family: var(--wb-font); letter-spacing: -0.01em;
    transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
  }
  .wb-eraser-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-eraser-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-shape.selected > .wb-inner { outline: 2px solid var(--wb-accent); outline-offset: 2px; border-radius: 3px; }
  .wb-inner { position: relative; width: 100%; height: 100%; }
  .wb-rh {
    position: absolute; width: 8px; height: 8px; background: white;
    border: 2px solid var(--wb-accent); border-radius: 2.5px; z-index: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .wb-rh.tl{top:-5px;left:-5px;cursor:nwse-resize;} .wb-rh.tr{top:-5px;right:-5px;cursor:nesw-resize;}
  .wb-rh.bl{bottom:-5px;left:-5px;cursor:nesw-resize;} .wb-rh.br{bottom:-5px;right:-5px;cursor:nwse-resize;}
  .wb-rh.tm{top:-5px;left:calc(50% - 4px);cursor:ns-resize;} .wb-rh.bm{bottom:-5px;left:calc(50% - 4px);cursor:ns-resize;}
  .wb-rh.ml{top:calc(50% - 4px);left:-5px;cursor:ew-resize;} .wb-rh.mr{top:calc(50% - 4px);right:-5px;cursor:ew-resize;}
  .wb-rot { position:absolute;top:-22px;left:calc(50% - 6px);width:12px;height:12px;
    border-radius:50%;background:white;border:2px solid var(--wb-accent);cursor:grab;z-index:600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  /* ── pages ── */
  #wb-pages {
    position: fixed; bottom: 28px; left: 12px;
    display: flex; gap: 4px; z-index: 2147483643;
  }
  .wb-pgbtn {
    height: 32px; padding: 0 12px; border: 0.5px solid var(--wb-border); border-radius: 10px;
    background: var(--wb-surface); font-size: 12px; font-weight: 500; cursor: pointer;
    color: var(--wb-text); font-family: var(--wb-font); letter-spacing: -0.01em;
    box-shadow: var(--wb-shadow-xs);
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    transition: background 0.12s ease; display:flex;align-items:center;gap:5px;
  }
  .wb-pgbtn:hover { background: var(--wb-surface-raised); }
  .wb-pgbtn.active { background: var(--wb-accent-bg); border-color: var(--wb-accent); color: var(--wb-accent); }
  .wb-pgbtn .wb-pgdel {
    display: none; align-items: center; justify-content: center;
    width: 15px; height: 15px; border-radius: 5px; margin-left: 4px;
    font-size: 10px; line-height: 1; color: var(--wb-text-sec);
    background: transparent; border: none; cursor: pointer; flex-shrink: 0;
    transition: background 0.1s ease, color 0.1s ease;
  }
  .wb-pgbtn:hover .wb-pgdel { display: flex; }
  .wb-pgbtn .wb-pgdel:hover { background: var(--wb-danger-bg); color: var(--wb-danger); }
  /* hide delete on last remaining page */
  #wb-pages.single-page .wb-pgdel { display: none !important; }
  /* highlighter */
  .wb-hl { mix-blend-mode: multiply; }
  #wb-bg-picker {
    position: fixed; bottom: 82px; left: 50%; transform: translateX(-50%);
    background: var(--wb-surface); border: 0.5px solid var(--wb-border); border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow-lg); padding: 14px 16px;
    z-index: 2147483644; display: none; flex-direction: column; gap: 10px; min-width: 260px; max-width: 300px;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    font-family: var(--wb-font);
  }
  #wb-bg-picker.open { display: flex; }
  .wb-bg-section-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .06em; color: var(--wb-text-tert); margin-bottom: 2px;
  }
  /* colour swatches */
  .wb-bgclr {
    width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; flex-shrink: 0; transition: transform 0.12s ease, border-color 0.12s ease;
    outline: none; padding: 0;
  }
  .wb-bgclr:hover { transform: scale(1.18); }
  .wb-bgclr.active { border-color: var(--wb-accent) !important; box-shadow: 0 0 0 2px var(--wb-accent-bg); }
  /* custom colour swatch wrapper */
  .wb-bgclr-custom {
    width: 26px; height: 26px; border-radius: 50%; border: 2px dashed var(--wb-separator);
    cursor: pointer; flex-shrink: 0; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.12s ease, transform 0.12s ease;
    color: var(--wb-text-tert);
  }
  .wb-bgclr-custom:hover { border-color: var(--wb-accent); transform: scale(1.12); }
  .wb-bgclr-custom input[type=color] {
    position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px);
    border: none; cursor: pointer; opacity: 0;
  }
  .wb-bgclr-custom svg { pointer-events: none; }
  /* pattern buttons */
  .wb-bgpat {
    width: 44px; height: 36px; border: 1.5px solid var(--wb-separator); border-radius: 10px;
    cursor: pointer; background: transparent; display: flex; align-items: center;
    justify-content: center; transition: border-color 0.12s ease, background 0.12s ease;
    padding: 0; overflow: hidden; flex-shrink: 0;
  }
  .wb-bgpat:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-bgpat.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-bgpat svg { pointer-events: none; }
  /* ── keyboard shortcuts help panel ── */
  #wb-kbd-help {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    z-index: 2147483647; display: none; align-items: center; justify-content: center;
  }
  #wb-kbd-help.open { display: flex; }
  #wb-kbd-inner {
    background: var(--wb-surface-raised); border-radius: var(--wb-radius-lg);
    border: 0.5px solid var(--wb-border);
    box-shadow: var(--wb-shadow-lg); padding: 24px 28px;
    max-width: 660px; width: 90vw; max-height: 82vh; overflow-y: auto;
    font-family: var(--wb-font);
  }
  #wb-kbd-inner h2 {
    font-size: 16px; font-weight: 600; color: var(--wb-text); margin: 0 0 18px;
    letter-spacing: -0.02em;
    display: flex; align-items: center; justify-content: space-between;
  }
  #wb-kbd-close {
    width: 28px; height: 28px; border: 0.5px solid var(--wb-separator); border-radius: 8px;
    background: var(--wb-hover); cursor: pointer; font-size: 12px; color: var(--wb-text-sec);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s ease;
  }
  #wb-kbd-close:hover { background: var(--wb-active); }
  .wb-kbd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; }
  @media (max-width: 520px) { .wb-kbd-grid { grid-template-columns: 1fr; } }
  .wb-kbd-sec { margin-bottom: 14px; }
  .wb-kbd-sec h3 {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .06em; color: var(--wb-text-tert); margin: 0 0 6px;
  }
  .wb-kbd-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 0; border-bottom: 0.5px solid var(--wb-separator); gap: 8px;
  }
  .wb-kbd-row:last-child { border-bottom: none; }
  .wb-kbd-desc { font-size: 12px; color: var(--wb-text-sec); letter-spacing: -0.01em; }
  .wb-kbd-keys { display: flex; gap: 3px; flex-shrink: 0; }
  kbd {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--wb-hover); border: 0.5px solid var(--wb-separator);
    border-bottom: 2px solid var(--wb-separator);
    border-radius: 6px; padding: 1px 6px; font-size: 10.5px; font-weight: 500;
    color: var(--wb-text-sec); font-family: var(--wb-font); white-space: nowrap; min-width: 20px;
  }
  /* ── custom brush modal ── */
  #wb-brush-modal {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483647;
    display: none; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  #wb-brush-modal.open { display: flex; }
  #wb-brush-inner {
    background: var(--wb-surface-raised); border-radius: var(--wb-radius-lg);
    border: 0.5px solid var(--wb-border);
    padding: 20px 22px; width: 340px;
    max-width: 94vw; box-shadow: var(--wb-shadow-lg);
    display: flex; flex-direction: column; gap: 12px; font-family: var(--wb-font);
  }
  #wb-brush-inner h3 {
    font-size: 15px; font-weight: 600; color: var(--wb-text); margin: 0; letter-spacing: -0.01em;
    display: flex; align-items: center; justify-content: space-between;
  }
  #wb-brush-canvas {
    border: 0.5px solid var(--wb-border); border-radius: 10px; cursor: crosshair;
    display: block; touch-action: none; background: var(--wb-bg);
    width: 100%; height: 160px;
  }
  #wb-brush-hint { font-size: 11px; color: var(--wb-text-tert); text-align: center; }
  /* brush mode tabs */
  #wb-brush-tabs { display: flex; gap: 5px; }
  .wb-brush-tab {
    flex: 1; height: 28px; border: 1.5px solid var(--wb-separator); border-radius: 8px;
    cursor: pointer; background: transparent; font-size: 11.5px; font-weight: 600;
    color: var(--wb-text-sec); font-family: var(--wb-font); letter-spacing: -0.01em;
    transition: all 0.12s ease;
  }
  .wb-brush-tab:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-brush-tab.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  /* text/emoji brush pane */
  #wb-brush-text-pane { display: none; flex-direction: column; gap: 8px; }
  #wb-brush-text-pane.visible { display: flex; }
  #wb-brush-text-inp {
    width: 100%; padding: 8px 12px; border: 1.5px solid var(--wb-separator); border-radius: 10px;
    background: var(--wb-hover); color: var(--wb-text); font-size: 22px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI Emoji', sans-serif;
    text-align: center; outline: none; box-sizing: border-box;
    transition: border-color 0.12s ease;
  }
  #wb-brush-text-inp:focus { border-color: var(--wb-accent); }
  #wb-brush-text-inp::placeholder { font-size: 14px; color: var(--wb-text-tert); }
  #wb-brush-text-preview {
    height: 80px; display: flex; align-items: center; justify-content: center;
    background: var(--wb-bg); border-radius: 10px; border: 0.5px solid var(--wb-border);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI Emoji', sans-serif;
    user-select: none;
  }
  .wb-brush-size-row { display: flex; align-items: center; gap: 8px; }
  .wb-brush-size-row span { font-size: 10.5px; color: var(--wb-text-tert); white-space: nowrap; font-family: var(--wb-font); }
  .wb-brush-size-row input[type=range] { flex: 1; accent-color: var(--wb-accent); cursor: pointer; }
  .wb-brush-btns { display: flex; gap: 8px; }
  #wb-brush-clear { flex: 1; padding: 9px 0; border-radius: 10px; border: 0.5px solid var(--wb-separator); cursor: pointer; font-size: 12.5px; font-weight: 500; background: var(--wb-hover); color: var(--wb-text-sec); font-family: var(--wb-font); transition: background 0.12s ease; }
  #wb-brush-clear:hover { background: var(--wb-active); }
  #wb-brush-save  { flex: 2; padding: 9px 0; border-radius: 10px; border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; background: var(--wb-accent); color: #fff; font-family: var(--wb-font); transition: opacity 0.12s ease; }
  #wb-brush-save:hover { opacity: 0.88; }
  #wb-brush-cancel { flex: 1; padding: 9px 0; border-radius: 10px; border: 0.5px solid var(--wb-separator); cursor: pointer; font-size: 12.5px; font-weight: 500; background: var(--wb-hover); color: var(--wb-text-sec); font-family: var(--wb-font); transition: background 0.12s ease; }
  #wb-brush-cancel:hover { background: var(--wb-active); }
  /* saved custom brushes row */
  #wb-custom-brushes { display: flex; flex-wrap: wrap; gap: 4px; min-height: 0; justify-content: center; }
  #wb-custom-brushes:not(:empty) { margin-top: 2px; }
  .wb-custbtn {
    width: 30px; height: 30px; border: 1px solid var(--wb-separator); border-radius: 8px;
    cursor: pointer; background: var(--wb-hover); display: flex; align-items: center;
    justify-content: center; transition: border-color 0.12s ease, background 0.12s ease; flex-shrink: 0;
    padding: 0; overflow: hidden; position: relative;
  }
  .wb-custbtn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); }
  .wb-custbtn.active { border-color: var(--wb-accent); background: var(--wb-accent-deep); }
  .wb-custbtn canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
  .wb-custbtn .wb-del-cust {
    position: absolute; top: -3px; right: -3px; width: 13px; height: 13px;
    background: var(--wb-danger); color: #fff; border-radius: 50%; font-size: 8px;
    line-height: 13px; text-align: center; display: none; cursor: pointer; z-index: 2;
  }
  .wb-custbtn:hover .wb-del-cust { display: block; }
  /* ── connector bend handle (diamond) ── */
  .wb-arr-bend { cursor: grab; }
  /* ── fill bucket cursor ── */
  #__wb_overlay__[data-tool="fill"] #wb-canvas-container { cursor: cell; }
  #__wb_overlay__[data-tool="fill"] .wb-shape,
  #__wb_overlay__[data-tool="fill"] .wb-shape * { cursor: cell !important; }
  /* ── fill tool popup ── */
  #wb-fill-popup {
    position: fixed;
    bottom: 82px;
    left: -9999px;
    transform: none;
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow);
    padding: 10px 12px 10px;
    z-index: 2147483645;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 200px;
    font-family: var(--wb-font);
    /* hidden by default */
    opacity: 0; pointer-events: none;
    translate: 0 4px;
    transition: opacity 0.11s ease, translate 0.11s ease;
  }
  #wb-fill-popup.visible {
    opacity: 1; pointer-events: auto; translate: 0 0;
  }
  #wb-fill-color-row { display: flex; align-items: center; gap: 8px; }
  #wb-fill-preview-swatch {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--wb-separator);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    transition: background 0.15s ease;
  }
  #wb-fill-hint { font-size: 11px; color: var(--wb-text-sec); letter-spacing: -0.01em; }
  .wb-fill-tol-row { display: flex; align-items: center; gap: 6px; }
  #wb-fill-tolerance {
    -webkit-appearance: none; flex: 1; height: 3px; border-radius: 2px; outline: none;
    cursor: pointer; accent-color: var(--wb-accent);
    background: linear-gradient(to right, var(--wb-accent) 0%, var(--wb-accent) var(--pct,23%), var(--wb-separator) var(--pct,23%), var(--wb-separator) 100%);
  }
  #wb-fill-tolerance::-webkit-slider-thumb {
    -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
    background: var(--wb-surface-solid); border: 2px solid var(--wb-accent);
    box-shadow: 0 1px 3px rgba(0,0,0,0.18);
  }
  #wb-fill-tol-val { font-size: 10px; color: var(--wb-text-tert); width: 24px; text-align: right; flex-shrink: 0; font-family: var(--wb-font); }
  /* ── text options popup ── */
  #wb-text-popup {
    position: fixed;
    bottom: calc(28px + 36px + 14px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--wb-surface);
    border: 0.5px solid var(--wb-border);
    border-radius: var(--wb-radius);
    box-shadow: var(--wb-shadow);
    padding: 10px 12px 10px;
    z-index: 2147483644;
    backdrop-filter: var(--wb-blur); -webkit-backdrop-filter: var(--wb-blur);
    display: flex; flex-direction: column; gap: 8px;
    min-width: 238px; font-family: var(--wb-font);
    /* hidden by default */
    opacity: 0; pointer-events: none;
    translate: 0 4px;
    transition: opacity 0.11s ease, translate 0.11s ease;
  }
  #wb-text-popup.visible { opacity: 1; pointer-events: auto; translate: 0 0; }
  /* caret arrows pointing down to toolbar for all four popovers */
  #wb-eraser-popup::after, #wb-connector-popup::after,
  #wb-fill-popup::after,   #wb-text-popup::after {
    content: ''; position: absolute;
    top: 100%; left: 50%; transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--wb-border); margin-top: -0.5px;
    pointer-events: none;
  }
  #wb-eraser-popup::before, #wb-connector-popup::before,
  #wb-fill-popup::before,   #wb-text-popup::before {
    content: ''; position: absolute;
    top: 100%; left: 50%; transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--wb-surface); z-index: 1;
    pointer-events: none;
  }
  .wb-text-font-row { display: flex; gap: 3px; }
  .wb-text-font-btn {
    flex: 1; height: 26px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    background: transparent; cursor: pointer; font-size: 11px; font-weight: 500;
    color: var(--wb-text-sec); letter-spacing: -0.01em; white-space: nowrap;
    transition: border-color .12s, background .12s, color .12s;
  }
  .wb-text-font-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-font-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-fmt-row { display: flex; gap: 3px; align-items: center; }
  .wb-text-fmt-btn {
    width: 28px; height: 26px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    background: transparent; cursor: pointer; font-size: 13px; font-weight: 700;
    color: var(--wb-text-sec); display: flex; align-items: center; justify-content: center;
    font-family: var(--wb-font); transition: border-color .12s, background .12s, color .12s;
  }
  .wb-text-fmt-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-fmt-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-align-btn {
    width: 28px; height: 26px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--wb-text-sec); transition: border-color .12s, background .12s, color .12s;
  }
  .wb-text-align-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-align-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-popup-sep { height: 0.5px; background: var(--wb-separator); margin: 0 -2px; }
  .wb-text-lh-row { display: flex; gap: 3px; }
  .wb-text-lh-btn {
    flex: 1; height: 26px; border: 1.5px solid var(--wb-separator); border-radius: 7px;
    background: transparent; cursor: pointer; font-size: 10.5px; font-weight: 600;
    color: var(--wb-text-sec); display: flex; align-items: center; justify-content: center;
    gap: 4px; transition: border-color .12s, background .12s, color .12s; letter-spacing: -0.01em;
  }
  .wb-text-lh-btn:hover { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  .wb-text-lh-btn.active { border-color: var(--wb-accent); background: var(--wb-accent-bg); color: var(--wb-accent); }
  /* ── gradient panel in style panel ── */
  #wb-gradient-panel { display:none; flex-direction:column; gap:5px; margin-top:2px; }
  #wb-gradient-panel.visible { display:flex; }
  #wb-grad-end-row { display:flex; flex-wrap:wrap; gap:4px; }
  .wb-grad-swatch {
    width:18px; height:18px; border-radius:50%; cursor:pointer; flex-shrink:0;
    border:2px solid transparent; outline:1px solid rgba(0,0,0,.08); outline-offset:0;
    transition:transform .1s, border-color .1s;
  }
  .wb-grad-swatch:hover { transform:scale(1.18); }
  .wb-grad-swatch.active { border-color:var(--wb-accent); outline-color:var(--wb-accent); }
  .wb-grad-swatch[data-gc="transparent"] {
    background: repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0/8px 8px;
  }
  #wb-grad-dir-grid {
    display:grid; grid-template-columns:repeat(3,1fr); gap:3px; width:80px;
  }
  .wb-grad-dir {
    height:24px; border:1.5px solid var(--wb-separator); border-radius:6px;
    background:transparent; cursor:pointer; font-size:12px;
    color:var(--wb-text-sec); display:flex; align-items:center; justify-content:center;
    transition:border-color .1s, background .1s, color .1s; line-height:1;
  }
  .wb-grad-dir:hover  { border-color:var(--wb-accent); background:var(--wb-accent-bg); color:var(--wb-accent); }
  .wb-grad-dir.active { border-color:var(--wb-accent); background:var(--wb-accent-bg); color:var(--wb-accent); }
  .wb-grad-center { display:flex; align-items:center; justify-content:center; font-size:9px; color:var(--wb-text-tert); }
  #wb-grad-preview {
    height:18px; border-radius:4px; margin-top:2px; flex-shrink:0;
    border:0.5px solid var(--wb-separator);
    transition:background .2s;
  }
  `;
  document.head.appendChild(styleEl);

  // ── DOM SHELL ──────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = '__wb_overlay__';
  overlay.innerHTML = `
  <div id="wb-canvas-container">
    <div id="wb-canvas">
      <svg id="wb-draw-svg" xmlns="http://www.w3.org/2000/svg"></svg>
      <!-- Live-stroke SVG gets its own GPU compositor layer (will-change:transform)
           so every rAF setAttribute on the in-progress stroke doesn't repaint
           the finalized-stroke SVG (wb-draw-svg). -->
      <svg id="wb-live-svg" xmlns="http://www.w3.org/2000/svg"></svg>
      <svg id="wb-arrow-svg" xmlns="http://www.w3.org/2000/svg" style="z-index:480;"></svg>
      <div id="wb-sel-rect"></div>
      <svg id="wb-laser-trail" xmlns="http://www.w3.org/2000/svg"></svg>
      <div id="wb-laser"></div>
    </div>
  </div>

  <!-- TOPBAR -->
  <div id="wb-topbar">
    <button class="wb-topbtn" id="wb-undo" disabled>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a7 7 0 0 1 0 14H9m-6-4 4-4-4-4"/></svg>Undo
    </button>
    <button class="wb-topbtn" id="wb-redo" disabled>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H11a7 7 0 0 0 0 14h4m6-4-4-4 4-4"/></svg>Redo
    </button>
    <div class="wb-top-divider"></div>
    <button class="wb-topbtn" id="wb-export">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Save PNG
    </button>
    <div class="wb-top-divider"></div>
    <button class="wb-topbtn" id="wb-clear">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Clear
    </button>
    <div class="wb-top-divider"></div>
    <button class="wb-topbtn" id="wb-bgpicker">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="8" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none"/></svg>Board
    </button>
    <button class="wb-topbtn" id="wb-snap-btn" title="Snap to grid (G)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="4" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="20" cy="20" r="1.5" fill="currentColor" stroke="none"/></svg>Snap
    </button>
  </div>

  <!-- BOARD BG PICKER -->
  <div id="wb-bg-picker"></div>

  <!-- TOOLBAR -->
  <div id="wb-toolbar">
    <button class="wb-tbtn active" data-tool="select" data-tip="Select (V)"><svg width="15" height="15" viewBox="0 0 16 16"><path d="M3 1l10 6.5-5 1L6 14 3 1z" fill="currentColor"/></svg></button>
    <button class="wb-tbtn" data-tool="hand" data-tip="Hand (H)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-4 0v0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg></button>
    <div class="wb-divider"></div>
    <button class="wb-tbtn" data-tool="draw" data-tip="Pencil (P)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
    <button class="wb-tbtn" data-tool="highlighter" data-tip="Highlighter (I)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg></button>
    <button class="wb-tbtn" data-tool="eraser" data-tip="Eraser (E)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7m5-11 4.9 4.9"/></svg></button>
    <button class="wb-tbtn" data-tool="fill" data-tip="Fill (B)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 11-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11Z"/><path d="m22 12-4.5-4.5"/><circle cx="20.5" cy="18.5" r="2.5" fill="currentColor" stroke="none"/></svg></button>
    <div class="wb-divider"></div>
    <button class="wb-tbtn" data-tool="rect" data-tip="Rectangle (R)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></button>
    <button class="wb-tbtn" data-tool="ellipse" data-tip="Ellipse (O)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="10"/></svg></button>
    <button class="wb-tbtn" data-tool="triangle" data-tip="Triangle"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 21h20L12 3z"/></svg></button>
    <button class="wb-tbtn" data-tool="diamond" data-tip="Diamond"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 12l10 10 10-10L12 2z"/></svg></button>
    <button class="wb-tbtn" data-tool="star" data-tip="Star"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
    <button class="wb-tbtn" data-tool="hexagon" data-tip="Hexagon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></button>
    <button class="wb-tbtn" data-tool="callout" data-tip="Callout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
    <div class="wb-divider"></div>
    <button class="wb-tbtn" data-tool="arrow" data-tip="Arrow (A)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></button>
    <button class="wb-tbtn" data-tool="line" data-tip="Line (L)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19 19 5"/></svg></button>
    <button class="wb-tbtn" data-tool="connector" data-tip="Connector (C)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"/><path d="M5 5l14 14"/></svg></button>
    <div class="wb-divider"></div>
    <button class="wb-tbtn" data-tool="text" data-tip="Text (T)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></button>
    <button class="wb-tbtn" data-tool="sticky" data-tip="Sticky (S)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg></button>
    <button class="wb-tbtn" data-tool="image" data-tip="Image"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></button>
    <div class="wb-divider"></div>
    <button class="wb-tbtn" data-tool="laser" data-tip="Laser"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg></button>
    <button class="wb-tbtn" data-tool="frame" data-tip="Frame (F)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg></button>
  </div>

  <!-- ERASER MODE POPOVER -->
  <div id="wb-eraser-popup">
    <div class="wb-plabel" style="margin-bottom:5px;">Eraser Mode</div>
    <div class="wb-eraser-row">
      <button class="wb-eraser-btn active" id="wb-eraser-obj" title="Delete the whole object">&#x229E; Object</button>
      <button class="wb-eraser-btn" id="wb-eraser-px" title="Erase pixels / portions of strokes">&#x270F; Pixel</button>
    </div>
  </div>

  <!-- CONNECTOR OPTIONS POPOVER -->
  <div id="wb-connector-popup">
    <div class="wb-plabel" style="margin-bottom:2px;">Connector</div>
    <div class="wb-conn-row" id="wb-conn-line-row">
      <span class="wb-conn-lbl">Line</span>
    </div>
    <div class="wb-conn-row" id="wb-conn-start-row">
      <span class="wb-conn-lbl">Start</span>
    </div>
    <div class="wb-conn-row" id="wb-conn-end-row">
      <span class="wb-conn-lbl">End</span>
    </div>
  </div>

  <!-- FILL TOOL POPUP -->
  <div id="wb-fill-popup">
    <div class="wb-plabel" style="margin-bottom:1px;">Fill Bucket</div>
    <div id="wb-fill-color-row">
      <div id="wb-fill-preview-swatch"></div>
      <span id="wb-fill-hint">Click shape or enclosed area</span>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:0;"></div>
    <div class="wb-plabel" style="margin-bottom:1px;">Tolerance</div>
    <div class="wb-fill-tol-row">
      <input type="range" id="wb-fill-tolerance" min="0" max="120" value="30">
      <span id="wb-fill-tol-val">30</span>
    </div>
  </div>

  <!-- TEXT OPTIONS POPOVER -->
  <div id="wb-text-popup">
    <div class="wb-plabel" style="margin-bottom:2px;">Font</div>
    <div class="wb-text-font-row">
      <button class="wb-text-font-btn active" data-font="system" style="font-family:-apple-system,system-ui,sans-serif;">Sans</button>
      <button class="wb-text-font-btn" data-font="serif" style="font-family:Georgia,serif;">Serif</button>
      <button class="wb-text-font-btn" data-font="mono" style="font-family:Menlo,'Courier New',monospace;letter-spacing:-0.04em;">Mono</button>
      <button class="wb-text-font-btn" data-font="cursive" style="font-family:cursive;font-size:13px;">Script</button>
    </div>
    <div class="wb-text-popup-sep"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
      <div class="wb-text-fmt-row">
        <button class="wb-text-fmt-btn" id="wb-text-bold" title="Bold"><b>B</b></button>
        <button class="wb-text-fmt-btn" id="wb-text-italic" title="Italic" style="font-style:italic;font-weight:600;"><i style="font-style:italic;">I</i></button>
        <button class="wb-text-fmt-btn" id="wb-text-underline" title="Underline" style="text-decoration:underline;font-size:12px;">U</button>
        <button class="wb-text-fmt-btn" id="wb-text-strike" title="Strikethrough" style="text-decoration:line-through;font-size:12px;">S</button>
      </div>
      <div class="wb-text-fmt-row">
        <button class="wb-text-align-btn active" data-align="left" title="Align Left">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="4.5" x2="9" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="7.5" x2="14" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="10.5" x2="9" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="wb-text-align-btn" data-align="center" title="Center">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2.5" y1="4.5" x2="11.5" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="7.5" x2="14" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2.5" y1="10.5" x2="11.5" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="wb-text-align-btn" data-align="right" title="Align Right">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="4.5" x2="14" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="0" y1="7.5" x2="14" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="10.5" x2="14" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="wb-text-popup-sep"></div>
    <div class="wb-plabel" style="margin-bottom:2px;">Line Height</div>
    <div class="wb-text-lh-row">
      <button class="wb-text-lh-btn" data-lh="1.2" title="Compact">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><line x1="0" y1="2" x2="12" y2="2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="5" x2="12" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        Compact
      </button>
      <button class="wb-text-lh-btn active" data-lh="1.5" title="Normal">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><line x1="0" y1="1.5" x2="12" y2="1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="5.5" x2="12" y2="5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="9.5" x2="12" y2="9.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        Normal
      </button>
      <button class="wb-text-lh-btn" data-lh="2.0" title="Relaxed">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        Relaxed
      </button>
    </div>
  </div>

  <!-- STYLE PANEL -->
  <div id="wb-style-panel">
    <div class="wb-plabel">Color</div>
    <div class="wb-color-row" id="wb-color-row">
      <!-- swatches injected by JS; custom color wheel appended after -->
    </div>
    <div id="wb-saved-colors"></div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Fill</div>
    <div class="wb-color-row" id="wb-fill-row"></div>
    <div id="wb-fill-saved-colors"></div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Fill Style</div>
    <div class="wb-fill-row">
      <button class="wb-fbtn active" data-fillst="none" title="None">○</button>
      <button class="wb-fbtn" data-fillst="solid" title="Solid">■</button>
      <button class="wb-fbtn" data-fillst="semi" title="Semi">◨</button>
      <button class="wb-fbtn" data-fillst="gradient-linear" title="Linear gradient">
        <svg width="13" height="9" viewBox="0 0 13 9" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="wb-icon-lg" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="currentColor"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.08"/></linearGradient></defs>
          <rect x="0.5" y="0.5" width="12" height="8" rx="1.5" fill="url(#wb-icon-lg)" stroke="currentColor" stroke-width="0.75" stroke-opacity="0.5"/>
        </svg>
      </button>
      <button class="wb-fbtn" data-fillst="gradient-radial" title="Radial gradient">
        <svg width="13" height="9" viewBox="0 0 13 9" xmlns="http://www.w3.org/2000/svg">
          <defs><radialGradient id="wb-icon-rg" cx="38%" cy="38%" r="65%" gradientUnits="objectBoundingBox"><stop offset="0%" stop-color="currentColor"/><stop offset="100%" stop-color="currentColor" stop-opacity="0.08"/></radialGradient></defs>
          <rect x="0.5" y="0.5" width="12" height="8" rx="4" fill="url(#wb-icon-rg)" stroke="currentColor" stroke-width="0.75" stroke-opacity="0.5"/>
        </svg>
      </button>
    </div>
    <!-- gradient controls: visible only when gradient-linear or gradient-radial is active -->
    <div id="wb-gradient-panel">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:2px;">
        <div style="flex:1;min-width:0;">
          <div class="wb-plabel" style="margin-bottom:3px;">End Color</div>
          <div id="wb-grad-end-row"></div>
        </div>
        <div id="wb-grad-dir-wrap" style="flex-shrink:0;">
          <div class="wb-plabel" style="margin-bottom:3px;">Direction</div>
          <div id="wb-grad-dir-grid">
            <button class="wb-grad-dir" data-dir="225" title="↖">↖</button>
            <button class="wb-grad-dir" data-dir="180" title="↑">↑</button>
            <button class="wb-grad-dir" data-dir="135" title="↗">↗</button>
            <button class="wb-grad-dir" data-dir="270" title="←">←</button>
            <div class="wb-grad-center">◎</div>
            <button class="wb-grad-dir" data-dir="90"  title="→">→</button>
            <button class="wb-grad-dir" data-dir="315" title="↙">↙</button>
            <button class="wb-grad-dir" data-dir="0"   title="↓">↓</button>
            <button class="wb-grad-dir" data-dir="45"  title="↘">↘</button>
          </div>
        </div>
      </div>
      <div id="wb-grad-preview"></div>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Size</div>
    <div class="wb-size-row">
      <button class="wb-sbtn s1 active" data-sz="1"><div class="wb-sdot"></div></button>
      <button class="wb-sbtn s2" data-sz="2"><div class="wb-sdot"></div></button>
      <button class="wb-sbtn s3" data-sz="3"><div class="wb-sdot"></div></button>
      <button class="wb-sbtn s4" data-sz="4"><div class="wb-sdot"></div></button>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Dash</div>
    <div class="wb-dash-row">
      <button class="wb-dbtn active" data-dash="solid"><svg viewBox="0 0 32 4" width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2"/></svg></button>
      <button class="wb-dbtn" data-dash="dashed"><svg viewBox="0 0 32 4" width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="6 3"/></svg></button>
      <button class="wb-dbtn" data-dash="dotted"><svg viewBox="0 0 32 4" width="32" height="4"><line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="2 3"/></svg></button>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Opacity</div>
    <div class="wb-op-row">
      <input type="range" id="wb-opacity" min="10" max="100" value="100">
      <span id="wb-op-val" style="font-size:10.5px;color:var(--wb-text-tert);font-family:var(--wb-font);">100%</span>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Stroke Effect</div>
    <div class="wb-eff-row" id="wb-eff-row">
      <button class="wb-effbtn active" data-eff="none">—&nbsp;None</button>
      <button class="wb-effbtn" data-eff="glow">✦ Glow</button>
      <button class="wb-effbtn" data-eff="neon">⚡ Neon</button>
      <button class="wb-effbtn" data-eff="chalk">≈ Chalk</button>
      <button class="wb-effbtn" data-eff="shadow">◫ Shadow</button>
      <button class="wb-effbtn" data-eff="blur">◌ Blur</button>
      <button class="wb-effbtn" data-eff="rough">≋ Rough</button>
      <button class="wb-effbtn" data-eff="outline">◻ Outline</button>
      <button class="wb-effbtn" data-eff="fire">🔥 Fire</button>
      <button class="wb-effbtn" data-eff="ice">❄ Ice</button>
      <button class="wb-effbtn" data-eff="emboss">◈ Emboss</button>
      <button class="wb-effbtn" data-eff="glitter">✦✦ Glitter</button>
      <button class="wb-effbtn" data-eff="vintage">◐ Vintage</button>
    </div>
    <div style="height:0.5px;background:var(--wb-separator);margin:3px 0;"></div>
    <div class="wb-plabel">Pattern Brush</div>
    <div class="wb-eff-row" id="wb-pat-row">
      <button class="wb-patbtn active" data-pat="none" title="None"><svg width="18" height="10" viewBox="0 0 18 10"><line x1="1" y1="5" x2="17" y2="5" stroke="#475569" stroke-width="2" stroke-linecap="round"/></svg></button>
      <button class="wb-patbtn" data-pat="dots" title="Dots"><svg width="18" height="10" viewBox="0 0 18 10"><circle cx="3" cy="5" r="2" fill="#475569"/><circle cx="9" cy="5" r="2" fill="#475569"/><circle cx="15" cy="5" r="2" fill="#475569"/></svg></button>
      <button class="wb-patbtn" data-pat="rings" title="Rings"><svg width="18" height="10" viewBox="0 0 18 10"><circle cx="3" cy="5" r="2.2" fill="none" stroke="#475569" stroke-width="1.2"/><circle cx="9" cy="5" r="2.2" fill="none" stroke="#475569" stroke-width="1.2"/><circle cx="15" cy="5" r="2.2" fill="none" stroke="#475569" stroke-width="1.2"/></svg></button>
      <button class="wb-patbtn" data-pat="stars" title="Stars"><svg width="18" height="10" viewBox="0 0 18 10"><polygon points="3,2 4,5 7,5 4.5,7 5.5,10 3,8 0.5,10 1.5,7 -1,5 2,5" transform="scale(0.6) translate(1,0)" fill="#475569"/><polygon points="3,2 4,5 7,5 4.5,7 5.5,10 3,8 0.5,10 1.5,7 -1,5 2,5" transform="scale(0.6) translate(10,0)" fill="#475569"/><polygon points="3,2 4,5 7,5 4.5,7 5.5,10 3,8 0.5,10 1.5,7 -1,5 2,5" transform="scale(0.6) translate(19,0)" fill="#475569"/></svg></button>
      <button class="wb-patbtn" data-pat="diamonds" title="Diamonds"><svg width="18" height="10" viewBox="0 0 18 10"><polygon points="3,1 5.5,5 3,9 0.5,5" fill="#475569"/><polygon points="9,1 11.5,5 9,9 6.5,5" fill="#475569"/><polygon points="15,1 17.5,5 15,9 12.5,5" fill="#475569"/></svg></button>
      <button class="wb-patbtn" data-pat="arrows" title="Arrows"><svg width="18" height="10" viewBox="0 0 18 10"><path d="M1 5h5M3 2.5l3 2.5-3 2.5" stroke="#475569" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M7 5h5M9 2.5l3 2.5-3 2.5" stroke="#475569" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M13 5h5M15 2.5l3 2.5-3 2.5" stroke="#475569" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg></button>
      <button class="wb-patbtn" data-pat="zigzag" title="Zigzag"><svg width="18" height="10" viewBox="0 0 18 10"><polyline points="0,8 4.5,2 9,8 13.5,2 18,8" fill="none" stroke="#475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="wb-patbtn" data-pat="cross" title="Crosses"><svg width="18" height="10" viewBox="0 0 18 10"><line x1="3" y1="2" x2="3" y2="8" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/><line x1="0" y1="5" x2="6" y2="5" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/><line x1="9" y1="2" x2="9" y2="8" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/><line x1="6" y1="5" x2="12" y2="5" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="8" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/><line x1="12" y1="5" x2="18" y2="5" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      <button class="wb-patbtn" data-pat="hearts" title="Hearts"><svg width="18" height="10" viewBox="0 0 18 10"><path d="M3 7 C3 7 0.5 5 0.5 3.2 C0.5 1.8 1.5 1 2.5 1.5 C3 1.8 3 1.8 3 1.8 C3 1.8 3 1.8 3.5 1.5 C4.5 1 5.5 1.8 5.5 3.2 C5.5 5 3 7 3 7Z" fill="#475569"/><path d="M9 7 C9 7 6.5 5 6.5 3.2 C6.5 1.8 7.5 1 8.5 1.5 C9 1.8 9 1.8 9 1.8 C9 1.8 9 1.8 9.5 1.5 C10.5 1 11.5 1.8 11.5 3.2 C11.5 5 9 7 9 7Z" fill="#475569"/><path d="M15 7 C15 7 12.5 5 12.5 3.2 C12.5 1.8 13.5 1 14.5 1.5 C15 1.8 15 1.8 15 1.8 C15 1.8 15 1.8 15.5 1.5 C16.5 1 17.5 1.8 17.5 3.2 C17.5 5 15 7 15 7Z" fill="#475569"/></svg></button>
      <button class="wb-patbtn" data-pat="spray" title="Spray"><svg width="18" height="10" viewBox="0 0 18 10"><circle cx="2" cy="3" r="1" fill="#475569"/><circle cx="5" cy="7" r="0.8" fill="#475569"/><circle cx="7" cy="2" r="1.1" fill="#475569"/><circle cx="10" cy="6" r="0.7" fill="#475569"/><circle cx="13" cy="4" r="1" fill="#475569"/><circle cx="15" cy="8" r="0.8" fill="#475569"/><circle cx="16" cy="2" r="0.9" fill="#475569"/><circle cx="4" cy="9" r="0.6" fill="#475569"/><circle cx="11" cy="1" r="0.7" fill="#475569"/></svg></button>
      <button class="wb-patbtn" id="wb-brush-new-btn" title="Draw custom brush" style="border-color:var(--wb-accent);color:var(--wb-accent);">
        <svg width="18" height="10" viewBox="0 0 18 10"><line x1="9" y1="1" x2="9" y2="9" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="5" x2="14" y2="5" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div id="wb-custom-brushes"></div>
  </div>

  <!-- CUSTOM BRUSH MODAL -->
  <div id="wb-brush-modal">
    <div id="wb-brush-inner">
      <h3>Custom Brush Stamp
        <button id="wb-brush-cancel" style="width:28px;height:28px;border:0.5px solid var(--wb-separator);border-radius:8px;background:var(--wb-hover);cursor:pointer;font-size:12px;color:var(--wb-text-sec);display:flex;align-items:center;justify-content:center;transition:background 0.12s;">✕</button>
      </h3>
      <!-- Mode tabs -->
      <div id="wb-brush-tabs">
        <button class="wb-brush-tab active" data-brushmode="draw">✏ Draw</button>
        <button class="wb-brush-tab" data-brushmode="text">T Text / Emoji</button>
      </div>
      <!-- Draw pane -->
      <div id="wb-brush-draw-pane">
        <div id="wb-brush-hint">Draw your stamp shape below — it repeats along your stroke</div>
        <canvas id="wb-brush-canvas" width="280" height="160"></canvas>
      </div>
      <!-- Text / Emoji pane -->
      <div id="wb-brush-text-pane">
        <div style="font-size:11px;color:var(--wb-text-tert);text-align:center;">Type text or paste an emoji — it repeats along your stroke</div>
        <input id="wb-brush-text-inp" type="text" placeholder="e.g. ★ or 🎉 or Hi" maxlength="12" autocomplete="off" spellcheck="false">
        <div id="wb-brush-text-preview"><span id="wb-brush-text-prev-inner" style="font-size:48px;">★</span></div>
        <div class="wb-brush-size-row">
          <span>Size</span>
          <input type="range" id="wb-brush-text-size" min="8" max="72" value="28">
          <span id="wb-brush-text-size-val">28px</span>
        </div>
      </div>
      <div class="wb-brush-btns">
        <button id="wb-brush-clear">Clear</button>
        <button id="wb-brush-save">Save Brush</button>
      </div>
    </div>
  </div>

  <!-- ZOOM -->
  <div id="wb-zoom-ctrl">
    <button class="wb-zbtn" id="wb-zin">+</button>
    <div id="wb-zoom-lbl">100%</div>
    <button class="wb-zbtn" id="wb-zout">−</button>
    <button class="wb-zbtn" id="wb-zfit" style="font-size:11px;font-weight:600;font-family:var(--wb-font);letter-spacing:-0.01em;">⊡</button>
    <button class="wb-zbtn" id="wb-z1" style="font-size:10px;font-weight:600;font-family:var(--wb-font);letter-spacing:-0.01em;">1:1</button>
  </div>

  <!-- PAGES -->
  <div id="wb-pages">
    <button class="wb-pgbtn active" data-pgidx="0">Page 1</button>
    <button class="wb-pgbtn" id="wb-addpage">+ Page</button>
  </div>

  <!-- CONTEXT MENU -->
  <div id="wb-ctx">
    <div class="wb-citem" id="wbc-copy">Copy <span class="wb-cshort">Ctrl+C</span></div>
    <div class="wb-citem" id="wbc-paste">Paste <span class="wb-cshort">Ctrl+V</span></div>
    <div class="wb-citem" id="wbc-dup">Duplicate <span class="wb-cshort">Ctrl+D</span></div>
    <div class="wb-csep"></div>
    <div class="wb-citem" id="wbc-front">Bring to Front</div>
    <div class="wb-citem" id="wbc-back">Send to Back</div>
    <div class="wb-csep"></div>
    <div class="wb-citem" id="wbc-lock">Lock / Unlock</div>
    <div class="wb-csep wb-can-group wb-grp-only"></div>
    <div class="wb-citem wb-can-group" id="wbc-group">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/><path d="M7 11v2M11 7h2M17 11v2M11 17h2"/></svg>Group Strokes
    </div>
    <div class="wb-citem wb-grp-only" id="wbc-ungroup">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Ungroup Strokes
    </div>
    <!-- rotate/flip items – available for ALL selected shapes -->
    <div class="wb-csep wb-rot-only"></div>
    <div class="wb-citem wb-rot-only" id="wbc-rot90cw">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 2v6h-6"/><path d="M21 8A9 9 0 1 1 15 3.6"/></svg>Rotate 90° CW
    </div>
    <div class="wb-citem wb-rot-only" id="wbc-rot90ccw">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 2v6h6"/><path d="M3 8A9 9 0 1 0 9 3.6"/></svg>Rotate 90° CCW
    </div>
    <div class="wb-citem wb-rot-only" id="wbc-fliph">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3v18M4 7l4 5-4 5M20 7l-4 5 4 5"/></svg>Flip Horizontal
    </div>
    <div class="wb-citem wb-rot-only" id="wbc-flipv">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12h18M7 4l5 4 5-4M7 20l5-4 5 4"/></svg>Flip Vertical
    </div>
    <!-- image-only items -->
    <div class="wb-csep wb-img-only"></div>
    <div class="wb-citem wb-img-only" id="wbc-crop">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>Crop Image
    </div>
    <div class="wb-citem wb-img-only" id="wbc-effects">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>Image Effects
    </div>
    <div class="wb-csep wb-img-only"></div>
    <div class="wb-citem wb-img-only" id="wbc-img-replace">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4M7 5v10"/><path d="M21 15l-4 4-4-4M17 19V9"/></svg>Replace Image
    </div>
    <div class="wb-csep"></div>
    <div class="wb-citem danger" id="wbc-del">Delete <span class="wb-cshort">Del</span></div>
  </div>
  <!-- mini context menu for custom saved color swatches -->
  <div id="wb-color-ctx">
    <div class="wb-citem danger" id="wbcc-del">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete Color
    </div>
  </div>

  <!-- CROP MODAL -->
  <div id="wb-crop-modal">
    <div id="wb-crop-title">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
      Crop Image
    </div>
    <canvas id="wb-crop-canvas"></canvas>
    <div id="wb-crop-hint">Drag handles or inside the crop area to adjust · Hold Shift to constrain ratio</div>
    <div class="wb-crop-btns">
      <button class="wb-modal-btn ghost" id="wb-crop-cancel">Cancel</button>
      <button class="wb-modal-btn ghost" id="wb-crop-reset">Reset</button>
      <button class="wb-modal-btn primary" id="wb-crop-confirm">Apply Crop</button>
    </div>
  </div>

  <!-- EFFECTS MODAL -->
  <div id="wb-fx-modal">
    <div id="wb-fx-inner">
      <h3>Image Effects <button class="wb-fx-close" id="wb-fx-cancel">✕</button></h3>
      <div class="wb-fx-presets">
        <button class="wb-fx-preset" data-preset="Normal">Normal</button>
        <button class="wb-fx-preset" data-preset="Vivid">Vivid</button>
        <button class="wb-fx-preset" data-preset="Warm">Warm</button>
        <button class="wb-fx-preset" data-preset="Cool">Cool</button>
        <button class="wb-fx-preset" data-preset="B&W">B&amp;W</button>
        <button class="wb-fx-preset" data-preset="Sepia">Sepia</button>
        <button class="wb-fx-preset" data-preset="Dramatic">Dramatic</button>
        <button class="wb-fx-preset" data-preset="Fade">Fade</button>
        <button class="wb-fx-preset" data-preset="Invert">Invert</button>
        <button class="wb-fx-preset" data-preset="Matte">Matte</button>
      </div>
      <div class="wb-fx-sep"></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Brightness</span><input type="range" id="wb-fx-brightness" min="0" max="200" value="100"><span class="wb-fx-val" id="wb-fxv-brightness">100%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Contrast</span><input type="range" id="wb-fx-contrast" min="0" max="200" value="100"><span class="wb-fx-val" id="wb-fxv-contrast">100%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Saturation</span><input type="range" id="wb-fx-saturate" min="0" max="200" value="100"><span class="wb-fx-val" id="wb-fxv-saturate">100%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Hue Rotate</span><input type="range" id="wb-fx-hueRotate" min="0" max="360" value="0"><span class="wb-fx-val" id="wb-fxv-hueRotate">0°</span></div>
      <div class="wb-fx-sep"></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Grayscale</span><input type="range" id="wb-fx-grayscale" min="0" max="100" value="0"><span class="wb-fx-val" id="wb-fxv-grayscale">0%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Sepia</span><input type="range" id="wb-fx-sepia" min="0" max="100" value="0"><span class="wb-fx-val" id="wb-fxv-sepia">0%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Invert</span><input type="range" id="wb-fx-invert" min="0" max="100" value="0"><span class="wb-fx-val" id="wb-fxv-invert">0%</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Blur</span><input type="range" id="wb-fx-blur" min="0" max="20" step="0.5" value="0"><span class="wb-fx-val" id="wb-fxv-blur">0px</span></div>
      <div class="wb-fx-row"><span class="wb-fx-lbl">Opacity</span><input type="range" id="wb-fx-opacity" min="0" max="100" value="100"><span class="wb-fx-val" id="wb-fxv-opacity">100%</span></div>
      <div class="wb-fx-footer">
        <button class="fx-reset" id="wb-fx-reset">Reset All</button>
        <button class="fx-cancel" id="wb-fx-discard">Discard</button>
        <button class="fx-apply" id="wb-fx-confirm">Apply</button>
      </div>
    </div>
  </div>

  <input type="file" id="wb-img-input" accept="image/*" style="display:none">
  <input type="file" id="wb-img-replace-input" accept="image/*" style="display:none">
  `;
  document.body.appendChild(overlay);

  // ── GRID ──────────────────────────────────────────────────────────────────
  const gridSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
  gridSVG.id = '__wb_grid__';
  gridSVG.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483639;display:none;';
  gridSVG.innerHTML = `<defs><pattern id="wb_gp" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#d1d5db"/></pattern></defs><rect width="100%" height="100%" fill="url(#wb_gp)"/>`;
  document.body.appendChild(gridSVG);

  // ── TOGGLE BUTTONS ────────────────────────────────────────────────────────
  const toggleBtn = document.createElement('button');
  toggleBtn.id = '__wb_toggle_btn__';
  toggleBtn.title = 'Open whiteboard (Alt+W)';
  toggleBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.95;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg><span style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Rounded','SF Pro Display',system-ui,sans-serif;font-size:15px;font-weight:590;letter-spacing:-0.022em;-webkit-font-smoothing:antialiased;">Whiteboard</span>`;
  document.body.appendChild(toggleBtn);

  const closeBtn = document.createElement('button');
  closeBtn.id = '__wb_close_btn__';
  closeBtn.title = 'Close whiteboard (Alt+W)';
  closeBtn.textContent = '✕';
  document.body.appendChild(closeBtn);

  function openBoard()  { overlay.classList.add('wb-open'); gridSVG.classList.add('wb-open'); closeBtn.classList.add('wb-open'); toggleBtn.classList.add('wb-hidden'); document.body.style.overflow='hidden'; }
  function closeBoard() { overlay.classList.remove('wb-open'); gridSVG.classList.remove('wb-open'); closeBtn.classList.remove('wb-open'); toggleBtn.classList.remove('wb-hidden'); document.body.style.overflow=''; }
  toggleBtn.addEventListener('click', openBoard);
  closeBtn.addEventListener('click', closeBoard);
  document.addEventListener('keydown', e => { if (e.altKey && e.key.toLowerCase()==='w') overlay.classList.contains('wb-open') ? closeBoard() : openBoard(); });

  // ══════════════════════════════════════════════════════════════════════════
  //  WHITEBOARD ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  (function() {
    const R  = overlay;
    const $  = id => R.querySelector('#'+id);
    const $$ = sel => Array.from(R.querySelectorAll(sel));

    const CC  = $('wb-canvas-container');
    const CAN = $('wb-canvas');
    const DSV = $('wb-draw-svg');   // finalized strokes
    const LSV = $('wb-live-svg');   // live stroke — own compositor layer
    const ASV = $('wb-arrow-svg');  // arrows / connectors
    const SBX = $('wb-sel-rect');
    const CTX = $('wb-ctx');
    const LAS = $('wb-laser');
    const LTR = $('wb-laser-trail');
    const ZLB = $('wb-zoom-lbl');

    const STORAGE_KEY = 'wb_v2_data';
    const COLORS      = ['#1a202c','#e53e3e','#dd6b20','#d69e2e','#38a169','#3182ce','#6b46c1','#d53f8c','#718096','#ffffff'];
    const FILL_COLORS = ['transparent','#fed7d7','#feebc8','#fefcbf','#c6f6d5','#bee3f8','#e9d8fd','#fed7e2','#e2e8f0'];
    const STROKE_W    = [1.5, 2.5, 4, 7];
    const HL_COLORS   = ['#fef08a','#bbf7d0','#bae6fd','#fca5a5','#d8b4fe'];
    const FONT_MAP    = {
      system:  "-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif",
      serif:   "Georgia,'Times New Roman',serif",
      mono:    "'SF Mono',Menlo,'Courier New',monospace",
      cursive: "'Segoe Script','Apple Chancery','Comic Sans MS',cursive"
    };
    // Gradient direction map: angle → [x1,y1,x2,y2] in objectBoundingBox units (0–1)
    // x1,y1 = where fillColor starts; x2,y2 = where gradientEnd lands.
    // Arrow on each direction button shows the flow direction.
    const GRAD_DIRS = {
        0:  [.5,0, .5,1],  // ↓ top→bottom
       45:  [0, 0,  1,1],  // ↘ TL→BR
       90:  [0,.5,  1,.5], // → L→R
      135:  [0, 1,  1,0],  // ↗ BL→TR
      180:  [.5,1, .5,0],  // ↑ B→T
      225:  [1, 1,  0,0],  // ↖ BR→TL
      270:  [1,.5,  0,.5], // ← R→L
      315:  [1, 0,  0,1],  // ↙ TR→BL
    };

    let zoom=1, panX=0, panY=0;
    let activeTool = 'select';
    let shapes = [], selectedIds = new Set();
    let undoStack = [], redoStack = [];
    let clipboard = [];
    let pages = [{ shapes: [], name:'Page 1' }];
    let pageIdx = 0;

    let style = { color:'#1a202c', fillColor:'transparent', fillStyle:'none', size:1, dash:'solid', opacity:1, glow:false, effect:'none', brushPattern:'none', textFontFamily:'system', textBold:false, textItalic:false, textUnderline:false, textStrike:false, textAlign:'left', textLineHeight:1.5, gradientEnd:'#ffffff', gradientAngle:135 };
    const IMG_FILTER_DEFAULTS={brightness:100,contrast:100,saturate:100,grayscale:0,sepia:0,invert:0,blur:0,hueRotate:0,opacity:100};
    function buildImgFilter(f){
      if(!f) return '';
      return `brightness(${f.brightness??100}%) contrast(${f.contrast??100}%) `+
             `saturate(${f.saturate??100}%) grayscale(${f.grayscale??0}%) `+
             `sepia(${f.sepia??0}%) invert(${f.invert??0}%) `+
             `blur(${f.blur??0}px) hue-rotate(${f.hueRotate??0}deg) `+
             `opacity(${f.opacity??100}%)`;
    }

    // ── SVG namespace helper ───────────────────────────────────────────────────
    const svgN=(tag,attrs)=>{
      const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
      return el;
    };

    // ── Sample evenly-spaced points along a polyline ──────────────────────────
    function sampleAlongPath(pts,spacing){
      if(!pts||pts.length<2) return pts?[[pts[0][0],pts[0][1],0]]:[];
      const out=[[pts[0][0],pts[0][1],0]]; let acc=0;
      for(let i=1;i<pts.length;i++){
        const [px,py]=pts[i-1],[cx,cy]=pts[i];
        const dx=cx-px,dy=cy-py,d=Math.hypot(dx,dy);
        if(d===0) continue;
        const ang=Math.atan2(dy,dx);
        acc+=d;
        while(acc>=spacing){
          acc-=spacing;
          const t=(d-acc)/d;
          out.push([px+dx*t,py+dy*t,ang]);
        }
      }
      return out;
    }

    // ── Star and heart SVG path generators ───────────────────────────────────
    function starSvgPath(x,y,r,n=5){
      let d='';
      for(let i=0;i<n*2;i++){
        const a=(i*Math.PI/n)-Math.PI/2, ri=i%2===0?r:r*0.42;
        d+=(i===0?'M':'L')+(x+ri*Math.cos(a))+' '+(y+ri*Math.sin(a));
      }
      return d+'Z';
    }
    function heartSvgPath(x,y,r){
      return `M${x},${y-r*0.1} `+
        `C${x-r*0.12},${y-r*0.75} ${x-r},${y-r*0.65} ${x-r},${y-r*0.18} `+
        `C${x-r},${y+r*0.35} ${x-r*0.5},${y+r*0.65} ${x},${y+r*0.95} `+
        `C${x+r*0.5},${y+r*0.65} ${x+r},${y+r*0.35} ${x+r},${y-r*0.18} `+
        `C${x+r},${y-r*0.65} ${x+r*0.12},${y-r*0.75} ${x},${y-r*0.1}Z`;
    }

    // ── Stroke effect CSS filter string ──────────────────────────────────────
    function strokeEffectCSS(effect,color){
      // also handle legacy glow:true on shapes
      const eff=effect||'none';
      if(eff==='glow') return `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 7px ${color}) drop-shadow(0 0 13px ${color})`;
      if(eff==='neon') return `drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px ${color}) drop-shadow(0 0 14px ${color}) drop-shadow(0 0 28px ${color})`;
      if(eff==='shadow') return `drop-shadow(2px 3px 5px rgba(0,0,0,.5))`;
      if(eff==='blur')   return `blur(1.8px)`;
      // ── new effects ──
      if(eff==='outline') return `drop-shadow(-2px -2px 0px rgba(0,0,0,0.88)) drop-shadow(2px -2px 0px rgba(0,0,0,0.88)) drop-shadow(-2px 2px 0px rgba(0,0,0,0.88)) drop-shadow(2px 2px 0px rgba(0,0,0,0.88))`;
      if(eff==='fire')   return `drop-shadow(0 -3px 6px rgba(255,110,0,0.95)) drop-shadow(0 -1px 3px rgba(255,210,0,0.8)) brightness(1.12)`;
      if(eff==='ice')    return `drop-shadow(0 0 4px rgba(140,215,255,0.98)) drop-shadow(0 0 10px rgba(100,185,255,0.8)) drop-shadow(0 0 20px rgba(80,155,255,0.55)) brightness(1.22)`;
      if(eff==='emboss') return `contrast(2) brightness(0.82) saturate(0.4)`;
      if(eff==='glitter') return `saturate(3.5) brightness(1.5) drop-shadow(0 0 2px rgba(255,255,255,1)) drop-shadow(0 0 4px rgba(255,255,255,0.7))`;
      if(eff==='vintage') return `sepia(0.72) contrast(1.18) brightness(0.9) saturate(0.7)`;
      return '';
    }
    function strokeEffectSVGFilter(effect){
      if(effect==='chalk') return 'url(#wbf-chalk)';
      if(effect==='rough') return 'url(#wbf-rough)';
      if(effect==='fire')  return 'url(#wbf-fire)';
      if(effect==='emboss') return 'url(#wbf-emboss)';
      if(effect==='glitter') return 'url(#wbf-glitter)';
      return '';
    }

    // ── Initialise SVG filter defs in DSV (preserved across renderAll) ────────
    function initDSVDefs(){
      if(DSV.querySelector('#wbf-chalk')) return; // already added
      const defs=svgN('defs',{id:'wb-stroke-defs'});
      defs.innerHTML=`
        <filter id="wbf-chalk" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="turbulence" baseFrequency="0.055" numOctaves="4" seed="3" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="wbf-rough" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.02" numOctaves="3" seed="9" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
          <feGaussianBlur in="d" stdDeviation="0.6"/>
        </filter>
        <filter id="wbf-fire" x="-25%" y="-65%" width="150%" height="195%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.028 0.065" numOctaves="4" seed="7" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
          <feColorMatrix in="displaced" type="matrix" values="1.5 0.45 0 0 0.05 0.1 0.4 0 0 0 0 0 0 0 0 0 0 0 1 0" result="fireCol"/>
          <feGaussianBlur in="fireCol" stdDeviation="2.2" result="fireBlur"/>
          <feMerge><feMergeNode in="fireBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="wbf-emboss" x="-5%" y="-5%" width="110%" height="110%">
          <feConvolveMatrix order="3" kernelMatrix="-2 -1 0 -1 1 1 0 1 2" bias="0.45" preserveAlpha="false" result="embossed"/>
          <feBlend in="SourceGraphic" in2="embossed" mode="hard-light" result="blended"/>
          <feComposite in="blended" in2="SourceGraphic" operator="in"/>
        </filter>
        <filter id="wbf-glitter" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="42" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise"/>
          <feComponentTransfer in="monoNoise" result="sparks"><feFuncR type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 1"/><feFuncG type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 1"/><feFuncB type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 1"/><feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 1"/></feComponentTransfer>
          <feComposite in="sparks" in2="SourceGraphic" operator="in" result="maskedSparks"/>
          <feColorMatrix in="maskedSparks" type="matrix" values="2 1 0.5 0 0 1 2 0.5 0 0 0.5 0.5 2 0 0 0 0 0 4 0" result="brightSparks"/>
          <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="brightSparks"/></feMerge>
        </filter>`;
      DSV.prepend(defs);
    }

    // ── Apply effect attributes to an SVG element ─────────────────────────────
    function applyEffectToEl(el,st){
      const eff=st.effect||'none';
      const col=st.color||'#000';
      const svgFlt=strokeEffectSVGFilter(eff);
      const cssFlt=strokeEffectCSS(eff,col)||((st.glow&&eff==='none')?strokeEffectCSS('glow',col):'');
      if(svgFlt) el.setAttribute('filter',svgFlt);
      else if(cssFlt) el.style.filter=cssFlt;
    }

    // ── Core pattern-brush renderer (writes into a provided <g>) ─────────────
    function renderPatternToGroup(points,st,g){
      const p=st.brushPattern;
      const sw=STROKE_W[(st.size||1)-1];
      const color=st.color||'#000';

      // ── custom brush ──
      if(p&&p.startsWith('custom:')){
        const brush=getCustomBrush(p);
        if(brush&&points.length>=1){
          const spacing=sw*(brush.type==='text'?(brush.fontSize||28)*0.6:4);
          const sampled=sampleAlongPath(points,Math.max(4,spacing));
          sampled.forEach(pt=>{
            const [x,y,ang=0]=pt;
            if(brush.type==='text'){
              renderTextStamp(brush.text,brush.fontSize||28,x,y,ang,sw,color,g);
            } else {
              renderCustomStamp(brush.pts,x,y,ang,sw,color,g);
            }
          });
        }
        return;
      }

      if(p==='spray'){
        const spread=sw*7;
        points.forEach(pt=>{
          for(let j=0;j<5;j++){
            const h1=Math.sin(pt[0]*12.9898+pt[1]*78.233+j*43.31)*43758.5453;
            const h2=Math.sin(pt[0]*269.5 +pt[1]*183.3 +j*57.71)*43758.5453;
            const a=(h1-Math.floor(h1))*Math.PI*2;
            const r=(h2-Math.floor(h2))*spread;
            g.appendChild(svgN('circle',{cx:pt[0]+Math.cos(a)*r,cy:pt[1]+Math.sin(a)*r,r:sw*0.55,fill:color}));
          }
        });
        return;
      }

      if(p==='zigzag'){
        if(points.length<2) return;
        let d='';
        points.forEach((pt,i)=>{
          const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
          const ang=Math.atan2(next[1]-prev[1],next[0]-prev[0]);
          const perp=ang+Math.PI/2;
          const amp=sw*4*(i%2===0?1:-1);
          const ox=pt[0]+Math.cos(perp)*amp,oy=pt[1]+Math.sin(perp)*amp;
          d+=(i===0?'M':'L')+ox+' '+oy;
        });
        const path=svgN('path',{d,stroke:color,'stroke-width':sw,fill:'none',
          'stroke-linecap':'round','stroke-linejoin':'round'});
        const da=dashArr(st.dash,sw); if(da!=='none') path.setAttribute('stroke-dasharray',da);
        g.appendChild(path);
        return;
      }

      const spacing=sw*(p==='dots'||p==='rings'?3.2:p==='stars'||p==='hearts'?5.5:4);
      const sampled=sampleAlongPath(points,spacing);

      sampled.forEach(pt=>{
        const [x,y,ang=0]=pt;
        if(p==='dots'){
          g.appendChild(svgN('circle',{cx:x,cy:y,r:sw,fill:color}));
        } else if(p==='rings'){
          g.appendChild(svgN('circle',{cx:x,cy:y,r:sw*1.3,fill:'none',stroke:color,'stroke-width':sw*0.55}));
        } else if(p==='stars'){
          g.appendChild(svgN('path',{d:starSvgPath(x,y,sw*1.8),fill:color}));
        } else if(p==='diamonds'){
          const sz=sw*1.4;
          g.appendChild(svgN('polygon',{points:`${x},${y-sz} ${x+sz},${y} ${x},${y+sz} ${x-sz},${y}`,fill:color}));
        } else if(p==='arrows'){
          const sz=sw*3.2,deg=ang*180/Math.PI;
          g.appendChild(svgN('path',{d:`M0 0 L${-sz} ${-sz*.4} L${-sz*.72} 0 L${-sz} ${sz*.4}Z`,
            fill:color,transform:`translate(${x},${y}) rotate(${deg})`}));
        } else if(p==='hearts'){
          g.appendChild(svgN('path',{d:heartSvgPath(x,y,sw*2),fill:color}));
        } else if(p==='cross'){
          const sz=sw*1.7,lw=sw*0.72;
          g.appendChild(svgN('line',{x1:x-sz,y1:y,x2:x+sz,y2:y,stroke:color,'stroke-width':lw,'stroke-linecap':'round'}));
          g.appendChild(svgN('line',{x1:x,y1:y-sz,x2:x,y2:y+sz,stroke:color,'stroke-width':lw,'stroke-linecap':'round'}));
        }
      });
    }

    // ── renderStroke (pattern branch + effect branch) ─────────────────────────
    // (The original renderStroke is preserved below and extended here)
    function renderPatternStroke(s){
      const id='wd-'+s.id;
      DSV.querySelector('#'+id)?.remove();
      if(!s.points||s.points.length<1) return;
      const g=svgN('g',{id});
      const opacity=s.type==='highlighter'?0.5:(s.style.opacity??1);
      g.setAttribute('opacity',opacity);
      renderPatternToGroup(s.points,s.style,g);
      applyEffectToEl(g,s.style);
      DSV.appendChild(g);
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    const uid    = () => Math.random().toString(36).slice(2,9);
    const clone  = o => JSON.parse(JSON.stringify(o));
    const clamp  = (v,a,b) => Math.max(a,Math.min(b,v));

    function s2c(x,y) {
      const r = CC.getBoundingClientRect();
      return { x:(x-r.left-panX)/zoom, y:(y-r.top-panY)/zoom };
    }
    const GRID=20;
    function sg(v){ return snapGrid ? Math.round(v/GRID)*GRID : v; }

    // ── persist ───────────────────────────────────────────────────────────────
    function save() {
      pages[pageIdx].shapes = clone(shapes);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, pageIdx, style, activeTool })); } catch(e){}
    }
    function load() {
      try {
        const d = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
        if (d && d.pages) {
          pages = d.pages;
          pageIdx = d.pageIdx || 0;
          shapes = clone(pages[pageIdx].shapes);
          if (d.style) Object.assign(style, d.style);
          // apply text style defaults for any missing keys (old saves)
          if(!style.textFontFamily)  style.textFontFamily  = 'system';
          if(!style.textAlign)       style.textAlign       = 'left';
          if(!style.textLineHeight)  style.textLineHeight  = 1.5;
          if(!style.gradientEnd)     style.gradientEnd     = '#ffffff';
          if(style.gradientAngle==null) style.gradientAngle = 135;
          if(d.activeTool) activeTool = d.activeTool;
          rebuildPageBtns();
        }
      } catch(e){}
    }

    // ── undo/redo ─────────────────────────────────────────────────────────────
    function snap() {
      undoStack.push(clone(shapes));
      if (undoStack.length>80) undoStack.shift();
      redoStack=[];
      updUR();
    }
    function updUR() {
      $('wb-undo').disabled = !undoStack.length;
      $('wb-redo').disabled = !redoStack.length;
    }
    function undo() { if(!undoStack.length) return; redoStack.push(clone(shapes)); shapes=undoStack.pop(); selectedIds.clear(); renderAll(); updUR(); save(); }
    function redo() { if(!redoStack.length) return; undoStack.push(clone(shapes)); shapes=redoStack.pop(); selectedIds.clear(); renderAll(); updUR(); save(); }

    // ── transform ─────────────────────────────────────────────────────────────
    let _xformZoom = null; // cache: skip SVG resize when only panning
    function applyXform() {
      CAN.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
      // Only update the SVG viewport sizes and zoom label when zoom actually
      // changed.  Pure panning hits applyXform at 60fps; skipping these 5
      // writes eliminates forced style-recalculations on every pan frame.
      if(zoom !== _xformZoom) {
        _xformZoom = zoom;
        ZLB.textContent = Math.round(zoom*100)+'%';
        const big = 200000/zoom+'px';
        DSV.style.width=DSV.style.height=big;
        ASV.style.width=ASV.style.height=big;
        LSV.style.width=LSV.style.height=big;
      }
    }

    // ── style panel setup ──────────────────────────────────────────────────────
    // saved custom colors (persisted to localStorage, max 8)
    let savedCustomColors = [];
    try { savedCustomColors = JSON.parse(localStorage.getItem('wb_custom_colors')||'[]'); } catch(e){}

    function renderSavedColors() {
      const row = $('wb-saved-colors'); if(!row) return;
      row.innerHTML = '';
      savedCustomColors.forEach(hex => {
        const s = document.createElement('div');
        s.className='wb-swatch'; s.dataset.c=hex; s.dataset.saved='stroke';
        s.style.background=hex; s.title=hex;
        s.onclick=()=>{ style.color=hex; updPanel(); applyToSel(); };
        row.appendChild(s);
      });
    }

    function saveCustomColor(hex) {
      savedCustomColors = [hex, ...savedCustomColors.filter(c=>c!==hex)].slice(0,8);
      try { localStorage.setItem('wb_custom_colors', JSON.stringify(savedCustomColors)); } catch(e){}
      renderSavedColors();
      // also sync active state
      updPanel();
    }

    function deleteCustomColor(hex) {
      savedCustomColors = savedCustomColors.filter(c=>c!==hex);
      try { localStorage.setItem('wb_custom_colors', JSON.stringify(savedCustomColors)); } catch(e){}
      renderSavedColors(); updPanel();
    }

    // saved custom fill colors
    let savedFillColors = [];
    try { savedFillColors = JSON.parse(localStorage.getItem('wb_fill_custom_colors')||'[]'); } catch(e){}

    function renderSavedFillColors() {
      const row = $('wb-fill-saved-colors'); if(!row) return;
      row.innerHTML = '';
      savedFillColors.forEach(hex => {
        const s = document.createElement('div');
        s.className='wb-swatch'; s.dataset.fc=hex; s.dataset.saved='fill';
        s.style.background=hex; s.title=hex;
        s.onclick=()=>{
          style.fillColor=hex;
          if(style.fillStyle==='none') style.fillStyle='solid';
          updPanel(); applyToSel();
        };
        row.appendChild(s);
      });
    }

    function saveFillColor(hex) {
      savedFillColors = [hex, ...savedFillColors.filter(c=>c!==hex)].slice(0,8);
      try { localStorage.setItem('wb_fill_custom_colors', JSON.stringify(savedFillColors)); } catch(e){}
      renderSavedFillColors(); updPanel();
    }

    function deleteFillColor(hex) {
      savedFillColors = savedFillColors.filter(c=>c!==hex);
      try { localStorage.setItem('wb_fill_custom_colors', JSON.stringify(savedFillColors)); } catch(e){}
      renderSavedFillColors(); updPanel();
    }

    (function buildPanel() {
      const cr = $('wb-color-row');
      COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className='wb-swatch'; s.dataset.c=c;
        s.style.background = c==='#ffffff' ? '#fff' : c;
        if(c==='#ffffff') s.style.boxShadow='inset 0 0 0 1px #d1d5db';
        s.onclick = () => { style.color=c; updPanel(); applyToSel(); };
        cr.appendChild(s);
      });
      // custom colour wheel for stroke colour — saves to palette on change
      const cCustomWrap=document.createElement('div');
      cCustomWrap.style.cssText='position:relative;width:16px;height:16px;border-radius:50%;border:2px dashed #cbd5e1;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
      cCustomWrap.title='Custom color';
      cCustomWrap.innerHTML='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>';
      const cCustomInp=document.createElement('input');
      cCustomInp.type='color'; cCustomInp.value='#1a202c';
      cCustomInp.style.cssText='position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;';
      cCustomInp.oninput=()=>{
        const hex=cCustomInp.value;
        style.color=hex; cCustomWrap.style.background=hex; cCustomWrap.style.borderColor='transparent';
        updPanel(); applyToSel();
      };
      cCustomInp.onchange=()=>{ saveCustomColor(cCustomInp.value); };
      cCustomWrap.appendChild(cCustomInp);
      cr.appendChild(cCustomWrap);

      // render any previously saved custom colors
      renderSavedColors();

      const fr = $('wb-fill-row');
      FILL_COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className='wb-swatch'; s.dataset.fc=c;
        s.style.background = c==='transparent' ? 'repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 2px,#fff 2px,#fff 6px)' : c;
        s.onclick = () => {
          style.fillColor=c;
          // If a real colour is picked and fill is currently off, switch to solid automatically
          if(c !== 'transparent' && style.fillStyle === 'none') style.fillStyle = 'solid';
          // If transparent is picked, turn fill off
          if(c === 'transparent') style.fillStyle = 'none';
          updPanel(); applyToSel();
        };
        fr.appendChild(s);
      });
      // custom colour wheel for fill colour
      const fCustomWrap=document.createElement('div');
      fCustomWrap.style.cssText='position:relative;width:16px;height:16px;border-radius:50%;border:2px dashed #cbd5e1;overflow:hidden;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
      fCustomWrap.title='Custom fill color';
      fCustomWrap.innerHTML='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>';
      const fCustomInp=document.createElement('input');
      fCustomInp.type='color'; fCustomInp.value='#ffffff';
      fCustomInp.style.cssText='position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer;';
      fCustomInp.oninput=()=>{
        style.fillColor=fCustomInp.value;
        fCustomWrap.style.background=fCustomInp.value;
        fCustomWrap.style.borderColor='transparent';
        // Auto-enable solid fill when a custom colour is picked
        if(style.fillStyle === 'none') style.fillStyle = 'solid';
        updPanel(); applyToSel();
      };
      fCustomInp.onchange=()=>{ saveFillColor(fCustomInp.value); };
      fCustomWrap.appendChild(fCustomInp);
      fr.appendChild(fCustomWrap);

      // render any previously saved custom fill colors
      renderSavedFillColors();
    })();

    // glow toggle (legacy — now handled via effect row)
    // ── stroke effect buttons ──────────────────────────────────────────────────
    $$('[data-eff]').forEach(btn=>{
      btn.onclick=()=>{
        const eff=btn.dataset.eff;
        style.effect=eff;
        style.glow=(eff==='glow'); // keep legacy flag in sync
        updPanel(); applyToSel();
      };
    });
    // ── pattern brush buttons ─────────────────────────────────────────────────
    $$('[data-pat]').forEach(btn=>{
      btn.onclick=()=>{ style.brushPattern=btn.dataset.pat; updPanel(); applyToSel(); };
    });

    // ── Custom brush system ───────────────────────────────────────────────────
    let customBrushes = [];
    try { customBrushes = JSON.parse(localStorage.getItem('wb_custom_brushes')||'[]'); } catch(e){}

    const brushModal    = $('wb-brush-modal');
    const brushCanvas   = $('wb-brush-canvas');
    const brushCtx2d    = brushCanvas.getContext('2d');
    let brushDrawing    = false;
    let brushMode       = 'draw'; // 'draw' | 'text'

    function openBrushModal() {
      brushCtx2d.clearRect(0,0,brushCanvas.width,brushCanvas.height);
      // reset to draw tab
      brushMode='draw';
      $$('.wb-brush-tab').forEach(b=>b.classList.toggle('active',b.dataset.brushmode==='draw'));
      $('wb-brush-draw-pane').style.display='';
      $('wb-brush-text-pane').classList.remove('visible');
      $('wb-brush-clear').style.display='';
      brushModal.classList.add('open');
    }
    $('wb-brush-new-btn').onclick = e => { e.stopPropagation(); openBrushModal(); };
    $('wb-brush-cancel').onclick  = () => brushModal.classList.remove('open');
    $('wb-brush-clear').onclick   = () => {
      if(brushMode==='draw') brushCtx2d.clearRect(0,0,brushCanvas.width,brushCanvas.height);
      else { $('wb-brush-text-inp').value=''; $('wb-brush-text-prev-inner').textContent='★'; }
    };

    // ── Tab switching ──────────────────────────────────────────────────────────
    $$('.wb-brush-tab').forEach(btn=>btn.onclick=()=>{
      brushMode=btn.dataset.brushmode;
      $$('.wb-brush-tab').forEach(b=>b.classList.toggle('active',b===btn));
      const isText=brushMode==='text';
      $('wb-brush-draw-pane').style.display=isText?'none':'';
      $('wb-brush-text-pane').classList.toggle('visible',isText);
      $('wb-brush-clear').style.display=isText?'none':'';
    });

    // ── Text / Emoji pane live preview ─────────────────────────────────────────
    $('wb-brush-text-inp').oninput=()=>{
      const v=$('wb-brush-text-inp').value.trim()||'★';
      $('wb-brush-text-prev-inner').textContent=v;
    };
    $('wb-brush-text-size').oninput=function(){
      $('wb-brush-text-prev-inner').style.fontSize=this.value+'px';
      $('wb-brush-text-size-val').textContent=this.value+'px';
    };

    // ── Drawing on the brush canvas ────────────────────────────────────────────
    brushCanvas.addEventListener('mousedown', e => {
      brushDrawing = true;
      const r=brushCanvas.getBoundingClientRect();
      brushCtx2d.beginPath();
      brushCtx2d.moveTo(e.clientX-r.left, e.clientY-r.top);
    });
    brushCanvas.addEventListener('mousemove', e => {
      if(!brushDrawing) return;
      const r=brushCanvas.getBoundingClientRect();
      brushCtx2d.lineTo(e.clientX-r.left, e.clientY-r.top);
      brushCtx2d.strokeStyle='#1a202c'; brushCtx2d.lineWidth=2.5;
      brushCtx2d.lineCap='round'; brushCtx2d.lineJoin='round';
      brushCtx2d.stroke();
    });
    brushCanvas.addEventListener('mouseup',  () => { brushDrawing=false; });
    brushCanvas.addEventListener('mouseleave',() => { brushDrawing=false; });

    // touch support for the brush canvas
    brushCanvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t=e.touches[0], r=brushCanvas.getBoundingClientRect();
      brushDrawing=true;
      brushCtx2d.beginPath(); brushCtx2d.moveTo(t.clientX-r.left,t.clientY-r.top);
    },{passive:false});
    brushCanvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if(!brushDrawing) return;
      const t=e.touches[0], r=brushCanvas.getBoundingClientRect();
      brushCtx2d.lineTo(t.clientX-r.left,t.clientY-r.top);
      brushCtx2d.strokeStyle='#1a202c'; brushCtx2d.lineWidth=2.5;
      brushCtx2d.lineCap='round'; brushCtx2d.lineJoin='round';
      brushCtx2d.stroke();
    },{passive:false});
    brushCanvas.addEventListener('touchend', () => { brushDrawing=false; });

    // ── Save brush ─────────────────────────────────────────────────────────────
    $('wb-brush-save').onclick = () => {
      if(brushMode==='text'){
        // ── Text / Emoji brush ──
        const txt=($('wb-brush-text-inp').value||'★').trim();
        if(!txt){ alert('Please type something first!'); return; }
        const fontSize=parseInt($('wb-brush-text-size').value)||28;
        // Generate thumbnail by drawing the text on a small canvas
        const thumbCvs=document.createElement('canvas'); thumbCvs.width=30; thumbCvs.height=30;
        const tc=thumbCvs.getContext('2d');
        tc.font=`${Math.min(fontSize,22)}px -apple-system,BlinkMacSystemFont,"Segoe UI Emoji",sans-serif`;
        tc.textAlign='center'; tc.textBaseline='middle';
        tc.fillStyle='#1a202c';
        tc.fillText(txt,15,16);
        const thumb=thumbCvs.toDataURL('image/png');
        const brush={id:uid(),type:'text',text:txt,fontSize,thumb};
        customBrushes.push(brush);
        try { localStorage.setItem('wb_custom_brushes',JSON.stringify(customBrushes)); } catch(e){}
        renderCustomBrushButtons();
        style.brushPattern='custom:'+brush.id;
        updPanel();
        brushModal.classList.remove('open');
      } else {
        // ── Drawn brush — existing point-cloud path ──
        const idata = brushCtx2d.getImageData(0,0,brushCanvas.width,brushCanvas.height);
        const pixels = [];
        for(let y=0;y<brushCanvas.height;y++){
          for(let x=0;x<brushCanvas.width;x++){
            const i=(y*brushCanvas.width+x)*4;
            if(idata.data[i+3]>60) pixels.push([x,y]);
          }
        }
        if(pixels.length<4){ alert('Please draw something first!'); return; }
        let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
        pixels.forEach(([x,y])=>{mnX=Math.min(mnX,x);mnY=Math.min(mnY,y);mxX=Math.max(mxX,x);mxY=Math.max(mxY,y);});
        const bw=mxX-mnX||1, bh=mxY-mnY||1;
        let pts = pixels.map(([x,y])=>[(x-mnX)/Math.max(bw,bh)-0.5*(bw/Math.max(bw,bh)), (y-mnY)/Math.max(bw,bh)-0.5*(bh/Math.max(bw,bh))]);
        if(pts.length>200){ const step=Math.ceil(pts.length/200); pts=pts.filter((_,i)=>i%step===0); }
        const thumbCvs=document.createElement('canvas'); thumbCvs.width=30; thumbCvs.height=30;
        const tc=thumbCvs.getContext('2d');
        tc.drawImage(brushCanvas, mnX,mnY,bw,bh, 2,2,26,26);
        const thumb=thumbCvs.toDataURL('image/png');
        const brush={id:uid(),type:'drawn',pts,thumb};
        customBrushes.push(brush);
        try { localStorage.setItem('wb_custom_brushes',JSON.stringify(customBrushes)); } catch(e){}
        renderCustomBrushButtons();
        style.brushPattern='custom:'+brush.id;
        updPanel();
        brushModal.classList.remove('open');
      }
    };

    function renderCustomBrushButtons() {
      const row=$('wb-custom-brushes'); if(!row) return;
      row.innerHTML='';
      customBrushes.forEach(brush=>{
        const btn=document.createElement('button');
        btn.className='wb-custbtn';
        btn.dataset.pat='custom:'+brush.id;
        btn.title= brush.type==='text' ? `"${brush.text}" text brush` : 'Custom drawn brush';
        if(brush.type==='text'){
          // Show emoji/text directly in the button instead of thumbnail
          const span=document.createElement('span');
          span.style.cssText='font-size:16px;line-height:1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI Emoji",sans-serif;pointer-events:none;';
          span.textContent=brush.text;
          btn.appendChild(span);
        } else {
          const img=document.createElement('img');
          img.src=brush.thumb; img.style.cssText='width:100%;height:100%;display:block;';
          btn.appendChild(img);
        }
        // delete button
        const del=document.createElement('span');
        del.className='wb-del-cust'; del.textContent='×';
        del.onclick=e=>{
          e.stopPropagation();
          customBrushes=customBrushes.filter(b=>b.id!==brush.id);
          try { localStorage.setItem('wb_custom_brushes',JSON.stringify(customBrushes)); } catch(e){}
          if(style.brushPattern==='custom:'+brush.id){ style.brushPattern='none'; updPanel(); }
          renderCustomBrushButtons();
        };
        btn.appendChild(del);
        btn.onclick=()=>{ style.brushPattern='custom:'+brush.id; updPanel(); applyToSel(); };
        row.appendChild(btn);
      });
    }
    renderCustomBrushButtons();

    // ── custom brush rendering ────────────────────────────────────────────────
    function getCustomBrush(patId) {
      if(!patId||!patId.startsWith('custom:')) return null;
      return customBrushes.find(b=>b.id===patId.slice(7))||null;
    }
    // Keep legacy alias used elsewhere
    function getCustomBrushPts(patId) {
      const b=getCustomBrush(patId); return b?.pts||null;
    }

    // Render a single drawn-stamp at (x,y,ang) into a <g>
    function renderCustomStamp(pts,x,y,ang,size,color,g) {
      if(!pts||!pts.length) return;
      const sc=size*2.5;
      const cos=Math.cos(ang), sin=Math.sin(ang);
      pts.forEach(([nx,ny])=>{
        const rx=nx*sc, ry=ny*sc;
        const tx=x+rx*cos-ry*sin, ty=y+rx*sin+ry*cos;
        g.appendChild(svgN('circle',{cx:tx,cy:ty,r:Math.max(0.8,size*0.18),fill:color}));
      });
    }

    // Render a single text/emoji stamp at (x,y,ang) into a <g>
    function renderTextStamp(text,fontSize,x,y,ang,size,color,g) {
      const fs=Math.max(6, fontSize*(size/2));
      const attrs={
        x:String(x), y:String(y),
        'font-size':String(fs),
        'text-anchor':'middle',
        'dominant-baseline':'middle',
        'font-family':'-apple-system,BlinkMacSystemFont,"Segoe UI Emoji","Noto Emoji",sans-serif',
      };
      if(ang!==0) attrs.transform=`rotate(${ang*180/Math.PI},${x},${y})`;
      const el=svgN('text',attrs);
      // Detect if likely emoji (non-ASCII) — skip colorising so native emoji colours show
      const hasEmoji=/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(text);
      if(!hasEmoji) el.setAttribute('fill',color);
      el.textContent=text;
      g.appendChild(el);
    }

    function updPanel() {
      $$('#wb-color-row .wb-swatch').forEach(s => s.classList.toggle('active', s.dataset.c===style.color));
      $$('#wb-saved-colors .wb-swatch').forEach(s => s.classList.toggle('active', s.dataset.c===style.color));
      $$('#wb-fill-row .wb-swatch').forEach(s => s.classList.toggle('active', s.dataset.fc===style.fillColor));
      $$('#wb-fill-saved-colors .wb-swatch').forEach(s => s.classList.toggle('active', s.dataset.fc===style.fillColor));
      $$('[data-sz]').forEach(b => b.classList.toggle('active', +b.dataset.sz===style.size));
      $$('[data-dash]').forEach(b => b.classList.toggle('active', b.dataset.dash===style.dash));
      $$('[data-fillst]').forEach(b => b.classList.toggle('active', b.dataset.fillst===style.fillStyle));
      const sl=$('wb-opacity'); const v=Math.round(style.opacity*100);
      sl.value=v; sl.style.setProperty('--pct',v+'%');
      $('wb-op-val').textContent=v+'%';
      const curEff = style.glow&&style.effect==='none' ? 'glow' : (style.effect||'none');
      $$('[data-eff]').forEach(b=>b.classList.toggle('active',b.dataset.eff===curEff));
      $$('[data-pat]').forEach(b=>b.classList.toggle('active',b.dataset.pat===(style.brushPattern||'none')));
      // custom brush buttons (dynamically created, not data-pat)
      R.querySelectorAll('#wb-custom-brushes .wb-custbtn').forEach(b=>b.classList.toggle('active',b.dataset.pat===(style.brushPattern||'none')));
      // update fill popup swatch whenever style changes
      updFillPopup();
      // update text popup button states
      updTextPopup();
      // show/hide gradient panel & sync its controls
      updGradientPanel();
    }

    $$('[data-sz]').forEach(b => b.onclick=()=>{ style.size=+b.dataset.sz; updPanel(); applyToSel(); });
    $$('[data-dash]').forEach(b => b.onclick=()=>{ style.dash=b.dataset.dash; updPanel(); applyToSel(); });
    $$('[data-fillst]').forEach(b => b.onclick=()=>{
      const fs = b.dataset.fillst;
      style.fillStyle = fs;
      // ensure a non-transparent start color when switching to a fill type
      if(fs==='none') { style.fillColor='transparent'; }
      else if(style.fillColor==='transparent') { style.fillColor='#3182ce'; }
      updPanel(); applyToSel();
    });
    $('wb-opacity').oninput = function(){ style.opacity=this.value/100; this.style.setProperty('--pct',this.value+'%'); $('wb-op-val').textContent=this.value+'%'; applyToSel(); };

    function applyToSel() {
      if(!selectedIds.size) return;
      snap();
      shapes.forEach(s=>{ if(selectedIds.has(s.id)) Object.assign(s.style, clone(style)); });
      renderAll(); save();
    }

    // ── SVG utils ─────────────────────────────────────────────────────────────
    function dashArr(d,w) {
      if(d==='dashed') return `${w*4} ${w*2}`;
      if(d==='dotted') return `${w} ${w*2}`;
      return 'none';
    }
    function getFill(s) {
      if(s.style.fillStyle==='none') return 'none';
      const c = s.style.fillColor==='transparent' ? '#94a3b8' : s.style.fillColor;
      if(s.style.fillStyle==='solid') return c;
      if(s.style.fillStyle==='semi')  return hexA(c,.45);
      if(s.style.fillStyle==='gradient-linear'||s.style.fillStyle==='gradient-radial') return `url(#grad-${s.id})`;
      return 'none';
    }
    // Returns an SVG <defs> string for gradient shapes, '' otherwise.
    // Placed inside each shape's inline SVG so the ID is scoped & portable.
    function gradDefs(s) {
      if(s.style.fillStyle!=='gradient-linear'&&s.style.fillStyle!=='gradient-radial') return '';
      const gid=`grad-${s.id}`;
      const c1=s.style.fillColor==='transparent'?'#94a3b8':(s.style.fillColor||'#3182ce');
      const c2=s.style.gradientEnd||'#ffffff';
      if(s.style.fillStyle==='gradient-linear'){
        const [x1,y1,x2,y2]=GRAD_DIRS[s.style.gradientAngle??135]||GRAD_DIRS[135];
        return `<defs><linearGradient id="${gid}" gradientUnits="objectBoundingBox" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>`;
      }
      // radial
      return `<defs><radialGradient id="${gid}" gradientUnits="objectBoundingBox" cx="0.38" cy="0.35" r="0.72" fx="0.38" fy="0.35"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></radialGradient></defs>`;
    }
    // For sticky/frame CSS backgrounds (linear-gradient or plain color)
    function cssFill(s, fallback='#fef3c7') {
      const base = s.style.fillColor==='transparent'?fallback:(s.style.fillColor||fallback);
      const end  = s.style.gradientEnd||'#ffffff';
      const ang  = (180-(s.style.gradientAngle??135)+360)%360; // my angle → CSS angle
      if(s.style.fillStyle==='gradient-linear') return `linear-gradient(${ang}deg,${base},${end})`;
      if(s.style.fillStyle==='gradient-radial') return `radial-gradient(circle at 38% 35%,${base},${end})`;
      if(s.style.fillStyle==='semi') return hexA(base,.45);
      if(s.style.fillStyle==='none') return 'transparent';
      return base;
    }
    // Parses a small SVG string (e.g. gradDefs() output) into a live, appendable
    // DOM node. Div-based shapes embed gradDefs() directly via innerHTML strings,
    // but strokes are built as raw DOM nodes on the shared draw canvas (DSV), so
    // they need the def as a real node instead of a string.
    function svgFragmentToNode(svgStr) {
      if(!svgStr) return null;
      const doc=new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${svgStr}</svg>`, 'image/svg+xml');
      const node=doc.documentElement.firstChild;
      return node ? document.importNode(node,true) : null;
    }
    // Strokes re-render often (live while drawing, on every edit), so remove any
    // gradient def left over from a previous render before adding a fresh one —
    // also used by deleteShape() so a deleted stroke doesn't leave one behind.
    function removeStrokeGradDef(id, root=DSV) {
      const g=root.querySelector('#grad-'+id);
      if(g) (g.closest('defs')||g).remove();
    }
    function hexA(hex,a) {
      if(!hex||!hex.startsWith('#')) return hex;
      const n=parseInt(hex.slice(1),16);
      return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
    }


    // ── RENDER ALL ────────────────────────────────────────────────────────────
    function renderAll() {
      R.querySelectorAll('.wb-shape').forEach(e=>e.remove());
      // clear DSV contents but preserve the <defs> block (SVG filters live there)
      [...DSV.children].filter(el=>el.tagName.toLowerCase()!=='defs').forEach(el=>el.remove());
      ASV.innerHTML='';
      shapes.forEach(s => renderShape(s));
      updSel();
    }

    function renderShape(s) {
      if(s.type==='draw'||s.type==='highlighter') { renderStroke(s); return; }
      if(s.type==='arrow'||s.type==='line'||s.type==='connector') { renderArrow(s); return; }

      // ── filledarea: raster flood-fill result stored as img ───────────────
      if(s.type==='filledarea') {
        const el=document.createElement('div');
        el.className='wb-shape'; el.id='ws-'+s.id;
        el.style.cssText=`left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;position:absolute;opacity:${s.style.opacity||1};pointer-events:all;${s.locked?'cursor:default;':''}`;
        const inn=document.createElement('div');
        inn.className='wb-inner';
        const img=document.createElement('img');
        img.src=s.src||'';
        img.style.cssText='width:100%;height:100%;display:block;pointer-events:none;image-rendering:pixelated;';
        img.draggable=false;
        inn.appendChild(img);
        el.appendChild(inn);
        attachEv(el,s); CAN.appendChild(el);
        return;
      }

      const el = document.createElement('div');
      el.className='wb-shape'; el.id='ws-'+s.id;
      // Images: flip lives on the inner <img> element (applied below), so the
      // container only needs rotation. All other div-based shapes carry flip on
      // the container via buildShapeTransform.
      const containerTransform = s.type==='image'
        ? `rotate(${s.rotation||0}deg)`
        : buildShapeTransform(s);
      el.style.cssText=`left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;position:absolute;transform:${containerTransform};opacity:${s.style.opacity};${s.locked?'cursor:default;':''}`;

      const inn = document.createElement('div');
      inn.className='wb-inner';

      const sw = STROKE_W[s.style.size-1];
      const da = dashArr(s.style.dash, sw);
      const fill = getFill(s);
      const stroke = s.style.color;

      if(s.type==='rect') {
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<rect x="${sw/2}" y="${sw/2}" width="${s.w-sw}" height="${s.h-sw}" rx="3"
            fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}" stroke-linecap="round"/>
        </svg>`;
      } else if(s.type==='ellipse') {
        const rx=Math.max(0,(s.w-sw)/2), ry=Math.max(0,(s.h-sw)/2);
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<ellipse cx="${s.w/2}" cy="${s.h/2}" rx="${rx}" ry="${ry}"
            fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}"/>
        </svg>`;
      } else if(s.type==='triangle') {
        const pts=`${s.w/2},${sw/2} ${sw/2},${s.h-sw/2} ${s.w-sw/2},${s.h-sw/2}`;
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}" stroke-linejoin="round"/>
        </svg>`;
      } else if(s.type==='diamond') {
        const pts=`${s.w/2},${sw/2} ${s.w-sw/2},${s.h/2} ${s.w/2},${s.h-sw/2} ${sw/2},${s.h/2}`;
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}" stroke-linejoin="round"/>
        </svg>`;
      } else if(s.type==='star') {
        const cx=s.w/2,cy=s.h/2,r1=Math.min(cx,cy)-sw/2,r2=r1*.4;
        let pts=''; for(let i=0;i<10;i++){const a=(i*36-90)*Math.PI/180;const r=i%2===0?r1:r2;pts+=`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `;}
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}" stroke-linejoin="round"/>
        </svg>`;
      } else if(s.type==='hexagon') {
        const cx=s.w/2,cy=s.h/2,rx=cx-sw/2,ry=cy-sw/2;
        let pts=''; for(let i=0;i<6;i++){const a=(i*60-90)*Math.PI/180;pts+=`${cx+rx*Math.cos(a)},${cy+ry*Math.sin(a)} `;}
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="${da}" stroke-linejoin="round"/>
        </svg>`;
      } else if(s.type==='callout') {
        const r=6, tw=Math.min(s.w*.2,40), tx=s.w*.25;
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<path d="M${r} ${sw/2} H${s.w-r} Q${s.w-sw/2} ${sw/2} ${s.w-sw/2} ${r} V${s.h*.72} Q${s.w-sw/2} ${s.h*.82} ${s.w-r} ${s.h*.82} H${tx+tw} L${tx+tw/2} ${s.h-sw/2} L${tx} ${s.h*.82} H${r} Q${sw/2} ${s.h*.82} ${sw/2} ${s.h*.72} V${r} Q${sw/2} ${sw/2} ${r} ${sw/2} Z"
            fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
        </svg>
        <div style="position:absolute;top:6px;left:8px;right:8px;bottom:${s.h*.25}px;overflow:hidden;">
          <div contenteditable="true" style="outline:none;font-size:${[12,15,20,28][s.style.size-1]}px;color:${stroke};line-height:1.4;white-space:pre-wrap;word-break:break-word;">${s.text||''}</div>
        </div>`;
        // attach text events after
        const ta=inn.querySelector('[contenteditable]');
        ta.oninput=()=>{s.text=ta.textContent; save();};
        ta.addEventListener('mousedown',e=>e.stopPropagation());
      } else if(s.type==='text') {
        const fs=[14,18,24,32][s.style.size-1];
        const fontFamily = FONT_MAP[s.style.textFontFamily||'system'] || FONT_MAP.system;
        const fontWeight = s.style.textBold ? '700' : '400';
        const fontStyle  = s.style.textItalic ? 'italic' : 'normal';
        const decParts   = [s.style.textUnderline?'underline':'', s.style.textStrike?'line-through':''].filter(Boolean);
        const textDecoration = decParts.length ? decParts.join(' ') : 'none';
        const textAlign  = s.style.textAlign || 'left';
        const lineHeight = s.style.textLineHeight || 1.5;
        // drag handle bar at the top — gives a grabbable area that isn't contenteditable
        const handle=document.createElement('div');
        handle.style.cssText='height:8px;cursor:move;';
        inn.appendChild(handle);
        const ta=document.createElement('div');
        ta.contentEditable='true'; ta.spellcheck=false;
        ta.style.cssText=`font-size:${fs}px;color:${s.style.color};outline:none;cursor:text;white-space:pre-wrap;word-break:break-word;padding:2px 4px;line-height:${lineHeight};min-width:40px;min-height:${fs+8}px;font-family:${fontFamily};font-weight:${fontWeight};font-style:${fontStyle};text-decoration:${textDecoration};text-align:${textAlign};`;
        ta.textContent=s.text||'';
        ta.oninput=()=>{s.text=ta.textContent; save();};
        ta.onblur=()=>{s.text=ta.textContent; if(!s.text.trim()) deleteShape(s.id);};
        ta.onfocus=()=>{ selOnly(s.id); syncTextPopup(); };
        // don't stopPropagation here — handleShapeMD checks e.target.isContentEditable
        inn.appendChild(ta);
        el.style.cursor='move';
        el.appendChild(inn); attachEv(el,s); CAN.appendChild(el);
        setTimeout(()=>{ta.focus();caret(ta);},0);
        return;
      } else if(s.type==='sticky') {
        const fs=[13,16,20,26][s.style.size-1];
        const bg=cssFill(s,'#fef3c7');
        inn.style.cssText=`background:${bg};border-radius:3px;padding:10px;box-shadow:2px 3px 8px rgba(0,0,0,.12);height:100%;`;
        const ta=document.createElement('div');
        ta.contentEditable='true'; ta.spellcheck=false;
        ta.style.cssText=`font-size:${fs}px;color:${s.style.color};outline:none;white-space:pre-wrap;word-break:break-word;line-height:1.4;`;
        ta.textContent=s.text||'Type here…';
        ta.onfocus=()=>{ selOnly(s.id); if(ta.textContent==='Type here…') ta.textContent=''; };
        ta.onblur=()=>{ s.text=ta.textContent; if(!s.text.trim()){s.text='Type here…';ta.textContent='Type here…';} save(); };
        ta.oninput=()=>{s.text=ta.textContent; save();};
        ta.addEventListener('mousedown',e=>e.stopPropagation());
        inn.appendChild(ta);
      } else if(s.type==='image') {
        const img=document.createElement('img');
        img.src=s.src;
        img.style.width='100%'; img.style.height='100%';
        img.style.objectFit='fill'; img.style.display='block';
        img.style.pointerEvents='none'; img.style.borderRadius='3px';
        // apply flip transforms
        let xform='';
        if(s.flipH) xform+='scaleX(-1) ';
        if(s.flipV) xform+='scaleY(-1) ';
        if(xform) img.style.transform=xform.trim();
        // apply image filters
        if(s.imageFilters){
          const f=s.imageFilters;
          img.style.filter=buildImgFilter(f);
        }
        inn.appendChild(img);
      } else if(s.type==='frame') {
        inn.innerHTML=`<svg width="100%" height="100%" style="overflow:visible;pointer-events:none" xmlns="http://www.w3.org/2000/svg">
          ${gradDefs(s)}<rect x="0" y="0" width="${s.w}" height="${s.h}" fill="${fill||'none'}" stroke="${stroke}" stroke-width="${sw}" stroke-dasharray="8 4"/>
        </svg>
        <div style="position:absolute;top:-20px;left:0;font-size:11px;font-weight:600;color:${stroke};pointer-events:none;">${s.text||'Frame'}</div>`;
      }

      el.appendChild(inn); attachEv(el,s); CAN.appendChild(el);
      // apply glow effect if enabled
      if(s.style.glow){
        const gc=s.style.color;
        const glowFilter=`drop-shadow(0 0 3px ${gc}) drop-shadow(0 0 6px ${gc}) drop-shadow(0 0 12px ${gc})`;
        el.style.filter=glowFilter;
      }
    }

    function caret(el) {
      const r=document.createRange(),s=window.getSelection();
      r.selectNodeContents(el); r.collapse(false);
      s.removeAllRanges(); s.addRange(r);
    }

    // ── strokes (draw / highlighter) ──────────────────────────────────────────
    function renderStroke(s) {
      if(!s.points||s.points.length<2) return;
      // ── route pattern brushes to the dedicated renderer ──
      if(s.style.brushPattern&&s.style.brushPattern!=='none'){
        renderPatternStroke(s); return;
      }
      const id='wd-'+s.id;
      DSV.querySelector('#'+id)?.remove();
      removeStrokeGradDef(s.id); // drop any gradient def from a previous render of this stroke
      const sw=STROKE_W[s.style.size-1]*(s.type==='highlighter'?6:1);
      let d=`M${s.points[0][0]} ${s.points[0][1]}`;
      for(let i=1;i<s.points.length;i++){
        const [px,py]=s.points[i-1],[cx,cy]=s.points[i];
        d+=` Q${px} ${py} ${(px+cx)/2} ${(py+cy)/2}`;
      }
      const last=s.points[s.points.length-1];
      d+=` L${last[0]} ${last[1]}`;
      // Pencil strokes can carry a fill (solid/semi/gradient) just like closed
      // shapes — SVG fills an open path as if its ends were joined, so a
      // scribbled loop fills its enclosed area. Highlighters stay unfilled: a
      // translucent line is the point of that tool, not a fillable region.
      const fillable = s.type==='draw';
      if(fillable){
        const gd=gradDefs(s);
        if(gd){ const gdNode=svgFragmentToNode(gd); if(gdNode) DSV.appendChild(gdNode); }
      }
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.id=id;
      path.setAttribute('d',d);
      const strokeColor=s.type==='highlighter'?(s.style.color||'#fef08a'):s.style.color;
      path.setAttribute('stroke',strokeColor);
      path.setAttribute('stroke-width',sw);
      path.setAttribute('fill', fillable ? getFill(s) : 'none');
      path.setAttribute('stroke-linecap',s.type==='highlighter'?'square':'round');
      path.setAttribute('stroke-linejoin','round');
      path.setAttribute('opacity',s.type==='highlighter'?0.5:s.style.opacity);
      const da=dashArr(s.style.dash,STROKE_W[s.style.size-1]);
      if(da!=='none') path.setAttribute('stroke-dasharray',da);
      // ── apply stroke effect ──
      applyEffectToEl(path,s.style);
      DSV.appendChild(path);
    }


    // ── arrows / lines / connectors ───────────────────────────────────────────
    function renderArrow(s) {
      ASV.querySelector('#wa-'+s.id)?.remove();
      ASV.querySelector('#wah-'+s.id)?.remove();
      const sw=STROKE_W[s.style.size-1];
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.id='wa-'+s.id;
      g.setAttribute('opacity',s.style.opacity);

      const x1=s.x,y1=s.y,x2=s.x+s.w,y2=s.y+s.h;
      const da=dashArr(s.style.dash,sw);

      if(s.type==='arrow') {
        const mid=`arrhd-${s.id}`;
        const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
        const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
        mk.setAttribute('id',mid); mk.setAttribute('markerWidth','8'); mk.setAttribute('markerHeight','8');
        mk.setAttribute('refX','6'); mk.setAttribute('refY','3'); mk.setAttribute('orient','auto');
        const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
        poly.setAttribute('points','0 0, 6 3, 0 6'); poly.setAttribute('fill',s.style.color);
        mk.appendChild(poly); defs.appendChild(mk); g.appendChild(defs);
        const ln=svgLine(x1,y1,x2,y2,s.style.color,sw,da);
        ln.setAttribute('marker-end',`url(#${mid})`); g.appendChild(ln);
        const hitA=svgLine(x1,y1,x2,y2,'transparent',14,'none');
        hitA.classList.add('wb-hit');
        hitA.style.cursor='pointer';
        hitA.addEventListener('mousedown',e=>handleShapeMD(e,s));
        g.appendChild(hitA);
      } else if(s.type==='connector') {
        const dx=x2-x1, dy=y2-y1;
        const ls=s.connLineStyle||'curve';

        // ── build path ──────────────────────────────────────────────────────
        let d;
        if(ls==='straight'){
          d=`M${x1} ${y1} L${x2} ${y2}`;
        } else if(ls==='elbow'){
          const mx=x1+dx/2;
          d=`M${x1} ${y1} L${mx} ${y1} L${mx} ${y2} L${x2} ${y2}`;
        } else { // curve (default)
          const cp1x=x1+dx*.5, cp1y=y1, cp2x=x1+dx*.5, cp2y=y2;
          d=`M${x1} ${y1} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
        }

        // ── arrowhead marker helper ──────────────────────────────────────────
        function makeConnMarker(headType, idSuffix, atEnd) {
          if(!headType||headType==='none') return null;
          const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
          const mk=document.createElementNS('http://www.w3.org/2000/svg','marker');
          mk.setAttribute('id', idSuffix);
          mk.setAttribute('markerWidth','10'); mk.setAttribute('markerHeight','10');
          mk.setAttribute('orient','auto-start-reverse');
          if(headType==='arrow'){
            mk.setAttribute('refX', atEnd?'7':'3'); mk.setAttribute('refY','3');
            mk.setAttribute('markerWidth','8'); mk.setAttribute('markerHeight','6');
            const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
            poly.setAttribute('points','0 0, 7 3, 0 6'); poly.setAttribute('fill',s.style.color);
            mk.appendChild(poly);
          } else if(headType==='dot'){
            mk.setAttribute('refX','3'); mk.setAttribute('refY','3');
            mk.setAttribute('markerWidth','6'); mk.setAttribute('markerHeight','6');
            const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
            c.setAttribute('cx','3'); c.setAttribute('cy','3'); c.setAttribute('r','2.5');
            c.setAttribute('fill',s.style.color);
            mk.appendChild(c);
          } else if(headType==='diamond'){
            mk.setAttribute('refX','5'); mk.setAttribute('refY','3');
            mk.setAttribute('markerWidth','10'); mk.setAttribute('markerHeight','6');
            const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
            poly.setAttribute('points','0 3, 5 0, 10 3, 5 6'); poly.setAttribute('fill',s.style.color);
            mk.appendChild(poly);
          } else if(headType==='bar'){
            mk.setAttribute('refX','2'); mk.setAttribute('refY','3');
            mk.setAttribute('markerWidth','4'); mk.setAttribute('markerHeight','8');
            const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
            ln.setAttribute('x1','2'); ln.setAttribute('y1','0');
            ln.setAttribute('x2','2'); ln.setAttribute('y2','6');
            ln.setAttribute('stroke',s.style.color); ln.setAttribute('stroke-width','2');
            mk.appendChild(ln);
          }
          defs.appendChild(mk);
          return defs;
        }

        const startId=`csh-${s.id}`, endId=`ceh-${s.id}`;
        const startDefs=makeConnMarker(s.connStartHead||'none', startId, false);
        const endDefs=makeConnMarker(s.connEndHead||'arrow', endId, true);
        if(startDefs) g.appendChild(startDefs);
        if(endDefs) g.appendChild(endDefs);

        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d', d);
        path.setAttribute('stroke',s.style.color); path.setAttribute('stroke-width',sw);
        path.setAttribute('fill','none'); path.setAttribute('stroke-linecap','round');
        path.setAttribute('stroke-linejoin','round');
        if(da!=='none') path.setAttribute('stroke-dasharray',da);
        if(startDefs) path.setAttribute('marker-start',`url(#${startId})`);
        if(endDefs)   path.setAttribute('marker-end',  `url(#${endId})`);
        g.appendChild(path);

        // hit area
        const hitC=document.createElementNS('http://www.w3.org/2000/svg','path');
        hitC.classList.add('wb-hit');
        hitC.setAttribute('d', d);
        hitC.setAttribute('stroke','transparent'); hitC.setAttribute('stroke-width','14');
        hitC.setAttribute('fill','none'); hitC.style.cursor='pointer';
        hitC.addEventListener('mousedown',e=>handleShapeMD(e,s));
        g.appendChild(hitC);

        // connector label at midpoint
        if(s.label){
          let mx,my;
          if(ls==='straight'){ mx=(x1+x2)/2; my=(y1+y2)/2; }
          else if(ls==='elbow'){ mx=(x1+x2)/2; my=y1; }
          else { mx=(x1+x2)/2; my=(y1+y2)/2; } // bezier midpoint approx
          const lpad=6, lfs=12;
          const textEl=document.createElementNS('http://www.w3.org/2000/svg','text');
          textEl.setAttribute('x',mx); textEl.setAttribute('y',my);
          textEl.setAttribute('text-anchor','middle'); textEl.setAttribute('dominant-baseline','middle');
          textEl.setAttribute('font-size',lfs); textEl.setAttribute('fill',s.style.color);
          textEl.setAttribute('font-family','-apple-system,BlinkMacSystemFont,system-ui,sans-serif');
          textEl.setAttribute('font-weight','500'); textEl.setAttribute('pointer-events','none');
          textEl.textContent=s.label;
          // white pill behind text
          const bbox_w=s.label.length*lfs*0.6+lpad*2, bbox_h=lfs+lpad;
          const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
          bg.setAttribute('x',mx-bbox_w/2); bg.setAttribute('y',my-bbox_h/2);
          bg.setAttribute('width',bbox_w); bg.setAttribute('height',bbox_h);
          bg.setAttribute('rx',4); bg.setAttribute('fill','var(--wb-surface-solid)');
          bg.setAttribute('stroke',s.style.color); bg.setAttribute('stroke-width','0.8');
          bg.setAttribute('pointer-events','none');
          g.appendChild(bg); g.appendChild(textEl);
        }

        // double-click to edit connector label
        hitC.addEventListener('dblclick',e=>{
          e.stopPropagation();
          let mx,my;
          if(ls==='straight'){ mx=(x1+x2)/2; my=(y1+y2)/2; }
          else if(ls==='elbow'){ mx=(x1+x2)/2; my=y1; }
          else { mx=(x1+x2)/2; my=(y1+y2)/2; }
          // convert canvas coords to screen coords
          const r=CC.getBoundingClientRect();
          const sx=r.left+mx*zoom+panX, sy=r.top+my*zoom+panY;
          const inp=document.createElement('input');
          inp.type='text'; inp.value=s.label||'';
          inp.style.cssText=`position:fixed;left:${sx}px;top:${sy}px;transform:translate(-50%,-50%);`+
            `z-index:2147483647;padding:4px 8px;border-radius:6px;border:1.5px solid var(--wb-accent);`+
            `background:var(--wb-surface-solid);color:var(--wb-text);font-size:12px;font-family:var(--wb-font);`+
            `outline:none;min-width:80px;text-align:center;box-shadow:var(--wb-shadow);`;
          document.body.appendChild(inp);
          inp.focus(); inp.select();
          function commit(){ snap(); s.label=inp.value.trim()||undefined; renderArrow(s); save(); inp.remove(); }
          inp.onblur=commit;
          inp.onkeydown=ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); commit(); } if(ev.key==='Escape'){ inp.remove(); } };
        });
      } else {
        // plain line
        g.appendChild(svgLine(x1,y1,x2,y2,s.style.color,sw,da));
        const hitSL=svgLine(x1,y1,x2,y2,'transparent',14,'none');
        hitSL.classList.add('wb-hit');
        hitSL.style.cursor='pointer';
        hitSL.addEventListener('mousedown',e=>handleShapeMD(e,s));
        g.appendChild(hitSL);
      }
      if(s.style.glow){
        const gc=s.style.color;
        g.style.filter=`drop-shadow(0 0 3px ${gc}) drop-shadow(0 0 6px ${gc}) drop-shadow(0 0 12px ${gc})`;
      }
      ASV.appendChild(g);
      if(selectedIds.has(s.id)) renderArrHandles(s);
    }

    function svgLine(x1,y1,x2,y2,stroke,w,da) {
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',x1); l.setAttribute('y1',y1); l.setAttribute('x2',x2); l.setAttribute('y2',y2);
      l.setAttribute('stroke',stroke); l.setAttribute('stroke-width',w); l.setAttribute('stroke-linecap','round');
      if(da&&da!=='none') l.setAttribute('stroke-dasharray',da);
      return l;
    }

    function renderArrHandles(s) {
      ASV.querySelector('#wah-'+s.id)?.remove();
      const g=document.createElementNS('http://www.w3.org/2000/svg','g');
      g.id='wah-'+s.id;

      // start and end endpoint handles — drag to reposition/resize
      [['start',s.x,s.y],['end',s.x+s.w,s.y+s.h]].forEach(([which,x,y])=>{
        const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',7);
        c.setAttribute('fill','#fff'); c.setAttribute('stroke','#3b82f6'); c.setAttribute('stroke-width','2');
        c.style.cursor='crosshair';
        c.addEventListener('mousedown',e=>{e.stopPropagation();startArrDrag(e,s,which);});
        g.appendChild(c);
      });

      ASV.appendChild(g);
    }

    // ── selection ─────────────────────────────────────────────────────────────
    function selOnly(id) { selectedIds.clear(); selectedIds.add(id); updSel(); }

    function updSel() {
      R.querySelectorAll('.wb-shape').forEach(el=>{
        const id=el.id.replace('ws-','');
        el.classList.toggle('selected',selectedIds.has(id));
        el.querySelectorAll('.wb-rh,.wb-rot').forEach(h=>h.remove());
        if(selectedIds.has(id)) addHandles(el,id);
      });
      shapes.filter(s=>s.type==='arrow'||s.type==='line'||s.type==='connector').forEach(s=>{
        ASV.querySelector('#wah-'+s.id)?.remove();
        if(selectedIds.has(s.id)) renderArrHandles(s);
      });
      // ── selection bounding-box overlay for strokes (they have no div element) ──
      DSV.querySelectorAll('.wb-stroke-sel').forEach(e=>e.remove());
      shapes.forEach(s=>{
        if(!selectedIds.has(s.id)) return;
        if((s.type==='draw'||s.type==='highlighter')&&s.points&&s.points.length){
          let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
          s.points.forEach(pt=>{mnX=Math.min(mnX,pt[0]);mnY=Math.min(mnY,pt[1]);mxX=Math.max(mxX,pt[0]);mxY=Math.max(mxY,pt[1]);});
          const pad=8;
          const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
          rect.setAttribute('x',mnX-pad); rect.setAttribute('y',mnY-pad);
          rect.setAttribute('width',Math.max(4,mxX-mnX)+pad*2);
          rect.setAttribute('height',Math.max(4,mxY-mnY)+pad*2);
          rect.setAttribute('fill','none'); rect.setAttribute('stroke','#3b82f6');
          rect.setAttribute('stroke-width','1.5'); rect.setAttribute('stroke-dasharray','5 3');
          rect.setAttribute('rx','4'); rect.setAttribute('pointer-events','none');
          rect.classList.add('wb-stroke-sel');
          DSV.appendChild(rect);
        }
      });
      // show/hide text popup when a text shape is selected
      syncTextPopup();
      // sync gradient panel when a gradient-filled shape is selected
      if(selectedIds.size===1){
        const selS=shapes.find(s=>selectedIds.has(s.id));
        if(selS&&(selS.style.fillStyle==='gradient-linear'||selS.style.fillStyle==='gradient-radial')){
          style.fillStyle=selS.style.fillStyle;
          style.fillColor=selS.style.fillColor;
          style.gradientEnd=selS.style.gradientEnd||'#ffffff';
          style.gradientAngle=selS.style.gradientAngle??135;
          updGradientPanel();
        }
      }
    }

    function addHandles(el,id) {
      const s=shapes.find(sh=>sh.id===id);
      if(!s||['draw','highlighter','arrow','line','connector'].includes(s.type)) return;
      ['tl','tr','bl','br','tm','bm','ml','mr'].forEach(pos=>{
        const h=document.createElement('div');
        h.className=`wb-rh ${pos}`;
        h.addEventListener('mousedown',e=>{e.stopPropagation();startResize(e,s,pos);});
        el.querySelector('.wb-inner').appendChild(h);
      });
      const r=document.createElement('div');
      r.className='wb-rot';
      r.addEventListener('mousedown',e=>{e.stopPropagation();startRotate(e,s);});
      el.querySelector('.wb-inner').appendChild(r);
    }

    // ── drag/move ─────────────────────────────────────────────────────────────
    function attachEv(el,s) {
      el.addEventListener('mousedown',e=>handleShapeMD(e,s));
    }

    function handleShapeMD(e,s) {
      // Eraser: deliberately NOT handled here. eraseAtPoint (triggered by the
      // CC-level mousedown/mousemove handlers, which this event still bubbles
      // up to) now owns all erasing uniformly — including shape types this
      // per-element path never used to cover — so clicking and dragging behave
      // identically no matter what element the click happened to land on.
      // ── fill tool: apply fill to clicked shape ──────────────────────────
      if(activeTool==='fill'){
        e.stopPropagation();
        const cp=s2c(e.clientX,e.clientY);
        applyFillToShape(s, cp.x, cp.y);
        return;
      }
      if(activeTool!=='select'&&activeTool!=='hand') return;
      e.stopPropagation();
      hideCtx();
      if(e.button===2) return;
      if(!e.shiftKey){ if(!selectedIds.has(s.id)) selOnly(s.id); }
      else { selectedIds.has(s.id)?selectedIds.delete(s.id):selectedIds.add(s.id); updSel(); }
      // If the clicked shape belongs to a group, select all group members together
      if(s.groupId){
        shapes.forEach(sh=>{ if(sh.groupId===s.groupId) selectedIds.add(sh.id); });
        updSel();
      }
      if(s.locked) return;
      // For text/sticky: allow drag from the shape border/padding but not from
      // inside the contenteditable itself (where clicks should go to typing).
      if(s.type==='text'||s.type==='sticky'){
        if(e.target.isContentEditable||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
      }
      startDrag(e,[...selectedIds]);
    }

    function startDrag(e,ids) {
      const sp=s2c(e.clientX,e.clientY);
      // snapshot both position AND stroke points at drag start
      const ss={};
      ids.forEach(id=>{
        const s=shapes.find(sh=>sh.id===id); if(!s) return;
        ss[id]={x:s.x, y:s.y};
        if((s.type==='draw'||s.type==='highlighter')&&s.points)
          ss[id].pts=s.points.map(p=>[p[0],p[1]]); // deep copy of original points
      });
      let moved=false;
      function onMove(ev){
        const cp=s2c(ev.clientX,ev.clientY);
        const dx=cp.x-sp.x, dy=cp.y-sp.y;
        if(!moved&&(Math.abs(dx)>2||Math.abs(dy)>2)){moved=true;snap();}
        if(!moved) return;
        ids.forEach(id=>{
          const s=shapes.find(sh=>sh.id===id); if(!s||!ss[id]) return;
          if(s.type==='draw'||s.type==='highlighter'){
            // translate every point relative to the saved snapshot
            if(ss[id].pts) s.points=ss[id].pts.map(p=>[p[0]+dx,p[1]+dy]);
            renderStroke(s);
          } else if(s.type==='arrow'||s.type==='line'||s.type==='connector'){
            s.x=sg(ss[id].x+dx); s.y=sg(ss[id].y+dy);
            renderArrow(s);
          } else {
            s.x=sg(ss[id].x+dx); s.y=sg(ss[id].y+dy);
            const el=R.querySelector('#ws-'+id);
            if(el){el.style.left=s.x+'px';el.style.top=s.y+'px';}
          }
        });
      }
      function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);if(moved)save();}
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    }

    // ── resize ────────────────────────────────────────────────────────────────
    function startResize(e,s,pos) {
      e.stopPropagation();
      const sp=s2c(e.clientX,e.clientY);
      const orig={x:s.x,y:s.y,w:s.w,h:s.h};
      let resized=false; // lazy snap: only snap when resize actually starts
      function onMove(ev){
        if(!resized){snap();resized=true;}
        const cp=s2c(ev.clientX,ev.clientY);
        const dx=cp.x-sp.x,dy=cp.y-sp.y;
        let{x,y,w,h}=orig;
        if(pos.includes('r'))w=Math.max(20,orig.w+dx);
        if(pos.includes('l')){x=orig.x+dx;w=Math.max(20,orig.w-dx);}
        if(pos.includes('b'))h=Math.max(20,orig.h+dy);
        if(pos.includes('t')){y=orig.y+dy;h=Math.max(20,orig.h-dy);}
        if(pos==='tm'||pos==='bm')w=orig.w;
        if(pos==='ml'||pos==='mr')h=orig.h;
        s.x=x;s.y=y;s.w=w;s.h=h;
        R.querySelector('#ws-'+s.id)?.remove();
        DSV.querySelector('#wd-'+s.id)?.remove();
        renderShape(s); updSel();
      }
      function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);if(resized)save();}
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    }

    // ── rotate ────────────────────────────────────────────────────────────────
    function startRotate(e,s) {
      e.stopPropagation();
      const el=R.querySelector('#ws-'+s.id);
      const r=el.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const sa=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
      const or=s.rotation||0;
      let rotated=false; // lazy snap
      function onMove(ev){
        if(!rotated){snap();rotated=true;}
        let a=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;
        let rot=or+(a-sa);
        if(ev.shiftKey) rot=Math.round(rot/15)*15;
        s.rotation=rot;
        if(el) el.style.transform = s.type==='image'
          ? `rotate(${rot}deg)`
          : buildShapeTransform(s);
      }
      function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);if(rotated)save();}
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    }

    // ── arrow endpoint drag ───────────────────────────────────────────────────
    function startArrDrag(e,s,which) {
      const ox=s.x,oy=s.y,ow=s.w,oh=s.h;
      let dragged=false; // lazy snap
      function onMove(ev){
        if(!dragged){snap();dragged=true;}
        const cp=s2c(ev.clientX,ev.clientY);
        if(which==='start'){s.w=(ox+ow)-cp.x;s.h=(oy+oh)-cp.y;s.x=cp.x;s.y=cp.y;}
        else{s.w=cp.x-s.x;s.h=cp.y-s.y;}
        renderArrow(s);
      }
      function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);if(dragged)save();}
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    }

    // ── canvas mouse events ───────────────────────────────────────────────────
    let drawing=false, drawShape=null, drawStart=null, drawPath=[], livePath=null, liveGroup=null;
    // ── GPU-accelerated drawing state ─────────────────────────────────────────
    // liveD/liveLastIdx: incremental SVG path — O(1) per new point vs O(n)
    // liveRafId: pending requestAnimationFrame ticket (null = none scheduled)
    // lastRawPt: last accepted point, used for distance-decimation
    let liveD='', liveLastIdx=-1, liveRafId=null, lastRawPt=null;
    let selStart=null, panning=false, panStart=null, panOrig=null, laserPts=[];
    let erasing=false, erasedSnap=false; // eraser drag state
    let eraserMode='object'; // 'object' | 'pixel'
    let snapGrid=false;      // snap shapes to 20px grid
    let connLineStyle='curve';  // 'curve' | 'straight' | 'elbow'
    let connStartHead='none';   // 'none' | 'arrow' | 'dot' | 'diamond' | 'bar'
    let connEndHead='arrow';    // same options
    let laserFadeTimer=null;             // laser trail auto-fade
    let fillTolerance=30;               // flood-fill tolerance (0–120)

    // ── hit-testing utilities for the select tool ─────────────────────────────
    // Distance from point (px,py) to segment (ax,ay)-(bx,by). Shared by the
    // arrow/line/connector fallback check and the pencil-stroke check below —
    // both need "how close is this click to this line segment", not just
    // "how close to its endpoints".
    function ptSegDist(px,py,ax,ay,bx,by){
      const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
      if(len2===0) return Math.hypot(px-ax,py-ay);
      const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2));
      return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
    }
    // Reused to test whether a click landed inside a *filled* pencil stroke's
    // enclosed area. A real Path2D + canvas geometry query handles curved or
    // self-crossing scribbles correctly, which a hand-rolled point-in-polygon
    // check would not — and it's never attached to the page, so it's free to
    // query without affecting anything visible.
    const hitCtx = document.createElement('canvas').getContext('2d');

    // ── eraser hit-testing ──────────────────────────────────────────────────
    // Rotation-aware point-in-shape test for primitives (rect/ellipse/etc.), so
    // a rotated shape's eraser hit area matches how it actually looks instead
    // of its unrotated bounding box.
    function pointInShapeRotated(px,py,s){
      const cx=s.x+s.w/2, cy=s.y+s.h/2;
      const rad=(s.rotation||0)*Math.PI/180;
      const cos=Math.cos(rad), sin=Math.sin(rad);
      const dx=px-cx, dy=py-cy;
      const lx = cos*dx + sin*dy;
      const ly = -sin*dx + cos*dy;
      return lx>=-s.w/2 && lx<=s.w/2 && ly>=-s.h/2 && ly<=s.h/2;
    }
    // One pass of "erase whatever's at this point" — shared by a plain click
    // AND continuous dragging, so both behave identically. Previously, only
    // strokes could be erased by dragging over them (rect/ellipse/arrows/etc.
    // had no drag-erase handling at all — only a direct click on their own
    // element worked), and a stroke needed an actual drag: a stationary click
    // never erased anything because nothing hit-tested on mousedown.
    //  - object mode: touching any shape deletes the whole thing.
    //  - pixel mode: touching a stroke trims just the touched points, splitting
    //    it into separate strokes if the gap opens in the middle; everything
    //    else has no meaningful "partial" erase, so it's a whole-shape delete
    //    either way (matching what pixel mode already did for primitives).
    function eraseAtPoint(p){
      const ERAD=14/zoom;
      const toCheck=[...shapes]; // snapshot: erasing mutates `shapes` as we go
      toCheck.forEach(s=>{
        if(!shapes.find(sh=>sh.id===s.id)) return; // already erased this pass

        if(s.type==='draw'||s.type==='highlighter'){
          if(!s.points||s.points.length<1) return;
          const sw=STROKE_W[s.style.size-1]*(s.type==='highlighter'?6:1);
          const tol=Math.max(ERAD, sw/2+8/zoom);
          // a point counts as "touched" if the eraser is near it OR near either
          // segment connecting it to a neighbor, so a fast/sparse stroke can't
          // let the eraser slip between two widely-spaced points unnoticed —
          // the same gap the select-tool fix closed for clicking.
          const touched=(i)=>{
            const pt=s.points[i];
            if(Math.hypot(pt[0]-p.x,pt[1]-p.y)<tol) return true;
            if(i>0){ const a=s.points[i-1]; if(ptSegDist(p.x,p.y,a[0],a[1],pt[0],pt[1])<tol) return true; }
            if(i<s.points.length-1){ const b=s.points[i+1]; if(ptSegDist(p.x,p.y,pt[0],pt[1],b[0],b[1])<tol) return true; }
            return false;
          };
          if(!s.points.some((_,i)=>touched(i))) return;

          if(!erasedSnap){snap();erasedSnap=true;}
          if(eraserMode==='object'){ deleteShape(s.id,true); return; }
          // pixel mode: keep the untouched points, splitting into separate
          // surviving runs wherever a gap opens up
          const segments=[]; let seg=[];
          s.points.forEach((pt,i)=>{
            if(!touched(i)) seg.push(pt);
            else { if(seg.length>=2) segments.push(seg); seg=[]; }
          });
          if(seg.length>=2) segments.push(seg);
          if(segments.length===0){ deleteShape(s.id,true); }
          else {
            s.points=segments[0]; renderStroke(s);
            for(let si=1;si<segments.length;si++){
              const ns={id:uid(),type:s.type,points:segments[si],style:clone(s.style),x:0,y:0,w:0,h:0};
              if(s.groupId) ns.groupId=s.groupId;
              shapes.push(ns); renderStroke(ns);
            }
          }
          return;
        }

        if(s.type==='arrow'||s.type==='line'||s.type==='connector'){
          if(ptSegDist(p.x,p.y,s.x,s.y,s.x+s.w,s.y+s.h)<ERAD){
            if(!erasedSnap){snap();erasedSnap=true;}
            deleteShape(s.id,true);
          }
          return;
        }

        // everything else: primitives (rect/ellipse/triangle/diamond/star/
        // hexagon/callout/frame/text/sticky/image) — whole-shape delete,
        // rotation-aware so a rotated shape's hit area matches its visuals
        if(pointInShapeRotated(p.x,p.y,s)){
          if(!erasedSnap){snap();erasedSnap=true;}
          deleteShape(s.id,true);
        }
      });
    }

    CC.addEventListener('mousedown', e => {
      if(e.button!==0) return;
      hideCtx();
      const p=s2c(e.clientX,e.clientY);

      if(activeTool==='hand'||(e.button===0&&e.altKey)){
        panning=true; panStart={x:e.clientX,y:e.clientY}; panOrig={x:panX,y:panY};
        CC.style.cursor='grabbing'; return;
      }
      if(activeTool==='laser'){
        laserPts=[[p.x,p.y]]; LAS.style.display='block';
        LTR.style.opacity='1'; LTR.style.transition='';
        LAS.style.left=p.x+'px'; LAS.style.top=p.y+'px'; return;
      }
      if(activeTool==='select'){
        // ── If the event originated from inside a .wb-shape div, handleShapeMD
        //    already ran on the shape element. Don't clear selection or start
        //    rubber-band — just let the shape's own handler own this event.
        if(e.target.closest && e.target.closest('.wb-shape')) return;

        // ── Arrow / line / connector proximity hit-test
        //    (ASV has pointer-events:none so its children can't fire directly —
        //    hitA/hitC/hitSL usually catch these first at their own native hit
        //    width; this is a wider-tolerance fallback for near-misses on those.)
        //    Walk topmost-first (end of array = front of z-order) so that when
        //    two lines overlap, the click resolves to the one actually on top
        //    instead of whichever happens to be first in the shapes array.
        //    Tolerance is divided by zoom so it stays ~14 *screen* pixels of
        //    forgiveness at any zoom level, rather than shrinking to almost
        //    nothing once you've zoomed out.
        const arrTol = 14/zoom;
        let hitArr=null;
        for(let i=shapes.length-1;i>=0;i--){
          const s=shapes[i];
          if(s.type!=='arrow'&&s.type!=='line'&&s.type!=='connector') continue;
          if(ptSegDist(p.x,p.y,s.x,s.y,s.x+s.w,s.y+s.h)<arrTol){ hitArr=s; break; }
        }
        if(hitArr){ handleShapeMD(e,hitArr); return; }

        // ── Pencil / highlighter stroke hit-test
        //    (DSV has pointer-events:none so paths can't fire directly at all —
        //    unlike arrows, strokes have no native hit element, so this is the
        //    ONLY mechanism that selects them.)
        //    Topmost-first, same reasoning as above. Two checks per stroke:
        //     1) proximity to each segment of the actual curve — not just to
        //        the sparse recorded points. A fast or long stroke can have
        //        points spaced far enough apart that a click squarely on the
        //        visible curve, but between two points, used to miss both.
        //     2) for a *filled* pencil stroke (solid/semi/gradient), a click
        //        anywhere inside the enclosed area also counts, same as any
        //        other filled shape — checked against the real rendered path
        //        geometry (via Path2D) so it's correct even for a scribble
        //        that crosses itself, not just a hand-rolled approximation.
        const strokeTol = 14/zoom;
        let hitStroke=null;
        for(let i=shapes.length-1;i>=0;i--){
          const s=shapes[i];
          if(s.type!=='draw'&&s.type!=='highlighter') continue;
          if(!s.points||s.points.length<2) continue;
          const sw=STROKE_W[s.style.size-1]*(s.type==='highlighter'?6:1);
          const tol=Math.max(strokeTol, sw/2+8/zoom);
          let near=false;
          for(let j=1;j<s.points.length&&!near;j++){
            const [ax,ay]=s.points[j-1],[bx,by]=s.points[j];
            if(ptSegDist(p.x,p.y,ax,ay,bx,by)<tol) near=true;
          }
          if(!near && s.type==='draw' && s.style.fillStyle!=='none'){
            const d=DSV.querySelector('#wd-'+s.id)?.getAttribute('d');
            if(d){ try{ near=hitCtx.isPointInPath(new Path2D(d),p.x,p.y); }catch(err){} }
          }
          if(near){ hitStroke=s; break; }
        }
        if(hitStroke){ handleShapeMD(e,hitStroke); return; }

        // ── Nothing hit — start rubber-band selection
        selectedIds.clear(); updSel();
        selStart=p; SBX.style.display='block';
        SBX.style.left=p.x+'px'; SBX.style.top=p.y+'px'; SBX.style.width='0'; SBX.style.height='0';
        return;
      }
      if(activeTool==='draw'||activeTool==='highlighter'){
        snap(); // snapshot before stroke so undo removes exactly this stroke
        drawing=true; drawPath=[[p.x,p.y]];
        liveD=''; liveLastIdx=-1; lastRawPt=[p.x,p.y];
        if(style.brushPattern&&style.brushPattern!=='none'){
          // pattern brush — use a <g> for live preview
          liveGroup=svgN('g',{id:'wdlive',opacity:activeTool==='highlighter'?0.5:style.opacity});
          applyEffectToEl(liveGroup,style);
          LSV.appendChild(liveGroup);  // isolated compositor layer
        } else {
          // standard smooth path
          removeStrokeGradDef('wdlive', LSV); // clear any leftover live gradient def
          livePath=document.createElementNS('http://www.w3.org/2000/svg','path');
          const sw=STROKE_W[style.size-1]*(activeTool==='highlighter'?6:1);
          livePath.setAttribute('stroke',style.color);
          livePath.setAttribute('stroke-width',sw);
          // live fill preview mirrors renderStroke(): pencil can be filled (solid/
          // semi/gradient) so you see it while drawing, not just after mouseup —
          // highlighter stays a plain unfilled line.
          if(activeTool==='draw'){
            const liveStub={id:'wdlive',style};
            const gd=gradDefs(liveStub);
            if(gd){ const gdNode=svgFragmentToNode(gd); if(gdNode) LSV.appendChild(gdNode); }
            livePath.setAttribute('fill', getFill(liveStub));
          } else {
            livePath.setAttribute('fill','none');
          }
          livePath.setAttribute('stroke-linecap',activeTool==='highlighter'?'square':'round');
          livePath.setAttribute('stroke-linejoin','round');
          livePath.setAttribute('opacity',activeTool==='highlighter'?0.5:style.opacity);
          const da=dashArr(style.dash,STROKE_W[style.size-1]);
          if(da!=='none') livePath.setAttribute('stroke-dasharray',da);
          applyEffectToEl(livePath,style);
          LSV.appendChild(livePath);   // isolated compositor layer
        }
        return;
      }
      if(activeTool==='eraser'){ erasing=true; erasedSnap=false; eraseAtPoint(p); return; }
      if(activeTool==='fill'){
        // First try proximity hit-test for arrows/strokes (SVG-rendered, no div)
        const hitArrF = shapes.find(s => {
          if(s.type!=='arrow'&&s.type!=='line'&&s.type!=='connector') return false;
          const ax=s.x,ay=s.y,bx=s.x+s.w,by=s.y+s.h;
          const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
          if(len2===0) return Math.hypot(p.x-ax,p.y-ay)<14;
          const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/len2));
          return Math.hypot(p.x-(ax+t*dx),p.y-(ay+t*dy))<14;
        });
        if(hitArrF){ applyFillToShape(hitArrF,p.x,p.y); return; }
        const hitStrokeF = shapes.find(s =>
          (s.type==='draw'||s.type==='highlighter') &&
          s.points && s.points.some(pt=>Math.hypot(pt[0]-p.x,pt[1]-p.y)<14)
        );
        if(hitStrokeF){ applyFillToShape(hitStrokeF,p.x,p.y); return; }
        // Empty canvas — flood fill
        floodFillStrokes(p.x, p.y);
        return;
      }
      if(['rect','ellipse','triangle','diamond','star','hexagon','callout','frame'].includes(activeTool)){
        drawing=true; drawStart=p;
        drawShape={id:uid(),type:activeTool,x:sg(p.x),y:sg(p.y),w:1,h:1,rotation:0,style:clone(style),text:''};
        snap(); shapes.push(drawShape); renderShape(drawShape); return;
      }
      if(activeTool==='arrow'||activeTool==='line'||activeTool==='connector'){
        drawing=true; drawStart=p;
        const sx=sg(p.x), sy=sg(p.y);
        const extraConn = activeTool==='connector' ? {connLineStyle, connStartHead, connEndHead} : {};
        drawShape={id:uid(),type:activeTool,x:sx,y:sy,w:0,h:0,rotation:0,style:clone(style),...extraConn};
        snap(); shapes.push(drawShape); renderArrow(drawShape); return;
      }
      if(activeTool==='text'){
        const s={id:uid(),type:'text',x:p.x,y:p.y,w:200,h:40,rotation:0,style:clone(style),text:''};
        snap(); shapes.push(s); renderShape(s); selOnly(s.id); save(); setTool('select'); return;
      }
      if(activeTool==='sticky'){
        const s={id:uid(),type:'sticky',x:p.x,y:p.y,w:160,h:120,rotation:0,style:clone(style),text:''};
        s.style.fillColor='#fef3c7';
        snap(); shapes.push(s); renderShape(s); selOnly(s.id); save(); setTool('select'); return;
      }
      if(activeTool==='image') return; // image is triggered directly from toolbar button
    });

    CC.addEventListener('mousemove', e => {
      const p=s2c(e.clientX,e.clientY);
      if(panning){panX=panOrig.x+(e.clientX-panStart.x);panY=panOrig.y+(e.clientY-panStart.y);applyXform();return;}
      if(activeTool==='laser'){
        LAS.style.left=p.x+'px'; LAS.style.top=p.y+'px';
        laserPts.push([p.x,p.y]); if(laserPts.length>120)laserPts.shift();
        renderLaser(); return;
      }
      // ── eraser drag (must come before !drawing guard) ──
      if(erasing){
        eraseAtPoint(p);
        return;
      }
      if(selStart){
        const x=Math.min(selStart.x,p.x),y=Math.min(selStart.y,p.y);
        const w=Math.abs(p.x-selStart.x),h=Math.abs(p.y-selStart.y);
        SBX.style.left=x+'px';SBX.style.top=y+'px';SBX.style.width=w+'px';SBX.style.height=h+'px';
        return;
      }
      if(!drawing) return;
      if(activeTool==='draw'||activeTool==='highlighter'){
        if(style.brushPattern&&style.brushPattern!=='none'){
          // Pattern brushes: no decimation (spray is random, others need every point)
          if(style.brushPattern==='spray'){
            const spread=STROKE_W[style.size-1]*7;
            for(let i=0;i<6;i++){
              const a=Math.random()*Math.PI*2, r=Math.random()*spread;
              drawPath.push([p.x+Math.cos(a)*r, p.y+Math.sin(a)*r]);
            }
          } else {
            drawPath.push([p.x,p.y]);
          }
        } else {
          // Standard path: skip points within 2 canvas-units of the last accepted
          // point — at typical zoom this is ~1–2 screen pixels and invisible to the
          // eye, but halves the point count on slow/precise movements.
          const d2 = lastRawPt
            ? (p.x-lastRawPt[0])**2 + (p.y-lastRawPt[1])**2
            : Infinity;
          if(d2 >= 4){ // 2² = 4 (avoids sqrt)
            drawPath.push([p.x,p.y]);
            lastRawPt=[p.x,p.y];
          }
        }
        // Schedule a single render at the next display frame.
        // Many mousemove events arrive per frame; rAF coalesces them into one draw.
        if(!liveRafId) liveRafId=requestAnimationFrame(liveRafTick);
        return;
      }
      if(!drawShape) return;
      if(['rect','ellipse','triangle','diamond','star','hexagon','callout','frame'].includes(activeTool)){
        const px=sg(p.x), py=sg(p.y);
        let x=Math.min(drawStart.x,px),y=Math.min(drawStart.y,py);
        let w=Math.abs(px-drawStart.x),h=Math.abs(py-drawStart.y);
        if(e.shiftKey){const m=Math.max(w,h);w=m;h=m;}
        drawShape.x=x;drawShape.y=y;drawShape.w=Math.max(4,w);drawShape.h=Math.max(4,h);
        R.querySelector('#ws-'+drawShape.id)?.remove();
        renderShape(drawShape);
      }
      if(activeTool==='arrow'||activeTool==='line'||activeTool==='connector'){
        drawShape.w=sg(p.x)-drawShape.x; drawShape.h=sg(p.y)-drawShape.y;
        renderArrow(drawShape);
      }
    });

    CC.addEventListener('mouseup', e => {
      if(panning){panning=false;CC.style.cursor=activeTool==='hand'?'grab':'default';return;}
      if(erasing){erasing=false;if(erasedSnap)save();return;}
      if(activeTool==='laser'){LAS.style.display='none';laserPts=[];clearTimeout(laserFadeTimer);LTR.innerHTML='';return;}
      if(selStart){
        const p=s2c(e.clientX,e.clientY);
        const x1=Math.min(selStart.x,p.x),y1=Math.min(selStart.y,p.y);
        const x2=Math.max(selStart.x,p.x),y2=Math.max(selStart.y,p.y);
        if(x2-x1>4||y2-y1>4){
          shapes.forEach(s=>{
            if(s.type==='draw'||s.type==='highlighter'){
              // use actual point bounding box for strokes
              if(!s.points||!s.points.length) return;
              let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
              s.points.forEach(pt=>{mnX=Math.min(mnX,pt[0]);mnY=Math.min(mnY,pt[1]);mxX=Math.max(mxX,pt[0]);mxY=Math.max(mxY,pt[1]);});
              if(mnX>=x1&&mnY>=y1&&mxX<=x2&&mxY<=y2) selectedIds.add(s.id);
            } else if(s.type==='arrow'||s.type==='line'||s.type==='connector'){
              // arrows can have negative w/h when drawn right-to-left or bottom-to-top
              const realX=Math.min(s.x,s.x+(s.w||0)), realY=Math.min(s.y,s.y+(s.h||0));
              const realW=Math.abs(s.w||0),         realH=Math.abs(s.h||0);
              if(realX>=x1&&realY>=y1&&realX+realW<=x2&&realY+realH<=y2) selectedIds.add(s.id);
            } else {
              const sx=s.x||0,sy=s.y||0,sw=s.w||0,sh=s.h||0;
              if(sx>=x1&&sy>=y1&&sx+sw<=x2&&sy+sh<=y2) selectedIds.add(s.id);
            }
          });
          updSel();
        }
        selStart=null; SBX.style.display='none'; return;
      }
      if(!drawing) return;
      drawing=false;
      if(activeTool==='draw'||activeTool==='highlighter'){
        if(drawPath.length>1){
          const s={id:uid(),type:activeTool,points:drawPath,style:clone(style),x:0,y:0,w:0,h:0};
          // don't snap again — already live
          shapes.push(s); renderStroke(s);
        }
        if(liveRafId){cancelAnimationFrame(liveRafId);liveRafId=null;}
        if(livePath){livePath.remove();livePath=null;}
        if(liveGroup){liveGroup.remove();liveGroup=null;}
        removeStrokeGradDef('wdlive', LSV); // clear the temporary live-preview gradient def
        drawPath=[]; liveD=''; liveLastIdx=-1; lastRawPt=null; save(); return;
      }
      if(['rect','ellipse','triangle','diamond','star','hexagon','callout','frame'].includes(activeTool)){
        if(drawShape&&drawShape.w<4){drawShape.w=120;drawShape.h=80;R.querySelector('#ws-'+drawShape.id)?.remove();renderShape(drawShape);}
        selOnly(drawShape.id); drawShape=null; save(); setTool('select'); return;
      }
      if(activeTool==='arrow'||activeTool==='line'||activeTool==='connector'){
        if(drawShape&&Math.abs(drawShape.w)<4&&Math.abs(drawShape.h)<4){
          shapes.splice(shapes.indexOf(drawShape),1);
          ASV.querySelector('#wa-'+drawShape.id)?.remove();
        } else { selOnly(drawShape.id); }
        drawShape=null; save(); setTool('select'); return;
      }
    });

    // Called once per display frame (via requestAnimationFrame) to flush all
    // points accumulated since the previous frame into the live SVG path.
    function liveRafTick(){
      liveRafId=null;
      updateLive();
    }

    function updateLive() {
      if(style.brushPattern&&style.brushPattern!=='none'){
        if(!liveGroup||drawPath.length<1) return;
        if(style.brushPattern==='spray'){
          // Append only the circles for points added since last tick.
          // liveLastIdx tracks the last index already rendered into liveGroup.
          const from = liveLastIdx < 0 ? 0 : liveLastIdx;
          for(let i=from;i<drawPath.length;i++){
            liveGroup.appendChild(svgN('circle',{
              cx:drawPath[i][0],cy:drawPath[i][1],
              r:STROKE_W[style.size-1]*0.6,fill:style.color
            }));
          }
          liveLastIdx=drawPath.length;
        } else {
          // Non-spray patterns need a full redraw (geometry depends on whole path)
          liveGroup.innerHTML='';
          if(drawPath.length>1) renderPatternToGroup(drawPath,style,liveGroup);
          liveLastIdx=drawPath.length;
        }
        return;
      }
      if(!livePath||drawPath.length<2) return;

      // ── Incremental quadratic-bezier path  ──────────────────────────────────
      // The path formula for n+1 points is:
      //   M p0  Q p0 mid01  Q p1 mid12 … Q p_{n-1} mid_{n-1,n}  L pn
      //
      // Each new point only adds ONE new Q segment, so we keep liveD as the
      // growing prefix (without the final L) and just concatenate the new segment.
      // This turns the per-frame work from O(total_points) → O(new_points).

      if(liveLastIdx < 0){
        // First real call — write the M origin
        liveD = `M${drawPath[0][0]} ${drawPath[0][1]}`;
        liveLastIdx = 0;
      }

      // Append Q segments for every point added since last frame
      for(let i=liveLastIdx+1; i<drawPath.length; i++){
        const [px,py]=drawPath[i-1], [cx,cy]=drawPath[i];
        liveD += ` Q${px} ${py} ${(px+cx)/2} ${(py+cy)/2}`;
      }
      liveLastIdx = drawPath.length - 1;

      // setAttribute once per frame: the only DOM write
      const [lx,ly] = drawPath[liveLastIdx];
      livePath.setAttribute('d', liveD + ` L${lx} ${ly}`);
    }

    function renderLaser() {
      clearTimeout(laserFadeTimer);
      LTR.innerHTML = '';
      if (laserPts.length < 2) return;

      const n = laserPts.length;
      const tip = laserPts[n - 1];

      // ── SVG filters ───────────────────────────────────────────────────────
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const glowId = 'lsr-glow-' + Date.now();
      const coreId = 'lsr-core-' + Date.now();
      defs.innerHTML = `
        <filter id="${glowId}" x="-200%" y="-200%" width="500%" height="500%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b2"/>
          <feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="${coreId}" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>`;
      LTR.appendChild(defs);

      // ── build a smooth quadratic-bezier path string ───────────────────────
      function smoothPath(pts) {
        if (pts.length < 2) return '';
        let d = `M${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
          const [px, py] = pts[i - 1], [cx, cy] = pts[i];
          d += ` Q${px} ${py} ${(px + cx) / 2} ${(py + cy) / 2}`;
        }
        const last = pts[pts.length - 1];
        d += ` L${last[0]} ${last[1]}`;
        return d;
      }

      // ── draw N tapered segments, each slightly brighter toward the tip ────
      // Use up to 60 history points for a long comet tail
      const TRAIL = Math.min(n, 60);
      const pts = laserPts.slice(-TRAIL);
      const seg_n = pts.length;

      // Outer wide halo — drawn segment-by-segment so opacity+width taper naturally
      for (let i = 1; i < seg_n; i++) {
        const t = i / (seg_n - 1);              // 0 = tail end, 1 = tip
        const alpha = Math.pow(t, 2.2) * 0.7;  // aggressive fade at tail
        const w = 1.5 + t * 10;                // 1.5px tail → 11.5px at tip
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const seg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        seg.setAttribute('d', `M${ax} ${ay} L${bx} ${by}`);
        seg.setAttribute('stroke', `rgba(255,18,18,${alpha})`);
        seg.setAttribute('stroke-width', String(w));
        seg.setAttribute('fill', 'none');
        seg.setAttribute('stroke-linecap', 'round');
        seg.setAttribute('filter', `url(#${glowId})`);
        LTR.appendChild(seg);
      }

      // Mid bright layer — narrower, only the last 30% of the trail
      const midPts = pts.slice(Math.floor(seg_n * 0.7));
      if (midPts.length >= 2) {
        const mid_n = midPts.length;
        for (let i = 1; i < mid_n; i++) {
          const t = i / (mid_n - 1);
          const alpha = 0.4 + t * 0.5;
          const w = 0.8 + t * 4;
          const [ax, ay] = midPts[i - 1], [bx, by] = midPts[i];
          const seg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          seg.setAttribute('d', `M${ax} ${ay} L${bx} ${by}`);
          seg.setAttribute('stroke', `rgba(255,120,120,${alpha})`);
          seg.setAttribute('stroke-width', String(w));
          seg.setAttribute('fill', 'none');
          seg.setAttribute('stroke-linecap', 'round');
          LTR.appendChild(seg);
        }
      }

      // White-hot core — only the last 8 points, hair-thin, pure white
      const corePts = laserPts.slice(-8);
      if (corePts.length >= 2) {
        const core = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        core.setAttribute('d', smoothPath(corePts));
        core.setAttribute('stroke', 'rgba(255,255,255,0.96)');
        core.setAttribute('stroke-width', '1');
        core.setAttribute('fill', 'none');
        core.setAttribute('stroke-linecap', 'round');
        core.setAttribute('stroke-linejoin', 'round');
        core.setAttribute('filter', `url(#${coreId})`);
        LTR.appendChild(core);
      }

      // ── speckle ring around the live tip (static per-frame) ──────────────
      // Simulates the diffraction scatter of a real laser dot
      for (let k = 0; k < 6; k++) {
        const angle = (k / 6) * Math.PI * 2 + performance.now() * 0.003;
        const r = 3 + Math.random() * 4;
        const spk = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        spk.setAttribute('cx', String(tip[0] + Math.cos(angle) * r));
        spk.setAttribute('cy', String(tip[1] + Math.sin(angle) * r));
        spk.setAttribute('r', String(0.5 + Math.random() * 1));
        spk.setAttribute('fill', `rgba(255,${160 + Math.floor(Math.random()*95)},${Math.floor(Math.random()*60)},${0.5 + Math.random()*0.5})`);
        LTR.appendChild(spk);
      }

      // ── auto-fade: trail dissolves 380ms after pointer stops ─────────────
      laserFadeTimer = setTimeout(() => {
        LTR.style.transition = 'opacity 0.35s ease-out';
        LTR.style.opacity = '0';
        setTimeout(() => { LTR.innerHTML = ''; LTR.style.transition = ''; LTR.style.opacity = '1'; }, 380);
      }, 380);
    }

    // ── wheel zoom / pan ──────────────────────────────────────────────────────
    let _wheelRaf = null;
    CC.addEventListener('wheel', e => {
      e.preventDefault(); e.stopPropagation();
      if(e.ctrlKey||e.metaKey){
        const f=e.deltaY<0?1.08:.92;
        const r=CC.getBoundingClientRect();
        const mx=e.clientX-r.left,my=e.clientY-r.top;
        const wx=(mx-panX)/zoom,wy=(my-panY)/zoom;
        zoom=clamp(zoom*f,.05,8); panX=mx-wx*zoom; panY=my-wy*zoom;
      } else { panX-=e.deltaX; panY-=e.deltaY; }
      // Coalesce multiple wheel ticks per display frame into one DOM write.
      if(!_wheelRaf) _wheelRaf=requestAnimationFrame(()=>{ _wheelRaf=null; applyXform(); });
    },{passive:false});

    // middle mouse pan
    CC.addEventListener('mousedown',e=>{
      if(e.button===1){e.preventDefault();panning=true;panStart={x:e.clientX,y:e.clientY};panOrig={x:panX,y:panY};CC.style.cursor='grabbing';}
    });

    // ── context menu ──────────────────────────────────────────────────────────
    // Use capture phase (true) on document so preventDefault() fires BEFORE the
    // browser decides to show its native menu — regardless of which child element
    // was right-clicked. Bubble-phase listeners on CC arrive too late.
    document.addEventListener('contextmenu', e => {
      // only intercept when the board is open and the click is inside the overlay
      if(!overlay.classList.contains('wb-open')) return;
      if(!overlay.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();

      // ── right-click on a saved custom color swatch → show color mini-menu ──
      const savedSwatch = e.target.closest && e.target.closest('[data-saved]');
      if(savedSwatch) {
        const type = savedSwatch.dataset.saved; // 'stroke' | 'fill' | 'bg'
        const hex  = savedSwatch.dataset.c || savedSwatch.dataset.fc || savedSwatch.dataset.hex;
        showColorCtx(e.clientX, e.clientY, type, hex);
        return;
      }

      // ── auto-select the right-clicked element ──────────────────────────────
      // div-based shapes (.wb-shape)
      const shapeEl = e.target.closest && e.target.closest('.wb-shape');
      if(shapeEl){
        const id = shapeEl.id.replace('ws-','');
        if(!selectedIds.has(id)) selOnly(id);
      } else {
        // arrows / lines / connectors and freehand strokes (live in SVGs with
        // pointer-events:none, so we hit-test manually using canvas coordinates).
        // Same topmost-first, zoom-adjusted logic as the left-click select handler.
        const p = s2c(e.clientX, e.clientY);
        const rTol = 14/zoom;
        let hitArr=null;
        for(let i=shapes.length-1;i>=0;i--){
          const s=shapes[i];
          if(s.type!=='arrow'&&s.type!=='line'&&s.type!=='connector') continue;
          if(ptSegDist(p.x,p.y,s.x,s.y,s.x+s.w,s.y+s.h)<rTol){ hitArr=s; break; }
        }
        if(hitArr){ if(!selectedIds.has(hitArr.id)) selOnly(hitArr.id); }
        else {
          let hitStroke=null;
          for(let i=shapes.length-1;i>=0;i--){
            const s=shapes[i];
            if(s.type!=='draw'&&s.type!=='highlighter') continue;
            if(!s.points||s.points.length<2) continue;
            let near=false;
            for(let j=1;j<s.points.length&&!near;j++){
              const [ax,ay]=s.points[j-1],[bx,by]=s.points[j];
              if(ptSegDist(p.x,p.y,ax,ay,bx,by)<rTol) near=true;
            }
            if(!near && s.type==='draw' && s.style.fillStyle!=='none'){
              const d=DSV.querySelector('#wd-'+s.id)?.getAttribute('d');
              if(d){ try{ near=hitCtx.isPointInPath(new Path2D(d),p.x,p.y); }catch(err){} }
            }
            if(near){ hitStroke=s; break; }
          }
          if(hitStroke && !selectedIds.has(hitStroke.id)) selOnly(hitStroke.id);
          // If the hit stroke is grouped, expand selection to whole group
          if(hitStroke && hitStroke.groupId){
            shapes.forEach(sh=>{ if(sh.groupId===hitStroke.groupId) selectedIds.add(sh.id); });
            updSel();
          }
        }
      }

      showCtx(e.clientX, e.clientY);
    }, true /* capture phase — runs before browser default */);

    function showCtx(x,y){
      const singleSel = selectedIds.size===1 && shapes.find(s=>selectedIds.has(s.id));
      const singleImg = singleSel && singleSel.type==='image';
      const singleArr = singleSel && (singleSel.type==='arrow'||singleSel.type==='line'||singleSel.type==='connector');
      const hasGroup  = [...selectedIds].some(id=>{ const s=shapes.find(sh=>sh.id===id); return s&&s.groupId; });
      // Count selected draw/highlighter strokes — 2+ means "Group" is meaningful
      const strokeSelCount = [...selectedIds].reduce((n,id)=>{ const s=shapes.find(sh=>sh.id===id); return n+(s&&(s.type==='draw'||s.type==='highlighter')?1:0); },0);
      CTX.classList.toggle('img-sel',   !!singleImg);
      CTX.classList.toggle('arr-sel',   !!singleArr);
      CTX.classList.toggle('grp-sel',   hasGroup);
      CTX.classList.toggle('can-group', strokeSelCount >= 2);
      CTX.classList.toggle('any-sel',   selectedIds.size > 0);
      CTX.style.display='block'; CTX.style.left=x+'px'; CTX.style.top=y+'px';
      const r=CTX.getBoundingClientRect();
      if(r.right>window.innerWidth) CTX.style.left=(x-r.width)+'px';
      if(r.bottom>window.innerHeight) CTX.style.top=(y-r.height)+'px';
    }
    function hideCtx(){CTX.style.display='none';}
    document.addEventListener('click',hideCtx);

    // ── color swatch mini context menu ────────────────────────────────────────
    const CCTX = $('wb-color-ctx');
    let colorCtxTarget = null; // { type: 'stroke'|'fill'|'bg', hex: string }

    function showColorCtx(x, y, type, hex) {
      colorCtxTarget = { type, hex };
      CCTX.style.display = 'block';
      CCTX.style.left = x + 'px';
      CCTX.style.top  = y + 'px';
      const r = CCTX.getBoundingClientRect();
      if(r.right  > window.innerWidth)  CCTX.style.left = (x - r.width)  + 'px';
      if(r.bottom > window.innerHeight) CCTX.style.top  = (y - r.height) + 'px';
    }
    function hideColorCtx() { CCTX.style.display = 'none'; colorCtxTarget = null; }
    document.addEventListener('click', hideColorCtx);

    $('wbcc-del').onclick = e => {
      e.stopPropagation();
      if(!colorCtxTarget) return;
      const { type, hex } = colorCtxTarget;
      if(type === 'stroke') deleteCustomColor(hex);
      else if(type === 'fill') deleteFillColor(hex);
      else if(type === 'bg') deleteBgCustomColor(hex);
      hideColorCtx();
    };

    $('wbc-del').onclick=()=>{
      if(selectedIds.size){
        snap(); [...selectedIds].forEach(id=>deleteShape(id)); selectedIds.clear(); hideCtx(); save();
      } else if(pages.length > 1){
        hideCtx(); deletePage(pageIdx);
      } else {
        hideCtx();
      }
    };
    $('wbc-dup').onclick=()=>{dupSel();hideCtx();};
    $('wbc-copy').onclick=()=>{clipboard=shapes.filter(s=>selectedIds.has(s.id)).map(s=>clone(s));hideCtx();};
    $('wbc-paste').onclick=async ()=>{
      hideCtx();
      const pastedImage = await tryPasteImageFromSystemClipboard();
      if(!pastedImage) pasteCB();
    };
    $('wbc-front').onclick=()=>{[...selectedIds].forEach(id=>{const i=shapes.findIndex(s=>s.id===id);if(i>-1){const s=shapes.splice(i,1)[0];shapes.push(s);}});renderAll();hideCtx();save();};
    $('wbc-back').onclick=()=>{[...selectedIds].forEach(id=>{const i=shapes.findIndex(s=>s.id===id);if(i>-1){const s=shapes.splice(i,1)[0];shapes.unshift(s);}});renderAll();hideCtx();save();};
    $('wbc-lock').onclick=()=>{snap();shapes.forEach(s=>{if(selectedIds.has(s.id))s.locked=!s.locked;});renderAll();hideCtx();save();};
    $('wbc-group').onclick=()=>{
      snap();
      // Assign a fresh groupId to every selected draw/highlighter stroke,
      // replacing any existing groupId so mixed selections merge cleanly.
      const newGid=uid();
      shapes.forEach(s=>{
        if(selectedIds.has(s.id)&&(s.type==='draw'||s.type==='highlighter'))
          s.groupId=newGid;
      });
      hideCtx(); save();
    };

    $('wbc-ungroup').onclick=()=>{
      snap();
      // Collect all groupIds touched by the current selection
      const gids=new Set();
      shapes.forEach(s=>{ if(selectedIds.has(s.id)&&s.groupId) gids.add(s.groupId); });
      // Remove groupId from every shape in those groups
      shapes.forEach(s=>{ if(s.groupId&&gids.has(s.groupId)) delete s.groupId; });
      hideCtx(); save();
    };

    // ── image filter CSS string builder ──────────────────────────────────────
    // live-apply filter to the rendered <img> element without re-rendering
    function applyImgFilter(s){
      const imgEl = R.querySelector(`#ws-${s.id} img`);
      if(imgEl) imgEl.style.filter = buildImgFilter(s.imageFilters);
    }

    // ── universal rotate & flip context menu ─────────────────────────────────
    // Works for: arrows/lines/connectors (geometric), draw/highlighter strokes
    // (point-array transform), images (rotation prop + flipH/V on img child),
    // and all other div-based shapes (rotation prop, flipH/V on container).

    function rotateSelShapes(dir) { // dir: 1 = CW, -1 = CCW
      if(!selectedIds.size) return;
      snap();
      // Compute the combined bounding box centre so that multi-select rotates
      // as a group rather than each shape spinning around its own centre.
      const b = selBounds(selectedIds);
      const gcx = (b.x1 + b.x2) / 2;
      const gcy = (b.y1 + b.y2) / 2;
      const rad = dir * Math.PI / 2;
      const cos = Math.cos(rad), sin = Math.sin(rad);

      shapes.forEach(s => {
        if(!selectedIds.has(s.id)) return;
        if(s.type==='arrow'||s.type==='line'||s.type==='connector') {
          // Rotate the start-point (x,y) and endpoint (x+w, y+h) around gcx/gcy,
          // then recompute the (x,y,w,h) representation.
          const ax=s.x-gcx, ay=s.y-gcy;
          const bx=(s.x+s.w)-gcx, by=(s.y+s.h)-gcy;
          const nx1=gcx+ax*cos-ay*sin, ny1=gcy+ax*sin+ay*cos;
          const nx2=gcx+bx*cos-by*sin, ny2=gcy+bx*sin+by*cos;
          s.x=nx1; s.y=ny1; s.w=nx2-nx1; s.h=ny2-ny1;
          renderArrow(s);
        } else if(s.type==='draw'||s.type==='highlighter') {
          if(!s.points||!s.points.length) return;
          s.points=s.points.map(p=>{
            const dx=p[0]-gcx, dy=p[1]-gcy;
            return [gcx+dx*cos-dy*sin, gcy+dx*sin+dy*cos, ...p.slice(2)];
          });
          renderStroke(s);
        } else {
          // div-based shape: rotate its centre around the group centre, then
          // adjust x/y; also increment the shape's own rotation property.
          const scx=s.x+s.w/2, scy=s.y+s.h/2;
          const dx=scx-gcx, dy=scy-gcy;
          const newCx=gcx+dx*cos-dy*sin, newCy=gcy+dx*sin+dy*cos;
          // For a 90° step, also swap w/h when the shape has been rotated to a
          // non-cardinal angle (visual width/height exchange).
          s.rotation=(((s.rotation||0)+dir*90)+360)%360;
          s.x=newCx-s.w/2; s.y=newCy-s.h/2;
          const el=R.querySelector('#ws-'+s.id);
          if(el){
            el.style.left=s.x+'px'; el.style.top=s.y+'px';
            el.style.transform=s.type==='image'
              ? `rotate(${s.rotation}deg)`
              : buildShapeTransform(s);
          }
        }
      });
      updSel(); save();
    }

    function flipSelShapes(axis) { // axis: 'h' | 'v'
      if(!selectedIds.size) return;
      snap();
      // Mirror around the combined bounding-box centre so multi-select flips as a group.
      const b = selBounds(selectedIds);
      const gcx = (b.x1 + b.x2) / 2;
      const gcy = (b.y1 + b.y2) / 2;

      shapes.forEach(s => {
        if(!selectedIds.has(s.id)) return;
        if(s.type==='arrow'||s.type==='line'||s.type==='connector') {
          // A proper horizontal flip must:
          //   1. Reflect the start-point around the group centre, AND
          //   2. Negate the x-component of the direction vector (swap head/tail).
          // The previous code reflected BOTH endpoints and kept the same direction,
          // which for a single arrow (gcx = its own midpoint) produced s.x=s.x,
          // s.w=s.w — visually nothing changed.
          if(axis==='h'){
            s.x = 2*gcx - s.x;
            s.w = -s.w;
          } else {
            s.y = 2*gcy - s.y;
            s.h = -s.h;
          }
          renderArrow(s);
        } else if(s.type==='draw'||s.type==='highlighter') {
          if(!s.points||!s.points.length) return;
          s.points=s.points.map(p=>axis==='h'
            ?[2*gcx-p[0], p[1], ...p.slice(2)]
            :[p[0], 2*gcy-p[1], ...p.slice(2)]);
          renderStroke(s);
        } else if(s.type==='image') {
          // Update the shape's position around the group centre and toggle the
          // flip flag on the shape data FIRST, then remove the old DOM element
          // and re-render via renderShape().  This is the same code path used
          // after resize and guarantees that what save() writes is exactly what
          // renderShape() (called on every load/renderAll) will display — there
          // is no separate "live DOM patch" that could get out of sync.
          if(axis==='h'){
            s.x = 2*gcx - s.x - s.w;
            s.flipH = !s.flipH;
          } else {
            s.y = 2*gcy - s.y - s.h;
            s.flipV = !s.flipV;
          }
          R.querySelector('#ws-'+s.id)?.remove();
          renderShape(s);
        } else {
          // generic div-based shape
          if(axis==='h'){
            s.x = 2*gcx - s.x - s.w;
            s.flipH=!s.flipH;
          } else {
            s.y = 2*gcy - s.y - s.h;
            s.flipV=!s.flipV;
          }
          const el=R.querySelector('#ws-'+s.id);
          if(el){ el.style.left=s.x+'px'; el.style.top=s.y+'px'; el.style.transform=buildShapeTransform(s); }
        }
      });
      updSel(); save();
    }

    // Builds the CSS transform string for a div-based shape (rotation + flip)
    function buildShapeTransform(s) {
      let t=`rotate(${s.rotation||0}deg)`;
      if(s.flipH) t+=' scaleX(-1)';
      if(s.flipV) t+=' scaleY(-1)';
      return t;
    }

    function getSelImg(){return shapes.find(s=>selectedIds.has(s.id)&&s.type==='image');}

    $('wbc-rot90cw').onclick=()=>{rotateSelShapes(1);hideCtx();};
    $('wbc-rot90ccw').onclick=()=>{rotateSelShapes(-1);hideCtx();};
    $('wbc-fliph').onclick=()=>{flipSelShapes('h');hideCtx();};
    $('wbc-flipv').onclick=()=>{flipSelShapes('v');hideCtx();};

    // ── replace image ────────────────────────────────────────────────────────
    $('wbc-img-replace').onclick=()=>{ hideCtx(); $('wb-img-replace-input').click(); };
    $('wb-img-replace-input').onchange=function(){
      const s=getSelImg(); if(!s||!this.files[0]) return;
      const reader=new FileReader();
      reader.onload=ev=>{
        const img=new Image();
        img.onload=()=>{
          snap(); s.src=ev.target.result; s.flipH=false; s.flipV=false;
          renderAll(); save();
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(this.files[0]); this.value='';
    };

    // ════════════════════════════════════════════════════════════════════════
    // ── CROP MODAL ──────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    const cropModal   = $('wb-crop-modal');
    const cropCanvas  = $('wb-crop-canvas');
    const cropCtx     = cropCanvas.getContext('2d');
    let cropShapeId=null, cropImg=null, cropScale=1;
    let cropRect={x:0,y:0,w:0,h:0}, cropOrigAspect=1;
    let cropDrag=null; // {type, ox, oy, origRect}

    $('wbc-crop').onclick=()=>{ const s=getSelImg(); if(s){openCropModal(s);hideCtx();} };

    function openCropModal(s){
      cropShapeId=s.id;
      const img=new Image();
      img.onload=()=>{
        cropImg=img;
        const maxW=Math.min(window.innerWidth*.78,860);
        const maxH=Math.min(window.innerHeight*.6,620);
        cropScale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight,1);
        cropCanvas.width =Math.round(img.naturalWidth *cropScale);
        cropCanvas.height=Math.round(img.naturalHeight*cropScale);
        cropOrigAspect=img.naturalWidth/img.naturalHeight;
        const pad=Math.min(cropCanvas.width,cropCanvas.height)*.1;
        cropRect={x:pad,y:pad,w:cropCanvas.width-pad*2,h:cropCanvas.height-pad*2};
        drawCrop();
      };
      img.src=s.src;
      cropModal.classList.add('open');
    }

    function drawCrop(){
      const cw=cropCanvas.width,ch=cropCanvas.height;
      cropCtx.clearRect(0,0,cw,ch);
      // base image
      cropCtx.drawImage(cropImg,0,0,cw,ch);
      // dim outside crop
      cropCtx.save();
      cropCtx.fillStyle='rgba(0,0,0,.58)';
      cropCtx.beginPath();
      cropCtx.rect(0,0,cw,ch);
      cropCtx.rect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);
      cropCtx.fill('evenodd');
      cropCtx.restore();
      // redraw sharp crop area
      cropCtx.drawImage(cropImg,
        cropRect.x/cropScale,cropRect.y/cropScale,
        cropRect.w/cropScale,cropRect.h/cropScale,
        cropRect.x,cropRect.y,cropRect.w,cropRect.h);
      // border
      cropCtx.strokeStyle='rgba(255,255,255,.9)';
      cropCtx.lineWidth=1.5;
      cropCtx.strokeRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);
      // rule-of-thirds grid
      cropCtx.strokeStyle='rgba(255,255,255,.25)';
      cropCtx.lineWidth=.6;
      for(let i=1;i<=2;i++){
        cropCtx.beginPath();
        cropCtx.moveTo(cropRect.x+cropRect.w*i/3,cropRect.y);
        cropCtx.lineTo(cropRect.x+cropRect.w*i/3,cropRect.y+cropRect.h);
        cropCtx.stroke();
        cropCtx.beginPath();
        cropCtx.moveTo(cropRect.x,cropRect.y+cropRect.h*i/3);
        cropCtx.lineTo(cropRect.x+cropRect.w,cropRect.y+cropRect.h*i/3);
        cropCtx.stroke();
      }
      // handles
      cropHandles().forEach(h=>{
        cropCtx.fillStyle='#fff';
        cropCtx.shadowColor='rgba(0,0,0,.5)'; cropCtx.shadowBlur=3;
        cropCtx.fillRect(h.x-5,h.y-5,10,10);
        cropCtx.shadowBlur=0;
      });
    }

    function cropHandles(){
      const {x,y,w,h}=cropRect;
      return [{id:'tl',x,y},{id:'tm',x:x+w/2,y},{id:'tr',x:x+w,y},
              {id:'ml',x,y:y+h/2},{id:'mr',x:x+w,y:y+h/2},
              {id:'bl',x,y:y+h},{id:'bm',x:x+w/2,y:y+h},{id:'br',x:x+w,y:y+h}];
    }

    cropCanvas.addEventListener('mousedown',e=>{
      const r=cropCanvas.getBoundingClientRect();
      const mx=e.clientX-r.left,my=e.clientY-r.top;
      const hit=cropHandles().find(h=>Math.abs(mx-h.x)<10&&Math.abs(my-h.y)<10);
      if(hit){cropDrag={type:hit.id,ox:mx,oy:my,origRect:{...cropRect}};return;}
      if(mx>=cropRect.x&&mx<=cropRect.x+cropRect.w&&my>=cropRect.y&&my<=cropRect.y+cropRect.h)
        cropDrag={type:'move',ox:mx,oy:my,origRect:{...cropRect}};
    });
    cropCanvas.addEventListener('mousemove',e=>{
      if(!cropDrag) return;
      const r=cropCanvas.getBoundingClientRect();
      const mx=e.clientX-r.left,my=e.clientY-r.top;
      const dx=mx-cropDrag.ox,dy=my-cropDrag.oy;
      let {x,y,w,h}=cropDrag.origRect;
      const cw=cropCanvas.width,ch=cropCanvas.height;
      const constrain=e.shiftKey;
      switch(cropDrag.type){
        case'move':x=Math.max(0,Math.min(cw-w,x+dx));y=Math.max(0,Math.min(ch-h,y+dy));break;
        case'tl':x=Math.min(x+w-20,x+dx);y=Math.min(y+h-20,y+dy);w=Math.max(20,w-dx);h=Math.max(20,h-dy);break;
        case'tr':y=Math.min(y+h-20,y+dy);w=Math.max(20,w+dx);h=Math.max(20,h-dy);break;
        case'bl':x=Math.min(x+w-20,x+dx);w=Math.max(20,w-dx);h=Math.max(20,h+dy);break;
        case'br':w=Math.max(20,w+dx);h=Math.max(20,h+dy);break;
        case'tm':y=Math.min(y+h-20,y+dy);h=Math.max(20,h-dy);break;
        case'bm':h=Math.max(20,h+dy);break;
        case'ml':x=Math.min(x+w-20,x+dx);w=Math.max(20,w-dx);break;
        case'mr':w=Math.max(20,w+dx);break;
      }
      if(constrain&&cropDrag.type!=='move'){w=Math.max(w,h*cropOrigAspect);h=w/cropOrigAspect;}
      x=Math.max(0,x);y=Math.max(0,y);
      w=Math.min(w,cw-x);h=Math.min(h,ch-y);
      cropRect={x,y,w,h};
      drawCrop();
    });
    cropCanvas.addEventListener('mouseup',()=>{cropDrag=null;});
    cropCanvas.addEventListener('mouseleave',()=>{cropDrag=null;});

    $('wb-crop-reset').onclick=()=>{
      const pad=Math.min(cropCanvas.width,cropCanvas.height)*.05;
      cropRect={x:pad,y:pad,w:cropCanvas.width-pad*2,h:cropCanvas.height-pad*2};
      drawCrop();
    };
    $('wb-crop-cancel').onclick=()=>cropModal.classList.remove('open');
    $('wb-crop-confirm').onclick=()=>{
      const s=shapes.find(sh=>sh.id===cropShapeId); if(!s){cropModal.classList.remove('open');return;}
      const sx=cropRect.x/cropScale,sy=cropRect.y/cropScale;
      const sw=cropRect.w/cropScale,sh2=cropRect.h/cropScale;
      const off=document.createElement('canvas');
      off.width=Math.round(sw); off.height=Math.round(sh2);
      off.getContext('2d').drawImage(cropImg,sx,sy,sw,sh2,0,0,sw,sh2);
      snap();
      s.src=off.toDataURL('image/png');
      // update shape dimensions to match new crop aspect
      const newAspect=sw/sh2;
      s.h=s.w/newAspect;
      s.flipH=false; s.flipV=false; // reset flips after crop
      renderAll(); save();
      cropModal.classList.remove('open');
    };

    // ════════════════════════════════════════════════════════════════════════
    // ── EFFECTS MODAL ────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    const fxModal=$('wb-fx-modal');
    let fxShapeId=null, fxOrigFilters=null;

    const FX_PRESETS={
      'Normal':  {brightness:100,contrast:100,saturate:100,grayscale:0,sepia:0,invert:0,blur:0,hueRotate:0,opacity:100},
      'Vivid':   {brightness:108,contrast:118,saturate:155,grayscale:0,sepia:0,invert:0,blur:0,hueRotate:0,opacity:100},
      'Warm':    {brightness:106,contrast:100,saturate:112,grayscale:0,sepia:22,invert:0,blur:0,hueRotate:-18,opacity:100},
      'Cool':    {brightness:104,contrast:102,saturate:88,grayscale:0,sepia:0,invert:0,blur:0,hueRotate:18,opacity:100},
      'B&W':     {brightness:100,contrast:112,saturate:0,grayscale:100,sepia:0,invert:0,blur:0,hueRotate:0,opacity:100},
      'Sepia':   {brightness:100,contrast:100,saturate:78,grayscale:0,sepia:82,invert:0,blur:0,hueRotate:0,opacity:100},
      'Dramatic':{brightness:88,contrast:145,saturate:75,grayscale:20,sepia:0,invert:0,blur:0,hueRotate:0,opacity:100},
      'Fade':    {brightness:116,contrast:78,saturate:72,grayscale:0,sepia:12,invert:0,blur:0,hueRotate:0,opacity:100},
      'Invert':  {brightness:100,contrast:100,saturate:100,grayscale:0,sepia:0,invert:100,blur:0,hueRotate:0,opacity:100},
      'Matte':   {brightness:108,contrast:88,saturate:85,grayscale:0,sepia:8,invert:0,blur:0,hueRotate:0,opacity:100},
    };
    const FX_KEYS=['brightness','contrast','saturate','grayscale','sepia','invert','blur','hueRotate','opacity'];

    function fxVal(k,v){ return k==='blur'?v+'px':k==='hueRotate'?v+'°':v+'%'; }

    function openFxModal(s){
      fxShapeId=s.id;
      fxOrigFilters=s.imageFilters?{...s.imageFilters}:null;
      const f={...IMG_FILTER_DEFAULTS,...(s.imageFilters||{})};
      FX_KEYS.forEach(k=>{
        const sl=document.getElementById('wb-fx-'+k);
        const vl=document.getElementById('wb-fxv-'+k);
        if(sl){sl.value=f[k]??IMG_FILTER_DEFAULTS[k];}
        if(vl){vl.textContent=fxVal(k,f[k]??IMG_FILTER_DEFAULTS[k]);}
      });
      $$('.wb-fx-preset').forEach(b=>b.classList.remove('active'));
      fxModal.classList.add('open');
    }

    $('wbc-effects').onclick=()=>{ const s=getSelImg(); if(s){openFxModal(s);hideCtx();} };

    // live slider preview
    FX_KEYS.forEach(k=>{
      const sl=document.getElementById('wb-fx-'+k); if(!sl) return;
      sl.oninput=()=>{
        const s=shapes.find(sh=>sh.id===fxShapeId); if(!s) return;
        if(!s.imageFilters) s.imageFilters={...IMG_FILTER_DEFAULTS};
        s.imageFilters[k]=parseFloat(sl.value);
        document.getElementById('wb-fxv-'+k).textContent=fxVal(k,sl.value);
        applyImgFilter(s);
        $$('.wb-fx-preset').forEach(b=>b.classList.remove('active'));
      };
    });

    // preset buttons
    $$('.wb-fx-preset').forEach(btn=>{
      btn.onclick=()=>{
        const s=shapes.find(sh=>sh.id===fxShapeId); if(!s) return;
        const preset=FX_PRESETS[btn.dataset.preset]; if(!preset) return;
        s.imageFilters={...preset};
        openFxModal(s);
        applyImgFilter(s);
        btn.classList.add('active');
      };
    });

    $('wb-fx-confirm').onclick=()=>{
      const s=shapes.find(sh=>sh.id===fxShapeId);
      if(s){
        // Only push an undo snapshot when something actually changed
        const changed = JSON.stringify(s.imageFilters) !== JSON.stringify(fxOrigFilters);
        if(changed) snap();
        save();
      }
      fxModal.classList.remove('open');
    };
    $('wb-fx-reset').onclick=()=>{ const s=shapes.find(sh=>sh.id===fxShapeId);if(!s)return;s.imageFilters=null;openFxModal(s);applyImgFilter(s); };
    $('wb-fx-discard').onclick=()=>{
      const s=shapes.find(sh=>sh.id===fxShapeId);
      if(s){s.imageFilters=fxOrigFilters;applyImgFilter(s);}
      fxModal.classList.remove('open');
    };
    $('wb-fx-cancel').onclick=()=>{
      const s=shapes.find(sh=>sh.id===fxShapeId);
      if(s){s.imageFilters=fxOrigFilters;applyImgFilter(s);}
      fxModal.classList.remove('open');
    };

    function deleteShape(id,silent=false){
      const i=shapes.findIndex(s=>s.id===id);
      if(i>-1)shapes.splice(i,1);
      R.querySelector('#ws-'+id)?.remove();
      DSV.querySelector('#wd-'+id)?.remove();
      removeStrokeGradDef(id);
      ASV.querySelector('#wa-'+id)?.remove();
      ASV.querySelector('#wah-'+id)?.remove();
      selectedIds.delete(id);
      if(!silent)updSel();
    }

    // Compute tight bounding box across a mixed selection of shapes+strokes
    function selBounds(ids) {
      let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
      shapes.forEach(s => {
        if(!ids.has(s.id)) return;
        if((s.type==='draw'||s.type==='highlighter')&&s.points&&s.points.length){
          s.points.forEach(([px,py])=>{x1=Math.min(x1,px);y1=Math.min(y1,py);x2=Math.max(x2,px);y2=Math.max(y2,py);});
        } else if(s.x!=null){
          x1=Math.min(x1,s.x);y1=Math.min(y1,s.y);x2=Math.max(x2,s.x+(s.w||0));y2=Math.max(y2,s.y+(s.h||0));
        }
      });
      return {x1,y1,x2,y2,w:x2-x1,h:y2-y1};
    }

    function shiftClone(c, dx, dy) {
      if ((c.type === 'draw' || c.type === 'highlighter') && c.points) {
        c.points = c.points.map(([px, py]) => [px + dx, py + dy]);
      } else {
        c.x += dx; c.y += dy;
      }
      return c;
    }

    function dupSel(){
      if(!selectedIds.size) return;
      snap();
      // Offset by the full bounding-box size so the duplicate never overlaps the original
      const b = selBounds(selectedIds);
      const dx = (b.w > 0 ? b.w : 40) + 20;
      const dy = 20;
      const nids=new Set();
      const strokesToDup = shapes.filter(s=>selectedIds.has(s.id)&&(s.type==='draw'||s.type==='highlighter'));
      const dupGroupId = strokesToDup.length > 1 ? uid() : null;
      shapes.filter(s=>selectedIds.has(s.id)).forEach(s=>{
        const c=shiftClone(clone(s), dx, dy); c.id=uid();
        if(dupGroupId && (c.type==='draw'||c.type==='highlighter')) c.groupId=dupGroupId;
        shapes.push(c); nids.add(c.id); renderShape(c);
      });
      selectedIds.clear(); nids.forEach(id=>selectedIds.add(id)); updSel(); save();
    }

    function pasteCB(){
      if(!clipboard.length) return;
      snap(); selectedIds.clear();
      // Compute bounding box directly from the clipboard items (they are NOT in
      // shapes yet, so selBounds() would always return an empty/invalid box).
      let cbx1=Infinity,cby1=Infinity,cbx2=-Infinity,cby2=-Infinity;
      clipboard.forEach(s=>{
        if((s.type==='draw'||s.type==='highlighter')&&s.points&&s.points.length){
          s.points.forEach(([px,py])=>{cbx1=Math.min(cbx1,px);cby1=Math.min(cby1,py);cbx2=Math.max(cbx2,px);cby2=Math.max(cby2,py);});
        } else if(s.x!=null){
          cbx1=Math.min(cbx1,s.x);cby1=Math.min(cby1,s.y);cbx2=Math.max(cbx2,s.x+(s.w||0));cby2=Math.max(cby2,s.y+(s.h||0));
        }
      });
      const cbw=cbx2-cbx1;
      const dx = (cbw > 0 ? cbw : 40) + 20;
      const dy = 20;
      const strokesToPaste = clipboard.filter(s=>s.type==='draw'||s.type==='highlighter');
      const pasteGroupId = strokesToPaste.length > 1 ? uid() : null;
      clipboard.forEach(s=>{
        const c=shiftClone(clone(s), dx, dy);c.id=uid();
        if(pasteGroupId && (c.type==='draw'||c.type==='highlighter')) c.groupId=pasteGroupId;
        shapes.push(c);renderShape(c);selectedIds.add(c.id);
      });
      updSel(); save();
    }

    // ── tool switching ────────────────────────────────────────────────────────
    // ── FILL BUCKET HELPERS ───────────────────────────────────────────────────

    // Update the fill popup swatch to reflect current style color
    function updFillPopup() {
      const swatch=$('wb-fill-preview-swatch');
      if(swatch){
        const c=getFillBucketColor();
        swatch.style.background=c;
        swatch.style.borderColor=c==='#ffffff'||c==='transparent'?'var(--wb-separator)':c;
      }
    }

    // ── Text popup helpers ────────────────────────────────────────────────────
    function updTextPopup() {
      const tp=$('wb-text-popup'); if(!tp) return;
      tp.querySelectorAll('[data-font]').forEach(b=>b.classList.toggle('active',b.dataset.font===(style.textFontFamily||'system')));
      $('wb-text-bold')?.classList.toggle('active',   !!style.textBold);
      $('wb-text-italic')?.classList.toggle('active', !!style.textItalic);
      $('wb-text-underline')?.classList.toggle('active',!!style.textUnderline);
      $('wb-text-strike')?.classList.toggle('active', !!style.textStrike);
      tp.querySelectorAll('[data-align]').forEach(b=>b.classList.toggle('active',b.dataset.align===(style.textAlign||'left')));
      tp.querySelectorAll('[data-lh]').forEach(b=>b.classList.toggle('active',parseFloat(b.dataset.lh)===(style.textLineHeight||1.5)));
    }

    function syncTextPopup() {
      const tp=$('wb-text-popup'); if(!tp) return;
      const isTextTool = activeTool==='text';
      const selText = selectedIds.size===1 && shapes.find(s=>selectedIds.has(s.id)&&s.type==='text');
      if(isTextTool||selText) {
        // Sync global style from the selected text shape so style panel reflects it
        if(selText) {
          const st=selText.style;
          style.textFontFamily  = st.textFontFamily  || 'system';
          style.textBold        = st.textBold        || false;
          style.textItalic      = st.textItalic      || false;
          style.textUnderline   = st.textUnderline   || false;
          style.textStrike      = st.textStrike      || false;
          style.textAlign       = st.textAlign       || 'left';
          style.textLineHeight  = st.textLineHeight  || 1.5;
        }
        updTextPopup();
        // Position above the text toolbar button
        const textBtn=R.querySelector('#wb-toolbar [data-tool="text"]');
        if(textBtn){
          const r=textBtn.getBoundingClientRect();
          const PW=238;
          let lx=Math.round(r.left+r.width/2-PW/2);
          lx=Math.max(8,Math.min(lx,window.innerWidth-PW-8));
          tp.style.left=lx+'px';
        }
        tp.classList.add('visible');
      } else {
        tp.classList.remove('visible');
      }
    }

    // ── Gradient panel sync ───────────────────────────────────────────────────
    function updGradientPanel() {
      const gp=$('wb-gradient-panel');     if(!gp) return;
      const isGrad = style.fillStyle==='gradient-linear'||style.fillStyle==='gradient-radial';
      gp.classList.toggle('visible', isGrad);
      if(!isGrad) return;

      // sync end-color swatches
      gp.querySelectorAll('.wb-grad-swatch').forEach(sw=>{
        sw.classList.toggle('active', sw.dataset.gc===(style.gradientEnd||'#ffffff'));
      });

      // direction grid: only show for linear
      const dw=$('wb-grad-dir-wrap');
      if(dw) dw.style.display = style.fillStyle==='gradient-linear' ? '' : 'none';

      // sync direction buttons
      gp.querySelectorAll('.wb-grad-dir').forEach(b=>{
        b.classList.toggle('active', +b.dataset.dir===(style.gradientAngle??135));
      });

      // live preview strip
      const prev=$('wb-grad-preview');
      if(prev){
        const c1=style.fillColor==='transparent'?'#94a3b8':(style.fillColor||'#3182ce');
        const c2=style.gradientEnd||'#ffffff';
        const ang=(180-(style.gradientAngle??135)+360)%360;
        prev.style.background = style.fillStyle==='gradient-radial'
          ? `radial-gradient(circle at 38% 35%,${c1},${c2})`
          : `linear-gradient(${ang}deg,${c1},${c2})`;
      }
    }

    // Which color does the fill bucket actually paint with?
    function getFillBucketColor() {
      if(style.fillColor && style.fillColor!=='transparent') return style.fillColor;
      return style.color||'#000000';
    }

    // Hex color → {r,g,b}  (handles 3-digit and 6-digit, ignores alpha)
    function hexToRgb(hex) {
      if(!hex||!hex.startsWith('#')) return null;
      let h=hex.slice(1);
      if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      const n=parseInt(h,16);
      if(isNaN(n)) return null;
      return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
    }

    // Test if world-space point (x,y) lies inside a geometric shape
    function pointInShapeWC(x,y,s) {
      const t=s.type;
      if(t==='draw'||t==='highlighter'||t==='arrow'||t==='line'||t==='connector'||
         t==='text'||t==='image'||t==='filledarea') return false;
      if(x<s.x||y<s.y||x>s.x+s.w||y>s.y+s.h) return false;

      // Rotate test point into shape's local space
      const rot=(s.rotation||0)*Math.PI/180;
      const cx=s.x+s.w/2, cy=s.y+s.h/2;
      let lx=x-cx, ly=y-cy;
      if(rot!==0){
        const cos=Math.cos(-rot),sin=Math.sin(-rot);
        const rx=lx*cos-ly*sin, ry=lx*sin+ly*cos;
        lx=rx; ly=ry;
      }
      const hw=s.w/2, hh=s.h/2;

      if(t==='rect'||t==='sticky'||t==='callout'||t==='frame')
        return Math.abs(lx)<=hw && Math.abs(ly)<=hh;
      if(t==='ellipse')
        return (lx/hw)*(lx/hw)+(ly/hh)*(ly/hh)<=1;
      if(t==='triangle'){
        // Top centre, bottom-left, bottom-right (in local coords)
        const frac=(ly+hh)/(2*hh);
        return Math.abs(lx)<=hw*frac && ly>=-hh && ly<=hh;
      }
      if(t==='diamond')
        return Math.abs(lx)/hw+Math.abs(ly)/hh<=1;
      // star / hexagon — bounding-box approximation is fine
      return Math.abs(lx)<=hw && Math.abs(ly)<=hh;
    }

    // Apply fill directly to a geometric shape
    function applyFillToShape(s, wx, wy) {
      // Clicking an existing flood-fill layer: remove it, then re-flood at same spot
      if(s.type==='filledarea'){
        snap();
        deleteShape(s.id, true); // silent — don't updSel yet
        renderAll();
        floodFillStrokes(wx, wy);
        return true;
      }
      const geo=['rect','ellipse','triangle','diamond','star','hexagon','callout','frame','sticky'];
      if(geo.includes(s.type)){
        snap();
        s.style.fillColor=getFillBucketColor();
        s.style.fillStyle='solid';
        R.querySelector('#ws-'+s.id)?.remove();
        DSV.querySelector('#wd-'+s.id)?.remove();
        renderShape(s); updSel(); save();
        return true;
      }
      // Pencil / highlighter stroke — flood-fill the enclosed region
      if(s.type==='draw'||s.type==='highlighter'){
        floodFillStrokes(wx, wy);
        return true;
      }
      return false;
    }

    // Render all strokes + shape outlines to a Canvas2D context (world-space coords)
    function renderStrokesToCtx(ctx) {
      shapes.forEach(s=>{
        const sw=Math.max(2, STROKE_W[(s.style.size||1)-1]);

        if(s.type==='draw'||s.type==='highlighter'){
          if(!s.points||s.points.length<2) return;
          const lw=sw*(s.type==='highlighter'?4:1);
          ctx.lineWidth=Math.max(2,lw);
          ctx.lineCap='round'; ctx.lineJoin='round';
          ctx.beginPath();
          ctx.moveTo(s.points[0][0],s.points[0][1]);
          for(let j=1;j<s.points.length;j++) ctx.lineTo(s.points[j][0],s.points[j][1]);
          ctx.stroke();
          return;
        }

        // Geometric shapes — draw only the outline
        ctx.save();
        if(s.rotation){
          const cx=s.x+s.w/2, cy=s.y+s.h/2;
          ctx.translate(cx,cy); ctx.rotate(s.rotation*Math.PI/180); ctx.translate(-cx,-cy);
        }
        ctx.lineWidth=sw;

        if(s.type==='rect'||s.type==='sticky'||s.type==='frame'||s.type==='callout'){
          ctx.strokeRect(s.x+sw/2,s.y+sw/2,s.w-sw,s.h-sw);
        } else if(s.type==='ellipse'){
          ctx.beginPath();
          ctx.ellipse(s.x+s.w/2,s.y+s.h/2,Math.max(1,(s.w-sw)/2),Math.max(1,(s.h-sw)/2),0,0,Math.PI*2);
          ctx.stroke();
        } else if(s.type==='triangle'){
          ctx.beginPath();
          ctx.moveTo(s.x+s.w/2,s.y+sw/2);
          ctx.lineTo(s.x+sw/2,s.y+s.h-sw/2);
          ctx.lineTo(s.x+s.w-sw/2,s.y+s.h-sw/2);
          ctx.closePath(); ctx.stroke();
        } else if(s.type==='diamond'){
          const cx=s.x+s.w/2,cy=s.y+s.h/2;
          ctx.beginPath();
          ctx.moveTo(cx,s.y+sw/2); ctx.lineTo(s.x+s.w-sw/2,cy);
          ctx.lineTo(cx,s.y+s.h-sw/2); ctx.lineTo(s.x+sw/2,cy);
          ctx.closePath(); ctx.stroke();
        } else if(s.type==='star'){
          const cx=s.x+s.w/2,cy=s.y+s.h/2;
          const r1=Math.min(s.w,s.h)/2-sw/2, r2=r1*0.42;
          ctx.beginPath();
          for(let i=0;i<10;i++){
            const a=(i*36-90)*Math.PI/180;
            const r=i%2===0?r1:r2;
            i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        } else if(s.type==='hexagon'){
          const cx=s.x+s.w/2,cy=s.y+s.h/2;
          const rx=s.w/2-sw/2,ry=s.h/2-sw/2;
          ctx.beginPath();
          for(let i=0;i<6;i++){
            const a=(i*60-90)*Math.PI/180;
            i===0?ctx.moveTo(cx+rx*Math.cos(a),cy+ry*Math.sin(a)):ctx.lineTo(cx+rx*Math.cos(a),cy+ry*Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
        ctx.restore();
      });
    }

    // Flood-fill an enclosed region on the whiteboard (world-space click point)
    function floodFillStrokes(wx,wy) {
      // Render to an offscreen canvas in screen-space (capped for performance)
      const MAX_DIM=2560;
      const vw=Math.min(window.innerWidth,MAX_DIM);
      const vh=Math.min(window.innerHeight,MAX_DIM);
      const scaleX=vw/window.innerWidth, scaleY=vh/window.innerHeight;

      const sx=Math.round((wx*zoom+panX)*scaleX);
      const sy=Math.round((wy*zoom+panY)*scaleY);
      if(sx<0||sy<0||sx>=vw||sy>=vh) return;

      const off=document.createElement('canvas');
      off.width=vw; off.height=vh;
      const ctx=off.getContext('2d',{willReadFrequently:true});

      // White background
      ctx.fillStyle='#ffffff';
      ctx.fillRect(0,0,vw,vh);

      // Transform world → screen
      ctx.save();
      ctx.translate(panX*scaleX, panY*scaleY);
      ctx.scale(zoom*scaleX, zoom*scaleY);
      ctx.strokeStyle='#000000';
      ctx.fillStyle='#000000';
      renderStrokesToCtx(ctx);
      ctx.restore();

      // Read pixels
      const imgData=ctx.getImageData(0,0,vw,vh);
      const data=imgData.data;

      // If clicked on a stroke (dark pixel) or truly outside bounds, abort
      const ci=(sy*vw+sx)*4;
      if(data[ci]<160) return;

      // BFS flood fill
      const THRESH=(fillTolerance||30)*2.5;
      const tr=data[ci],tg=data[ci+1],tb=data[ci+2];

      const visited=new Uint8Array(vw*vh);
      const queue=new Int32Array(Math.min(vw*vh, 4_000_000));
      let qH=0,qT=0;

      const seed=sx+sy*vw;
      queue[qT++]=seed; visited[seed]=1;

      let minX=sx,minY=sy,maxX=sx,maxY=sy;
      const filledPx=[];
      const LIMIT=3_200_000;

      while(qH<qT && filledPx.length<LIMIT){
        const pos=queue[qH++];
        const px=pos%vw, py=(pos/vw)|0;
        filledPx.push(pos);
        if(px<minX)minX=px; if(px>maxX)maxX=px;
        if(py<minY)minY=py; if(py>maxY)maxY=py;

        // 4-connected neighbours
        const ns=[pos-1,pos+1,pos-vw,pos+vw];
        for(let k=0;k<4;k++){
          const nb=ns[k];
          if(nb<0||nb>=vw*vh||visited[nb]) continue;
          const nx=nb%vw,ny=(nb/vw)|0;
          if(nx<0||nx>=vw||ny<0||ny>=vh) continue;
          if(k===0&&px===0) continue;   // left edge wrap
          if(k===1&&px===vw-1) continue; // right edge wrap
          const ni=nb*4;
          const dr=Math.abs(data[ni]-tr)+Math.abs(data[ni+1]-tg)+Math.abs(data[ni+2]-tb);
          if(dr<THRESH){ visited[nb]=1; queue[qT++]=nb; }
        }
      }

      if(filledPx.length<9) return;

      // Build output image (bounding box of filled region)
      const bw=maxX-minX+1, bh=maxY-minY+1;
      const result=document.createElement('canvas');
      result.width=bw; result.height=bh;
      const rctx=result.getContext('2d');
      const rImg=rctx.createImageData(bw,bh);
      const rd=rImg.data;

      const fCol=hexToRgb(getFillBucketColor())||{r:0,g:0,b:0};
      const fA=Math.round((style.opacity||1)*255);

      for(let i=0;i<filledPx.length;i++){
        const pos=filledPx[i];
        const px=pos%vw, py=(pos/vw)|0;
        const ri=((py-minY)*bw+(px-minX))*4;
        rd[ri]=fCol.r; rd[ri+1]=fCol.g; rd[ri+2]=fCol.b; rd[ri+3]=fA;
      }
      rctx.putImageData(rImg,0,0);

      // Convert bounding box back to world coords
      const worldX=(minX/scaleX-panX)/zoom;
      const worldY=(minY/scaleY-panY)/zoom;
      const worldW=bw/scaleX/zoom;
      const worldH=bh/scaleY/zoom;

      snap();
      const fs={
        id:uid(), type:'filledarea',
        x:worldX, y:worldY, w:worldW, h:worldH,
        rotation:0, style:clone(style),
        src:result.toDataURL('image/png')
      };
      // Insert at bottom of stack so it renders under strokes
      shapes.unshift(fs);
      renderAll();
      save();
    }

    // Central fill-bucket dispatcher (world coords)
    function applyFillBucket(wx,wy) {
      // Try geometric shapes first (top-most hit wins)
      for(let i=shapes.length-1;i>=0;i--){
        const s=shapes[i];
        if(pointInShapeWC(wx,wy,s)){
          applyFillToShape(s,wx,wy);
          return;
        }
      }
      // Fall through to flood fill on empty canvas / pencil area
      floodFillStrokes(wx,wy);
    }

    // tool switching ────────────────────────────────────────────────────────
    function setTool(t){
      activeTool=t;
      overlay.dataset.tool=t; // drives CSS cursor overrides (e.g. eraser)
      $$('.wb-tbtn').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));
      const cur={select:'default',hand:'grab',draw:'crosshair',highlighter:'crosshair',eraser:'cell',fill:'cell',arrow:'crosshair',line:'crosshair',connector:'crosshair',rect:'crosshair',ellipse:'crosshair',triangle:'crosshair',diamond:'crosshair',star:'crosshair',hexagon:'crosshair',callout:'crosshair',text:'text',sticky:'crosshair',frame:'crosshair',laser:'none',image:'crosshair'};
      CC.style.cursor=cur[t]||'default';
      // show/hide eraser-mode popup above the toolbar eraser button
      const eraserPopup=$('wb-eraser-popup');
      if(eraserPopup){
        if(t==='eraser'){
          // position horizontally centred on the eraser toolbar button
          const eraserBtn=document.querySelector('#wb-toolbar [data-tool="eraser"]');
          if(eraserBtn){
            const r=eraserBtn.getBoundingClientRect();
            eraserPopup.style.left=(r.left+r.width/2)+'px';
          }
          eraserPopup.classList.add('visible');
        } else {
          eraserPopup.classList.remove('visible');
        }
      }
      // show/hide connector options popup above the connector toolbar button
      const connPopup=$('wb-connector-popup');
      if(connPopup){
        if(t==='connector'){
          const connBtn=document.querySelector('#wb-toolbar [data-tool="connector"]');
          if(connBtn){
            const r=connBtn.getBoundingClientRect();
            connPopup.style.left=(r.left+r.width/2)+'px';
          }
          // sync popup to selected connector's current values
          const selConn=shapes.find(s=>selectedIds.has(s.id)&&s.type==='connector');
          if(selConn){
            connLineStyle=selConn.connLineStyle||'curve';
            connStartHead=selConn.connStartHead||'none';
            connEndHead=selConn.connEndHead||'arrow';
            connPopup.querySelectorAll('#wb-conn-line-row .wb-conn-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===connLineStyle));
            connPopup.querySelectorAll('#wb-conn-start-row .wb-conn-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===connStartHead));
            connPopup.querySelectorAll('#wb-conn-end-row .wb-conn-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===connEndHead));
          }
          connPopup.classList.add('visible');
        } else {
          connPopup.classList.remove('visible');
        }
      }
      // show/hide fill popup above the fill toolbar button
      const fillPopup=$('wb-fill-popup');
      if(fillPopup){
        if(t==='fill'){
          updFillPopup();
          // Position synchronously before making visible
          const fillBtn=document.querySelector('#wb-toolbar [data-tool="fill"]');
          if(fillBtn){
            const r=fillBtn.getBoundingClientRect();
            const PW=200;
            let lx=Math.round(r.left+r.width/2-PW/2);
            lx=Math.max(8, Math.min(lx, window.innerWidth-PW-8));
            fillPopup.style.left=lx+'px';
          }
          fillPopup.classList.add('visible');
        } else {
          fillPopup.classList.remove('visible');
        }
      }
      // sync text options popup
      syncTextPopup();
    }
    $$('.wb-tbtn').forEach(b=>b.onclick=(e)=>{
      e.stopPropagation();
      if(b.dataset.tool==='image'){
        // trigger file dialog directly from the real button click (browser allows this)
        $('wb-img-input').click();
        return; // don't switch active tool
      }
      setTool(b.dataset.tool);
    });

    // ── Text popup format controls ────────────────────────────────────────────
    const _textPopupEl=$('wb-text-popup');
    if(_textPopupEl){

      // Font family
      _textPopupEl.querySelectorAll('[data-font]').forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          style.textFontFamily=btn.dataset.font;
          updTextPopup(); applyToSel();
        };
      });

      // Bold / Italic / Underline / Strikethrough toggles
      $('wb-text-bold').onclick=e=>{
        e.stopPropagation(); style.textBold=!style.textBold;
        updTextPopup(); applyToSel();
      };
      $('wb-text-italic').onclick=e=>{
        e.stopPropagation(); style.textItalic=!style.textItalic;
        updTextPopup(); applyToSel();
      };
      $('wb-text-underline').onclick=e=>{
        e.stopPropagation(); style.textUnderline=!style.textUnderline;
        updTextPopup(); applyToSel();
      };
      $('wb-text-strike').onclick=e=>{
        e.stopPropagation(); style.textStrike=!style.textStrike;
        updTextPopup(); applyToSel();
      };

      // Text alignment
      _textPopupEl.querySelectorAll('[data-align]').forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          style.textAlign=btn.dataset.align;
          updTextPopup(); applyToSel();
        };
      });

      // Line height
      _textPopupEl.querySelectorAll('[data-lh]').forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          style.textLineHeight=parseFloat(btn.dataset.lh);
          updTextPopup(); applyToSel();
        };
      });
    }

    // ── Gradient panel: build end-color swatches row + wire controls ──────────
    const _gradPanel=$('wb-gradient-panel');
    if(_gradPanel){
      // Build gradient-end color swatches from COLORS + transparent
      const gradEndRow=$('wb-grad-end-row');
      if(gradEndRow){
        [...COLORS,'transparent'].forEach(c=>{
          const sw=document.createElement('div');
          sw.className='wb-grad-swatch';
          sw.dataset.gc=c;
          sw.title=c;
          if(c==='transparent'){
            sw.style.cssText='width:18px;height:18px;border-radius:50%;cursor:pointer;flex-shrink:0;border:2px solid transparent;outline:1px solid rgba(0,0,0,.08);background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0/8px 8px;';
          } else {
            sw.style.background=c;
            sw.style.borderColor=c==='#ffffff'?'rgba(0,0,0,.12)':c;
          }
          sw.onclick=()=>{ style.gradientEnd=c; updGradientPanel(); applyToSel(); };
          gradEndRow.appendChild(sw);
        });
      }

      // Direction buttons
      _gradPanel.querySelectorAll('.wb-grad-dir').forEach(btn=>{
        btn.onclick=()=>{ style.gradientAngle=+btn.dataset.dir; updGradientPanel(); applyToSel(); };
      });

      // Clicking in gradient panel must not dismiss the panel via canvas-area listener.
      // (The panel is inside #wb-style-panel which is outside #wb-canvas-container, so it
      //  wouldn't trigger the canvas dismiss anyway — but stopPropagation is a safety net.)
      _gradPanel.addEventListener('mousedown',e=>e.stopPropagation());
      _gradPanel.addEventListener('click',    e=>e.stopPropagation());
    }

    // ── fill popup tolerance slider ───────────────────────────────────────────
    const fillTolSlider=$('wb-fill-tolerance');
    const fillTolVal=$('wb-fill-tol-val');
    if(fillTolSlider){
      fillTolSlider.oninput=function(){
        fillTolerance=parseInt(this.value)||30;
        if(fillTolVal) fillTolVal.textContent=fillTolerance;
        const pct=Math.round((fillTolerance/120)*100);
        this.style.setProperty('--pct',pct+'%');
      };
      // Set initial visual
      const initPct=Math.round((fillTolerance/120)*100);
      fillTolSlider.style.setProperty('--pct',initPct+'%');
    }

    // ── eraser mode buttons ───────────────────────────────────────────────────
    $('wb-eraser-obj').onclick=()=>{
      eraserMode='object';
      $('wb-eraser-obj').classList.add('active');
      $('wb-eraser-px').classList.remove('active');
      $('wb-eraser-popup').classList.remove('visible');
    };
    $('wb-eraser-px').onclick=()=>{
      eraserMode='pixel';
      $('wb-eraser-px').classList.add('active');
      $('wb-eraser-obj').classList.remove('active');
      $('wb-eraser-popup').classList.remove('visible');
    };

    // ── snap to grid ─────────────────────────────────────────────────────────
    function toggleSnap(){
      snapGrid=!snapGrid;
      $('wb-snap-btn').classList.toggle('snap-on', snapGrid);
    }
    $('wb-snap-btn').onclick=toggleSnap;

    // ── connector options popup ───────────────────────────────────────────────
    (function(){
      const LINE_STYLES = [
        { id:'curve',    tip:'Curve',    svg:`<svg width="32" height="20" viewBox="0 0 32 20" fill="none"><path d="M2 18 C12 18 20 2 30 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
        { id:'straight', tip:'Straight', svg:`<svg width="32" height="20" viewBox="0 0 32 20" fill="none"><line x1="2" y1="18" x2="30" y2="2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
        { id:'elbow',    tip:'Elbow',    svg:`<svg width="32" height="20" viewBox="0 0 32 20" fill="none"><path d="M2 18 L2 2 L30 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
      ];
      const HEAD_OPTS = [
        { id:'none',    tip:'None',    svg:`<svg width="26" height="16" viewBox="0 0 26 16" fill="none"><line x1="2" y1="8" x2="24" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>` },
        { id:'arrow',   tip:'Arrow',   svg:`<svg width="26" height="16" viewBox="0 0 26 16" fill="none"><line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><polygon points="18,4 26,8 18,12" fill="currentColor"/></svg>` },
        { id:'dot',     tip:'Dot',     svg:`<svg width="26" height="16" viewBox="0 0 26 16" fill="none"><line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="22" cy="8" r="3.5" fill="currentColor"/></svg>` },
        { id:'diamond', tip:'Diamond', svg:`<svg width="26" height="16" viewBox="0 0 26 16" fill="none"><line x1="2" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><polygon points="16,8 20,4 24,8 20,12" fill="currentColor"/></svg>` },
        { id:'bar',     tip:'Bar',     svg:`<svg width="26" height="16" viewBox="0 0 26 16" fill="none"><line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="23" y1="3" x2="23" y2="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>` },
      ];

      function buildRow(rowId, opts, getCurrent, setCurrent) {
        const row = $(rowId);
        opts.forEach(o => {
          const btn = document.createElement('button');
          btn.className = 'wb-conn-btn' + (getCurrent()===o.id ? ' active' : '');
          btn.title = o.tip;
          btn.innerHTML = o.svg;
          btn.dataset.val = o.id;
          btn.onclick = () => {
            setCurrent(o.id);
            row.querySelectorAll('.wb-conn-btn').forEach(b => b.classList.toggle('active', b.dataset.val===o.id));
            // apply to selected connector if there is one
            const sel=shapes.find(s=>selectedIds.has(s.id)&&s.type==='connector');
            if(sel){ snap(); Object.assign(sel,{connLineStyle,connStartHead,connEndHead}); renderArrow(sel); save(); }
          };
          row.appendChild(btn);
        });
      }

      buildRow('wb-conn-line-row', LINE_STYLES, ()=>connLineStyle, v=>{ connLineStyle=v; });
      buildRow('wb-conn-start-row', HEAD_OPTS,  ()=>connStartHead, v=>{ connStartHead=v; });
      buildRow('wb-conn-end-row',   HEAD_OPTS,  ()=>connEndHead,   v=>{ connEndHead=v; });
    })();

    // ── document-level cleanup (laser released outside canvas, eraser) ────────
    document.addEventListener('mouseup', () => {
      if(LAS.style.display==='block'){
        LAS.style.display='none'; laserPts=[];
        clearTimeout(laserFadeTimer); LTR.innerHTML='';
      }
      if(erasing){ erasing=false; if(erasedSnap)save(); }
    });

    // ── Popover auto-dismiss ───────────────────────────────────────────────────
    // All floating tool popovers collapse the moment the user touches the canvas
    // or any shape — exactly like Figma/Sketch.  UI elements (toolbar, panels,
    // the popovers themselves) live OUTSIDE #wb-canvas-container in the DOM, so
    // a single ancestor check is all we need — no allowlist required.
    // Capture phase fires before any target handler, so the popup is already
    // gone by the time the draw/erase/fill action begins.
    const POPOVER_IDS = ['wb-eraser-popup','wb-connector-popup','wb-fill-popup','wb-text-popup'];
    document.addEventListener('mousedown', e => {
      if(!overlay.classList.contains('wb-open')) return;
      // Only dismiss when the click lands inside the drawing canvas
      if(!(e.target.closest && e.target.closest('#wb-canvas-container'))) return;
      POPOVER_IDS.forEach(id => { const el=$(id); if(el) el.classList.remove('visible'); });
      // Text popup may re-appear if the click lands on a text shape
      // (handleShapeMD → updSel → syncTextPopup handles that automatically)
    }, true /* capture phase */);

    // ── board background picker (color + pattern, independent) ───────────────
    const BG_COLORS = [
      { hex:'#ffffff', label:'White' },
      { hex:'#f9fafb', label:'Light Gray' },
      { hex:'#fef9f0', label:'Cream' },
      { hex:'#e8f4fd', label:'Sky Blue' },
      { hex:'#f0fdf4', label:'Mint' },
      { hex:'#fdf4ff', label:'Lavender' },
      { hex:'#fefce8', label:'Yellow' },
      { hex:'#fff1f2', label:'Rose' },
      { hex:'#1e293b', label:'Dark Slate' },
      { hex:'#0f172a', label:'Navy' },
    ];
    const BG_PATTERNS = [
      { id:'plain',     tip:'Plain' },
      { id:'dots',      tip:'Dots' },
      { id:'lines',     tip:'Lines' },
      { id:'grid',      tip:'Grid' },
      { id:'diagonal',  tip:'Diagonal' },
      { id:'crosshatch',tip:'Crosshatch' },
      { id:'columns',   tip:'Columns' },
      { id:'isogrid',   tip:'Isometric' },
      { id:'circles',   tip:'Circles' },
      { id:'checker',   tip:'Checker' },
    ];

    let boardBgColor      = '#f9fafb';
    let boardBgPattern    = 'dots';
    let boardPatternColor = null; // null = auto (computed from bg)

    // saved custom background colors (max 8, persisted)
    let savedBgCustomColors = [];
    try { savedBgCustomColors = JSON.parse(localStorage.getItem('wb_bg_custom_colors')||'[]'); } catch(e){}

    function renderSavedBgColors() {
      const row = $('wb-bg-custom-colors'); if(!row) return;
      row.innerHTML = '';
      savedBgCustomColors.forEach(hex => {
        const btn = document.createElement('button');
        btn.className = 'wb-bgclr'; btn.dataset.hex = hex; btn.dataset.saved = 'bg';
        btn.style.background = hex; btn.title = hex;
        if(hex==='#ffffff') btn.style.boxShadow = 'inset 0 0 0 1.5px #d1d5db';
        btn.onclick = e => { e.stopPropagation(); boardBgColor=hex; applyBoardBg(); };
        row.appendChild(btn);
      });
    }

    function saveBgCustomColor(hex) {
      savedBgCustomColors = [hex, ...savedBgCustomColors.filter(c=>c!==hex)].slice(0,8);
      try { localStorage.setItem('wb_bg_custom_colors', JSON.stringify(savedBgCustomColors)); } catch(e){}
      renderSavedBgColors(); applyBoardBg();
    }

    function deleteBgCustomColor(hex) {
      savedBgCustomColors = savedBgCustomColors.filter(c=>c!==hex);
      try { localStorage.setItem('wb_bg_custom_colors', JSON.stringify(savedBgCustomColors)); } catch(e){}
      renderSavedBgColors(); applyBoardBg();
    }
    // compute a suitable pattern line/dot colour relative to the bg colour
    function patternColor(hex) {
      if(!hex||hex.length<7) return '#c0c8d0';
      const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      const lum=(0.299*r+0.587*g+0.114*b)/255;
      const adj=lum>0.55?-42:40;
      const c=v=>Math.min(255,Math.max(0,v+adj)).toString(16).padStart(2,'0');
      return `#${c(r)}${c(g)}${c(b)}`;
    }

    function applyBoardBg() {
      const pc=boardPatternColor||patternColor(boardBgColor);
      let img='none', sz='auto';
      if(boardBgPattern==='dots'){
        img=`radial-gradient(circle,${pc} 1.3px,transparent 1.3px)`; sz='22px 22px';
      } else if(boardBgPattern==='lines'){
        img=`linear-gradient(to bottom,transparent calc(100% - 1px),${pc} 100%)`; sz='100% 24px';
      } else if(boardBgPattern==='grid'){
        img=`linear-gradient(${pc} 1px,transparent 1px),linear-gradient(to right,${pc} 1px,transparent 1px)`;
        sz='24px 24px';
      } else if(boardBgPattern==='diagonal'){
        img=`repeating-linear-gradient(45deg,${pc} 0,${pc} 1px,transparent 0,transparent 50%)`; sz='18px 18px';
      } else if(boardBgPattern==='crosshatch'){
        img=`repeating-linear-gradient(45deg,${pc} 0,${pc} 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,${pc} 0,${pc} 1px,transparent 0,transparent 50%)`;
        sz='18px 18px';
      } else if(boardBgPattern==='columns'){
        img=`linear-gradient(to right,transparent calc(100% - 1px),${pc} 100%)`; sz='24px 100%';
      } else if(boardBgPattern==='isogrid'){
        img=`linear-gradient(60deg,${pc} 1px,transparent 1px),linear-gradient(120deg,${pc} 1px,transparent 1px),linear-gradient(to right,${pc} 1px,transparent 1px)`;
        sz='28px 28px';
      } else if(boardBgPattern==='circles'){
        img=`radial-gradient(circle,transparent 9px,${pc} 10px,transparent 11px)`; sz='24px 24px';
      } else if(boardBgPattern==='checker'){
        img=`conic-gradient(${pc} 90deg,transparent 0deg 180deg,${pc} 0deg 270deg,transparent 0deg)`;
        sz='24px 24px';
      }
      overlay.style.setProperty('background', boardBgColor, 'important');
      overlay.style.setProperty('background-image', img, 'important');
      overlay.style.setProperty('background-size', sz, 'important');
      // sync active states
      bgPickerEl.querySelectorAll('.wb-bgclr').forEach(b=>b.classList.toggle('active',b.dataset.hex===boardBgColor));
      bgPickerEl.querySelectorAll('.wb-bgpat').forEach(b=>b.classList.toggle('active',b.dataset.pat===boardBgPattern));
      if(typeof updatePatClrActive==='function') updatePatClrActive();
      try { localStorage.setItem('wb_bg2',JSON.stringify({color:boardBgColor,pattern:boardBgPattern,patternColor:boardPatternColor})); } catch(e){}
    }

    // build the picker panel
    const bgPickerEl = $('wb-bg-picker');
    bgPickerEl.innerHTML = '';

    // ── colour section ──
    const clrLabel = document.createElement('div');
    clrLabel.className = 'wb-bg-section-label';
    clrLabel.textContent = 'Background Color';
    bgPickerEl.appendChild(clrLabel);

    const clrRow = document.createElement('div');
    clrRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;align-items:center;';
    bgPickerEl.appendChild(clrRow);

    BG_COLORS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'wb-bgclr';
      btn.dataset.hex = c.hex;
      btn.title = c.label;
      btn.style.background = c.hex;
      if(c.hex==='#ffffff') btn.style.boxShadow = 'inset 0 0 0 1.5px #d1d5db';
      btn.onclick = e => { e.stopPropagation(); boardBgColor=c.hex; applyBoardBg(); };
      clrRow.appendChild(btn);
    });

    // custom colour wheel swatch
    const customWrap = document.createElement('div');
    customWrap.className = 'wb-bgclr-custom';
    customWrap.title = 'Custom color';
    customWrap.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`;
    const customInp = document.createElement('input');
    customInp.type = 'color'; customInp.value = '#f9fafb';
    customInp.oninput = e => { boardBgColor=customInp.value; applyBoardBg(); };
    customInp.onchange = e => { saveBgCustomColor(customInp.value); };
    customWrap.appendChild(customInp);
    clrRow.appendChild(customWrap);

    // ── saved custom bg colors row ──
    const bgCustomRow = document.createElement('div');
    bgCustomRow.id = 'wb-bg-custom-colors';
    bgPickerEl.appendChild(bgCustomRow);
    renderSavedBgColors();

    // ── divider ──
    const sep = document.createElement('div');
    sep.style.cssText = 'height:0.5px;background:var(--wb-separator);margin:2px -2px;';
    bgPickerEl.appendChild(sep);

    // ── pattern section ──
    const patLabel = document.createElement('div');
    patLabel.className = 'wb-bg-section-label';
    patLabel.textContent = 'Pattern';
    bgPickerEl.appendChild(patLabel);

    // tiny SVG previews for each pattern (rendered in the button colour)
    const patIcons = {
      plain:      `<svg width="36" height="28" viewBox="0 0 36 28"><rect width="36" height="28" fill="none"/></svg>`,
      dots:       `<svg width="36" height="28" viewBox="0 0 36 28"><circle cx="6" cy="6" r="1.3" fill="#94a3b8"/><circle cx="14" cy="6" r="1.3" fill="#94a3b8"/><circle cx="22" cy="6" r="1.3" fill="#94a3b8"/><circle cx="30" cy="6" r="1.3" fill="#94a3b8"/><circle cx="6" cy="14" r="1.3" fill="#94a3b8"/><circle cx="14" cy="14" r="1.3" fill="#94a3b8"/><circle cx="22" cy="14" r="1.3" fill="#94a3b8"/><circle cx="30" cy="14" r="1.3" fill="#94a3b8"/><circle cx="6" cy="22" r="1.3" fill="#94a3b8"/><circle cx="14" cy="22" r="1.3" fill="#94a3b8"/><circle cx="22" cy="22" r="1.3" fill="#94a3b8"/><circle cx="30" cy="22" r="1.3" fill="#94a3b8"/></svg>`,
      lines:      `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="0" y1="7" x2="36" y2="7" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="14" x2="36" y2="14" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="21" x2="36" y2="21" stroke="#94a3b8" stroke-width="1"/></svg>`,
      grid:       `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="0" y1="7" x2="36" y2="7" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="14" x2="36" y2="14" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="21" x2="36" y2="21" stroke="#94a3b8" stroke-width="1"/><line x1="9" y1="0" x2="9" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="18" y1="0" x2="18" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="27" y1="0" x2="27" y2="28" stroke="#94a3b8" stroke-width="1"/></svg>`,
      diagonal:   `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="-2" y1="8" x2="10" y2="-2" stroke="#94a3b8" stroke-width="1"/><line x1="6" y1="8" x2="18" y2="-2" stroke="#94a3b8" stroke-width="1"/><line x1="14" y1="8" x2="26" y2="-2" stroke="#94a3b8" stroke-width="1"/><line x1="22" y1="8" x2="34" y2="-2" stroke="#94a3b8" stroke-width="1"/><line x1="-2" y1="22" x2="24" y2="-2" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="30" x2="30" y2="0" stroke="#94a3b8" stroke-width="1"/><line x1="8" y1="30" x2="38" y2="0" stroke="#94a3b8" stroke-width="1"/><line x1="16" y1="30" x2="46" y2="0" stroke="#94a3b8" stroke-width="1"/></svg>`,
      crosshatch: `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="0" y1="28" x2="28" y2="0" stroke="#94a3b8" stroke-width="1"/><line x1="8" y1="28" x2="36" y2="0" stroke="#94a3b8" stroke-width="1"/><line x1="-8" y1="28" x2="20" y2="0" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="0" x2="28" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="8" y1="0" x2="36" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="-8" y1="0" x2="20" y2="28" stroke="#94a3b8" stroke-width="1"/></svg>`,
      columns:    `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="9" y1="0" x2="9" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="18" y1="0" x2="18" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="27" y1="0" x2="27" y2="28" stroke="#94a3b8" stroke-width="1"/></svg>`,
      isogrid:    `<svg width="36" height="28" viewBox="0 0 36 28"><line x1="0" y1="14" x2="36" y2="14" stroke="#94a3b8" stroke-width="1"/><line x1="0" y1="0" x2="18" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="10" y1="0" x2="28" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="20" y1="0" x2="38" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="36" y1="0" x2="18" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="26" y1="0" x2="8" y2="28" stroke="#94a3b8" stroke-width="1"/><line x1="16" y1="0" x2="-2" y2="28" stroke="#94a3b8" stroke-width="1"/></svg>`,
      circles:    `<svg width="36" height="28" viewBox="0 0 36 28"><circle cx="9" cy="9" r="7" fill="none" stroke="#94a3b8" stroke-width="1"/><circle cx="27" cy="9" r="7" fill="none" stroke="#94a3b8" stroke-width="1"/><circle cx="9" cy="23" r="7" fill="none" stroke="#94a3b8" stroke-width="1"/><circle cx="27" cy="23" r="7" fill="none" stroke="#94a3b8" stroke-width="1"/></svg>`,
      checker:    `<svg width="36" height="28" viewBox="0 0 36 28"><rect x="0" y="0" width="9" height="9" fill="#94a3b8" opacity="0.35"/><rect x="18" y="0" width="9" height="9" fill="#94a3b8" opacity="0.35"/><rect x="9" y="9" width="9" height="9" fill="#94a3b8" opacity="0.35"/><rect x="27" y="9" width="9" height="9" fill="#94a3b8" opacity="0.35"/><rect x="0" y="18" width="9" height="9" fill="#94a3b8" opacity="0.35"/><rect x="18" y="18" width="9" height="9" fill="#94a3b8" opacity="0.35"/></svg>`,
    };

    const patRow = document.createElement('div');
    patRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;';
    bgPickerEl.appendChild(patRow);

    BG_PATTERNS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'wb-bgpat';
      btn.dataset.pat = p.id;
      btn.title = p.tip;
      btn.innerHTML = patIcons[p.id];
      btn.onclick = e => { e.stopPropagation(); boardBgPattern=p.id; applyBoardBg(); };
      patRow.appendChild(btn);
    });

    // ── pattern colour section ──
    const patClrSep = document.createElement('div');
    patClrSep.style.cssText = 'height:0.5px;background:var(--wb-separator);margin:2px -2px;';
    bgPickerEl.appendChild(patClrSep);

    const patClrLabel = document.createElement('div');
    patClrLabel.className = 'wb-bg-section-label';
    patClrLabel.textContent = 'Pattern Color';
    bgPickerEl.appendChild(patClrLabel);

    const PATTERN_COLORS = [
      { hex:null,      label:'Auto',    auto:true },
      { hex:'#c0c8d0', label:'Gray'    },
      { hex:'#94a3b8', label:'Slate'   },
      { hex:'#60a5fa', label:'Blue'    },
      { hex:'#34d399', label:'Green'   },
      { hex:'#f472b6', label:'Pink'    },
      { hex:'#fb923c', label:'Orange'  },
      { hex:'#a78bfa', label:'Violet'  },
      { hex:'#000000', label:'Black'   },
      { hex:'#ffffff', label:'White'   },
    ];

    const patClrRow = document.createElement('div');
    patClrRow.id = 'wb-pat-clr-row';
    patClrRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;align-items:center;';
    bgPickerEl.appendChild(patClrRow);

    function updatePatClrActive() {
      patClrRow.querySelectorAll('[data-pc]').forEach(b => {
        const v = b.dataset.pc === '__auto__' ? null : b.dataset.pc;
        b.classList.toggle('active', boardPatternColor === v);
      });
    }

    PATTERN_COLORS.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'wb-bgclr';
      btn.dataset.pc = c.auto ? '__auto__' : c.hex;
      btn.title = c.label;
      if(c.auto) {
        // "Auto" swatch — half-and-half gradient to signify automatic
        btn.style.cssText = 'background:conic-gradient(#d1d5db 180deg,#6b7280 180deg);border:2px solid transparent;';
        btn.innerHTML = `<span style="font-size:7px;font-weight:700;color:#fff;text-shadow:0 0 3px #0006;pointer-events:none;line-height:1;">A</span>`;
      } else {
        btn.style.background = c.hex;
        if(c.hex==='#ffffff') btn.style.boxShadow = 'inset 0 0 0 1.5px #d1d5db';
      }
      btn.onclick = e => {
        e.stopPropagation();
        boardPatternColor = c.auto ? null : c.hex;
        updatePatClrActive();
        applyBoardBg();
      };
      patClrRow.appendChild(btn);
    });

    // custom pattern colour wheel
    const patClrCustomWrap = document.createElement('div');
    patClrCustomWrap.className = 'wb-bgclr-custom';
    patClrCustomWrap.title = 'Custom pattern color';
    patClrCustomWrap.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`;
    const patClrInp = document.createElement('input');
    patClrInp.type = 'color'; patClrInp.value = '#94a3b8';
    patClrInp.oninput = e => { boardPatternColor = patClrInp.value; updatePatClrActive(); applyBoardBg(); };
    patClrCustomWrap.appendChild(patClrInp);
    patClrRow.appendChild(patClrCustomWrap);

    updatePatClrActive();

    // load saved state
    try {
      const saved=JSON.parse(localStorage.getItem('wb_bg2')||'null');
      if(saved&&saved.color){ boardBgColor=saved.color; boardBgPattern=saved.pattern||'dots'; boardPatternColor=saved.patternColor||null; }
    } catch(e){}
    applyBoardBg();

    $('wb-bgpicker').onclick = e => { e.stopPropagation(); bgPickerEl.classList.toggle('open'); };
    document.addEventListener('click', () => bgPickerEl.classList.remove('open'));
    bgPickerEl.addEventListener('click', e => e.stopPropagation());

    // ── image upload ──────────────────────────────────────────────────────────
    $('wb-img-input').onchange=function(){
      const file=this.files[0]; if(!file) return;
      addImageShapesFromFiles([file]);
      this.value='';
    };

    // ── EXPORT AS PNG ─────────────────────────────────────────────────────────
    $('wb-export').onclick=async()=>{
      if(!shapes.length){alert('Nothing to export!');return;}

      // compute bounding box — project rotated corners so nothing gets clipped
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      function expandBB(x,y){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      shapes.forEach(s=>{
        if(s.type==='draw'||s.type==='highlighter'){
          if(s.points)s.points.forEach(p=>{expandBB(p[0],p[1]);});
        } else {
          // Project all four corners through the shape's rotation
          const cx=(s.x||0)+(s.w||0)/2, cy=(s.y||0)+(s.h||0)/2;
          const hw=(s.w||0)/2, hh=(s.h||0)/2;
          const rot=((s.rotation||0)*Math.PI/180);
          const cos=Math.cos(rot), sin=Math.sin(rot);
          [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].forEach(([lx,ly])=>{
            expandBB(cx+lx*cos-ly*sin, cy+lx*sin+ly*cos);
          });
        }
      });
      const pad=60;
      minX-=pad;minY-=pad;maxX+=pad;maxY+=pad;
      const bw=maxX-minX,bh=maxY-minY;
      const scale=2; // retina

      const cvs=document.createElement('canvas');
      cvs.width=bw*scale; cvs.height=bh*scale;
      const ctx2=cvs.getContext('2d');
      ctx2.scale(scale,scale);

      // ── draw board background matching current board settings ──
      ctx2.fillStyle=boardBgColor;
      ctx2.fillRect(0,0,bw,bh);
      const expPc=boardPatternColor||patternColor(boardBgColor);
      if(boardBgPattern==='dots'){
        ctx2.fillStyle=expPc;
        for(let gx=0;gx<=bw;gx+=22) for(let gy=0;gy<=bh;gy+=22){
          ctx2.beginPath();ctx2.arc(gx,gy,0.8,0,Math.PI*2);ctx2.fill();
        }
      } else if(boardBgPattern==='lines'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        for(let gy=24;gy<=bh;gy+=24){
          ctx2.beginPath();ctx2.moveTo(0,gy);ctx2.lineTo(bw,gy);ctx2.stroke();
        }
      } else if(boardBgPattern==='grid'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        for(let gx=24;gx<=bw;gx+=24){ctx2.beginPath();ctx2.moveTo(gx,0);ctx2.lineTo(gx,bh);ctx2.stroke();}
        for(let gy=24;gy<=bh;gy+=24){ctx2.beginPath();ctx2.moveTo(0,gy);ctx2.lineTo(bw,gy);ctx2.stroke();}
      } else if(boardBgPattern==='diagonal'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        const step=18;
        for(let d=-bh;d<=bw+bh;d+=step){
          ctx2.beginPath();ctx2.moveTo(d,0);ctx2.lineTo(d+bh,bh);ctx2.stroke();
        }
      } else if(boardBgPattern==='crosshatch'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        const step=18;
        for(let d=-bh;d<=bw+bh;d+=step){
          ctx2.beginPath();ctx2.moveTo(d,0);ctx2.lineTo(d+bh,bh);ctx2.stroke();
          ctx2.beginPath();ctx2.moveTo(d,bh);ctx2.lineTo(d+bh,0);ctx2.stroke();
        }
      } else if(boardBgPattern==='columns'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        for(let gx=24;gx<=bw;gx+=24){ctx2.beginPath();ctx2.moveTo(gx,0);ctx2.lineTo(gx,bh);ctx2.stroke();}
      } else if(boardBgPattern==='isogrid'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        const s=28;
        for(let gy=s;gy<=bh;gy+=s){ctx2.beginPath();ctx2.moveTo(0,gy);ctx2.lineTo(bw,gy);ctx2.stroke();}
        for(let d=-bh;d<=bw+bh;d+=s){
          ctx2.beginPath();ctx2.moveTo(d,0);ctx2.lineTo(d+bh,bh);ctx2.stroke();
          ctx2.beginPath();ctx2.moveTo(d,0);ctx2.lineTo(d-bh,bh);ctx2.stroke();
        }
      } else if(boardBgPattern==='circles'){
        ctx2.strokeStyle=expPc; ctx2.lineWidth=1;
        const r=9, s=24;
        for(let gx=s/2;gx<=bw;gx+=s) for(let gy=s/2;gy<=bh;gy+=s){
          ctx2.beginPath();ctx2.arc(gx,gy,r,0,Math.PI*2);ctx2.stroke();
        }
      } else if(boardBgPattern==='checker'){
        const r=parseInt(expPc.slice(1,3),16),g=parseInt(expPc.slice(3,5),16),b=parseInt(expPc.slice(5,7),16);
        ctx2.fillStyle=`rgba(${r},${g},${b},0.35)`;
        const cs=24;
        for(let gx=0;gx<=bw;gx+=cs) for(let gy=0;gy<=bh;gy+=cs){
          if(((gx/cs)+(gy/cs))%2===0) ctx2.fillRect(gx,gy,cs,cs);
        }
      }

      // draw each shape onto canvas via offscreen SVG → img trick
      const svgNS='http://www.w3.org/2000/svg';

      function svgToImg(svgStr,x,y,w,h){
        return new Promise(res=>{
          const img=new Image();
          const blob=new Blob([svgStr],{type:'image/svg+xml'});
          const url=URL.createObjectURL(blob);
          // NOTE: callers pre-translate ctx2 to the shape centre, so x/y are
          // already relative to that origin — do NOT subtract minX/minY again.
          img.onload=()=>{ctx2.drawImage(img,x,y,w,h);URL.revokeObjectURL(url);res();};
          img.onerror=()=>{URL.revokeObjectURL(url);res();};
          img.src=url;
        });
      }

      // Render all non-stroke shapes using their innerHTML SVG
      const tasks=[];
      for(const s of shapes){
        if(s.type==='draw'||s.type==='highlighter') continue; // handled via path below
        if(s.type==='arrow'||s.type==='line'||s.type==='connector') continue;
        if(s.type==='text'){
          // draw text directly
          ctx2.save();
          ctx2.translate(s.x-minX+s.w/2,s.y-minY+s.h/2);
          ctx2.rotate((s.rotation||0)*Math.PI/180);
          ctx2.globalAlpha=s.style.opacity;
          const fs=[14,18,24,32][s.style.size-1];
          const expFontWeight = s.style.textBold   ? 'bold '   : '';
          const expFontStyle  = s.style.textItalic ? 'italic ' : '';
          // Canvas font-family: use generic family for portability in export
          const expFontFamilyMap = { system:'system-ui,sans-serif', serif:'Georgia,serif', mono:"'Courier New',monospace", cursive:'cursive' };
          const expFontFamily = expFontFamilyMap[s.style.textFontFamily||'system'] || 'system-ui,sans-serif';
          ctx2.font=`${expFontStyle}${expFontWeight}${fs}px ${expFontFamily}`;
          ctx2.fillStyle=s.style.color;
          ctx2.textAlign=(s.style.textAlign||'left');
          ctx2.textBaseline='top';
          const expLH=(s.style.textLineHeight||1.5)*fs;
          const expAlignX = (s.style.textAlign==='center') ? 0 : (s.style.textAlign==='right') ? s.w/2 : -(s.w/2);
          const lines=(s.text||'').split('\n');
          lines.forEach((l,i)=>ctx2.fillText(l, expAlignX, -(s.h/2)+i*expLH));
          // underline / strikethrough via manual lines
          if(s.style.textUnderline||s.style.textStrike){
            lines.forEach((l,i)=>{
              const tw=ctx2.measureText(l).width;
              const ly=-(s.h/2)+i*expLH;
              const lx0 = (s.style.textAlign==='center') ? -tw/2 : (s.style.textAlign==='right') ? s.w/2-tw : -(s.w/2);
              ctx2.strokeStyle=s.style.color; ctx2.lineWidth=Math.max(1,fs*0.06);
              if(s.style.textUnderline){ ctx2.beginPath(); ctx2.moveTo(lx0,ly+fs+1); ctx2.lineTo(lx0+tw,ly+fs+1); ctx2.stroke(); }
              if(s.style.textStrike)   { ctx2.beginPath(); ctx2.moveTo(lx0,ly+fs*0.56); ctx2.lineTo(lx0+tw,ly+fs*0.56); ctx2.stroke(); }
            });
          }
          ctx2.restore();
          continue;
        }
        if(s.type==='image'){
          tasks.push(new Promise(res=>{
            const img=new Image();
            img.crossOrigin='anonymous';
            img.onload=()=>{
              ctx2.save();
              ctx2.translate(s.x-minX+s.w/2,s.y-minY+s.h/2);
              ctx2.rotate((s.rotation||0)*Math.PI/180);
              // Apply flipH / flipV — scale around the already-centred origin
              if(s.flipH||s.flipV) ctx2.scale(s.flipH?-1:1, s.flipV?-1:1);
              ctx2.globalAlpha=s.style.opacity;
              const _eff=s.style.effect||'none';
              const _col=s.style.color||'#000';
              const _flt=strokeEffectCSS(_eff,_col)||((s.style.glow&&_eff==='none')?strokeEffectCSS('glow',_col):'');
              if(_flt) ctx2.filter=_flt;
              ctx2.drawImage(img,-s.w/2,-s.h/2,s.w,s.h);
              ctx2.filter='none';
              ctx2.restore(); res();
            };
            img.onerror=()=>res();
            img.src=s.src;
          }));
          continue;
        }
        if(s.type==='sticky'){
          ctx2.save();
          ctx2.translate(s.x-minX+s.w/2,s.y-minY+s.h/2);
          ctx2.rotate((s.rotation||0)*Math.PI/180);
          ctx2.globalAlpha=s.style.opacity;
          const bg=s.style.fillColor==='transparent'?'#fef3c7':s.style.fillColor;
          ctx2.fillStyle=bg;
          ctx2.shadowColor='rgba(0,0,0,.12)'; ctx2.shadowBlur=8; ctx2.shadowOffsetX=2; ctx2.shadowOffsetY=3;
          ctx2.beginPath(); ctx2.rect(-s.w/2,-s.h/2,s.w,s.h); ctx2.fill();
          ctx2.shadowColor='transparent';
          const fs=[13,16,20,26][s.style.size-1];
          ctx2.font=`${fs}px Segoe UI,system-ui,sans-serif`;
          ctx2.fillStyle=s.style.color;
          ctx2.textAlign='left'; ctx2.textBaseline='top';
          const lines=(s.text||'').split('\n');
          lines.forEach((l,i)=>ctx2.fillText(l,-s.w/2+10,-s.h/2+10+i*fs*1.4));
          ctx2.restore();
          continue;
        }
        // shapes with SVG — grab from live DOM
        const el=R.querySelector('#ws-'+s.id);
        if(el){
          const sv=el.querySelector('svg');
          if(sv){
            const serialized=new XMLSerializer().serializeToString(sv);
            const wrapped=`<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">${serialized.replace(/<svg[^>]*>/,'').replace('</svg>','')}</svg>`;
            tasks.push((async()=>{
              ctx2.save();
              ctx2.translate(s.x-minX+s.w/2,s.y-minY+s.h/2);
              ctx2.rotate((s.rotation||0)*Math.PI/180);
              // Apply flipH / flipV — scale around the already-centred origin
              if(s.flipH||s.flipV) ctx2.scale(s.flipH?-1:1, s.flipV?-1:1);
              ctx2.globalAlpha=s.style.opacity;
              const _eff2=s.style.effect||'none';
              const _col2=s.style.color||'#000';
              const _flt2=strokeEffectCSS(_eff2,_col2)||((s.style.glow&&_eff2==='none')?strokeEffectCSS('glow',_col2):'');
              if(_flt2) ctx2.filter=_flt2;
              await svgToImg(wrapped,-s.w/2,-s.h/2,s.w,s.h);
              ctx2.filter='none';
              ctx2.restore();
            })());
          }
        }
      }

      // draw strokes and arrows from live SVGs
      const drawTask=new Promise(res=>{
        const dsvXML=new XMLSerializer().serializeToString(DSV);
        const asvXML=new XMLSerializer().serializeToString(ASV);
        const combinedSVG=`<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}" viewBox="${minX} ${minY} ${bw} ${bh}">
          ${dsvXML.replace(/<svg[^>]*>/,'').replace('</svg>','')}
          ${asvXML.replace(/<svg[^>]*>/,'').replace('</svg>','')}
        </svg>`;
        const img=new Image();
        const blob=new Blob([combinedSVG],{type:'image/svg+xml'});
        const url=URL.createObjectURL(blob);
        img.onload=()=>{ctx2.drawImage(img,0,0);URL.revokeObjectURL(url);res();};
        img.onerror=()=>{URL.revokeObjectURL(url);res();};
        img.src=url;
      });
      tasks.push(drawTask);

      await Promise.all(tasks);

      // download
      cvs.toBlob(blob=>{
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url; a.download='whiteboard.png'; a.click();
        URL.revokeObjectURL(url);
      },'image/png');
    };

    // ── clear ─────────────────────────────────────────────────────────────────
    $('wb-clear').onclick=()=>{if(!shapes.length)return;if(confirm('Clear all?')){snap();shapes=[];renderAll();save();}};
    $('wb-undo').onclick=undo;
    $('wb-redo').onclick=redo;

    // ── zoom controls ─────────────────────────────────────────────────────────
    $('wb-zin').onclick=()=>{zoom=Math.min(8,zoom*1.2);applyXform();};
    $('wb-zout').onclick=()=>{zoom=Math.max(.05,zoom/1.2);applyXform();};
    $('wb-z1').onclick=()=>{zoom=1;panX=0;panY=0;applyXform();};
    $('wb-zfit').onclick=()=>{
      if(!shapes.length){zoom=1;panX=0;panY=0;applyXform();return;}
      let mx=Infinity,my=Infinity,xx=-Infinity,xy=-Infinity;
      shapes.forEach(s=>{
        if((s.type==='draw'||s.type==='highlighter')&&s.points&&s.points.length){
          s.points.forEach(p=>{mx=Math.min(mx,p[0]);my=Math.min(my,p[1]);xx=Math.max(xx,p[0]);xy=Math.max(xy,p[1]);});
        } else {
          mx=Math.min(mx,s.x||0);my=Math.min(my,s.y||0);
          xx=Math.max(xx,(s.x||0)+(s.w||0));xy=Math.max(xy,(s.y||0)+(s.h||0));
        }
      });
      const pad=80,vw=window.innerWidth,vh=window.innerHeight;
      zoom=Math.min(vw/(xx-mx+pad*2),vh/(xy-my+pad*2),2);
      panX=(vw-(xx-mx)*zoom)/2-mx*zoom; panY=(vh-(xy-my)*zoom)/2-my*zoom;
      applyXform();
    };

    // ── pages ─────────────────────────────────────────────────────────────────
    function rebuildPageBtns(){
      const bar=$('wb-pages');
      bar.querySelectorAll('[data-pgidx]').forEach(b=>b.remove());
      bar.classList.toggle('single-page', pages.length===1);
      const addBtn=$('wb-addpage');
      pages.forEach((p,i)=>{
        const b=document.createElement('button');
        b.className='wb-pgbtn'+(i===pageIdx?' active':'');
        b.dataset.pgidx=i;

        const lbl=document.createElement('span');
        lbl.textContent=p.name||`Page ${i+1}`;
        lbl.style.cssText='pointer-events:none;';
        b.appendChild(lbl);

        const del=document.createElement('button');
        del.className='wb-pgdel';
        del.innerHTML='&#x2715;';
        del.title='Delete page';
        del.onclick=e=>{ e.stopPropagation(); deletePage(i); };
        b.appendChild(del);

        b.onclick=()=>switchPage(i);
        bar.insertBefore(b,addBtn);
      });
    }
    function deletePage(i){
      if(pages.length<=1) return; // never delete last page
      snap();
      pages[pageIdx].shapes=clone(shapes);
      pages.splice(i,1);
      // If the deleted page was before the current one, the current page has
      // shifted one index down.  Otherwise clamp to the new last index.
      const newIdx = i < pageIdx
        ? pageIdx - 1
        : Math.min(pageIdx, pages.length - 1);
      pageIdx=newIdx;
      shapes=clone(pages[pageIdx].shapes);
      selectedIds.clear(); rebuildPageBtns(); renderAll(); save();
    }
    function switchPage(i){
      pages[pageIdx].shapes=clone(shapes);
      pageIdx=i; shapes=clone(pages[i].shapes);
      selectedIds.clear(); renderAll();
      $('wb-pages').querySelectorAll('[data-pgidx]').forEach(b=>b.classList.toggle('active',+b.dataset.pgidx===i));
      save();
    }
    $('wb-addpage').onclick=()=>{
      pages[pageIdx].shapes=clone(shapes);
      pages.push({shapes:[],name:`Page ${pages.length+1}`});
      pageIdx=pages.length-1; shapes=[];
      rebuildPageBtns(); renderAll(); save();
    };

    // ── keyboard shortcuts ────────────────────────────────────────────────────
    // ── keyboard shortcuts (single document handler — overlay handler was unreliable) ──
    document.addEventListener('keydown', e => {
      if(!overlay.classList.contains('wb-open')) return;
      // never hijack typing inside inputs / contenteditable
      const tag = e.target.tagName;
      const ctrl = e.ctrlKey || e.metaKey;

      // ── Ctrl+B/I/U while editing a text shape ─────────────────────────────
      if(e.target.isContentEditable && ctrl) {
        const selTextShape = selectedIds.size===1 && shapes.find(s=>selectedIds.has(s.id)&&s.type==='text');
        if(selTextShape) {
          if(e.key==='b'||e.key==='B'){ e.preventDefault(); style.textBold=!style.textBold; snap(); Object.assign(selTextShape.style,clone(style)); R.querySelector('#ws-'+selTextShape.id)?.remove(); renderShape(selTextShape); updSel(); updTextPopup(); save(); return; }
          if(e.key==='i'||e.key==='I'){ e.preventDefault(); style.textItalic=!style.textItalic; snap(); Object.assign(selTextShape.style,clone(style)); R.querySelector('#ws-'+selTextShape.id)?.remove(); renderShape(selTextShape); updSel(); updTextPopup(); save(); return; }
          if(e.key==='u'||e.key==='U'){ e.preventDefault(); style.textUnderline=!style.textUnderline; snap(); Object.assign(selTextShape.style,clone(style)); R.querySelector('#ws-'+selTextShape.id)?.remove(); renderShape(selTextShape); updSel(); updTextPopup(); save(); return; }
        }
      }

      if(e.target.isContentEditable || tag==='INPUT' || tag==='TEXTAREA') return;

      // ── undo / redo ──────────────────────────────────────────────────────
      if(ctrl && e.key==='z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
      if(ctrl && (e.key==='y' || (e.shiftKey && e.key==='Z'))){
        e.preventDefault(); redo(); return;
      }

      // ── clipboard ────────────────────────────────────────────────────────
      if(ctrl && e.key==='c'){ clipboard=shapes.filter(s=>selectedIds.has(s.id)).map(s=>clone(s)); return; }
      if(ctrl && e.key==='x'){
        clipboard=shapes.filter(s=>selectedIds.has(s.id)).map(s=>clone(s));
        snap(); [...selectedIds].forEach(id=>deleteShape(id)); selectedIds.clear(); save(); return;
      }
      // NOTE: Ctrl+V is intentionally NOT handled here. Calling preventDefault() on
      // this keydown stops the browser from ever firing the native 'paste' event,
      // which is what lets us read real clipboard images — see the 'paste' listener
      // below, which now owns ALL paste behavior (clipboard images + our own shapes).
      if(ctrl && e.key==='d'){ e.preventDefault(); dupSel(); return; }
      if(ctrl && e.key==='a'){
        e.preventDefault();
        shapes.forEach(s=>selectedIds.add(s.id)); updSel(); return;
      }

      // ── delete selected / delete page ────────────────────────────────────
      if(e.key==='Delete' || e.key==='Backspace'){
        if(selectedIds.size){
          e.preventDefault();
          snap(); [...selectedIds].forEach(id=>deleteShape(id)); selectedIds.clear(); save(); return;
        }
        // Nothing selected — delete the current page instead
        if(pages.length > 1){ e.preventDefault(); deletePage(pageIdx); return; }
      }

      // ── nudge ────────────────────────────────────────────────────────────
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && selectedIds.size){
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key==='ArrowLeft'?-d : e.key==='ArrowRight'?d : 0;
        const dy = e.key==='ArrowUp'?-d  : e.key==='ArrowDown'?d  : 0;
        snap();
        shapes.forEach(s=>{
          if(!selectedIds.has(s.id)) return;
          if(s.type==='draw'||s.type==='highlighter'){
            if(s.points) s.points=s.points.map(p=>[p[0]+dx,p[1]+dy]);
          } else { s.x+=dx; s.y+=dy; }
        });
        renderAll(); updSel(); save(); return;
      }

      // ── tool shortcuts ───────────────────────────────────────────────────
      if(!ctrl){
        const km={v:'select',h:'hand',p:'draw',i:'highlighter',e:'eraser',b:'fill',
                  r:'rect',o:'ellipse',a:'arrow',l:'line',c:'connector',
                  t:'text',s:'sticky',f:'frame'};
        const tool = km[e.key.toLowerCase()];
        if(tool){ setTool(tool); return; }
        if(e.key.toLowerCase()==='g'){ toggleSnap(); return; }
      }

      // ── escape ───────────────────────────────────────────────────────────
      if(e.key==='Escape'){ selectedIds.clear(); updSel(); setTool('select'); return; }

      // ── save PNG ─────────────────────────────────────────────────────────
      if(ctrl && e.key==='s'){ e.preventDefault(); $('wb-export').click(); return; }
    });

    // ── paste image from OS clipboard (screenshots, "copy image", copied files) ──
    // Turn one or more image File/Blob objects into whiteboard image shapes,
    // centered in the current view and selected afterward. Shared by: toolbar
    // upload, native clipboard paste, and the right-click "Paste" menu item.
    function addImageShapesFromFiles(files){
      if(!files || !files.length) return;
      snap(); selectedIds.clear();
      let pasteIdx=0;
      files.forEach(file=>{
        const reader=new FileReader();
        reader.onload=ev=>{
          const img=new Image();
          img.onload=()=>{
            const p=s2c(window.innerWidth/2,window.innerHeight/2);
            const aspect=img.width/img.height;
            let w=Math.min(400,img.width),h=w/aspect;
            const off=(pasteIdx++)*24; // cascade multiple pasted images so they don't stack exactly
            const s={id:uid(),type:'image',x:p.x-w/2+off,y:p.y-h/2+off,w,h,rotation:0,style:clone(style),src:ev.target.result};
            shapes.push(s); renderShape(s); selectedIds.add(s.id); updSel(); save();
          };
          img.src=ev.target.result;
        };
        reader.readAsDataURL(file);
      });
      setTool('select');
    }

    // Right-click "Paste" is a plain button click, not a ClipboardEvent — it has no
    // clipboardData to read, so it has to ask the async Clipboard API directly.
    // Returns true if it found and pasted an image, so the caller can fall back to
    // pasteCB() (our own shapes clipboard) when the system clipboard has no image.
    async function tryPasteImageFromSystemClipboard(){
      if(!navigator.clipboard || !navigator.clipboard.read) return false;
      try{
        const items = await navigator.clipboard.read();
        const blobs = [];
        for(const item of items){
          const imgType = item.types.find(t=>t.startsWith('image/'));
          if(imgType) blobs.push(await item.getType(imgType));
        }
        if(!blobs.length) return false;
        addImageShapesFromFiles(blobs);
        return true;
      }catch(err){
        return false; // permission denied, unsupported, or nothing pasteable
      }
    }

    // Single entry point for Ctrl+V: tries a real clipboard image first, falling
    // back to our own internal shapes clipboard (pasteCB) when there isn't one.
    // Must NOT be pre-empted by preventDefault() on keydown (see note above) or
    // the browser will never fire this event at all.
    document.addEventListener('paste', e => {
      if(!overlay.classList.contains('wb-open')) return;
      // Let native text paste through untouched while editing text INSIDE the
      // whiteboard itself (a text shape, sticky note, hex input, etc). Stray focus
      // left on the host page underneath the overlay doesn't count — the board is
      // what's open and visible, so it should still receive the paste.
      const tag = e.target.tagName;
      const editingInsideBoard = overlay.contains(e.target) && (e.target.isContentEditable || tag==='INPUT' || tag==='TEXTAREA');
      if(editingInsideBoard) return;

      e.preventDefault(); e.stopPropagation();
      const dt = e.clipboardData;
      const files = dt ? [...(dt.items||[])].filter(it=>it.kind==='file' && it.type.startsWith('image/')).map(it=>it.getAsFile()).filter(Boolean) : [];
      if(files.length) addImageShapesFromFiles(files);
      else pasteCB();
    }, true); // capture phase: run before the host page's own paste handlers (rich text editors, etc.)

    // ── touch support ─────────────────────────────────────────────────────────
    let t1=null,t2=null,tDist=0;
    CC.addEventListener('touchstart',e=>{
      if(e.touches.length===2){t1=e.touches[0];t2=e.touches[1];tDist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY);return;}
      const t=e.touches[0];
      CC.dispatchEvent(new MouseEvent('mousedown',{clientX:t.clientX,clientY:t.clientY,button:0}));
    },{passive:false});
    CC.addEventListener('touchmove',e=>{
      e.preventDefault();
      if(e.touches.length===2){
        const ta=e.touches[0],tb=e.touches[1];
        const d=Math.hypot(tb.clientX-ta.clientX,tb.clientY-ta.clientY);
        const f=d/tDist;
        const cx=(ta.clientX+tb.clientX)/2,cy=(ta.clientY+tb.clientY)/2;
        const r=CC.getBoundingClientRect();
        const wx=(cx-r.left-panX)/zoom,wy=(cy-r.top-panY)/zoom;
        zoom=clamp(zoom*f,.05,8); panX=cx-r.left-wx*zoom; panY=cy-r.top-wy*zoom;
        applyXform(); tDist=d; return;
      }
      const t=e.touches[0];
      CC.dispatchEvent(new MouseEvent('mousemove',{clientX:t.clientX,clientY:t.clientY}));
    },{passive:false});
    CC.addEventListener('touchend',e=>{
      if(e.touches.length<2){t1=t2=null;}
      CC.dispatchEvent(new MouseEvent('mouseup',{}));
    });

    // ── INIT ──────────────────────────────────────────────────────────────────
    load();
    initDSVDefs();
    applyXform();
    setTool(activeTool); // restore last-used tool (load() may have set it)
    updPanel();
    rebuildPageBtns();
    renderAll();

  })(); // end engine

})();