if (process.env.DATABASE_URL === undefined) {
  // Environment config
  const dotenv = require('dotenv');
  const path = require('path')

  // Determine which .env file to load based on NODE_ENV
  const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';

  // Load the environment variables
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  console.log(`Current environment: ${process.env.NODE_ENV || 'default'}`);

  console.log("Database URL: ", process.env.FRONTEND_URL)
}

const { db } = require('../configuration/connectToMongoDB') 

async function main() {
    await db().collection('messages').deleteMany({})
    await db().collection('groups').deleteMany({})
    await db().collection('users').deleteMany({})
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


