const { db, connectDB } = require('../../configuration/mongoDB');
const messagesController  = require('../../controllers/messagesController');
const userController = require('../../controllers/userController');
const groupController = require('../../controllers/groupController');
const {ObjectId} = require('mongodb');

// Declare variables at the top level for use across all tests
let user;
let Jamiee;
let Ralphie;
let group;

describe("Message tests", () => {
    // Set up test environment before running any tests
    beforeAll(async () => {
        // Connect to MongoDB test database
        await connectDB();

        // Mock response object for user creation
        const resUser = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(), // Allows chaining like res.status().json()
            error: jest.fn()
        }

        // Try to create a test user, or fetch if already exists
        user = await userController.createUser({body: {username: 'testuser', password: '123'}}, resUser);
    
        // If status is 409 (conflict), the user already exists, so fetch from DB instead
        if (resUser.status(409)) {
            user = await db().collection('users').findOne({username: 'testuser'});
            expect(user).toMatchObject({username:'testuser'})
        } else {
            // New user was created, verify from mock response
            expect(resUser.json.mock.calls[0].user).toMatchObject({username: 'testuser'})
        }
    
        // Fetch two pre-existing users for group creation
        Jamiee = await db().collection('users').findOne({username: 'Jamiee'});
        expect(Jamiee).toMatchObject({username:'Jamiee'})
    
        Ralphie = await db().collection('users').findOne({username: 'Ralphie'});
        expect(Ralphie).toMatchObject({username:'Ralphie'})
    
        // Convert MongoDB ObjectIds to string IDs for consistent testing
        user.id = user._id.toString();
        Jamiee.id = Jamiee._id.toString();
        Ralphie.id = Ralphie._id.toString();

        // Mock response object for group creation
        const resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            error: jest.fn(),
        }

        // Create a test group with the three users
        // Note: JSON.stringify is used to simulate FormData field constraints
        await groupController.createGroup({body: {members: JSON.stringify([user, Jamiee, Ralphie])}}, resGroup);

        // Extract the created/found group from the mock response
        group = resGroup.json.mock.calls[0][0].formattedGroup;
        // Convert string ID back to ObjectId for MongoDB queries
        group._id = ObjectId.createFromHexString(group.id);
    })

    // Test message creation functionality
    it("Should create a user message", async () => {
        // Mock response object for message creation
        const resMessage = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn(),
        }

        // Mock Socket.io for real-time updates
        const io = {
            emit: jest.fn()
        }

        // Verify message collection is empty before test
        const initialMessageRequest = await db().collection('messages').find({}).toArray();
        expect(initialMessageRequest.length).toEqual(0);

        // Create a test message
        await messagesController.createMessage(
            {body: {content: 'Hello there', groupId: group.id, authorId: user.id }}, 
            resMessage, 
            null, // next middleware function (not used)
            io
        );

        // Verify response status is 201 (Created)
        expect(resMessage).not.toBeNull();
        expect(resMessage.status.mock.calls[0][0]).toEqual(201);

        // Verify message was actually saved to database
        const finalMessageRequest = await db().collection('messages').find({}).toArray();
        expect(finalMessageRequest.length).toEqual(1);
        expect(finalMessageRequest[0]).toMatchObject({content: 'Hello there', groupId: group._id, authorId: user._id});
    })

    // Test message retrieval functionality
    it("Should be able to find the message", async () => {
        // Mock response object for group/message retrieval
        const resGroup = {
            json: jest.fn(),
            error: jest.fn(),
            status: jest.fn().mockReturnThis()
        }

        // Mock Socket.io
        const io = {
            emit: jest.fn()
        }

        // Find the message created in previous test
        const message = await db().collection('messages').find({}).toArray()
        expect(message).not.toBeNull();
        expect(message[0]).toMatchObject(
            {content: 'Hello there', groupId: group._id, authorId: user._id}, 
            resGroup, 
            null, 
            io
        );

        // Test the getGroupsWithMessagesAndUsers controller function
        // This aggregates messages with their respective groups and users
        await messagesController.getGroupsWithMessagesAndUsers(
            {params: {userId: user.id}}, 
            resGroup, 
            null, 
            io
        );

        // Verify group ID in response
        expect(resGroup).not.toBeNull();
        expect(resGroup.json.mock.calls[0][0][0]).toMatchObject({id: group.id});
        
        // Verify all group members are included in response
        expect(resGroup.json.mock.calls[0][0][0]).toMatchObject({
            members: expect.arrayContaining([
              expect.objectContaining({ id: user.id }),
              expect.objectContaining({ id: Jamiee.id }),
              expect.objectContaining({ id: Ralphie.id })
            ])
        });

        // Verify the message is included in the group's messages array
        expect(resGroup.json.mock.calls[0][0][0]).toMatchObject({
            messages: expect.arrayContaining([
                expect.objectContaining({content: 'Hello there', groupId: group.id, authorId: user.id })
            ])
        });
    })

    // Test message update functionality
    it("Should update the message content", async () => {
        // Mock response object for message update
        const resMessage = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn()
        }

        // Mock Socket.io
        const io = {
            emit: jest.fn()
        }

        // Find the message to update
        const originalMessage = await db().collection('messages').findOne({
            content: 'Hello there',
            groupId: group._id,
            authorId: user._id
        })

        // Verify original message exists
        expect(originalMessage).not.toBeNull();
        expect(originalMessage).toMatchObject({content: 'Hello there', groupId: group._id, authorId: user._id});

        // Update the message content
        await messagesController.updateMessage(
            {
                params: {messageId: originalMessage._id.toString()}, 
                body: {content: 'This is the updated message'}
            }, 
            resMessage, 
            null, 
            io
        );

        // Verify update response status is 200 (OK)
        expect(resMessage.status.mock.calls[0][0]).toEqual(200);

        // Find the updated message in the database
        const updatedMessage = await db().collection('messages').findOne({
            content: 'This is the updated message',
            groupId: group._id,
            authorId: user._id
        })

        // Verify message was updated in the database
        expect(updatedMessage).not.toBeNull();
        expect(updatedMessage).toMatchObject(
            {content: 'This is the updated message', groupId: group._id, authorId: user._id}, 
            resMessage, 
            null, 
            io
        );
    })

    // Test message deletion functionality
    it("Should delete the specified message", async () => {
        // Mock response object for message deletion
        const resMessage = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn()
        }

        // Mock Socket.io
        const io = {
            emit: jest.fn()
        }

        // Find the message to delete
        const messageBeforeDeletion = await db().collection('messages').findOne({
            content: 'This is the updated message',
            groupId: group._id,
            authorId: user._id
        });

        // Verify message exists before deletion
        expect(messageBeforeDeletion).not.toBeNull();
        expect(messageBeforeDeletion).toMatchObject({content: 'This is the updated message', groupId: group._id, authorId: user._id})

        // Delete the message
        await messagesController.deleteMessage(
            {params: {messageId: messageBeforeDeletion._id.toString()}}, 
            resMessage, 
            null, 
            io
        );

        // Verify deletion response status is 200 (OK)
        expect(resMessage.status.mock.calls[0][0]).toEqual(200);

        // Verify message no longer exists in database
        const messageAfterDeletion = await db().collection('messages').findOne({
            content: 'This is the updated message',
            groupId: group._id,
            authorId: user._id
        });
        expect(messageAfterDeletion).toBeNull();
    })

    // Clean up after all tests are complete
    afterAll(async () => {
        // Close MongoDB connection
        await db().client.close();
    })
});