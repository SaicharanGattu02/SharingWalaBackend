import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const logoPath = 'C:/Users/SIRI/.gemini/antigravity/brain/5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a/.user_uploaded/media_1794429614651_93627ca8.jpg';
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1024px;
    height: 500px;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #070B11;
    color: #FFFFFF;
    position: relative;
  }
  .bg-glow-gold {
    position: absolute;
    width: 600px;
    height: 600px;
    top: -220px;
    right: -120px;
    background: radial-gradient(circle, rgba(255, 193, 7, 0.22) 0%, rgba(255, 193, 7, 0) 70%);
    pointer-events: none;
  }
  .bg-glow-green {
    position: absolute;
    width: 500px;
    height: 500px;
    bottom: -200px;
    left: -100px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0) 70%);
    pointer-events: none;
  }
  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .container {
    position: relative;
    z-index: 10;
    width: 1024px;
    height: 500px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 56px;
  }
  .left-col {
    max-width: 520px;
  }
  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 193, 7, 0.12);
    border: 1px solid rgba(255, 193, 7, 0.38);
    padding: 6px 14px;
    border-radius: 100px;
    margin-bottom: 16px;
  }
  .brand-badge-dot {
    width: 8px;
    height: 8px;
    background: #FFC107;
    border-radius: 50%;
    box-shadow: 0 0 10px #FFC107;
  }
  .brand-badge-text {
    font-size: 12.5px;
    font-weight: 700;
    color: #FFC107;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .brand-title {
    font-size: 54px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -1.5px;
    margin-bottom: 12px;
  }
  .brand-title span {
    background: linear-gradient(135deg, #FFC107 20%, #FFA000 80%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .brand-subtitle {
    font-size: 18.5px;
    font-weight: 600;
    color: #94A3B8;
    line-height: 1.4;
    margin-bottom: 24px;
  }
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(22, 33, 50, 0.85);
    border: 1px solid rgba(51, 65, 85, 0.8);
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #E2E8F0;
    backdrop-filter: blur(8px);
  }
  .right-col {
    position: relative;
    width: 400px;
    height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-halo {
    position: absolute;
    width: 260px;
    height: 260px;
    background: radial-gradient(circle, rgba(255, 193, 7, 0.32) 0%, rgba(255, 193, 7, 0) 70%);
    border-radius: 50%;
  }
  .main-logo-card {
    position: relative;
    width: 190px;
    height: 190px;
    background: #0B131F;
    border-radius: 40px;
    border: 2.5px solid rgba(255, 193, 7, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.7), 0 0 45px rgba(255, 193, 7, 0.28);
    z-index: 5;
    padding: 16px;
  }
  .main-logo-card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 28px;
  }
  .floating-card-1 {
    position: absolute;
    top: 20px;
    right: -10px;
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(255, 193, 7, 0.45);
    border-radius: 18px;
    padding: 12px 18px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 193, 7, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .fc-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #FFFFFF;
  }
  .fc-subtitle {
    font-size: 11.5px;
    color: #10B981;
    font-weight: 600;
  }
  .floating-card-2 {
    position: absolute;
    bottom: 20px;
    left: -5px;
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(16, 185, 129, 0.45);
    border-radius: 18px;
    padding: 12px 18px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .badge-icon-green {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .fc-title-white {
    font-size: 13.5px;
    font-weight: 700;
    color: #FFFFFF;
  }
  .fc-subtitle-gold {
    font-size: 11.5px;
    color: #FFC107;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="bg-glow-gold"></div>
  <div class="bg-glow-green"></div>
  <div class="grid-pattern"></div>

  <div class="container">
    <div class="left-col">
      <div class="brand-badge">
        <div class="brand-badge-dot"></div>
        <div class="brand-badge-text">Verified Daily Carpooling</div>
      </div>
      <h1 class="brand-title">SHARE<span>2GO</span></h1>
      <p class="brand-subtitle">Share Empty Seats. Split Fuel Costs. Commute with Verified Peers.</p>
      <div class="pill-row">
        <div class="pill">🛡️ 100% Verified Profiles</div>
        <div class="pill">💸 Save Up To 70% Fuel</div>
        <div class="pill">🔒 Private In-App Calling</div>
        <div class="pill">👩 Women-Only Option</div>
        <div class="pill">🚗 Daily Office Rides</div>
      </div>
    </div>

    <div class="right-col">
      <div class="logo-halo"></div>

      <div class="floating-card-1">
        <div class="badge-icon">⚡</div>
        <div>
          <div class="fc-title">Hitech City ➔ Fin. District</div>
          <div class="fc-subtitle">2 Seats Available • ₹80 / seat</div>
        </div>
      </div>

      <div class="main-logo-card">
        <img src="data:image/jpeg;base64,${logoBase64}" alt="SHARE2GO Logo" />
      </div>

      <div class="floating-card-2">
        <div class="badge-icon-green">🛡️</div>
        <div>
          <div class="fc-title-white">Corporate & Govt ID Verified</div>
          <div class="fc-subtitle-gold">Safe • Transparent • Zero Surge</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const outHtml = path.resolve('store_assets/feature_graphic.html');
const outPng = path.resolve('store_assets/android/feature_graphic.png');
const brainPng = path.resolve('C:/Users/SIRI/.gemini/antigravity/brain/5c02b4f5-3492-4cdb-9e00-7ee6cf1e412a/feature_graphic.png');

fs.writeFileSync(outHtml, htmlContent, 'utf-8');
console.log('HTML saved at', outHtml);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fileUrl = 'file:///' + outHtml.replace(/\\/g, '/');

const cmd = `"${edgePath}" --headless --disable-gpu --hide-scrollbars --window-size=1024,500 --screenshot="${outPng}" "${fileUrl}"`;
console.log('Rendering via Headless Edge...');
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(outPng)) {
  fs.copyFileSync(outPng, brainPng);
  const stat = fs.statSync(outPng);
  console.log(`✅ Success! Rendered 1024x500 Feature Graphic: ${outPng} (${stat.size} bytes)`);
} else {
  console.error('Failed to generate PNG screenshot');
}

