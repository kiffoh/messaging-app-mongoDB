const { MongoClient } = require('mongodb');
require('dotenv').config();

async function runSetup() {
    const client = new MongoClient(process.env.MONGO_DB_CONNECTION_STRING);
    
    try {
        await client.connect();
        const db = client.db('messagingApp');

        const usersCollection = db.collection('users');

        await usersCollection.createIndex({ username: 1}, { unique: true});
        
        console.log('Unique index on username created successfully');
    } catch (error) {
        console.error('Error setting up MongoDB:', error);
    } finally {
        await client.close();
    }
}

runSetup();