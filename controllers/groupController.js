const { db, client } = require('../configuration/mongoDB'); 
const { ObjectId, ReturnDocument } = require('mongodb');

function formatDateTime (isoString) {
    const date = new Date(isoString);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    const formattedDate = `${day}-${month}-${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return {
        date: formattedDate,
        time: formattedTime
    };
}

async function getGroup(req, res) {
    const {groupId} = req.params;
    
    try {
        // Format groupId to an object type for interactions with mongoDB 
        const groupObjectID = ObjectId.createFromHexString(groupId);

        const group = await db().collection('groups').findOne({
            _id: groupObjectID
        })

        // Check only allows for valid groups with 3+ members (by checking for if a group is a directMsg or not)
        if (!group || group.directMsg === true) return res.status(404).json({message: 'Group not found.'});

        // Fetch information about group members from their objectIds
        const groupMembers = await db().collection('users').find({
            _id: {$in: group.members}
        }).toArray();

        // Fetch information about group admins from their objectIds
        const groupAdmins = await db().collection('users').find({
            _id: {$in: group.admins}
        }).toArray();

        // Format group.id to a string (for front-end) and delete group._id to simplify front-end
        group.id = group._id.toString();
        delete group._id;

         // Format createdAt to desired format
         const formattedDateTime = formatDateTime(group.createdAt);

         // Create a new user object with formatted date and time
         const formattedGroup = {
            ...group,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time,
            members: groupMembers,
            admins: groupAdmins
         };

         // Name group if the group has no name. Link is only accessible for groups with (3+ members)
         if (formattedGroup.name === null) {
            const groupUsernames = []
            group.members.map(member => groupUsernames.push(member.username));
            formattedGroup.name = groupUsernames.slice(0, groupUsernames.length - 1).join(', ') + ' & ' + groupUsernames.slice(groupUsernames.length - 1);
         }

         return res.status(200).json(formattedGroup); 
    } catch (err) {
        console.log(err)
        return res.status(500).json({message: 'An unknown error occured when trying to getGroup data.'})
    }
}

async function createDirectMessage(req, res) {
    const { members } = req.body;
    const user = members[0];

    // Validate members array
    if (!members || members.length === 0) {
        return res.status(400).json({ message: 'Group must have at least one member.' });
    }

    const directMsg = true;

    try {
        // Convert member Id's to object's for mongoDB
        const membersObjectIds = members.map(member => ObjectId.createFromHexString(member.id));
        
        const existingGroup = await db().collection('groups').findOne({
            directMsg,
            members: { $all: membersObjectIds, $size: membersObjectIds.length }
        });

        if (existingGroup) {
            const groupMembers = await db().collection('users').find({
                _id: {$in: existingGroup.members}    
            }).toArray();
            
            groupMembers.map(member => {
                member.id = member._id.toString();
                delete member._id;
            })
            
            const messages = await db().collection('messages').find({
                groupId: existingGroup._id
            }).sort({createdAt: 1}).toArray(); 
            
            existingGroup.id = existingGroup._id.toString();
            delete existingGroup._id;
            
            const formattedGroup = {
                ...existingGroup,
                members: groupMembers,
                messages
            }
            
            personalisedGroupName(formattedGroup, user.id);

            return res.status(409).json({formattedGroup, message: 'Direct message group already exists.' });
        }

        const currentTime = new Date();

        // Create new group
        const createdGroup = await db().collection('groups').insertOne({
            createdAt: currentTime,
            updatedAt: currentTime,
            directMsg,
            members: membersObjectIds,
        });

        // Fetch the group with its related data (members and messages)
        const newGroup = await db().collection('groups').findOne(
            { _id: createdGroup.insertedId },
        );

        const groupMembers = await db().collection('users').find({
            _id: {$in: membersObjectIds}
        }).toArray();

        groupMembers.map(member => {
            member.id = member._id.toString();
            delete member._id;
        })

        // Respond with the created group
        newGroup.id = newGroup._id.toString();
        delete newGroup._id;
        
        const formattedGroup = {
            ...newGroup,
            messages: [],
            members: groupMembers
        }

        personalisedGroupName(formattedGroup, user.id);

        res.status(201).json({ formattedGroup });

    } catch (err) {
        // Log and respond with detailed error
        console.error('Error creating group:', err);
        res.status(500).json({ 
            status: 'error',
            message: err.message || 'An unknown error occurred.'
        });
    }
}

async function createGroup(req, res) {
    const { members } = req.body;
    // JSON.stringify is used to attach the members array to the FormData field as FormData only accepts simple string values for each field
    const parsedMembers = JSON.parse(members); // Parse members once
    const groupCreator = parsedMembers[0] // First member is the user who created the group
    
    // Set the group name: use provided name or generate one
    const groupName = req.body.name || nameGroup(parsedMembers);
    const groupPhotoUrl = req.file ? req.file.path : process.env.DEFAULT_GROUP_PICTURE; // Multer will add file information here
    const directMsg = false;
    
    try {
        // Convert members into their object ids to search and insert into mongo appropriately 
        const membersObjectIds = parsedMembers.map(member => ObjectId.createFromHexString(member.id))
        const creatorObjectId = ObjectId.createFromHexString(groupCreator.id);

        // Search for exisiting group before inserting
        const existingGroup = await db().collection('groups').findOne({
            directMsg,
            name: groupName,
            members: { $all: membersObjectIds, $size: membersObjectIds.length}, // Means the members will match for an array with the exact matching members
        });

        if (existingGroup) {
            // Get member details
            const members = await db().collection('users').find({
                _id: {$in: existingGroup.members}    
            }).toArray();

            members.map(member => {
                member.id = member._id.toString();
                delete member._id;
            })

            // Get messages for the group
            // Sort messages by createdAt in case they have been updated since creation
            const messages = await db().collection('messages').find({
                groupId:existingGroup._id
            }).sort({createdAt: 1}).toArray();


            // Format the existing group for response
            const formattedGroup = {
                id: existingGroup._id.toString(),
                name: existingGroup.name,
                photo: existingGroup.photo,
                createdAt: existingGroup.createdAt,
                updatedAt: existingGroup.updatedAt,
                directMsg: existingGroup.directMsg,
                bio: existingGroup.bio,
                members,
                messages
            };

            return res.status(409).json({formattedGroup, message: 'Group chat already exists.' });
        }

        const currentTime = new Date();

        // Your group creation logic here
        const createdGroup = await db().collection('groups').insertOne({
            name: groupName,
            photo: groupPhotoUrl, // Save the Cloudinary URL for the group photo
            createdAt: currentTime,
            updatedAt: currentTime,
            directMsg: false,
            bio: "We are the greatest tribe on EasyMessage.",
            
            admins: [creatorObjectId],
            members: membersObjectIds,
        });

        const memberDetails = await db().collection('users').find({_id: {$in: membersObjectIds}}).toArray();

        memberDetails.map(member => {
            member.id = member._id.toString();
            delete member._id;
        })

        const formattedGroup = {
            id: createdGroup.insertedId.toString(),
            name: groupName,
            photo: groupPhotoUrl, // Save the Cloudinary URL for the group photo
            createdAt: currentTime,
            updatedAt: currentTime,
            directMsg: false,
            bio: "We are the greatest tribe on EasyMessage.",
            
            members: memberDetails,
            messages: []
        };

        res.status(201).json({ formattedGroup });
    } catch (err) {
        console.log(err)
        res.status(500).json({ 
            status: 'error',
            message: 'Error creating group',
            error: err.message
        });
    }
}

function nameGroup(members) {
    const groupUsernames = []
    members.map(member => groupUsernames.push(member.username));
    return groupUsernames.slice(0, groupUsernames.length - 1).join(', ') + ' & ' + groupUsernames.slice(groupUsernames.length - 1);
}

function personalisedGroupName(group, userID) {
    if (group.members.length  <= 2) {
        const recipient = group.members.find(member => member.id !== userID);
        group.name = recipient.username;
        group.photo = recipient.photo;
        console.log(group)
        console.log(recipient)
    } else {
        const otherMembers = group.members.filter(member => member.id !== userID);
        const otherMembersUsernames = []
        otherMembers.forEach(member => otherMembersUsernames.push(member.username))
        group.name = otherMembersUsernames.slice(0, otherMembersUsernames.length - 1).join(', ') + ' & ' + otherMembersUsernames.slice(otherMembersUsernames.length - 1);
    }
    if (group.photo === null) group.photo = process.env.DEFAULT_PICTURE;
}

async function updateGroup(req, res) {
    const {groupId} = req.params;
    const {name, bio} = req.body;
    const photo = req.file ? req.file.path : undefined;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (photo !== undefined) updateData.photo = photo;
    if (Object.keys(updateData).length >= 1) updateData.updatedAt = new Date();

    try {
        // Transform groupId into object format for interactions with mongoDB 
        const groupObjectID = ObjectId.createFromHexString(groupId);

        // findAndUpdate with { returnDocument: 'after' } removes the need for multiple db calls 
        const updatedGroup = await db().collection('groups').findOneAndUpdate(
            { _id: groupObjectID },
            { $set: updateData },
            { returnDocument: 'after'}
        )

        // Fetch information about group members from their objectIds
        const groupMembers = await db().collection('users').find({
            _id : {$in : updatedGroup.members}
        }).toArray();

        // Fetch information about group admins from their objectIds
        const groupAdmins = await db().collection('users').find({
            _id: { $in: updatedGroup.admins }
        }).toArray();

        // Format createdAt to desired format
        const formattedDateTime = formatDateTime(updatedGroup.createdAt);

        // Format group.id to a string (for front-end) and delete group._id to simplify front-end
        updatedGroup.id = updatedGroup._id.toString();
        delete updatedGroup._id;

        // Create a new user object with formatted date and time, and member and admin user information
        const updatedGroupFormatted = {
            ...updatedGroup,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time,
            members: groupMembers,
            admins: groupAdmins
        };

        res.status(200).json(updatedGroupFormatted);
    } catch (error) {
        console.log(err)
        res.status(500).json({ 
            status: 'error',
            message: 'Error updating group'
        });
    }
}

async function deleteGroup(req, res) {
    const {groupId} = req.params;
    const userId = req.headers['user-id'];

    try {
        // Transform string id's into object id's for mongoDB
        const groupObjectID = ObjectId.createFromHexString(groupId);
        const userObjectID = ObjectId.createFromHexString(userId);

        const group = await db().collection('groups').findOne({
            _id: groupObjectID
        })

        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // .equals() Compares the ID value rather than the object references 
        const userIsAdmin = group.admins.some(admin => admin.equals(userObjectID));

        if (userIsAdmin) {
            // Perform the delete with a transaction
            // Using transactions mean that all operations succeed or none do => database consistency
            // Need to start a session to perform a transaction approach
            const session = client().startSession();
            try {
                await session.withTransaction(async () => {
                    // Step 1: Delete related messages
                    await db().collection('messages').deleteMany({
                        groupId: groupObjectID
                    }, { session });
            
                    // Step 2: Delete the group itself
                    await db().collection('groups').deleteOne({
                        _id: groupObjectID
                    }, { session });
                })
            } finally {
                await session.endSession();
            }

            return res.status(200).json({ message: 'Group successfully deleted.' });

        } else {
            return res.status(403).json({ message: 'User does not have admin privileges to delete this group.' });
        }


    } catch (err) {
        console.error(err); // Log the error
        return res.status(500).json({message: 'An unknown error occurred when trying to delete the group.'})
    }
}


module.exports = {
    getGroup,
    createDirectMessage,
    createGroup,
    updateGroup,
    deleteGroup
}