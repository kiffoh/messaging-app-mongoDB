const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

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
    const groupID = parseInt(groupId)

    if (isNaN(groupID)) {
        return res.status(400).json({ message: 'Invalid group ID.' });
    }

    try {
        const group = await prisma.group.findUnique({
            where: {
                id: groupID
            },
            include: {
                members: true
            }
        })


        if (!group) return res.status(404).json({message: 'Group not found.'})

         // Format createdAt to desired format
         const formattedDateTime = formatDateTime(group.createdAt);

         // Create a new user object with formatted date and time
         const newGroup = {
             ...group,
             createdAtDate: formattedDateTime.date,
             createdAtTime: formattedDateTime.time
         };

         if (newGroup.name === null) {
            const groupUsernames = []
            group.members.map(member => groupUsernames.push(member.username));
            newGroup.name = groupUsernames.slice(0, groupUsernames.length - 1).join(', ') + ' & ' + groupUsernames.slice(groupUsernames.length - 1);
         }

         return res.json(newGroup); 
    } catch (err) {
        console.log(err)
        return res.status(500).json({message: 'An unknown error occured when trying to getGroup data.'})
    }
}

module.exports = {
    getGroup
}