const { connectDB, db } = require('../../configuration/mongoDB');
const groupController = require('../../controllers/groupController');
const userController = require('../../controllers/userController');

let user;
let Jamiee;
let Ralphie;

resUser = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    error: jest.fn(),
}

/*        
    console.log('Status called with: ', resUser.status.mock.calls);
    console.log('JSON called with:', resUser.json.mock.calls);
    if (resUser.error.mock.calls) console.log("Error:", resUser.error.mock.calls);
*/

describe('Group tests', () => {
    beforeAll( async () => {
        await connectDB();

        // Create/fetch users to make groups
        user = await userController.createUser({body: {username: 'testuser', password: '123'}}, resUser);
    
        if (resUser.status(409)) {
            user = await db().collection('users').findOne({username: 'testuser'});
            expect(user).toMatchObject({username:'testuser'})
        } else {
            expect(resUser.json.mock.calls[0].user).toMatchObject({username: 'testuser'})
        }
    
    
        Jamiee = await db().collection('users').findOne({username: 'Jamiee'});
        expect(Jamiee).toMatchObject({username:'Jamiee'})
    
        Ralphie = await db().collection('users').findOne({username: 'Ralphie'});
        expect(Ralphie).toMatchObject({username:'Ralphie'})
    
        // Convert object id's to string ids
        user.id = user._id.toString();
        Jamiee.id = Jamiee._id.toString();
        Ralphie.id = Ralphie._id.toString();
    })

    it("Should create a new group", async () => {

        resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            error: jest.fn(),
        }

        // JSON.stringify is used to attach the members array to the FormData field as FormData only accepts simple string values for each field
        await groupController.createGroup({body: {members: JSON.stringify([user, Jamiee, Ralphie])}}, resGroup);
        
        // Assign responseData based on if the group is created or already existing
        const responseData = resGroup.json.mock.calls[0][0].formattedGroup;
    
        expect(responseData.members).not.toBeNull();
        expect(responseData.members.length).toEqual(3);

        const memberIds = responseData.members.map(member => member.id);
        expect(memberIds).toContain(user.id);
        expect(memberIds).toContain(Ralphie.id);
        expect(memberIds).toContain(Jamiee.id);
    })

    it("Should create a new direct message group", async () => {
        resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            error: jest.fn(),
        }

        // JSON.stringify is used to attach the members array to the FormData field as FormData only accepts simple string values for each field
        await groupController.createDirectMessage({body: {members: [Jamiee, Ralphie]}}, resGroup);
        
        // Assign responseData based on if the group is created or already existing
        const responseData = resGroup.json.mock.calls[0][0].formattedGroup;
    
        expect(responseData.members).not.toBeNull();
        expect(responseData.members.length).toEqual(2);

        const memberIds = responseData.members.map(member => member.id);
        expect(memberIds).toContain(Ralphie.id);
        expect(memberIds).toContain(Jamiee.id); 
    })

    it("Should find the created group chat", async() => {
        resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn()
        }

        const foundGroup = await db().collection('groups').findOne({
            $expr : {
                $gt: [ { $size: "$members" }, 2]
            }
        })

        expect(foundGroup).not.toBeNull();

        const groupId = foundGroup._id.toString();

        await groupController.getGroup({params: {groupId}}, resGroup);

        expect(resGroup.status.mock.calls[0][0]).toEqual(200);
        expect(resGroup.json.mock.calls[0][0]).toMatchObject({name: 'testuser, Jamiee & Ralphie'});
    })

    it("Should update the specified group", async () => {
        resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn(),
        }

        // Find group to test name before update request to group name
        const originalGroup = await db().collection('groups').findOne({
            $expr: {
                $gt: [ {$size: "$members"}, 2 ]
            }
        })

        expect(originalGroup).not.toBeNull();
        expect(originalGroup).toMatchObject({name: 'testuser, Jamiee & Ralphie'});

        // Converted group.id to string to match front end implementation
        const groupId = originalGroup._id.toString();

        // Update the group name and test to confirm success
        await groupController.updateGroup({params: {groupId}, body: {name: 'Updated group'}}, resGroup);

        expect(resGroup).not.toBeNull();
        expect(resGroup.json.mock.calls[0][0]).toMatchObject({name: 'Updated group'});
    })

    it("Should delete the specified group", async () => {
        resGroup = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            error: jest.fn(),
        }

        // Should only be one group, therefore can filter groups collection by searching for members > 2 
        const group = await db().collection('groups').findOne({
            $expr: { 
                $gt: [{ $size: "$members" }, 2] 
            }
        })

        expect(group).not.toBeNull();

        // Converted group.id to string to match front end implementation
        const groupId = group._id.toString();

        // user.id it the provided headers information as the user was the creator (and therefore admin of the group in "Should create group").
        await groupController.deleteGroup(
            {params: {groupId}, headers:{'user-id': user.id}},
            resGroup
        );

        expect(resGroup.status.mock.calls[0][0]).toEqual(200)
    })

    afterAll(async () => {
        await db().client.close();
    })
})