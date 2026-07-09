import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#eef7fb",
  panel: "#ffffff",
  ink: "#102331",
  cyan: "#68e1fd",
  cyan2: "#23bcdd",
  red: "#ff6b6b",
  pink: "#ffe8e8",
  line: "rgba(16,35,49,0.10)",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <circle cx="1150" cy="120" r="300" fill="rgba(255,107,107,0.12)"/>
    <circle cx="80" cy="2600" r="300" fill="rgba(35,188,221,0.16)"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="82" y="130" font-family="Courier New, monospace" font-size="30" font-weight="900" letter-spacing="7" fill="${c.cyan2}">BADGE BOOTH</text>
    <text x="80" y="238" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="84" y="310" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${c.red}">${esc(subtitle)}</text>
  `;
}

function badge(x, y, name, role, skill, note, wallet, date) {
  const noteLines = wrap(note, 34).slice(0, 3);
  return `
    <rect x="${x + 452}" y="${y}" width="176" height="154" rx="0" fill="${c.red}"/>
    <rect x="${x}" y="${y + 110}" width="1080" height="1240" rx="42" fill="${c.panel}" stroke="${c.line}" stroke-width="6"/>
    <text x="${x + 62}" y="${y + 230}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="6" fill="${c.cyan2}">BUILDER BADGE</text>
    <text x="${x + 62}" y="${y + 350}" font-family="Arial, sans-serif" font-size="96" font-weight="900" fill="${c.ink}">${esc(name)}</text>
    <rect x="${x + 62}" y="${y + 460}" width="380" height="170" rx="26" fill="${c.ink}"/>
    <text x="${x + 96}" y="${y + 522}" font-family="Courier New, monospace" font-size="22" font-weight="900" fill="white">ROLE</text>
    <text x="${x + 96}" y="${y + 585}" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="white">${esc(role)}</text>
    <rect x="${x + 474}" y="${y + 460}" width="544" height="170" rx="26" fill="${c.cyan}"/>
    <text x="${x + 510}" y="${y + 522}" font-family="Courier New, monospace" font-size="22" font-weight="900" fill="${c.ink}">SKILL</text>
    <text x="${x + 510}" y="${y + 585}" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${c.ink}">${esc(skill)}</text>
    <rect x="${x + 62}" y="${y + 690}" width="956" height="210" rx="26" fill="#f7fcfe" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 96}" y="${y + 756}" font-family="Courier New, monospace" font-size="22" font-weight="900" fill="${c.cyan2}">BADGE NOTE</text>
    ${noteLines.map((line, i) => `<text x="${x + 96}" y="${y + 818 + i * 38}" font-family="Arial, sans-serif" font-size="34" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 62}" y="${y + 960}" width="460" height="190" rx="24" fill="${c.pink}"/>
    <rect x="${x + 558}" y="${y + 960}" width="460" height="190" rx="24" fill="${c.pink}"/>
    <text x="${x + 96}" y="${y + 1026}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.red}">WALLET</text>
    <text x="${x + 96}" y="${y + 1096}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.ink}">${esc(wallet)}</text>
    <text x="${x + 592}" y="${y + 1026}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.red}">STAMPED</text>
    <text x="${x + 592}" y="${y + 1096}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.ink}">${esc(date)}</text>
  `;
}

function panel(x, y, title, body, fill = "#f7fcfe") {
  return `
    <rect x="${x}" y="${y}" width="520" height="220" rx="24" fill="${fill}" stroke="${c.line}" stroke-width="5"/>
    <text x="${x + 34}" y="${y + 74}" font-family="Courier New, monospace" font-size="20" font-weight="900" letter-spacing="5" fill="${c.cyan2}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 128 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Mint your badge.", "Create a public builder identity card on Base.")}
    ${badge(102, 420, "Koala", "Builder", "Base apps", "Shipping small onchain tools and testing mobile UX.", "0x91...a669", "May 18")}
    ${panel(102, 1820, "Use case", "Events, demo desks, creator meetups, and builder profiles.")}
    ${panel(662, 1820, "Public badge", "Name, role, skill, wallet, and timestamp on Base.", c.pink)}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Choose a role.", "Use presets or write your own badge details.")}
    ${panel(102, 420, "Preset", "Creator / Drops", c.pink)}
    ${panel(662, 420, "Action", "Mint on Base")}
    ${badge(102, 760, "Studio Guest", "Creator", "Drops", "Looking for clean ways to launch creator moments on Base.", "0x42...af62", "May 18")}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Load any badge.", "Read a badge by ID after it is minted.")}
    ${badge(102, 420, "Demo Friend", "Reviewer", "Feedback", "Fast reader, honest notes, and useful launch checks.", "0x99...9652", "May 18")}
    ${panel(102, 1820, "Lookup", "Reload a public badge by badge ID.")}
    ${panel(662, 1820, "Receipt", "Open the Base transaction after confirmation.", c.pink)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="424" y="70" width="176" height="170" rx="0" fill="${c.red}"/>
    <rect x="154" y="190" width="716" height="704" rx="78" fill="${c.panel}" stroke="${c.line}" stroke-width="24"/>
    <text x="236" y="360" font-family="Arial, sans-serif" font-size="112" font-weight="900" fill="${c.ink}">BADGE</text>
    <rect x="236" y="450" width="250" height="116" rx="28" fill="${c.ink}"/>
    <rect x="526" y="450" width="262" height="116" rx="28" fill="${c.cyan}"/>
    <rect x="236" y="634" width="552" height="110" rx="26" fill="${c.pink}"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="94" y="154" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="${c.ink}">Badge Booth</text>
    <text x="102" y="246" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.red}">Create a public builder badge on Base.</text>
    ${panel(96, 390, "Use case", "Events, demo desks, creator profiles, and builder intros.")}
    ${panel(96, 662, "Result", "Badge details, wallet, and receipt on Base.", c.pink)}
    ${badge(770, 70, "Koala", "Builder", "Base apps", "Shipping small onchain tools and testing mobile UX.", "0x91...a669", "May 18")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Badge Booth",
    "",
    "App Name: Badge Booth",
    "Tagline: Mint your badge",
    "Description: Create a public builder badge with name, role, skill, note, wallet, and timestamp on Base for events and demos.",
    "",
    "Domain: https://badge-booth.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Generated ${files.length} Base submission assets in ${outDir}`);
