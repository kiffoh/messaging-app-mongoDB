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

const { connectDB, db, client } = require('../configuration/connectToMongoDB');

// Default profile pictures
const defaultPicture = process.env.DEFAULT_PICTURE;
const defaultGroupPicture = process.env.DEFAULT_GROUP_PICTURE;

async function main() {
  // Connect to MongoDB
  await connectDB();
  const users = db().collection('users');
  const messages = db().collection('messages');
  const groups = db().collection('groups');

  // Create Users

  async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  const user1 = await users.insertOne({
    username: 'johndoe',
    password: await hashPassword('password123'),
  });

  const user2 = await users.insertOne({
    username: 'janedoe',
    password: await hashPassword('password456'),
  });

  const test9 = await users.insertOne({
    username: 'test9',
    password: await hashPassword('123'),
  })

  const user4 = await users.insertOne({
    username: 'user4',
    password: await hashPassword('4567'),
  });

  // Create Group
  const group = await groups.insertOne({
    name: 'Study Group',
    directMsg: false,
    members: [{ _id: user1.insertedId }, { _id: user2.insertedId }, { _id: test9.insertedId }],
    photo: defaultGroupPicture,
    admins: [{_id: user1.insertedId}],
  });

  // Create Messages in Group
  const groupMessage1 = await messages.insertOne({
    content: 'Hey everyone!',
    authorId: user1.insertedId,
    groupId: group.insertedId,
  });

  const groupMessage2 = await messages.insertOne({
    content: 'Hello John!',
    authorId: user2.insertedId,
    groupId: group.insertedId,
  });

  // Create Direct Message Chat
  const directMessageChat = await groups.insertOne({
    directMsg: true,
    members: [{ _id: user2.insertedId }, { _id: test9.insertedId }],
    photo: defaultPicture,
  });

  // Create Direct Messages
  const directMessage1 = await messages.insertOne({
    content: 'Hey Jane, how are you?',
    authorId: test9.insertedId,
    groupId: directMessageChat.insertedId,
  });

  const directMessage2 = await messages.insertOne({
    content: 'I am good, how about you?',
    authorId: user2.insertedId,
    groupId: directMessageChat.insertedId,
  });

  // Create Direct Message Chat
  const directMessageChat2 = await groups.insertOne({
      directMsg: true,
      members: [{ _id: test9.insertedId }, { _id: user1.insertedId }],
  });

  // Create Direct Messages
  const directMessage3 = await messages.insertOne({
    content: 'Hello Tom, how are you?',
    authorId: test9.insertedId,
    groupId: directMessageChat2.insertedId,
  });

  const directMessage4 = await messages.insertOne({
      content: 'I am doing well thanks.',
      authorId: user1.insertedId,
      groupId: directMessageChat2.insertedId,
  });

  // Create new Group Chat with an extra member
  const groupChat2 = await groups.insertOne({
      directMsg: false,
      members: [{ _id: user1.insertedId }, { _id: user2.insertedId }, { _id: test9.insertedId }, { _id: user4.insertedId }],
      photo: defaultGroupPicture,
      admins: [{ _id: test9.insertedId }]
  });

  // Create Direct Message Chat
  const groupChat2Message1 = await messages.insertOne({
    content: 'This is the unnamed Group chat.',
    authorId: user4.insertedId,
    groupId: groupChat2.insertedId,
  });

  // Add contacts for user 9
  const contactsForUser9 = await users.findOneAndUpdate(
    { _id: test9.insertedId },
    { $addToSet:  { "contacts": {$each: [{ _id: user1.insertedId }, { _id: user2.insertedId }, { _id: user4.insertedId}]} }}, // Add users to test9's contact list
    { returnDocument: 'after'},
);

  console.log('Fake data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await client().close()
  });
