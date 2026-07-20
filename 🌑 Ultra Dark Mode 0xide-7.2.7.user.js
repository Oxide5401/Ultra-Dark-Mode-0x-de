// ==UserScript==
// @name         🌑 Ultra Dark Mode 0xide
// @namespace    https://github.com/Oxide5401/Ultra-Dark-Mode-0x-de.git
// @version      7.2.7
// @description  8 strategies · smart element rounding · per-site CSS · element picker · unlimited custom palettes · schedule · PDF renderer · full dashboard
// @author       Oxide
// @match        *://*/*
// @match        file:///*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

// 7.2.7 — Fixed: floating UI (dropdowns/menus/dialogs) turning transparent and
// showing the page behind them on sites that use PascalCase component class
// names (e.g. GitHub/Primer's "Overlay", "SelectMenu", "Popover", "Dialog").
// `[class*="overlay"]` never matched class="Overlay" — CSS attribute selectors
// are case-sensitive by default, unlike the .toLowerCase() checks already used
// in the JS heuristics further down. Added the `i` flag to every class-substring
// selector in BASE_CSS/applyLayer, plus a native `[popover]` and
// dropdown/dialog fallback, and a GitHub-specific safety-net patch.

(function () {
  'use strict';

  // ─── KNOWN SITE PATCHES ──────────────────────────────────────────────────────

  const SITE_PATCHES = {
    'youtube.com':      { strategy:'variables', excludeSelectors:['ytd-thumbnail img','video','.ytp-chrome-bottom'], css:`ytd-app{--yt-spec-base-background:var(--udm-bg)!important;--yt-spec-raised-background:var(--udm-bg-1)!important;--yt-spec-text-primary:var(--udm-text)!important}#masthead,ytd-masthead{background:var(--udm-bg-1)!important}` },
    'google.com':       { strategy:'variables', excludeSelectors:['img.rIPJA','.l5R2jf'], css:`body,#searchform,#rcnt,#center_col{background:var(--udm-bg)!important}.g,.rc{background:var(--udm-bg-1)!important;border-color:var(--udm-border)!important}h3.LC20lb{color:var(--udm-link)!important}.VwiC3b{color:var(--udm-text-muted)!important}` },
    'twitter.com':      { strategy:'variables', excludeSelectors:['[data-testid="tweetPhoto"] img','[data-testid="videoPlayer"]'], css:`[data-testid="primaryColumn"]{background:var(--udm-bg)!important}[data-testid="sidebarColumn"]{background:var(--udm-bg-1)!important}` },
    'reddit.com':       { strategy:'variables', excludeSelectors:[], css:`:root{--color-neutral-background-weak:var(--udm-bg)!important;--color-neutral-background-strong:var(--udm-bg-1)!important}shreddit-app,#main-content{background:var(--udm-bg)!important}` },
    'github.com':       { strategy:'variables', excludeSelectors:['.avatar','.header-logo'], css:`.blob-code-inner,.blob-num{background:var(--udm-code-bg)!important}.highlight .pl-c{color:#8b949e!important}.highlight .pl-k{color:#ff7b72!important}.highlight .pl-s{color:#a5d6ff!important}.Overlay,.Overlay-body,.Overlay-header,.Overlay-footer,.SelectMenu,.SelectMenu-modal,.SelectMenu-list,.Popover,.Popover-message,.Dialog,details-dialog,details-menu,anchored-position,[popover]{background-color:var(--udm-surface)!important;color:var(--udm-text)!important;border-color:var(--udm-border)!important}` },
    'notion.so':        { strategy:'heuristic', excludeSelectors:['.notion-image-block img'], css:`.notion-page-content,.notion-app-inner{background:var(--udm-bg)!important;color:var(--udm-text)!important}.notion-sidebar,.notion-topbar{background:var(--udm-bg-1)!important}` },
    'wikipedia.org':    { strategy:'override',  excludeSelectors:['.mw-logo','figure img'], css:`#content,.mw-body{background:var(--udm-bg)!important;color:var(--udm-text)!important}#mw-head,#mw-panel{background:var(--udm-bg-1)!important}.infobox{background:var(--udm-surface)!important}` },
    'stackoverflow.com':{ strategy:'variables', excludeSelectors:[], css:`.s-sidebarwidget{background:var(--udm-surface)!important;border-color:var(--udm-border)!important}code.s-code-block{background:var(--udm-code-bg)!important}` },
    'docs.google.com':  { strategy:'invert',    excludeSelectors:['img','video'], css:'' },
    'linkedin.com':     { strategy:'variables', excludeSelectors:['img.presence-entity__image'], css:`.scaffold-layout__main,.global-nav{background:var(--udm-bg)!important}.feed-shared-update-v2,.base-card{background:var(--udm-surface)!important;border-color:var(--udm-border)!important}` },
    'medium.com':       { strategy:'override',  excludeSelectors:['figure img'], css:`body,article{background:var(--udm-bg)!important;color:var(--udm-text)!important}` },
    'mail.google.com':  { strategy:'invert',    excludeSelectors:['img'], css:'' },
    'chatgpt.com':      { strategy:'variables', excludeSelectors:['img','canvas'], css:`main,#__next,[class*="react-scroll"]{background:var(--udm-bg)!important}[class*="composer"],[class*="sidebar"]{background:var(--udm-bg-1)!important;border-color:var(--udm-border)!important}` },
    'chat.openai.com':  { strategy:'variables', excludeSelectors:['img','canvas'], css:`main,#__next{background:var(--udm-bg)!important}` },
    'instagram.com':    { strategy:'variables', excludeSelectors:['img','video'], css:`body,#root,[role="main"]{background:var(--udm-bg)!important}[class*="x1n2onr6"]{background:var(--udm-bg-1)!important}` },
    'open.spotify.com': { strategy:'invert',    excludeSelectors:['img','.cover-art'], css:'' },
    'news.ycombinator.com':{ strategy:'override', excludeSelectors:[], css:`body,.pagetable{background:var(--udm-bg)!important}.title a{color:var(--udm-link)!important}.subtext,.hnuser{color:var(--udm-text-muted)!important}td.subtext a{color:var(--udm-text-muted)!important}.athing{background:var(--udm-bg)!important}` },
    'figma.com':        { strategy:'variables', excludeSelectors:['canvas'], css:`[class*="navbar"],[class*="toolbar"]{background:var(--udm-bg-1)!important;border-color:var(--udm-border)!important}` },
    'vscode.dev':       { strategy:'variables', excludeSelectors:['canvas'], css:`.monaco-workbench{background:var(--udm-bg)!important}` },
    'claude.ai':        { strategy:'variables', excludeSelectors:['img'], css:`[class*="bg-bg-100"]{background:var(--udm-bg)!important}[class*="bg-bg-200"]{background:var(--udm-bg-1)!important}` },
  };
  SITE_PATCHES['x.com'] = SITE_PATCHES['twitter.com'];

  // ─── DEFAULTS & PALETTES ─────────────────────────────────────────────────────

  const DEFAULT_CFG = {
    enabled:true, strategy:'variables', warmth:0, brightness:100, contrast:100, imgDim:0,
    palette:'apple', honourNative:true, osSync:false,
    schedule:{ active:false, from:'20:00', to:'07:00' },
    sites:{}, _toggles:0,
    customPalettes:{}, // name → palette object; unlimited custom palettes
  };

  const PALETTES = {
    apple:     { bg:'#1c1c1e',bg1:'#2c2c2e',bg2:'#3a3a3c',surf:'#2c2c2e',surf1:'#3a3a3c',border:'#38383a',text:'#ffffff',muted:'#8e8e93',link:'#0a84ff',linkH:'#409cff',inBg:'#1c1c1e',codeBg:'#1c1c1e',shadow:'rgba(0,0,0,0.55)' },
    default:   { bg:'#0f1117',bg1:'#161b22',bg2:'#1c2128',surf:'#21262d',surf1:'#2d333b',border:'#30363d',text:'#e6edf3',muted:'#8b949e',link:'#58a6ff',linkH:'#79b8ff',inBg:'#161b22',codeBg:'#161b22',shadow:'rgba(0,0,0,0.7)' },
    midnight:  { bg:'#000000',bg1:'#0a0a0a',bg2:'#111111',surf:'#1a1a1a',surf1:'#222222',border:'#2a2a2a',text:'#f0f0f0',muted:'#888888',link:'#66b3ff',linkH:'#88c8ff',inBg:'#0a0a0a',codeBg:'#0a0a0a',shadow:'rgba(0,0,0,0.9)' },
    dracula:   { bg:'#282a36',bg1:'#1e1f29',bg2:'#21222c',surf:'#343746',surf1:'#3d3f52',border:'#44475a',text:'#f8f8f2',muted:'#6272a4',link:'#8be9fd',linkH:'#bd93f9',inBg:'#1e1f29',codeBg:'#1e1f29',shadow:'rgba(0,0,0,0.6)' },
    nord:      { bg:'#2e3440',bg1:'#3b4252',bg2:'#434c5e',surf:'#3b4252',surf1:'#434c5e',border:'#4c566a',text:'#eceff4',muted:'#d8dee9',link:'#88c0d0',linkH:'#81a1c1',inBg:'#2e3440',codeBg:'#3b4252',shadow:'rgba(0,0,0,0.5)' },
    solarized: { bg:'#002b36',bg1:'#073642',bg2:'#094959',surf:'#073642',surf1:'#094959',border:'#0a5566',text:'#839496',muted:'#657b83',link:'#268bd2',linkH:'#2aa198',inBg:'#002b36',codeBg:'#073642',shadow:'rgba(0,0,0,0.5)' },
    mocha:     { bg:'#1e1e2e',bg1:'#181825',bg2:'#11111b',surf:'#313244',surf1:'#45475a',border:'#585b70',text:'#cdd6f4',muted:'#a6adc8',link:'#89b4fa',linkH:'#cba6f7',inBg:'#181825',codeBg:'#181825',shadow:'rgba(0,0,0,0.6)' },
    rosepine:  { bg:'#191724',bg1:'#1f1d2e',bg2:'#26233a',surf:'#2a2837',surf1:'#403d52',border:'#524f67',text:'#e0def4',muted:'#908caa',link:'#c4a7e7',linkH:'#ebbcba',inBg:'#1f1d2e',codeBg:'#1f1d2e',shadow:'rgba(0,0,0,0.65)' },
    gruvbox:   { bg:'#282828',bg1:'#3c3836',bg2:'#504945',surf:'#3c3836',surf1:'#504945',border:'#665c54',text:'#ebdbb2',muted:'#bdae93',link:'#83a598',linkH:'#8ec07c',inBg:'#3c3836',codeBg:'#1d2021',shadow:'rgba(0,0,0,0.6)' },
  };
  const SW_COLORS = { apple:'#1c1c1e',default:'#0f1117',midnight:'#000000',dracula:'#282a36',nord:'#2e3440',solarized:'#002b36',mocha:'#1e1e2e',rosepine:'#191724',gruvbox:'#282828' };
  // custom palettes live in cfg.customPalettes and use the key format  "custom:Name"


  // Palette-specific PDF filter values: [invert, hue-rotate, sepia-tint]
  // These translate each palette's character into embed filter tints
  // since native PDF viewer UI can't be reached by CSS.
  const PDF_FILTERS = {
    apple:     [0.92, 180, 0.00],  // neutral pure dark, no tint
    default:   [0.90, 180, 0.00],  // neutral dark
    midnight:  [0.95, 180, 0.00],  // deeper black, no tint
    dracula:   [0.88, 195, 0.05],  // slight purple cast
    nord:      [0.88, 168, 0.04],  // cool arctic blue
    solarized: [0.86, 158, 0.06],  // teal-cyan tint
    mocha:     [0.88, 188, 0.06],  // warm lavender
    rosepine:  [0.87, 200, 0.05],  // rose-mauve
    gruvbox:   [0.87, 173, 0.09],  // warm amber
    custom:    [0.90, 180, 0.00],  // neutral fallback for custom
  };
  function getPDFFilter(paletteName, warmth, brightness, contrast){
    const pdfKey = paletteName.startsWith('custom:') ? 'custom' : paletteName;
    const [inv, hue, sep] = PDF_FILTERS[pdfKey] || PDF_FILTERS.default;
    const w = warmth / 100;
    const b = brightness / 100;
    const c = contrast / 100;
    const sepTotal = Math.min(0.45, sep + w * 0.35).toFixed(3);
    return `invert(${inv}) hue-rotate(${hue}deg) sepia(${sepTotal}) brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)})`;
  }

  function p2v(p){return `--udm-bg:${p.bg};--udm-bg-1:${p.bg1};--udm-bg-2:${p.bg2};--udm-surface:${p.surf};--udm-surface-1:${p.surf1};--udm-border:${p.border};--udm-text:${p.text};--udm-text-muted:${p.muted};--udm-link:${p.link};--udm-link-hover:${p.linkH};--udm-input-bg:${p.inBg};--udm-code-bg:${p.codeBg};--udm-shadow:${p.shadow||'rgba(0,0,0,0.7)'}`;}
  function getActivePalette(){
    const p=computePalette();
    if(p&&p.startsWith('custom:')){
      const name=p.slice(7);
      return (cfg.customPalettes&&cfg.customPalettes[name])||PALETTES.default;
    }
    return PALETTES[p]||PALETTES.default;
  }

  // ─── UTILITIES ──────────────────────────────────────────────────────────────

  function debounce(fn,ms){
    let t;
    const d=(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};
    d.cancel=()=>{clearTimeout(t);t=null;};
    return d;
  }
  function deepMerge(target,source){const out=Object.assign({},target);for(const k of Object.keys(source)){if(source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k]))out[k]=deepMerge(target[k]||{},source[k]);else out[k]=source[k];}return out;}

  // ─── STATE ───────────────────────────────────────────────────────────────────

  function loadCfg(){
    try{
      const saved=JSON.parse(GM_getValue('udm_v6',GM_getValue('udm_v5','null')));
      const merged=saved?deepMerge(DEFAULT_CFG,saved):Object.assign({},DEFAULT_CFG);
      // Migrate legacy single customPalette → customPalettes map
      if(saved&&saved.customPalette&&!saved.customPalettes){
        merged.customPalettes={'Custom':saved.customPalette};
        if(merged.palette==='custom')merged.palette='custom:Custom';
        for(const h of Object.keys(merged.sites||{})){
          if(merged.sites[h].palette==='custom')merged.sites[h].palette='custom:Custom';
        }
      }
      if(!merged.customPalettes)merged.customPalettes={};
      return merged;
    }catch{return Object.assign({},DEFAULT_CFG);}
  }
  function saveCfg(){GM_setValue('udm_v6',JSON.stringify(cfg));broadcastState();}
  let cfg=loadCfg();
  const HOST=location.hostname.replace(/^www\./,'');
  const sc=()=>cfg.sites[HOST]||{};

  // ─── PDF DETECTION (Edge built-in PDF reader) ─────────────────────────────────
  const IS_PDF = document.contentType === 'application/pdf' ||
                 /\.pdf(\?[^#]*)?$/i.test(location.href);

  // Only html/body background and the embed filter are reachable in the
  // Edge native PDF viewer — all toolbar/scrollbar selectors are no-ops.
  function buildPDFCSS(p, paletteName, warmth, brightness, contrast){
    const f = getPDFFilter(paletteName, warmth, brightness, contrast);
    return `
    html, body {
      background: ${p.bg} !important;
      margin: 0 !important; padding: 0 !important;
    }
    embed[type="application/pdf"],
    embed[name="plugin"],
    object[type="application/pdf"],
    embed:not([type]):not([src*=".htm"]):not([src*=".html"]) {
      filter: ${f} !important;
      display: block !important;
      width: 100vw !important;
      height: 100vh !important;
    }`;
  }

  // ─── CROSS-TAB SYNC ──────────────────────────────────────────────────────────

  let bc; try{bc=new BroadcastChannel('__udm__');}catch{}
  function broadcastState(){try{bc?.postMessage({type:'settings',cfg});}catch{}}
  if(bc) bc.onmessage=({data})=>{
    if(data?.type==='settings'&&data.cfg){
      cfg=Object.assign({},data.cfg);
      const on=computeEnabled(),is=document.documentElement.hasAttribute('data-udm');
      if(on&&!is)applyDarkMode(); if(!on&&is)removeDarkMode();
      updatePanel();
    }
  };

  // ─── COMPUTED STATE ───────────────────────────────────────────────────────────

  function t2m(t){const[h,m]=(t||'00:00').split(':').map(Number);return h*60+m;}
  function schedOn(){
    if(!cfg.schedule.active)return null;
    const cur=new Date().getHours()*60+new Date().getMinutes(),f=t2m(cfg.schedule.from),to=t2m(cfg.schedule.to);
    return f<=to?cur>=f&&cur<to:cur>=f||cur<to;
  }
  // Cached once at boot — siteHasNativeDark() walks all stylesheets and its
  // result changes over time as stylesheets load, so re-evaluating it on every
  // computeEnabled() call (e.g. during slider drags) caused it to return false
  // mid-session, silently blocking all slider apply functions.
  let _nativeDarkCache = null;
  function resolveNativeDark(){
    if(!cfg.autoDetect||!cfg.honourNative)return false;
    if(_nativeDarkCache===null)_nativeDarkCache=siteHasNativeDark();
    return _nativeDarkCache;
  }

  function computeEnabled(){
    const s=sc();
    if(typeof s.enabled==='boolean')return s.enabled;
    if(resolveNativeDark())return false;
    if(cfg.osSync){const mq=window.matchMedia('(prefers-color-scheme: dark)');return mq.matches;}
    const sh=schedOn();return sh!==null?sh:cfg.enabled;
  }
  function computeStrategy(){return sc().strategy||cfg.strategy;}
  function computeImgDim(){return sc().imgDim??DEFAULT_CFG.imgDim;}
  function computeRadius()  { return sc().radius  ?? DEFAULT_CFG.radius;  }
  function computeBgDim()   { return sc().bgDim   ?? DEFAULT_CFG.bgDim;   }
  function computeCustomCSS(){return sc().customCSS||'';}
  function computeExcluded(){return[...(sc().excluded||[]),...(SITE_PATCHES[HOST]?.excludeSelectors||[])];}

  // Adjustments fall back to factory-neutral values (DEFAULT_CFG), NOT cfg globals.
  // This means visiting a new site always starts with neutral adjustments.
  // Only strategy and palette inherit the global cfg value.
  function computeWarmth()    { return sc().warmth     ?? DEFAULT_CFG.warmth;     }
  function computeBrightness(){ return sc().brightness ?? DEFAULT_CFG.brightness; }
  function computeContrast()  { return sc().contrast   ?? DEFAULT_CFG.contrast;   }
  function computePalette()   { return sc().palette    || cfg.palette;    }

  // Write a key into the current site's override object.
  // If the value matches the global default exactly, remove it instead of
  // storing a redundant override (keeps cfg.sites lean and reset reliable).
  // ADJUSTMENT keys — fall back to DEFAULT_CFG neutrals, not cfg globals.
  // Strategy/palette/enabled/excluded are NOT in this set (they inherit from cfg).
  const ADJ_KEYS=new Set(['warmth','brightness','contrast','imgDim','bgDim','radius','customCSS']);

  function setSiteVal(key, value){
    const site = cfg.sites[HOST] || {};
    // No-op if the value equals the factory neutral AND the site has no override yet.
    // Compares against DEFAULT_CFG for adjustment keys, cfg for everything else.
    const baseline = ADJ_KEYS.has(key) ? DEFAULT_CFG[key] : cfg[key];
    if(value === baseline && site[key] === undefined) return;
    // For customCSS an empty string = neutral
    if(key === 'customCSS' && !value && site[key] === undefined) return;
    site[key] = value;
    cfg.sites[HOST] = site;
  }


  // Returns true if the page has a meaningful prefers-color-scheme:dark stylesheet
  // (i.e. the site ships its own dark mode). Used by honourNative.
  function siteHasNativeDark(){
    try{
      for(const sh of document.styleSheets){
        let rules; try{rules=sh.cssRules;}catch{continue;}
        if(!rules) continue;
        for(const r of rules){
          if(r.media && [...r.media].some(m=>m.includes('prefers-color-scheme')&&m.includes('dark'))){
            return true;
          }
        }
      }
    }catch{}
    return false;
  }

  function refreshRadius(){
    if(!isDarkActive())return;
    const radii=buildRadiusScale(computeRadius());
    injectStyle('__udm_vars__',`:root{${p2v(getActivePalette())};${radii.vars}}`);
    // For heuristic: inline styles were set directly, re-walk to update them
    if(computeStrategy()==='heuristic'&&document.body)applyHeuristic(document.body);
    // For selective: re-walk to apply new semantic radii inline
    if(computeStrategy()==='selective'&&document.body)applySelective();
  }

  // ─── CSS BUILDERS ────────────────────────────────────────────────────────────

  const BASE_CSS=`html,body{background-color:var(--udm-bg)!important;color:var(--udm-text)!important;-webkit-font-smoothing:antialiased!important;-moz-osx-font-smoothing:grayscale!important}
header,footer,main,article,section,aside,nav,div,span,li,ul,ol,fieldset,
.container,.wrapper,[class*="container" i],[class*="wrapper" i],[class*="card" i],
[class*="panel" i],[class*="modal" i],[class*="sidebar" i],[class*="navbar" i],
[class*="header" i]:not([class*="text" i]),[class*="footer" i],[class*="menu" i],[class*="widget" i]
{background-color:transparent;border-color:var(--udm-border)!important}
header,nav,footer,.navbar,.sidebar,.topbar,[role="banner"],[role="navigation"],[role="contentinfo"]
{background-color:var(--udm-bg-1)!important}
.card,.panel,[class*="card" i],[class*="panel" i],[class*="widget" i]
{background-color:var(--udm-surface)!important;border-radius:var(--udm-radius-card)!important}
input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
textarea,select,[contenteditable="true"]
{background-color:var(--udm-input-bg)!important;color:var(--udm-text)!important;border-color:var(--udm-border)!important;border-radius:var(--udm-radius-input)!important}
input::placeholder,textarea::placeholder{color:var(--udm-text-muted)!important}
button,[role="button"],[type="button"],[type="submit"],.btn,[class*="btn" i],[class*="button" i]
{background-color:var(--udm-surface-1)!important;color:var(--udm-text)!important;border-color:var(--udm-border)!important;border-radius:var(--udm-radius-btn)!important}
a{color:var(--udm-link)!important}a:hover{color:var(--udm-link-hover)!important}
table{border-collapse:collapse}
th,td{background-color:transparent!important;border-color:var(--udm-border)!important;color:var(--udm-text)!important}
tr:hover td{background-color:var(--udm-surface)!important}thead th{background-color:var(--udm-surface-1)!important}
code,kbd,samp{background-color:var(--udm-code-bg)!important;color:#e2c08d!important;border-color:var(--udm-border)!important;border-radius:var(--udm-radius-code)!important}
pre{background-color:var(--udm-code-bg)!important;color:#e2c08d!important;border-color:var(--udm-border)!important;border-radius:var(--udm-radius-sm)!important}
[class*="badge" i],[class*="chip" i],[class*="tag" i],[class*="label" i]:not(label)
{border-radius:var(--udm-radius-badge)!important}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:var(--udm-bg)}
::-webkit-scrollbar-thumb{background:var(--udm-border);border-radius:4px;transition:background .15s}
::-webkit-scrollbar-thumb:hover{background:var(--udm-text-muted)}
::selection{background-color:#264f78!important;color:var(--udm-text)!important}
:focus-visible{outline:2px solid var(--udm-link)!important;outline-offset:2px!important}
h1,h2,h3,h4,h5,h6{text-shadow:none!important}
.shadow,[class*='shadow' i]{box-shadow:0 4px 16px var(--udm-shadow)!important}
[role="dialog"],[role="alertdialog"],[popover],[class*="modal" i],[class*="overlay" i],[class*="popup" i],[class*="tooltip" i],[class*="popover" i],[class*="dropdown" i],[class*="dialog" i]
{background-color:var(--udm-surface)!important;color:var(--udm-text)!important;border-color:var(--udm-border)!important;border-radius:var(--udm-radius-modal)!important}
hr,[class*="divider" i]{border-color:var(--udm-border)!important;background-color:var(--udm-border)!important}
[style*="background-color: white"],[style*="background-color:#fff"],[style*="background-color: #fff"],
[style*="background-color:#ffffff"],[style*="background: white"],[style*="background:#fff"]
{background-color:var(--udm-bg-1)!important;color:var(--udm-text)!important;border-radius:var(--udm-radius-input)!important}
[style*="color: black"],[style*="color:#000"],[style*="color: #000"],
[style*="color:#333"],[style*="color: #333"]{color:var(--udm-text)!important}`;

  const INVERT_CSS=`html{filter:invert(1) hue-rotate(180deg)!important;background:#fff!important}img,video,canvas,picture,iframe,svg image,[class*="logo"],[style*="background-image"]{filter:invert(1) hue-rotate(180deg)!important}`;

  function warmthCSS(w,b,c){return `html{filter:brightness(${b/100}) contrast(${c/100})!important}#__udm_warm__{position:fixed;inset:0;pointer-events:none;z-index:2147483640;background:rgba(255,180,80,${((w/100)*0.18).toFixed(3)});mix-blend-mode:multiply}`;}
  function imgDimCSS(pct){if(!pct)return '';return `img:not([data-udm-nodim]),video:not([data-udm-nodim]){filter:brightness(${1-pct/100*0.4})!important;transition:filter .2s}img:not([data-udm-nodim]):hover{filter:brightness(1)!important}`;}
  function bgDimCSS(pct){if(!pct)return '';return `[style*="background-image"]:not([data-udm-nodim]),[class*="hero"]:not([data-udm-nodim]),[class*="banner"]:not([data-udm-nodim]){filter:brightness(${1-pct/100*0.6})!important;transition:filter .25s}[style*="background-image"]:not([data-udm-nodim]):hover{filter:brightness(1)!important}`;}
  function transitionCSS(ms){return `*,*::before,*::after{transition:background-color ${ms}ms ease,color ${ms}ms ease,border-color ${ms}ms ease,box-shadow ${ms}ms ease!important}`;}

  function exclCSS(sels){if(!sels.length)return '';return `${sels.join(',')}{filter:none!important;background-color:revert!important;color:revert!important;border-color:revert!important}`;}

  // ─── STYLE HELPERS ───────────────────────────────────────────────────────────
  // All dark-mode <style> nodes are injected via GM_addStyle so they live in
  // the extension's privileged context and bypass the page's style-src-elem CSP.
  // We keep a map of id → element so we can update or clear them later.
  // "Removing" a style means emptying its textContent — the element stays in the
  // extension container but contributes no rules, which is equivalent.
  const _styleMap = new Map(); // id → GM_addStyle element

  function injectStyle(id, css) {
    const existing = _styleMap.get(id);
    if (existing) {
      existing.textContent = css;
    } else {
      const el = GM_addStyle(css);
      if (el) {
        el.setAttribute('data-udm', '1');
        el.id = id;
        _styleMap.set(id, el);
      } else {
        // Fallback for userscript managers that don't return the element
        let t = document.getElementById(id);
        if (!t) { t = document.createElement('style'); t.id = id; t.setAttribute('data-udm','1'); }
        t.textContent = css;
        (document.head||document.documentElement).appendChild(t);
        _styleMap.set(id, t);
      }
    }
  }

  function removeStyle(id) {
    const el = _styleMap.get(id);
    if (el) {
      el.textContent = ''; // empty = no rules; can't safely remove GM_addStyle elements
    } else {
      document.getElementById(id)?.remove(); // legacy cleanup
    }
  }

  function ensureWarmLayer(){if(!document.getElementById('__udm_warm__')){const d=document.createElement('div');d.id='__udm_warm__';document.body?.appendChild(d);}}

  function isNeutralAdj(w,b,c){return w===0&&b===100&&c===100;}

  function applyWarmth(){
    const w=computeWarmth(),b=computeBrightness(),c=computeContrast();
    if(isNeutralAdj(w,b,c)){
      removeStyle('__udm_warmth__');
      document.getElementById('__udm_warm__')?.remove();
    } else {
      injectStyle('__udm_warmth__',warmthCSS(w,b,c));
      if(document.body)ensureWarmLayer();
    }
  }

  // reassertStyles: GM_addStyle injects into the page <head> but the browser
  // treats those elements as extension-privileged and they always win the cascade.
  // Calling appendChild() on them to "reposition" them triggers style-src-elem CSP.
  // Solution: do nothing — GM_addStyle styles always have highest priority.
  function reassertStyles(){ /* no-op: GM_addStyle styles already win the cascade */ }

  // startStyleGuardian watched <head> for site stylesheets added after ours and
  // called reassertStyles() to reposition. With GM_addStyle that's unnecessary
  // (and reassertStyles is now a no-op anyway), so the guardian does nothing.
  let _guardObs=null;
  function startStyleGuardian(){ /* no-op: not needed with GM_addStyle injection */ }
  function stopStyleGuardian(){_guardObs?.disconnect();_guardObs=null;}

  function metaCS(dark){let m=document.querySelector('meta[name="color-scheme"]');if(!m){m=document.createElement('meta');m.name='color-scheme';(document.head||document.documentElement).appendChild(m);}m.content=dark?'dark':'light dark';}

  // ─── HEURISTIC / OVERRIDE ────────────────────────────────────────────────────

  const MEDIA='img,video,canvas,picture,iframe,svg image,[style*="background-image"],.no-dark,[data-udm-nodim]';
  function luminance(el){try{const m=window.getComputedStyle(el).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?0.299*+m[1]+0.587*+m[2]+0.114*+m[3]:null;}catch{return null;}}

  function applyHeuristic(root){
    const radii=buildRadiusScale(computeRadius());
    const w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_ELEMENT);let n;
    while((n=w.nextNode())){
      if(n.matches?.(MEDIA))continue;
      const lum=luminance(n);
      if(lum!==null&&lum>185){
        n.style.setProperty('background-color','var(--udm-bg-1)','important');
        n.style.setProperty('border-radius', selectiveRadius(n, radii), 'important');
      }
      else if(lum!==null&&lum<30)continue;
      const cs=window.getComputedStyle(n);
      const fm=cs.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if(fm&&0.299*+fm[1]+0.587*+fm[2]+0.114*+fm[3]>185)n.style.setProperty('color','var(--udm-text)','important');
    }
  }
  function applyOverride(){
    const lines=[];
    try{for(const sh of document.styleSheets){let r;try{r=sh.cssRules;}catch{continue;}if(!r)continue;const lum=c=>{const m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?0.299*+m[1]+0.587*+m[2]+0.114*+m[3]:-1;};for(const rule of r){if(!(rule instanceof CSSStyleRule))continue;const sel=rule.selectorText||'';if(lum(rule.style.backgroundColor||'')>185){// Choose radius tier based on selector characteristics
const radVar=(/input|textarea|select|button|\.btn/i.test(sel))?'var(--udm-radius-btn)':(/modal|dialog|overlay|popup|tooltip|popover|dropdown/i.test(sel))?'var(--udm-radius-modal)':(/badge|chip|tag/i.test(sel))?'var(--udm-radius-badge)':'var(--udm-radius-card)';lines.push(`${sel}{background-color:var(--udm-bg-1)!important;border-radius:${radVar}!important}`);}if(lum(rule.style.color||'')>185)lines.push(`${sel}{color:var(--udm-text)!important}`);}}}catch{}
    injectStyle('__udm_override__',lines.join('\n'));
  }

  let obs=null;
  const _debouncedHeuristic=debounce(nodes=>{for(const n of nodes)applyHeuristic(n);},120);
  function startObs(){if(obs)return;obs=new MutationObserver(mutations=>{if(computeStrategy()!=='heuristic')return;const added=[];for(const m of mutations)for(const n of m.addedNodes)if(n.nodeType===1)added.push(n);if(added.length)_debouncedHeuristic(added);});obs.observe(document.body||document.documentElement,{childList:true,subtree:true});}
  function stopObs(){obs?.disconnect();obs=null;}

  // ─── LAYER STRATEGY ──────────────────────────────────────────────────────────
  // Injects dark-mode rules into a named CSS @layer so they win the cascade
  // without resorting to !important everywhere. Site rules that ship their own
  // layer declarations still win if they declare above "udm-dark".
  function applyLayer(){
    const p=getActivePalette();
    const r=computeRadius();
    const radii=buildRadiusScale(r);
    injectStyle('__udm_layer__',`
@layer udm-dark {
  :root {
    color-scheme: dark;
    ${p2v(p)};
    ${radii.vars}
  }
  html, body { background-color: ${p.bg}; color: ${p.text}; }
  header, nav, footer, .navbar, .sidebar, .topbar,
  [role="banner"], [role="navigation"], [role="contentinfo"] {
    background-color: ${p.bg1};
  }
  .card, .panel, [class*="card" i], [class*="panel" i], [class*="widget" i],
  [role="dialog"], [role="alertdialog"], [popover], [class*="modal" i], [class*="popup" i],
  [class*="tooltip" i], [class*="popover" i], [class*="dropdown" i], [class*="dialog" i] {
    background-color: ${p.surf}; color: ${p.text};
    border-color: ${p.border}; border-radius: var(--udm-radius-card);
  }
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
  textarea, select, [contenteditable="true"] {
    background-color: ${p.inBg}; color: ${p.text};
    border-color: ${p.border}; border-radius: var(--udm-radius-input);
  }
  button, [role="button"], [type="button"], [type="submit"],
  .btn, [class*="btn" i], [class*="button" i] {
    background-color: ${p.surf1}; color: ${p.text};
    border-color: ${p.border}; border-radius: var(--udm-radius-btn);
  }
  code, kbd, samp, pre {
    background-color: ${p.codeBg}; border-color: ${p.border};
    border-radius: var(--udm-radius-code);
  }
  a { color: ${p.link}; } a:hover { color: ${p.linkH}; }
  th, td { color: ${p.text}; border-color: ${p.border}; }
  thead th { background-color: ${p.surf1}; }
  tr:hover td { background-color: ${p.surf}; }
}`);
  }

  // ─── SELECTIVE STRATEGY ───────────────────────────────────────────────────────
  // Scans computed styles at run-time and patches only elements whose background
  // is light, leaving already-dark elements untouched. Unlike heuristic it does
  // NOT re-walk on every mutation — it runs once (+ re-run at window.load) and
  // leaves structural tweaks to CSS variables.
  function applySelective(){
    const p=getActivePalette();
    const r=computeRadius();
    const radii=buildRadiusScale(r);
    // First: lay down variable foundation so custom CSS can still use them
    injectStyle('__udm_vars__',`:root{${p2v(p)};${radii.vars}}`);
    injectStyle('__udm_selective_base__',`
html, body { background-color: var(--udm-bg) !important; color: var(--udm-text) !important; }
a { color: var(--udm-link) !important; } a:hover { color: var(--udm-link-hover) !important; }
::-webkit-scrollbar { width:8px; height:8px }
::-webkit-scrollbar-track { background: var(--udm-bg) }
::-webkit-scrollbar-thumb { background: var(--udm-border); border-radius:4px }
::-webkit-scrollbar-thumb:hover { background: var(--udm-text-muted) }
`);
    // Walk DOM patching only light-bg elements
    const walk=(root)=>{
      const tw=document.createTreeWalker(root||document.body,NodeFilter.SHOW_ELEMENT);
      let n;
      while((n=tw.nextNode())){
        if(n.matches?.(MEDIA))continue;
        const cs=window.getComputedStyle(n);
        const bgMatch=cs.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if(bgMatch){
          const alpha=bgMatch[4]!==undefined?+bgMatch[4]:1;
          if(alpha<0.05)continue; // transparent — skip
          const lum=0.299*+bgMatch[1]+0.587*+bgMatch[2]+0.114*+bgMatch[3];
          if(lum>170){
            n.style.setProperty('background-color','var(--udm-bg-1)','important');
            n.style.setProperty('color','var(--udm-text)','important');
            // Apply semantic radius based on element role
            n.style.setProperty('border-radius', selectiveRadius(n, radii), 'important');
          }
        }
        const fgMatch=cs.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if(fgMatch&&0.299*+fgMatch[1]+0.587*+fgMatch[2]+0.114*+fgMatch[3]>185){
          n.style.setProperty('color','var(--udm-text)','important');
        }
      }
    };
    if(document.body)walk(document.body);
    else document.addEventListener('DOMContentLoaded',()=>walk(document.body),{once:true});
  }

  // ─── SEMANTIC RADIUS HELPERS ──────────────────────────────────────────────────
  // Builds a tiered radius scale from a single base value.
  // Instead of a flat "radius" and "radius-sm", we derive 5 meaningful tiers
  // that map onto actual UI roles so elements feel consistently rounded
  // without heavy-handed over-rounding on small controls or under-rounding
  // on large containers.
  //
  //  none  (0px)       — sharp: tables, code blocks that span full width
  //  xs    (≈ r×0.4)  — chips, badges, tags
  //  sm    (≈ r×0.65) — inputs, small buttons, inline code
  //  md    (= r)       — cards, panels, modals (the user-visible "Roundness")
  //  lg    (≈ r×1.4)  — tooltips, popovers, floating overlays
  //  pill  (9999px)    — toggle switches, avatar bubbles (never changes)
  //
  function buildRadiusScale(base){
    const r=Math.max(0,base);
    const xs  = r===0?0:Math.max(2,Math.round(r*0.40));
    const sm  = r===0?0:Math.max(3,Math.round(r*0.65));
    const md  = r;
    const lg  = r===0?0:Math.min(24,Math.round(r*1.40));
    const pill= 9999;
    return {
      xs,sm,md,lg,pill,
      vars: [
        `--udm-radius:${md}px`,
        `--udm-radius-xs:${xs}px`,
        `--udm-radius-sm:${sm}px`,
        `--udm-radius-md:${md}px`,
        `--udm-radius-lg:${lg}px`,
        `--udm-radius-card:${md}px`,
        `--udm-radius-input:${sm}px`,
        `--udm-radius-btn:${sm}px`,
        `--udm-radius-code:${xs}px`,
        `--udm-radius-modal:${lg}px`,
        `--udm-radius-badge:${xs}px`,
        `--udm-radius-pill:${pill}px`,
      ].join(';'),
    };
  }

  // Returns the right CSS border-radius value for an element in selective mode
  // by inspecting tag, role, and class heuristics.
  function selectiveRadius(el, radii){
    const tag=el.tagName.toLowerCase();
    const role=(el.getAttribute('role')||'').toLowerCase();
    const cls=(el.className&&typeof el.className==='string')?el.className.toLowerCase():'';
    if(tag==='input'||tag==='textarea'||tag==='select'||tag==='button'||
       role==='button'||cls.includes('btn'))   return `${radii.sm}px`;
    if(role==='dialog'||role==='alertdialog'||
       cls.includes('modal')||cls.includes('overlay')||
       cls.includes('tooltip')||cls.includes('popover')||
       cls.includes('dropdown'))               return `${radii.lg}px`;
    if(cls.includes('badge')||cls.includes('chip')||cls.includes('tag'))
                                               return `${radii.xs}px`;
    if(tag==='code'||tag==='kbd'||tag==='samp')return `${radii.xs}px`;
    return `${radii.md}px`;
  }

  // ─── APPLY / REMOVE ──────────────────────────────────────────────────────────

  function applyPDFDarkMode(){
    const _p=getActivePalette();
    injectStyle('__udm_pdf__', buildPDFCSS(_p,computePalette(),computeWarmth(),computeBrightness(),computeContrast()));
    document.documentElement.setAttribute('data-udm','pdf');
    // Re-apply whenever Edge lazily renders the embed (it may appear after load)
    let _pdfObs=null;
    const ensureEmbed=()=>{
      const embed=document.querySelector('embed,object[type="application/pdf"]');
      if(embed){
        embed.style.setProperty('filter',getPDFFilter(computePalette(),computeWarmth(),computeBrightness(),computeContrast()),'important');
        _pdfObs?.disconnect(); _pdfObs=null; // found it — stop watching
      }
    };
    ensureEmbed();
    if(!document.querySelector('embed,object[type="application/pdf"]')){
      _pdfObs=new MutationObserver(ensureEmbed);
      _pdfObs.observe(document.documentElement,{childList:true,subtree:true});
    }
  }

  let _transT=null;
  function applyWithTransition(fn){
    const ms=cfg.transition??150;
    if(ms>0){
      injectStyle('__udm_transition__',transitionCSS(ms));
      clearTimeout(_transT);
      _transT=setTimeout(()=>removeStyle('__udm_transition__'),ms+100);
    }
    fn();
  }

  function applyDarkMode(){
    if(IS_PDF){applyPDFDarkMode();return;}
    const strat=computeStrategy(),patch=SITE_PATCHES[HOST],excl=computeExcluded();
    const radii=buildRadiusScale(computeRadius());
    metaCS(true);
    // Remove all strategy-specific sheets before deciding which to apply
    ['__udm_invert__','__udm_layer__','__udm_selective_base__'].forEach(removeStyle);
    if(strat==='invert'||patch?.strategy==='invert'){
      ['__udm_vars__','__udm_override__','__udm_base__'].forEach(removeStyle);
      injectStyle('__udm_invert__',INVERT_CSS);
    } else if(strat==='layer'){
      ['__udm_vars__','__udm_base__','__udm_override__'].forEach(removeStyle);
      applyLayer();
    } else if(strat==='selective'){
      removeStyle('__udm_override__');
      injectStyle('__udm_vars__',`:root{${p2v(getActivePalette())};${radii.vars}}`);
      applySelective();
    } else {
      removeStyle('__udm_invert__');
      injectStyle('__udm_vars__',`:root{${p2v(getActivePalette())};${radii.vars}}`);
      injectStyle('__udm_base__',BASE_CSS);
      if(strat==='override'){if(document.readyState==='complete')applyOverride();else window.addEventListener('load',applyOverride,{once:true});}
      else removeStyle('__udm_override__');
      if(strat==='heuristic'){if(document.body)applyHeuristic(document.body);else document.addEventListener('DOMContentLoaded',()=>applyHeuristic(document.body),{once:true});}
    }
    if(patch?.css)injectStyle('__udm_patch__',patch.css);else removeStyle('__udm_patch__');
    const custom=computeCustomCSS();if(custom)injectStyle('__udm_custom__',custom);else removeStyle('__udm_custom__');
    if(excl.length)injectStyle('__udm_excl__',exclCSS(excl));else removeStyle('__udm_excl__');
    const dim=computeImgDim();if(dim>0)injectStyle('__udm_dim__',imgDimCSS(dim));else removeStyle('__udm_dim__');
    const bdim=computeBgDim();if(bdim>0)injectStyle('__udm_bgdim__',bgDimCSS(bdim));else removeStyle('__udm_bgdim__');
    applyWarmth();
    if(!isNeutralAdj(computeWarmth(),computeBrightness(),computeContrast())){
      if(document.body)ensureWarmLayer();else document.addEventListener('DOMContentLoaded',ensureWarmLayer,{once:true});
    }
    startObs();startStyleGuardian();document.documentElement.setAttribute('data-udm',strat);
  }
  function removeDarkMode(){stopStyleGuardian();metaCS(false);['__udm_vars__','__udm_base__','__udm_override__','__udm_invert__','__udm_layer__','__udm_selective_base__','__udm_patch__','__udm_custom__','__udm_excl__','__udm_dim__','__udm_bgdim__','__udm_warmth__','__udm_pdf__','__udm_transition__'].forEach(removeStyle);document.getElementById('__udm_warm__')?.remove();stopObs();document.documentElement.removeAttribute('data-udm');}

  // ─── IFRAME PATCHING ─────────────────────────────────────────────────────────

  function patchIframes(){document.querySelectorAll('iframe').forEach(f=>{try{const doc=f.contentDocument;if(!doc)return;const p=getActivePalette();const s=doc.createElement('style');s.textContent=`:root{${p2v(p)}}body{background:${p.bg}!important;color:${p.text}!important}`;(doc.head||doc.documentElement)?.appendChild(s);}catch{}});}

  // ─── ELEMENT PICKER ──────────────────────────────────────────────────────────

  let pickerActive=false,pickerTarget=null;
  function generateSelector(el){
    if(!el||el===document.body)return null;
    // 1. Unique ID
    if(el.id&&/^[a-zA-Z][\w-]*$/.test(el.id))return`#${el.id}`;
    // 2. data-testid
    const tid=el.getAttribute('data-testid');if(tid)return`[data-testid="${tid}"]`;
    // 3. Unique class combo (up to 3 classes, must match exactly 1 element)
    const cls=[...el.classList].filter(c=>/^[a-zA-Z][\w-]*$/.test(c)&&!c.startsWith('__udm')).slice(0,3);
    if(cls.length){
      // Try progressively more classes until unique
      for(let n=1;n<=cls.length;n++){
        const sel=`.${cls.slice(0,n).join('.')}`;
        if(document.querySelectorAll(sel).length===1)return sel;
      }
      // Class + tag if still not unique
      const tagCls=`${el.tagName.toLowerCase()}.${cls[0]}`;
      if(document.querySelectorAll(tagCls).length<=3)return tagCls;
    }
    // 4. nth-child path (never bare tag — would match every div/span etc.)
    const path=[];let node=el;
    while(node&&node!==document.body){
      const parent=node.parentElement;
      if(!parent)break;
      const idx=[...parent.children].indexOf(node)+1;
      path.unshift(`${node.tagName.toLowerCase()}:nth-child(${idx})`);
      // Stop once we have a unique enough prefix
      const sel=path.join('>');
      if(document.querySelectorAll(sel).length===1)return sel;
      node=parent;
    }
    return path.length?path.join('>'):`${el.tagName.toLowerCase()}:nth-child(1)`;
  }

  function startPicker(){
    if(pickerActive)return; pickerActive=true;
    GM_addStyle(`#__udm_ov__{position:fixed;inset:0;z-index:2147483638;cursor:crosshair;pointer-events:all}.__udm_hi__{outline:2px dashed #58a6ff!important;outline-offset:2px!important}`);
    showToast('🎯 Click element to exclude — Esc to cancel');
    const ov=document.createElement('div');ov.id='__udm_ov__';document.body.appendChild(ov);
    // Lazy tooltip element to show selector preview
    const tip=document.createElement('div');
    tip.className='__udm_picker_tip__';
    document.body.appendChild(tip);
    const hi=e=>{
      document.querySelectorAll('.__udm_hi__').forEach(n=>n.classList.remove('__udm_hi__'));
      // Temporarily hide overlay so elementFromPoint hits the real element below
      ov.style.pointerEvents='none';
      const target=document.elementFromPoint(e.clientX,e.clientY);
      ov.style.pointerEvents='all';
      pickerTarget=(target&&target!==ov)?target:null;
      if(pickerTarget){
        pickerTarget.classList.add('__udm_hi__');
        const sel=generateSelector(pickerTarget);
        tip.textContent=sel||pickerTarget.tagName.toLowerCase();
        tip.style.left=Math.min(e.clientX+12,window.innerWidth-320)+'px';
        tip.style.top=Math.max(e.clientY-32,4)+'px';
        tip.style.display='block';
      } else {
        tip.style.display='none';
      }
    };
    const pick=e=>{
      e.preventDefault();e.stopPropagation();
      ov.style.pointerEvents='none';
      const clickTarget=document.elementFromPoint(e.clientX,e.clientY);
      ov.style.pointerEvents='all';
      const target=(clickTarget&&clickTarget!==ov)?clickTarget:pickerTarget;
      if(!target)return;
      target.classList.remove('__udm_hi__');
      const sel=generateSelector(target);
      stopPicker();
      if(sel){
        const site=cfg.sites[HOST]||{};
        site.excluded=site.excluded||[];
        if(!site.excluded.includes(sel))site.excluded.push(sel);
        cfg.sites[HOST]=site;
        saveCfg();
        injectStyle('__udm_excl__',exclCSS(computeExcluded()));
        showToast(`Excluded: ${sel}`,'ok');
      }
    };
    const esc=e=>{if(e.key==='Escape')stopPicker();};
    ov.addEventListener('mousemove',hi);ov.addEventListener('click',pick,{once:true});document.addEventListener('keydown',esc,{once:true});
    ov._cleanup=()=>{ov.removeEventListener('mousemove',hi);document.removeEventListener('keydown',esc);};
  }
  function stopPicker(){pickerActive=false;const ov=document.getElementById('__udm_ov__');ov?._cleanup?.();ov?.remove();document.querySelectorAll('.__udm_hi__').forEach(n=>n.classList.remove('__udm_hi__'));document.querySelectorAll('[style*="2147483647"]').forEach(t=>t.remove());pickerTarget=null;}

  // ─── ACTIONS ─────────────────────────────────────────────────────────────────

  function handleToggle(){
    setSiteVal('enabled',!computeEnabled());
    cfg._toggles=(cfg._toggles||0)+1;
    saveCfg();
    applyWithTransition(()=>{if(computeEnabled())applyDarkMode();else removeDarkMode();});
    showToast(computeEnabled()?'🌑 Dark On':'☀️ Dark Off');
    updatePanel();
  }
  // Per-site: panel, keyboard, GM menu all write to the current site
  function handleSetStrategy(str){setSiteVal('strategy',str);saveCfg();if(computeEnabled()){applyWithTransition(()=>{removeDarkMode();applyDarkMode();});}showToast(`Strategy: ${str}`);updatePanel();}

  // handleSetPalette — "last used palette becomes the global default"
  // Rules:
  //   1. Always update cfg.palette (global default) so future unvisited sites
  //      inherit this palette automatically.
  //   2. If the current site has a manually-pinned palette (manualPalette:true),
  //      also update its per-site palette so the pin stays in sync with the choice.
  //   3. If the current site has NO pin, remove any stale per-site palette override
  //      so it falls through to the now-updated cfg.palette cleanly.
  //   4. Setting a palette on a site that had no pin counts as pinning it —
  //      mark manualPalette:true so future global changes won't overwrite it.
  function handleSetPalette(p){
    const site=cfg.sites[HOST]||{};
    const wasPinned=!!site.manualPalette;

    // Update global default — all future unvisited sites will use this palette
    cfg.palette=p;

    if(wasPinned){
      // Site was already pinned: keep the pin and update its palette to the new choice
      site.palette=p;
      cfg.sites[HOST]=site;
    } else {
      // No prior pin: mark this site as manually pinned now, store the palette
      site.palette=p;
      site.manualPalette=true;
      cfg.sites[HOST]=site;
    }

    saveCfg();
    if(computeEnabled()){applyWithTransition(()=>{removeDarkMode();applyDarkMode();});}
    showToast(`Palette: ${p}`);
    updatePanel();
  }

  // Unpin the current site's palette so it follows the global default again
  function unpinSitePalette(){
    const site=cfg.sites[HOST];
    if(!site)return;
    delete site.palette;
    delete site.manualPalette;
    if(!Object.keys(site).length)delete cfg.sites[HOST];
    saveCfg();
    if(computeEnabled()){applyWithTransition(()=>{removeDarkMode();applyDarkMode();});}
    showToast('Palette unpinned — following global default');
    updatePanel();
    buildPanel();
  }
  const _adjSave=debounce(()=>saveCfg(),300);
  function isDarkActive(){return document.documentElement.hasAttribute('data-udm');}

  function handleAdj(k,v){
    setSiteVal(k,v);
    _adjSave();
    if(isDarkActive()){
      if(['warmth','brightness','contrast'].includes(k))applyWarmth();
      if(k==='imgDim')injectStyle('__udm_dim__',imgDimCSS(v));
      if(k==='bgDim'){if(v>0)injectStyle('__udm_bgdim__',bgDimCSS(v));else removeStyle('__udm_bgdim__');}
      if(IS_PDF){const _p=getActivePalette();injectStyle('__udm_pdf__',buildPDFCSS(_p,computePalette(),computeWarmth(),computeBrightness(),computeContrast()));}
    }
  }
  function cycleStrategy(){
    const l=['variables','override','heuristic','layer','selective','invert'];
    const cur=computeStrategy();
    const next=l[(l.indexOf(cur)+1)%l.length];
    setSiteVal('strategy',next);
    saveCfg();
    if(computeEnabled()){removeDarkMode();applyDarkMode();}
    showToast(`Strategy: ${next}`);
    updatePanel();
  }
  // Remove all per-site overrides for the current host.
  // Keeps exclusions if any, deletes the site entry entirely if none.
  function resetSite(){
    // Cancel any in-flight debounced save so it can't overwrite us
    _adjSave.cancel();
    const excl=(cfg.sites[HOST]||{}).excluded||[];
    if(excl.length){
      // Keep excluded list but wipe every other per-site key
      cfg.sites[HOST]={excluded:excl};
    } else {
      // No exclusions — remove site entirely so loadCfg starts clean
      delete cfg.sites[HOST];
    }
    // Persist immediately (not debounced)
    saveCfg();
    if(computeEnabled()){removeDarkMode();applyDarkMode();}
    buildPanel();
    showToast('Site reset to global defaults','ok');
  }
  function exportSettings(){GM_setClipboard(JSON.stringify(cfg,null,2));showToast('Settings copied to clipboard');}
  function importSettings(json){try{Object.assign(cfg,JSON.parse(json));saveCfg();injectSwatchStyles();if(computeEnabled()){removeDarkMode();applyDarkMode();}else removeDarkMode();showToast('Settings imported','ok');buildPanel();if(dashEl)openDashboard();}catch{showToast('Import failed — invalid JSON');}}

  // ─── TOAST ───────────────────────────────────────────────────────────────────

  GM_addStyle(`
#__udm_t__{
  all:initial;position:fixed;bottom:32px;left:50%;
  transform:translateX(-50%) translateY(12px) scale(0.94);
  z-index:2147483647;
  background:rgba(44,44,46,0.92);
  backdrop-filter:blur(32px) saturate(200%) brightness(1.1);
  -webkit-backdrop-filter:blur(32px) saturate(200%) brightness(1.1);
  color:rgba(255,255,255,0.92);
  border:0.5px solid rgba(255,255,255,0.14);
  border-radius:14px;
  padding:10px 18px;
  font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,system-ui,sans-serif;
  font-size:13px;
  font-weight:500;
  letter-spacing:-0.01em;
  box-shadow:0 8px 32px rgba(0,0,0,0.45),0 2px 8px rgba(0,0,0,0.3),inset 0 0.5px 0 rgba(255,255,255,0.12);
  opacity:0;
  transition:opacity .22s cubic-bezier(0.4,0,0.2,1),transform .22s cubic-bezier(0.34,1.56,0.64,1);
  pointer-events:none;white-space:nowrap;
}
#__udm_t__.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
#__udm_t__[data-type=ok]{border-color:rgba(48,209,88,0.4);box-shadow:0 8px 32px rgba(0,0,0,0.45),0 0 0 1px rgba(48,209,88,0.15) inset}
#__udm_t__[data-type=warn]{border-color:rgba(255,159,10,0.4)}
#__udm_t__[data-type=err]{border-color:rgba(255,69,58,0.4)}
`);

  // ─── SWATCH STYLE INJECTION ──────────────────────────────────────────────────
  // Uses GM_addStyle for the initial injection (bypasses page CSP entirely).
  // Subsequent updates mutate the returned element's textContent directly —
  // the element is already in the extension's privileged style context so
  // mutating it is also CSP-safe.
  let _swatchStyleEl = null;
  function buildSwatchCSS() {
    const rules = [];
    Object.entries(SW_COLORS).forEach(([name, color]) => {
      rules.push(`#__udm_p__ .udm-sw-${name},#__udm_dash__ .udm-sw-${name}{background:${color}}`);
    });
    Object.entries(cfg.customPalettes || {}).forEach(([name, pal]) => {
      const cls = 'udm-sw-custom-' + name.replace(/[^a-zA-Z0-9_-]/g, '_');
      rules.push(`#__udm_p__ .${cls},#__udm_dash__ .${cls}{background:${pal.bg || '#333'}}`);
    });
    return rules.join('\n');
  }
  function injectSwatchStyles() {
    const css = buildSwatchCSS();
    if (_swatchStyleEl) {
      // Update the already-injected GM_addStyle element — no new DOM write needed
      _swatchStyleEl.textContent = css;
    } else {
      // First call: GM_addStyle injects via the extension context, bypassing CSP
      _swatchStyleEl = GM_addStyle(css);
    }
  }
  let toastEl=null,toastT=null;
  function showToast(msg,type='info'){if(!toastEl){toastEl=document.createElement('div');toastEl.id='__udm_t__';document.body?.appendChild(toastEl);}toastEl.textContent=msg;toastEl.dataset.type=type;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl?.classList.remove('show'),2400);}

  // ─── COMPACT FLOATING PANEL ──────────────────────────────────────────────────

  GM_addStyle(`
/* ── Apple-style Floating Panel ─────────────────────────────────────── */
#__udm_p__{
  all:initial;position:fixed;bottom:28px;right:24px;z-index:2147483646;
  font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,system-ui,sans-serif;
  font-size:13px;color:rgba(255,255,255,0.92);
  background:rgba(28,28,30,0.88);
  backdrop-filter:blur(48px) saturate(200%) brightness(1.08);
  -webkit-backdrop-filter:blur(48px) saturate(200%) brightness(1.08);
  border:0.5px solid rgba(255,255,255,0.13);
  border-radius:20px;padding:0;width:256px;
  box-shadow:0 24px 64px rgba(0,0,0,0.60),0 4px 16px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.1);
  opacity:0;transform:translateY(14px) scale(0.95);
  transition:opacity .24s cubic-bezier(0.4,0,0.2,1),transform .24s cubic-bezier(0.34,1.4,0.64,1);
  pointer-events:none;overflow:hidden;
}
#__udm_p__.show{opacity:1;transform:none;pointer-events:all}
#__udm_p__ *{box-sizing:border-box;margin:0;padding:0}

/* Header */
#__udm_p__ .t{
  font-size:13px;font-weight:600;color:#fff;
  display:flex;align-items:center;gap:8px;
  padding:14px 16px 0;letter-spacing:-0.02em;
}
#__udm_p__ .udm-host-tag{
  font-size:10.5px;font-weight:400;
  color:rgba(235,235,245,0.4);margin-left:auto;
  letter-spacing:0;
}
#__udm_p__ .xb{
  position:absolute;top:10px;right:10px;background:rgba(120,120,128,0.2);
  border:none;color:rgba(235,235,245,0.55);cursor:pointer;
  font-size:11px;font-weight:600;width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  transition:background .15s,color .15s;line-height:1;
}
#__udm_p__ .xb:hover{background:rgba(120,120,128,0.36);color:rgba(255,255,255,0.85)}

/* Divider */
#__udm_p__ .d{height:0.5px;background:rgba(84,84,88,0.55);margin:0 16px}

/* Row layout */
#__udm_p__ .r{display:flex;align-items:center;justify-content:space-between;padding:10px 16px}
#__udm_p__ .l{
  color:rgba(235,235,245,0.55);font-size:11px;font-weight:500;
  text-transform:uppercase;letter-spacing:0.06em;
  padding:10px 16px 4px;
}

/* Apple-style toggle */
#__udm_p__ .tg{
  width:44px;height:26px;border-radius:13px;position:relative;
  cursor:pointer;border:none;outline:none;
  transition:background .2s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;
}
#__udm_p__ .tg.off{background:rgba(120,120,128,0.32)}
#__udm_p__ .tg.on{background:#30D158}
#__udm_p__ .tg::after{
  content:'';position:absolute;
  width:22px;height:22px;background:#fff;border-radius:50%;
  top:2px;left:2px;
  transition:transform .2s cubic-bezier(0.34,1.4,0.64,1);
  box-shadow:0 2px 6px rgba(0,0,0,0.35),0 1px 2px rgba(0,0,0,0.2);
}
#__udm_p__ .tg.on::after{transform:translateX(18px)}

/* Segmented control for strategy */
#__udm_p__ .sg{
  display:grid;grid-template-columns:repeat(3,1fr);gap:3px;
  padding:4px 16px 10px;
}
#__udm_p__ .sb{
  background:rgba(118,118,128,0.18);border:none;
  color:rgba(235,235,245,0.55);
  border-radius:8px;padding:6px 0;cursor:pointer;
  font-family:inherit;font-size:10.5px;font-weight:500;
  transition:background .14s,color .14s,transform .1s;
  letter-spacing:-0.01em;
}
#__udm_p__ .sb:hover{background:rgba(118,118,128,0.3);color:rgba(255,255,255,0.8)}
#__udm_p__ .sb:active{transform:scale(0.95)}
#__udm_p__ .sb.a{
  background:#0A84FF;color:#fff;
  box-shadow:0 2px 8px rgba(10,132,255,0.35);
}

/* Slider rows */
#__udm_p__ .sr{display:flex;align-items:center;gap:10px;padding:3px 16px}
#__udm_p__ .sl{font-size:11px;color:rgba(235,235,245,0.55);min-width:60px;font-weight:400;letter-spacing:-0.01em}
#__udm_p__ .rng{
  flex:1;-webkit-appearance:none;appearance:none;
  height:4px;border-radius:2px;
  background:rgba(118,118,128,0.3);outline:none;cursor:pointer;
}
#__udm_p__ .rng::-webkit-slider-thumb{
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
  background:#fff;cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,0.4),0 0 0 0.5px rgba(0,0,0,0.1);
  transition:transform .1s;
}
#__udm_p__ .rng::-webkit-slider-thumb:active{transform:scale(1.2)}
#__udm_p__ .rng::-webkit-slider-runnable-track{height:4px;border-radius:2px}
#__udm_p__ .rv{font-size:10.5px;color:rgba(235,235,245,0.4);min-width:30px;text-align:right;font-variant-numeric:tabular-nums}

/* Palette row */
#__udm_p__ .udm-pal-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px 4px}
#__udm_p__ .udm-pal-status{display:flex;align-items:center;gap:5px}
#__udm_p__ .udm-pin-active{font-size:9.5px;color:#30D158;font-weight:500}
#__udm_p__ .udm-pin-global{font-size:9.5px;color:rgba(235,235,245,0.3)}
#__udm_p__ .udm-unpin-btn{
  background:rgba(118,118,128,0.2);border:none;
  border-radius:6px;color:rgba(235,235,245,0.5);
  font-size:9.5px;font-family:inherit;cursor:pointer;padding:2px 6px;
  transition:background .14s;
}
#__udm_p__ .udm-unpin-btn:hover{background:rgba(118,118,128,0.35)}

/* Palette swatches */
#__udm_p__ .pal{display:flex;gap:5px;padding:4px 16px 10px;flex-wrap:wrap}
#__udm_p__ .sw{
  width:22px;height:22px;border-radius:7px;cursor:pointer;
  border:2px solid transparent;
  transition:border-color .15s,transform .15s cubic-bezier(0.34,1.6,0.64,1),box-shadow .15s;
  box-shadow:0 1px 3px rgba(0,0,0,0.35);
}
#__udm_p__ .sw:hover{transform:scale(1.2);box-shadow:0 2px 8px rgba(0,0,0,0.45)}
#__udm_p__ .sw.s{
  border-color:#0A84FF;
  box-shadow:0 0 0 3px rgba(10,132,255,0.28),0 1px 3px rgba(0,0,0,0.35);
}
#__udm_p__ .udm-sw-new{
  background:linear-gradient(135deg,#FF6B6B,#FFD93D,#6BCB77,#4D96FF);
  font-size:11px;color:#fff;font-weight:700;
  text-align:center;line-height:18px;
  text-shadow:0 1px 2px rgba(0,0,0,0.4);
  display:flex;align-items:center;justify-content:center;
}

/* Action buttons */
#__udm_p__ .ac{display:flex;gap:5px;padding:6px 16px}
#__udm_p__ .ab{
  flex:1;background:rgba(118,118,128,0.18);border:none;
  border-radius:10px;padding:7px 0;
  font-size:11px;font-family:inherit;font-weight:500;
  color:rgba(235,235,245,0.7);cursor:pointer;text-align:center;
  transition:background .14s,color .14s,transform .1s;
  letter-spacing:-0.01em;
}
#__udm_p__ .ab:hover{background:rgba(118,118,128,0.3);color:#fff}
#__udm_p__ .ab:active{transform:scale(0.95)}

/* Keyboard shortcuts */
#__udm_p__ .ks{
  padding:8px 16px 14px;
  font-size:10px;color:rgba(235,235,245,0.28);line-height:2;
  font-weight:400;
}
#__udm_p__ .ks kbd{
  background:rgba(118,118,128,0.2);border:none;
  border-radius:5px;padding:1px 5px;
  color:rgba(235,235,245,0.4);font-family:inherit;
}

/* Site dot */
#__udm_p__ .udm-site-dot{font-size:9px;color:#30D158;margin-left:4px}
#__udm_p__ .udm-adj-row{padding:10px 16px 4px}

/* Custom CSS textarea */
#__udm_p__ .pcss{
  display:none;width:calc(100% - 32px);min-height:72px;
  margin:4px 16px 8px;
  background:rgba(0,0,0,0.3);
  border:0.5px solid rgba(84,84,88,0.6);
  border-radius:10px;
  color:rgba(255,211,143,0.9);
  font-family:ui-monospace,'SF Mono','Fira Code',monospace;font-size:10.5px;
  padding:8px 10px;resize:vertical;box-sizing:border-box;outline:none;line-height:1.5;
}
#__udm_p__ .pcss.open{display:block}
#__udm_p__ .pcss:focus{border-color:rgba(10,132,255,0.6)}
#__udm_p__ .udm-css-toggle{
  cursor:pointer;padding:10px 16px 4px;
  color:rgba(235,235,245,0.55);font-size:11px;font-weight:500;
  text-transform:uppercase;letter-spacing:0.06em;
  display:block;
}
#__udm_p__ .udm-css-toggle:hover{color:rgba(235,235,245,0.8)}
`);

  let panelEl=null,panelOpen=false;

  function buildPanel(){
    panelEl?.remove();panelEl=null;
    const en=computeEnabled(),strat=computeStrategy();
    panelEl=document.createElement('div');panelEl.id='__udm_p__';
    panelEl.innerHTML=`
<button class="xb">✕</button>
<div class="t">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <path d="M12 6a6 6 0 0 1 0 12A6 6 0 0 1 8 7.76" stroke="#0A84FF" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  Ultra Dark${HOST?`<span class="udm-host-tag">${HOST}</span>`:""}
</div>

<div class="r" style="padding-top:12px">
  <span style="font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;letter-spacing:-0.01em">Dark Mode</span>
  <button class="tg ${en?'on':'off'}" id="_en"></button>
</div>
<div class="d"></div>

<div class="l">Strategy</div>
<div class="sg">${['variables','override','heuristic','layer','selective','invert'].map(s=>`<button class="sb${strat===s?' a':''}" data-s="${s}" title="${{variables:'CSS variable injection — fastest, least invasive',override:'Scans & overrides light-bg rules from site stylesheets',heuristic:'Walks live DOM and patches light elements in real time','layer':'CSS @layer — clean cascade without !important',selective:'Targets only light-background elements, preserves dark ones',invert:'Full page colour inversion — fallback for complex apps'}[s]||s}">${s}</button>`).join('')}</div>
<div class="d"></div>

<div class="udm-pal-row">
  <span class="l" style="padding:0">Palette</span>
  <span class="udm-pal-status">
    <span id="_pinlbl" class="${sc().manualPalette?'udm-pin-active':'udm-pin-global'}">${sc().manualPalette?'⊕ pinned':'↳ global'}</span>
    ${sc().manualPalette?'<button id="_unpin" class="udm-unpin-btn">unpin</button>':''}
  </span>
</div>
<div class="pal">
  ${Object.keys(SW_COLORS).map(n=>`<div class="sw udm-sw-${n}${computePalette()===n?' s':''}" data-p="${n}" title="${n}"></div>`).join('')}
  ${Object.entries(cfg.customPalettes||{}).map(([name])=>{const key=`custom:${name}`;const cls='udm-sw-custom-'+name.replace(/[^a-zA-Z0-9_-]/g,'_');return `<div class="sw ${cls}${computePalette()===key?' s':''}" data-p="${key}" title="${name}"></div>`;}).join('')}
  <div class="sw udm-sw-new" data-p="__new__" title="New custom palette">+</div>
</div>
<div class="d"></div>

<div class="l udm-adj-row">Adjustments ${sc().warmth!=null||sc().brightness!=null||sc().contrast!=null||sc().imgDim!=null||sc().radius!=null?'<span class="udm-site-dot">●</span>':''}</div>
<div class="sr"><span class="sl">Warmth</span><input type="range" class="rng" min="0" max="100" step="1" value="${computeWarmth()}" id="_w"><span class="rv" id="_wv">${computeWarmth()}%</span></div>
<div class="sr"><span class="sl">Brightness</span><input type="range" class="rng" min="50" max="100" step="1" value="${computeBrightness()}" id="_b"><span class="rv" id="_bv">${computeBrightness()}%</span></div>
<div class="sr"><span class="sl">Contrast</span><input type="range" class="rng" min="90" max="130" step="1" value="${computeContrast()}" id="_c"><span class="rv" id="_cv">${computeContrast()}%</span></div>
<div class="sr"><span class="sl">Roundness</span><input type="range" class="rng" min="0" max="24" step="1" value="${computeRadius()}" id="_rnd"><span class="rv" id="_rndv">${computeRadius()}px</span></div>
<div class="sr"><span class="sl">Img dim</span><input type="range" class="rng" min="0" max="60" step="1" value="${computeImgDim()}" id="_id2"><span class="rv" id="_id2v">${computeImgDim()}%</span></div>
<div class="sr"><span class="sl">BG dim</span><input type="range" class="rng" min="0" max="100" step="1" value="${computeBgDim()}" id="_bgd"><span class="rv" id="_bgdv">${computeBgDim()}%</span></div>
<div class="sr" style="padding-bottom:8px"><span class="sl">Transition</span><input type="range" class="rng" min="0" max="500" step="50" value="${cfg.transition??150}" id="_trn"><span class="rv" id="_trnv">${cfg.transition??150}ms</span></div>
<div class="d"></div>

<div class="l udm-css-toggle" id="_cssToggle" style="padding-top:8px">Custom CSS ${computeCustomCSS()?'<span class="udm-site-dot">●</span>':''}</div>
<textarea class="pcss" id="_pcss" placeholder="/* per-site CSS */">${computeCustomCSS()}</textarea>

<div class="ac" style="padding-top:4px">
  <button class="ab" id="_dash">Dashboard</button>
  <button class="ab" id="_pick">Pick</button>
  <button class="ab" id="_exp">Export</button>
  <button class="ab" id="_rst" title="Reset all per-site overrides for ${HOST}">Reset</button>
</div>
<div class="ks">
  <kbd>⌥⇧D</kbd> toggle &nbsp; <kbd>⌥⇧P</kbd> panel &nbsp; <kbd>⌥⇧N</kbd> cycle<br>
  <kbd>⌥⇧E</kbd> picker &nbsp; <kbd>⌥⇧M</kbd> dashboard &nbsp; <kbd>⌥⇧K</kbd> palette
</div>`;
    document.body.appendChild(panelEl);
    if(panelOpen)requestAnimationFrame(()=>panelEl.classList.add('show'));
    panelEl.querySelector('.xb').onclick=()=>togglePanel(false);
    panelEl.querySelector('#_en').onclick=handleToggle;
    panelEl.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>handleSetStrategy(b.dataset.s));
    panelEl.querySelectorAll('[data-p]').forEach(s=>s.onclick=()=>{if(s.dataset.p==='__new__'){togglePanel(false);openDashboard();}else{handleSetPalette(s.dataset.p);}});
    const _unpinBtn=panelEl.querySelector('#_unpin');if(_unpinBtn)_unpinBtn.onclick=()=>unpinSitePalette();
    panelEl.querySelector('#_w').oninput=function(){panelEl.querySelector('#_wv').textContent=this.value+'%';handleAdj('warmth',+this.value);};
    panelEl.querySelector('#_b').oninput=function(){panelEl.querySelector('#_bv').textContent=this.value+'%';handleAdj('brightness',+this.value);};
    panelEl.querySelector('#_c').oninput=function(){panelEl.querySelector('#_cv').textContent=this.value+'%';handleAdj('contrast',+this.value);};
    // Remove old imgDim wiring that used _d (now gone)
    const id2el=panelEl.querySelector('#_id2');
    if(id2el)id2el.oninput=function(){panelEl.querySelector('#_id2v').textContent=this.value+'%';handleAdj('imgDim',+this.value);};
    panelEl.querySelector('#_bgd').oninput=function(){panelEl.querySelector('#_bgdv').textContent=this.value+'%';handleAdj('bgDim',+this.value);};
    panelEl.querySelector('#_trn').oninput=function(){panelEl.querySelector('#_trnv').textContent=this.value+'ms';cfg.transition=+this.value;_adjSave();};
    const cssToggle=panelEl.querySelector('#_cssToggle');
    const pcssEl=panelEl.querySelector('#_pcss');
    if(cssToggle&&pcssEl){
      cssToggle.onclick=()=>pcssEl.classList.toggle('open');
      pcssEl.addEventListener('input', debounce(function(e){
        const css=(e.target||this).value;
        setSiteVal('customCSS',css);
        _adjSave();
        if(isDarkActive()){
          if(css.trim())injectStyle('__udm_custom__',css);else removeStyle('__udm_custom__');
        }
      },400));
    }
    panelEl.querySelector('#_rnd').oninput=function(){
      panelEl.querySelector('#_rndv').textContent=this.value+'px';
      setSiteVal('radius',+this.value);
      _adjSave();
      refreshRadius();
    };
    panelEl.querySelector('#_dash').onclick=()=>{togglePanel(false);openDashboard();};
    panelEl.querySelector('#_pick').onclick=()=>{togglePanel(false);startPicker();};
    panelEl.querySelector('#_exp').onclick=exportSettings;
    panelEl.querySelector('#_rst').onclick=resetSite;
  }

  function updatePanel(){
    if(!panelEl)return;
    const en=computeEnabled(),strat=computeStrategy(),pal=computePalette();
    const tb=panelEl.querySelector('#_en');if(tb)tb.className=`tg ${en?'on':'off'}`;
    panelEl.querySelectorAll('[data-s]').forEach(b=>b.classList.toggle('a',b.dataset.s===strat));
    panelEl.querySelectorAll('[data-p]').forEach(sw=>sw.classList.toggle('s',sw.dataset.p===pal));
    // Refresh pin status label if the element exists
    const pinLbl=panelEl.querySelector('#_pinlbl');
    if(pinLbl){const pinned=!!sc().manualPalette;pinLbl.textContent=pinned?'📌 pinned':'↳ global';pinLbl.style.color=pinned?'#3fb950':'#484f58';}
    const unpinBtn=panelEl.querySelector('#_unpin');
    if(unpinBtn){if(sc().manualPalette){unpinBtn.style.display='inline';}else{unpinBtn.style.display='none';}}
    // Refresh slider values to reflect any cross-tab or schedule changes
    const set=(id,valId,v)=>{const el=panelEl.querySelector(id);if(el){el.value=v;const vEl=panelEl.querySelector(valId);if(vEl)vEl.textContent=v+'%';}};
    set('#_w','#_wv',computeWarmth());
    set('#_b','#_bv',computeBrightness());
    set('#_c','#_cv',computeContrast());
    const rnd=panelEl.querySelector('#_rnd');if(rnd){rnd.value=computeRadius();panelEl.querySelector('#_rndv').textContent=computeRadius()+'px';}
    const bgdEl=panelEl.querySelector('#_bgd');if(bgdEl){bgdEl.value=computeBgDim();panelEl.querySelector('#_bgdv').textContent=computeBgDim()+'%';}
    const id2El=panelEl.querySelector('#_id2');if(id2El){id2El.value=computeImgDim();panelEl.querySelector('#_id2v').textContent=computeImgDim()+'%';}
  }

  function togglePanel(force){
    panelOpen=force!==undefined?force:!panelOpen;
    if(panelOpen){if(!panelEl||!document.body.contains(panelEl))buildPanel();requestAnimationFrame(()=>panelEl?.classList.add('show'));}
    else panelEl?.classList.remove('show');
  }

  // ─── FULL SETTINGS DASHBOARD ─────────────────────────────────────────────────
  // Injected as a fixed full-screen overlay into the current page.

  GM_addStyle(`
/* ── Apple-style Full Dashboard ────────────────────────────────────── */
#__udm_dash__{
  all:initial;position:fixed;inset:0;z-index:2147483645;
  background:rgba(0,0,0,0);
  display:flex;align-items:flex-start;justify-content:center;
  overflow-y:auto;padding:40px 16px 80px;
  font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,system-ui,sans-serif;
  transition:background .25s;pointer-events:none;
}
#__udm_dash__.open{background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);pointer-events:all}
#__udm_dash__ *{box-sizing:border-box;margin:0;padding:0}

/* Sheet container */
#__udm_dash__ .dw{
  width:100%;max-width:840px;
  transform:translateY(20px) scale(0.97);opacity:0;
  transition:transform .3s cubic-bezier(0.34,1.3,0.64,1),opacity .25s cubic-bezier(0.4,0,0.2,1);
}
#__udm_dash__.open .dw{transform:none;opacity:1}

/* Header */
#__udm_dash__ .dh{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:4px;
}
#__udm_dash__ .dh h1{
  font-size:22px;font-weight:700;color:#fff;
  display:flex;align-items:center;gap:12px;
  letter-spacing:-0.03em;
}
#__udm_dash__ .dh .moon{
  width:20px;height:20px;
  background:rgba(10,132,255,0.9);border-radius:50%;
  position:relative;overflow:hidden;flex-shrink:0;
  box-shadow:0 0 12px rgba(10,132,255,0.5);
}
#__udm_dash__ .dh .moon::after{
  content:'';position:absolute;
  width:16px;height:16px;
  background:rgba(28,28,30,0.95);border-radius:50%;
  top:-2px;right:-3px;
}
#__udm_dash__ .dver{
  font-size:12px;color:rgba(235,235,245,0.35);
  margin-bottom:24px;letter-spacing:-0.01em;
  font-weight:400;
}
#__udm_dash__ .dclose{
  background:rgba(118,118,128,0.2);border:none;
  border-radius:10px;color:rgba(235,235,245,0.65);
  font-family:inherit;font-size:13px;font-weight:500;
  padding:8px 16px;cursor:pointer;
  transition:background .15s,color .15s;
  letter-spacing:-0.01em;
}
#__udm_dash__ .dclose:hover{background:rgba(118,118,128,0.35);color:#fff}

/* Stats row */
#__udm_dash__ .stats{
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:10px;margin-bottom:16px;
}
#__udm_dash__ .stat{
  background:rgba(44,44,46,0.72);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:16px;padding:18px 16px;text-align:center;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07);
}
#__udm_dash__ .stat .snum{
  font-size:30px;font-weight:700;color:#fff;line-height:1;
  letter-spacing:-0.04em;font-variant-numeric:tabular-nums;
}
#__udm_dash__ .stat .slbl{
  font-size:10.5px;color:rgba(235,235,245,0.4);
  margin-top:5px;text-transform:uppercase;letter-spacing:0.06em;
  font-weight:500;
}

/* Two-column grid */
#__udm_dash__ .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}

/* Cards */
#__udm_dash__ .card{
  background:rgba(44,44,46,0.72);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:16px;padding:18px 20px;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07);
}
#__udm_dash__ .ctitle{
  font-size:11px;font-weight:600;
  letter-spacing:0.06em;text-transform:uppercase;
  color:rgba(235,235,245,0.4);margin-bottom:14px;
}
#__udm_dash__ .row{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 0;border-bottom:0.5px solid rgba(84,84,88,0.45);
}
#__udm_dash__ .row:last-child{border-bottom:none}
#__udm_dash__ .rl{font-size:13px;color:rgba(255,255,255,0.88);font-weight:400;letter-spacing:-0.01em}
#__udm_dash__ .rsub{font-size:11px;color:rgba(235,235,245,0.4);margin-top:2px}

/* Apple-style toggle */
#__udm_dash__ .tw{position:relative;width:48px;height:28px;flex-shrink:0}
#__udm_dash__ .tw input{opacity:0;width:0;height:0;position:absolute}
#__udm_dash__ .tt{
  position:absolute;inset:0;border-radius:14px;
  background:rgba(120,120,128,0.32);
  cursor:pointer;transition:background .2s cubic-bezier(0.4,0,0.2,1);
}
#__udm_dash__ .tt::after{
  content:'';position:absolute;
  width:24px;height:24px;background:#fff;border-radius:50%;
  top:2px;left:2px;
  transition:transform .2s cubic-bezier(0.34,1.4,0.64,1);
  box-shadow:0 2px 6px rgba(0,0,0,0.35),0 1px 2px rgba(0,0,0,0.2);
}
#__udm_dash__ .tw input:checked+.tt{background:#30D158}
#__udm_dash__ .tw input:checked+.tt::after{transform:translateX(20px)}

/* Select */
#__udm_dash__ .sel{
  background:rgba(118,118,128,0.18);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:9px;padding:7px 30px 7px 11px;
  color:rgba(255,255,255,0.88);
  font-family:inherit;font-size:13px;font-weight:400;
  cursor:pointer;outline:none;-webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(235,235,245,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  transition:border-color .15s,background-color .15s;
  color-scheme:dark;
}
#__udm_dash__ .sel:focus{border-color:rgba(10,132,255,0.6);background-color:rgba(118,118,128,0.28)}

/* Palette swatches */
#__udm_dash__ .palrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
#__udm_dash__ .dsw{
  width:28px;height:28px;border-radius:8px;cursor:pointer;
  border:2px solid transparent;
  transition:border-color .15s,transform .15s cubic-bezier(0.34,1.6,0.64,1),box-shadow .15s;
  box-shadow:0 2px 6px rgba(0,0,0,0.35);
}
#__udm_dash__ .dsw:hover{transform:scale(1.18)}
#__udm_dash__ .dsw.s{
  border-color:#0A84FF;
  box-shadow:0 0 0 3px rgba(10,132,255,0.28),0 2px 6px rgba(0,0,0,0.35);
}

/* Slider rows */
#__udm_dash__ .slrow{display:flex;align-items:center;gap:12px;padding:6px 0}
#__udm_dash__ .sllbl{font-size:12px;color:rgba(235,235,245,0.65);min-width:80px;font-weight:400}
#__udm_dash__ .slval{font-size:12px;color:rgba(235,235,245,0.4);min-width:42px;text-align:right;font-variant-numeric:tabular-nums}
#__udm_dash__ input[type=range]{
  flex:1;-webkit-appearance:none;appearance:none;
  height:4px;border-radius:2px;
  background:rgba(118,118,128,0.3);outline:none;cursor:pointer;
}
#__udm_dash__ input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
  background:#fff;cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,0.4),0 0 0 0.5px rgba(0,0,0,0.1);
  transition:transform .1s;
}
#__udm_dash__ input[type=range]::-webkit-slider-thumb:active{transform:scale(1.2)}

/* Time inputs */
#__udm_dash__ input[type=time]{
  background:rgba(118,118,128,0.18);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:9px;padding:7px 11px;
  color:rgba(255,255,255,0.88);font-family:inherit;font-size:13px;
  outline:none;width:148px;transition:border-color .15s;
  color-scheme:dark;
}
#__udm_dash__ input[type=time]:focus{border-color:rgba(10,132,255,0.6)}

#__udm_dash__ .snote{
  font-size:11px;color:rgba(235,235,245,0.35);
  margin-top:12px;padding-top:12px;
  border-top:0.5px solid rgba(84,84,88,0.45);
}
#__udm_dash__ .stitle{
  font-size:11px;font-weight:600;
  letter-spacing:0.06em;text-transform:uppercase;
  color:rgba(235,235,245,0.4);margin-bottom:12px;margin-top:20px;
}

/* Sites table card */
#__udm_dash__ .scard{
  background:rgba(44,44,46,0.72);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:16px;padding:0 20px;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07);
}
#__udm_dash__ .stable{width:100%;border-collapse:collapse}
#__udm_dash__ .stable th{
  font-size:10.5px;font-weight:600;letter-spacing:0.06em;
  text-transform:uppercase;color:rgba(235,235,245,0.35);
  padding:16px 12px 12px 0;text-align:left;
  border-bottom:0.5px solid rgba(84,84,88,0.45);
}
#__udm_dash__ .stable td{
  padding:11px 12px 11px 0;
  border-bottom:0.5px solid rgba(84,84,88,0.25);
  vertical-align:middle;font-size:13px;color:rgba(255,255,255,0.88);
}
#__udm_dash__ .stable tr:last-child td{border-bottom:none}
#__udm_dash__ .stable tr:hover td{background:rgba(255,255,255,0.02)}
#__udm_dash__ .hname{font-weight:500;color:#fff;letter-spacing:-0.01em}

/* Status badges */
#__udm_dash__ .sbadge{
  display:inline-block;font-size:11px;font-weight:600;
  letter-spacing:0.02em;padding:3px 10px;border-radius:20px;
  text-transform:uppercase;cursor:pointer;
  transition:opacity .15s,transform .1s;user-select:none;
  font-family:inherit;border:none;
}
#__udm_dash__ .sbadge:hover{opacity:0.75}
#__udm_dash__ .sbadge:active{transform:scale(0.95)}
#__udm_dash__ .bon{background:rgba(48,209,88,0.18);color:#30D158}
#__udm_dash__ .boff{background:rgba(255,69,58,0.15);color:#FF453A}

/* Delete button */
#__udm_dash__ .ibin{
  background:rgba(118,118,128,0.15);border:none;
  border-radius:8px;color:rgba(235,235,245,0.4);
  width:28px;height:28px;cursor:pointer;font-size:12px;
  display:inline-flex;align-items:center;justify-content:center;
  transition:background .14s,color .14s;font-family:inherit;
}
#__udm_dash__ .ibin:hover{background:rgba(255,69,58,0.18);color:#FF453A}

/* Add row */
#__udm_dash__ .addrow{display:flex;gap:8px;margin-top:16px}
#__udm_dash__ .addrow input{
  flex:1;background:rgba(118,118,128,0.18);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:10px;padding:8px 12px;
  color:rgba(255,255,255,0.88);font-family:inherit;font-size:13px;
  outline:none;transition:border-color .15s;
}
#__udm_dash__ .addrow input:focus{border-color:rgba(10,132,255,0.6)}
#__udm_dash__ .addrow input::placeholder{color:rgba(235,235,245,0.25)}

/* Buttons */
#__udm_dash__ .btnadd{
  background:rgba(48,209,88,0.18);border:none;
  border-radius:10px;color:#30D158;
  font-family:inherit;font-size:13px;font-weight:500;
  padding:8px 16px;cursor:pointer;
  transition:background .15s,transform .1s;white-space:nowrap;
}
#__udm_dash__ .btnadd:hover{background:rgba(48,209,88,0.28)}
#__udm_dash__ .btnadd:active{transform:scale(0.97)}

#__udm_dash__ .acts{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}
#__udm_dash__ .btn{
  background:rgba(118,118,128,0.18);border:none;
  border-radius:11px;color:rgba(235,235,245,0.8);
  font-family:inherit;font-size:13px;font-weight:500;
  padding:10px 20px;cursor:pointer;
  transition:background .15s,color .15s,transform .1s;
  letter-spacing:-0.01em;
}
#__udm_dash__ .btn:hover{background:rgba(118,118,128,0.3);color:#fff}
#__udm_dash__ .btn:active{transform:scale(0.97)}
#__udm_dash__ .btndanger{color:#FF453A}
#__udm_dash__ .btndanger:hover{background:rgba(255,69,58,0.15);color:#FF453A}

/* Import box */
#__udm_dash__ .importbox{
  background:rgba(28,28,30,0.9);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:14px;padding:18px;
  margin-top:14px;display:none;
}
#__udm_dash__ .importbox.open{display:block}
#__udm_dash__ .importbox textarea{
  width:100%;height:160px;
  background:rgba(0,0,0,0.3);
  border:0.5px solid rgba(84,84,88,0.5);
  border-radius:10px;
  color:rgba(255,255,255,0.88);
  font-family:ui-monospace,'SF Mono',monospace;font-size:11px;
  padding:12px;resize:vertical;outline:none;line-height:1.6;
}
#__udm_dash__ .importbox textarea:focus{border-color:rgba(10,132,255,0.6)}
#__udm_dash__ .importacts{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}
#__udm_dash__ .btnprimary{
  background:#0A84FF;border:none;border-radius:10px;
  color:#fff;font-family:inherit;font-size:13px;font-weight:600;
  padding:9px 18px;cursor:pointer;
  transition:opacity .15s,transform .1s;
  letter-spacing:-0.01em;
}
#__udm_dash__ .btnprimary:hover{opacity:0.85}
#__udm_dash__ .btnprimary:active{transform:scale(0.97)}

@media(max-width:600px){
  #__udm_dash__ .g2{grid-template-columns:1fr}
  #__udm_dash__ .stats{grid-template-columns:1fr 1fr}
}

/* Custom palette editor */
#__udm_dash__ .cped{
  margin-top:14px;padding-top:14px;
  border-top:0.5px solid rgba(84,84,88,0.45);display:none;
}
#__udm_dash__ .cped.open{display:block}
#__udm_dash__ .cped-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
#__udm_dash__ .cped-title{font-size:10.5px;color:rgba(235,235,245,0.4);text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
#__udm_dash__ .cped-list{display:flex;flex-direction:column;gap:5px;margin-bottom:8px}
#__udm_dash__ .cped-item{
  display:flex;align-items:center;gap:10px;
  background:rgba(0,0,0,0.25);
  border:0.5px solid rgba(84,84,88,0.4);
  border-radius:11px;padding:8px 12px;cursor:pointer;
  transition:border-color .15s,background .15s;
}
#__udm_dash__ .cped-item:hover{background:rgba(118,118,128,0.12);border-color:rgba(84,84,88,0.7)}
#__udm_dash__ .cped-item.active{border-color:rgba(10,132,255,0.5);background:rgba(10,132,255,0.08)}
#__udm_dash__ .cped-dot{width:16px;height:16px;border-radius:5px;flex-shrink:0;border:0.5px solid rgba(255,255,255,0.15)}
#__udm_dash__ .cped-iname{flex:1;font-size:13px;color:rgba(255,255,255,0.88);letter-spacing:-0.01em}
#__udm_dash__ .cped-ibtn{
  background:rgba(118,118,128,0.18);border:none;
  border-radius:8px;color:rgba(235,235,245,0.65);
  font-size:11px;font-family:inherit;font-weight:500;
  padding:4px 10px;cursor:pointer;
  transition:background .14s,color .14s;white-space:nowrap;
}
#__udm_dash__ .cped-ibtn:hover{background:rgba(10,132,255,0.2);color:#0A84FF}
#__udm_dash__ .cped-ibtn.danger:hover{background:rgba(255,69,58,0.18);color:#FF453A}
#__udm_dash__ .cped-editor{
  background:rgba(0,0,0,0.25);
  border:0.5px solid rgba(84,84,88,0.45);
  border-radius:14px;padding:14px;margin-top:8px;display:none;
}
#__udm_dash__ .cped-editor.open{display:block}
#__udm_dash__ .cped-editor-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}
#__udm_dash__ .cped-editor-name{
  flex:1;background:rgba(118,118,128,0.18);
  border:0.5px solid rgba(255,255,255,0.1);
  border-radius:9px;color:rgba(255,255,255,0.88);
  font-family:inherit;font-size:13px;padding:7px 11px;
  outline:none;transition:border-color .15s;
}
#__udm_dash__ .cped-editor-name:focus{border-color:rgba(10,132,255,0.6)}
#__udm_dash__ .cped-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
#__udm_dash__ .cped-field{
  display:flex;align-items:center;gap:8px;
  background:rgba(118,118,128,0.1);
  border:0.5px solid rgba(84,84,88,0.4);
  border-radius:9px;padding:7px 10px;
  transition:border-color .15s;
}
#__udm_dash__ .cped-field:hover{border-color:rgba(10,132,255,0.4)}
#__udm_dash__ .cped-field input[type=color]{
  width:22px;height:22px;border:none;border-radius:5px;
  cursor:pointer;padding:0;background:none;flex-shrink:0;
  -webkit-appearance:none;appearance:none;
}
#__udm_dash__ .cped-field input[type=color]::-webkit-color-swatch-wrapper{padding:0;border-radius:4px}
#__udm_dash__ .cped-field input[type=color]::-webkit-color-swatch{border:none;border-radius:4px}
#__udm_dash__ .cped-field label{font-size:11.5px;color:rgba(235,235,245,0.6);flex:1;cursor:pointer}
#__udm_dash__ .cped-hex{font-size:10px;color:rgba(235,235,245,0.3);font-family:ui-monospace,'SF Mono',monospace;min-width:52px;text-align:right}
#__udm_dash__ .cped-seeds{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
#__udm_dash__ .cped-from{
  background:rgba(118,118,128,0.15);border:none;
  border-radius:8px;color:rgba(235,235,245,0.55);
  font-family:inherit;font-size:11px;font-weight:500;
  padding:5px 12px;cursor:pointer;
  transition:background .14s,color .14s;
}
#__udm_dash__ .cped-from:hover{background:rgba(10,132,255,0.2);color:#0A84FF}
#__udm_dash__ .dsw-custom{
  background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 25%,#6BCB77 50%,#4D96FF 75%,#C77DFF 100%);
  position:relative;
}
#__udm_dash__ .dsw-custom::after{
  content:'+';position:absolute;inset:0;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);
}
#__udm_dash__ .udm-sw-new{
  background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 25%,#6BCB77 50%,#4D96FF 75%,#C77DFF 100%);
  position:relative;font-size:14px;font-weight:700;color:#fff;
  text-shadow:0 1px 2px rgba(0,0,0,.6);
  display:flex;align-items:center;justify-content:center;
}
#__udm_dash__ .udm-td-empty{text-align:center;color:rgba(235,235,245,0.25);padding:24px 0;font-size:13px}
#__udm_dash__ .udm-td-pal{font-size:12px}
#__udm_dash__ .udm-td-muted{color:rgba(235,235,245,0.45)}
#__udm_dash__ .udm-pal-muted{color:rgba(235,235,245,0.4)}
#__udm_dash__ .udm-pal-pinned{color:#30D158}
#__udm_dash__ .udm-pal-global{color:rgba(235,235,245,0.25)}
#__udm_dash__ .udm-pin-btn{cursor:pointer}
#__udm_dash__ .udm-sel{font-size:12px;padding:5px 26px 5px 9px}
#__udm_dash__ .cped-btn-area{display:flex;gap:4px;align-items:center}
#__udm_dash__ .udm-cp-empty{font-size:12px;color:rgba(235,235,245,0.3);padding:8px 0;letter-spacing:-0.01em}
#__udm_dash__ .udm-del-confirm{font-size:11px;color:#FF453A;margin-right:4px}
#__udm_dash__ .udm-del-yes{border-color:#FF453A!important;color:#FF453A!important}
.__udm_picker_tip__{
  position:fixed;z-index:2147483647;
  background:rgba(28,28,30,0.92);color:#0A84FF;
  font:11px/1.4 ui-monospace,'SF Mono',monospace;
  padding:5px 9px;
  border:0.5px solid rgba(10,132,255,0.4);
  border-radius:8px;pointer-events:none;max-width:300px;word-break:break-all;
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  box-shadow:0 4px 12px rgba(0,0,0,0.4);
}
#__udm_dash__ .udm-pal-section{margin-bottom:14px}
#__udm_dash__ .udm-pal-label{margin-bottom:8px;font-size:13px;color:rgba(255,255,255,0.88)}
#__udm_dash__ .udm-btnadd-sm{font-size:11px;padding:5px 12px}
#__udm_dash__ .udm-import-lbl{font-size:13px;color:rgba(235,235,245,0.5);margin-bottom:10px}
`);

  let dashEl=null;

  function openDashboard(){
    dashEl?.remove(); dashEl=null;
    dashEl=document.createElement('div'); dashEl.id='__udm_dash__';
    dashEl.innerHTML=`<div class="dw">
<div class="dh">
  <h1>
    <div class="moon"></div>
    Ultra Dark Mode
  </h1>
  <button class="dclose" id="_dc">Close</button>
</div>
<div class="dver">v6.2.6 — Settings Dashboard</div>

<div class="stats">
  <div class="stat"><div class="snum" id="_st0">0</div><div class="slbl">Toggles</div></div>
  <div class="stat"><div class="snum" id="_st1">0</div><div class="slbl">Sites configured</div></div>
  <div class="stat"><div class="snum" id="_st2">0</div><div class="slbl">Exclusions</div></div>
  <div class="stat"><div class="snum" id="_st3">0</div><div class="slbl">Custom CSS rules</div></div>
</div>

<div class="g2">
  <div class="card">
    <div class="ctitle">Global</div>
    <div class="row"><div><div class="rl">Enabled</div></div><label class="tw"><input type="checkbox" id="_ge"><span class="tt"></span></label></div>
    <div class="row"><div><div class="rl">Strategy</div></div><select class="sel" id="_gs"><option>variables</option><option>override</option><option>heuristic</option><option>layer</option><option>selective</option><option>invert</option></select></div>
    <div class="row"><div><div class="rl">Honour native dark</div><div class="rsub">Skip sites that already have dark mode</div></div><label class="tw"><input type="checkbox" id="_ghn"><span class="tt"></span></label></div>
    <div class="row"><div><div class="rl">OS sync</div><div class="rsub">Follow prefers-color-scheme</div></div><label class="tw"><input type="checkbox" id="_gos"><span class="tt"></span></label></div>
    <div class="row"><div><div class="rl">Auto-detect native dark</div><div class="rsub">Skip sites with their own dark mode</div></div><label class="tw"><input type="checkbox" id="_gad"><span class="tt"></span></label></div>
  </div>

  <div class="card">
    <div class="ctitle">Appearance</div>
    <div class="udm-pal-section"><div class="rl udm-pal-label">Palette</div><div class="palrow" id="_prow"></div>
    <div class="cped" id="_cped">
      <div class="cped-header">
        <span class="cped-title">Custom Palettes</span>
        <button class="btnadd udm-btnadd-sm" id="_cpnew">+ New palette</button>
      </div>
      <div class="cped-list" id="_cplist"></div>
      <div class="cped-editor" id="_cpeditor">
        <div class="cped-editor-head">
          <input class="cped-editor-name" id="_cpename" type="text" placeholder="Palette name" maxlength="40">
          <button class="cped-ibtn" id="_cperename">Rename</button>
        </div>
        <div class="cped-seeds" id="_cpseeds">
          <button class="cped-from" data-from="default">From Default</button>
          <button class="cped-from" data-from="dracula">From Dracula</button>
          <button class="cped-from" data-from="nord">From Nord</button>
          <button class="cped-from" data-from="mocha">From Mocha</button>
          <button class="cped-from" data-from="gruvbox">From Gruvbox</button>
          <button class="cped-from" data-from="rosepine">From Rosé Pine</button>
        </div>
        <div class="cped-grid" id="_cpgrid"></div>
      </div>
    </div>
    </div>
    <div class="slrow"><span class="sllbl">Warmth</span><input type="range" id="_aw" min="0" max="100" step="1"><span class="slval" id="_awv">0%</span></div>
    <div class="slrow"><span class="sllbl">Brightness</span><input type="range" id="_ab" min="50" max="100" step="1"><span class="slval" id="_abv">90%</span></div>
    <div class="slrow"><span class="sllbl">Contrast</span><input type="range" id="_ac" min="90" max="130" step="1"><span class="slval" id="_acv">100%</span></div>
    <div class="slrow"><span class="sllbl">Roundness</span><input type="range" id="_ar" min="0" max="24" step="1"><span class="slval" id="_arv">0px</span></div>
    <div class="slrow"><span class="sllbl">Image dim</span><input type="range" id="_ad" min="0" max="60" step="1"><span class="slval" id="_adv">0%</span></div>
    <div class="slrow"><span class="sllbl">BG image dim</span><input type="range" id="_abd" min="0" max="100" step="1"><span class="slval" id="_abdv">0%</span></div>
    <div class="slrow"><span class="sllbl">Toggle transition</span><input type="range" id="_atr" min="0" max="500" step="50"><span class="slval" id="_atrv">150ms</span></div>
  </div>
</div>

<div class="card">
  <div class="ctitle">Schedule</div>
  <div class="row"><div><div class="rl">Active</div></div><label class="tw"><input type="checkbox" id="_sa"><span class="tt"></span></label></div>
  <div class="row"><div class="rl">From</div><input type="time" id="_sf"></div>
  <div class="row"><div class="rl">To</div><input type="time" id="_st"></div>
  <div class="snote">Overnight spans work (e.g. 20:00 → 07:00).</div>
</div>

<div class="stitle">Per-site overrides</div>
<div class="scard"><table class="stable"><thead><tr><th>Host</th><th>Status</th><th>Strategy</th><th>Palette</th><th>Pin</th><th>Excl.</th><th></th></tr></thead><tbody id="_stb"></tbody></table></div>

<div class="addrow">
  <input type="text" id="_sai" placeholder="example.com — press Enter or click Add">
  <button class="btnadd" id="_sab">+ Add site</button>
</div>

<div class="acts">
  <button class="btn" id="_bcj">Copy JSON</button>
  <button class="btn" id="_bij">Import JSON</button>
  <button class="btn btndanger" id="_bcs">Clear all sites</button>
  <button class="btn btndanger" id="_brd">Reset to defaults</button>
</div>

<div class="importbox" id="_ibox">
  <div class="udm-import-lbl">Paste settings JSON:</div>
  <textarea id="_ita" placeholder='{"enabled":true,"strategy":"variables",...}'></textarea>
  <div class="importacts">
    <button class="btn" id="_ican">Cancel</button>
    <button class="btnprimary" id="_iapp">Apply</button>
  </div>
</div>
</div>`;

    document.body.appendChild(dashEl);
    requestAnimationFrame(()=>dashEl.classList.add('open'));
    syncDashFromState();
    wireDash();
  }

  function closeDashboard(){if(!dashEl)return;dashEl.classList.remove('open');setTimeout(()=>{dashEl?.remove();dashEl=null;},200);}

  function syncDashFromState(){
    if(!dashEl)return;
    const D=id=>dashEl.querySelector(id);

    // Stats
    D('#_st0').textContent = cfg._toggles||0;
    D('#_st1').textContent = Object.keys(cfg.sites).length;
    const excTotal=Object.values(cfg.sites).reduce((n,s)=>n+(s.excluded?.length||0),0);
    D('#_st2').textContent = excTotal;
    const cssTotal=Object.values(cfg.sites).filter(s=>s.customCSS&&s.customCSS.trim()).length;
    const s3El=D('#_st3');if(s3El)s3El.textContent=cssTotal;

    // Global
    D('#_ge').checked  = cfg.enabled;
    D('#_gs').value    = cfg.strategy;
    D('#_ghn').checked = cfg.honourNative??true;
    D('#_gos').checked = cfg.osSync??false;
    D('#_gad').checked = cfg.autoDetect??true;

    // Palette swatches
    const pr=D('#_prow');
    pr.innerHTML=Object.keys(SW_COLORS).map(n=>
      `<div class="dsw udm-sw-${n}${cfg.palette===n?' s':''}" data-p="${n}" title="${n}"></div>`
    ).join('')+
    Object.entries(cfg.customPalettes||{}).map(([name])=>{
      const key=`custom:${name}`;
      const cls='udm-sw-custom-'+name.replace(/[^a-zA-Z0-9_-]/g,'_');
      return `<div class="dsw ${cls}${cfg.palette===key?' s':''}" data-p="${key}" title="${name}"></div>`;
    }).join('')+
    `<div class="dsw udm-sw-new" data-p="__new__" title="New custom palette">+</div>`;
    pr.querySelectorAll('.dsw').forEach(sw=>sw.addEventListener('click',()=>{
      if(sw.dataset.p==='__new__'){
        // Create a new palette and open its editor
        const name=createNewCustomPalette();
        syncDashFromState();
        D('#_cped').classList.add('open');
        renderCustomPaletteList(name);
        renderCustomPaletteEditor(name);
        return;
      }
      pr.querySelectorAll('.dsw').forEach(s=>s.classList.remove('s'));sw.classList.add('s');
      // Dashboard palette picker sets the GLOBAL default only —
      // it does not pin the current site (use the panel swatch for that).
      cfg.palette=sw.dataset.p;
      saveCfg();
      if(computeEnabled()){applyWithTransition(()=>{removeDarkMode();applyDarkMode();});}
      showToast(`Global default palette: ${sw.dataset.p}`);
      updatePanel();
      const isCustom=sw.dataset.p.startsWith('custom:');
      D('#_cped').classList.toggle('open',isCustom);
      if(isCustom){renderCustomPaletteList(sw.dataset.p.slice(7));renderCustomPaletteEditor(sw.dataset.p.slice(7));}
    }));
    // Show manager if a custom palette is already active
    const activePal=cfg.palette;
    if(activePal&&activePal.startsWith('custom:')){
      D('#_cped').classList.add('open');
      const activeName=activePal.slice(7);
      renderCustomPaletteList(activeName);
      renderCustomPaletteEditor(activeName);
    } else {
      D('#_cped').classList.remove('open');
      renderCustomPaletteList(null);
    }

    // Sliders
    const sl=(id,valId,v)=>{D(id).value=v;D(valId).textContent=v+'%';};
    sl('#_aw','#_awv',cfg.warmth);sl('#_ab','#_abv',cfg.brightness);sl('#_ac','#_acv',cfg.contrast);sl('#_ad','#_adv',cfg.imgDim);
    const sl2=(id,valId,v,unit)=>{D(id).value=v;D(valId).textContent=v+unit;};
    sl2('#_abd','#_abdv',cfg.bgDim??0,'%');sl2('#_atr','#_atrv',cfg.transition??150,'ms');
    sl2('#_ar','#_arv',cfg.radius??DEFAULT_CFG.radius??0,'px');

    // Schedule
    D('#_sa').checked = cfg.schedule.active;
    D('#_sf').value   = cfg.schedule.from||'20:00';
    D('#_st').value   = cfg.schedule.to||'07:00';

    // Site table
    renderDashTable();
  }

  function renderDashTable(){
    if(!dashEl)return;
    const tbody=dashEl.querySelector('#_stb');
    const hosts=Object.keys(cfg.sites);
    if(!hosts.length){tbody.innerHTML='<tr><td colspan="6" class="udm-td-empty">No site overrides yet</td></tr>';return;}
    tbody.innerHTML=hosts.map(h=>{
      const s=cfg.sites[h]||{},on=typeof s.enabled==='boolean'?s.enabled:true,st=s.strategy||'',ex=s.excluded?.length||0;
      const pinned=!!s.manualPalette;
      const palLabel=s.palette?`<span class="${pinned?'udm-pal-pinned':'udm-pal-muted'}">${s.palette}</span>`:'<span class="udm-pal-global">—</span>';
      return `<tr>
        <td><span class="hname">${h}</span></td>
        <td><span class="sbadge ${on?'bon':'boff'}" data-th="${h}">${on?'on':'off'}</span></td>
        <td><select class="sel udm-sel" data-sh="${h}">
          <option value="" ${!st?'selected':''}>— global —</option>
          ${['variables','override','heuristic','layer','selective','invert'].map(v=>`<option value="${v}"${st===v?' selected':''}>${v}</option>`).join('')}
        </select></td>
        <td class="udm-td-pal">${palLabel}</td>
        <td><button class="sbadge ${pinned?'bon':'boff'} udm-pin-btn" data-pin="${h}" title="${pinned?'Click to unpin — palette will follow global default':'Palette follows global default'}">${pinned?'📌 pinned':'↳ global'}</button></td>
        <td class="udm-td-muted">${ex}</td>
        <td><button class="ibin" data-dh="${h}">✕</button></td>
      </tr>`;
    }).join('');
    // Wire table controls
    tbody.querySelectorAll('[data-th]').forEach(b=>b.addEventListener('click',()=>{const h=b.dataset.th;cfg.sites[h].enabled=!(cfg.sites[h].enabled??true);cfg._toggles=(cfg._toggles||0)+1;saveCfg();renderDashTable();syncDashStats();showToast(`${h}: ${cfg.sites[h].enabled?'on':'off'}`);updatePanel();}));
    tbody.querySelectorAll('[data-sh]').forEach(sel=>sel.addEventListener('change',()=>{cfg.sites[sel.dataset.sh].strategy=sel.value||undefined;saveCfg();showToast(`Strategy updated`);}));
    // Pin/unpin toggle
    tbody.querySelectorAll('[data-pin]').forEach(btn=>btn.addEventListener('click',()=>{
      const h=btn.dataset.pin;const site=cfg.sites[h];if(!site)return;
      if(site.manualPalette){
        // Unpin: remove palette override — site will follow global cfg.palette
        delete site.palette; delete site.manualPalette;
        if(!Object.keys(site).length)delete cfg.sites[h];
        showToast(`${h}: palette unpinned`);
      } else {
        // Pin: lock the site to the currently active palette (cfg.palette)
        site.palette=cfg.palette; site.manualPalette=true;
        showToast(`${h}: palette pinned to ${cfg.palette}`,'ok');
      }
      saveCfg();renderDashTable();syncDashStats();
    }));
    tbody.querySelectorAll('[data-dh]').forEach(btn=>btn.addEventListener('click',()=>{delete cfg.sites[btn.dataset.dh];saveCfg();renderDashTable();syncDashStats();showToast(`Site override removed`);}));
  }

  function syncDashStats(){
    if(!dashEl)return;
    dashEl.querySelector('#_st0').textContent=cfg._toggles||0;
    dashEl.querySelector('#_st1').textContent=Object.keys(cfg.sites).length;
    const excTotal=Object.values(cfg.sites).reduce((n,s)=>n+(s.excluded?.length||0),0);
    dashEl.querySelector('#_st2').textContent=excTotal;
    const cssTotal=Object.values(cfg.sites).filter(s=>s.customCSS&&s.customCSS.trim()).length;
    const s3=dashEl.querySelector('#_st3');if(s3)s3.textContent=cssTotal;
  }

  // Human-readable labels for each palette key
  const PAL_FIELDS=[
    {key:'bg',    label:'Background'},
    {key:'bg1',   label:'Background 2'},
    {key:'bg2',   label:'Background 3'},
    {key:'surf',  label:'Surface'},
    {key:'surf1', label:'Surface 2'},
    {key:'border',label:'Border'},
    {key:'text',  label:'Text'},
    {key:'muted', label:'Muted text'},
    {key:'link',  label:'Link'},
    {key:'linkH', label:'Link hover'},
    {key:'inBg',  label:'Input bg'},
    {key:'codeBg',label:'Code bg'},
  ];

  function createNewCustomPalette(){
    const existing=Object.keys(cfg.customPalettes||{});
    let n=1; while(existing.includes(`Custom ${n}`))n++;
    const name=`Custom ${n}`;
    cfg.customPalettes=cfg.customPalettes||{};
    cfg.customPalettes[name]={...PALETTES.default};
    handleSetPalette(`custom:${name}`);
    saveCfg();
    injectSwatchStyles();
    buildPanel();
    showToast(`Created: ${name}`,'ok');
    return name;
  }

  function renderCustomPaletteList(activeName){
    if(!dashEl)return;
    const list=dashEl.querySelector('#_cplist');
    if(!list)return;
    const palettes=cfg.customPalettes||{};
    const names=Object.keys(palettes);
    if(!names.length){list.innerHTML='<div class="udm-cp-empty">No custom palettes yet — click "+ New palette" to create one.</div>';
      const editor=dashEl.querySelector('#_cpeditor');if(editor)editor.classList.remove('open');return;}
    list.innerHTML=names.map(name=>{
      const pal=palettes[name];
      const key=`custom:${name}`;
      const isActive=name===activeName;
      const dotCls='udm-sw-custom-'+name.replace(/[^a-zA-Z0-9_-]/g,'_');
      return `<div class="cped-item${isActive?' active':''}" data-cpn="${name}">
        <div class="cped-dot ${dotCls}"></div>
        <span class="cped-iname">${name}</span>
        <div class="cped-btn-area">
          <button class="cped-ibtn" data-cpedit="${name}">Edit</button>
          <button class="cped-ibtn" data-cpuse="${name}">${cfg.palette===key?'✓ Active':'Use'}</button>
          <button class="cped-ibtn danger" data-cpdel="${name}">✕</button>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-cpedit]').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const name=btn.dataset.cpedit;
      list.querySelectorAll('.cped-item').forEach(el=>el.classList.toggle('active',el.dataset.cpn===name));
      renderCustomPaletteEditor(name);
    }));
    list.querySelectorAll('[data-cpuse]').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const name=btn.dataset.cpuse;
      handleSetPalette(`custom:${name}`);
      syncDashFromState();
      renderCustomPaletteList(name);
    }));
    list.querySelectorAll('[data-cpdel]').forEach(btn=>btn.addEventListener('click',e=>{
      e.stopPropagation();
      const name=btn.dataset.cpdel;
      // Inline confirmation — avoid confirm() which gets suppressed by many sites
      const item=list.querySelector(`[data-cpn="${name}"]`);
      if(!item)return;
      // If already showing confirm row, execute delete
      if(item.querySelector('.cped-confirm')){
        delete cfg.customPalettes[name];
        if(cfg.palette===`custom:${name}`)handleSetPalette('default');
        for(const h of Object.keys(cfg.sites||{})){if(cfg.sites[h].palette===`custom:${name}`)delete cfg.sites[h].palette;}
        saveCfg();injectSwatchStyles();buildPanel();syncDashFromState();showToast(`Deleted: ${name}`);
        const editor=dashEl.querySelector('#_cpeditor');if(editor)editor.classList.remove('open');
        return;
      }
      // First click: replace buttons with confirm row
      const btnArea=item.querySelector('.cped-btn-area');
      if(btnArea){
        btnArea.innerHTML=`<span class="cped-confirm udm-del-confirm">Delete?</span><button class="cped-ibtn udm-del-yes" data-cpdel="${name}">Yes</button><button class="cped-ibtn cped-cancel">No</button>`;
        btnArea.querySelector('.cped-cancel').onclick=()=>renderCustomPaletteList(cfg.palette?.startsWith('custom:')?cfg.palette.slice(7):null);
        // Wire the new Yes button with the same handler recursively
        btnArea.querySelector('[data-cpdel]').onclick=e2=>{
          e2.stopPropagation();
          delete cfg.customPalettes[name];
          if(cfg.palette===`custom:${name}`)handleSetPalette('default');
          for(const h of Object.keys(cfg.sites||{})){if(cfg.sites[h].palette===`custom:${name}`)delete cfg.sites[h].palette;}
          saveCfg();injectSwatchStyles();buildPanel();syncDashFromState();showToast(`Deleted: ${name}`);
          const editor=dashEl.querySelector('#_cpeditor');if(editor)editor.classList.remove('open');
        };
      }
    }));
  }

  function renderCustomPaletteEditor(name){
    if(!dashEl)return;
    const editor=dashEl.querySelector('#_cpeditor');
    if(!editor)return;
    const cp=(cfg.customPalettes||{})[name];
    if(!cp){editor.classList.remove('open');return;}
    editor.classList.add('open');
    // Populate name field
    const nameEl=dashEl.querySelector('#_cpename');
    if(nameEl)nameEl.value=name;
    // Rename button
    const renBtn=dashEl.querySelector('#_cperename');
    if(renBtn){
      renBtn.onclick=()=>{
        const newName=nameEl?.value?.trim();
        if(!newName||newName===name){showToast('Enter a different name');return;}
        if((cfg.customPalettes||{})[newName]){showToast('A palette with that name already exists','warn');return;}
        cfg.customPalettes[newName]=cfg.customPalettes[name];
        delete cfg.customPalettes[name];
        if(cfg.palette===`custom:${name}`)cfg.palette=`custom:${newName}`;
        for(const h of Object.keys(cfg.sites||{})){if(cfg.sites[h].palette===`custom:${name}`)cfg.sites[h].palette=`custom:${newName}`;}
        saveCfg();injectSwatchStyles();buildPanel();syncDashFromState();renderCustomPaletteList(newName);renderCustomPaletteEditor(newName);
        showToast(`Renamed to: ${newName}`,'ok');
      };
    }
    // Seed buttons
    editor.querySelectorAll('[data-from]').forEach(btn=>{
      btn.onclick=()=>{
        cfg.customPalettes[name]={...PALETTES[btn.dataset.from]||PALETTES.default};
        saveCfg();injectSwatchStyles();
        if(computeEnabled()&&cfg.palette===`custom:${name}`){removeDarkMode();applyDarkMode();}
        renderCustomPaletteEditor(name);
        renderCustomPaletteList(name);
        showToast(`Seeded from ${btn.dataset.from}`);
      };
    });
    // Color grid
    const grid=dashEl.querySelector('#_cpgrid');
    if(!grid)return;
    grid.innerHTML=PAL_FIELDS.map(({key,label})=>{
      const val=cp[key]||'#000000';
      const hex=val.startsWith('#')?val:'#000000';
      return `<div class="cped-field"><input type="color" id="_cp_${key}" value="${hex}" data-cpk="${key}" data-cpn="${name}"><label for="_cp_${key}">${label}</label><span class="cped-hex" id="_cph_${key}">${hex}</span></div>`;
    }).join('');
    grid.querySelectorAll('[data-cpk]').forEach(inp=>{
      const updateColor=()=>{
        const k=inp.dataset.cpk, pName=inp.dataset.cpn, v=inp.value;
        if(!cfg.customPalettes[pName])return;
        cfg.customPalettes[pName][k]=v;
        const hexEl=dashEl.querySelector(`#_cph_${k}`);if(hexEl)hexEl.textContent=v;
        // Update swatch CSS (background changed — regenerate injected stylesheet)
        if(k==='bg'){injectSwatchStyles();}
        saveCfg();
        if(computeEnabled()&&cfg.palette===`custom:${pName}`){removeDarkMode();applyDarkMode();}
        buildPanel();
      };
      inp.addEventListener('input',updateColor);
      inp.addEventListener('change',updateColor);
    });
  }

  function wireDash(){
    if(!dashEl)return;
    const D=id=>dashEl.querySelector(id);
    const on=(id,ev,fn)=>D(id).addEventListener(ev,fn);

    on('#_dc','click',closeDashboard);
    dashEl.addEventListener('click',e=>{if(e.target===dashEl)closeDashboard();});

    // Global toggles
    on('#_ge','change',()=>{cfg.enabled=D('#_ge').checked;cfg._toggles=(cfg._toggles||0)+1;saveCfg();if(computeEnabled())applyDarkMode();else removeDarkMode();updatePanel();syncDashStats();showToast(`Dark mode ${cfg.enabled?'on':'off'}`,cfg.enabled?'ok':'warn');});
    on('#_gs','change',()=>{cfg.strategy=D('#_gs').value;saveCfg();showToast(`Global default strategy: ${cfg.strategy}`);});
    on('#_ghn','change',()=>{cfg.honourNative=D('#_ghn').checked;_nativeDarkCache=null;saveCfg();showToast(`Honour native dark: ${cfg.honourNative?'on':'off'}`);});
    on('#_gos','change',()=>{cfg.osSync=D('#_gos').checked;saveCfg();if(computeEnabled())applyDarkMode();else removeDarkMode();updatePanel();showToast(`OS sync: ${cfg.osSync?'on':'off'}`);});
    on('#_gad','change',()=>{cfg.autoDetect=D('#_gad').checked;_nativeDarkCache=null;saveCfg();showToast(`Auto-detect: ${cfg.autoDetect?'on':'off'}`);});

    // New custom palette button
    const cpNewBtn=D('#_cpnew');
    if(cpNewBtn)cpNewBtn.addEventListener('click',()=>{
      const name=createNewCustomPalette();
      D('#_cped').classList.add('open');
      renderCustomPaletteList(name);
      renderCustomPaletteEditor(name);
      syncDashFromState();
    });

    // Sliders
    // Dashboard sliders set global defaults (not per-site)
    const sl=(id,valId,key)=>D(id).addEventListener('input',function(){
      D(valId).textContent=this.value+'%';
      cfg[key]=+this.value;
      _adjSave();
      if(isDarkActive()){
        if(['warmth','brightness','contrast'].includes(key))applyWarmth();
        if(key==='imgDim')injectStyle('__udm_dim__',imgDimCSS(+this.value));
        if(IS_PDF){const _p=getActivePalette();injectStyle('__udm_pdf__',buildPDFCSS(_p,computePalette(),computeWarmth(),computeBrightness(),computeContrast()));}
      }
    });
    sl('#_aw','#_awv','warmth');sl('#_ab','#_abv','brightness');sl('#_ac','#_acv','contrast');sl('#_ad','#_adv','imgDim');
    D('#_abd').addEventListener('input',function(){D('#_abdv').textContent=this.value+'%';cfg.bgDim=+this.value;_adjSave();if(isDarkActive()){if(+this.value>0)injectStyle('__udm_bgdim__',bgDimCSS(+this.value));else removeStyle('__udm_bgdim__');}});
    D('#_atr').addEventListener('input',function(){D('#_atrv').textContent=this.value+'ms';cfg.transition=+this.value;_adjSave();});
    // Radius: global write + live refresh
    D('#_ar').addEventListener('input',function(){
      D('#_arv').textContent=this.value+'px';
      cfg.radius=+this.value;
      _adjSave();
      refreshRadius();
    });

    // Schedule
    on('#_sa','change',()=>{cfg.schedule.active=D('#_sa').checked;saveCfg();showToast(`Schedule: ${cfg.schedule.active?'active':'inactive'}`);});
    on('#_sf','change',()=>{cfg.schedule.from=D('#_sf').value;saveCfg();showToast(`Schedule from: ${cfg.schedule.from}`);});
    on('#_st','change',()=>{cfg.schedule.to=D('#_st').value;saveCfg();showToast(`Schedule to: ${cfg.schedule.to}`);});

    // Add site
    const doAdd=()=>{
      const raw=D('#_sai').value.trim().replace(/^(https?:\/\/)?(www\.)?/,'').replace(/\/.*/,'');
      if(!raw){showToast('Enter a hostname');return;}
      if(cfg.sites[raw]){showToast(`${raw} already exists`);return;}
      cfg.sites[raw]={enabled:true,strategy:'',excluded:[]};
      D('#_sai').value='';saveCfg();renderDashTable();syncDashStats();showToast(`Added: ${raw}`);
    };
    on('#_sab','click',doAdd);
    D('#_sai').addEventListener('keydown',e=>{if(e.key==='Enter')doAdd();});

    // Copy JSON
    on('#_bcj','click',()=>{
      const text=JSON.stringify(cfg,null,2);
      if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>showToast('Settings JSON copied','ok'));}
      else{GM_setClipboard(text);showToast('Settings JSON copied','ok');}
    });

    // Import JSON
    on('#_bij','click',()=>{D('#_ibox').classList.toggle('open');if(D('#_ibox').classList.contains('open')){D('#_ita').value='';D('#_ita').focus();}});
    on('#_ican','click',()=>D('#_ibox').classList.remove('open'));
    on('#_iapp','click',()=>{
      try{Object.assign(cfg,JSON.parse(D('#_ita').value.trim()));saveCfg();D('#_ibox').classList.remove('open');syncDashFromState();if(computeEnabled()){removeDarkMode();applyDarkMode();}updatePanel();showToast('Settings imported','ok');}
      catch{showToast('Invalid JSON — check and retry','err');}
    });

    // Reset to defaults
    on('#_brd','click',()=>{
      cfg=Object.assign({},DEFAULT_CFG);saveCfg();syncDashFromState();if(computeEnabled()){removeDarkMode();applyDarkMode();}updatePanel();showToast('Settings reset to defaults','ok');
    });

    // Clear sites
    on('#_bcs','click',()=>{
      if(!Object.keys(cfg.sites).length){showToast('No sites to clear');return;}
      cfg.sites={};saveCfg();renderDashTable();syncDashStats();showToast('All site overrides cleared');
    });

    // Keyboard close
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){closeDashboard();document.removeEventListener('keydown',esc);}});
  }

  // Returns all palette keys (built-in + custom) for cycle operations.
  // Custom palette keys use the "custom:Name" format.
  function allPaletteKeys(){
    const builtIn=Object.keys(PALETTES);
    const custom=Object.keys(cfg.customPalettes||{}).map(n=>`custom:${n}`);
    return [...builtIn,...custom];
  }

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────

  document.addEventListener('keydown',e=>{
    if(!e.altKey||!e.shiftKey)return;
    const k=e.key;
    if(k==='D'){e.preventDefault();handleToggle();}
    if(k==='P'){e.preventDefault();togglePanel();}
    if(k==='N'){e.preventDefault();cycleStrategy();}
    if(k==='E'){e.preventDefault();startPicker();}
    if(k==='M'){e.preventDefault();dashEl?closeDashboard():openDashboard();}
    if(k==='K'){e.preventDefault();const pal=allPaletteKeys();const next=pal[(pal.indexOf(computePalette())+1)%pal.length];handleSetPalette(next);}
  },true);

  // ─── GM MENU ─────────────────────────────────────────────────────────────────

  GM_registerMenuCommand('🌑 Toggle',            handleToggle);
  GM_registerMenuCommand('⚙️ Panel',              ()=>togglePanel(true));
  GM_registerMenuCommand('📊 Dashboard',          openDashboard);
  GM_registerMenuCommand('🎯 Element Picker',     startPicker);
  GM_registerMenuCommand('📋 Export',             exportSettings);
  GM_registerMenuCommand('📐 Cycle Strategy',     cycleStrategy);
  GM_registerMenuCommand('🎨 Cycle Palette',      ()=>{const pal=allPaletteKeys();const next=pal[(pal.indexOf(computePalette())+1)%pal.length];handleSetPalette(next);});
  // Note: custom palettes are dynamic (created at runtime) so they can't be
  // registered as GM menu entries at boot — use the panel or dashboard instead.

  // ─── PUBLIC API ───────────────────────────────────────────────────────────────

  window.__udm__={toggle:handleToggle,setStrategy:handleSetStrategy,setPalette:handleSetPalette,unpinPalette:unpinSitePalette,cyclePalette:()=>{const pal=allPaletteKeys();handleSetPalette(pal[(pal.indexOf(computePalette())+1)%pal.length]);},setWarmth:v=>handleAdj('warmth',v),setBrightness:v=>handleAdj('brightness',v),setContrast:v=>handleAdj('contrast',v),setImgDim:v=>handleAdj('imgDim',v),setBgDim:v=>handleAdj('bgDim',v),setRadius:v=>handleAdj('radius',v),cycleStrategy,openPanel:()=>togglePanel(true),closePanel:()=>togglePanel(false),openDashboard,closeDashboard,startPicker,exportSettings,importSettings,resetSite,cfg:()=>cfg,host:()=>HOST,palettes:allPaletteKeys(),patches:Object.keys(SITE_PATCHES),strategies:['variables','override','heuristic','layer','selective','invert'],buildRadiusScale,computeEnabled,computeStrategy,computePalette};

  // ─── BOOT ─────────────────────────────────────────────────────────────────────
  // Early paint: inject base colours immediately via GM_addStyle (CSP-safe).
  // This prevents the white flash before boot() fires on DOMContentLoaded.
  if(computeEnabled()){
    const p=getActivePalette();
    const radii=buildRadiusScale(computeRadius());
    const earlyCSS=IS_PDF
      ?`html,body{background:${p.bg}!important;margin:0!important;padding:0!important}`
      :`:root{${p2v(p)};${radii.vars}}html,body{background-color:${p.bg}!important;color:${p.text}!important}`;
    const earlyEl=GM_addStyle(earlyCSS);
    if(earlyEl)earlyEl.id='__udm_early__';
  }

  const boot=()=>{
    // Clear the early-paint style — applyDarkMode() injects proper __udm_vars__ etc.
    const earlyEl=document.getElementById('__udm_early__');if(earlyEl)earlyEl.textContent='';
    injectSwatchStyles(); // inject swatch colour classes (CSP-safe via GM_addStyle)
    if(computeEnabled()){applyDarkMode();startStyleGuardian();}
    if(!IS_PDF)patchIframes();
    setInterval(()=>{const on=computeEnabled(),is=document.documentElement.hasAttribute('data-udm');if(on&&!is)applyDarkMode();else if(on&&is)reassertStyles();if(!on&&is)removeDarkMode();},30000);
    window.addEventListener('load',()=>{
      if(!IS_PDF&&computeEnabled()){
        const strat=computeStrategy();
        // Full re-apply for strategies that depend on the complete DOM/CSSOM
        if(strat==='override'||strat==='heuristic'){removeDarkMode();applyDarkMode();}
        // For all strategies: re-assert cascade position after page CSS settles
        reassertStyles();
        // Slow sites keep loading CSS long after window.load — keep re-asserting
        // at increasing intervals for the first 8 seconds
        [800,2000,4000,8000].forEach(ms=>setTimeout(()=>{
          if(!computeEnabled())return;
          reassertStyles();
          // Also re-run heuristic/override on very late DOM additions
          if(strat==='heuristic'&&document.body)applyHeuristic(document.body);
        },ms));
      }
      if(!IS_PDF)patchIframes();
    },{once:true});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  // Flush any pending debounced save before the page unloads
  window.addEventListener('pagehide',()=>_adjSave.cancel());

  // React to OS theme changes when osSync is active
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{
    if(!cfg.osSync)return;
    const on=computeEnabled(),is=document.documentElement.hasAttribute('data-udm');
    if(on&&!is)applyDarkMode(); if(!on&&is)removeDarkMode(); updatePanel();
  });
  // Re-check schedule when tab becomes visible
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)return;
    const on=computeEnabled(),is=document.documentElement.hasAttribute('data-udm');
    if(on&&!is)applyDarkMode(); if(!on&&is)removeDarkMode();
  });

})();