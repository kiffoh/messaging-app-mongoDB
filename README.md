# **EasyMessage - Messaging App (Backend)**

**EasyMessage** is a web application for direct and group messaging, inspired by WhatsApp. This project is one of the penultimate project in the Odin Project[https://www.theodinproject.com/lessons/nodejs-messaging-app], and as part of the learning process, I have reinforced my knowledge on authentification, media-sharing whilst developing knowledge for real time server-client updates.


The backend is built using Node.js and utilises the Prisma ORM for database management. It is responsible for handling requests from the frontend (RESTful API), setting up and maintaining the database, and managing WebSocket connections for real-time messaging.

### Core Features

- 🔐 **Secure Authentication**: JWT-based user authentication
- 💬 **Real-time Messaging**: Instant message delivery using WebSocket
- 👥 **Group Chats**: Support for multiple users in conversations
- 📸 **Media Sharing**: Image upload and sharing capabilities
- 👤 **User Profiles**: Customisable user profiles with avatars
- 📱 **Direct Messages**: One-to-one private conversations

# Quick Start
The website is live on [https://messaging-app-client-eight.vercel.app/]. Log in with the provided credentials to explore the features of the full-stack application:
- **username**: guest
- **password**: iamaguest

## Technology Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js, JWT
- **Real-time Communication**: Socket.IO
- **File Upload**: Multer, Cloudinary
- **Testing**: Jest


# **Table of Contents**
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication and Authorisation](#authentication-and-authorisation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

# **Installation**
### **Prerequisites**
Ensure the following software is installed before proceeding:
- **Node.js** (v16+ recommended)
- **PostgreSQL** (or your preferred database)

1. Clone the repository:
    ```bash
    git clone https://github.com/kiffoh/messaging-app-server.git
    cd messaging-app-server
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

This will install all necessary dependencies, including:
- **Prisma** (for ORM)
- **Express** (for server)
- **Passport.js** (for authentication)
- **jsonwebtoken** (for JWT-based authorization)
- **socket.io** (for real-time communication)
- **multer** (for file-uploads)
- **cloudinary api** (for online-storage)
- And more...

# **Environment Setup**
To set up your environment, create a `.env` file in the root directory of your project. This file should contain the following required environment variables, along with descriptions for each:

### Server Configuration
- **NODE_ENV**: Set to `development` or `production` to specify the environment.
- **SECRET_KEY**: Secret key for signing tokens
- **FRONTEND_URL**: URL for your frontend application

### Database Configuration
- **DATABASE_URL**: Connection string for your database

### Media Storage
- **CLOUDINARY_URL**: Cloudinary URL for media uploads
- **CLOUDINARY_API_KEY**: Cloudinary API key
- **CLOUDINARY_API_SECRET**: Cloudinary API secret
- **CLOUDINARY_CLOUD_NAME**: Cloudinary cloud name

### Default Assets
- **DEFAULT_PICTURE**: Default profile picture URL
- **DEFAULT_GROUP_PICTURE**: Default group picture URL

If you want to have separate environment files for production and development, you can create `.env.production` and `.env.development`. You will also need to set the `NODE_ENV` variable in the command line or use the `cross-env` package (already a dependency) for Windows users. 

### Example `.env.development` File
```bash
NODE_ENV=development
DATABASE_URL=database-url
FRONTEND_URL=api-url
SECRET_KEY='your-secret-key'
DEFAULT_PICTURE=relative/url-to-default-profile-picture
DEFAULT_GROUP_PICTURE=relative/url-to-default-group-picture
CLOUDINARY_URL=cloudinary-url
CLOUDINARY_API_KEY=cloudinary-api-key
CLOUDINARY_API_SECRET=cloudinary-api-secret
CLOUDINARY_CLOUD_NAME=cloudinary-cloud-name
```

### Notes
- Ensure that you replace the placeholder values with your actual configuration.
- Keep your `.env` file out of version control by adding it to your `.gitignore`.

# **Running the Project**

To run the development server, use the following command:
```bash
npm run dev

```
To run the production server, execute:
```bash
npm start
```

### Notes
- The cross-env package is included in the above commands. If you are using macOS or Linux, you can remove cross-env from the package.json scripts, as it is only necessary for Windows users.
- Ensure that you have all environment variables set up correctly before starting the servers.

### Debugging
To run with debug logs:
```bash
DEBUG=easymessage:* npm run dev
```

# API Documentation

This document outlines all available endpoints in the application. The API is organized into four main sections:
- Base Routes
- Users
- Groups
- Messages

### Request Formats
- For file uploads: `multipart/form-data`
- For all other requests: `application/json`

## User Routes
`POST /users/signup`
- Description: Creates a new user.
- Request Body:
``` bash
{
  "username": "johndoe",
  "password": "password123"
}
```
- Response:
    - Success: Returns the created user object.
    - Error: Validation errors or signup issues.

`POST /users/login`
- Description: Logs in an existing user.
- Request Body:
```bash
{
  "username": "johndoe",
  "password": "password123"
}
```
- Response:
    - Success: Returns a token and user details.
    - Error: Incorrect username or password.

`GET /users/:userId/profile`
- Description: Fetches the profile information of a user by userId.
- Response:
    - Success: User's profile data (e.g., username, bio, photo).
    - Error: User not found

`PUT /users/:userId/profile`
- Description: Updates the profile of a user, including uploading a profile photo.
- Request Body:
    - Multipart form data for profile photo and other user details.
- Response:
    - Success: Updated user profile.
    - Error: Validation errors or failure to upload photo.

`DELETE /users/:userId/profile`
- Description: Deletes a user profile by userId.
- Response:
    - Success: User deleted successfully.
    - Error: User not found or other deletion issues.

`GET /users/usernames`
- Description: Retrieves all usernames in the system.
- Response: Array of all usernames.

`PUT /users/:userId/update-contacts`
- Description: Updates the user's contact list.
- Request Body: An array of user IDs to be added to the contact list.
- Response:
    - Success: Contacts updated.
    - Error: Invalid user or update failed.


# **Database Schema**
The schema is implemented using Prisma with PostgreSQL as the database provider.

To apply the database schema migrations, run the following command:
```bash
npx prisma migrate dev
```

Alternatively, you can use the commands defined in the package.json, which allow specifying the development or production database:
```bash
"migrate:dev": "cross-env DATABASE_URL=development-url npx prisma migrate dev",
"migrate:prod": "cross-env DATABASE_URL=production-url npx prisma migrate dev",
```

### Notes
- **Environment-specific migrations**: Ensure that you set the `NODE_ENV` to either `development` or `production` before running the migration commands.
- **Windows users**: You must use `cross-env` to set environment variables, as shown in the `package.json` commands.
- **macOS/Linux users**: You can remove `cross-env` from the commands, as environment variables can be set directly in the terminal.

## Models

### User
Represents an application user with their profile information and relationships.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `username` (String): Unique identifier for the user
- `password` (String): Encrypted user password
- `bio` (String?): Optional user biography
  - Default: "Hello, I am on EasyMessage!"
- `photo` (String?): Profile picture URL
  - Default: Cloudinary-hosted default image
- `createdAt` (DateTime): Timestamp of account creation

#### Relationships
- `messages`: One-to-many relation with Message model
  - A user can send multiple messages
- `groups`: Many-to-many relation with Group model via "GroupMembers"
  - Users can be members of multiple groups
- `adminGroups`: Many-to-many relation with Group model via "GroupAdmins"
  - Users can be administrators of multiple groups
- `contacts`: Self-referential many-to-many relationship
  - Manages user's contact list
  - Bidirectional relationship through `contactedBy`

### Message
Handles the storage and management of messages within groups and direct chats.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `content` (String?): Optional message text
  - Nullable to support photo-only messages
- `photoUrl` (String?): Optional URL for attached images
- `createdAt` (DateTime): Message creation timestamp
- `updatedAt` (DateTime): Last modification timestamp
- `authorId` (Int?): Foreign key to User model
- `groupId` (Int): Foreign key to Group model

#### Relationships
- `author`: Many-to-one relation with User model
  - Nullable to handle deleted user accounts
- `group`: Many-to-one relation with Group model
  - Every message belongs to a group/chat

### Group
Manages both group chats and direct messages between users.

#### Fields
- `id` (Int): Primary key, auto-incrementing
- `name` (String?): Optional group name
- `photo` (String?): Optional group avatar URL
- `createdAt` (DateTime): Group creation timestamp
- `updatedAt` (DateTime): Last activity timestamp
- `directMsg` (Boolean): Flags whether this is a direct message chat
- `bio` (String?): Optional group description
  - Default: "We are the greatest tribe on EasyMessage."

#### Relationships
- `members`: Many-to-many relation with User model via "GroupMembers"
- `admins`: Many-to-many relation with User model via "GroupAdmins"
- `messages`: One-to-many relation with Message model

#### Indexes
- Combined index on `[updatedAt, createdAt]`
  - Optimises queries for recent activity and chat history

### Key Features
- **Direct Messages**: Implemented through the Group model with `directMsg` flag
- **Group Chats**: Full support for multi-user conversations
- **Admin Controls**: Separate tracking of group administrators
- **Contact Management**: Built-in contact list functionality
- **Media Support**: Handles both text and image messages
- **Soft Deletion**: Messages persist even if users are deleted

### Notes
- The schema supports both one-on-one and group messaging through a unified Group model
- User photos default to a Cloudinary-hosted image
- Messages can contain text, images, or both
- Groups and users maintain separate creation and update timestamps for activity tracking


# Authentication and Authorisation
The application uses JSON Web Tokens (JWT) for stateless authentication, implemented through Passport.js with a Local Strategy for credential verification. User passwords are securely hashed using bcrypt before storage.

## Authentication Implementation
- **Strategy**: Passport Local Strategy (stateless)
- **Token Type**: JSON Web Tokens (JWT)
- **Password Security**: 
    - Passwords are hashed using bcrypt
    - Passwords are never stored in plain text

### Token Structure
JWT payload includes:
- `id`: User's unique identifier
- `username`: User's username
- `bio`: User's biography
- `createdAtDate`: Formatted date of account creation
- `createdAtTime`: Formatted time of account creation
- `photo`: URL to user's profile photo

### Authentication Flow
1. **Login Process**:
  - User submits username and password
  - Credentials are validated against database
  - Upon successful validation:
    - JWT token is generated with user data
    - Token is returned to client
    - Token expires in 1 hour

2. **Token Configuration**:
- Expiration: 1 hour
- Signing algorithm: HS256
- Token must be included in Authorization header for protected routes

3. **Error Handling**:
- Invalid credentials return 400 Bad Request
- Server errors return 500 Internal Server Error
- Detailed error messages for debugging

## Security Measures
- Stateless authentication using JWT
- Password hashing with bcrypt
- Environment-based secret key configuration
- Token expiration for security
- Error logging for authentication failures

### Environment Variables Required
```env
SECRET_KEY=your_jwt_secret_key
```

### Error Responses
- Invalid Credentials:
```bash
{
  "message": "Invalid username or password."
}
```
- Successful Login:
```bash
{
  "token": "jwt_token_string",
  "message": "Login successful"
}
```

# Testing
This project uses [Jest](https://jestjs.io/) as the testing framework. The tests primarily focus on the functionality of group and user deletion, ensuring the correct cascading behavior for related data such as messages, message receipts, and group memberships.

### Running Tests

To run the test suite, execute the following command:

```bash
npm test
```

### Group Deletion Tests
- **Test Description**: These tests verify that when a group is deleted, all associated data such as messages and message receipts are correctly removed, and users are disconnected from the group.
The following cases are covered:
- The group and its related data (messages, message receipts) should be deleted.
- Users should be disconnected from the group as members or admins.

### User Deletion Tests
- **Test Description**: These tests verify that when a user is deleted, the associated group data is updated accordingly, including checking that the user is no longer a member or admin of any group, and their direct messages (DMs) and related receipts are properly handled.
The following cases are covered:
- The user is successfully deleted.
- After deletion, the groups and DMs associated with the user reflect the removal of that user (e.g., admin status removed, members reduced).

### Notes
- **Database transactions**: The tests use Prisma's $transaction method to handle the deletion process and ensure the related data is removed safely.
- **Environment setup**: Ensure your .env.test or equivalent testing environment is properly configured before running the tests.
- **Post-test cleanup**: The afterAll() hook in the test files ensures the database connection is properly closed after the tests run.

# Deployment
I have deployed the backend code on render and used neon for the production database. Once these are online I have uploaded my environment variables to the render and redeployed for successful deployment.
