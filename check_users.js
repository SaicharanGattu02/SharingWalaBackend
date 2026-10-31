import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, displayName: true, phone: true, role: true, createdAt: true }
  });
  console.log('USERS:', JSON.stringify(users, null, 2));

  const convs = await prisma.conversation.findMany({
    take: 10,
    orderBy: { lastMessageAt: 'desc' },
    select: { id: true, title: true, type: true, communityId: true }
  });
  console.log('CONVERSATIONS:', JSON.stringify(convs, null, 2));

  const recentMsgs = await prisma.chatMessage.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: { id: true, displayName: true, phone: true } } }
  });
  console.log('RECENT MESSAGES:', JSON.stringify(recentMsgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

