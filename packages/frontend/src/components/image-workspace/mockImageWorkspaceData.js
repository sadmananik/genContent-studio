export const mockImageProject = {
  id: "project-demo-image",
  title: "Social Post: Product Launch",
  category: "Social Media Post",
  type: "Image Project",
  lastUpdated: "Last updated 5 minutes ago",
  saveStatus: "Draft saved"
};

export const demoImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="0.52" stop-color="#ecfeff"/>
      <stop offset="1" stop-color="#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="900" height="600" fill="url(#bg)"/>
  <rect x="72" y="72" width="756" height="456" rx="28" fill="#ffffff" opacity="0.72"/>
  <circle cx="700" cy="178" r="76" fill="#8b5cf6" opacity="0.86"/>
  <circle cx="226" cy="420" r="92" fill="#14b8a6" opacity="0.74"/>
  <path d="M142 180 C286 82 420 260 556 164 C626 116 710 120 790 158" fill="none" stroke="#0f172a" stroke-width="16" stroke-linecap="round" opacity="0.12"/>
  <text x="118" y="174" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#111827">Demo Image</text>
  <text x="122" y="236" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#475569">Edit this generated visual with Fabric.js</text>
</svg>`;
