const userController = require('../../controllers/userController');
const bcrypt = require('bcrypt')
const {connectDB, db} = require('../../configuration/mongoDB');
const passport = require('passport');

const res = {
    json: jest.fn(), // Mock response.json() method
    status: jest.fn().mockReturnThis(), // Mock status() to return res
    send: jest.fn(),
    error: jest.fn(),
};

// ONLY CREATING TESTS FOR THE FUNCTIONS WHICH ARE BEING ADAPTED TO MONGODB

/*
    // CONSOLE.LOGS TO HELP WITH DEBUGGING 
    console.log('Status called with: ', updateRes.status.mock.calls);
    console.log('JSON called with:', updateRes.json.mock.calls);
    if (res.error.mock.calls) console.log("Error:", updateRes.error.mock.calls);
*/

describe("User tests", () => {
    beforeAll(async () => {
        await connectDB();
    })
    
    it("Should create a new user", async () => {
        await userController.createUser({body: {username:'testuser', password:'123'}}, res);

        const user = await db().collection('users').findOne({
            username: 'testuser'
        });
        
        expect(user).not.toBeNull();
        expect(user).toMatchObject({username:'testuser'});
        
        const passwordMatches = await bcrypt.compare('123', user.password);
        expect(passwordMatches).toBe(true);
    })
    
    it("Should find the specified user", async () => {
        const user = await db().collection('users').findOne({
            username: 'testuser'
        })
        
        expect(user).not.toBeNull();
        expect(user).toMatchObject({username:'testuser'})
        
        user._id = user._id.toString();
        
        await userController.getUser({params: {userId:user._id}}, res);

        /*
        console.log('Status called with: ', res.status.mock.calls);
        console.log('JSON called with:', res.json.mock.calls);
        if (res.error.mock.calls) console.log("Error:", res.error.mock.calls);
        */

        expect(res.json.mock.calls).not.toBeNull();
        expect(res.json.mock.calls[1][0]).toMatchObject({contacts: []})
    })

    it("Should update the user's contacts", async () => {
        const user = await db().collection('users').findOne({username: 'testuser'});

        expect(user).toMatchObject({username:'testuser'})

        user.id = user._id.toString();

        const res1 = {
            json: jest.fn(), // Mock response.json() method
            status: jest.fn().mockReturnThis(), // Mock status() to return res
            send: jest.fn(),
        };

        const res2 = {
            json: jest.fn(), // Mock response.json() method
            status: jest.fn().mockReturnThis(), // Mock status() to return res
            send: jest.fn(),
        };


        // Find/create the other contacts
        const contactIds = [];

        let contact1 = await db().collection('users').findOne({username: 'Jamiee'});
        if (!contact1) {
            await userController.createUser({body: {username: 'Jamiee', password: '123'}}, res1);
            contact1 = res1.json.mock.calls[0][0].user;
            // ID should already be a string from createUser function
            contactIds.push(contact1.id);
        } else {
            contactIds.push(contact1._id.toString());
        }

        let contact2 = await db().collection('users').findOne({username: 'Ralphie'});
        if (!contact2) {
            await userController.createUser({body: {username: 'Ralphie', password: '123'}}, res2);
            contact2 = res1.json.mock.calls[0][0].user;
            // ID should already be a string from createUser function
            contactIds.push(contact2.id);
        } else {
            contactIds.push(contact2._id.toString());
        }

        // Set up the response for updateUserContacts
        const updateRes = {
            json: jest.fn(), 
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            error: jest.fn()
        };

        await userController.updateUserContacts({params: {userId: user.id}, body: {selectedContacts : contactIds}}, updateRes);        

        expect(updateRes.status).toHaveBeenCalledWith(200);

        const updatedUser = await db().collection('users').findOne({username: 'testuser'});

        const userContactIds = updatedUser.contacts.map(id => id.toString());
        
        expect(userContactIds).toContain(contactIds[0]);
        expect(userContactIds).toContain(contactIds[1]);
    })

    it("Should find the specified user with the updated contacts", async () => {
        const user = await db().collection('users').findOne({
            username: 'testuser'
        })
        
        expect(user).not.toBeNull();
        expect(user).toMatchObject({username:'testuser'})
        
        user._id = user._id.toString();
        
        const result = await userController.getUser({params: {userId:user._id}}, res);

        // Be default, contact array only contains userIds. Can assume if the username is correct than the rest of the information is correct
        const contactUsernames = res.json.mock.calls[2][0].contacts.map(contact => contact.username);

        expect(contactUsernames).not.toBeNull();
        expect(contactUsernames).toContain('Jamiee');
        expect(contactUsernames).toContain('Ralphie');
    })

    it("Should update the bio of the specified user", async () => {
        const res = {
            json: jest.fn(), // Mock response.json() method
            status: jest.fn().mockReturnThis(), // Mock status() to return res
            send: jest.fn(),
            error: jest.fn(),
        };

        const user = await db().collection('users').findOne({username: 'testuser'});

        expect(user).not.toBeNull();
        expect(user).toMatchObject({username:'testuser'})

        user.id = user._id.toString();
        await userController.updateUser({params: {userId: user.id}, body: {bio: 'I am an updated bio.'}}, res);

        expect(res.json.mock.calls[0][0]).toMatchObject({bio: 'I am an updated bio.'});
    })

    it("Should fetch usernames of all users", async () => {

        await userController.getAllUsernames({}, res);

        expect(res.json).toHaveBeenCalledWith([
            { username: 'Jamiee', photo: expect.any(String), id: expect.any(String) },
            { username: 'Ralphie', photo: expect.any(String), id: expect.any(String) },
            { username: 'testuser', photo: expect.any(String), id: expect.any(String) },
        ]);        
    })
    
    it("Should delete the specified user", async () => {
        const user = await db().collection('users').findOne({
            username: 'testuser'
        });

        expect(user).not.toBeNull();
        expect(user).toMatchObject({username:'testuser'});

        user._id = user._id.toString();
        
        const result = await userController.deleteUser({params: { userId : user._id}}, res);

        const deletedUser = await db().collection('users').findOne({
            username: 'testuser'
        });

        expect(deletedUser).toBeNull();
    })
    afterAll(async () => {
        await db().client.close();
    })
})