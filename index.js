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

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
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
    const bookingsCollection = db.collection('bookings');

    const auth = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: {
        enabled: true,
      },
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      trustedOrigins: allowedOrigins,
      advanced: {
        defaultCookieAttributes: {
          secure: true,
          httpOnly: true,
          sameSite: 'none',
        },
      },
    });

    app.all('/api/auth/*', toNodeHandler(auth));

    app.post('/api/bookings', async (req, res) => {
      try {
        const bookingData = req.body;
        const newBooking = {
          ...bookingData,
          status: 'pending',
          createdAt: new Date(),
        };
        const result = await bookingsCollection.insertOne(newBooking);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Failed to save booking',
        });
      }
    });

    app.get('/api/bookings', async (req, res) => {
      try {
        const email = req.query.email;
        const result = await bookingsCollection
          .find({ user_email: email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Failed to fetch bookings',
        });
      }
    });

    app.patch('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: 'cancelled',
            },
          },
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: 'Failed to cancel booking',
        });
      }
    });

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
