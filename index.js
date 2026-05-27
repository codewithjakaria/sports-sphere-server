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
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();
    const db = client.db('Sports-Sphere');
    const bookingsCollection = db.collection('bookings');
    const facilitiesCollection = db.collection('facilities');
    const usersCollection = db.collection('users');

    const auth = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: { enabled: true },
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      trustedOrigins: allowedOrigins,

     
      cookies: {
        session: {
          name: 'auth_session',
          sameSite: 'none', 
          secure: true,
        },
      },
    });

    app.all('/api/auth/*', toNodeHandler(auth));

    // --- Facility Routes ---
    app.post('/api/facilities', async (req, res) => {
      try {
        const result = await facilitiesCollection.insertOne(req.body);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Error adding facility' });
      }
    });

    app.get('/api/facilities', async (req, res) => {
      try {
        const result = await facilitiesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.get('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ message: 'Invalid ID' });
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

    app.delete('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ message: 'Invalid ID' });
        const result = await facilitiesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        result.deletedCount === 1
          ? res.send({ message: 'Deleted' })
          : res.status(404).send({ message: 'Not found' });
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.get('/api/my-facilities', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: 'Email required' });
        const result = await facilitiesCollection
          .find({ owner_email: email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.put('/api/facilities/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ message: 'Invalid ID' });
        const { _id, ...updatedData } = req.body;
        const result = await facilitiesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );
        res.send({ message: 'Updated successfully' });
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    // --- Booking Routes ---
    app.post('/api/bookings', async (req, res) => {
      try {
        const result = await bookingsCollection.insertOne({
          ...req.body,
          status: 'pending',
          createdAt: new Date(),
        });
        res.status(201).send(result);
      } catch (error) {
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
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.delete('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ message: 'Invalid ID' });
        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        result.deletedCount === 1
          ? res.send({ message: 'Deleted' })
          : res.status(404).send({ message: 'Not found' });
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });

    app.patch('/api/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ message: 'Invalid ID' });
        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: 'cancelled' } },
        );
        result.modifiedCount === 1
          ? res.send({ message: 'Cancelled' })
          : res.status(404).send({ message: 'Not found' });
      } catch (error) {
        res.status(500).send({ message: 'Server Error' });
      }
    });
    // --- USER PROFILE UPDATE ---
  app.put('/api/user/profile', async (req, res) => {
    try {
      const { email, name, image } = req.body;

      if (!email) {
        return res.status(400).send({ message: 'Email required' });
      }

      const result = await usersCollection.updateOne(
        { email: email },
        { $set: { name: name, image: image } },
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'User not found' });
      }

      res.send({
        message: 'Profile updated successfully',
        result,
      });
    } catch (error) {
      console.error('Profile Update Error:', error);
      res.status(500).send({ message: 'Server Error' });
    }
  });

    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  } catch (error) {
    console.error('Server connection error:', error);
  }
}

startServer();
