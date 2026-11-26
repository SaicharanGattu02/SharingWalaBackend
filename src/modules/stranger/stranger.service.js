import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiError.js';
import { getIO } from '../../config/socket.js';
import { sendRideNotificationPush } from '../../config/firebase.js';
import { toAbsoluteVideoUrl, toAbsoluteUrl } from '../../utils/urlHelper.js';
import { createNotification } from '../notification/notification.service.js';

// Real coordinate or 0 (= unknown). Never substitute a made-up location.
const toCoord = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : 0;
};

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
    date: 'Fri, 27 Nov 2026',
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
    date: 'Fri, 27 Nov 2026',
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
    date: 'Sat, 28 Nov 2026',
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
    date: 'Sun, 29 Nov 2026',
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
    date: 'Mon, 30 Nov 2026',
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
    id: 'trend_01',
    aliases: ['plan_trend_1', 'trend_1', 'Trend_1', 'Trend!1'],
    title: 'Delhi To Chakrata',
    location: 'Chakrata hill station',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Nov 28 - Dec 01',
    startDate: '2026-11-28',
    time: '06:00 AM',
    audience: 'Everyone',
    joinedMembers: 7,
    totalMembers: 10,
    isPrivate: false,
    isTrending: true,
    isUpcoming: false,
    isWomenOnly: false,
    hostId: 'host_trend_1',
    hostName: 'Manish Kumar',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.95,
    price: 1850,
    description: 'Scenic weekend mountain drive and camp out at Chakrata hills with bonfire and hiking trails.',
    tags: ['Hill Station', 'Campfire', 'Weekend Road Trip', 'Road Trips'],
    joinedUserIds: ['usr_seed_1', 'usr_seed_2', 'usr_seed_3', 'usr_seed_4', 'usr_seed_5', 'usr_seed_6', 'usr_seed_7'],
    members: [
      { userId: 'usr_seed_1', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_3', name: 'Siddharth Rao', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_4', name: 'Ananya Sen', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_5', name: 'Vikram Sethi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_6', name: 'Neha Joshi', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_7', name: 'Kunal Mehra', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  {
    id: 'trend_02',
    aliases: ['plan_trend_2', 'trend_2', 'Trend_2', 'Trend!2'],
    title: 'durga pooja kolkata',
    location: 'Kolkata',
    imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Dec 05 - Dec 08',
    startDate: '2026-12-05',
    time: '08:30 AM',
    audience: 'Everyone',
    joinedMembers: 4,
    totalMembers: 20,
    isPrivate: false,
    isTrending: true,
    isUpcoming: false,
    isWomenOnly: false,
    hostId: 'host_trend_2',
    hostName: 'Bhanuprakash',
    hostAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.9,
    price: 900,
    description: 'Explore the grand Durga Puja pandals, Bengali street food, and cultural festivities together.',
    tags: ['Festival', 'Street Food', 'Cultural Walk', 'Road Trips'],
    joinedUserIds: ['usr_seed_1', 'usr_seed_2', 'usr_seed_3', 'usr_seed_4'],
    members: [
      { userId: 'usr_seed_1', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_3', name: 'Siddharth Rao', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_4', name: 'Ananya Sen', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  {
    id: 'trend_03',
    aliases: ['plan_trend_3', 'trend_3', 'Trend_3', 'Trend!3'],
    title: 'Uttarakhand Trip',
    location: 'Uttarakhand',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Dec 10 - Dec 14',
    startDate: '2026-12-10',
    time: '07:00 AM',
    audience: 'Female only',
    joinedMembers: 5,
    totalMembers: 9,
    isPrivate: true,
    isTrending: true,
    isUpcoming: false,
    isWomenOnly: true,
    hostId: 'host_trend_3',
    hostName: 'Apoorva Sharma',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.98,
    price: 2400,
    description: 'Peaceful lake visit, boating, cafe hopping, and valley sunset viewpoints across Uttarakhand.',
    tags: ['Lakes', 'Boating', 'Safe Travel', 'Women Only', 'Road Trips'],
    joinedUserIds: ['usr_seed_2', 'usr_seed_4', 'usr_seed_6', 'usr_seed_8', 'usr_seed_9'],
    members: [
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_4', name: 'Ananya Sen', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_6', name: 'Neha Joshi', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_8', name: 'Sneha Patel', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_9', name: 'Deepa Roy', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  {
    id: 'upcoming_02',
    aliases: ['plan_up_2', 'upcoming_2', 'up_2'],
    title: 'Manali Snow Adventure',
    location: 'Solang Valley, Manali',
    imageUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Dec 15 - Dec 20',
    startDate: '2026-12-15',
    time: '06:30 AM',
    audience: 'Everyone',
    joinedMembers: 6,
    totalMembers: 10,
    isPrivate: false,
    isTrending: false,
    isUpcoming: true,
    isWomenOnly: false,
    hostId: 'host_up_2',
    hostName: 'Aditya Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.96,
    price: 3200,
    description: 'Early winter snow drive, paragliding at Solang valley, and cozy cafe exploration in Old Manali.',
    tags: ['Snow', 'Cafes', 'Adventure', 'Road Trips'],
    joinedUserIds: ['usr_seed_1', 'usr_seed_2', 'usr_seed_3', 'usr_seed_4', 'usr_seed_5', 'usr_seed_6'],
    members: [
      { userId: 'usr_seed_1', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_3', name: 'Siddharth Rao', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_4', name: 'Ananya Sen', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_5', name: 'Vikram Sethi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_6', name: 'Neha Joshi', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  {
    id: 'upcoming_03',
    aliases: ['plan_up_3', 'upcoming_3', 'up_3'],
    title: 'Goa Beach & Sunsets',
    location: 'North Goa (Vagator & Morjim)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Dec 22 - Dec 26',
    startDate: '2026-12-22',
    time: '07:30 AM',
    audience: 'Everyone',
    joinedMembers: 3,
    totalMembers: 6,
    isPrivate: false,
    isTrending: false,
    isUpcoming: true,
    isWomenOnly: false,
    hostId: 'host_up_3',
    hostName: 'Kavya Reddy',
    hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.98,
    price: 2100,
    description: 'Chill beach days, seaside sunsets, acoustic music jams, and seaside seafood dinners.',
    tags: ['Beach', 'Sunset', 'Relax', 'Road Trips'],
    joinedUserIds: ['usr_seed_1', 'usr_seed_2', 'usr_seed_3'],
    members: [
      { userId: 'usr_seed_1', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_3', name: 'Siddharth Rao', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  {
    id: 'plan_exp_1',
    title: 'Jaipur Heritage Walk',
    location: 'Jaipur, Rajasthan',
    imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    dateRange: 'Oct 20 - Oct 22',
    startDate: '2026-10-20',
    time: '06:00 AM',
    audience: 'Everyone',
    joinedMembers: 8,
    totalMembers: 10,
    isPrivate: false,
    isTrending: false,
    isUpcoming: false,
    isWomenOnly: false,
    hostId: 'host_exp_1',
    hostName: 'Rajesh Sharma',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    hostRating: 4.92,
    price: 1200,
    description: 'Historical morning tour covering Amer Fort, Hawa Mahal, and local heritage bazaars.',
    tags: ['Heritage', 'Cultural Walk', 'Historic'],
    joinedUserIds: ['usr_seed_1', 'usr_seed_2', 'usr_seed_3', 'usr_seed_4'],
    members: [
      { userId: 'usr_seed_1', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
      { userId: 'usr_seed_2', name: 'Pooja Verma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' }
    ]
  }
];

let strangerReels = [
  {
    id: 'reel_01',
    hostName: 'Aditya Verma',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    isVerified: true,
    route: 'Hyderabad ➔ Goa Beach Drive 🌅',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
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
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
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
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
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
      JSON.stringify({ strangerTrips, strangerMeetups, strangerPlans, strangerReels }, null, 2)
    );
  } catch (e) {}
};

const loadStore = () => {
  try {
    if (fs.existsSync(storeFilePath)) {
      const data = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
      if (Array.isArray(data.strangerTrips) && data.strangerTrips.length > 0) {
        const hasSai = data.strangerTrips.some(
          (t) => t.id === 'stranger_1792606140308' || t.id === 'TRP-300002' || (Array.isArray(t.aliases) && t.aliases.includes('stranger_1792606140308'))
        );
        if (!hasSai) {
          data.strangerTrips.unshift(strangerTrips[0]);
        }
        strangerTrips = data.strangerTrips;
      }
      if (Array.isArray(data.strangerMeetups)) strangerMeetups = data.strangerMeetups;
      if (Array.isArray(data.strangerPlans)) strangerPlans = data.strangerPlans;
      if (Array.isArray(data.strangerReels) && data.strangerReels.length > 0) {
        const sampleTravelVideos = [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        ];
        strangerReels = data.strangerReels.map((r, idx) => ({
          ...r,
          videoUrl: (r.videoUrl && r.videoUrl.trim().length > 0 && !r.videoUrl.includes('oceans.mp4'))
            ? r.videoUrl
            : sampleTravelVideos[idx % sampleTravelVideos.length],
          thumbnailUrl: (r.thumbnailUrl && r.thumbnailUrl.trim().length > 0)
            ? r.thumbnailUrl
            : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        }));
      }
      saveStore();
    } else {
      saveStore();
    }
  } catch (e) {}
};

loadStore();

export const generateUniqueTripCode = (prefix = 'TRP') => {
  let code;
  let fullId;
  let exists = true;
  while (exists) {
    const num = Math.floor(100000 + Math.random() * 900000);
    code = String(num);
    fullId = `${prefix}-${code}`;
    const inTrips = strangerTrips.some(
      (t) => t.id === fullId || t.code === code || (Array.isArray(t.aliases) && t.aliases.includes(fullId))
    );
    const inPlans = strangerPlans.some(
      (p) => p.id === fullId || p.code === code || (Array.isArray(p.aliases) && p.aliases.includes(fullId))
    );
    if (!inTrips && !inPlans) {
      exists = false;
    }
  }
  return { code, fullId };
};

export const findStrangerTrip = (id) => {
  if (!id) return null;
  const raw = String(id).trim();
  const clean = raw.toLowerCase();
  const unprefix = clean.replace(/^(stranger_|trip_|trp_)/, '').replace(/^(trp-)/, '');
  const alphanum = clean.replace(/[^a-z0-9]/g, '');
  const numNormalized = alphanum.replace(/0(\d)$/, '$1');

  return (
    strangerTrips.find((t) => {
      if (!t || !t.id) return false;
      const tid = String(t.id).toLowerCase();
      const tidUnprefix = tid.replace(/^(stranger_|trip_|trp_)/, '').replace(/^(trp-)/, '');
      const tidAlphanum = tid.replace(/[^a-z0-9]/g, '');
      const tidNumNorm = tidAlphanum.replace(/0(\d)$/, '$1');

      if (
        t.id === raw ||
        tid === clean ||
        t.code === raw ||
        t.structuredId === raw ||
        tidUnprefix === unprefix ||
        tid === unprefix ||
        tidUnprefix === clean ||
        tidAlphanum === alphanum ||
        tidNumNorm === numNormalized
      ) {
        return true;
      }

      if (Array.isArray(t.aliases)) {
        return t.aliases.some((a) => {
          const al = String(a).toLowerCase();
          const alUnprefix = al.replace(/^(stranger_|trip_|trp_)/, '').replace(/^(trp-)/, '');
          const alAlphanum = al.replace(/[^a-z0-9]/g, '');
          const alNumNorm = alAlphanum.replace(/0(\d)$/, '$1');

          return (
            a === raw ||
            al === clean ||
            alUnprefix === unprefix ||
            al === unprefix ||
            alUnprefix === clean ||
            alAlphanum === alphanum ||
            alNumNorm === numNormalized
          );
        });
      }
      return false;
    }) || null
  );
};

// --- 1. STRANGER TRIPS ---
export const getStrangerTrips = async (
  { type, filter, vibe, isWomenOnly, womenOnly, mode, search, q, host, origin, destination, priceType, interest, includeExpired } = {},
  currentUserId = null
) => {
  let list = strangerTrips.filter((t) => t.status !== 'CANCELLED');

  const filterType = (type || filter || '').toLowerCase().trim();
  const shouldFilterExpired = includeExpired !== 'true' && includeExpired !== true && filterType !== 'myrides' && filterType !== 'hosted';
  if (shouldFilterExpired) {
    list = list.filter((t) => !isDateTimePast(t.date, t.time) && t.status !== 'COMPLETED' && t.status !== 'EXPIRED');
  }

  // Unified `type` or `filter` query parameter
  if (filterType && filterType !== 'all') {
    if (filterType === 'carpool' || filterType === 'car') {
      list = list.filter((t) => (t.mode || '').toLowerCase() === 'carpool');
    } else if (filterType === 'bikepool' || filterType === 'bike') {
      list = list.filter((t) => (t.mode || '').toLowerCase() === 'bikepool');
    } else if (filterType === 'womenonly' || filterType === 'women' || filterType === 'female' || filterType === 'women_only') {
      list = list.filter((t) => Boolean(t.isWomenOnly));
    } else if (filterType === 'weekendgetaway' || filterType === 'weekend' || filterType === 'weekend_getaway') {
      list = list.filter((t) => (t.vibe || '').toLowerCase() === 'weekendgetaway');
    } else if (filterType === 'intercitycommute' || filterType === 'commute' || filterType === 'intercity') {
      list = list.filter((t) => (t.vibe || '').toLowerCase() === 'intercitycommute');
    } else if (filterType === 'cityexplore' || filterType === 'explore' || filterType === 'city') {
      list = list.filter((t) => (t.vibe || '').toLowerCase() === 'cityexplore');
    } else if (filterType === 'free') {
      list = list.filter((t) => Number(t.pricePerPerson || 0) === 0);
    } else if (filterType === 'costsharing' || filterType === 'paid') {
      list = list.filter((t) => Number(t.pricePerPerson || 0) > 0);
    } else if (filterType === 'myrides' || filterType === 'hosted') {
      if (currentUserId) {
        list = list.filter((t) => t.hostId === currentUserId);
      }
    } else {
      list = list.filter((t) =>
        (t.vibe && t.vibe.toLowerCase() === filterType) ||
        (t.mode && t.mode.toLowerCase() === filterType) ||
        (Array.isArray(t.interests) && t.interests.some((i) => i.toLowerCase().includes(filterType)))
      );
    }
  }

  // Individual specific filters
  if (vibe) {
    list = list.filter((t) => t.vibe && t.vibe.toLowerCase() === vibe.toLowerCase());
  }
  const isWomenCheck = isWomenOnly !== undefined ? isWomenOnly : womenOnly;
  if (isWomenCheck !== undefined) {
    const isWomenBool = isWomenCheck === 'true' || isWomenCheck === true;
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
  if (origin) {
    const o = origin.toLowerCase();
    list = list.filter((t) => t.origin && t.origin.toLowerCase().includes(o));
  }
  if (destination) {
    const d = destination.toLowerCase();
    list = list.filter((t) => t.destination && t.destination.toLowerCase().includes(d));
  }
  if (interest) {
    const intLower = interest.toLowerCase();
    list = list.filter((t) =>
      Array.isArray(t.interests) && t.interests.some((i) => i.toLowerCase().includes(intLower))
    );
  }
  const searchQuery = search || q;
  if (searchQuery) {
    const s = searchQuery.toLowerCase();
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
    const wasRejected = Boolean(
      currentUserId && (t.rejectedRequests || []).some((r) => r.passengerId === currentUserId)
    );

    return {
      ...t,
      id: t.id,
      code: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
      uniqueCode: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
      structuredId: t.structuredId || t.id,
      aliases: t.aliases || [],
      availableSeats: t.availableSeats !== undefined ? t.availableSeats : t.totalSeats,
      passengers,
      passengerRequests,
      isHost,
      hasRequested: Boolean(userRequest),
      userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : (wasRejected ? 'rejected' : 'none')),
      userRequest: userRequest || null,
      isConfirmedPassenger: isConfirmed,
      isConnected: isHost || Boolean(userRequest) || isConfirmed,
      canRequest: !isHost && !userRequest && !isConfirmed && !wasRejected && (t.availableSeats > 0),
    };
  });
};

export const getStrangerTripById = async (id, currentUserId = null) => {
  const t = findStrangerTrip(id);
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
  const wasRejected = Boolean(
    currentUserId && (t.rejectedRequests || []).some((r) => r.passengerId === currentUserId)
  );

  return {
    ...t,
    id: t.id,
    rideId: t.id,
    tripId: t.id,
    code: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
    uniqueCode: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
    structuredId: t.structuredId || t.id,
    aliases: t.aliases || [],
    availableSeats: t.availableSeats !== undefined ? t.availableSeats : t.totalSeats,
    passengers,
    passengerRequests,
    isHost,
    hasRequested: Boolean(userRequest),
    userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : (wasRejected ? 'rejected' : 'none')),
    userRequest: userRequest || null,
    isConfirmedPassenger: isConfirmed,
    isConnected: isHost || Boolean(userRequest) || isConfirmed,
    canRequest: !isHost && !userRequest && !isConfirmed && !wasRejected && (t.availableSeats > 0),
  };
};

export const parseDateTime = (dateInput, timeInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return dateInput;
  }
  const dateStr = String(dateInput).trim();
  const timeStr = timeInput ? String(timeInput).trim() : '';
  if (timeStr) {
    const combined = new Date(`${dateStr} ${timeStr}`);
    if (!isNaN(combined.getTime())) return combined;
  }
  const directDate = new Date(dateStr);
  if (!isNaN(directDate.getTime())) {
    if (timeStr) {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : null;
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const res = new Date(directDate);
        res.setHours(hours, minutes, 0, 0);
        return res;
      }
    }
    return directDate;
  }
  return null;
};

export const isDateTimePast = (dateInput, timeInput) => {
  const dt = parseDateTime(dateInput, timeInput);
  if (!dt) return false;
  return dt.getTime() < Date.now();
};

export const isDateTimePast24Hours = (dateInput, timeInput) => {
  const dt = parseDateTime(dateInput, timeInput);
  if (!dt) return false;
  return Date.now() - dt.getTime() > 24 * 60 * 60 * 1000;
};

export const getStrangerTripsByHost = (hostId) => {
  return strangerTrips.filter((t) => t.hostId === hostId);
};

export const formatStrangerTripForOffered = (t) => {
  const price = Number(t.pricePerPerson || 0);
  const isPast = isDateTimePast(t.date, t.time);
  const isPast24h = isDateTimePast24Hours(t.date, t.time);
  const hasMembers = (t.passengers && t.passengers.length > 0) || (t.passengerRequests && t.passengerRequests.some((r) => r.status === 'accepted' || r.status === 'completed')) || (t.membersCount && t.membersCount > 1) || (t.attendeesCount && t.attendeesCount > 1);

  let status = 'available';
  if (t.status === 'CANCELLED' || t.status === 'cancelled') {
    status = 'cancelled';
  } else if (t.status === 'COMPLETED' || t.status === 'completed') {
    status = 'completed';
  } else if (t.status === 'IN_PROGRESS' || t.status === 'inprogress') {
    status = 'inprogress';
  } else if (isPast) {
    if (hasMembers) {
      status = 'completed';
    } else if (isPast24h) {
      status = 'expired';
    } else {
      status = 'available';
    }
  } else {
    status = 'available';
  }

  const isExpired = status === 'expired';

  return {
    id: t.id,
    rideId: t.id,
    tripId: t.id,
    code: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
    uniqueCode: t.code || (t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-6) : null),
    structuredId: t.structuredId || t.id,
    aliases: t.aliases || [],
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
    status,
    isExpired,
    meetingPoint: t.origin,
    isWomenOnly: Boolean(t.isWomenOnly),
    pricePerSeat: price,
    price: price,
    isFree: price === 0,
    pricingType: price === 0 ? 'FREE' : 'COST_SHARING',
    isHost: true,
    isStrangerTrip: true,
    imageUrl: t.imageUrl,
    passengerRequests: t.passengerRequests || [],
    passengers: t.passengers || [],
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
  const trip = findStrangerTrip(tripId);
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
    code: trip.code || (trip.id ? String(trip.id).replace(/[^0-9]/g, '').slice(-6) : null),
    uniqueCode: trip.code || (trip.id ? String(trip.id).replace(/[^0-9]/g, '').slice(-6) : null),
    structuredId: trip.structuredId || trip.id,
    aliases: trip.aliases || [],
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
      { id: 'stop_1', name: trip.origin, type: 'START', latitude: toCoord(trip.originLat), longitude: toCoord(trip.originLng), sequence: 1 },
      { id: 'stop_2', name: trip.destination, type: 'END', latitude: toCoord(trip.destLat), longitude: toCoord(trip.destLng), sequence: 2 },
    ],
    message: 'Stranger trip started successfully! Drive safely.',
  };
};

export const completeStrangerTrip = (userId, tripId) => {
  const trip = findStrangerTrip(tripId);
  if (!trip) return null;
  trip.status = 'COMPLETED';
  saveStore();

  try {
    const io = getIO();
    if (io) {
      io.to(`trip:${trip.id}`).emit('trip:status', { tripId: trip.id, status: 'COMPLETED' });
      io.to(`trip:${trip.id}`).emit('trip_completed', { tripId: trip.id });
      io.to(`trip:${trip.id}`).emit('trip:status_change', { tripId: trip.id, status: 'COMPLETED' });
    }
  } catch (_) {}

  // Dispatch completion push and notification to all passengers
  if (trip.passengers && trip.passengers.length > 0) {
    for (const p of trip.passengers) {
      const pId = p.passengerId || p.userId || p.id;
      if (pId && !pId.startsWith('mock_')) {
        createNotification({
          userId: pId,
          type: 'RATING_REQUEST',
          title: 'Trip Completed! 🎉',
          message: `Your trip to ${trip.destination || trip.endLocationName || 'destination'} is complete. Please rate your captain!`,
          data: {
            tripId: trip.id,
            rideId: trip.id,
            bookingId: p.bookingId || p.id,
            route: '/active-ride',
          },
          sendPush: true,
        }).catch((e) => console.warn('Failed to dispatch stranger trip complete notification:', e.message));

        try {
          const io = getIO();
          if (io) {
            io.to(`user:${pId}`).emit('trip:completed', { tripId: trip.id, status: 'COMPLETED' });
            io.to(`user:${pId}`).emit('trip:status', { tripId: trip.id, status: 'COMPLETED' });
          }
        } catch (_) {}
      }
    }
  }

  return {
    id: trip.id,
    rideId: trip.id,
    tripId: trip.id,
    code: trip.code || (trip.id ? String(trip.id).replace(/[^0-9]/g, '').slice(-6) : null),
    uniqueCode: trip.code || (trip.id ? String(trip.id).replace(/[^0-9]/g, '').slice(-6) : null),
    structuredId: trip.structuredId || trip.id,
    aliases: trip.aliases || [],
    status: 'completed',
    statusLabel: 'Completed',
    rawStatus: 'COMPLETED',
    isCompleted: true,
    completedAt: new Date().toISOString(),
    message: 'Stranger trip completed successfully! Thank you for sharing your ride.',
  };
};

export const cancelStrangerTrip = (userId, tripId) => {
  const trip = findStrangerTrip(tripId);
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

  const { code, fullId } = generateUniqueTripCode('TRP');
  const tripId = fullId;
  const totalSeats = Number(data.totalSeats || 1);
  const newTrip = {
    id: tripId,
    code,
    uniqueCode: code,
    structuredId: tripId,
    aliases: [tripId, `TRP${code}`, code, `stranger_${code}`, `stranger_${Date.now()}`],
    hostId: userId,
    hostName: user?.displayName || 'Traveler',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 5.0,
    totalTrips: 1,
    isVerified: true,
    origin: data.origin,
    destination: data.destination,
    originLat: toCoord(data.originLat),
    originLng: toCoord(data.originLng),
    destLat: toCoord(data.destLat),
    destLng: toCoord(data.destLng),
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
          startLat: toCoord(data.originLat),
          startLng: toCoord(data.originLng),
          endLocationName: data.destination,
          endLat: toCoord(data.destLat),
          endLng: toCoord(data.destLng),
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
              { name: data.origin, sequence: 1, stopType: 'START', latitude: toCoord(data.originLat), longitude: toCoord(data.originLng) },
              { name: data.destination, sequence: 2, stopType: 'END', latitude: toCoord(data.destLat), longitude: toCoord(data.destLng) },
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
  const trip = findStrangerTrip(tripId);
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
  if (data.status !== undefined) trip.status = data.status;
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

  // If date/time was updated to the future and was expired/none, revive status to PUBLISHED
  if (!isDateTimePast(trip.date, trip.time) && (trip.status === 'EXPIRED' || !trip.status)) {
    trip.status = 'PUBLISHED';
  }

  saveStore();

  // Sync to Prisma ride if exists
  try {
    const existingRide = await prisma.ride.findUnique({ where: { id: trip.id } });
    if (existingRide) {
      const newDepDate = parseDateTime(trip.date, trip.time);
      await prisma.ride.update({
        where: { id: trip.id },
        data: {
          ...(newDepDate ? { departureAt: newDepDate } : {}),
          startLocationName: trip.origin,
          endLocationName: trip.destination,
          totalSeats: trip.totalSeats,
          availableSeats: trip.availableSeats,
          notes: trip.notes,
          ...(trip.status === 'CANCELLED' ? { status: 'CANCELLED' } : { status: 'PUBLISHED' }),
        },
      });
    }
  } catch (err) {}

  return trip;
};

export const deleteStrangerTrip = async (userId, tripId) => {
  const trip = findStrangerTrip(tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');
  const index = strangerTrips.findIndex((t) => t.id === trip.id);

  // Verify ownership (allow seeded mock host IDs or matching user ID)
  if (trip.hostId && trip.hostId !== userId && !trip.hostId.startsWith('host_')) {
    throw new ApiError(403, 'Unauthorized: You can only delete trips created by you');
  }

  strangerTrips.splice(index, 1);
  saveStore();
  return {
    success: true,
    tripId: trip.id,
    message: 'Stranger trip deleted successfully',
  };
};

export const joinStrangerTrip = async (userId, tripId, body = {}) => {
  const trip = findStrangerTrip(tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');

  if (trip.hostId === userId) {
    return {
      success: true,
      message: 'You are the host of this trip',
      isHost: true,
      status: 'accepted',
      tripId: trip.id,
      availableSeats: trip.availableSeats,
    };
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
    const existingReq = trip.passengerRequests.find((r) => r.passengerId === userId && r.status === 'pending');
    return {
      success: true,
      message: 'Your join request is already pending with the host',
      request: existingReq,
      passengerRequest: existingReq,
      bookingId: existingReq?.id || existingReq?.bookingId,
      status: 'pending',
      tripId: trip.id,
      availableSeats: trip.availableSeats,
    };
  }

  const alreadyJoined = trip.passengers.some(
    (p) => p.passengerId === userId && (p.isConfirmed || p.status === 'Confirmed' || p.status === 'accepted')
  );
  if (alreadyJoined) {
    return {
      success: true,
      message: 'You are already a confirmed member of this trip',
      status: 'accepted',
      tripId: trip.id,
      availableSeats: trip.availableSeats,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, phone: true, avatarUrl: true },
  });

  if ((trip.rejectedRequests || []).some((r) => r.passengerId === userId)) {
    throw new ApiError(400, 'The host declined your request for this trip. Try another trip that fits you.');
  }

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
    notes: String(body.note || body.notes || '').trim().slice(0, 300) || 'Looking forward to co-traveling together!',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  trip.passengerRequests.push(newRequest);
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

  // Real-time Push & In-App Notification alert to host
  if (trip.hostId && trip.hostId !== userId) {
    createNotification({
      userId: trip.hostId,
      type: 'TRIP_JOIN_REQUEST',
      title: 'New Trip Join Request 🎒',
      message: `${user?.displayName || 'A commuter'} requested ${seatsRequested} seat(s) on your trip to ${trip.destination}`,
      data: {
        tripId: trip.id,
        rideId: trip.id,
        bookingId: requestId,
        passengerId: userId,
        passengerName: user?.displayName || 'Passenger',
        seats: String(seatsRequested),
        route: '/my-rides',
      },
      sendPush: true,
    }).catch((e) => console.warn('Failed to dispatch stranger join notification:', e.message));

    try {
      const io = getIO();
      const eventPayload = {
        rideId: trip.id,
        bookingId: requestId,
        passengerId: userId,
        passengerName: user?.displayName || 'Passenger',
        passengerAvatar: user?.avatarUrl || null,
        passengerPhone: user?.phone || null,
        seatsRequested,
        totalFare,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        message: `${user?.displayName || 'A commuter'} requested a seat on your ride`,
      };
      io.to(`user:${trip.hostId}`).emit('ride:seat_requested', eventPayload);
      io.to(`user:${trip.hostId}`).emit('notification', {
        title: 'New Seat Request 🚗',
        body: `${user?.displayName || 'A commuter'} requested ${seatsRequested} seat(s) on your trip to ${trip.destination}`,
        data: eventPayload,
      });
    } catch (_) {}
  }

  // Real-time Push & In-App Notification alert to joining passenger
  createNotification({
    userId,
    type: 'TRIP_JOIN_REQUEST',
    title: 'Trip Request Sent 🎒',
    message: `Your request for ${seatsRequested} seat(s) to ${trip.destination} has been sent to the host.`,
    data: {
      tripId: trip.id,
      rideId: trip.id,
      bookingId: requestId,
      seats: String(seatsRequested),
      route: '/my-rides',
    },
    sendPush: true,
  }).catch((e) => console.warn('Failed to dispatch passenger join notification:', e.message));

  return {
    success: true,
    message: `Request sent to ${trip.hostName || 'the host'}. You'll be notified once they accept.`,
    status: 'pending',
    userRequestStatus: 'pending',
    request: newRequest,
    passengerRequest: newRequest,
    bookingId: requestId,
    tripId: trip.id,
    availableSeats: trip.availableSeats,
  };
};

/** Passenger withdraws a request the host hasn't answered yet. */
export const cancelStrangerTripRequest = async (userId, tripId) => {
  const trip = findStrangerTrip(tripId);
  if (!trip) throw new ApiError(404, 'Stranger trip not found');
  const idx = (trip.passengerRequests || []).findIndex(
    (r) => r.passengerId === userId && r.status === 'pending'
  );
  if (idx === -1) throw new ApiError(404, 'No pending request to withdraw');
  const [req] = trip.passengerRequests.splice(idx, 1);
  saveStore();
  try {
    await prisma.booking.update({
      where: { id: req.bookingId || req.id },
      data: { status: 'CANCELLED' },
    });
  } catch (_) {}
  return {
    success: true,
    status: 'cancelled',
    userRequestStatus: 'none',
    message: 'Your request was withdrawn',
    tripId: trip.id,
  };
};

export const respondToStrangerTripRequest = async (hostUserId, tripId, requestId, action) => {
  const trip = findStrangerTrip(tripId);
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

    // Dispatch real-time socket and push notification to passenger
    const targetPassengerId = req.passengerId || req.userId || req.id;
    if (targetPassengerId && !targetPassengerId.startsWith('mock_')) {
      createNotification({
        userId: targetPassengerId,
        type: 'BOOKING_ACCEPTED',
        title: 'Ride Request Accepted! 🚗',
        message: `${trip.hostName || 'Host'} accepted your ride to ${trip.destination || trip.endLocationName || 'destination'}. Get ready!`,
        data: {
          tripId: trip.id,
          rideId: trip.id,
          bookingId: req.bookingId || req.id,
          route: '/active-ride',
        },
        sendPush: true,
      }).catch((e) => console.warn('Failed to dispatch stranger accept notification:', e.message));

      try {
        const io = getIO();
        if (io) {
          io.to(`user:${targetPassengerId}`).emit('ride:accepted', {
            rideId: trip.id,
            tripId: trip.id,
            bookingId: req.bookingId || req.id,
            status: 'ACCEPTED',
          });
          io.to(`user:${targetPassengerId}`).emit('trip:accepted', {
            tripId: trip.id,
            bookingId: req.bookingId || req.id,
            status: 'ACCEPTED',
          });
        }
      } catch (_) {}
    }

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
    if (!Array.isArray(trip.rejectedRequests)) trip.rejectedRequests = [];
    trip.rejectedRequests.push({ ...req, rejectedAt: new Date().toISOString() });
    saveStore();

    const rejectedPassengerId = req.passengerId || req.userId;
    if (rejectedPassengerId && !String(rejectedPassengerId).startsWith('mock_')) {
      createNotification({
        userId: rejectedPassengerId,
        type: 'BOOKING_REJECTED',
        title: 'Trip request declined',
        message: `${trip.hostName || 'The host'} couldn't take you to ${trip.destination || 'the destination'} this time.`,
        data: { tripId: trip.id, rideId: trip.id, bookingId: req.bookingId || req.id, route: '/stranger-mode' },
        sendPush: true,
      }).catch(() => {});
      try {
        getIO()?.to(`user:${rejectedPassengerId}`).emit('trip:rejected', {
          tripId: trip.id,
          bookingId: req.bookingId || req.id,
          status: 'REJECTED',
        });
      } catch (_) {}
    }
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
export const getStrangerMeetups = async (query = {}, currentUserId = null) => {
  const {
    category,
    search,
    q,
    host,
    audienceType,
    audience,
    isWomenOnly,
    womenOnly,
    date,
    day,
    area,
    location,
    venue,
    maxDistance,
    distance,
    tag,
    tags,
    interest,
    isFree,
    expenseType,
    isRsvped,
    rsvpedOnly,
    myMeetups,
    hasSeats,
    availableOnly,
    sortBy,
    sort,
  } = query;

  let list = [...strangerMeetups];

  // 1. Category Filter (Supports exact, partial, tag-level, or comma-separated: 'Coffee,Tech')
  const catFilter = (category || tag || tags || interest || '').trim().toLowerCase();
  if (catFilter && catFilter !== 'all') {
    const cats = catFilter.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
    const catWords = catFilter.split(/[\s,&]+/).filter((w) => w.length > 2);
    list = list.filter((m) => {
      const mCat = (m.category || '').toLowerCase();
      const inCat = cats.some((c) => mCat.includes(c) || c.includes(mCat)) ||
                    catWords.some((w) => mCat.includes(w));
      const inTags = Array.isArray(m.tags) && m.tags.some((t) => {
        const tLow = t.toLowerCase();
        return cats.some((c) => tLow.includes(c) || c.includes(tLow)) ||
               catWords.some((w) => tLow.includes(w));
      });
      const inTitle = catWords.some((w) => (m.title || '').toLowerCase().includes(w));
      return inCat || inTags || inTitle;
    });
  }

  // 2. Audience / Women-Only Filter
  const womenFilter = isWomenOnly === 'true' || isWomenOnly === true ||
                      womenOnly === 'true' || womenOnly === true ||
                      audienceType?.toLowerCase() === 'women only' ||
                      audience?.toLowerCase() === 'women only';
  if (womenFilter) {
    list = list.filter((m) => (m.audienceType || '').toLowerCase().includes('women'));
  } else if (audienceType && audienceType !== 'All' && audienceType !== 'all') {
    const aud = audienceType.toLowerCase();
    list = list.filter((m) => (m.audienceType || '').toLowerCase().includes(aud));
  }

  // 3. Date / Day Filter (today, tomorrow, weekend, saturday, sunday, friday, etc.)
  const dateFilter = (date || day || '').trim().toLowerCase();
  if (dateFilter && dateFilter !== 'all') {
    list = list.filter((m) => {
      const mDate = (m.date || '').toLowerCase();
      if (dateFilter === 'weekend') {
        return mDate.includes('saturday') || mDate.includes('sunday') || mDate.includes('weekend');
      }
      return mDate.includes(dateFilter);
    });
  }

  // 4. Area / Location / Venue Filter
  const locFilter = (area || location || venue || '').trim().toLowerCase();
  if (locFilter) {
    list = list.filter((m) =>
      (m.area && m.area.toLowerCase().includes(locFilter)) ||
      (m.venueName && m.venueName.toLowerCase().includes(locFilter))
    );
  }

  // 5. Maximum Distance / Proximity Filter (in km)
  const distLimit = Number(maxDistance || distance);
  if (!isNaN(distLimit) && distLimit > 0) {
    list = list.filter((m) => Number(m.distanceKm || 0) <= distLimit);
  }

  // 6. Tag / Interest Filter
  const tagFilter = (tag || tags || interest || '').trim().toLowerCase();
  if (tagFilter && tagFilter !== 'all') {
    list = list.filter((m) =>
      Array.isArray(m.tags) && m.tags.some((t) => t.toLowerCase().includes(tagFilter))
    );
  }

  // 7. Free / Expense Type Filter
  const freeFilter = isFree === 'true' || isFree === true || expenseType?.toLowerCase() === 'free';
  if (freeFilter) {
    list = list.filter((m) => (m.expenseType || '').toLowerCase().includes('free'));
  } else if (expenseType && expenseType !== 'all') {
    const exp = expenseType.toLowerCase();
    list = list.filter((m) => (m.expenseType || '').toLowerCase().includes(exp));
  }

  // 8. Available Seats Filter
  const seatsOnly = hasSeats === 'true' || hasSeats === true || availableOnly === 'true' || availableOnly === true;
  if (seatsOnly) {
    list = list.filter((m) => (m.attendeesCount || 0) < (m.maxAttendees || 10));
  }

  // 9. RSVPed / My Meetups Filter
  const rsvpFilter = isRsvped === 'true' || isRsvped === true || rsvpedOnly === 'true' || myMeetups === 'true';
  if (rsvpFilter) {
    list = list.filter((m) => {
      const isUserRsvped = currentUserId
        ? (m.rsvpedUserIds?.includes(currentUserId) || m.attendeesNames?.includes('You') || m.isRsvped)
        : m.isRsvped;
      const isHost = currentUserId ? m.hostId === currentUserId : false;
      return isUserRsvped || isHost;
    });
  }

  // 10. Host Name Filter
  if (host) {
    const h = host.toLowerCase();
    list = list.filter((m) => m.hostName && m.hostName.toLowerCase().includes(h));
  }

  // 11. Keyword Search across title, area, venue, host, category, tags, icebreaker
  const keyword = (search || q || '').trim().toLowerCase();
  if (keyword) {
    list = list.filter((m) =>
      (m.title && m.title.toLowerCase().includes(keyword)) ||
      (m.area && m.area.toLowerCase().includes(keyword)) ||
      (m.venueName && m.venueName.toLowerCase().includes(keyword)) ||
      (m.hostName && m.hostName.toLowerCase().includes(keyword)) ||
      (m.category && m.category.toLowerCase().includes(keyword)) ||
      (m.matchReason && m.matchReason.toLowerCase().includes(keyword)) ||
      (m.icebreakerPrompt && m.icebreakerPrompt.toLowerCase().includes(keyword)) ||
      (Array.isArray(m.tags) && m.tags.some((t) => t.toLowerCase().includes(keyword)))
    );
  }

  // 12. Sorting Options (distance, match, rating, attendees)
  const sortOption = (sortBy || sort || '').trim().toLowerCase();
  if (sortOption === 'distance' || sortOption === 'nearest') {
    list.sort((a, b) => Number(a.distanceKm || 0) - Number(b.distanceKm || 0));
  } else if (sortOption === 'match' || sortOption === 'matchpercentage') {
    list.sort((a, b) => Number(b.matchPercentage || 0) - Number(a.matchPercentage || 0));
  } else if (sortOption === 'rating') {
    list.sort((a, b) => Number(b.hostRating || 0) - Number(a.hostRating || 0));
  } else if (sortOption === 'attendees' || sortOption === 'popular') {
    list.sort((a, b) => Number(b.attendeesCount || 0) - Number(a.attendeesCount || 0));
  }

  // Enrich with user-specific context
  return list.map((m) => {
    const isHost = currentUserId ? m.hostId === currentUserId : false;
    const isUserRsvped = currentUserId
      ? Boolean(m.rsvpedUserIds && m.rsvpedUserIds.includes(currentUserId))
      : Boolean(m.isRsvped);
    return {
      ...m,
      isHost,
      isRsvped: isUserRsvped,
      availableSeats: Math.max(0, (m.maxAttendees || 6) - (m.attendeesCount || 0)),
      isFull: (m.attendeesCount || 0) >= (m.maxAttendees || 6),
    };
  });
};

export const getStrangerMeetupById = async (id, currentUserId = null) => {
  const meetup = strangerMeetups.find((m) => m.id === id);
  if (!meetup) throw new ApiError(404, 'Stranger meetup not found');
  const isHost = currentUserId ? meetup.hostId === currentUserId : false;
  const isUserRsvped = currentUserId
    ? Boolean(meetup.rsvpedUserIds && meetup.rsvpedUserIds.includes(currentUserId))
    : Boolean(meetup.isRsvped);

  return {
    ...meetup,
    isHost,
    isRsvped: isUserRsvped,
    availableSeats: Math.max(0, (meetup.maxAttendees || 6) - (meetup.attendeesCount || 0)),
    isFull: (meetup.attendeesCount || 0) >= (meetup.maxAttendees || 6),
  };
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
    attendeesCount: 0,
    attendeesAvatars: [],
    attendeesNames: [],
    audienceType: data.audienceType || 'Everyone',
    rsvpedUserIds: [],
    tags: data.tags || [],
    expenseType: data.expenseType || 'Self-order & split bills at venue',
  };

  strangerMeetups.unshift(newMeetup);
  saveStore();
  return {
    ...newMeetup,
    isHost: true,
    isRsvped: false,
    availableSeats: newMeetup.maxAttendees,
    isFull: false,
  };
};

export const rsvpStrangerMeetup = async (userId, meetupId) => {
  const meetup = strangerMeetups.find((m) => m.id === meetupId);
  if (!meetup) throw new ApiError(404, 'Stranger meetup not found');

  if (!meetup.rsvpedUserIds) {
    meetup.rsvpedUserIds = [];
  }
  if (!meetup.attendeesNames) {
    meetup.attendeesNames = [];
  }
  if (!meetup.attendeesAvatars) {
    meetup.attendeesAvatars = [];
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, avatarUrl: true },
  });

  const alreadyRsvped = meetup.rsvpedUserIds.includes(userId);
  let isRsvped = false;

  if (alreadyRsvped) {
    meetup.rsvpedUserIds = meetup.rsvpedUserIds.filter((id) => id !== userId);
    if (user?.displayName) {
      meetup.attendeesNames = meetup.attendeesNames.filter((n) => n !== user.displayName && n !== 'You');
    }
    if (user?.avatarUrl) {
      meetup.attendeesAvatars = meetup.attendeesAvatars.filter((a) => a !== user.avatarUrl);
    }
    meetup.attendeesCount = Math.max(0, (meetup.attendeesCount || 1) - 1);
    isRsvped = false;
  } else {
    meetup.rsvpedUserIds.push(userId);
    const userName = user?.displayName || 'Attendee';
    if (!meetup.attendeesNames.includes(userName)) {
      meetup.attendeesNames.push(userName);
    }
    const userAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
    if (!meetup.attendeesAvatars.includes(userAvatar)) {
      meetup.attendeesAvatars.push(userAvatar);
    }
    meetup.attendeesCount = (meetup.attendeesCount || 0) + 1;
    isRsvped = true;
  }
  meetup.isRsvped = isRsvped;
  saveStore();
  return {
    isRsvped,
    attendeesCount: meetup.attendeesCount,
    isHost: meetup.hostId === userId,
    message: isRsvped ? 'RSVP confirmed!' : 'RSVP cancelled',
  };
};

// --- 3. STRANGER PLANS ---

export const parsePlanDepartureDateTime = (plan) => {
  if (plan.departureDateTime) {
    const dt = new Date(plan.departureDateTime);
    if (!isNaN(dt.getTime())) return dt;
  }
  const timeStr = plan.time || '07:00 AM';
  if (plan.startDate) {
    const dt = parseDateTime(plan.startDate, timeStr);
    if (dt) return dt;
  }
  const dateRangeStr = String(plan.dateRange || '').trim();
  const startPart = dateRangeStr.split('-')[0].trim();
  const hasYear = /\d{4}/.test(startPart);
  const fullDateStr = hasYear ? startPart : `${startPart} 2026`;
  const dt = parseDateTime(fullDateStr, timeStr);
  if (dt) return dt;
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export const getPlanExpiryInfo = (plan) => {
  const departureDate = parsePlanDepartureDateTime(plan);
  // Cut-off is strictly 30 minutes before departure time
  const cutoffDate = new Date(departureDate.getTime() - 30 * 60 * 1000);
  const now = Date.now();
  const isCutoffPassed = now >= cutoffDate.getTime();
  const isDeparted = now >= departureDate.getTime();
  const minutesUntilCutoff = Math.round((cutoffDate.getTime() - now) / (60 * 1000));

  return {
    departureDateTime: departureDate.toISOString(),
    joinCutoffDateTime: cutoffDate.toISOString(),
    isCutoffPassed,
    isDeparted,
    isExpired: isCutoffPassed,
    minutesUntilCutoff,
  };
};

export const formatStrangerPlan = (p, currentUserId = null, currentUserGender = null) => {
  const members = Array.isArray(p.members) ? p.members : [];
  const joinedUserIds = Array.isArray(p.joinedUserIds)
    ? p.joinedUserIds
    : members.map((m) => m.userId || m.id);
  const total = Number(p.totalMembers || 10);
  const count = members.length > 0 ? members.length : Number(p.joinedMembers || 1);
  const isJoined = Boolean(
    currentUserId &&
      (joinedUserIds.includes(currentUserId) ||
        members.some((m) => m.userId === currentUserId || m.id === currentUserId))
  );
  const isHost = Boolean(currentUserId && p.hostId === currentUserId);
  const availableSeats = Math.max(0, total - count);
  const isFull = count >= total;

  const expiryInfo = getPlanExpiryInfo(p);
  const isFemaleOnly =
    Boolean(p.isWomenOnly) ||
    Boolean(p.audience && /female|women/i.test(p.audience));

  // Determine user gender for eligibility
  const normalizedUserGender = currentUserGender
    ? String(currentUserGender).toUpperCase()
    : null;
  const canGenderJoin = !isFemaleOnly || (normalizedUserGender === 'FEMALE');

  // Per-user request state: none | pending | accepted | rejected
  const myRequest = latestPlanRequestFor(p, currentUserId);
  let requestStatus = 'none';
  if (isJoined || isHost) requestStatus = 'accepted';
  else if (myRequest && ['pending', 'rejected'].includes(myRequest.status)) requestStatus = myRequest.status;
  const joinRequests = Array.isArray(p.joinRequests) ? p.joinRequests : [];
  const pendingRequestsCount = joinRequests.filter((r) => r.status === 'pending').length;

  const canJoin =
    !expiryInfo.isExpired && !isFull && !isJoined && canGenderJoin && requestStatus === 'none';

  let cannotJoinReason = null;
  if (expiryInfo.isExpired) {
    cannotJoinReason = 'Join window closed (cut-off is 30 minutes before departure)';
  } else if (isJoined) {
    cannotJoinReason = 'You have already joined this plan';
  } else if (requestStatus === 'pending') {
    cannotJoinReason = 'Your request is waiting for the host';
  } else if (requestStatus === 'rejected') {
    cannotJoinReason = 'The host declined your request';
  } else if (isFull) {
    cannotJoinReason = 'This travel plan is full';
  } else if (!canGenderJoin) {
    cannotJoinReason = 'This plan is exclusively for female travelers (Female only)';
  }

  let status = 'OPEN';
  if (expiryInfo.isExpired) {
    status = 'EXPIRED';
  } else if (isJoined) {
    status = 'JOINED';
  } else if (requestStatus === 'pending') {
    status = 'REQUESTED';
  } else if (isFull) {
    status = 'FULL';
  }

  return {
    id: p.id,
    planId: p.id,
    code: p.code || (p.id ? String(p.id).replace(/[^0-9]/g, '').slice(-6) : null),
    uniqueCode: p.code || (p.id ? String(p.id).replace(/[^0-9]/g, '').slice(-6) : null),
    structuredId: p.structuredId || p.id,
    aliases: p.aliases || [],
    title: p.title,
    location: p.location,
    imageUrl: p.imageUrl,
    dateRange: p.dateRange,
    startDate: p.startDate || p.dateRange?.split('-')[0]?.trim() || null,
    time: p.time || '07:00 AM',
    departureDateTime: expiryInfo.departureDateTime,
    joinCutoffDateTime: expiryInfo.joinCutoffDateTime,
    minutesUntilCutoff: expiryInfo.minutesUntilCutoff,
    isExpired: expiryInfo.isExpired,
    audience: p.audience || (isFemaleOnly ? 'Female only' : 'Everyone'),
    isWomenOnly: isFemaleOnly,
    joinedMembers: count,
    totalMembers: total,
    availableSeats,
    canJoin,
    cannotJoinReason,
    isPrivate: Boolean(p.isPrivate),
    isTrending: Boolean(p.isTrending),
    isUpcoming: Boolean(p.isUpcoming),
    hostId: p.hostId || 'host_default',
    hostName: p.hostName,
    hostAvatar: p.hostAvatar,
    hostRating: Number(p.hostRating || 4.95),
    price: Number(p.price || 0),
    description: p.description || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    members,
    joinedUserIds,
    isJoined,
    isHost,
    status,
    requestStatus,
    isRequested: requestStatus === 'pending',
    // Only the host sees how many people are waiting.
    pendingRequestsCount: isHost ? pendingRequestsCount : 0,
  };
};

export const getStrangerPlans = async (
  { filter, interest, category, tag, type, search, host, includeExpired } = {},
  currentUserId = null,
  currentUserGender = null
) => {
  let list = [...strangerPlans];
  if (filter === 'trending') list = list.filter((p) => p.isTrending);
  if (filter === 'upcoming') list = list.filter((p) => p.isUpcoming);

  const filterCategory = (category || tag || interest || type || '').trim().toLowerCase();
  if (filterCategory && filterCategory !== 'all') {
    const normFilter = filterCategory.replace(/&/g, '').replace(/s\b/g, '').trim();
    const words = filterCategory.split(/[\s,&]+/).filter((w) => w.length > 2);
    list = list.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const normPCat = pCat.replace(/&/g, '').replace(/s\b/g, '').trim();
      const catMatch =
        pCat.includes(filterCategory) ||
        filterCategory.includes(pCat) ||
        normPCat.includes(normFilter) ||
        normFilter.includes(normPCat) ||
        words.some((w) => pCat.includes(w));

      const tagMatch =
        Array.isArray(p.tags) &&
        p.tags.some((t) => {
          const tLow = t.toLowerCase();
          const tNorm = tLow.replace(/&/g, '').replace(/s\b/g, '').trim();
          return (
            tLow.includes(filterCategory) ||
            filterCategory.includes(tLow) ||
            tNorm.includes(normFilter) ||
            normFilter.includes(tNorm) ||
            words.some((w) => tLow.includes(w))
          );
        });

      const titleMatch = words.some((w) => (p.title || '').toLowerCase().includes(w));
      return catMatch || tagMatch || titleMatch;
    });
  }
  if (host) {
    const h = host.toLowerCase();
    list = list.filter((p) => p.hostName && p.hostName.toLowerCase().includes(h));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(s)) ||
        (p.location && p.location.toLowerCase().includes(s)) ||
        (p.hostName && p.hostName.toLowerCase().includes(s))
    );
  }
  let formatted = list.map((p) => formatStrangerPlan(p, currentUserId, currentUserGender));
  if (includeExpired !== 'true' && includeExpired !== true) {
    formatted = formatted.filter((p) => !p.isExpired);
  }
  return formatted;
};

export const getTrendingPlans = async (query = {}, currentUserId = null, currentUserGender = null) => {
  return getStrangerPlans({ ...query, filter: 'trending' }, currentUserId, currentUserGender);
};

export const getUpcomingPlans = async (query = {}, currentUserId = null, currentUserGender = null) => {
  const basePlans = await getStrangerPlans({ ...query, filter: 'upcoming' }, currentUserId, currentUserGender);

  // Format published stranger trips as plans so they appear in /plans/upcoming
  const tripPlans = strangerTrips
    .filter((t) => t.status !== 'CANCELLED' && (query.includeExpired === 'true' || query.includeExpired === true || !isDateTimePast(t.date, t.time)))
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
      const wasRejected = Boolean(
        currentUserId && (t.rejectedRequests || []).some((r) => r.passengerId === currentUserId)
      );

      const expiryInfo = getPlanExpiryInfo({
        startDate: t.date,
        time: t.time || '07:00 AM',
      });

      return {
        id: t.id,
        planId: t.id,
        tripId: t.id,
        title: `${t.origin} to ${t.destination}`,
        location: t.destination,
        imageUrl: t.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        dateRange: t.date,
        startDate: t.date,
        time: t.time || '07:00 AM',
        departureDateTime: expiryInfo.departureDateTime,
        joinCutoffDateTime: expiryInfo.joinCutoffDateTime,
        minutesUntilCutoff: expiryInfo.minutesUntilCutoff,
        isExpired: expiryInfo.isExpired,
        audience: t.isWomenOnly ? 'Women Only' : 'Everyone',
        isWomenOnly: Boolean(t.isWomenOnly),
        joinedMembers: Math.max(1, booked),
        totalMembers: total,
        availableSeats: avail,
        canJoin: !expiryInfo.isExpired && avail > 0 && !isConfirmed && !userRequest && !wasRejected,
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
        status: expiryInfo.isExpired ? 'EXPIRED' : t.status,
        passengers,
        passengerRequests,
        isHost,
        isJoined: isConfirmed,
        requestStatus: isHost || isConfirmed ? 'accepted' : (userRequest ? 'pending' : (wasRejected ? 'rejected' : 'none')),
        isRequested: Boolean(userRequest) && !isConfirmed,
        pendingRequestsCount: isHost ? passengerRequests.length : 0,
        hasRequested: Boolean(userRequest),
        userRequestStatus: userRequest ? userRequest.status : (isConfirmed ? 'confirmed' : (wasRejected ? 'rejected' : 'none')),
        userRequest: userRequest || null,
        isConnected: isHost || Boolean(userRequest) || isConfirmed,
        canRequest: !isHost && !userRequest && !isConfirmed && !wasRejected && (avail > 0) && !expiryInfo.isExpired,
      };
    });

  const validTripPlans = (query.includeExpired === 'true' || query.includeExpired === true)
    ? tripPlans
    : tripPlans.filter((t) => !t.isExpired);

  return [...validTripPlans, ...basePlans];
};

export const getPlansByInterest = async ({ interest, search, host } = {}, currentUserId = null, currentUserGender = null) => {
  const all = await getStrangerPlans({ search, host }, currentUserId, currentUserGender);
  const interestSet = new Set(['All']);
  all.forEach((p) => {
    (p.tags || []).forEach((t) => interestSet.add(t));
  });

  let filtered = all;
  if (interest && interest !== 'All') {
    const intLower = interest.toLowerCase().trim();
    const intStem = intLower.replace(/s\b/g, '');
    const words = intLower.split(/\s+/).filter(Boolean);

    filtered = all.filter(
      (p) =>
        p.tags &&
        p.tags.some((t) => {
          const tagLower = t.toLowerCase().trim();
          const tagStem = tagLower.replace(/s\b/g, '');
          return (
            tagLower.includes(intLower) ||
            intLower.includes(tagLower) ||
            tagStem.includes(intStem) ||
            intStem.includes(tagStem) ||
            words.some((w) => w.length > 3 && tagLower.includes(w))
          );
        })
    );
  }

  return {
    interests: Array.from(interestSet),
    plans: filtered,
    allPlans: all,
  };
};

export const findStrangerPlan = (id) => {
  if (!id) return null;
  const raw = String(id).trim();
  const clean = raw.toLowerCase();
  const unplan = clean.replace(/^(plan_|trend_|upc_|exp_|trd_)/, '').replace(/^(trd-|upc-|exp-|pln-)/, '');
  const alphanum = clean.replace(/[^a-z0-9]/g, '');
  const numNormalized = alphanum.replace(/0(\d)$/, '$1');

  return (
    strangerPlans.find((p) => {
      if (!p || !p.id) return false;
      const pid = String(p.id).toLowerCase();
      const pidUnplan = pid.replace(/^(plan_|trend_|upc_|exp_|trd_)/, '').replace(/^(trd-|upc-|exp-|pln-)/, '');
      const pidAlphanum = pid.replace(/[^a-z0-9]/g, '');
      const pidNumNorm = pidAlphanum.replace(/0(\d)$/, '$1');

      if (
        p.id === raw ||
        pid === clean ||
        p.code === raw ||
        p.uniqueCode === raw ||
        p.structuredId === raw ||
        pidUnplan === unplan ||
        pid === unplan ||
        pidUnplan === clean ||
        pidAlphanum === alphanum ||
        pidNumNorm === numNormalized
      ) {
        return true;
      }

      if (Array.isArray(p.aliases)) {
        return p.aliases.some((a) => {
          const al = String(a).toLowerCase();
          const alUnplan = al.replace(/^(plan_|trend_|upc_|exp_|trd_)/, '').replace(/^(trd-|upc-|exp-|pln-)/, '');
          const alAlphanum = al.replace(/[^a-z0-9]/g, '');
          const alNumNorm = alAlphanum.replace(/0(\d)$/, '$1');

          return (
            a === raw ||
            al === clean ||
            alUnplan === unplan ||
            al === unplan ||
            alUnplan === clean ||
            alAlphanum === alphanum ||
            alNumNorm === numNormalized
          );
        });
      }
      return false;
    }) || null
  );
};

export const getStrangerPlanById = async (id, currentUserId = null, currentUserGender = null) => {
  const plan = findStrangerPlan(id);
  if (!plan) throw new ApiError(404, 'Travel plan not found');
  return formatStrangerPlan(plan, currentUserId, currentUserGender);
};

export const createStrangerPlan = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isFemaleOnly = data.audience === 'Female only' || Boolean(data.isWomenOnly);
  const { code, fullId } = generateUniqueTripCode('PLN');
  const newPlan = {
    id: fullId,
    code,
    uniqueCode: code,
    structuredId: fullId,
    aliases: [fullId, `PLN${code}`, code, `plan_${code}`, `plan_${Date.now()}`],
    title: data.title,
    location: data.location,
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    dateRange: data.dateRange,
    startDate: data.startDate || data.dateRange?.split('-')[0]?.trim() || null,
    time: data.time || '07:00 AM',
    audience: data.audience || 'Everyone',
    isWomenOnly: isFemaleOnly,
    joinedMembers: 1,
    totalMembers: data.totalMembers || 10,
    isPrivate: Boolean(data.isPrivate),
    isTrending: false,
    isUpcoming: true,
    hostId: userId,
    hostName: user?.displayName || user?.username || 'Host',
    hostAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    hostRating: 5.0,
    price: Number(data.price || 0),
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    joinedUserIds: [userId],
    members: [
      {
        userId,
        name: user?.displayName || user?.username || 'Host',
        avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  strangerPlans.unshift(newPlan);
  saveStore();
  return formatStrangerPlan(newPlan, userId, user?.gender);
};

export const joinStrangerPlan = async (userId, planId, body = {}) => {
  // If planId corresponds to a stranger trip, delegate to joinStrangerTrip!
  const linkedTrip = strangerTrips.find((t) => t.id === planId);
  if (linkedTrip) {
    return await joinStrangerTrip(userId, planId, body);
  }

  const rawPlan = findStrangerPlan(planId);
  if (!rawPlan) {
    throw new ApiError(404, 'Travel plan not found');
  }

  // 1. Time Expiry & Cutoff Validation (Strictly 30 minutes before departure)
  const expiryInfo = getPlanExpiryInfo(rawPlan);
  if (expiryInfo.isExpired) {
    const cutoffFormatted = new Date(expiryInfo.joinCutoffDateTime).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    throw new ApiError(
      400,
      `Joining for this travel plan has expired. The join cut-off window closed 30 minutes before departure (closed at: ${cutoffFormatted})`
    );
  }

  // Ensure members & joinedUserIds arrays exist
  if (!Array.isArray(rawPlan.members)) {
    rawPlan.members = [];
    const count = Number(rawPlan.joinedMembers || 1);
    for (let i = 0; i < count; i++) {
      rawPlan.members.push({
        userId: `usr_seed_${i + 1}`,
        name: `Traveler ${i + 1}`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        joinedAt: new Date().toISOString(),
      });
    }
  }
  if (!Array.isArray(rawPlan.joinedUserIds)) {
    rawPlan.joinedUserIds = rawPlan.members.map((m) => m.userId || m.id);
  }

  let dbUser = null;
  if (userId && !String(userId).startsWith('guest_')) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, username: true, avatarUrl: true, phone: true, gender: true },
      });
    } catch {}
  }

  const effectiveUserId = userId || dbUser?.id || body.userId || `guest_${Date.now()}`;
  const effectiveGender = (dbUser?.gender || body.gender || '').toUpperCase();
  const memberName = dbUser?.displayName || dbUser?.username || body.name || body.userName || 'Adventure Traveler';
  const memberAvatar =
    dbUser?.avatarUrl ||
    body.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';

  // 2. Female-Only Audience Validation
  const isFemaleOnly =
    Boolean(rawPlan.isWomenOnly) ||
    Boolean(rawPlan.audience && /female|women/i.test(rawPlan.audience));

  if (isFemaleOnly) {
    if (effectiveGender !== 'FEMALE') {
      throw new ApiError(
        403,
        'Access denied: This travel plan is exclusively for female travelers (Female only). Non-female travelers cannot join this plan.'
      );
    }
  }

  // 3. Host Check
  if (rawPlan.hostId && rawPlan.hostId === effectiveUserId) {
    const formatted = formatStrangerPlan(rawPlan, effectiveUserId, effectiveGender);
    return {
      success: true,
      isHost: true,
      isJoined: true,
      status: 'accepted',
      joinedMembers: formatted.joinedMembers,
      totalMembers: formatted.totalMembers,
      message: 'You are the host of this travel plan',
      plan: formatted,
    };
  }

  // 4. Already Joined Check
  const isAlreadyJoined =
    rawPlan.joinedUserIds.includes(effectiveUserId) ||
    rawPlan.members.some((m) => m.userId === effectiveUserId || m.id === effectiveUserId);

  if (isAlreadyJoined) {
    const formatted = formatStrangerPlan(rawPlan, effectiveUserId, effectiveGender);
    return {
      success: true,
      alreadyJoined: true,
      isJoined: true,
      joinedMembers: formatted.joinedMembers,
      totalMembers: formatted.totalMembers,
      message: 'You have already joined this travel plan!',
      plan: formatted,
    };
  }

  // 5. Existing request checks — joining is always host-approved, never instant.
  if (!Array.isArray(rawPlan.joinRequests)) rawPlan.joinRequests = [];
  const existing = latestPlanRequestFor(rawPlan, effectiveUserId);
  if (existing && existing.status === 'pending') {
    const formatted = formatStrangerPlan(rawPlan, effectiveUserId, effectiveGender);
    return {
      success: true,
      status: 'pending',
      requestStatus: 'pending',
      isRequested: true,
      isJoined: false,
      request: existing,
      message: `Your request is already with ${rawPlan.hostName || 'the host'}. We'll notify you once they respond.`,
      plan: formatted,
    };
  }
  if (existing && existing.status === 'rejected') {
    throw new ApiError(400, 'The host declined your request for this plan. Try another plan that fits you.');
  }

  // 6. Capacity Check
  const total = Number(rawPlan.totalMembers || 10);
  if (rawPlan.members.length >= total) {
    throw new ApiError(400, 'This travel plan is already full');
  }

  const request = {
    id: `preq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: effectiveUserId,
    name: memberName,
    avatar: memberAvatar,
    phone: dbUser?.phone || body.phone || null,
    gender: effectiveGender || null,
    note: String(body.note || body.notes || body.message || '').trim().slice(0, 300),
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  rawPlan.joinRequests.push(request);
  saveStore();

  const formattedPlan = formatStrangerPlan(rawPlan, effectiveUserId, effectiveGender);

  // Tell the host there's someone to review.
  if (rawPlan.hostId && rawPlan.hostId !== effectiveUserId) {
    createNotification({
      userId: rawPlan.hostId,
      type: 'PLAN_JOIN_REQUEST',
      title: 'New join request 🎒',
      message: `${memberName} wants to join "${rawPlan.title}". Review the request.`,
      data: { planId: rawPlan.id, requestId: request.id, passengerId: effectiveUserId, route: '/stranger-mode' },
      sendPush: true,
    }).catch(() => {});
    try {
      getIO().to(`user:${rawPlan.hostId}`).emit('plan:join_requested', {
        planId: rawPlan.id,
        request,
        pendingRequestsCount: formattedPlan.pendingRequestsCount,
      });
    } catch {}
  }

  return {
    success: true,
    status: 'pending',
    requestStatus: 'pending',
    isRequested: true,
    isJoined: false,
    joinedMembers: formattedPlan.joinedMembers,
    totalMembers: formattedPlan.totalMembers,
    availableSeats: formattedPlan.availableSeats,
    message: `Request sent to ${rawPlan.hostName || 'the host'}. You'll be notified once they accept.`,
    request,
    plan: formattedPlan,
  };
};

/** Most recent join request a user made on a plan (any status). */
function latestPlanRequestFor(plan, userId) {
  if (!userId || !Array.isArray(plan.joinRequests)) return null;
  const mine = plan.joinRequests.filter((r) => r.userId === userId);
  return mine.length ? mine[mine.length - 1] : null;
}

/** Host: list join requests for a plan (pending first). */
export const getStrangerPlanRequests = async (hostUserId, planId) => {
  // Trips also appear in the plans feed — review their seat requests instead.
  const linkedTrip = strangerTrips.find((t) => t.id === planId);
  if (linkedTrip) {
    if (linkedTrip.hostId !== hostUserId) {
      throw new ApiError(403, 'Only the trip host can view join requests');
    }
    const toItem = (r, status) => ({
      id: r.id,
      userId: r.passengerId,
      name: r.passengerName,
      avatar: r.passengerAvatar,
      note: r.notes,
      seats: r.seatsRequested,
      status,
      requestedAt: r.requestedAt,
    });
    const pending = (linkedTrip.passengerRequests || []).map((r) => toItem(r, 'pending'));
    const accepted = (linkedTrip.passengers || []).map((r) => toItem(r, 'accepted'));
    const rejected = (linkedTrip.rejectedRequests || []).map((r) => toItem(r, 'rejected'));
    return {
      planId: linkedTrip.id,
      title: `${linkedTrip.origin} to ${linkedTrip.destination}`,
      pendingCount: pending.length,
      requests: [...pending, ...accepted, ...rejected],
    };
  }

  const rawPlan = findStrangerPlan(planId);
  if (!rawPlan) throw new ApiError(404, 'Travel plan not found');
  if (rawPlan.hostId !== hostUserId) {
    throw new ApiError(403, 'Only the plan host can view join requests');
  }
  const list = Array.isArray(rawPlan.joinRequests) ? rawPlan.joinRequests : [];
  const order = { pending: 0, accepted: 1, rejected: 2, cancelled: 3 };
  return {
    planId: rawPlan.id,
    title: rawPlan.title,
    pendingCount: list.filter((r) => r.status === 'pending').length,
    requests: [...list].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)),
  };
};

/** Host: accept or reject a join request. */
export const respondToStrangerPlanRequest = async (hostUserId, planId, requestId, action) => {
  if (strangerTrips.some((t) => t.id === planId)) {
    return respondToStrangerTripRequest(hostUserId, planId, requestId, action);
  }
  const rawPlan = findStrangerPlan(planId);
  if (!rawPlan) throw new ApiError(404, 'Travel plan not found');
  if (rawPlan.hostId !== hostUserId) {
    throw new ApiError(403, 'Only the plan host can respond to join requests');
  }
  const req = (rawPlan.joinRequests || []).find((r) => r.id === requestId);
  if (!req) throw new ApiError(404, 'Join request not found');
  if (req.status !== 'pending') {
    throw new ApiError(400, `This request was already ${req.status}`);
  }

  const act = String(action || '').toUpperCase();
  const isAccept = ['ACCEPT', 'ACCEPTED', 'APPROVE'].includes(act);
  const isReject = ['REJECT', 'REJECTED', 'DECLINE'].includes(act);
  if (!isAccept && !isReject) throw new ApiError(400, 'Invalid action. Must be ACCEPT or REJECT');

  if (!Array.isArray(rawPlan.members)) rawPlan.members = [];
  if (!Array.isArray(rawPlan.joinedUserIds)) rawPlan.joinedUserIds = rawPlan.members.map((m) => m.userId || m.id);

  if (isAccept) {
    const total = Number(rawPlan.totalMembers || 10);
    if (rawPlan.members.length >= total) {
      throw new ApiError(400, 'Cannot accept: this plan is already full');
    }
    rawPlan.members.push({
      userId: req.userId,
      name: req.name,
      avatar: req.avatar,
      phone: req.phone,
      gender: req.gender,
      joinedAt: new Date().toISOString(),
    });
    if (!rawPlan.joinedUserIds.includes(req.userId)) rawPlan.joinedUserIds.push(req.userId);
    rawPlan.joinedMembers = rawPlan.members.length;
    req.status = 'accepted';
  } else {
    req.status = 'rejected';
  }
  req.respondedAt = new Date().toISOString();
  saveStore();

  const formattedPlan = formatStrangerPlan(rawPlan, hostUserId);

  createNotification({
    userId: req.userId,
    type: isAccept ? 'PLAN_REQUEST_ACCEPTED' : 'PLAN_REQUEST_REJECTED',
    title: isAccept ? "You're in! 🎉" : 'Join request declined',
    message: isAccept
      ? `${rawPlan.hostName || 'The host'} accepted you on "${rawPlan.title}". Say hi in the group chat.`
      : `${rawPlan.hostName || 'The host'} couldn't take you on "${rawPlan.title}" this time.`,
    data: { planId: rawPlan.id, requestId: req.id, route: '/stranger-mode' },
    sendPush: true,
  }).catch(() => {});

  try {
    const io = getIO();
    io.to(`user:${req.userId}`).emit('plan:request_responded', {
      planId: rawPlan.id,
      requestId: req.id,
      status: req.status,
    });
    if (isAccept) io.emit('plan:updated', formatStrangerPlan(rawPlan));
  } catch {}

  return {
    success: true,
    status: req.status,
    message: isAccept ? `${req.name} has been added to your plan` : `${req.name}'s request was declined`,
    request: req,
    plan: formattedPlan,
  };
};

export const leaveStrangerPlan = async (userId, planId) => {
  const rawPlan = findStrangerPlan(planId);
  if (!rawPlan) {
    throw new ApiError(404, 'Travel plan not found');
  }

  // Withdrawing a request that hasn't been answered yet.
  const pending = latestPlanRequestFor(rawPlan, userId);
  if (pending && pending.status === 'pending') {
    pending.status = 'cancelled';
    pending.respondedAt = new Date().toISOString();
    saveStore();
    return {
      success: true,
      isJoined: false,
      status: 'cancelled',
      requestStatus: 'none',
      message: 'Your join request was withdrawn',
      plan: formatStrangerPlan(rawPlan, userId),
    };
  }

  if (Array.isArray(rawPlan.members)) {
    rawPlan.members = rawPlan.members.filter((m) => m.userId !== userId && m.id !== userId);
  }
  if (Array.isArray(rawPlan.joinedUserIds)) {
    rawPlan.joinedUserIds = rawPlan.joinedUserIds.filter((id) => id !== userId);
  }
  rawPlan.joinedMembers = Math.max(1, rawPlan.members ? rawPlan.members.length : 1);

  saveStore();

  const formattedPlan = formatStrangerPlan(rawPlan, userId);

  try {
    const io = getIO();
    io.emit('plan:member_left', {
      planId: rawPlan.id,
      userId,
      joinedMembers: formattedPlan.joinedMembers,
      totalMembers: formattedPlan.totalMembers,
      plan: formattedPlan,
    });
    io.emit('plan:updated', formattedPlan);
  } catch {}

  return {
    success: true,
    isJoined: false,
    joinedMembers: formattedPlan.joinedMembers,
    totalMembers: formattedPlan.totalMembers,
    message: 'Left travel plan successfully',
    plan: formattedPlan,
  };
};

// --- 4. STRANGER REELS ---

/**
 * Automatically purges expired stranger trip reels.
 * Deletes reel metadata and removes uploaded video/thumbnail media files from disk
 * to preserve server storage and optimize hosting costs.
 */
export const purgeExpiredReels = () => {
  const now = Date.now();
  const toDelete = [];

  strangerReels = strangerReels.filter((r) => {
    let isExpired = false;

    // 1. Explicit expiresAt ISO date
    if (r.expiresAt) {
      const expDate = new Date(r.expiresAt);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < now) {
        isExpired = true;
      }
    }

    // 2. Trip Due Date
    if (!isExpired && r.dueDate) {
      const parsedDue = parseDateTime(r.dueDate);
      if (parsedDue && parsedDue.getTime() < now) {
        isExpired = true;
      }
    }

    // 3. Fallback to linked trip's departure date
    if (!isExpired && r.tripId) {
      const linked = strangerTrips.find((t) => t.id === r.tripId);
      if (linked && linked.date) {
        const tripDt = parseDateTime(linked.date, linked.time);
        if (tripDt && tripDt.getTime() < now) {
          isExpired = true;
        }
      }
    }

    if (isExpired) {
      toDelete.push(r);
      return false; // Remove from memory
    }
    return true;
  });

  if (toDelete.length > 0) {
    // Free local disk storage for deleted reels
    for (const reel of toDelete) {
      try {
        if (reel.videoUrl && reel.videoUrl.includes('/uploads/')) {
          const rel = reel.videoUrl.substring(reel.videoUrl.indexOf('/uploads/'));
          const filePath = path.join(process.cwd(), 'public', rel);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Storage Purge] Deleted expired reel video file: ${filePath}`);
          }
        }
        if (reel.thumbnailUrl && reel.thumbnailUrl.includes('/uploads/')) {
          const rel = reel.thumbnailUrl.substring(reel.thumbnailUrl.indexOf('/uploads/'));
          const filePath = path.join(process.cwd(), 'public', rel);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Storage Purge] Deleted expired reel thumbnail: ${filePath}`);
          }
        }
      } catch (err) {
        console.warn(`[Storage Purge] Error deleting file for reel ${reel.id}:`, err?.message);
      }
    }
    saveStore();
  }
};

export const getStrangerReels = async (userId = null, req = null) => {
  // Purge expired reels prior to returning results to ensure zero expired reels are sent
  purgeExpiredReels();

  return strangerReels.map((r, idx) => {
    const linkedTrip = strangerTrips.find((t) => t.id === r.tripId) || strangerTrips[0];
    const isLiked = Array.isArray(r.likedUserIds) && userId
      ? r.likedUserIds.includes(userId)
      : (r.isLiked || false);
    const isOwner = Boolean(
      userId && (r.userId === userId || r.hostId === userId)
    );

    const absoluteVideoUrl = toAbsoluteVideoUrl(r.videoUrl, r.vibe, r.id || idx, req);
    const absoluteThumbnail = toAbsoluteUrl(r.thumbnailUrl, req) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
    const absoluteAvatar = toAbsoluteUrl(r.hostAvatar, req);

    return {
      ...r,
      videoUrl: absoluteVideoUrl,
      thumbnailUrl: absoluteThumbnail,
      hostAvatar: absoluteAvatar || r.hostAvatar,
      isLiked,
      isOwner,
      isHost: isOwner,
      commentsCount: Array.isArray(r.comments) ? r.comments.length : (r.commentsCount || 3),
      trip: linkedTrip,
      dueDate: r.dueDate || linkedTrip?.date || null,
      expiresAt: r.expiresAt || null,
    };
  });
};

export const createStrangerReel = async (userId, data, req = null) => {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }).catch(() => null) : null;
  const linkedTrip = strangerTrips.find((t) => t.id === data.tripId) || strangerTrips[0];

  const newReelId = `reel_${Date.now()}`;
  const absoluteVideoUrl = toAbsoluteVideoUrl(data.videoUrl, data.vibe, newReelId, req);
  const absoluteThumbnail = toAbsoluteUrl(data.thumbnailUrl, req) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
  const absoluteAvatar = toAbsoluteUrl(data.userAvatar || user?.avatarUrl, req) || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80';

  // Compute auto-delete expiration date based on trip due date
  let computedExpiresAt = null;
  if (data.expiresAt) {
    const d = new Date(data.expiresAt);
    if (!isNaN(d.getTime())) computedExpiresAt = d.toISOString();
  } else if (data.dueDate) {
    const d = parseDateTime(data.dueDate);
    if (d) computedExpiresAt = d.toISOString();
  } else if (linkedTrip && linkedTrip.date) {
    const d = parseDateTime(linkedTrip.date, linkedTrip.time);
    if (d) computedExpiresAt = d.toISOString();
  }

  // Default fallback: 7 days from now if no trip date is provided
  if (!computedExpiresAt) {
    computedExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  const newReel = {
    id: newReelId,
    userId: userId,
    hostId: userId,
    hostName: data.userName || user?.displayName || 'SharingWala Creator',
    hostAvatar: absoluteAvatar,
    isVerified: user?.isVerified ?? true,
    route: data.route,
    thumbnailUrl: absoluteThumbnail,
    videoUrl: absoluteVideoUrl,
    vibe: data.vibe || 'weekendGetaway',
    caption: data.caption,
    audioTrack: data.audioTrack || 'Original Sound',
    likesCount: 1,
    viewsCount: '1',
    isLiked: true,
    isOwner: true,
    isHost: true,
    likedUserIds: [userId],
    comments: [],
    commentsCount: 0,
    tripId: linkedTrip.id,
    trip: linkedTrip,
    dueDate: data.dueDate || linkedTrip.date || null,
    expiresAt: computedExpiresAt,
    createdAt: new Date().toISOString(),
  };

  strangerReels.unshift(newReel);
  saveStore();
  return newReel;
};

export const deleteStrangerReel = async (userId, reelId) => {
  const index = strangerReels.findIndex((r) => r.id === reelId);
  if (index === -1) throw new ApiError(404, 'Reel not found');
  const reel = strangerReels[index];
  if (reel.userId && userId && reel.userId !== userId && reel.hostId !== userId) {
    throw new ApiError(403, 'You can only delete your own uploaded reels');
  }
  strangerReels.splice(index, 1);
  saveStore();
  return { success: true, message: 'Reel deleted successfully' };
};

export const toggleLikeReel = async (userId, reelId) => {
  const reel = strangerReels.find((r) => r.id === reelId);
  if (!reel) throw new ApiError(404, 'Reel not found');
  if (!Array.isArray(reel.likedUserIds)) {
    reel.likedUserIds = reel.isLiked ? ['usr_seed_1'] : [];
  }
  const idx = reel.likedUserIds.indexOf(userId);
  let isLiked = false;
  if (idx === -1) {
    reel.likedUserIds.push(userId);
    reel.likesCount = (reel.likesCount || 0) + 1;
    isLiked = true;
  } else {
    reel.likedUserIds.splice(idx, 1);
    reel.likesCount = Math.max(0, (reel.likesCount || 1) - 1);
    isLiked = false;
  }
  reel.isLiked = isLiked;
  saveStore();
  return {
    reelId,
    isLiked,
    likesCount: reel.likesCount,
  };
};

export const getReelComments = async (reelId) => {
  const reel = strangerReels.find((r) => r.id === reelId);
  if (!reel) throw new ApiError(404, 'Reel not found');
  if (!Array.isArray(reel.comments) || reel.comments.length === 0) {
    return [
      {
        id: `com_${reelId}_1`,
        userId: 'usr_seed_1',
        name: 'Vikram Verma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        comment: 'Looks amazing! Is there 1 seat left for this trip?',
        time: '10m ago',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: `com_${reelId}_2`,
        userId: 'usr_seed_2',
        name: 'Ananya Sharma',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        comment: 'Super clean SUV drive! Sent connect request!',
        time: '1h ago',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: `com_${reelId}_3`,
        userId: 'usr_seed_3',
        name: 'Rahul Sen',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
        comment: 'What time are you starting? Great music vibe in this clip! 🚗',
        time: '3h ago',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
  return reel.comments;
};

export const addReelComment = async (userId, reelId, text) => {
  const reel = strangerReels.find((r) => r.id === reelId);
  if (!reel) throw new ApiError(404, 'Reel not found');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!Array.isArray(reel.comments)) reel.comments = [];
  const newComment = {
    id: `com_${Date.now()}`,
    userId,
    name: user?.displayName || 'Traveler',
    avatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    comment: text,
    time: 'Just now',
    createdAt: new Date().toISOString(),
  };
  reel.comments.unshift(newComment);
  reel.commentsCount = reel.comments.length;
  saveStore();
  return newComment;
};

// --- 5. TRIP GLOBE (Dynamic Destinations, Budget Breakdown, Transport, Weather & Itinerary) ---
const GLOBE_CITY_CATALOG = [
  {
    id: 'corbett',
    name: 'Jim Corbett',
    region: 'india',
    lat: 29.5300,
    lon: 78.7747,
    days: 4,
    vibe: 'Wildlife',
    place: 'Uttarakhand',
    emoji: '🐘',
    match: 90,
    rating: 4.4,
    stayPerNight: 1265,
    foodPerDay: 700,
    localPerDay: 200,
    actPerDay: 1260,
    seasonNote: 'Cool & crisp',
    tagline: "India's oldest national park: tigers, elephants, rivers.",
    highlights: [
      'Jeep safari in Bijrani or Jhirna zone',
      'Dhikala overnight forest lodge',
      'Corbett Falls',
      'Garjiya Devi Temple',
      'Kosi river walk',
      'Corbett Museum (Kaladhungi)',
    ],
    mustEat: ['Kumaoni thali', 'Bhatt ki churkani', 'Bal mithai'],
    proTips: [
      'Dhikala is the best zone but books out months ahead',
      'Overnight train from Delhi to Ramnagar saves a day',
      'The core zones close in monsoon',
    ],
    avoidThis: ["Resorts far from gates: you'll lose safari time"],
  },
  {
    id: 'ranthambore',
    name: 'Ranthambore',
    region: 'india',
    lat: 26.0173,
    lon: 76.5026,
    days: 4,
    vibe: 'Safari',
    place: 'Rajasthan',
    emoji: '🐯',
    match: 90,
    rating: 4.5,
    stayPerNight: 1350,
    foodPerDay: 650,
    localPerDay: 220,
    actPerDay: 1180,
    seasonNote: 'Pleasant weather',
    tagline: 'Tiger safaris among fort ruins.',
    highlights: [
      'Morning Gypsy safari in Zone 2 or 3',
      'Ranthambore Fort UNESCO trek',
      'Padam Talao & Jogi Mahal',
      'Trinetra Ganesh Temple',
      'Surwal Lake birdwatching',
      'Dastkar Craft Centre',
    ],
    mustEat: ['Dal Baati Churma', 'Ker Sangri', 'Ghevar'],
    proTips: [
      'Book Gypsy zones 1–5 well in advance',
      'Carry a warm layer for 6 AM open-jeep safaris',
    ],
    avoidThis: ['Mid-day safaris in peak summer without sun protection'],
  },
  {
    id: 'goa',
    name: 'Goa',
    region: 'india',
    lat: 15.2993,
    lon: 74.1240,
    days: 4,
    vibe: 'Beach',
    place: 'Goa',
    emoji: '🏖️',
    match: 93,
    rating: 4.8,
    stayPerNight: 1100,
    foodPerDay: 650,
    localPerDay: 300,
    actPerDay: 550,
    seasonNote: 'Breezy coastal sun',
    tagline: 'Beaches, coastal rides and sunset shacks.',
    highlights: [
      'Chapora Fort & Vagator sunset',
      'Scooter ride along Anjuna–Baga coast',
      'Fontainhas Latin Quarter walk',
      'Old Goa Basilica & Se Cathedral',
      'Palolem kayak & butterfly beach',
      'South Goa quiet beach shacks',
    ],
    mustEat: ['Fish curry rice', 'Prawn balchao', 'Bebinca'],
    proTips: [
      'Rent a scooter for ₹400/day to hop beaches easily',
      'Split North (party/cafes) and South (quiet beaches)',
    ],
    avoidThis: ['Unmetered airport taxis — use GoaMiles app'],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    region: 'india',
    lat: 26.9124,
    lon: 75.7873,
    days: 4,
    vibe: 'Heritage',
    place: 'Rajasthan',
    emoji: '🏰',
    match: 91,
    rating: 4.7,
    stayPerNight: 950,
    foodPerDay: 550,
    localPerDay: 250,
    actPerDay: 450,
    seasonNote: 'Sunny & clear',
    tagline: 'Forts, palaces and pink-city bazaars.',
    highlights: [
      'Hawa Mahal & Johari Bazaar walk',
      'Amber Fort & Panna Meena ka Kund',
      'Nahargarh Fort sunset overlook',
      'City Palace & Jantar Mantar',
      'Patrika Gate morning photo stop',
      'Chokhi Dhani cultural dinner',
    ],
    mustEat: ['Pyaaz Kachori', 'Dal Baati Churma', 'Lassi at Lassiwala'],
    proTips: [
      'Get the composite monument ticket for 5 forts/palaces',
      'Visit Amber Fort right at 8 AM opening',
    ],
    avoidThis: ['Shopping at driver-recommended emporiums'],
  },
  {
    id: 'manali',
    name: 'Manali',
    region: 'india',
    lat: 32.2432,
    lon: 77.1892,
    days: 5,
    vibe: 'Mountain',
    place: 'Himachal Pradesh',
    emoji: '🏔️',
    match: 91,
    rating: 4.8,
    stayPerNight: 1050,
    foodPerDay: 600,
    localPerDay: 280,
    actPerDay: 500,
    seasonNote: 'Crisp mountain air',
    tagline: 'Solang Valley, Atal Tunnel and pine cafes.',
    highlights: [
      'Old Manali cafes & Manu Temple',
      'Solang Valley snow & paragliding',
      'Atal Tunnel & Sissu Waterfall drive',
      'Hadimba Devi cedar forest temple',
      'Vashisht hot water springs',
      'Jogini Falls trek',
    ],
    mustEat: ['Siddu', 'Trout fish', 'Himachali Dham'],
    proTips: [
      'Stay in Old Manali or Vashisht for better cafes and views',
      'Check Rohtang/Atal Tunnel weather before morning start',
    ],
    avoidThis: ['Mall Road traffic at peak evening hours'],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    region: 'india',
    lat: 24.5854,
    lon: 73.7125,
    days: 4,
    vibe: 'Lakes',
    place: 'Rajasthan',
    emoji: '🚤',
    match: 89,
    rating: 4.7,
    stayPerNight: 1050,
    foodPerDay: 580,
    localPerDay: 240,
    actPerDay: 420,
    seasonNote: 'Pleasant by the lakes',
    tagline: 'City of Lakes and sunset palaces.',
    highlights: [
      'Lake Pichola sunset boat ride',
      'City Palace & Jagdish Temple',
      'Ambrai Ghat night view',
      'Sajjangarh Monsoon Palace sunset',
      'Fateh Sagar Lake promenade',
      'Bagore Ki Haveli folk show',
    ],
    mustEat: ['Mirchi Bada', 'Makhaniya Lassi', 'Mewari Thali'],
    proTips: [
      'Book a lakeside rooftop cafe near Lal Ghat for sunset',
      'Walk the old city lanes instead of taking cabs',
    ],
    avoidThis: ['Skipping the evening Dharohar dance at Bagore Ki Haveli'],
  },
  {
    id: 'srinagar',
    name: 'Srinagar & Gulmarg',
    region: 'india',
    lat: 34.0837,
    lon: 74.7973,
    days: 5,
    vibe: 'Mountain',
    place: 'Jammu & Kashmir',
    emoji: '🛶',
    match: 88,
    rating: 4.8,
    stayPerNight: 1400,
    foodPerDay: 650,
    localPerDay: 400,
    actPerDay: 750,
    seasonNote: 'Cold & scenic',
    tagline: 'Dal Lake shikara, Gulmarg gondola and Mughal gardens.',
    highlights: [
      'Dal Lake sunset Shikara ride',
      'Nishat & Shalimar Mughal Gardens',
      'Gulmarg Gondola Phase 1 & 2',
      'Pahalgam Betaab Valley day trip',
      'Floating vegetable market at dawn',
      'Lal Chowk & Hazratbal walk',
    ],
    mustEat: ['Kashmiri Kahwa', 'Rogan Josh', 'Yakhni Pulao'],
    proTips: [
      'Book Gulmarg Gondola tickets online weeks in advance',
      'Keep postpaid SIMs (Airtel/Jio) active in J&K',
    ],
    avoidThis: ['Paying unnegotiated shikara rates — check fixed tariff'],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    region: 'india',
    lat: 25.3176,
    lon: 82.9739,
    days: 3,
    vibe: 'Spiritual',
    place: 'Uttar Pradesh',
    emoji: '🛕',
    match: 84,
    rating: 4.5,
    stayPerNight: 850,
    foodPerDay: 450,
    localPerDay: 180,
    actPerDay: 350,
    seasonNote: 'Pleasant on the ghats',
    tagline: 'Ghats, Ganga aarti and old lanes.',
    highlights: [
      'Dashashwamedh Ghat evening Ganga Aarti',
      'Sunrise wooden boat ride on the Ganga',
      'Kashi Vishwanath Corridor',
      'Assi Ghat morning Subah-e-Banaras',
      'Sarnath Buddhist Stupa',
      'Kachori Gali breakfast walk',
    ],
    mustEat: ['Banarasi Tamatar Chaat', 'Malaiyyo', 'Blue Lassi'],
    proTips: [
      'Stay near Assi or Dashashwamedh Ghat for walkable access',
      'Reach Dashashwamedh 45 mins early for a good aarti seat',
    ],
    avoidThis: ['Using cars in the narrow old-city lanes'],
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    region: 'india',
    lat: 31.6340,
    lon: 74.8723,
    days: 3,
    vibe: 'Pilgrim',
    place: 'Punjab',
    emoji: '⛩️',
    match: 90,
    rating: 4.7,
    stayPerNight: 800,
    foodPerDay: 480,
    localPerDay: 180,
    actPerDay: 250,
    seasonNote: 'Crisp & lively',
    tagline: 'Golden Temple, Wagah and kulcha trails.',
    highlights: [
      'Golden Temple night & dawn darshan',
      'Jallianwala Bagh memorial',
      'Partition Museum at Town Hall',
      'Attari–Wagah Border retreat ceremony',
      'Gobindgarh Fort evening show',
      'Heritage Street food walk',
    ],
    mustEat: ['Amritsari Kulcha', 'Makki di Roti & Sarson da Saag', 'Pinni'],
    proTips: [
      'Visit Golden Temple both at midnight and sunrise',
      'Reach Wagah Border by 3:30 PM for good gallery seats',
    ],
    avoidThis: ['Heavy bags at Wagah Border — lockers are limited'],
  },
  {
    id: 'agra',
    name: 'Agra',
    region: 'india',
    lat: 27.1767,
    lon: 78.0081,
    days: 3,
    vibe: 'Iconic',
    place: 'Uttar Pradesh',
    emoji: '🕌',
    match: 88,
    rating: 4.6,
    stayPerNight: 850,
    foodPerDay: 500,
    localPerDay: 200,
    actPerDay: 450,
    seasonNote: 'Clear mornings',
    tagline: 'Sunrise at the Taj Mahal and Mughal forts.',
    highlights: [
      'Taj Mahal sunrise entry (East Gate)',
      'Agra Fort riverside ramparts',
      'Mehtab Bagh sunset Taj reflection',
      'Itimad-ud-Daulah (Baby Taj)',
      'Fatehpur Sikri half-day trip',
      'Sadar Bazaar chaat street',
    ],
    mustEat: ['Agra Petha', 'Bedai & Jalebi', 'Mughlai Paratha'],
    proTips: [
      'Taj Mahal is closed on Fridays — plan accordingly',
      'Book Taj tickets online to skip dawn queues',
    ],
    avoidThis: ['Bringing tripods/powerbanks inside Taj Mahal'],
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    region: 'india',
    lat: 26.9157,
    lon: 70.9083,
    days: 4,
    vibe: 'Desert',
    place: 'Rajasthan',
    emoji: '🐫',
    match: 86,
    rating: 4.5,
    stayPerNight: 1100,
    foodPerDay: 550,
    localPerDay: 280,
    actPerDay: 650,
    seasonNote: 'Cool desert nights',
    tagline: 'Golden fort and camel safari under the stars.',
    highlights: [
      'Sonar Quila (Living Golden Fort) walk',
      'Patwon Ki Haveli intricate sandstone',
      'Sam Sand Dunes sunset camel & jeep safari',
      'Overnight desert camp & folk music',
      'Gadisar Lake morning walk',
      'Kuldhara abandoned village',
    ],
    mustEat: ['Ker Sangri', 'Ghotua Ladoo', 'Rajasthani Thali'],
    proTips: [
      'Spend 1 night in the fort and 1 night in Khuri/Sam dunes',
      'Carry a light jacket for desert nights',
    ],
    avoidThis: ['Overcrowded tourist traps near the main dune entrance'],
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    region: 'india',
    lat: 30.0869,
    lon: 78.2676,
    days: 3,
    vibe: 'Adventure',
    place: 'Uttarakhand',
    emoji: '🛶',
    match: 91,
    rating: 4.7,
    stayPerNight: 800,
    foodPerDay: 480,
    localPerDay: 200,
    actPerDay: 650,
    seasonNote: 'Pleasant river breeze',
    tagline: 'River rafting, Ganga cafes and Himalayan foothills.',
    highlights: [
      '16 km Shivpuri-to-Tapovan river rafting',
      'Triveni Ghat evening Ganga Aarti',
      'Beatles Ashram (Chaurasi Kutia)',
      'Neer Garh Waterfall hike',
      'Tapovan riverside cafe hopping',
      'Parmarth Niketan sunset',
    ],
    mustEat: ['Aloo Puri', 'Ayurvedic thali', 'Tapovan cafe bowls'],
    proTips: [
      'Stay in Tapovan or Laxman Jhula for cafes and hostels',
      'Book rafting directly at Shivpuri/Tapovan counters',
    ],
    avoidThis: ['Driving into narrow Tapovan lanes on weekends'],
  },
  {
    id: 'munnar',
    name: 'Munnar',
    region: 'india',
    lat: 10.0889,
    lon: 77.0595,
    days: 4,
    vibe: 'Tea Hills',
    place: 'Kerala',
    emoji: '🍃',
    match: 90,
    rating: 4.7,
    stayPerNight: 1100,
    foodPerDay: 520,
    localPerDay: 300,
    actPerDay: 380,
    seasonNote: 'Misty & cool',
    tagline: 'Rolling tea estates, misty peaks and waterfalls.',
    highlights: [
      'Kolukkumalai sunrise jeep safari',
      'Eravikulam National Park (Nilgiri Tahr)',
      'Tata Tea Museum & tasting',
      'Mattupetty Dam & Echo Point',
      'Top Station valley overlook',
      'Attukad Waterfalls',
    ],
    mustEat: ['Appam & Stew', 'Kerala Parotta', 'Fresh cardamom tea'],
    proTips: [
      'Start by 4:30 AM for Kolukkumalai sunrise above the clouds',
      'Book Eravikulam slots online',
    ],
    avoidThis: ['Skipping Chinnakanal tea estate viewpoints'],
  },
  {
    id: 'coorg',
    name: 'Coorg',
    region: 'india',
    lat: 12.3375,
    lon: 75.8069,
    days: 3,
    vibe: 'Coffee',
    place: 'Karnataka',
    emoji: '☕',
    match: 89,
    rating: 4.6,
    stayPerNight: 1150,
    foodPerDay: 550,
    localPerDay: 320,
    actPerDay: 400,
    seasonNote: 'Lush & pleasant',
    tagline: 'Coffee plantations, misty hills and Abbey Falls.',
    highlights: [
      'Coffee estate guided walk & tasting',
      'Raja’s Seat sunset viewpoint',
      'Abbey Falls & hanging bridge',
      'Dubare Elephant Camp',
      'Namdroling Golden Temple (Bylakuppe)',
      'Mandalpatti jeep trail',
    ],
    mustEat: ['Pandi Curry & Akki Roti', 'Kadambuttu', 'Coorg filter coffee'],
    proTips: [
      'Pick a coffee estate homestay over town hotels',
      'Carry rain gear if visiting June–September',
    ],
    avoidThis: ['Driving Mandalapatti trail in a low-clearance sedan'],
  },
  {
    id: 'gangtok',
    name: 'Gangtok & Sikkim',
    region: 'india',
    lat: 27.3314,
    lon: 88.6138,
    days: 5,
    vibe: 'Himalaya',
    place: 'Sikkim',
    emoji: '🏔️',
    match: 89,
    rating: 4.8,
    stayPerNight: 1150,
    foodPerDay: 550,
    localPerDay: 450,
    actPerDay: 500,
    seasonNote: 'Crisp mountain skies',
    tagline: 'Tsomgo Lake, MG Marg and Kanchenjunga views.',
    highlights: [
      'Tsomgo Lake & Baba Mandir excursion',
      'MG Marg pedestrian promenade',
      'Rumtek Monastery',
      'Tashi Viewpoint Kanchenjunga dawn',
      'Ban Jhakri Falls & Ropeway',
      'Nathula Pass (with permit)',
    ],
    mustEat: ['Sikkimese Momos', 'Thukpa', 'Phagshapa'],
    proTips: [
      'Arrange Nathula/Tsomgo permits 1 day ahead via local agent',
      'Keep passport-size photos and Voter ID/Passport handy',
    ],
    avoidThis: ['Last-minute Nathula plans on Mondays/Tuesdays (closed)'],
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    region: 'india',
    lat: 11.9416,
    lon: 79.8083,
    days: 3,
    vibe: 'Coastal',
    place: 'Puducherry',
    emoji: '🥐',
    match: 88,
    rating: 4.6,
    stayPerNight: 1050,
    foodPerDay: 600,
    localPerDay: 220,
    actPerDay: 300,
    seasonNote: 'Warm sea breeze',
    tagline: 'French Quarter boulevards, cafes and Rock Beach.',
    highlights: [
      'White Town French Quarter cycling',
      'Rock Beach sunrise promenade',
      'Auroville Matrimandir viewpoint',
      'Paradise Beach boat crossing',
      'Sri Aurobindo Ashram',
      'Serenity Beach morning surf',
    ],
    mustEat: ['Croissants & wood-fired pizza', 'Creole seafood', 'Filter coffee'],
    proTips: [
      'Stay in White Town for early morning photo walks',
      'Rent a bicycle or scooter to explore Auroville',
    ],
    avoidThis: ['Weekend afternoon heat without hydration'],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    region: 'india',
    lat: 17.3850,
    lon: 78.4867,
    days: 3,
    vibe: 'Heritage & Food',
    place: 'Telangana',
    emoji: '🍛',
    match: 89,
    rating: 4.7,
    stayPerNight: 950,
    foodPerDay: 550,
    localPerDay: 220,
    actPerDay: 380,
    seasonNote: 'Pleasant evenings',
    tagline: 'Charminar, Golconda Fort and biryani trails.',
    highlights: [
      'Charminar & Laad Bazaar morning walk',
      'Golconda Fort sunset & sound show',
      'Chowmahalla Palace',
      'Hussain Sagar & Necklace Road',
      'Qutb Shahi Tombs',
      'Irani chai & Osmania biscuits',
    ],
    mustEat: ['Hyderabadi Dum Biryani', 'Irani Chai', 'Double Ka Meetha'],
    proTips: [
      'Visit Charminar before 9 AM to beat crowds',
      'Try Paradise or Shadab for classic biryani',
    ],
    avoidThis: ['Old City traffic during Friday afternoon hours'],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'india',
    lat: 19.0760,
    lon: 72.8777,
    days: 3,
    vibe: 'Coastal',
    place: 'Maharashtra',
    emoji: '🌊',
    match: 86,
    rating: 4.6,
    stayPerNight: 1350,
    foodPerDay: 650,
    localPerDay: 250,
    actPerDay: 450,
    seasonNote: 'Breezy evenings',
    tagline: 'Marine Drive, Colaba and Elephanta ferry rides.',
    highlights: [
      'Gateway of India & Colaba Causeway',
      'Marine Drive sunset walk',
      'Elephanta Caves morning ferry',
      'Kala Ghoda art & heritage precinct',
      'Bandra Bandstand & Carter Road',
      'Chowpatty street food',
    ],
    mustEat: ['Vada Pav', 'Pav Bhaji', 'Bombay Sandwich'],
    proTips: [
      'Use Mumbai Metro + local trains during rush hours',
      'Book Elephanta ferry from Gateway before 11 AM',
    ],
    avoidThis: ['Cross-city cabs between 5 PM and 8 PM'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    region: 'india',
    lat: 12.9716,
    lon: 77.5946,
    days: 3,
    vibe: 'City & Cafes',
    place: 'Karnataka',
    emoji: '🌿',
    match: 87,
    rating: 4.6,
    stayPerNight: 1100,
    foodPerDay: 600,
    localPerDay: 250,
    actPerDay: 350,
    seasonNote: 'Cool & breezy',
    tagline: 'Cubbon Park, craft cafes and Nandi Hills sunrise.',
    highlights: [
      'Cubbon Park morning walk',
      'Lalbagh Botanical Garden',
      'Nandi Hills sunrise drive',
      'Indiranagar & Church Street cafes',
      'Bangalore Palace',
      'VV Puram Food Street',
    ],
    mustEat: ['Benne Masala Dosa', 'Filter Coffee', 'Bisi Bele Bath'],
    proTips: [
      'Leave by 4:30 AM for Nandi Hills sunrise',
      'Use Namma Metro to bypass Silk Board & MG Road traffic',
    ],
    avoidThis: ['Outer Ring Road during weekday peak hours'],
  },
  {
    id: 'andaman',
    name: 'Andaman Islands',
    region: 'india',
    lat: 11.6234,
    lon: 92.7265,
    days: 5,
    vibe: 'Island',
    place: 'Andaman & Nicobar',
    emoji: '🏝️',
    match: 92,
    rating: 4.9,
    stayPerNight: 1650,
    foodPerDay: 700,
    localPerDay: 450,
    actPerDay: 950,
    seasonNote: 'Clear turquoise water',
    tagline: 'Radhanagar Beach, Havelock reefs and Cellular Jail.',
    highlights: [
      'Radhanagar Beach sunset at Havelock',
      'Elephant Beach snorkeling & coral reef',
      'Cellular Jail Light & Sound show',
      'Neil Island natural rock bridge',
      'Ross Island heritage ruins',
      'Scuba diving at Nemo Reef',
    ],
    mustEat: ['Grilled Lobster', 'Coconut Prawn Curry', 'Fresh Seafood Thali'],
    proTips: [
      'Book Makruzz / Nautika inter-island ferries in advance',
      'Spend at least 2 nights in Havelock Island',
    ],
    avoidThis: ['Last-minute ferry bookings during Dec–Jan peak'],
  },
  {
    id: 'shillong',
    name: 'Shillong & Cherrapunji',
    region: 'india',
    lat: 25.5788,
    lon: 91.8933,
    days: 5,
    vibe: 'Waterfalls',
    place: 'Meghalaya',
    emoji: '🌧️',
    match: 91,
    rating: 4.8,
    stayPerNight: 1200,
    foodPerDay: 550,
    localPerDay: 420,
    actPerDay: 450,
    seasonNote: 'Misty hills & falls',
    tagline: 'Living root bridges, Dawki crystal river and Mawlynnong.',
    highlights: [
      'Double Decker Living Root Bridge trek (Nongriat)',
      'Dawki Umngot crystal-clear river boating',
      'Nohkalikai & Seven Sisters Waterfalls',
      'Mawlynnong Asia’s cleanest village',
      'Umiam Lake & Laitlum Canyons',
      'Police Bazaar live music cafes',
    ],
    mustEat: ['Jadoh', 'Dohneiiong', 'Smoked Pork & Bamboo Shoot'],
    proTips: [
      'Start the Nongriat 3,500-step trek before 7 AM',
      'Carry cash for village entry & parking fees',
    ],
    avoidThis: ['Dawki boating during heavy monsoon when water turns muddy'],
  },
  {
    id: 'hampi',
    name: 'Hampi',
    region: 'india',
    lat: 15.3350,
    lon: 76.4600,
    days: 3,
    vibe: 'Heritage',
    place: 'Karnataka',
    emoji: '🪨',
    match: 90,
    rating: 4.8,
    stayPerNight: 850,
    foodPerDay: 450,
    localPerDay: 220,
    actPerDay: 300,
    seasonNote: 'Warm & sunny',
    tagline: 'Boulder landscapes, Vijayanagara ruins and coracle rides.',
    highlights: [
      'Virupaksha Temple & Hampi Bazaar',
      'Vittala Temple Stone Chariot',
      'Matanga Hill sunrise panorama',
      'Tungabhadra coracle boat ride',
      'Hippie Island (Sanapur) boulder cafes',
      'Anjanadri Hill sunset steps',
    ],
    mustEat: ['South Indian Thali', 'Banana Pancakes at Hippie Island', 'Jolada Rotti'],
    proTips: [
      'Rent a moped or bicycle to explore the ruins',
      'Climb Matanga Hill 30 mins before sunrise',
    ],
    avoidThis: ['Midday boulder treks without hat and water'],
  },
  {
    id: 'varkala',
    name: 'Varkala',
    region: 'india',
    lat: 8.7379,
    lon: 76.7163,
    days: 4,
    vibe: 'Cliff Beach',
    place: 'Kerala',
    emoji: '🏄',
    match: 91,
    rating: 4.8,
    stayPerNight: 1100,
    foodPerDay: 550,
    localPerDay: 220,
    actPerDay: 450,
    seasonNote: 'Warm coastal breeze',
    tagline: 'Red cliffs above the Arabian Sea, surf and cafes.',
    highlights: [
      'North Cliff sunset promenade & cafes',
      'Papanasam Beach morning swim',
      'Morning surf lesson at Black Beach',
      'Munroe Island backwater canoeing',
      'Jatayu Earth’s Center day trip',
      'Kappil Beach & Edava Lake drive',
    ],
    mustEat: ['Kerala Fish Pollichathu', 'Appam & Egg Roast', 'Cliffside Seafood'],
    proTips: [
      'Stay along North Cliff for ocean-view cafes',
      'Book an early morning surf session when waves are clean',
    ],
    avoidThis: ['Strong rip currents in unguarded beach zones'],
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    region: 'india',
    lat: 27.0410,
    lon: 88.2663,
    days: 4,
    vibe: 'Tea & Rail',
    place: 'West Bengal',
    emoji: '🚂',
    match: 89,
    rating: 4.7,
    stayPerNight: 1100,
    foodPerDay: 520,
    localPerDay: 300,
    actPerDay: 400,
    seasonNote: 'Crisp misty mornings',
    tagline: 'Toy train, Tiger Hill sunrise and Himalayan tea.',
    highlights: [
      'Tiger Hill Kanchenjunga sunrise',
      'Darjeeling Himalayan Toy Train joyride',
      'Happy Valley Tea Estate tour',
      'Batasia Loop & Ghoom Monastery',
      'Mall Road & Keventer’s breakfast',
      'Peace Pagoda & Himalayan Mountaineering Institute',
    ],
    mustEat: ['Darjeeling First Flush Tea', 'Steamed Pork Momos', 'Churpee'],
    proTips: [
      'Book Toy Train joyride seats on IRCTC early',
      'Leave for Tiger Hill at 4 AM for clear Kanchenjunga views',
    ],
    avoidThis: ['Skipping warm layers even in spring/autumn'],
  },
  {
    id: 'gokarna',
    name: 'Gokarna',
    region: 'india',
    lat: 14.5479,
    lon: 74.3188,
    days: 3,
    vibe: 'Beach Trek',
    place: 'Karnataka',
    emoji: '⛺',
    match: 90,
    rating: 4.7,
    stayPerNight: 900,
    foodPerDay: 480,
    localPerDay: 200,
    actPerDay: 350,
    seasonNote: 'Sunny beach weather',
    tagline: 'Five-beach coastal trek, Kudle sunsets and shacks.',
    highlights: [
      'Belekan to Kudle 5-beach coastal trek',
      'Om Beach sunset & Namaste Cafe',
      'Paradise & Half Moon Beach',
      'Mirjan Fort afternoon drive',
      'Yana Caves forest trail',
      'Kudle Beach stargazing',
    ],
    mustEat: ['Seafood Platter', 'Neer Dosa', 'Fresh Lime Soda at Om Beach'],
    proTips: [
      'Do the beach trek from Paradise → Om → Kudle in the morning',
      'Carry a headlamp if walking beach trails after sunset',
    ],
    avoidThis: ['Swimming at Half Moon Beach alone at high tide'],
  },
  {
    id: 'auli',
    name: 'Auli',
    region: 'india',
    lat: 30.5284,
    lon: 79.5699,
    days: 4,
    vibe: 'Snow',
    place: 'Uttarakhand',
    emoji: '⛷️',
    match: 88,
    rating: 4.7,
    stayPerNight: 1450,
    foodPerDay: 600,
    localPerDay: 350,
    actPerDay: 850,
    seasonNote: 'Cold & snowy',
    tagline: 'Asia’s longest cable car and Nanda Devi snow slopes.',
    highlights: [
      'Joshimath–Auli Ropeway cable car',
      'Gorson Bugyal snow meadow trek',
      'Auli Artificial Lake & ski slopes',
      'Nanda Devi 270° peak views',
      'Chattrakund forest walk',
      'Joshimath Narsingh Temple',
    ],
    mustEat: ['Kumaoni Raita', 'Aloo Ke Gutke', 'Hot Maggi on the slopes'],
    proTips: [
      'Pre-book the Auli ropeway slot during winter snow months',
      'Stay near Clifftop or Joshimath depending on road snow',
    ],
    avoidThis: ['Driving without snow chains after heavy snowfall'],
  },
  {
    id: 'shimla',
    name: 'Shimla',
    region: 'india',
    lat: 31.1048,
    lon: 77.1734,
    days: 3,
    vibe: 'Hill Station',
    place: 'Himachal Pradesh',
    emoji: '🌲',
    match: 86,
    rating: 4.5,
    stayPerNight: 1050,
    foodPerDay: 550,
    localPerDay: 240,
    actPerDay: 350,
    seasonNote: 'Cool pine breeze',
    tagline: 'The Ridge, Kalka–Shimla toy train and pine walks.',
    highlights: [
      'Kalka–Shimla UNESCO Toy Train',
      'The Ridge & Christ Church evening walk',
      'Jakhoo Temple hilltop cable car',
      'Kufri cedar ridges & snow point',
      'Mall Road heritage bakeries',
      'Chadwick Falls forest trail',
    ],
    mustEat: ['Chana Madra', 'Sidu', 'Embassy Cafe pastries'],
    proTips: [
      'Book Shivalik Deluxe Express toy train from Kalka',
      'Walk Mashobra–Craignano trails to escape Mall Road crowds',
    ],
    avoidThis: ['Driving private cars into restricted Mall Road zones'],
  },
  {
    id: 'lonavala',
    name: 'Lonavala',
    region: 'india',
    lat: 18.7557,
    lon: 73.4091,
    days: 2,
    vibe: 'Getaway',
    place: 'Maharashtra',
    emoji: '⛰️',
    match: 87,
    rating: 4.5,
    stayPerNight: 1200,
    foodPerDay: 550,
    localPerDay: 250,
    actPerDay: 300,
    seasonNote: 'Breezy Sahyadri hills',
    tagline: 'Tiger’s Leap, Karla Caves and monsoon waterfalls.',
    highlights: [
      'Tiger’s Leap & Lion’s Point cliff views',
      'Karla & Bhaja Buddhist rock-cut caves',
      'Bhushi Dam steps',
      'Lohagad Fort trek',
      'Pawna Lake sunset camping',
      'Maganlal Chikki tasting',
    ],
    mustEat: ['Lonavala Chikki', 'Vada Pav', 'Hot Corn on the Cob'],
    proTips: [
      'Visit Lohagad Fort early morning for misty views',
      'Weekdays are far quieter than Saturday–Sunday',
    ],
    avoidThis: ['Mumbai–Pune Expressway bottleneck on Sunday evenings'],
  },
  {
    id: 'mcleodganj',
    name: 'McLeodganj',
    region: 'india',
    lat: 32.2426,
    lon: 76.3213,
    days: 4,
    vibe: 'Trek & Zen',
    place: 'Himachal Pradesh',
    emoji: '☸️',
    match: 91,
    rating: 4.8,
    stayPerNight: 950,
    foodPerDay: 500,
    localPerDay: 220,
    actPerDay: 380,
    seasonNote: 'Cool Dhauladhar air',
    tagline: 'Triund ridge trek, Tibetan monasteries and Bhagsu cafes.',
    highlights: [
      'Triund Ridge 9 km Himalayan trek',
      'Tsuglagkhang Dalai Lama Temple',
      'Bhagsu Waterfall & Shiva Cafe',
      'Dharamkot forest cafes',
      'Naddi sunset Dhauladhar viewpoint',
      'St. John in the Wilderness Church',
    ],
    mustEat: ['Thenthuk', 'Tibetan Momos', 'Bhagsu Cake'],
    proTips: [
      'Stay in Dharamkot or Bhagsu for quieter backpacker vibes',
      'Start the Triund trek by 7 AM',
    ],
    avoidThis: ['Loud traffic in main McLeodganj square'],
  },
  {
    id: 'kutch',
    name: 'Rann of Kutch',
    region: 'india',
    lat: 23.7337,
    lon: 69.8597,
    days: 3,
    vibe: 'White Desert',
    place: 'Gujarat',
    emoji: '🌕',
    match: 88,
    rating: 4.7,
    stayPerNight: 1500,
    foodPerDay: 550,
    localPerDay: 380,
    actPerDay: 550,
    seasonNote: 'Crisp winter nights',
    tagline: 'Endless white salt desert under full-moon skies.',
    highlights: [
      'Great Rann of Kutch sunset & full-moon walk',
      'Kala Dungar (Black Hill) panoramic view',
      'Dholavira Harappan ruins & Road to Heaven',
      'Bhunga mud-hut artisan villages (Hodka)',
      'Rann Utsav cultural folk evening',
      'Aina Mahal & Prag Mahal in Bhuj',
    ],
    mustEat: ['Kutchi Dabeli', 'Bajra Rotlo & Ringan Bharta', 'Gujarati Thali'],
    proTips: [
      'Carry your Rann permit online or at Bhirandiyara checkpoint',
      'Plan around a full moon (Nov–Feb) for the brightest salt flats',
    ],
    avoidThis: ['Visiting March–October when the Rann is flooded or too hot'],
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    region: 'india',
    lat: 30.4598,
    lon: 78.0644,
    days: 3,
    vibe: 'Hill Station',
    place: 'Uttarakhand',
    emoji: '🏔️',
    match: 88,
    rating: 4.6,
    stayPerNight: 1100,
    foodPerDay: 550,
    localPerDay: 240,
    actPerDay: 350,
    seasonNote: 'Cool mountain mist',
    tagline: 'Landour cedar trails, Camel’s Back Road and Doon lights.',
    highlights: [
      'Landour Char Dukan & Sister’s Bazaar walk',
      'Lal Tibba telescope point',
      'Camel’s Back Road sunset stroll',
      'George Everest House ridge hike',
      'Kempty Falls morning visit',
      'Company Garden & Mall Road',
    ],
    mustEat: ['Char Dukan Pancakes & Bun Omelette', 'Garhwali Thali', 'Hot Chocolate'],
    proTips: [
      'Walk Landour loop early morning for quiet deodar forests',
      'Rent a scooter from Library Chowk to dodge parking queues',
    ],
    avoidThis: ['Weekend Mall Road traffic jams after 4 PM'],
  },
  {
    id: 'alleppey',
    name: 'Alleppey',
    region: 'india',
    lat: 9.4981,
    lon: 76.3388,
    days: 3,
    vibe: 'Backwaters',
    place: 'Kerala',
    emoji: '🛶',
    match: 90,
    rating: 4.7,
    stayPerNight: 1350,
    foodPerDay: 550,
    localPerDay: 220,
    actPerDay: 650,
    seasonNote: 'Warm palm breeze',
    tagline: 'Houseboats, narrow palm canals and Marari Beach.',
    highlights: [
      'Vembanad Lake & Kuttanad backwater cruise',
      'Sunrise shikara ride through narrow canals',
      'Marari Beach quiet palm coast',
      'Alleppey Lighthouse & pier',
      'Champakulam village walk',
      'Toddy shop traditional lunch',
    ],
    mustEat: ['Karimeen Pollichathu', 'Puttu & Kadala Curry', 'Appam with Fish Molee'],
    proTips: [
      'Take a small shikara boat for narrow canals that houseboats cannot enter',
      'Stay 1 night at Marari Beach + 1 night on backwaters',
    ],
    avoidThis: ['Booking uninspected houseboats via roadside touts'],
  },
  {
    id: 'ooty',
    name: 'Ooty & Coonoor',
    region: 'india',
    lat: 11.4102,
    lon: 76.6950,
    days: 3,
    vibe: 'Nilgiris',
    place: 'Tamil Nadu',
    emoji: '🌿',
    match: 88,
    rating: 4.6,
    stayPerNight: 1050,
    foodPerDay: 500,
    localPerDay: 260,
    actPerDay: 350,
    seasonNote: 'Cool Nilgiri air',
    tagline: 'Nilgiri Mountain Railway, Doddabetta and tea slopes.',
    highlights: [
      'Mettupalayam–Coonoor–Ooty Nilgiri Toy Train',
      'Doddabetta Peak misty overlook',
      'Sim’s Park & Dolphin’s Nose in Coonoor',
      'Pykara Lake & Pine Forest',
      'Government Botanical Gardens',
      'Homemade chocolate & tea factory visit',
    ],
    mustEat: ['Ooty Varkey', 'Homemade Dark Chocolate', 'Nilgiri Tea'],
    proTips: [
      'Stay in Coonoor for quieter heritage bungalows and tea views',
      'Book Nilgiri Toy Train tickets 30+ days in advance',
    ],
    avoidThis: ['Ooty Lake paddleboats during long holiday queues'],
  },
  {
    id: 'kasol',
    name: 'Kasol & Tosh',
    region: 'india',
    lat: 32.0100,
    lon: 77.3150,
    days: 4,
    vibe: 'Parvati Valley',
    place: 'Himachal Pradesh',
    emoji: '🌲',
    match: 91,
    rating: 4.7,
    stayPerNight: 800,
    foodPerDay: 500,
    localPerDay: 240,
    actPerDay: 350,
    seasonNote: 'Crisp valley pine air',
    tagline: 'Parvati river trails, Kheerganga trek and Tosh wooden cafes.',
    highlights: [
      'Kheerganga hot-springs ridge trek',
      'Chalal riverside pine forest walk',
      'Tosh village wooden balcony cafes',
      'Manikaran Sahib hot springs',
      'Pulga Fairy Forest walk',
      'Kasol riverside evening cafes',
    ],
    mustEat: ['Shakshuka & Wood-fired Pizza', 'Siddu', 'Israeli Platter'],
    proTips: [
      'Base yourself in Tosh or Pulga for panoramic snow peaks',
      'Carry cash — ATMs in Tosh/Barshaini often run dry',
    ],
    avoidThis: ['Starting Kheerganga trek after 10 AM in winter'],
  },
];

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const buildTransportOptions = (originName, distanceKm) => {
  const cfg = globePricingConfig;
  const mult = Number(cfg.peakMultiplier) || 1.0;
  const busPrice = Math.round(
    (distanceKm <= 450
      ? cfg.busShortBase + distanceKm * cfg.busShortPerKm
      : cfg.busLongBase + distanceKm * cfg.busLongPerKm) * mult
  );
  const trainPrice = Math.round(busPrice * cfg.trainMultiplier);
  const roadPrice = Math.round((cfg.roadBase + distanceKm * cfg.roadPerKm) * mult);
  const hrs = Math.max(2, Math.round(distanceKm / 48));

  const options = [
    {
      mode: 'Train · 3AC',
      icon: '🚆',
      detail: `${hrs} hrs one way · comfortable overnight or day train`,
      price: trainPrice,
      unit: 'return / person',
    },
    {
      mode: 'Volvo AC bus',
      icon: '🚌',
      detail: `${hrs + 1} hrs one way · overnight buses run`,
      price: busPrice,
      unit: 'return / person',
    },
    {
      mode: 'Road trip',
      icon: '🚗',
      detail: `${Math.max(2, hrs - 1)} hrs one way · fuel + tolls, 1 car split 2 ways`,
      price: roadPrice,
      unit: 'return / person',
    },
  ];

  if (distanceKm > 750) {
    const flightPrice = Math.round((cfg.flightBase + distanceKm * cfg.flightPerKm) * mult);
    options.unshift({
      mode: 'Flight · Economy',
      icon: '✈️',
      detail: `${Math.max(1, Math.round(distanceKm / 650))} hr flight from ${originName}`,
      price: flightPrice,
      unit: 'return / person',
    });
  }

  return options;
};

const buildStructuredPlan = ({ originName, city, days, primaryTransport }) => {
  const hl = Array.isArray(city.highlights) ? city.highlights : [];
  const eat = Array.isArray(city.mustEat) ? city.mustEat : [];
  const plan = [];

  for (let d = 1; d <= days; d++) {
    if (d === 1) {
      const items = [
        `${primaryTransport.icon} ${originName} → ${city.name} by ${primaryTransport.mode}`,
        'Check in & freshen up',
      ];
      if (hl[0]) items.push(hl[0]);
      if (eat[0]) items.push(`🍽️ Dinner: try ${eat[0]}`);
      plan.push({ day: 1, title: 'Day 1 · Arrive & settle in', items });
    } else if (d === days) {
      const items = [];
      if (hl[hl.length - 1]) items.push(hl[hl.length - 1]);
      items.push('🛍️ Souvenir shopping & checkout');
      items.push(`${primaryTransport.icon} Return to ${originName}`);
      plan.push({ day: d, title: `Day ${d} · Last morning & head home`, items });
    } else {
      const idx = (d - 2) * 2 + 1;
      const items = [];
      if (hl[idx]) items.push(hl[idx]);
      if (hl[idx + 1]) items.push(hl[idx + 1]);
      if (eat[d - 1]) items.push(`🍽️ Must eat: ${eat[d - 1]}`);
      if (items.length === 0) items.push(`Explore ${city.name} local spots`);
      plan.push({ day: d, title: `Day ${d} · Explore`, items });
    }
  }
  return plan;
};

const buildDynamicBudget = ({ city, distanceKm, days, travelers, livePrice, travelCost }) => {
  const nights = Math.max(1, days - 1);
  const stay = Math.round((city.stayPerNight || 1000) * nights);
  const food = Math.round((city.foodPerDay || 550) * days);
  const local = Math.round((city.localPerDay || 220) * days);
  const activities = Math.round((city.actPerDay || 450) * days);

  if (livePrice && Number(livePrice) > 0) {
    const total = Math.round(Number(livePrice));
    const specs = [
      { label: 'Travel', ratio: 0.14, color: '#F97316' },
      { label: 'Stay', ratio: 0.30, color: '#3B82F6' },
      { label: 'Food', ratio: 0.20, color: '#10B981' },
      { label: 'Local transport', ratio: 0.08, color: '#06B6D4' },
      { label: 'Activities', ratio: 0.23, color: '#A855F7' },
      { label: 'Buffer (5%)', ratio: 0.05, color: '#64748B' },
    ];
    return {
      pricePerPerson: total,
      groupTotal: total * travelers,
      youSave: Math.max(0, Math.round(total * 0.08)),
      stayPerNight: Math.round((total * 0.30) / nights),
      budgetNote: `${nights} nights · budget hotels · live trip pricing`,
      budgetBreakdown: specs.map((s) => ({
        label: s.label,
        amount: Math.round(total * s.ratio),
        ratio: s.ratio,
        color: s.color,
      })),
    };
  }

  const subTotal = travelCost + stay + food + local + activities;
  const bufferRatio = Number(globePricingConfig.bufferRatio) || 0.05;
  const buffer = Math.round(subTotal * bufferRatio);
  const total = subTotal + buffer;
  const benchmark = Math.round(total * 1.078);

  const rawItems = [
    { label: 'Travel', amount: travelCost, color: '#F97316' },
    { label: 'Stay', amount: stay, color: '#3B82F6' },
    { label: 'Food', amount: food, color: '#10B981' },
    { label: 'Local transport', amount: local, color: '#06B6D4' },
    { label: 'Activities', amount: activities, color: '#A855F7' },
    { label: 'Buffer (5%)', amount: buffer, color: '#64748B' },
  ];

  return {
    pricePerPerson: total,
    groupTotal: total * travelers,
    youSave: Math.max(250, benchmark - total),
    stayPerNight: Math.round(stay / nights),
    budgetNote: `${nights} nights · budget hotels · smart 2026 estimate`,
    budgetBreakdown: rawItems.map((item) => ({
      ...item,
      ratio: Number((item.amount / total).toFixed(4)),
    })),
  };
};

const WEATHER_CACHE = new Map();

const mapWmoCodeToSymbol = (code) => {
  if (code === 0) return 'clearsky_day';
  if (code <= 3) return 'partlycloudy_day';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80) return 'rainshowers_day';
  return 'cloudy';
};

export const getGlobeWeather = async ({ lat, lon } = {}) => {
  const numLat = Number(lat);
  const numLon = Number(lon);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon)) {
    throw new ApiError(400, 'Valid lat and lon are required');
  }

  const key = `${numLat.toFixed(2)},${numLon.toFixed(2)}`;
  const cached = WEATHER_CACHE.get(key);
  if (cached && Date.now() - cached.fetchedAt < 30 * 60 * 1000) {
    return cached.data;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${numLat}&longitude=${numLon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Weather upstream error');
    const json = await resp.json();

    const cur = json.current || {};
    const daily = json.daily || {};
    const dates = Array.isArray(daily.time) ? daily.time : [];
    const days = dates.slice(0, 7).map((date, i) => ({
      date,
      min: Math.round(Number(daily.temperature_2m_min?.[i] ?? 15)),
      max: Math.round(Number(daily.temperature_2m_max?.[i] ?? 26)),
      rain: Number(daily.precipitation_sum?.[i] ?? 0),
      symbol: mapWmoCodeToSymbol(Number(daily.weather_code?.[i] ?? 0)),
    }));

    const data = {
      now: {
        temp: Math.round(Number(cur.temperature_2m ?? 22)),
        wind: Math.round(Number(cur.wind_speed_10m ?? 8)),
        humidity: Math.round(Number(cur.relative_humidity_2m ?? 60)),
        symbol: mapWmoCodeToSymbol(Number(cur.weather_code ?? 0)),
      },
      days,
      source: 'Open-Meteo',
      updated: new Date().toISOString(),
    };

    WEATHER_CACHE.set(key, { fetchedAt: Date.now(), data });
    return data;
  } catch {
    return {
      now: { temp: 22, wind: 8, humidity: 62, symbol: 'clearsky_day' },
      days: [],
      source: 'Estimate',
      updated: new Date().toISOString(),
    };
  }
};

export const getGlobeDestinations = async ({
  origin = 'delhi',
  region = 'all',
  lat,
  lon,
  days,
  travelers = 2,
} = {}) => {
  const catalog = getActiveCatalog();
  const originKey = String(origin || 'delhi').trim().toLowerCase();
  const catalogMatch = catalog.find(
    (c) => c.id === originKey || c.name.toLowerCase() === originKey
  );
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);
  const hasCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLon);
  const travelerCount = Math.max(1, Math.min(12, Number(travelers) || 2));

  const originCity = catalogMatch
    ? {
        ...catalogMatch,
        ...(hasCoords ? { lat: parsedLat, lon: parsedLon } : {}),
      }
    : hasCoords
      ? {
          id: originKey,
          name: String(origin || 'Current City'),
          region: 'india',
          lat: parsedLat,
          lon: parsedLon,
          emoji: '📍',
          place: 'India',
        }
      : catalog[0] || GLOBE_CITY_CATALOG[0];

  const liveTrips = Array.isArray(strangerTrips) ? strangerTrips : [];
  const livePlans = Array.isArray(strangerPlans) ? strangerPlans : [];

  const enriched = catalog
    .filter(
      (c) =>
        c.id !== originCity.id &&
        c.name.toLowerCase() !== originCity.name.toLowerCase()
    )
    .map((city) => {
      const needle = city.name.toLowerCase();
      const matchingTrips = liveTrips.filter((t) => {
        const dest = (t.destination || '').toLowerCase();
        const status = (t.status || 'PUBLISHED').toUpperCase();
        return status !== 'CANCELLED' && status !== 'COMPLETED' && dest.includes(needle);
      });
      const matchingPlans = livePlans.filter((p) => {
        const loc = `${p.location || ''} ${p.title || ''}`.toLowerCase();
        return loc.includes(needle);
      });

      const firstTrip = matchingTrips[0];
      const explicitLivePrice =
        firstTrip?.pricePerPerson && Number(firstTrip.pricePerPerson) > 0
          ? Math.round(Number(firstTrip.pricePerPerson))
          : null;

      const tripDays = Number(days) > 0 ? Number(days) : city.days;
      const distanceKm = haversineKm(originCity.lat, originCity.lon, city.lat, city.lon);
      const howToGetThere = buildTransportOptions(originCity.name, distanceKm);
      const primaryTransport = howToGetThere.find((t) => t.mode.includes('Volvo')) || howToGetThere[0];

      const budget = buildDynamicBudget({
        city,
        distanceKm,
        days: tripDays,
        travelers: travelerCount,
        livePrice: explicitLivePrice,
        travelCost: primaryTransport.price,
      });

      const structuredPlan = buildStructuredPlan({
        originName: originCity.name,
        city,
        days: tripDays,
        primaryTransport,
      });

      return {
        id: city.id,
        name: city.name,
        region: city.region,
        lat: city.lat,
        lon: city.lon,
        days: tripDays,
        vibe: city.vibe,
        place: city.place,
        emoji: city.emoji,
        match: city.match,
        rating: city.rating,
        seasonNote: city.seasonNote,
        distanceKm,
        pricePerPerson: budget.pricePerPerson,
        groupOf2: budget.groupTotal,
        youSave: budget.youSave,
        stayPerNight: budget.stayPerNight,
        budgetNote: budget.budgetNote,
        budgetBreakdown: budget.budgetBreakdown,
        howToGetThere,
        structuredPlan,
        mustEat: city.mustEat,
        proTips: city.proTips,
        avoidThis: city.avoidThis,
        activeTripsCount: matchingTrips.length + matchingPlans.length,
        liveTripId: firstTrip?.id || null,
        liveHostName: firstTrip?.hostName || null,
        tagline: firstTrip?.notes || city.tagline,
      };
    });

  const filtered = (region === 'india' || region === 'abroad'
    ? enriched.filter((c) => c.region === region)
    : enriched
  ).filter(
    (c) =>
      c.id !== originCity.id &&
      c.name.toLowerCase() !== originCity.name.toLowerCase()
  );

  return {
    origin: {
      id: originCity.id,
      name: originCity.name,
      region: originCity.region,
      lat: originCity.lat,
      lon: originCity.lon,
      emoji: originCity.emoji,
      place: originCity.place,
    },
    origins: getActiveCatalog().filter((c) => c.region === 'india').slice(0, 7).map((c) => ({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
    })),
    destinations: filtered,
  };
};

// --- Persisted Admin-Editable Globe Catalog & Pricing Config ---
const globeCatalogFilePath = path.join(__dirname, 'globe_catalog.json');

const DEFAULT_GLOBE_PRICING_CONFIG = {
  busShortBase: 600,
  busShortPerKm: 1.1,
  busLongBase: 900,
  busLongPerKm: 0.95,
  trainMultiplier: 1.14,
  roadBase: 950,
  roadPerKm: 4.8,
  flightBase: 4200,
  flightPerKm: 2.6,
  bufferRatio: 0.05,
  peakMultiplier: 1.0,
};

let globePricingConfig = { ...DEFAULT_GLOBE_PRICING_CONFIG };
let globeCatalog = GLOBE_CITY_CATALOG.map((c) => ({ ...c, isActive: true }));

const loadGlobeCatalog = () => {
  try {
    if (fs.existsSync(globeCatalogFilePath)) {
      const raw = JSON.parse(fs.readFileSync(globeCatalogFilePath, 'utf8'));
      if (raw && typeof raw === 'object') {
        if (raw.pricingConfig && typeof raw.pricingConfig === 'object') {
          globePricingConfig = { ...DEFAULT_GLOBE_PRICING_CONFIG, ...raw.pricingConfig };
        }
        if (Array.isArray(raw.destinations) && raw.destinations.length > 0) {
          globeCatalog = raw.destinations;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Failed to load globe_catalog.json, using default catalog:', err.message);
  }
};

const saveGlobeCatalog = () => {
  try {
    fs.writeFileSync(
      globeCatalogFilePath,
      JSON.stringify({ pricingConfig: globePricingConfig, destinations: globeCatalog }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('❌ Failed to save globe_catalog.json:', err.message);
  }
};

const getActiveCatalog = () => globeCatalog.filter((c) => c.isActive !== false);

loadGlobeCatalog();

export const adminGetGlobeConfig = async () => ({
  pricingConfig: globePricingConfig,
  destinations: globeCatalog,
});

export const adminUpdateGlobePricingConfig = async (payload = {}) => {
  const numericKeys = Object.keys(DEFAULT_GLOBE_PRICING_CONFIG);
  for (const k of numericKeys) {
    if (payload[k] !== undefined && Number.isFinite(Number(payload[k]))) {
      globePricingConfig[k] = Number(payload[k]);
    }
  }
  saveGlobeCatalog();
  return globePricingConfig;
};

export const adminCreateGlobeDestination = async (payload = {}) => {
  const name = String(payload.name || '').trim();
  if (!name) throw new ApiError(400, 'Destination name is required');
  const id = String(
    payload.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  ).trim();
  if (globeCatalog.some((c) => c.id === id)) {
    throw new ApiError(409, `Destination "${id}" already exists`);
  }
  const newItem = {
    id,
    name,
    region: payload.region === 'abroad' ? 'abroad' : 'india',
    lat: Number(payload.lat) || 22.8,
    lon: Number(payload.lon) || 79.0,
    days: Math.max(1, Number(payload.days) || 3),
    vibe: String(payload.vibe || 'Explore'),
    place: String(payload.place || 'India'),
    emoji: String(payload.emoji || '📍'),
    match: Number(payload.match) || 88,
    rating: Number(payload.rating) || 4.6,
    stayPerNight: Number(payload.stayPerNight) || 1000,
    foodPerDay: Number(payload.foodPerDay) || 550,
    localPerDay: Number(payload.localPerDay) || 220,
    actPerDay: Number(payload.actPerDay) || 450,
    seasonNote: String(payload.seasonNote || 'Pleasant weather'),
    tagline: String(payload.tagline || ''),
    highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
    mustEat: Array.isArray(payload.mustEat) ? payload.mustEat : [],
    proTips: Array.isArray(payload.proTips) ? payload.proTips : [],
    avoidThis: Array.isArray(payload.avoidThis) ? payload.avoidThis : [],
    isActive: payload.isActive !== false,
  };
  globeCatalog.push(newItem);
  saveGlobeCatalog();
  return newItem;
};

export const adminUpdateGlobeDestination = async (id, payload = {}) => {
  const idx = globeCatalog.findIndex((c) => c.id === id);
  if (idx === -1) throw new ApiError(404, 'Globe destination not found');
  const current = globeCatalog[idx];
  const updated = {
    ...current,
    ...(payload.name !== undefined ? { name: String(payload.name) } : {}),
    ...(payload.place !== undefined ? { place: String(payload.place) } : {}),
    ...(payload.emoji !== undefined ? { emoji: String(payload.emoji) } : {}),
    ...(payload.vibe !== undefined ? { vibe: String(payload.vibe) } : {}),
    ...(payload.tagline !== undefined ? { tagline: String(payload.tagline) } : {}),
    ...(payload.seasonNote !== undefined ? { seasonNote: String(payload.seasonNote) } : {}),
    ...(payload.days !== undefined ? { days: Math.max(1, Number(payload.days)) } : {}),
    ...(payload.stayPerNight !== undefined ? { stayPerNight: Number(payload.stayPerNight) } : {}),
    ...(payload.foodPerDay !== undefined ? { foodPerDay: Number(payload.foodPerDay) } : {}),
    ...(payload.localPerDay !== undefined ? { localPerDay: Number(payload.localPerDay) } : {}),
    ...(payload.actPerDay !== undefined ? { actPerDay: Number(payload.actPerDay) } : {}),
    ...(payload.match !== undefined ? { match: Number(payload.match) } : {}),
    ...(payload.rating !== undefined ? { rating: Number(payload.rating) } : {}),
    ...(Array.isArray(payload.highlights) ? { highlights: payload.highlights } : {}),
    ...(Array.isArray(payload.mustEat) ? { mustEat: payload.mustEat } : {}),
    ...(Array.isArray(payload.proTips) ? { proTips: payload.proTips } : {}),
    ...(Array.isArray(payload.avoidThis) ? { avoidThis: payload.avoidThis } : {}),
    ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
  };
  globeCatalog[idx] = updated;
  saveGlobeCatalog();
  return updated;
};

export const adminDeleteGlobeDestination = async (id) => {
  const idx = globeCatalog.findIndex((c) => c.id === id);
  if (idx === -1) throw new ApiError(404, 'Globe destination not found');
  const [removed] = globeCatalog.splice(idx, 1);
  saveGlobeCatalog();
  return removed;
};

export const adminImportGlobeCatalog = async ({
  pricingConfig,
  destinations,
  mode = 'merge',
} = {}) => {
  if (!pricingConfig && !Array.isArray(destinations)) {
    throw new ApiError(400, 'Provide pricingConfig and/or a destinations array in JSON');
  }

  if (pricingConfig && typeof pricingConfig === 'object') {
    for (const k of Object.keys(DEFAULT_GLOBE_PRICING_CONFIG)) {
      if (pricingConfig[k] !== undefined && Number.isFinite(Number(pricingConfig[k]))) {
        globePricingConfig[k] = Number(pricingConfig[k]);
      }
    }
  }

  let updatedCount = 0;
  let addedCount = 0;

  if (Array.isArray(destinations)) {
    const normalized = destinations
      .filter((d) => d && typeof d === 'object' && String(d.name || '').trim())
      .map((d) => {
        const name = String(d.name).trim();
        const id = String(d.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim();
        return {
          id,
          name,
          region: d.region === 'abroad' ? 'abroad' : 'india',
          lat: Number.isFinite(Number(d.lat)) ? Number(d.lat) : 22.8,
          lon: Number.isFinite(Number(d.lon)) ? Number(d.lon) : 79.0,
          days: Math.max(1, Number(d.days) || 3),
          vibe: String(d.vibe || 'Explore'),
          place: String(d.place || 'India'),
          emoji: String(d.emoji || '📍'),
          match: Number(d.match) || 88,
          rating: Number(d.rating) || 4.6,
          stayPerNight: Number(d.stayPerNight) || 1000,
          foodPerDay: Number(d.foodPerDay) || 550,
          localPerDay: Number(d.localPerDay) || 220,
          actPerDay: Number(d.actPerDay) || 450,
          seasonNote: String(d.seasonNote || 'Pleasant weather'),
          tagline: String(d.tagline || ''),
          highlights: Array.isArray(d.highlights) ? d.highlights.map(String) : [],
          mustEat: Array.isArray(d.mustEat) ? d.mustEat.map(String) : [],
          proTips: Array.isArray(d.proTips) ? d.proTips.map(String) : [],
          avoidThis: Array.isArray(d.avoidThis) ? d.avoidThis.map(String) : [],
          isActive: d.isActive !== false,
        };
      });

    if (normalized.length === 0) {
      throw new ApiError(400, 'No valid destination entries found in destinations array');
    }

    if (mode === 'replace') {
      globeCatalog = normalized;
      addedCount = normalized.length;
    } else {
      for (const item of normalized) {
        const idx = globeCatalog.findIndex((c) => c.id === item.id);
        if (idx >= 0) {
          globeCatalog[idx] = { ...globeCatalog[idx], ...item };
          updatedCount += 1;
        } else {
          globeCatalog.push(item);
          addedCount += 1;
        }
      }
    }
  }

  saveGlobeCatalog();
  return {
    mode,
    updatedCount,
    addedCount,
    totalDestinations: globeCatalog.length,
    pricingConfig: globePricingConfig,
  };
};
