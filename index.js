require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const db = client.db("study-nook");
    const roomsCollection = db.collection("rooms");

    // Add Room
    app.post("/rooms", async (req, res) => {
      const roomData = req.body;
      console.log(roomData);
      const result = await roomsCollection.insertOne(roomData);

      res.json(result);
    });

    // Get All Room
    app.get("/rooms", async (req, res) => {
      const roomData = req.body;

      const result = await roomsCollection.find().toArray();
      res.json(result);
    });

    // Get Single Room
    app.get("/rooms/:roomId", async (req, res) => {
      const { roomId } = req.params;
      const result = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
      res.json(result);
    });

    // update room
    app.patch("/rooms/:roomId", async (req, res) => {
      const { roomId } = req.params;
      const updatedData = req.body;
      const result = await roomsCollection.updateOne({ _id: new ObjectId(roomId) }, { $set: updatedData });
      res.json(result);
    });

    // delete room
    app.delete("/rooms/:roomId", async (req, res) => {
      const { roomId } = req.params;
      const result = await roomsCollection.deleteOne({ _id: new ObjectId(roomId) });
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
