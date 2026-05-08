# Wedding Planning Platform

A comprehensive wedding planning platform that empowers couples to create personalized, multilingual wedding websites with advanced digital collaboration and management tools.

## Features

- **Multilingual Support**: English, Uzbek, and Russian translations
- **Role-based Access Control**: Admin, Guest Manager, and User roles
- **Guest Management**: Complete RSVP system with real-time tracking
- **Photo Galleries**: Upload and showcase wedding memories
- **Guest Book**: Interactive message system for guests
- **Wedding Websites**: Beautiful, customizable wedding sites
- **Real-time Updates**: WebSocket integration for live updates

## Tech Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with session management
- **Real-time**: WebSocket support
- **Internationalization**: react-i18next

## Prerequisites

Before running this project locally, make sure you have:

- Node.js (v18 or later)
- PostgreSQL database
- npm or yarn package manager

## Installation & Setup

### 1. Clone/Extract the Project
Extract the ZIP file to your desired directory.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a PostgreSQL database and set up the connection:

1. Create a new PostgreSQL database
2. Copy `.env.example` to `.env`
3. Update the DATABASE_URL in `.env` with your database credentials:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
```

### 4. Database Migration
Push the schema to your database:
```bash
npm run db:push
```

### 5. Start the Application
Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wedding_db"

# Session Secret (use a strong random string)
SESSION_SECRET="your-super-secret-session-key-here"

# Optional: Production settings
NODE_ENV="development"
PORT=5000
```

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and i18n
│   │   └── App.tsx      # Main app component
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── db.ts           # Database connection
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
└── uploads/             # File upload directory
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## User Roles

### Admin
- Full access to all features
- User management capabilities
- Wedding creation and management
- Complete guest management

### Guest Manager
- Limited access to assigned weddings
- Guest management for specific weddings
- RSVP tracking and management
- Cannot create new weddings

### User
- Create and manage their own weddings
- Full control over their wedding websites
- Guest management for own weddings

## Default Login Credentials

After setting up the database, you can create users through the registration flow or directly in the database.

## Language Support

The platform supports three languages:
- English (en)
- Uzbek (uz) 
- Russian (ru)

Language can be switched using the language selector in the interface.

## Database Schema

The application uses the following main tables:
- `users` - User accounts and roles
- `weddings` - Wedding information
- `guests` - Guest lists and RSVP data
- `photos` - Wedding photo galleries
- `guest_book_entries` - Guest messages
- `wedding_access` - Role-based access control

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on port 5000

3. **Missing Dependencies**
   - Delete node_modules and package-lock.json
   - Run `npm install` again

4. **Translation Issues**
   - Check browser language settings
   - Verify translation files in client/src/lib/i18n.ts

## Production Deployment

For production deployment:

1. Set NODE_ENV=production in .env
2. Configure production database
3. Set secure SESSION_SECRET
4. Run `npm run build`
5. Use PM2 or similar for process management

## Support

For issues or questions about this wedding planning platform, check the code comments and database schema for implementation details.