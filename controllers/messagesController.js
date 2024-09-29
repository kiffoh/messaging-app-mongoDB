const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function getMessages(req, res) {
    const {userId} = req.params;
    const userID = parseInt(userId)

    try {
        const userMessages = await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        id: userID,
                    }
                }
            },
            include: {
                members: true,
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
            },
            orderBy: {
                updatedAt: 'desc',
            }
            
        })

        // Name the unnamed groups/direct messages, specific to the user
        userMessages.forEach(chat => {
            if (chat.name === null) {
                if (chat.members.length  <= 2) {
                    const receipient = chat.members.find(member => member.id !== userID);
                    chat.name = receipient.username;
                    chat.photo = receipient.photo;
                } else {
                    const otherMembers = chat.members.filter(member => member.id !== userID);
                    const otherMembersUsernames = []
                    otherMembers.forEach(member => otherMembersUsernames.push(member.username))
                    chat.name = otherMembersUsernames.slice(0, otherMembersUsernames.length - 1).join(', ') + ' & ' + otherMembersUsernames.slice(otherMembersUsernames.length - 1);
                }
            }
            if (chat.photo === null && chat.members.length === 2) chat.photo = process.env.DEFAULT_PICTURE;
            else if (chat.photo === null) chat.photo = process.env.DEFAULT_GROUP_PICTURE
        })

        // Merging and sorting by `updatedAt`
        // const userMessages = mergeSort(groupChats, directMessageChats);
        res.json(userMessages);
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error'); // Handle errors properly
    }
}

async function createMessage(req, res) {
    const {content, groupId, authorId} = req.body;

    try {
        const message = await prisma.message.create({
            data: {
                content,
                groupId,
                authorId
            }
        })

        res.status(201).json(message)
    } catch (err) {
        console.log('Error creating message: ', err);
        res.status(500).send('Internal Server Error');
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

async function updateMessage(req, res) {
    const {content} = req.body;
    const {chatId, messageId} = req.params;
    const messageID = parseInt(messageId);

    try {
        const updatedMessage = await prisma.message.update({
            where: {
                id: messageID
            },
            data: {
                content: content
            }
        })

        res.status(200).json(updatedMessage);

    } catch (error) {
        console.error("Error updating message:", error);
        res.status(500).json({ error: 'An error occurred while updating the message.' });
    }
}

async function deleteMessage(req, res) {
    const {chatId, messageId} = req.params;
    const messageID = parseInt(messageId);

    try {
        const message = await prisma.message.findUnique({ where: { id: messageID } });
        if (!message) return res.status(404).json({ message: 'User not found.' });

        // Perform the delete
        await prisma.$transaction(async (prisma) => {
            // Delete related message receipts
            await prisma.messageReceipt.deleteMany({
              where: {
                message: {
                  id: messageID,
                },
              },
            });
    
             // Delete the user
            await prisma.message.delete({
                where: {
                    id: messageID
                }
            })
        })

        return res.status(200).json({ message: 'Message successfully deleted.' });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({message: 'An unknown error occurred when trying to delete the message.'})
    }
}

module.exports = {
    getMessages,
    createMessage,
    updateMessage,
    deleteMessage
};