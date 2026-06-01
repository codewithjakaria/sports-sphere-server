import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'https://sports-sphere-client-phi.vercel.app',
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();
    console.log('✅ MongoDB Connected');

    const db = client.db('Sports-Sphere');
    const bookingsCollection = db.collection('bookings');
    const facilitiesCollection = db.collection('facilities');
    const usersCollection = db.collection('users');

    const auth = betterAuth({
      database: mongodbAdapter(db),
      baseURL: process.env.BETTER_AUTH_URL,
      basePath: '/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      trustedOrigins: allowedOrigins,

      emailAndPassword: { enabled: true },

      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },

      user: {
        allowUnsafeEmailLinking: true,
      },

      advanced: {
        defaultCookieAttributes: {
          secure: isProd,
          httpOnly: true,
          sameSite: isProd ? 'none' : 'lax',
          ...(isProd && { partitioned: true }),
        },
      },
    });

    app.options('/api/auth/*', cors(corsOptions));
    app.all('/api/auth/*', toNodeHandler(auth));

    app.use(express.json());

    app.get('/', (req, res) => {
      res.send('🚀 SportSphere Server Running');
    });

    app.post('/api/facilities', async (req, res) => {
      try {
        const result = await facilitiesCollection.insertOne(req.body);
        res.status(201).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error adding facility' });
      }
    });

    app.get('/api/facilities', async (req, res) => {
      try {
        const result = await facilitiesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.get('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID' });
        }
        const result = await facilitiesCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!result) {
          return res.status(404).send({ message: 'Facility Not Found' });
        }
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.delete('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID' });
        }
        const result = await facilitiesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Facility Not Found' });
        }
        res.send({ message: 'Facility Deleted Successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.get('/api/my-facilities', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ message: 'Email Required' });
        }
        const result = await facilitiesCollection
          .find({ owner_email: email })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.put('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID' });
        }
        const { _id, ...updatedData } = req.body;
        const result = await facilitiesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );
        res.send({ message: 'Facility Updated Successfully', result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.post('/api/bookings', async (req, res) => {
      try {
        const result = await bookingsCollection.insertOne({
          ...req.body,
          status: 'pending',
          createdAt: new Date(),
        });
        res.status(201).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.get('/api/bookings', async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { user_email: email } : {};
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.delete('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID' });
        }
        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Booking Not Found' });
        }
        res.send({ message: 'Booking Deleted Successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.patch('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid ID' });
        }
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'cancelled' } },
        );
        if (result.modifiedCount === 0) {
          return res.status(404).send({ message: 'Booking Not Found' });
        }
        res.send({ message: 'Booking Cancelled Successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.put('/api/user/profile', async (req, res) => {
      try {
        const { email, name, image } = req.body;
        if (!email) {
          return res.status(400).send({ message: 'Email Required' });
        }
        const result = await usersCollection.updateOne(
          { email },
          { $set: { name, image } },
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'User Not Found' });
        }
        res.send({ message: 'Profile Updated Successfully', result });
      } catch (error) {
        console.error('Profile Update Error:', error);
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.listen(port, () => {
      console.log(`🚀 Server Running On Port ${port}`);
    });
  } catch (error) {
    console.error('❌ Server Connection Error:', error);
  }
}

startServer();
