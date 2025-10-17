# VoiceIQ Render Database Setup Guide

## Using Your Existing Render PostgreSQL Database

This guide helps you configure VoiceIQ to use your existing Render PostgreSQL database.

### 1. Environment Variables

Make sure your Render service has the following environment variable set:

```
DATABASE_URL=postgresql://username:password@host:port/database_name
```

You can find this URL in your Render dashboard:
1. Go to your database service
2. Click on "Connect" or "Info"
3. Copy the "External Database URL"

### 2. Setting DATABASE_URL in Render

1. Go to your Render service dashboard
2. Click on "Environment"
3. Add a new environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string from step 1

### 3. Database Schema

The application will automatically create the required tables when it starts up. The setup script will:

- Create all necessary tables (users, interview_sessions, feedback, etc.)
- Set up proper foreign key relationships
- Create indexes for better performance
- Handle existing data gracefully

### 4. Tables Created

The following tables will be created in your existing database:

- `users` - User accounts and profiles
- `interview_sessions` - Interview session data
- `interview_questions` - Questions for each session
- `user_responses` - User answers to questions
- `transcripts` - Voice transcript data
- `feedback` - AI-generated feedback
- `dashboard_stats` - User statistics
- `interview_analytics` - Detailed analytics

### 5. Testing the Setup

After deployment, you can test the database connection by:

1. Checking the application logs for "Database schema initialized successfully"
2. Testing the API endpoints
3. Running the test script: `python test_all_endpoints.py`

### 6. Troubleshooting

If you encounter issues:

1. **Connection Error**: Check your DATABASE_URL format
2. **Permission Error**: Ensure your database user has CREATE TABLE permissions
3. **Schema Error**: The setup script handles existing tables gracefully

### 7. Data Migration

If you have existing data in your database:

- The setup script will not overwrite existing tables
- Use `migrate_to_postgres.py` if you need to migrate data from SQLite
- All new tables will be created alongside existing ones

### 8. Monitoring

Monitor your database usage in the Render dashboard:
- Check connection count
- Monitor query performance
- Review storage usage

## Support

If you need help with the database setup, check:
- Render service logs
- Database connection status in Render dashboard
- Application startup logs for database initialization messages
