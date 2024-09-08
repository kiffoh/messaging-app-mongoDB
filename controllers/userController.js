const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require('bcrypt')
const passport = require('passport');
const jwt = require('jsonwebtoken');

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
        console.log(user)
        res.status(201).json(user);
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

        // Authenticate user
        const token = jwt.sign(
            {id: user.id, username:user.username},
            process.env.secret_key,
            {expiresIn: '1hr'}
        )

        console.log('Backend token: ',token)
    
        // Send the token to the client
        return res.status(200).json({ token, message: 'Login successful' });
    })(req, res, next);
}

module.exports = {
    createUser,
    logIn
}