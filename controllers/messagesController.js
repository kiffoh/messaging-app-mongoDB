const { ObjectId } = require("mongodb");
const { db } = require('../configuration/mongoDB');
const { ResultWithContextImpl } = require("express-validator/lib/chain");

async function getGroupsWithMessagesAndUsers(req, res, next, io) {
    const {userId} = req.params;

    try {
        // Format userId into object format to interact with mongoDB
        const userObjectID = ObjectId.createFromHexString(userId);

        // Aggregation underneath is trying to get all messages from all groups the user is in.
        
        // Fetch all groups that user is in
        // Fetch member information for each group.
        // Fetch message information for each group. Sort messages by my most recent first
        // Sort groups by last updated at the start

        // If I were to optimise this for a large dataset: Put limits on the amount of messages recieved for each group
        // Trigger a seperate request for the remainder of the messages when the user wants to see more 
        // (e.g. when the user is at the top of the message chain)

        const userGroupMessagesAndUsers = await db().collection('groups').aggregate([
            {
                $match: {
                    members: {
                        // $in acts as a boolean in the filter e.g. if userObjectID in members array return True
                        $in: [userObjectID]
                    }
                }
            },
            
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: '_id',
                    as: 'memberDetails'
                }              
            },
            
            {
                $lookup: {
                    from: 'messages',
                    localField: '_id',
                    foreignField: 'groupId',
                    as: 'messages',
                    pipeline: [
                        {$sort: {"createdAt": -1} }
                    ]
                }  
            },

            // Adds a field that represents the lastMessageDate for sorting the groups

            // Copies memberDetails to members
            // memberDetais variable to be called members to align with frontEnd naming
            {
                $addFields: {
                    lastMessageDate: {
                        $ifNull: [
                            { $max: "$messages.createdAt"},
                            "$updatedAt"
                        ]
                    },
                    
                    members: "$memberDetails"
                }
            },

            {
                $sort: {"lastMessageDate": -1}
            },

            {
                $project: {
                    // Remove memberDetails
                    memberDetails:0
                }
            }

        ]).toArray();

        // Coverts each objectID to a stringID for frontEnd compatability
        userGroupMessagesAndUsers.forEach(group => {
            group.id = group._id.toString();
            delete group._id;
            
            group.members.forEach(member => {
                member.id = member._id.toString();
                delete member._id;
            })

            group.messages.forEach(message => {
                message.id = message._id.toString();
                delete message._id;

                message.groupId = message.groupId.toString();
                message.authorId = message.authorId.toString();
            })
        })


        // Name the unnamed groups/direct messages, specific to the user
        // e.g. In a direct message chat, the chat is names the reciepent's (non user) username
        userGroupMessagesAndUsers.forEach(chat => {
            if (chat.name === null) {
                if (chat.members.length  <= 2) {
                    const receipient = chat.members.find(member => member.id !== userId);
                    chat.name = receipient.username;
                    chat.photo = receipient.photo;
                } else {
                    const otherMembers = chat.members.filter(member => member.id !== userId);
                    const otherMembersUsernames = otherMembers.map(member => member.username);
                    chat.name = otherMembersUsernames.slice(0, otherMembersUsernames.length - 1).join(', ') + ' & ' + otherMembersUsernames.slice(otherMembersUsernames.length - 1);
                }
            }
            if (chat.photo === null && chat.members.length === 2) chat.photo = process.env.DEFAULT_PICTURE;
            else if (chat.photo === null) chat.photo = process.env.DEFAULT_GROUP_PICTURE
        })

        // Merging and sorting by `updatedAt`
        // const userMessages = mergeSort(groupChats, directMessageChats);
        res.json(userGroupMessagesAndUsers);
    } catch (err) {
        console.log(err);
        res.status(500).json({message:'Internal Server Error'}); // Handle errors properly
    }
}

async function createMessage(req, res, next, io) {
    const {content, groupId, authorId} = req.body;
    const photoUrl = req.file ? req.file.path : null;

    try {
        const groupObjectID = ObjectId.createFromHexString(groupId);
        const authorObjectID = ObjectId.createFromHexString(authorId);

        const currentTime = new Date();

        const result = await db().collection('messages').insertOne({
            content,
            photoUrl,
            createdAt: currentTime,
            updatedAt: currentTime,
            groupId: groupObjectID,
            authorId: authorObjectID
        })

        const newMessage = {
            id: result.insertedId.toString(),
            content,
            photoUrl,
            createdAt: currentTime,
            updatedAt: currentTime,
            groupId: groupObjectID,
            authorId: authorObjectID
        };

        // Emit the newMessage event to all connected clients
        io.emit('newMessage', newMessage);

        res.status(201).json(newMessage)
    } catch (err) {
        console.log('Error creating message: ', err);
        res.status(500).json({message:'Internal Server Error'});
    }
}

function mergeSort(arr1, arr2) {
    if (arr1.length === 0 ) return arr2;
    if (arr2.length === 0) return arr1;

    const res = []
    let p1 = 0;
    let p2 = 0;

    while (p1 < arr1.length && p2 < arr2.length) {
        if (arr1[p1].updatedAt > arr2[p2].updatedAt) {
            res.push(arr1[p1])
            p1++;
        } else {
            res.push(arr2[p2])
            p2++;
        }
    }
    
    // Add any remaining elements
    if (p1 < arr1.length) res.push(...arr1.slice(p1))
    if (p2 < arr2.length) res.push(...arr2.slice(p2))

    return res;
}

async function updateMessage(req, res, next, io) {
    const {content} = req.body;
    const {messageId} = req.params;
    
    try {
        const messageObjectId = ObjectId.createFromHexString(messageId);

        const updatedMessage = await db().collection('messages').findOneAndUpdate(
            { _id: messageObjectId },
            { $set: {content} },
            { returnDocument: 'after'}
        )

        updatedMessage.id = updatedMessage._id.toString();
        delete updatedMessage._id;

        // Emit the messageUpdated event
        io.emit('messageUpdated', updatedMessage);

        res.status(200).json(updatedMessage);

    } catch (error) {
        console.error("Error updating message:", error);
        res.status(500).json({ error: 'An error occurred while updating the message.' });
    }
}


async function deleteMessage(req, res, next, io) {
    const {messageId} = req.params;

    try {
        const messageObjectId = ObjectId.createFromHexString(messageId);

        const message = await db().collection('messages').findOne({ _id: messageObjectId });
        if (!message) return res.status(404).json({ message: 'Message not found.' });

        // Delete the message
        await db().collection('messages').deleteOne({
            _id: messageObjectId
        })

        // Emit the messageDeleted event
        io.emit('messageDeleted', messageObjectId);

        return res.status(200).json({ message: 'Message successfully deleted.' });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({message: 'An unknown error occurred when trying to delete the message.'})
    }
}


module.exports = {
    getGroupsWithMessagesAndUsers,
    createMessage,
    updateMessage,
    deleteMessage
};