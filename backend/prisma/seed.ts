import prisma from "../src/db";

async function run() {
  console.log("Seeding...");

  // Create 10 users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: `hashed-dummy`, // replace with actual hash if needed
        phone: `5550000${i.toString().padStart(3, "0")}`, // simple dummy phone
      },
    });
    users.push(user);
  }

  // Create 5 chats
  const chats = [];
  for (let i = 1; i <= 5; i++) {
    const chat = await prisma.chat.create({
      data: {
        name: `Chat ${i}`,
        isGroup: true,
        participants: {
          connect: users.map((u) => ({ id: u.id })),
        },
      },
    });
    chats.push(chat);
  }

  // Create 20 messages per chat
  for (const chat of chats) {
    for (let j = 1; j <= 20; j++) {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: users[j % users.length].id, // rotate senders
          content: `Message ${j} in ${chat.name}`,
        },
      });
    }
  }

  console.log("Done seeding.");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
