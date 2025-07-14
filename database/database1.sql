-- Database creation
CREATE DATABASE task_management_db
WITH 
OWNER = postgres
ENCODING = 'UTF8'
CONNECTION LIMIT = -1;

-- Connect to the database
\c task_management_db

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'user' CHECK ("role" IN ('user', 'admin')),
  "resetPasswordToken" VARCHAR(255),
  "resetPasswordExpires" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Users_email_key" UNIQUE ("email"),
  CONSTRAINT "Users_username_key" UNIQUE ("username")
);

-- Tasks table
CREATE TABLE "Tasks" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP,
  "priority" VARCHAR(50) DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high')),
  "status" VARCHAR(50) DEFAULT 'pending' CHECK ("status" IN ('pending', 'in-progress', 'completed')),
  "ownerId" INTEGER NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SharedTasks table (many-to-many relationship between Tasks and Users)
CREATE TABLE "SharedTasks" (
  "id" SERIAL PRIMARY KEY,
  "taskId" INTEGER NOT NULL REFERENCES "Tasks" ("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE,
  "permission" VARCHAR(50) DEFAULT 'view' CHECK ("permission" IN ('view', 'edit')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SharedTasks_taskId_userId_key" UNIQUE ("taskId", "userId")
);

-- Comments table
CREATE TABLE "Comments" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "taskId" INTEGER NOT NULL REFERENCES "Tasks" ("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE "Notifications" (
  "id" SERIAL PRIMARY KEY,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('due-date', 'shared-task', 'comment')),
  "userId" INTEGER NOT NULL REFERENCES "Users" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX "Users_email_idx" ON "Users" ("email");
CREATE INDEX "Users_username_idx" ON "Users" ("username");

CREATE INDEX "Tasks_ownerId_idx" ON "Tasks" ("ownerId");
CREATE INDEX "Tasks_dueDate_idx" ON "Tasks" ("dueDate");
CREATE INDEX "Tasks_status_idx" ON "Tasks" ("status");
CREATE INDEX "Tasks_priority_idx" ON "Tasks" ("priority");

CREATE INDEX "SharedTasks_taskId_idx" ON "SharedTasks" ("taskId");
CREATE INDEX "SharedTasks_userId_idx" ON "SharedTasks" ("userId");

CREATE INDEX "Comments_taskId_idx" ON "Comments" ("taskId");
CREATE INDEX "Comments_userId_idx" ON "Comments" ("userId");

CREATE INDEX "Notifications_userId_idx" ON "Notifications" ("userId");
CREATE INDEX "Notifications_isRead_idx" ON "Notifications" ("isRead");
CREATE INDEX "Notifications_createdAt_idx" ON "Notifications" ("createdAt");

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON "Users"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tasks_timestamp
BEFORE UPDATE ON "Tasks"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_shared_tasks_timestamp
BEFORE UPDATE ON "SharedTasks"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_comments_timestamp
BEFORE UPDATE ON "Comments"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON "Notifications"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to check task access
CREATE OR REPLACE FUNCTION check_task_access(user_id INTEGER, task_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "Tasks" WHERE id = task_id AND "ownerId" = user_id
  ) OR EXISTS (
    SELECT 1 FROM "SharedTasks" WHERE "taskId" = task_id AND "userId" = user_id
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's tasks (owned and shared)
CREATE OR REPLACE FUNCTION get_user_tasks(user_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  title VARCHAR,
  description TEXT,
  dueDate TIMESTAMP,
  priority VARCHAR,
  status VARCHAR,
  ownerId INTEGER,
  isOwner BOOLEAN,
  permission VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.title, t.description, t."dueDate", t.priority, t.status, t."ownerId",
    true AS "isOwner",
    'edit' AS permission
  FROM "Tasks" t
  WHERE t."ownerId" = user_id
  
  UNION
  
  SELECT 
    t.id, t.title, t.description, t."dueDate", t.priority, t.status, t."ownerId",
    false AS "isOwner",
    st.permission
  FROM "SharedTasks" st
  JOIN "Tasks" t ON st."taskId" = t.id
  WHERE st."userId" = user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for due date notifications
CREATE OR REPLACE FUNCTION check_due_date_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."dueDate" IS NOT NULL AND 
     (OLD."dueDate" IS DISTINCT FROM NEW."dueDate" OR OLD."dueDate" IS NULL) AND
     NEW."dueDate" <= (CURRENT_TIMESTAMP + INTERVAL '3 days') THEN
    INSERT INTO "Notifications" ("message", "type", "userId")
    VALUES (
      'Task "' || NEW."title" || '" is due soon (' || 
      TO_CHAR(NEW."dueDate", 'Mon DDth YYYY') || ')',
      'due-date',
      NEW."ownerId"
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_due_date_notification
AFTER INSERT OR UPDATE ON "Tasks"
FOR EACH ROW EXECUTE FUNCTION check_due_date_notification();

-- View for user dashboard
CREATE OR REPLACE VIEW "UserDashboard" AS
SELECT 
  u.id AS "userId",
  u.username,
  u.email,
  COUNT(DISTINCT t.id) FILTER (WHERE t."ownerId" = u.id) AS "ownedTasks",
  COUNT(DISTINCT st.id) AS "sharedTasks",
  COUNT(DISTINCT t.id) FILTER (WHERE t."ownerId" = u.id AND t.status = 'completed') AS "completedTasks",
  COUNT(DISTINCT n.id) FILTER (WHERE n."isRead" = false) AS "unreadNotifications"
FROM "Users" u
LEFT JOIN "Tasks" t ON t."ownerId" = u.id
LEFT JOIN "SharedTasks" st ON st."userId" = u.id
LEFT JOIN "Notifications" n ON n."userId" = u.id
GROUP BY u.id;

-- Insert sample data
INSERT INTO "Users" ("username", "email", "password", "role") VALUES
('admin', 'admin@example.com', '$2a$10$X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7', 'admin'),
('john_doe', 'john@example.com', '$2a$10$X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7', 'user'),
('jane_smith', 'jane@example.com', '$2a$10$X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7X8z5sJ9hY6d1UZrZ7QwB5eJ5QZ7', 'user');

INSERT INTO "Tasks" ("title", "description", "dueDate", "priority", "status", "ownerId") VALUES
('Complete project', 'Finish the task management system', '2025-07-20 23:59:59', 'high', 'pending', 2),
('Write documentation', 'Document all API endpoints', '2025-07-15 18:00:00', 'medium', 'in-progress', 2),
('Test sharing feature', 'Test task sharing with other users', '2025-07-18 12:00:00', 'low', 'pending', 3),
('Review code', 'Review the backend implementation', '2025-07-22 15:00:00', 'high', 'pending', 3),
('Deploy application', 'Deploy to production server', '2025-07-25 10:00:00', 'medium', 'pending', 2);

INSERT INTO "SharedTasks" ("taskId", "userId", "permission") VALUES
(1, 3, 'edit'),
(3, 2, 'view'),
(4, 2, 'edit'),
(5, 3, 'view');

INSERT INTO "Comments" ("content", "taskId", "userId") VALUES
('Make sure to include all endpoints', 1, 2),
('I''ll help with the testing', 3, 2),
('Thanks for sharing this task!', 1, 3),
('I found a bug in this feature', 4, 2),
('When will this be completed?', 5, 3);

INSERT INTO "Notifications" ("message", "type", "userId", "isRead") VALUES
('Task "Complete project" is due soon (Jul 20th 2025)', 'due-date', 2, false),
('john_doe shared a task "Complete project" with you', 'shared-task', 3, false),
('jane_smith commented on your task "Test sharing feature"', 'comment', 3, true),
('Task "Write documentation" is due soon (Jul 15th 2025)', 'due-date', 2, false),
('jane_smith shared a task "Review code" with you', 'shared-task', 2, false);