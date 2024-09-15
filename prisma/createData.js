const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  /* Create Users
  const user1 = await prisma.user.create({
    data: {
      username: 'johndoe',
      password: 'password123', // You would hash this in real scenarios
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'janedoe',
      password: 'password456',
    },
  });
  */
    const user1 = await prisma.user.findUnique({
        where: {
            username: 'johndoe'
        }
    })

    const user2 = await prisma.user.findUnique({
        where: {
            username: 'janedoe'
        }
     })

  // Create Group
  const group = await prisma.group.create({
    data: {
      name: 'Study Group',
      directMsg: false,
      members: {
        connect: [{ id: user1.id }, { id: user2.id }, {id: 9}],
      },
    },
  });

  // Create Messages in Group
  const groupMessage1 = await prisma.message.create({
    data: {
      content: 'Hey everyone!',
      authorId: user1.id,
      groupId: group.id,
    },
  });

  const groupMessage2 = await prisma.message.create({
    data: {
      content: 'Hello John!',
      authorId: user2.id,
      groupId: group.id,
    },
  });

  // Create Direct Message Chat
  const directMessageChat = await prisma.group.create({
    data: {
      directMsg: true,
      members: {
        connect: [{ id: user1.id }, { id: user2.id }],
      },
    },
  });

  // Create Direct Messages
  const directMessage1 = await prisma.message.create({
    data: {
      content: 'Hey Jane, how are you?',
      authorId: user1.id,
      groupId: directMessageChat.id,
    },
  });

  const directMessage2 = await prisma.message.create({
    data: {
      content: 'I am good, how about you?',
      authorId: user2.id,
      groupId: directMessageChat.id,
    },
  });

  // Create Direct Message Chat
  const directMessageChat2 = await prisma.group.create({
    data: {
      directMsg: true,
      members: {
        connect: [{ id: 9 }, { id: 10 }],
      },
    },
  });

  // Create Direct Messages
  const directMessage3 = await prisma.message.create({
    data: {
      content: 'Hello Tom, how are you?',
      authorId: 9,
      groupId: directMessageChat2.id,
    },
  });

  const directMessage4 = await prisma.message.create({
    data: {
      content: 'I am doing well thanks.',
      authorId: 10,
      groupId: directMessageChat2.id,
    },
  }); 

  // Create Message Receipts
  const receipt1 = await prisma.messageReciept.create({
    data: {
      messageId: groupMessage1.id,
      userId: user2.id,
      delivered: true,
      read: true,
      readAt: new Date(),
    },
  });

  const receipt2 = await prisma.messageReciept.create({
    data: {
      messageId: directMessage1.id,
      userId: user2.id,
      delivered: true,
      read: false,
    },
  });

  // Create Direct Message Chat
  const groupChat2 = await prisma.group.create({
    data: {
      directMsg: false,
      members: {
        connect: [{ id: 9 }, { id: 10 }, {id: 8}, {id:6}],
      },
    },
  });

  // Create Direct Message Chat
  const groupChat2Message1 = await prisma.message.create({
    data: {
      content: 'This is the unnamed Group chat.',
      authorId: 10,
      groupId: groupChat2.id,
    },
  });

  // Add contacts for user 9
  const contactsForUser9 = await prisma.user.update({
    where: { id: 9 },
    data: {
      contacts: {
        connect: [{ id: user1.id }, { id: user2.id }, { id: 10 }] // Add any users you'd like to user 9's contact list
      }
    }
  });

  console.log('Fake data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
