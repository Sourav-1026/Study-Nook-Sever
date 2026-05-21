require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  // console.log(authHeader);
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  console.log(token);

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("study-nook");
    const roomsCollection = db.collection("rooms");
    const bookingCollection = db.collection("bookings");

    // Post Room api
    app.post("/rooms", verifyToken, async (req, res) => {
      const roomData = req.body;
      console.log(roomData);
      const result = await roomsCollection.insertOne(roomData);
      res.json(result);
    });

    // Get All Room api
    app.get("/rooms", async (req, res) => {
      const { search, amenities, maxRate, minRate } = req.query;

      const query = {};

      if (search) {
        query.roomName = { $regex: search, $options: "i" };
      }

      if (amenities) {
        query.amenities = { $all: amenities.split(",") };
      }

      if (minRate || maxRate) {
        query.$expr = {
          $and: [minRate ? { $gte: [{ $toDouble: "$rate" }, Number(minRate)] } : {}, maxRate ? { $lte: [{ $toDouble: "$rate" }, Number(maxRate)] } : {}].filter((obj) => Object.keys(obj).length > 0),
        };
      }

      const result = await roomsCollection.find(query).toArray();
      res.json(result);
    });

    // get listing room api
    app.get("/rooms/user/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await roomsCollection.find({ userId }).toArray();
      res.json(result);
    });

    // Get Single Room api
    app.get("/rooms/:roomId", verifyToken, async (req, res) => {
      const { roomId } = req.params;
      const result = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
      res.json(result);
    });

    // update room api
    app.patch("/rooms/:roomId", verifyToken, async (req, res) => {
      const { roomId } = req.params;
      const updatedData = req.body;
      const result = await roomsCollection.updateOne({ _id: new ObjectId(roomId) }, { $set: updatedData });
      res.json(result);
    });

    // delete room api
    app.delete("/rooms/:roomId", verifyToken, async (req, res) => {
      const { roomId } = req.params;
      const result = await roomsCollection.deleteOne({ _id: new ObjectId(roomId) });
      const bookingResult = await bookingCollection.deleteMany({ roomId: roomId });
      res.json(result);
    });

    //post bookings api
    app.post("/bookings", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    });

    // get booking api
    app.get("/bookings/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingCollection.find({ userId }).toArray();
      res.json(result);
    });

    // patch booking api
    app.patch("/bookings/:bookingId", verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const updatedData = req.body;
      const result = await bookingCollection.updateOne({ _id: new ObjectId(bookingId) }, { $set: updatedData });
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
