import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { getDb } from './config/db';
import { initializeDatabase } from './db/schema';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Bind API routes under /api prefix
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'BhuSetu Ownership-State Verification Engine' });
});

async function startServer() {
  try {
    const dbPath = path.join(__dirname, '../bhusetu.db');
    const dbExists = fs.existsSync(dbPath);

    // Get database connection
    const db = await getDb();

    // If database does not exist or has no tables, initialize and seed it
    const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users';");
    if (!dbExists || !tableCheck) {
      console.log("Database file missing or schema not initialized. Initializing database...");
      await initializeDatabase();
    } else {
      console.log("Database file found. Opening existing database...");
    }

    app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` BhuSetu Monolith Server running at http://localhost:${PORT}`);
      console.log(` Environment: Prototype / Hackathon Demo`);
      console.log(`================================================================`);
    });
  } catch (error) {
    console.error("Failed to start BhuSetu server:", error);
    process.exit(1);
  }
}

startServer();
