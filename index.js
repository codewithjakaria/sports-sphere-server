const express = require('express');
const cors = require('cors'); 
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors()); 
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vj9qmzs.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
 
    await client.connect();
    console.log('🎯 MongoDB Connected Successfully to sportsSphereDB!');

    
    const equipmentCollection = client
      .db('sportsSphereDB')
      .collection('equipment');

  
    app.get('/allEquipment', async (req, res) => {
      try {
        const cursor = equipmentCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Data fetch Error' });
      }
    });


    app.post('/allEquipment', async (req, res) => {
      try {
        const newEquipment = req.body;
        const result = await equipmentCollection.insertOne(newEquipment);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Data save Error' });
      }
    });
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
  }
}
run();

app.get('/', (req, res) => {
  res.send('SportsSphere Server is running... 🏃‍♂️');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
