/**
 * In-memory registry of ringing / active 1-to-1 calls.
 *
 * Why this exists:
 *  - The app starts a call over BOTH the socket (`call:initiate`) and REST
 *    (`POST /chat/call/initiate`) so it still rings if one path is down. Without
 *    de-duplication the receiver got two `call:incoming` events + two pushes,
 *    and the second one was auto-rejected as BUSY.
 *  - A receiver woken by a push (background / killed) comes online seconds
 *    after the caller sent its WebRTC offer + ICE candidates. Those signals were
 *    emitted to an empty (or dead) socket room and lost, so the call could never
 *    connect. We buffer them and replay once the receiver's app is ready.
 *  - If the caller's app dies while ringing, nobody sent `call:end`, so the
 *    receiver kept ringing. We end such calls after a short grace period.
 */

const RING_TTL_MS = 60 * 1000; // a call that is never answered is forgotten after this
const DUPLICATE_WINDOW_MS = 30 * 1000;
const MAX_BUFFERED_SIGNALS = 100;

// calleeId -> session
const sessionsByCallee = new Map();

const now = () => Date.now();

const isExpired = (session) =>
  !session.accepted && now() - session.createdAt > RING_TTL_MS;

export const getSessionForCallee = (calleeId) => {
  const session = sessionsByCallee.get(calleeId);
  if (!session) return null;
  if (isExpired(session)) {
    endSession(calleeId);
    return null;
  }
  return session;
};

/**
 * Returns true if this exact call (same caller → same callee) is already
 * ringing, i.e. the second of the socket + REST initiations.
 */
export const isDuplicateInitiation = (callerId, calleeId) => {
  const session = getSessionForCallee(calleeId);
  return Boolean(
    session &&
      session.callerId === callerId &&
      !session.accepted &&
      now() - session.createdAt < DUPLICATE_WINDOW_MS
  );
};

export const startSession = ({ callerId, calleeId, payload }) => {
  endSession(calleeId);
  const session = {
    callerId,
    calleeId,
    payload,
    createdAt: now(),
    accepted: false,
    calleeReady: false, // receiver's app is connected and listening
    pendingSignals: [],
    expiryTimer: null,
    callerOfflineTimer: null,
  };
  session.expiryTimer = setTimeout(() => {
    const current = sessionsByCallee.get(calleeId);
    if (current === session && !current.accepted) endSession(calleeId);
  }, RING_TTL_MS);
  sessionsByCallee.set(calleeId, session);
  return session;
};

/** Keep caller → callee signals until the callee's app is ready for them. */
export const bufferSignalIfNeeded = ({ fromUserId, toUserId, signalData }) => {
  const session = getSessionForCallee(toUserId);
  if (!session || session.callerId !== fromUserId) return;
  if (session.accepted || session.calleeReady) return;
  if (session.pendingSignals.length >= MAX_BUFFERED_SIGNALS) return;
  session.pendingSignals.push(signalData);
};

/**
 * Callee's app is connected and listening. Returns the buffered signals
 * (to replay to the callee) and clears the buffer.
 */
export const markCalleeReady = (calleeId, callerId) => {
  const session = getSessionForCallee(calleeId);
  if (!session || (callerId && session.callerId !== callerId)) return [];
  session.calleeReady = true;
  const signals = session.pendingSignals;
  session.pendingSignals = [];
  return signals;
};

export const markAccepted = (calleeId, callerId) => {
  const session = getSessionForCallee(calleeId);
  if (!session || (callerId && session.callerId !== callerId)) return [];
  session.accepted = true;
  if (session.expiryTimer) clearTimeout(session.expiryTimer);
  session.expiryTimer = null;
  const signals = session.calleeReady ? [] : session.pendingSignals;
  session.calleeReady = true;
  session.pendingSignals = [];
  return signals;
};

export function endSession(calleeId) {
  const session = sessionsByCallee.get(calleeId);
  if (!session) return null;
  if (session.expiryTimer) clearTimeout(session.expiryTimer);
  if (session.callerOfflineTimer) clearTimeout(session.callerOfflineTimer);
  sessionsByCallee.delete(calleeId);
  return session;
}

/** End whichever call these two users share, regardless of who is caller. */
export const endSessionBetween = (userA, userB) => {
  const a = sessionsByCallee.get(userA);
  if (a && (!userB || a.callerId === userB)) return endSession(userA);
  const b = userB ? sessionsByCallee.get(userB) : null;
  if (b && b.callerId === userA) return endSession(userB);
  return null;
};

/** Ringing (not yet answered) calls placed by this user. */
export const getUnansweredOutgoingSessions = (callerId) =>
  Array.from(sessionsByCallee.values()).filter(
    (s) => s.callerId === callerId && !s.accepted && !isExpired(s)
  );
