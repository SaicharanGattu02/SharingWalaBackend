// Shareable trip links that open the app when installed, or the Play Store
// when it isn't.
//
//   https://api.sharingwala.com/r/ride/<id>
//
// 1. App installed + Android App Links verified → Android opens the app
//    directly (this page is never loaded).
// 2. Otherwise this page loads and immediately hands off to Chrome's
//    intent:// URL: it opens the app if installed, else goes straight to the
//    Play Store (browser_fallback_url).
// 3. Platforms without intent support (iOS, desktop, some in-app browsers)
//    get a clear page with "Open in app" and "Get it on Google Play" buttons.
import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { findStrangerTrip } from '../stranger/stranger.service.js';

const router = Router();

const PACKAGE = 'com.sharingwala';
const APP_SCHEME = 'sharingwala';
const APP_HOST = 'open';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}&pcampaignid=web_share`;

/**
 * SHA-256 fingerprints of every key that signs the app. Add the
 * **Play App Signing** key from Play Console (Setup → App integrity) via the
 * ANDROID_SHA256_CERT_FINGERPRINTS env var (comma separated) — Play Store
 * installs are signed with that key, not the upload key.
 */
const DEFAULT_FINGERPRINTS = [
  // Upload key (android/app/upload-keystore.jks)
  '55:E0:61:FC:69:78:22:F0:77:85:26:E1:95:75:79:37:00:50:DD:A6:A2:AA:52:EA:8D:AD:77:60:1D:AB:0E:4A',
  // Debug key (local `flutter run` builds)
  'D3:85:BF:39:E4:DF:78:B4:B0:00:CB:B6:A5:81:D7:B1:64:0C:1A:F6:24:42:02:81:F0:5B:D8:DE:1B:E5:45:90',
];

const fingerprints = () => {
  const fromEnv = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...DEFAULT_FINGERPRINTS])];
};

// Android App Links domain verification
router.get('/.well-known/assetlinks.json', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE,
        sha256_cert_fingerprints: fingerprints(),
      },
    },
  ]);
});

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const shortPlace = (p) => String(p || '').split(',')[0].trim();

/** Title/description for the link preview (WhatsApp, Telegram, SMS...). */
const tripPreview = async (id) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id },
      select: { startLocationName: true, endLocationName: true, departureAt: true, availableSeats: true },
    });
    if (ride) {
      const when = ride.departureAt
        ? new Date(ride.departureAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          })
        : '';
      return {
        title: `Trip: ${shortPlace(ride.startLocationName)} → ${shortPlace(ride.endLocationName)}`,
        description: [when, ride.availableSeats ? `${ride.availableSeats} seat(s) available` : '', 'Join on Sharing Wala']
          .filter(Boolean)
          .join(' · '),
      };
    }
  } catch (_) {}
  try {
    const trip = findStrangerTrip(id);
    if (trip) {
      return {
        title: `Trip: ${shortPlace(trip.origin)} → ${shortPlace(trip.destination)}`,
        description: [trip.date, trip.time, 'Join on Sharing Wala'].filter(Boolean).join(' · '),
      };
    }
  } catch (_) {}
  return { title: 'Join this trip on Sharing Wala', description: 'Share rides, split costs, travel together.' };
};

const renderLanding = ({ appPath, title, description, url }) => {
  const playUrl = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`deeplink=${appPath}`)}`;
  const intentUrl =
    `intent://${APP_HOST}${appPath}#Intent;scheme=${APP_SCHEME};package=${PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(playUrl)};end`;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sharing Wala">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta name="twitter:card" content="summary">
<style>
  :root { color-scheme: light dark; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background:#F6F4EF; color:#16181D; display:flex; min-height:100vh; align-items:center; justify-content:center; }
  .card { width:min(420px, calc(100% - 32px)); background:#fff; border-radius:24px; padding:28px 24px;
          box-shadow:0 10px 30px rgba(0,0,0,.08); text-align:center; }
  .logo { width:64px; height:64px; border-radius:18px; background:#14161B; color:#FFC107; display:flex;
          align-items:center; justify-content:center; font-weight:800; font-size:26px; margin:0 auto 14px; }
  h1 { font-size:20px; margin:0 0 6px; }
  p { margin:0 0 22px; color:#6E6858; font-size:14px; line-height:1.45; }
  a.btn { display:block; padding:14px; border-radius:14px; text-decoration:none; font-weight:700; font-size:15px; margin-top:10px; }
  .primary { background:#FFC107; color:#14161B; }
  .secondary { background:#F6F3EC; color:#16181D; }
  .note { margin-top:16px; font-size:12px; color:#9A9384; }
  @media (prefers-color-scheme: dark) {
    body { background:#0E1116; color:#F1F5F9; } .card { background:#161B22; box-shadow:none; }
    p { color:#94A3B8; } .secondary { background:#1E242D; color:#F1F5F9; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">SW</div>
    <h1>${t}</h1>
    <p>${d}</p>
    <a class="btn primary" id="open" href="${escapeHtml(intentUrl)}">Open in Sharing Wala</a>
    <a class="btn secondary" href="${escapeHtml(playUrl)}">Get it on Google Play</a>
    <div class="note">Opening the app… If nothing happens, use the buttons above.</div>
  </div>
<script>
  (function () {
    var isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      // Opens the app if installed, otherwise Chrome follows browser_fallback_url to the Play Store.
      window.location.replace(${JSON.stringify(intentUrl)});
    }
  })();
</script>
</body>
</html>`;
};

const landing = (kind) => async (req, res) => {
  const id = String(req.params.id || '').replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 80);
  const appPath = `/r/${kind}/${id}`;
  const preview = await tripPreview(id);
  // This page needs a tiny inline script/style; relax helmet's default CSP for it only.
  res.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'"
  );
  res.set('Cache-Control', 'no-store');
  res.type('html').send(
    renderLanding({
      appPath,
      title: preview.title,
      description: preview.description,
      url: `${req.protocol}://${req.get('host')}${appPath}`,
    })
  );
};

router.get('/r/ride/:id', landing('ride'));
router.get('/r/trip/:id', landing('trip'));

export default router;
