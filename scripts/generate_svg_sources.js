import fs from 'fs';
import path from 'path';

const outDir = 'd:/node_projects/SHARE2GO/store_assets/source_svg';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const screens = [
  {
    id: 1,
    title: 'Share Rides. Split Costs.',
    sub: 'Smart daily carpooling & bikepooling for modern commuters.',
    accent: '#FFC107',
    screenTitle: 'SHARE2GO',
    screenSubtitle: '📍 Hitech City, Hyderabad',
    tag1: '🚗 Carpool',
    tag2: '🏍️ Bikepool',
    details: 'Mindspace IT Park ➔ Financial District Waverock',
    card: 'Rahul Verma • ⭐ 4.9 • Honda City • ₹120'
  },
  {
    id: 2,
    title: 'Find Your Perfect Route',
    sub: 'Real-time route matching with verified co-passengers in seconds.',
    accent: '#059669',
    screenTitle: 'Route Search',
    screenSubtitle: '⚡ Fastest: 12.4 km • 24 min',
    tag1: '🚗 Cars Only',
    tag2: '⚡ Instant Book',
    details: 'Interactive Route Map • Hitech City to Waverock',
    card: 'Vikram Sharma • ⭐ 4.95 • Creta • ₹140'
  },
  {
    id: 3,
    title: 'Turn Empty Seats into Savings',
    sub: 'Publish your daily route, set fares & offset fuel expenses.',
    accent: '#2563EB',
    screenTitle: 'Host a Trip • Offer Seats',
    screenSubtitle: 'Honda City (TS 09 EQ 4092) • 4 Seats',
    tag1: '🚗 Car (4 seats)',
    tag2: '🏍️ Bike (1 seat)',
    details: 'Kondapur RTO ➔ Gachibowli ➔ Raheja Mindspace',
    card: 'Recommended Fare: ₹130 / seat • Earn ₹390'
  },
  {
    id: 4,
    title: 'Live GPS Tracking & Shake SOS',
    sub: 'Turn-by-turn navigation, secure ride OTPs & instant emergency safety.',
    accent: '#EF4444',
    screenTitle: 'Ride In Progress • ETA 14 mins',
    screenSubtitle: 'Driver: Arjun Reddy • Kia Seltos',
    tag1: 'OTP: 4892',
    tag2: '🛡️ Emergency SOS',
    details: '↱ In 250m, Turn Right onto Financial District Rd',
    card: 'Emergency Shake SOS • Live Family Tracking Active'
  },
  {
    id: 5,
    title: 'Crystal-Clear In-App Calling',
    sub: 'End-to-end encrypted VoIP calls without sharing personal phone numbers.',
    accent: '#25D366',
    screenTitle: 'Priya Sharma',
    screenSubtitle: '📞 SHARE2GO audio call • 00:28',
    tag1: '🔒 E2E Encrypted',
    tag2: '00:28 Ongoing',
    details: 'High-Definition Audio • Loudspeaker / Mute Controls',
    card: 'No Phone Numbers Shared • Complete Commuter Privacy'
  },
  {
    id: 6,
    title: 'Seamless In-Ride Messaging',
    sub: 'Coordinate pickup spots with instant chat and smart quick replies.',
    accent: '#4F46E5',
    screenTitle: 'Suresh Kumar',
    screenSubtitle: 'Online • Carpooling in Honda City',
    tag1: 'I am here! 📍',
    tag2: '2 mins away',
    details: 'Hi! I have reached Mindspace Gate 2 near Starbucks.',
    card: 'Instant Chat • Quick Chips • Delivery Status ✓✓'
  },
  {
    id: 7,
    title: 'Connect with Travel Buddies',
    sub: 'Discover verified commuters matching your route and travel vibe.',
    accent: '#F59E0B',
    screenTitle: 'Stranger Mode • Travel Vibes',
    screenSubtitle: 'Neha Kapoor, 26 • UI/UX Designer',
    tag1: '🎧 Podcasts',
    tag2: '☕ Coffee',
    details: 'Jubilee Hills ➔ Cyber Towers (9 AM - 6 PM)',
    card: 'Commute Vibe Match • Connect & Pool Seats'
  },
  {
    id: 8,
    title: '100% Verified Trust & Safety',
    sub: 'Govt ID & DL verification, corporate commuter clubs & total peace of mind.',
    accent: '#06B6D4',
    screenTitle: 'Trust & Safety Hub',
    screenSubtitle: '100% Identity Verified Commuters',
    tag1: 'Aadhaar Verified',
    tag2: 'DL Verified',
    details: 'Corporate Clubs: Microsoft, Google, Amazon, Infosys',
    card: '24/7 Shake SOS • Safety Score 99.4% • Women-Only'
  }
];

screens.forEach((s) => {
  const num = String(s.id).padStart(2, '0');
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="540" y1="0" x2="540" y2="1920" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${s.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${s.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="phoneShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)"/>
  <ellipse cx="540" cy="1050" rx="420" ry="500" fill="url(#glowGrad)"/>

  <!-- Brand Tag -->
  <text x="540" y="85" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="22" font-weight="700" fill="#FFC107" letter-spacing="4">✦  S H A R E 2 G O  ✦</text>

  <!-- Marketing Headline & Subcaption -->
  <text x="540" y="155" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF">${s.title}</text>
  <text x="540" y="240" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="26" font-weight="400" fill="#94A3B8">${s.sub}</text>

  <!-- Phone Mockup Container -->
  <g filter="url(#phoneShadow)">
    <!-- Titanium Bezel -->
    <rect x="97" y="360" width="886" height="1520" rx="76" fill="#1A2230" stroke="#334155" stroke-width="3"/>
    
    <!-- Phone Screen Display Area -->
    <g clip-path="url(#screenClip)">
      <clipPath id="screenClip">
        <rect x="117" y="380" width="846" height="1480" rx="56"/>
      </clipPath>
      
      <!-- Screen Background -->
      <rect x="117" y="380" width="846" height="1480" fill="#0B0F17"/>

      <!-- Status Bar -->
      <text x="175" y="425" font-family="Segoe UI, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">9:41</text>
      <!-- Punch Hole Camera -->
      <circle cx="540" cy="415" r="14" fill="#000000"/>
      <!-- Battery -->
      <rect x="850" y="405" width="48" height="22" rx="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="854" y="409" width="34" height="14" rx="2" fill="#10B981"/>

      <!-- App Screen Header -->
      <text x="175" y="495" font-family="Segoe UI, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF">${s.screenTitle}</text>
      <text x="175" y="535" font-family="Segoe UI, sans-serif" font-size="26" font-weight="500" fill="${s.accent}">${s.screenSubtitle}</text>

      <!-- App Feature Card 1 -->
      <rect x="157" y="580" width="766" height="420" rx="24" fill="#151D2A" stroke="#263346" stroke-width="2"/>
      
      <!-- Tags inside card -->
      <rect x="187" y="615" width="220" height="52" rx="12" fill="${s.accent}" fill-opacity="0.2"/>
      <text x="297" y="650" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="24" font-weight="700" fill="${s.accent}">${s.tag1}</text>
      
      <rect x="427" y="615" width="220" height="52" rx="12" fill="#1E293B"/>
      <text x="537" y="650" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="24" font-weight="600" fill="#94A3B8">${s.tag2}</text>

      <text x="187" y="730" font-family="Segoe UI, sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${s.details}</text>
      
      <rect x="187" y="780" width="706" height="80" rx="14" fill="#1E293B"/>
      <text x="217" y="830" font-family="Segoe UI, sans-serif" font-size="26" font-weight="500" fill="#FFC107">⚡ Verified Feature Showcase</text>

      <rect x="187" y="890" width="706" height="75" rx="16" fill="${s.accent}"/>
      <text x="540" y="938" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="30" font-weight="800" fill="#000000">Proceed in SHARE2GO</text>

      <!-- App Feature Card 2 -->
      <rect x="157" y="1035" width="766" height="240" rx="24" fill="#151D2A" stroke="#263346" stroke-width="2"/>
      <text x="187" y="1085" font-family="Segoe UI, sans-serif" font-size="32" font-weight="700" fill="#FFFFFF">Verified Commuter Details</text>
      <text x="187" y="1130" font-family="Segoe UI, sans-serif" font-size="26" font-weight="500" fill="#94A3B8">${s.card}</text>

      <!-- Bottom Navigation Bar inside phone -->
      <rect x="117" y="1740" width="846" height="120" fill="#0B0F17" stroke="#1E293B" stroke-width="1"/>
      <rect x="440" y="1835" width="200" height="6" rx="3" fill="#64748B"/>
    </g>
  </g>
</svg>
`;

  const filePath = path.join(outDir, `screenshot_${num}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf8');
});

console.log('Successfully generated 8 editable SVG source files in store_assets/source_svg!');

