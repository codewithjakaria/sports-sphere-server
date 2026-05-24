import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const port = process.env.PORT || 5001;
const allowedOrigins = [
  'http://localhost:3000',
  'https://sports-sphere-client-phi.vercel.app',
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();
    const db = client.db('Sports-Sphere');
    const bookingsCollection = db.collection('bookings');
    const facilitiesCollection = db.collection('facilities');

    const auth = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: { enabled: true },
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      trustedOrigins: allowedOrigins,
    });

    app.all('/api/auth/*', toNodeHandler(auth));

    app.post('/api/facilities', async (req, res) => {
      const result = await facilitiesCollection.insertOne(req.body);
      res.status(201).send(result);
    });

    app.get('/api/facilities', async (req, res) => {
      const result = await facilitiesCollection.find().toArray();
      res.send(result);
    });

    app.get('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID format' });
        }
        const result = await facilitiesCollection.findOne({
          _id: new ObjectId(id),
        });
        result
          ? res.send(result)
          : res.status(404).send({ message: 'Not Found' });
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.post('/api/bookings', async (req, res) => {
      const result = await bookingsCollection.insertOne({
        ...req.body,
        status: 'pending',
        createdAt: new Date(),
      });
      res.status(201).send(result);
    });

    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  } catch (error) {
    console.error('Server connection error:', error);
  }
}
startServer();
