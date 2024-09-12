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
                    chat.name = otherMembers.slice(0, otherMembers.length - 1).join(', ') + ' & ' + otherMembers.slice(otherMembers.length - 1);
                    chat.photo = "https://res.cloudinary.com/dmaq0peyx/image/upload/v1725813381/o3aadn8b9aww4wuzethd.svg";
                }
            }
        })

        // Merging and sorting by `updatedAt`
        // const userMessages = mergeSort(groupChats, directMessageChats);

        console.log(JSON.stringify(userMessages, null, 2))
        res.json(userMessages);
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error'); // Handle errors properly
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

module.exports = {getMessages};