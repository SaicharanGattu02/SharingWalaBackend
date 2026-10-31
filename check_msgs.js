import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.chatMessage.findMany({
    take: 30,
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: { id: true, name: true, phone: true } } }
  });
  console.log(JSON.stringify(msgs.map(m => ({
    id: m.id,
    conv: m.conversationId,
    text: m.content,
    sender: m.sender?.name,
    senderId: m.senderId,
    time: m.createdAt
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
