import os from 'os';
import { env } from '../config/env.js';

export const getNetworkIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

export const getServerBaseUrl = (req = null) => {
  if (process.env.BASE_URL && process.env.BASE_URL.trim().length > 0) {
    return process.env.BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }
  if (req && typeof req.get === 'function') {
    const host = req.get('host');
    if (host) {
      const protocol = req.protocol || 'http';
      return `${protocol}://${host}`;
    }
  }
  const ip = getNetworkIp();
  return `http://${ip}:${env.port}`;
};

export const toAbsoluteUrl = (url, req = null) => {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (clean.length === 0) return '';

  // Already a full network URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // Relative uploaded asset (/uploads/... or uploads/...)
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return `${getServerBaseUrl(req)}${cleanPath}`;
  }

  return clean;
};

const dynamicTravelVideos = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];

export const toAbsoluteVideoUrl = (videoUrl, vibe = '', seed = '', req = null) => {
  if (!videoUrl || typeof videoUrl !== 'string') {
    const hash = String(seed || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return dynamicTravelVideos[hash % dynamicTravelVideos.length];
  }

  const clean = videoUrl.trim();

  // If local device path from phone cache was passed, map to dynamic roadtrip travel video
  if (
    clean.startsWith('/data/user/') ||
    clean.startsWith('/storage/emulated/') ||
    clean.includes('com.sharing.wala/cache') ||
    clean.startsWith('file://')
  ) {
    const hash = String(seed || clean).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return dynamicTravelVideos[hash % dynamicTravelVideos.length];
  }

  // If it's a relative backend upload (/uploads/...)
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return `${getServerBaseUrl(req)}${cleanPath}`;
  }

  // If already absolute URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // If it's the old oceans.mp4 placeholder, replace with dynamic travel video
    if (clean.includes('oceans.mp4')) {
      const hash = String(seed || clean).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return dynamicTravelVideos[hash % dynamicTravelVideos.length];
    }
    return clean;
  }

  return toAbsoluteUrl(clean, req);
};

