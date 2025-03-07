const { MongoClient } = require('mongodb');
require('dotenv').config();

console.log("MongoDB String:",process.env.MONGO_DB_CONNECTION_STRING);
const mongo = new MongoClient(process.env.MONGO_DB_CONNECTION_STRING);
let db;

async function connectDB() {

    try {
        await mongo.connect();
        db = mongo.db('messagingApp');
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

process.on('SIGINT', async () => {
    await mongo.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await mongo.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
  
  module.exports = { connectDB, db: () => db, client: () => mongo };