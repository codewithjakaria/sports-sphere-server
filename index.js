import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://sports-sphere-client-phi.vercel.app',
    ],
    credentials: true,
  }),
);

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();

    console.log('✅ Connected to MongoDB');

    const db = client.db('Sports-Sphere');

    const auth = betterAuth({
      database: mongodbAdapter(db),

      emailAndPassword: {
        enabled: true,
      },

      baseURL: process.env.BETTER_AUTH_URL,

      secret: process.env.BETTER_AUTH_SECRET,

      trustedOrigins: [
        'http://localhost:3000',
        'https://sports-sphere-client-phi.vercel.app',
      ],
    });

    // FIXED ROUTE
    app.use('/api/auth', toNodeHandler(auth));

    app.get('/', (req, res) => {
      res.send('Server is running...');
    });

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

startServer();
