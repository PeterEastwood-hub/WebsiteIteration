import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aboutPath = path.join(__dirname, '..', 'site-mirror', 'about.html');

const OLD_FIGURE =
  '<figure><img alt="Two Venn Diagrams" loading="lazy" width="1326" height="642" decoding="async" data-nimg="1" class="mb-6 w-full" style="color:transparent" srcset="image_272 1x, image_247 2x" src="image_247"><figcaption class="pt-3 md:pt-6 md:pr-6 lg:pt-8 lg:pr-8 font-sans text-sm lg:text-[15px] max-w-[95vw] md:max-w-[450px]">We combine digital engineering, design and strategy to build code and capability for sustained business impact.</figcaption></figure>';

const NEW_FIGURE = `<figure id="orbital-convergence" class="orbital-convergence-figure mb-6 w-full max-w-[1600px] mx-auto" aria-label="Orbital convergence diagram"><div class="orbital-stage"><div class="orbital-guides" aria-hidden="true"><svg viewBox="0 0 600 600" width="600" height="600"><circle class="oc-orbit oc-orbit-teal" cx="300" cy="300" r="250" stroke="#00D4AA"/><circle class="oc-orbit oc-orbit-purple" cx="300" cy="300" r="250" stroke="#8B5CF6"/><circle class="oc-orbit oc-orbit-blue" cx="300" cy="300" r="250" stroke="#0EA5E9"/></svg></div><div class="orbital-pulse-layer" aria-hidden="true"><div class="orbital-pulse-cluster"><div class="orbital-pulse-ring" style="--ring-c:#00D4AA;--ring-delay:0s"></div><div class="orbital-pulse-ring" style="--ring-c:#8B5CF6;--ring-delay:1.6s"></div><div class="orbital-pulse-ring" style="--ring-c:#0EA5E9;--ring-delay:3.2s"></div></div></div><div class="orbital-core-wrap"><div class="orbital-core-glow"><div class="orbital-core-inner"><svg class="oc-zap" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg><span class="oc-ai">AI</span><span class="oc-sub" aria-label="Native Engineering"><span class="oc-sub-line">Native</span><span class="oc-sub-line">Engineering</span></span></div></div></div><div class="orbital-node" style="--tx: var(--oc-r); --ty: 0px; --node-delay: 0s; --node-color: #00D4AA"><div class="orbital-node-card" style="--node-color:#00D4AA"><div class="orbital-icon-wrap" style="background:rgba(0,212,170,0.15)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg></div><p class="orbital-node-title">Build and evolve enterprise digital products</p></div></div><div class="orbital-node" style="--tx: calc(-0.5 * var(--oc-r)); --ty: calc(0.866 * var(--oc-r)); --node-delay: 0.3s; --node-color: #8B5CF6"><div class="orbital-node-card" style="--node-color:#8B5CF6"><div class="orbital-icon-wrap" style="background:rgba(139,92,246,0.15)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M20 15h2M17.66 7.34l1.41-1.41M5.93 18.07l1.41-1.41M18.07 5.93l1.41-1.41M6.34 17.66l-1.41 1.41"/></svg></div><p class="orbital-node-title">Modernise legacy systems for AI-Readiness</p></div></div><div class="orbital-node" style="--tx: calc(-0.5 * var(--oc-r)); --ty: calc(-0.866 * var(--oc-r)); --node-delay: 0.6s; --node-color: #0EA5E9"><div class="orbital-node-card" style="--node-color:#0EA5E9"><div class="orbital-icon-wrap" style="background:rgba(14,165,233,0.15)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg></div><p class="orbital-node-title">Design and build agents and agentic workflows for scale</p></div></div></div><figcaption class="pt-3 md:pt-6 md:pr-6 lg:pt-8 lg:pr-8 font-sans text-sm lg:text-[15px] max-w-[95vw] md:max-w-[450px]">We combine digital engineering, design and strategy to build code and capability for sustained business impact.</figcaption></figure>`;

const HEAD_SNIPPET =
  '</style><link rel="stylesheet" href="css/orbital-convergence.css"><script src="js/orbital-convergence.js" defer></script></head>';

let html = fs.readFileSync(aboutPath, 'utf8');

if (html.includes('id="orbital-convergence"')) {
  console.log('about.html already has orbital convergence — skip.');
  process.exit(0);
}

if (!html.includes(OLD_FIGURE)) {
  console.error('Expected Venn figure markup not found — about.html may have changed.');
  process.exit(1);
}
html = html.replace(OLD_FIGURE, NEW_FIGURE);
if (!html.includes('orbital-convergence.css')) {
  if (!html.includes('</style></head>')) {
    console.error('Could not find </style></head> to inject assets.');
    process.exit(1);
  }
  html = html.replace('</style></head>', HEAD_SNIPPET);
}
fs.writeFileSync(aboutPath, html);
console.log('Patched', aboutPath);
