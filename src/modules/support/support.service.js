import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TICKETS_FILE = path.join(__dirname, 'support_tickets.json');

const ensureTicketsStore = () => {
  if (!fs.existsSync(TICKETS_FILE)) {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

const readTickets = () => {
  try {
    ensureTicketsStore();
    const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[SupportService] Error reading tickets store:', err.message);
    return [];
  }
};

const writeTickets = (tickets) => {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SupportService] Error writing tickets store:', err.message);
  }
};

export const getSupportInfo = async () => {
  return {
    supportEmail: 'support@share2go.app',
    appealEmail: 'appeals@share2go.app',
    supportPhone: '+91 98765 43210',
    whatsappHelpline: '+91 98765 43210',
    workingHours: 'Monday – Sunday, 9:00 AM – 9:00 PM IST',
    emergencyHelpline: '112 / +91 98765 43211',
    categories: [
      { id: 'ACCOUNT_DEACTIVATED', label: 'Account Deactivated / Appeal Reactivation' },
      { id: 'DOCUMENT_VERIFICATION', label: 'Driving License / RC Verification' },
      { id: 'RIDE_DISPUTE', label: 'Ride Booking / Route Issue' },
      { id: 'PAYMENT_REFUND', label: 'Payment, Toll or Refund Inquiry' },
      { id: 'SAFETY_INCIDENT', label: 'Safety, Trust or Incident Report' },
      { id: 'GENERAL_QUERY', label: 'General Feedback or Query' },
    ],
    faqs: [
      {
        question: 'Why was my SharingWala account deactivated?',
        answer: 'Accounts may be temporarily placed on hold due to missing document verification, trust and safety reviews, or security policy restrictions. Submitting an appeal with your details helps our admin team review and expedite reactivation.',
      },
      {
        question: 'How long does account reactivation review take?',
        answer: 'Our Trust & Safety administration reviews account reactivation appeals within 2 to 24 business hours.',
      },
      {
        question: 'What information should I provide in my appeal?',
        answer: 'Provide your registered phone number or email, explain any recent trip circumstances, and clarify your identity details so our support team can verify your record.',
      },
    ],
  };
};

export const createSupportTicket = async (data, user = null) => {
  const tickets = readTickets();

  const ticketId = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const resolvedUserId = user?.id || data.userId || null;
  const resolvedEmail = data.email || user?.email || 'unspecified@user.app';
  const resolvedPhone = data.phone || user?.phone || 'N/A';
  const resolvedName = data.name || user?.displayName || user?.username || 'SharingWala User';

  const newTicket = {
    id: ticketId,
    userId: resolvedUserId,
    name: resolvedName,
    email: resolvedEmail,
    phone: resolvedPhone,
    category: data.category || 'ACCOUNT_DEACTIVATED',
    subject: data.subject,
    message: data.message,
    status: 'OPEN',
    priority: data.category === 'ACCOUNT_DEACTIVATED' ? 'HIGH' : 'NORMAL',
    source: 'APP_INACTIVE_SHEET',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tickets.unshift(newTicket);
  writeTickets(tickets);

  // Attempt to log in Prisma AdminActivityLog for visibility
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId: null,
        action: 'SUPPORT_TICKET_SUBMITTED',
        targetType: 'SUPPORT_TICKET',
        targetId: ticketId,
        metadata: {
          category: newTicket.category,
          subject: newTicket.subject,
          email: resolvedEmail,
          userId: resolvedUserId,
        },
      },
    });
  } catch (_) {}

  return {
    ticketId: newTicket.id,
    category: newTicket.category,
    subject: newTicket.subject,
    status: newTicket.status,
    priority: newTicket.priority,
    message: 'Your support inquiry and appeal has been registered. Our operations team will review your account status within 24 hours.',
    submittedAt: newTicket.createdAt,
  };
};

export const listSupportTickets = async () => {
  return readTickets();
};

