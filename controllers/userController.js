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
    const {username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
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
            { id: user.id, username: user.username, bio: user.bio, createdAtDate: formattedDateTime.date, createdAtTime: formattedDateTime.time, userPhoto: user.photo },
            process.env.SECRET_KEY, // Use your secret key from environment variables
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(201).json({ user, token }); // Return both user and token
    } catch (err) {
        console.log('Error creating user: ', err)
        if (err.code === 'P2002') {
            // Unique constraint violation
            res.status(409).json({ error: 'Username already in use. Please try again with a different username' });
        } else {
            // General server error
            res.status(500).json({ error: 'An error occurred when trying to create the user.' });
        }
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
            { id: user.id, username: user.username, bio: user.bio, createdAtDate: formattedDateTime.date, createdAtTime: formattedDateTime.time, userPhoto: user.photo },
            process.env.SECRET_KEY,
            {expiresIn: '1hr'}
        )
    
        // Send the token to the client
        return res.status(200).json({ token, message: 'Login successful' });
    })(req, res, next);
}

module.exports = {
    createUser,
    logIn
}