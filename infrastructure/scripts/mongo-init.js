// ==========================================
// MongoDB Initialization Script for SynapseX
// Reads credentials from environment variables injected by Docker Compose.
// ==========================================

const appUser = process.env.MONGO_APP_USER || 'synapsex_user';
const appPassword = process.env.MONGO_APP_PASSWORD || 'synapsex_password';

db = db.getSiblingDB('synapsex');

// Create application user with readWrite role on synapsex database
db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [
    {
      role: 'readWrite',
      db: 'synapsex',
    },
  ],
});

// Create initial collections and indexes
db.createCollection('cases');
db.createCollection('evidence');
db.createCollection('custody_logs');
db.createCollection('users');
db.createCollection('findings');
db.createCollection('timeline_events');

db.cases.createIndex({ caseNumber: 1 }, { unique: true });
db.evidence.createIndex({ caseId: 1, hash: 1 });
db.custody_logs.createIndex({ evidenceId: 1, timestamp: -1 });
db.timeline_events.createIndex({ caseId: 1, timestamp: 1 });

print('SynapseX database and collections successfully initialized.');
