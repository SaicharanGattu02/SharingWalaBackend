import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';

// --- In-Memory Dynamic Store with Rich Real Production Seed Data ---
// Allows instant, friction-free CRUD matching Flutter UI 100%

let strangerTrips = [
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

// --- 1. STRANGER TRIPS ---
export const getStrangerTrips = async ({ vibe, isWomenOnly, search } = {}) => {
  let list = [...strangerTrips];
  if (vibe) list = list.filter((t) => t.vibe === vibe);
  if (isWomenOnly === 'true') list = list.filter((t) => t.isWomenOnly);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((t) => t.origin.toLowerCase().includes(s) || t.destination.toLowerCase().includes(s));
  }
  return list;
};

export const getStrangerTripById = async (id) => {
  const trip = strangerTrips.find((t) => t.id === id);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');
  return trip;
};

export const createStrangerTrip = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newTrip = {
    id: `stranger_${Date.now()}`,
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
    mode: data.mode,
    vibe: data.vibe,
    availableSeats: data.totalSeats,
    totalSeats: data.totalSeats,
    pricePerPerson: data.pricePerPerson,
    notes: data.notes || '',
    interests: data.interests || [],
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    isWomenOnly: data.isWomenOnly || false,
    isConnected: false,
  };

  strangerTrips.unshift(newTrip);
  return newTrip;
};

export const joinStrangerTrip = async (userId, tripId) => {
  const trip = await getStrangerTripById(tripId);
  if (trip.availableSeats <= 0) {
    throw new ApiError(400, 'Trip is already full');
  }
  trip.availableSeats -= 1;
  trip.isConnected = true;
  return { success: true, message: 'Joined trip successfully!', availableSeats: trip.availableSeats };
};

// --- 2. STRANGER MEETUPS ---
export const getStrangerMeetups = async ({ category } = {}) => {
  let list = [...strangerMeetups];
  if (category && category !== 'All') {
    list = list.filter((m) => m.category.toLowerCase() === category.toLowerCase());
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
  return {
    isRsvped: meetup.isRsvped,
    attendeesCount: meetup.attendeesCount,
    message: meetup.isRsvped ? 'RSVP confirmed!' : 'RSVP cancelled',
  };
};

// --- 3. STRANGER PLANS ---
export const getStrangerPlans = async ({ filter } = {}) => {
  let list = [...strangerPlans];
  if (filter === 'trending') list = list.filter((p) => p.isTrending);
  if (filter === 'upcoming') list = list.filter((p) => p.isUpcoming);
  return list;
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
  return newPlan;
};

export const joinStrangerPlan = async (userId, planId) => {
  const plan = await getStrangerPlanById(planId);
  if (plan.joinedMembers >= plan.totalMembers) {
    throw new ApiError(400, 'This plan is already full');
  }
  plan.joinedMembers += 1;
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
