import { ApiError } from '../../utils/apiError.js';

// --- Comprehensive In-Memory Banners Store ---
// Designed for seamless consumption by Flutter CarouselSlider, promotional cards, and hero sections.
const banners = [
  // ==========================================
  // 1. USER PERSONA (Commuter / Passenger)
  // ==========================================
  {
    id: 'banner_usr_01',
    title: 'Cut Commute Costs by Up to 60%',
    subtitle: 'Split fuel, skip surges & ride comfortably',
    description: 'Book instant carpool & bikepool seats with verified professionals traveling your daily route.',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'USER',
    category: 'COMMUTE_SAVINGS',
    badge: 'Popular',
    ctaText: 'Find Rides',
    actionType: 'NAVIGATE',
    actionUrl: '/user/rides/search',
    deepLink: 'share2go://rides/search',
    gradientColors: ['#047857', '#10B981'],
    priority: 1,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_usr_02',
    title: 'Verified Women-Only Rides',
    subtitle: 'Safety first with verified women drivers',
    description: 'Travel with complete peace of mind in our exclusive, verified women-only carpool and bikepool network.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'USER',
    category: 'SAFETY',
    badge: 'Women Only',
    ctaText: 'Explore Safe Rides',
    actionType: 'NAVIGATE',
    actionUrl: '/user/rides/search?womenOnly=true',
    deepLink: 'share2go://rides/search?womenOnly=true',
    gradientColors: ['#DB2777', '#F472B6'],
    priority: 2,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_usr_03',
    title: 'Invite Friends, Earn ₹150 Ride Credits',
    subtitle: 'Free rides for you and your office circle',
    description: 'Share your referral code. When your colleague completes their first ride, both get ₹150 instantly.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'USER',
    category: 'REFERRAL',
    badge: 'Earn Rewards',
    ctaText: 'Refer & Earn',
    actionType: 'NAVIGATE',
    actionUrl: '/profile/referral',
    deepLink: 'share2go://profile/referral',
    gradientColors: ['#4F46E5', '#6366F1'],
    priority: 3,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },

  // ==========================================
  // 2. RIDER PERSONA (Host / Driver)
  // ==========================================
  {
    id: 'banner_rdr_01',
    title: 'Turn Empty Seats Into ₹6,000+ Monthly',
    subtitle: 'Offset 100% of your fuel & toll expenses',
    description: 'Offer rides on your daily route to Hitech City, Cyber Towers, or Gachibowli with 0% platform commission.',
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'RIDER',
    category: 'HOST_EARNINGS',
    badge: 'Zero Commission',
    ctaText: 'Publish Route',
    actionType: 'NAVIGATE',
    actionUrl: '/rider/publish-ride',
    deepLink: 'share2go://rider/publish',
    gradientColors: ['#2563EB', '#60A5FA'],
    priority: 1,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_rdr_02',
    title: 'Get Verified & Unlock Instant Bookings',
    subtitle: 'Approved hosts receive 3x more ride requests',
    description: 'Upload your driving license and vehicle registration to earn the trusted verified green checkmark.',
    imageUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'RIDER',
    category: 'VERIFICATION',
    badge: 'Verified Host',
    ctaText: 'Complete Verification',
    actionType: 'NAVIGATE',
    actionUrl: '/rider/verification',
    deepLink: 'share2go://rider/verification',
    gradientColors: ['#0D9488', '#2DD4BF'],
    priority: 2,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_rdr_03',
    title: 'Set It Once with Recurring Daily Routes',
    subtitle: 'Automate Mon-Fri morning & evening rides',
    description: 'Create a recurring schedule once and let reliable daily passengers subscribe to your carpool automatically.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'RIDER',
    category: 'RECURRING_ROUTES',
    badge: 'Smart Schedule',
    ctaText: 'Create Recurring Route',
    actionType: 'NAVIGATE',
    actionUrl: '/rider/recurring/create',
    deepLink: 'share2go://rider/recurring',
    gradientColors: ['#D97706', '#FBBF24'],
    priority: 3,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },

  // ==========================================
  // 3. STRANGER PERSONA (Trips / Meetups / Plans)
  // ==========================================
  {
    id: 'banner_str_01',
    title: 'Weekend Escapes & Road Trips',
    subtitle: 'Share scenic drives to Goa, Manali & Chikmagalur',
    description: 'Connect with fellow explorers for weekend road trips, campfire stories, and curated playlists.',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'STRANGER',
    category: 'ROAD_TRIPS',
    badge: 'Weekend Vibes',
    ctaText: 'Discover Trips',
    actionType: 'NAVIGATE',
    actionUrl: '/stranger/trips',
    deepLink: 'share2go://stranger/trips',
    gradientColors: ['#7C3AED', '#A78BFA'],
    priority: 1,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_str_02',
    title: 'Founder Coffee & Startup Pitch Meetups',
    subtitle: 'Sunday morning networking at Roastery & Conçu',
    description: 'Join micro-hangouts with tech founders, designers, and creators within 2 km of your area.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'STRANGER',
    category: 'MEETUPS',
    badge: 'This Weekend',
    ctaText: 'RSVP Meetups',
    actionType: 'NAVIGATE',
    actionUrl: '/stranger/meetups?category=Coffee',
    deepLink: 'share2go://stranger/meetups',
    gradientColors: ['#EA580C', '#FB923C'],
    priority: 2,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
  {
    id: 'banner_str_03',
    title: 'Sunset Acoustic Jam & Lake Walk',
    subtitle: 'Bring your ukulele, guitar, or just good energy',
    description: 'Free open-air music jams every Sunday sunset at Durgam Cheruvu lake walkway.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    targetRole: 'STRANGER',
    category: 'COMMUNITY_EVENTS',
    badge: 'Free Event',
    ctaText: 'Join Jam',
    actionType: 'NAVIGATE',
    actionUrl: '/stranger/meetups?category=Music',
    deepLink: 'share2go://stranger/meetups',
    gradientColors: ['#BE185D', '#F43F5E'],
    priority: 3,
    isActive: true,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  },
];

/**
 * Get banners with multi-persona filtering:
 * @param {Object} query - { type, category, isActive, limit, group }
 */
export const getBanners = async (query = {}) => {
  const { type, category, isActive, limit, group } = query;

  let list = [...banners];

  // 1. Filter by Target Persona (USER, RIDER, STRANGER)
  if (type && type.toUpperCase() !== 'ALL') {
    const roleUpper = type.toUpperCase().trim();
    list = list.filter((b) => b.targetRole === roleUpper);
  }

  // 2. Filter by Category
  if (category && category.toLowerCase() !== 'all') {
    const catLower = category.toLowerCase().trim();
    list = list.filter((b) => b.category.toLowerCase().includes(catLower));
  }

  // 3. Filter by Active Status (defaults to active true if specified)
  if (isActive !== undefined) {
    const activeBool = isActive === 'true' || isActive === true;
    list = list.filter((b) => b.isActive === activeBool);
  }

  // Sort by priority (lowest priority number = displayed first)
  list.sort((a, b) => a.priority - b.priority);

  // 4. Apply Limit if requested
  if (limit && Number(limit) > 0) {
    list = list.slice(0, Number(limit));
  }

  // 5. Optional Grouping by Target Role
  if (group === 'true' || group === true) {
    return {
      user: list.filter((b) => b.targetRole === 'USER'),
      rider: list.filter((b) => b.targetRole === 'RIDER'),
      stranger: list.filter((b) => b.targetRole === 'STRANGER'),
      total: list.length,
    };
  }

  return list;
};

/**
 * Get single banner details by ID
 */
export const getBannerById = async (bannerId) => {
  const banner = banners.find((b) => b.id === bannerId);
  if (!banner) {
    throw new ApiError(404, `Banner with ID '${bannerId}' not found`);
  }
  return banner;
};

// ==========================================
// APP UPDATE & FORCE UPDATE ENGINE
// ==========================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'app_config.json');

const loadConfig = () => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        android: {
          latestVersion: '1.0.0',
          minSupportedVersion: '1.0.0',
          forceUpdate: false,
          title: 'Update Available',
          message: 'A newer version of SharingWala is available.',
          releaseNotes: [],
          storeUrl: 'https://play.google.com/store/apps/details?id=com.sharingwala.app',
          enabled: false,
        },
        ios: {
          latestVersion: '1.0.0',
          minSupportedVersion: '1.0.0',
          forceUpdate: false,
          title: 'Update Available',
          message: 'A newer version of SharingWala is available.',
          releaseNotes: [],
          storeUrl: 'https://apps.apple.com/app/sharingwala/id123456789',
          enabled: false,
        },
      };
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading app_config.json:', err);
    return {};
  }
};

const semverCompare = (v1, v2) => {
  const parse = (v) => (v || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

export const checkAppUpdate = async (query = {}) => {
  const platform = (query.platform || 'android').toLowerCase();
  const currentVersion = query.version || '1.0.0';

  const fullConfig = loadConfig();
  const platformConfig = fullConfig[platform] || fullConfig['android'];

  if (!platformConfig || !platformConfig.enabled) {
    return {
      updateAvailable: false,
      forceUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
    };
  }

  const latest = platformConfig.latestVersion || '1.0.0';
  const minSupported = platformConfig.minSupportedVersion || '1.0.0';

  const isBelowMin = semverCompare(currentVersion, minSupported) < 0;
  const isBelowLatest = semverCompare(currentVersion, latest) < 0;

  const forceUpdate = isBelowMin || Boolean(platformConfig.forceUpdate);
  const updateAvailable = isBelowLatest;

  return {
    updateAvailable,
    forceUpdate,
    currentVersion,
    latestVersion: latest,
    minSupportedVersion: minSupported,
    title: platformConfig.title || 'App Update Available',
    message: isBelowMin
      ? 'This version of SharingWala is no longer supported. Please update immediately to continue booking rides safely.'
      : platformConfig.message || 'A new update is available with safety improvements.',
    releaseNotes: platformConfig.releaseNotes || [],
    storeUrl: platformConfig.storeUrl || '',
    platform,
  };
};

export const getAppConfig = async () => {
  return loadConfig();
};

export const updateAppConfig = async (newConfig) => {
  const current = loadConfig();
  const updated = {
    ...current,
    ...newConfig,
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
};

