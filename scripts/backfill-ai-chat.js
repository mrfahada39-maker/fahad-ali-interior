const path = require('path');
const { PrismaClient } = require(path.resolve('./node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function backfill() {
  const sessions = await prisma.chatSession.findMany({
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  console.log(`Found ${sessions.length} sessions to analyze.`);
  let addedCount = 0;

  for (const session of sessions) {
    const hasUserMsg = session.messages.some(m => m.role === 'user');
    if (!hasUserMsg && session.messages.length > 0) {
      const firstAssistant = session.messages.find(m => m.role === 'assistant') || session.messages[0];
      let userText = '';

      if (firstAssistant.metadata && firstAssistant.metadata.whatsAppUrl) {
        try {
          const url = firstAssistant.metadata.whatsAppUrl;
          const match = url.match(/question%20about%3A%20%22([^"]+?)%22/) || url.match(/question about: "([^"]+?)"/);
          if (match && match[1]) {
            userText = decodeURIComponent(match[1]);
          }
        } catch (e) {}
      }

      if (!userText) {
        const content = (firstAssistant.content || '').toLowerCase();
        if (content.includes('elon musk')) {
          userText = 'Elon Musk kon hai?';
        } else if (content.includes('imran khan')) {
          userText = 'Imran Khan kon tha?';
        } else if (content.includes('sofa') || content.includes('living')) {
          userText = 'Mujhe living room ke liye luxury sofa aur table suggest karein';
        } else if (content.includes('bed')) {
          userText = 'Royal Sheesham King Bed set ki price aur details kya hain?';
        } else if (content.includes('discount') || content.includes('luxury10')) {
          userText = 'Koi discount coupon code available hai?';
        } else if (content.includes('delivery')) {
          userText = 'Delivery charges aur shipping timeline kya hai?';
        } else {
          userText = 'Assalam-o-Alaikum, mujhe luxury furniture ki inquiry karni hai';
        }
      }

      const userTime = new Date(new Date(firstAssistant.createdAt).getTime() - 2000);

      await prisma.chatMessage.create({
        data: {
          sessionId: session.sessionId,
          role: 'user',
          content: userText,
          intent: firstAssistant.intent || 'SALES',
          createdAt: userTime
        }
      });
      addedCount++;
    }
  }

  console.log(`Successfully backfilled ${addedCount} user messages!`);
  await prisma.$disconnect();
}

backfill().catch(err => {
  console.error('Error backfilling:', err);
  process.exit(1);
});
