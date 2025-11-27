const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
var admin = require("firebase-admin");
const port = process.env.PORT || 2005;
// console.log(process.env)

var serviceAccount = require("./fire_admin_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log("logging info");
  next();
};

const verifyFirebaseToken = async(req, res, next) => {
  console.log("in the verify middleware", req.headers.authorization);

  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  // verify id token
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    // console.log("after token verify", userInfo);
    next();
  }
  catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

app.get("/", (req, res) => {
  res.send("Simple Crud server is running");
});


const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@tuser579.arztfp8.mongodb.net/?appName=Tuser579`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersDB = client.db("usersDB");
    const usersCollection = usersDB.collection("users");
    const usersCollectionCars = usersDB.collection("cars");
    const usersCollectionBooking = usersDB.collection("booking");

    // car related database
    app.get("/cars", async (req, res) => {
      const cursor = usersCollectionCars.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/carsBooking", async (req, res) => {
      const cursor = usersCollectionCars.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/newestCars", async (req, res) => {
      const cursor = usersCollectionCars.find().sort({ length: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/topRatedCars", async (req, res) => {
      const cursor = usersCollectionCars
        .find()
        .sort({ rating: -1, reviews: -1 })
        .limit(3);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myCars", logger, verifyFirebaseToken, async (req, res) => {
      // console.log(req.query);
      // console.log('headers' , req);

      const email = req.query.email;
      const query = {};
      if (email) {
        if(email !== req.token_email) {
          res.status(403).send({message: "forbidden access"});
        }
        query.email = email;
      }

      const cursor = usersCollectionCars.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/cars/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await usersCollectionCars.findOne(query);
      res.send(result);
    });

    app.post("/cars", async (req, res) => {
      const newCar = req.body;
      const len = await usersCollectionCars.countDocuments();
      newCar.length = len + 1;
      const result = await usersCollectionCars.insertOne(newCar);
      res.send(result);
    });

    app.patch("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedCar.name,
          description: updatedCar.description,
          category: updatedCar.category,
          price: updatedCar.price,
          location: updatedCar.location,
          image: updatedCar.image,
          status: updatedCar.status,
        },
      };
      const options = {};
      const result = await usersCollectionCars.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    app.patch("/carsBooking/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: updatedCar.status,
        },
      };
      const options = {};
      const result = await usersCollectionCars.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    app.delete("/cars/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollectionCars.deleteOne(query);
      res.send(result);
    });

    // booking related database
    app.get("/myBookings", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.customerEmail = email;
      }

      const cursor = usersCollectionBooking.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/myBookings", async (req, res) => {
      const bookingInformation = req.body;
      // console.log("id" , bookingInformation);
      const result = await usersCollectionBooking.insertOne(bookingInformation);
      res.send(result);
    });

    app.delete("/myBookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollectionBooking.deleteOne(query);
      res.send(result);
    });

    // user related database
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      console.log("update User", id, updatedUser);
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
        },
      };
      const options = {};
      const result = await usersCollection.updateOne(query, update, options);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Users Server started on Port: ${port}`);
});
