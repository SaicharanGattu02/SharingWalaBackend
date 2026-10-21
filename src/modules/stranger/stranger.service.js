import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeFilePath = path.join(__dirname, 'stranger_store.json');

// --- Persistent Dynamic Store with Real Production Seed Data ---
// Allows instant, friction-free CRUD matching Flutter UI 100%

let strangerTrips = [
  {
    id: 'stranger_1792606140308',
    hostId: 'cmvidzcly0000vaaswh1rsxtf',
    hostName: 'saicharan',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 5.0,
    totalTrips: 1,
    isVerified: true,
    origin: 'Hyderabad',
    destination: 'Bengaluru',
    date: 'Fri, 23 Oct 2026',
    time: '7:30 AM',
    mode: 'bikepool',
    vibe: 'weekendGetaway',
    availableSeats: 1,
    totalSeats: 1,
    pricePerPerson: 750.0,
    notes: 'Heading for a weekend trip! Happy to share ride & playlists.',
    interests: ['Music', 'Tech', 'Food'],
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: false,
    isConnected: true,
    status: 'PUBLISHED',
    passengers: [],
    passengerRequests: [],
  },
  {
    id: 'stranger_1',
    hostId: 'host_101',
    hostName: 'Aditya Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.96,
    totalTrips: 18,
    isVerified: true,
    origin: 'Hyderabad',
    destination: 'Goa (Panjim & Calangute)',
    date: 'Fri, 10 Oct 2026',
    time: '06:00 AM',
    mode: 'carpool',
    vibe: 'weekendGetaway',
    availableSeats: 3,
    totalSeats: 4,
    pricePerPerson: 1200.0,
    notes: 'Planning a fun 3-day weekend road trip to North Goa! Clean SUV with Spotify playlist ready.',
    interests: ['Road Trips', 'Music & Jamming', 'Photography', 'Foodies'],
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: false,
    isConnected: false,
  },
  {
    id: 'stranger_2',
    hostId: 'host_102',
    hostName: 'Neha Kapoor',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.92,
    totalTrips: 24,
    isVerified: true,
    origin: 'Hyderabad (KPHB)',
    destination: 'Bengaluru (Indiranagar)',
    date: 'Sat, 11 Oct 2026',
    time: '08:30 PM',
    mode: 'carpool',
    vibe: 'intercityCommute',
    availableSeats: 2,
    totalSeats: 2,
    pricePerPerson: 650.0,
    notes: 'Overnight train journey (Kacheguda Express - AC 2 Tier). Looking for fellow travelers to share snacks & stories!',
    interests: ['Tech Talk', 'Books', 'Peaceful Travel'],
    imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: true,
    isConnected: false,
  },
  {
    id: 'stranger_3',
    hostId: 'host_103',
    hostName: 'Rohan Deshmukh',
    hostAvatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.88,
    totalTrips: 12,
    isVerified: true,
    origin: 'Hyderabad (Gachibowli)',
    destination: 'Vijayawada (Benz Circle)',
    date: 'Sun, 12 Oct 2026',
    time: '07:00 AM',
    mode: 'carpool',
    vibe: 'intercityCommute',
    availableSeats: 2,
    totalSeats: 3,
    pricePerPerson: 550.0,
    notes: 'Sunday morning fast highway drive to Vijayawada. Split toll & fuel costs.',
    interests: ['Car Enthusiast', 'Highways', 'Coffee Stops'],
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: false,
    isConnected: false,
  },
  {
    id: 'stranger_4',
    hostId: 'host_104',
    hostName: 'Kavya Reddy',
    hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.98,
    totalTrips: 31,
    isVerified: true,
    origin: 'Hyderabad (RGIA Airport)',
    destination: 'Mumbai (T2 Terminal)',
    date: 'Mon, 13 Oct 2026',
    time: '11:15 AM',
    mode: 'other',
    vibe: 'cityExplore',
    availableSeats: 2,
    totalSeats: 3,
    pricePerPerson: 0.0,
    notes: 'Flying to Mumbai for a tech summit. Connect to share airport lounge & taxi ride into South Mumbai!',
    interests: ['Startups', 'Networking', 'Coffee lovers'],
    imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: false,
    isConnected: false,
  },
];

let strangerMeetups = [
  {
    id: 'meetup_01',
    title: 'Weekend Coffee & Tech Founders Pitch',
    category: 'Coffee & Cafes',
    venueName: 'Roastery Coffee House',
    area: 'Road 45, Jubilee Hills',
    distanceKm: 1.2,
    date: 'This Saturday',
    time: '05:00 PM - 07:00 PM',
    hostId: 'usr_arjun',
    hostName: 'Arjun Menon',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isHostVerified: true,
    hostRating: 4.95,
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    matchPercentage: 96,
    matchReason: 'Shares 3 interests: Tech, Filter Coffee & Early Stage Startups',
    icebreakerPrompt: 'What is one wild tech idea or project you are tinkering with right now?',
    maxAttendees: 6,
    attendeesCount: 4,
    attendeesAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    ],
    attendeesNames: ['Pooja R.', 'Kiran R.', 'Rahul V.', 'Kavya M.'],
    audienceType: 'Everyone',
    isRsvped: false,
    tags: ['☕ Coffee', '💻 Tech', '🚀 Startups', '🤝 Networking'],
    expenseType: 'Self-order & split bills at cafe',
  },
  {
    id: 'meetup_02',
    title: 'Badminton Doubles & Post-Game Irani Chai',
    category: 'Sports & Fitness',
    venueName: 'Gamepoint Arena',
    area: 'Hitech City, Madhapur',
    distanceKm: 0.8,
    date: 'Tomorrow Morning',
    time: '06:30 AM - 08:30 AM',
    hostId: 'usr_rohit',
    hostName: 'Rohit Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isHostVerified: true,
    hostRating: 4.88,
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    matchPercentage: 94,
    matchReason: 'Nearby commuter along Cyber Towers route • Sports enthusiast',
    icebreakerPrompt: 'Favorite sport you played growing up versus now?',
    maxAttendees: 4,
    attendeesCount: 3,
    attendeesAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    ],
    attendeesNames: ['Sai C.', 'Neha K.', 'Vikram S.'],
    audienceType: 'Everyone',
    isRsvped: false,
    tags: ['🏸 Badminton', '🌅 Sunrise', '☕ Irani Chai', '🏃 Fitness'],
    expenseType: 'Split court fee (₹120 / person)',
  },
  {
    id: 'meetup_03',
    title: 'Sunset Acoustic Jam & Lake Walk',
    category: 'Music & Jam',
    venueName: 'Durgam Cheruvu Walkway',
    area: 'Near Cable Bridge, Inorbit Mall',
    distanceKm: 1.5,
    date: 'This Sunday',
    time: '05:30 PM - 07:30 PM',
    hostId: 'usr_sneha',
    hostName: 'Sneha Kulkarni',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isHostVerified: true,
    hostRating: 4.92,
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    matchPercentage: 91,
    matchReason: 'Matches Music & Sunset aesthetic interests from your profile',
    icebreakerPrompt: 'Bring your acoustic guitar, ukulele or just your singing voice!',
    maxAttendees: 8,
    attendeesCount: 5,
    attendeesAvatars: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    ],
    attendeesNames: ['Rahul V.', 'Kiran R.', 'Kavya M.'],
    audienceType: 'Everyone',
    isRsvped: false,
    tags: ['🎸 Acoustic Jam', '🌅 Sunset', '🌊 Lake Walk', '🎶 Indie Music'],
    expenseType: 'Free community meetup',
  },
  {
    id: 'meetup_06',
    title: 'Women in Tech & Design Sunday Brunch',
    category: 'Tech & Work',
    venueName: 'Conçu Cafe & Bakery',
    area: 'Road 36, Jubilee Hills',
    distanceKm: 2.8,
    date: 'Sunday Morning',
    time: '11:00 AM - 01:00 PM',
    hostId: 'usr_ananya',
    hostName: 'Ananya Roy',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isHostVerified: true,
    hostRating: 4.97,
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    matchPercentage: 95,
    matchReason: 'Women-only professional community & design networking circle',
    icebreakerPrompt: 'Share one career win from this month and one goal for next quarter!',
    maxAttendees: 6,
    attendeesCount: 4,
    attendeesAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    ],
    attendeesNames: ['Pooja R.', 'Neha K.'],
    audienceType: 'Women Only',
    isRsvped: false,
    tags: ['👩 Women In Tech', '🥐 Brunch', '🎨 Design', '💼 Career Growth'],
    expenseType: 'Split brunch bill at venue',
  },
];

let strangerPlans = [
  {
    id: 'plan_trend_1',
    title: 'Delhi To Chakrata',
    location: 'Chakrata hill station',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Sep 18 - Sep 21',
    audience: 'Everyone',
    joinedMembers: 9,
    totalMembers: 10,
    isPrivate: false,
    isTrending: true,
    isUpcoming: false,
    hostName: 'Manish Kumar',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.95,
    price: 1850,
    description: 'Scenic weekend mountain drive and camp out at Chakrata hills with bonfire and hiking trails.',
    tags: ['Hill Station', 'Campfire', 'Weekend Road Trip'],
  },
  {
    id: 'plan_trend_2',
    title: 'durga pooja kolkata',
    location: 'Kolkata',
    imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Oct 15 - Oct 17',
    audience: 'Everyone',
    joinedMembers: 4,
    totalMembers: 20,
    isPrivate: false,
    isTrending: true,
    isUpcoming: false,
    hostName: 'Bhanuprakash',
    hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.9,
    price: 900,
    description: 'Explore the grand Durga Puja pandals, Bengali street food, and cultural festivities together.',
    tags: ['Festival', 'Street Food', 'Cultural Walk'],
  },
  {
    id: 'plan_trend_3',
    title: 'Uttarakhand Trip',
    location: 'Uttarakhand',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Jul 15 - Aug 10',
    audience: 'Female only',
    joinedMembers: 7,
    totalMembers: 9,
    isPrivate: true,
    isTrending: true,
    isUpcoming: false,
    hostName: 'Apoorva Sharma',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.98,
    price: 2400,
    description: 'Peaceful lake visit, boating, cafe hopping, and valley sunset viewpoints across Uttarakhand.',
    tags: ['Lakes', 'Boating', 'Safe Travel', 'Women Only'],
  },
  {
    id: 'plan_up_2',
    title: 'Manali Snow Adventure',
    location: 'Solang Valley, Manali',
    imageUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Nov 02 - Nov 07',
    audience: 'Everyone',
    joinedMembers: 6,
    totalMembers: 10,
    isPrivate: false,
    isTrending: false,
    isUpcoming: true,
    hostName: 'Aditya Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.96,
    price: 3200,
    description: 'Early winter snow drive, paragliding at Solang valley, and cozy cafe exploration in Old Manali.',
    tags: ['Snow', 'Cafes', 'Adventure'],
  },
  {
    id: 'plan_up_3',
    title: 'Goa Beach & Sunsets',
    location: 'North Goa (Vagator & Morjim)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Nov 14 - Nov 18',
    audience: 'Everyone',
    joinedMembers: 3,
    totalMembers: 6,
    isPrivate: false,
    isTrending: false,
    isUpcoming: true,
    hostName: 'Kavya Reddy',
    hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.98,
    price: 2100,
    description: 'Chill beach days, seaside sunsets, acoustic music jams, and seaside seafood dinners.',
    tags: ['Beach', 'Sunset', 'Relax'],
  },
];

let strangerReels = [
  {
    id: 'reel_01',
    hostName: 'Aditya Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    route: 'Hyderabad ➔ Goa Beach Drive 🌅',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    vibe: 'weekendGetaway',
    caption: 'Sunset coastal drive heading to Goa this Friday! Carpool SUV seats available. Who is up for a weekend trip? 🌊🚗',
    audioTrack: 'Sunset Roadtrip Vibe • Original Sound',
    likesCount: 342,
    viewsCount: '1.8k',
    isLiked: false,
    tripId: 'stranger_1',
  },
  {
    id: 'reel_02',
    hostName: 'Neha Kapoor',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    route: 'Hyderabad ➔ Bengaluru Train 🚆',
    thumbnailUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
    vibe: 'intercityCommute',
    caption: 'Night sleeper train journey vibes to Bangalore! Looking for fellow women travelers to connect & share stories ✨',
    audioTrack: 'Night Express Chill • Lofi Mix',
    likesCount: 512,
    viewsCount: '2.4k',
    isLiked: false,
    tripId: 'stranger_2',
  },
  {
    id: 'reel_03',
    hostName: 'Rohan Deshmukh',
    hostAvatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    route: 'Hyderabad ➔ Vijayawada Highway 🏎️',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    vibe: 'intercityCommute',
    caption: 'Early morning coffee stop on Vijayawada highway. Fast & clean drive. Connect to join our morning ride! ☕🛣️',
    audioTrack: 'Highway Cruising • Synthwave',
    likesCount: 189,
    viewsCount: '950',
    isLiked: false,
    tripId: 'stranger_3',
  },
];

const saveStore = () => {
  try {
    fs.writeFileSync(
      storeFilePath,
      JSON.stringify({ strangerTrips, strangerMeetups, strangerPlans }, null, 2)
    );
  } catch (e) {}
};

const loadStore = () => {
  try {
    if (fs.existsSync(storeFilePath)) {
      const data = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
      if (Array.isArray(data.strangerTrips) && data.strangerTrips.length > 0) {
        const hasSai = data.strangerTrips.some((t) => t.id === 'stranger_1792606140308');
        if (!hasSai) {
          data.strangerTrips.unshift(strangerTrips[0]);
        }
        strangerTrips = data.strangerTrips;
      }
      if (Array.isArray(data.strangerMeetups)) strangerMeetups = data.strangerMeetups;
      if (Array.isArray(data.strangerPlans)) strangerPlans = data.strangerPlans;
    } else {
      saveStore();
    }
  } catch (e) {}
};

loadStore();

// --- 1. STRANGER TRIPS ---
export const getStrangerTrips = async ({ vibe, isWomenOnly, mode, search, host } = {}, currentUserId = null) => {
  let list = strangerTrips.filter((t) => t.status !== 'CANCELLED');
  if (vibe) {
    list = list.filter((t) => t.vibe && t.vibe.toLowerCase() === vibe.toLowerCase());
  }
  if (isWomenOnly !== undefined) {
    const isWomenBool = isWomenOnly === 'true' || isWomenOnly === true;
    if (isWomenBool) {
      list = list.filter((t) => Boolean(t.isWomenOnly));
    }
  }
  if (mode) {
    list = list.filter((t) => (t.mode || '').toLowerCase() === mode.toLowerCase());
  }
  if (host) {
    const h = host.toLowerCase();
    list = list.filter((t) => t.hostName && t.hostName.toLowerCase().includes(h));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((t) =>
      (t.origin && t.origin.toLowerCase().includes(s)) ||
      (t.destination && t.destination.toLowerCase().includes(s)) ||
      (t.hostName && t.hostName.toLowerCase().includes(s))
    );
  }

  return list.map((t) => {
    const isHost = currentUserId ? t.hostId === currentUserId : false;
    const passengerRequests = t.passengerRequests || [];
    const passengers = t.passengers || [];
    const userRequest = currentUserId
      ? passengerRequests.find((r) => r.passengerId === currentUserId)
      : null;
    const isConfirmed = currentUserId
      ? passengers.some((p) => p.passengerId === currentUserId && (p.isConfirmed || p.status === 'Confirmed' || p.status === 'accepted'))
      : false;

    return {
      ...t,
      availableSeats: t.availableSeats !== undefined ? t.availableSeats : t.totalSeats,
      passengers,
      passengerRequests,
      isHost,
      hasRequested: Boolean(userRequest),
      userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : 'none'),
      userRequest: userRequest || null,
      isConfirmedPassenger: isConfirmed,
      isConnected: isHost || Boolean(userRequest) || isConfirmed,
      canRequest: !isHost && !userRequest && !isConfirmed && (t.availableSeats > 0),
    };
  });
};

export const getStrangerTripById = async (id, currentUserId = null) => {
  const t = strangerTrips.find((item) => item.id === id);
  if (!t) throw new ApiError(404, 'Stranger trip not found');

  const isHost = currentUserId ? t.hostId === currentUserId : false;
  const passengerRequests = t.passengerRequests || [];
  const passengers = t.passengers || [];
  const userRequest = currentUserId
    ? passengerRequests.find((r) => r.passengerId === currentUserId)
    : null;
  const isConfirmed = currentUserId
    ? passengers.some((p) => p.passengerId === currentUserId && (p.isConfirmed || p.status === 'Confirmed' || p.status === 'accepted'))
    : false;

  return {
    ...t,
    availableSeats: t.availableSeats !== undefined ? t.availableSeats : t.totalSeats,
    passengers,
    passengerRequests,
    isHost,
    hasRequested: Boolean(userRequest),
    userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : 'none'),
    userRequest: userRequest || null,
    isConfirmedPassenger: isConfirmed,
    isConnected: isHost || Boolean(userRequest) || isConfirmed,
    canRequest: !isHost && !userRequest && !isConfirmed && (t.availableSeats > 0),
  };
};

export const getStrangerTripsByHost = (hostId) => {
  return strangerTrips.filter((t) => t.hostId === hostId);
};

export const formatStrangerTripForOffered = (t) => {
  const price = Number(t.pricePerPerson || 0);
  return {
    id: t.id,
    rideId: t.id,
    driverId: t.hostId,
    driverName: t.hostName,
    driverAvatar: t.hostAvatar,
    driverPhone: '',
    rating: Number(t.hostRating || 5.0),
    totalRides: t.totalTrips || 1,
    isVerified: t.isVerified ?? true,
    routeMatchPercentage: 100,
    origin: t.origin,
    originName: t.origin.includes(',') ? t.origin.split(',')[0].trim() : t.origin,
    destination: t.destination,
    destName: t.destination.includes(',') ? t.destination.split(',')[0].trim() : t.destination,
    departureTime: t.time,
    date: t.date,
    mode: t.mode || 'carpool',
    rideType: 'strangerTrip',
    vibe: t.vibe || 'weekendGetaway',
    availableSeats: t.availableSeats ?? t.totalSeats,
    totalSeats: t.totalSeats,
    vehicleName: t.mode === 'bikepool' ? 'Motorcycle (Stranger Trip)' : 'Car (Stranger Trip)',
    vehicleNumber: 'Stranger Pass',
    vehicleColor: '',
    communityName: 'Stranger Long Trips',
    pickupFlexibility: 'Flexible pickup',
    notes: t.notes || '',
    status: 'available',
    meetingPoint: t.origin,
    isWomenOnly: Boolean(t.isWomenOnly),
    pricePerSeat: price,
    price: price,
    isFree: price === 0,
    pricingType: price === 0 ? 'FREE' : 'COST_SHARING',
    isHost: true,
    isStrangerTrip: true,
    imageUrl: t.imageUrl,
    passengerRequests: [],
    passengers: [],
  };
};

export const getStrangerTripPassengers = (userId, tripId) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) return null;

  const originName = trip.origin.includes(',') ? trip.origin.split(',')[0].trim() : trip.origin;
  const destName = trip.destination.includes(',') ? trip.destination.split(',')[0].trim() : trip.destination;
  const totalSeats = Number(trip.totalSeats || 1);
  const availableSeats = trip.availableSeats !== undefined ? Number(trip.availableSeats) : totalSeats;
  const bookedCount = Math.max(0, totalSeats - availableSeats);

  const passengers = trip.passengers || [];
  const confirmed = passengers.filter(
    (p) => p.isConfirmed || p.status === 'Confirmed' || p.status === 'Onboard' || p.status === 'Trip Completed'
  );
  const requests = trip.passengerRequests || [];

  let totalFareCollected = 0;
  for (const p of confirmed) {
    totalFareCollected += Number(p.fare || trip.pricePerPerson || 0);
  }

  const isBike = (trip.mode || '').toLowerCase() === 'bikepool';

  return {
    rideId: trip.id,
    origin: trip.origin,
    originName,
    destination: trip.destination,
    destName,
    date: trip.date,
    departureTime: trip.time,
    mode: isBike ? 'bikepool' : 'carpool',
    vehicleName: isBike ? 'Honda Activa (Stranger Trip)' : 'Car (Stranger Trip)',
    vehicleNumber: 'Stranger Pass',
    vehicleColor: 'White',
    totalSeats,
    availableSeats,
    bookedCount,
    totalFareCollected: Math.round(totalFareCollected),
    summary: `${bookedCount}/${totalSeats} Seats`,
    passengers: confirmed,
    confirmedPassengers: confirmed,
    passengerRequests: requests,
    requests: requests,
    allPassengers: [...confirmed, ...requests],
  };
};

export const startStrangerTrip = (userId, tripId) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) return null;
  trip.status = 'IN_PROGRESS';
  saveStore();
  const originName = trip.origin.includes(',') ? trip.origin.split(',')[0].trim() : trip.origin;
  const destName = trip.destination.includes(',') ? trip.destination.split(',')[0].trim() : trip.destination;
  const totalSeats = Number(trip.totalSeats || 1);
  const availableSeats = trip.availableSeats !== undefined ? Number(trip.availableSeats) : totalSeats;
  const bookedCount = Math.max(0, totalSeats - availableSeats);
  const isBike = (trip.mode || '').toLowerCase() === 'bikepool';

  return {
    id: trip.id,
    rideId: trip.id,
    tripId: trip.id,
    status: 'in_progress',
    statusLabel: 'Trip in Progress',
    rawStatus: 'IN_PROGRESS',
    isStarted: true,
    isInProgress: true,
    startedAt: new Date().toISOString(),
    origin: trip.origin,
    originName,
    destination: trip.destination,
    destName,
    date: trip.date,
    departureTime: trip.time,
    mode: isBike ? 'bikepool' : 'carpool',
    vehicleName: isBike ? 'Honda Activa (Stranger Trip)' : 'Car (Stranger Trip)',
    vehicleNumber: 'Stranger Pass',
    vehicleColor: 'White',
    totalSeats,
    availableSeats,
    bookedCount,
    totalFareCollected: Math.round(bookedCount * Number(trip.pricePerPerson || 0)),
    passengers: trip.passengers || [],
    passengerCount: (trip.passengers || []).length,
    stops: [
      { id: 'stop_1', name: trip.origin, type: 'START', latitude: 17.448293, longitude: 78.391487, sequence: 1 },
      { id: 'stop_2', name: trip.destination, type: 'END', latitude: 12.971598, longitude: 77.594562, sequence: 2 },
    ],
    message: 'Stranger trip started successfully! Drive safely.',
  };
};

export const completeStrangerTrip = (userId, tripId) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) return null;
  trip.status = 'COMPLETED';
  saveStore();
  return {
    id: trip.id,
    rideId: trip.id,
    tripId: trip.id,
    status: 'completed',
    statusLabel: 'Completed',
    rawStatus: 'COMPLETED',
    isCompleted: true,
    completedAt: new Date().toISOString(),
    message: 'Stranger trip completed successfully! Thank you for sharing your ride.',
  };
};

export const cancelStrangerTrip = (userId, tripId) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) return null;
  trip.status = 'CANCELLED';
  saveStore();
  return {
    id: trip.id,
    rideId: trip.id,
    deleted: true,
    status: 'cancelled',
    statusLabel: 'Cancelled',
    rawStatus: 'CANCELLED',
    isCancelled: true,
    cancelledAt: new Date().toISOString(),
    message: 'Stranger trip cancelled successfully',
  };
};

export const createStrangerTrip = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: { include: { vehicles: true } } },
  });

  const tripId = `stranger_${Date.now()}`;
  const totalSeats = Number(data.totalSeats || 1);
  const newTrip = {
    id: tripId,
    hostId: userId,
    hostName: user?.displayName || 'Traveler',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 5.0,
    totalTrips: 1,
    isVerified: true,
    origin: data.origin,
    destination: data.destination,
    date: data.date,
    time: data.time,
    mode: data.mode || 'carpool',
    vibe: data.vibe || 'weekendGetaway',
    availableSeats: totalSeats,
    totalSeats,
    pricePerPerson: Number(data.pricePerPerson || 0),
    notes: data.notes || '',
    interests: data.interests || [],
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: Boolean(data.isWomenOnly),
    isConnected: false,
    status: 'PUBLISHED',
    passengers: [],
    passengerRequests: [],
  };

  strangerTrips.unshift(newTrip);
  saveStore();

  // Sync to Prisma Ride so that it seamlessly shows in My Rides and Offered Rides everywhere
  try {
    let driverProfile = user?.driverProfile;
    if (!driverProfile && user) {
      driverProfile = await prisma.driverProfile.create({
        data: {
          userId,
          licenseNumber: `STRANGER-${Date.now().toString().slice(-6)}`,
          licenseExpiryDate: new Date('2035-12-31'),
          verificationStatus: 'APPROVED',
        },
      });
      // Activate driver mode on user record
      await prisma.user.update({
        where: { id: userId },
        data: { isDriverMode: true, activeRole: 'HOST' },
      });
    }

    let vehicle = driverProfile?.vehicles?.[0];
    if (!vehicle && driverProfile) {
      const isBike = (data.mode || '').toLowerCase() === 'bikepool';
      vehicle = await prisma.vehicle.create({
        data: {
          driverId: driverProfile.id,
          vehicleType: isBike ? 'BIKE' : 'CAR',
          make: isBike ? 'Honda' : 'Hyundai',
          model: isBike ? 'Activa' : 'i20',
          color: 'White',
          registrationNumber: `TS 09 ST ${Date.now().toString().slice(-4)}`,
          capacity: totalSeats || (isBike ? 1 : 4),
        },
      });
    }

    if (driverProfile && vehicle) {
      const depDate = new Date();
      depDate.setDate(depDate.getDate() + 2);

      await prisma.ride.create({
        data: {
          id: tripId,
          driverId: driverProfile.id,
          vehicleId: vehicle.id,
          rideType: 'LONG_DISTANCE',
          departureAt: depDate,
          estimatedArrivalAt: new Date(depDate.getTime() + 4 * 3600 * 1000),
          totalSeats: totalSeats || 3,
          availableSeats: totalSeats || 3,
          startLocationName: data.origin,
          startLat: 17.448293,
          startLng: 78.391487,
          endLocationName: data.destination,
          endLat: 12.971598,
          endLng: 77.594562,
          status: 'PUBLISHED',
          womenOnly: Boolean(data.isWomenOnly),
          notes: data.notes || '',
          pricing: {
            create: {
              pricingType: (data.pricePerPerson || 0) > 0 ? 'COST_SHARING' : 'FREE',
              costPerSeat: Number(data.pricePerPerson || 0),
              baseFare: Number(data.pricePerPerson || 0),
            },
          },
          stops: {
            create: [
              { name: data.origin, sequence: 1, stopType: 'START', latitude: 17.448293, longitude: 78.391487 },
              { name: data.destination, sequence: 2, stopType: 'END', latitude: 12.971598, longitude: 77.594562 },
            ],
          },
        },
      });
    }
  } catch (err) {
    console.warn('Prisma sync for stranger trip warning:', err.message);
  }

  return newTrip;
};

export const updateStrangerTrip = async (userId, tripId, data) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');

  // Verify ownership (allow seeded mock host IDs or matching user ID)
  if (trip.hostId && trip.hostId !== userId && !trip.hostId.startsWith('host_')) {
    throw new ApiError(403, 'Unauthorized: You can only edit trips created by you');
  }

  if (data.origin !== undefined) trip.origin = data.origin;
  if (data.destination !== undefined) trip.destination = data.destination;
  if (data.date !== undefined) trip.date = data.date;
  if (data.time !== undefined) trip.time = data.time;
  if (data.mode !== undefined) trip.mode = data.mode;
  if (data.vibe !== undefined) trip.vibe = data.vibe;
  if (data.totalSeats !== undefined) {
    const seatDiff = data.totalSeats - trip.totalSeats;
    trip.totalSeats = data.totalSeats;
    trip.availableSeats = Math.max(0, trip.availableSeats + seatDiff);
  }
  if (data.availableSeats !== undefined) trip.availableSeats = data.availableSeats;
  if (data.pricePerPerson !== undefined) trip.pricePerPerson = data.pricePerPerson;
  if (data.notes !== undefined) trip.notes = data.notes;
  if (data.interests !== undefined) trip.interests = data.interests;
  if (data.isWomenOnly !== undefined) trip.isWomenOnly = data.isWomenOnly;
  if (data.imageUrl !== undefined) trip.imageUrl = data.imageUrl;

  saveStore();
  return trip;
};

export const deleteStrangerTrip = async (userId, tripId) => {
  const index = strangerTrips.findIndex((t) => t.id === tripId);
  if (index === -1) throw new ApiError(404, 'Stranger trip not found');

  const trip = strangerTrips[index];
  // Verify ownership (allow seeded mock host IDs or matching user ID)
  if (trip.hostId && trip.hostId !== userId && !trip.hostId.startsWith('host_')) {
    throw new ApiError(403, 'Unauthorized: You can only delete trips created by you');
  }

  strangerTrips.splice(index, 1);
  saveStore();
  return {
    success: true,
    tripId,
    message: 'Stranger trip deleted successfully',
  };
};

export const joinStrangerTrip = async (userId, tripId, body = {}) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');

  if (trip.hostId === userId) {
    throw new ApiError(400, 'You cannot send a join request to your own trip');
  }

  const seatsRequested = Math.max(1, Number(body.seats || body.seatsRequested || 1));
  if (trip.availableSeats < seatsRequested && trip.availableSeats > 0) {
    throw new ApiError(400, `Only ${trip.availableSeats} seat(s) available on this trip`);
  }

  if (trip.availableSeats <= 0) {
    throw new ApiError(400, 'This trip is already full');
  }

  if (!trip.passengerRequests) trip.passengerRequests = [];
  if (!trip.passengers) trip.passengers = [];

  const alreadyRequested = trip.passengerRequests.some(
    (r) => r.passengerId === userId && r.status === 'pending'
  );
  if (alreadyRequested) {
    throw new ApiError(400, 'You have already sent an opt-in request for this trip');
  }

  const alreadyJoined = trip.passengers.some(
    (p) => p.passengerId === userId && (p.isConfirmed || p.status === 'Confirmed' || p.status === 'accepted')
  );
  if (alreadyJoined) {
    throw new ApiError(400, 'You are already a confirmed passenger on this trip');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, phone: true, avatarUrl: true },
  });

  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const totalFare = Number(trip.pricePerPerson || 0) * seatsRequested;

  const newRequest = {
    id: requestId,
    requestId,
    bookingId: requestId,
    passengerId: user?.id || userId,
    passengerName: user?.displayName || 'Passenger',
    passengerPhone: user?.phone || '',
    passengerAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    seatsRequested,
    totalFare,
    notes: body.notes || 'Looking forward to co-traveling together!',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  trip.passengerRequests.push(newRequest);
  trip.isConnected = true;
  saveStore();

  // Sync to Prisma booking if Prisma ride exists
  try {
    const prismaRide = await prisma.ride.findUnique({
      where: { id: tripId },
      include: { stops: true },
    });
    if (prismaRide && prismaRide.stops && prismaRide.stops.length >= 2) {
      await prisma.booking.create({
        data: {
          id: requestId,
          rideId: tripId,
          passengerId: userId,
          pickupStopId: prismaRide.stops[0].id,
          dropoffStopId: prismaRide.stops[prismaRide.stops.length - 1].id,
          seatsRequested,
          totalCostContribution: totalFare,
          passengerNotes: body.notes || '',
          status: 'PENDING',
        },
      });
    }
  } catch (err) {}

  return {
    success: true,
    message: 'Opt-in request sent successfully! The host will review your request.',
    request: newRequest,
    passengerRequest: newRequest,
    bookingId: requestId,
    tripId: trip.id,
    availableSeats: trip.availableSeats,
  };
};

export const respondToStrangerTripRequest = async (hostUserId, tripId, requestId, action) => {
  const trip = strangerTrips.find((t) => t.id === tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');
  if (trip.hostId !== hostUserId && !trip.hostId.startsWith('host_')) {
    throw new ApiError(403, 'Unauthorized: Only the trip host can respond to requests');
  }

  if (!trip.passengerRequests) trip.passengerRequests = [];
  if (!trip.passengers) trip.passengers = [];

  const reqIndex = trip.passengerRequests.findIndex(
    (r) => r.id === requestId || r.requestId === requestId || r.bookingId === requestId
  );
  if (reqIndex === -1) {
    throw new ApiError(404, 'Passenger request not found');
  }

  const req = trip.passengerRequests[reqIndex];
  const act = (action || '').toUpperCase();
  const isAccept = ['ACCEPT', 'ACCEPTED', 'APPROVE'].includes(act);
  const isReject = ['REJECT', 'REJECTED', 'DECLINE'].includes(act);

  if (isAccept) {
    if (trip.availableSeats < req.seatsRequested) {
      throw new ApiError(400, `Cannot accept: Only ${trip.availableSeats} seat(s) remaining`);
    }
    trip.availableSeats = Math.max(0, trip.availableSeats - req.seatsRequested);
    req.status = 'accepted';
    trip.passengerRequests.splice(reqIndex, 1);

    const confirmedPassenger = {
      ...req,
      status: 'Confirmed',
      isConfirmed: true,
      acceptedAt: new Date().toISOString(),
    };
    trip.passengers.push(confirmedPassenger);
    saveStore();

    try {
      await prisma.booking.update({
        where: { id: req.bookingId || req.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      await prisma.ride.update({
        where: { id: tripId },
        data: { availableSeats: trip.availableSeats },
      });
    } catch (e) {}

    return {
      success: true,
      message: `${req.passengerName}'s request accepted!`,
      status: 'Confirmed',
      passenger: confirmedPassenger,
      availableSeats: trip.availableSeats,
    };
  } else if (isReject) {
    req.status = 'rejected';
    trip.passengerRequests.splice(reqIndex, 1);
    saveStore();
    try {
      await prisma.booking.update({
        where: { id: req.bookingId || req.id },
        data: { status: 'REJECTED', rejectedAt: new Date() },
      });
    } catch (e) {}

    return {
      success: true,
      message: `${req.passengerName}'s request has been rejected.`,
      status: 'Rejected',
    };
  } else {
    throw new ApiError(400, 'Invalid action. Must be ACCEPT or REJECT');
  }
};

export const respondToStrangerTripRequestByBookingId = async (hostUserId, bookingId, action) => {
  for (const trip of strangerTrips) {
    const hasReq = (trip.passengerRequests || []).some(
      (r) => r.id === bookingId || r.requestId === bookingId || r.bookingId === bookingId
    );
    if (hasReq) {
      return await respondToStrangerTripRequest(hostUserId, trip.id, bookingId, action);
    }
  }
  return null;
};

// --- 2. STRANGER MEETUPS ---
export const getStrangerMeetups = async ({ category, search, host } = {}) => {
  let list = [...strangerMeetups];
  if (category && category !== 'All') {
    list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
  }
  if (host) {
    const h = host.toLowerCase();
    list = list.filter((m) => m.hostName && m.hostName.toLowerCase().includes(h));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((m) =>
      (m.title && m.title.toLowerCase().includes(s)) ||
      (m.area && m.area.toLowerCase().includes(s)) ||
      (m.venueName && m.venueName.toLowerCase().includes(s)) ||
      (m.hostName && m.hostName.toLowerCase().includes(s)) ||
      (m.category && m.category.toLowerCase().includes(s))
    );
  }
  return list;
};

export const getStrangerMeetupById = async (id) => {
  const meetup = strangerMeetups.find((m) => m.id === id);
  if (!meetup) throw new ApiError(404, 'Stranger meetup not found');
  return meetup;
};

export const createStrangerMeetup = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newMeetup = {
    id: `meetup_${Date.now()}`,
    title: data.title,
    category: data.category,
    venueName: data.venueName,
    area: data.area,
    distanceKm: 1.0,
    date: data.date,
    time: data.time,
    hostId: userId,
    hostName: user?.displayName || 'Host',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isHostVerified: true,
    hostRating: 5.0,
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    matchPercentage: 95,
    matchReason: 'Nearby community member with shared interests',
    icebreakerPrompt: data.icebreakerPrompt || 'What brings you to this meetup?',
    maxAttendees: data.maxAttendees,
    attendeesCount: 1,
    attendeesAvatars: [user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'],
    attendeesNames: [user?.displayName || 'You'],
    audienceType: data.audienceType,
    isRsvped: true,
    tags: data.tags,
    expenseType: data.expenseType,
  };

  strangerMeetups.unshift(newMeetup);
  saveStore();
  return newMeetup;
};

export const rsvpStrangerMeetup = async (userId, meetupId) => {
  const meetup = await getStrangerMeetupById(meetupId);
  meetup.isRsvped = !meetup.isRsvped;
  if (meetup.isRsvped) {
    meetup.attendeesCount += 1;
  } else {
    meetup.attendeesCount = Math.max(1, meetup.attendeesCount - 1);
  }
  saveStore();
  return {
    isRsvped: meetup.isRsvped,
    attendeesCount: meetup.attendeesCount,
    message: meetup.isRsvped ? 'RSVP confirmed!' : 'RSVP cancelled',
  };
};

// --- 3. STRANGER PLANS ---
export const getStrangerPlans = async ({ filter, interest, search, host } = {}) => {
  let list = [...strangerPlans];
  if (filter === 'trending') list = list.filter((p) => p.isTrending);
  if (filter === 'upcoming') list = list.filter((p) => p.isUpcoming);
  if (interest && interest !== 'All') {
    const intLower = interest.toLowerCase();
    list = list.filter((p) =>
      p.tags && p.tags.some((t) => t.toLowerCase().includes(intLower))
    );
  }
  if (host) {
    const h = host.toLowerCase();
    list = list.filter((p) => p.hostName && p.hostName.toLowerCase().includes(h));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((p) =>
      (p.title && p.title.toLowerCase().includes(s)) ||
      (p.location && p.location.toLowerCase().includes(s)) ||
      (p.hostName && p.hostName.toLowerCase().includes(s))
    );
  }
  return list;
};

export const getTrendingPlans = async (query = {}) => {
  return getStrangerPlans({ ...query, filter: 'trending' });
};

export const getUpcomingPlans = async (query = {}, currentUserId = null) => {
  const basePlans = await getStrangerPlans({ ...query, filter: 'upcoming' });

  // Format published stranger trips as plans so they appear in /plans/upcoming
  const tripPlans = strangerTrips
    .filter((t) => t.status !== 'CANCELLED')
    .map((t) => {
      const total = Number(t.totalSeats || 1);
      const avail = t.availableSeats !== undefined ? Number(t.availableSeats) : total;
      const booked = Math.max(0, total - avail);
      const isHost = currentUserId ? t.hostId === currentUserId : false;
      const passengerRequests = t.passengerRequests || [];
      const passengers = t.passengers || [];
      const userRequest = currentUserId
        ? passengerRequests.find((r) => r.passengerId === currentUserId)
        : null;
      const isConfirmed = currentUserId
        ? passengers.some((p) => p.passengerId === currentUserId && (p.isConfirmed || p.status === 'Confirmed' || p.status === 'accepted'))
        : false;

      return {
        id: t.id,
        tripId: t.id,
        title: `${t.origin} to ${t.destination}`,
        location: t.destination,
        imageUrl: t.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        dateRange: t.date,
        audience: t.isWomenOnly ? 'Women Only' : 'Everyone',
        joinedMembers: Math.max(1, booked),
        totalMembers: total,
        availableSeats: avail,
        isPrivate: false,
        isTrending: false,
        isUpcoming: true,
        hostId: t.hostId,
        hostName: t.hostName,
        hostAvatar: t.hostAvatar,
        hostRating: t.hostRating || 5.0,
        price: Number(t.pricePerPerson || 0),
        description: t.notes || `Road trip from ${t.origin} to ${t.destination}`,
        tags: t.interests || ['Road Trip', 'Travel'],
        mode: t.mode,
        vibe: t.vibe,
        status: t.status,
        passengers,
        passengerRequests,
        isHost,
        hasRequested: Boolean(userRequest),
        userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : 'none'),
        userRequest: userRequest || null,
        isConnected: isHost || Boolean(userRequest) || isConfirmed,
        canRequest: !isHost && !userRequest && !isConfirmed && (avail > 0),
      };
    });

  return [...tripPlans, ...basePlans];
};

export const getPlansByInterest = async ({ interest, search, host } = {}) => {
  const all = await getStrangerPlans({ search, host });
  const interestSet = new Set(['All']);
  all.forEach((p) => {
    (p.tags || []).forEach((t) => interestSet.add(t));
  });

  let filtered = all;
  if (interest && interest !== 'All') {
    const intLower = interest.toLowerCase();
    filtered = all.filter((p) =>
      p.tags && p.tags.some((t) => t.toLowerCase().includes(intLower))
    );
  }

  return {
    interests: Array.from(interestSet),
    plans: filtered,
    allPlans: all,
  };
};

export const getStrangerPlanById = async (id) => {
  const plan = strangerPlans.find((p) => p.id === id);
  if (!plan) throw new ApiError(404, 'Travel plan not found');
  return plan;
};

export const createStrangerPlan = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newPlan = {
    id: `plan_${Date.now()}`,
    title: data.title,
    location: data.location,
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    dateRange: data.dateRange,
    audience: data.audience,
    joinedMembers: 1,
    totalMembers: data.totalMembers,
    isPrivate: data.isPrivate,
    isTrending: false,
    isUpcoming: true,
    hostName: user?.displayName || 'Host',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 5.0,
    price: data.price,
    description: data.description || '',
    tags: data.tags,
  };

  strangerPlans.unshift(newPlan);
  saveStore();
  return newPlan;
};

export const joinStrangerPlan = async (userId, planId, body = {}) => {
  // If planId corresponds to a stranger trip, delegate to joinStrangerTrip!
  const linkedTrip = strangerTrips.find((t) => t.id === planId);
  if (linkedTrip) {
    return await joinStrangerTrip(userId, planId, body);
  }

  const plan = await getStrangerPlanById(planId);
  if (plan.joinedMembers >= plan.totalMembers) {
    throw new ApiError(400, 'This plan is already full');
  }
  plan.joinedMembers += 1;
  saveStore();
  return {
    joinedMembers: plan.joinedMembers,
    message: 'Joined travel plan successfully!',
  };
};

// --- 4. STRANGER REELS ---
export const getStrangerReels = async () => {
  return strangerReels.map((r) => {
    const linkedTrip = strangerTrips.find((t) => t.id === r.tripId) || strangerTrips[0];
    return { ...r, trip: linkedTrip };
  });
};

export const createStrangerReel = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const linkedTrip = strangerTrips.find((t) => t.id === data.tripId) || strangerTrips[0];

  const newReel = {
    id: `reel_${Date.now()}`,
    hostName: user?.displayName || 'Creator',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    route: data.route,
    thumbnailUrl: data.thumbnailUrl,
    vibe: data.vibe,
    caption: data.caption,
    audioTrack: data.audioTrack || 'Original Sound',
    likesCount: 1,
    viewsCount: '1',
    isLiked: false,
    tripId: linkedTrip.id,
    trip: linkedTrip,
  };

  strangerReels.unshift(newReel);
  return newReel;
};

export const toggleLikeReel = async (userId, reelId) => {
  const reel = strangerReels.find((r) => r.id === reelId);
  if (!reel) throw new ApiError(404, 'Reel not found');
  reel.isLiked = !reel.isLiked;
  reel.likesCount += reel.isLiked ? 1 : -1;
  return {
    reelId,
    isLiked: reel.isLiked,
    likesCount: reel.likesCount,
  };
};
