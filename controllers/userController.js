const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')
const passport = require('passport');
const jwt = require('jsonwebtoken');

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

async function createUser(req, res) {
    try {
        const {username, password} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword
            }
        })
        
        // Edit createdAt to desired format
        const formattedDateTime = formatDateTime(user.createdAt);
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                bio: user.bio, 
                createdAtDate: formattedDateTime.date, 
                createdAtTime: formattedDateTime.time, 
                photo: user.photo 
            },
            process.env.SECRET_KEY, // Use your secret key from environment variables
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        return res.status(201).json({ user, token }); // Return both user and token
    } catch (error) {
        // Handle specific error cases
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                status: 'error',
                message: 'Username already in use. Please try again with a different username' 
            });
        }
        
        // Handle bcrypt errors
        if (error.name === 'HashError') {
            return res.status(500).json({ 
                status: 'error',
                message: 'Error processing password' 
            });
        }

        // General error case
        return res.status(500).json({ 
            status: 'error',
            message: 'An error occurred when trying to create the user' 
        });
    }
}

function logIn(req, res, next) {
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);  // Log authentication errors
            return next(err);
        }

        if (!user) {
            return res.status(400).json({message: 'Invalid username or password.'})
        }

        // Edit createdAt to desired format
        const formattedDateTime = formatDateTime(user.createdAt);

        // Authenticate user
        const token = jwt.sign(
            { id: user.id, username: user.username, bio: user.bio, createdAtDate: formattedDateTime.date, createdAtTime: formattedDateTime.time, photo: user.photo },
            process.env.SECRET_KEY,
            {expiresIn: '1hr'}
        )
    
        // Send the token to the client
        return res.status(200).json({ token, message: 'Login successful' });
    })(req, res, next);
}

async function getUser(req, res) {
    const {userId} = req.params;
    const userID = parseInt(userId)

    if (isNaN(userID)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userID
            },
            include: {
                contacts: true
            }
        })

        if (!user) return res.status(404).json({message: 'User not found.'})

         // Format createdAt to desired format
         const formattedDateTime = formatDateTime(user.createdAt);

         // Create a new user object with formatted date and time
         const newUser = {
             ...user,
             createdAtDate: formattedDateTime.date,
             createdAtTime: formattedDateTime.time
         };
         return res.json(newUser); 
    } catch (err) {
        return res.status(500).json({message: 'An unknown error occurred when trying to getUser data.'})
    }
}

async function getAllUsernames(req, res) {
    try {
        const users = await prisma.user.findMany({
            select: {
                username: true,
                id: true,
                photo: true
            }
        });

        if (users.length === 0) return res.status(404).json({message: 'No users found.'})

        // Only need in development
        const updatedUsers = users.map(user => {
            return {
                ...user,
                photo: user.photo || process.env.DEFAULT_PICTURE
            }
        })

        return res.json(updatedUsers)
    } catch (err) {
        return res.status(500).json({message: 'An unknown error occurred when trying to getAllUsernames.'})
    }
}

async function updateUser(req, res) {
    const {userId} = req.params;
    const {username, bio} = req.body;
    const photo = req.file.path;

    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                username,
                photo,
                bio
            },
            include: {
                contacts: true
            }
        })

        // Format createdAt to desired format
        const formattedDateTime = formatDateTime(updatedUser.createdAt);

        // Create a new user object with formatted date and time
        const updatedUserFormatted = {
            ...updatedUser,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time
        };

        res.status(200).json(updatedUserFormatted);

    } catch (error) {
        console.error("Error updating user profile:", error);
        
        // Handle specific error cases
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                status: 'error',
                message: 'Username already in use. Please try again with a different username' 
            });
        }

        // General error case
        return res.status(500).json({ 
            status: 'error',
            message: 'An error occurred when trying to create the user' 
        });
    }
}

async function updateUserContacts(req, res) {
    const {userId} = req.params;
    const {selectedContacts} = req.body;

    try {
        const updatedUser =  await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                contacts: {
                    connect: selectedContacts.map(contactId => ({id: contactId}))
                }
            },
            include: {
                contacts: true,
                contactedBy: true
            }
        })

        // Format createdAt to desired format
        const formattedDateTime = formatDateTime(updatedUser.createdAt);

        // Create a new user object with formatted date and time
        const updatedUserFormatted = {
            ...updatedUser,
            createdAtDate: formattedDateTime.date,
            createdAtTime: formattedDateTime.time
        };

        res.status(200).json(updatedUserFormatted);

    } catch (err) {
        console.log(err);
        return res.status(500).json({message: "An unknown error occurred when trying to update the user's contacts."})
    }
}

async function deleteUser(req, res) {
    const {userId} = req.params;
    const userID = parseInt(userId);

    try {
        const user = await prisma.user.findUnique({ where: { id: userID } });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Perform the delete
        await prisma.$transaction(async (prisma) => {
            // Delete related message receipts
            await prisma.messageReceipt.deleteMany({
              where: {
                message: {
                  authorId: userID,
                },
              },
            });
    
             // Delete the user
            await prisma.user.delete({
                where: {
                    id: userID
                }
            })
        })

        return res.status(200).json({ message: 'User successfully deleted.' });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({message: 'An unknown error occurred when trying to delete the user.'})
    }
}

module.exports = {
    createUser,
    logIn,
    getUser,
    getAllUsernames,
    updateUser,
    deleteUser,
    updateUserContacts
}