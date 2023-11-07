const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  res.send({ token });
});

//middleware function for verifying token
function verifyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  console.log(authorization);
  if (!authorization) {
    return res.status(401).send({ error: "Unauthorized access!" });
  }
  // step -2 . Verify if the provided token is valid or not.
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // console.log({ err });
    if (err) {
      return res.status(403).send({ error: "Unauthorized access!" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oeh6vj2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const usersCollection = client.db("TodoList").collection("users");
  const tasksCollection = client.db("TodoList").collection("tasks");

  // get all user
  app.get("/users", async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
  });
  // current user data
  app.get("/users/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email }; // Creating a query object with the email field
    const result = await usersCollection.findOne(query);
    res.send(result);
  });

  // Save user in DB during sign up
  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log(user);

    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  //gettasks
  app.get("/tasks", verifyJWT, async (req, res) => {
    const result = await tasksCollection.find().toArray();
    res.send(result);
  });
  //add task
  app.post("/tasks", verifyJWT, async (req, res) => {
    const doc = req.body;
    result = await tasksCollection.insertOne(doc);
    res.send(result);
  });

  //update task
  app.put("/tasks/update/:id", verifyJWT, async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    console.log(body);
    const filter = { _id: new ObjectId(id) };
    const updateData = {
      $set: {
        id: body._id,
        title: body.title,
        description: body.description,
        assign_by: body.assign_by,
        assign_to: body.assign_to,
      },
    };
    const result = await tasksCollection.updateOne(filter, updateData);
    console.log(result);
    res.send(result);
  });
  app.delete("/tasks/:id", async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const query = { _id: new ObjectId(id) };
    const result = await tasksCollection.deleteOne(query);
    res.send(result);
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`todo is running at port ${port}`);
});

app.listen(port, () => {
  console.log(`todo is running at port ${port}`);
});
