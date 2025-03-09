if (process.env.MONGO_DB_CONNECTION_STRING === undefined) {
  // Environment config
  const dotenv = require('dotenv');
  const path = require('path')

  // Determine which .env file to load based on NODE_ENV
  const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';

  // Load the environment variables
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  console.log(`Current environment: ${process.env.NODE_ENV || 'default'}`);

  console.log("Database URL: ", process.env.MONGO_DB_CONNECTION_STRING)
}

const { db, connectDB, client } = require('../configuration/connectToMongoDB') 

async function main() {
  await connectDB();
  console.log('Connected to MongoDB');

  await db().collection('messages').deleteMany({})
  await db().collection('groups').deleteMany({})
  await db().collection('users').deleteMany({})
  console.log('Fake data deleted successfully');

  await client().close();
  console.log('MongoDB connection closed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


