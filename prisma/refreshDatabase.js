const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.messageReciept.deleteMany({})
    await prisma.message.deleteMany({})
    await prisma.group.deleteMany({})
    console.log('Fake data deleted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


