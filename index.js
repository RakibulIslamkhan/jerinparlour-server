const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config()
const port = process.env.PORT || 5050;
const cors = require("cors");
const fileUpload = require('express-fileupload')
app.use(cors());
app.use(express.json());
app.use(fileUpload())

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.rirnk.mongodb.net/?retryWrites=true&w=majority`;
// const uri = 'mongodb://localhost:27017'
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
    const serviceCollection = client.db("serviceCollection").collection("services");
    const userCollection = client.db("serviceCollection").collection("users");
    const reviewCollection = client.db("serviceCollection").collection("reviews");
    const booksCollection = client.db("serviceCollection").collection("books");
    app.post("/books", async (req, res) => {
      const userInfo = req.body;
      const result = await booksCollection.insertOne(userInfo);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      // Check if the user already exists
      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.status(409).send("User already exists.");
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.post('/services', async(req, res) =>{
      const title = req.body.title;
      const description = req.body.description;
      const price = req.body.price;
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString('base64')
      const imgBuffer = Buffer.from(encodedPic, 'base64')
      const service = {
        title,
        description,
        price,
        image: imgBuffer
      }
      const result = await serviceCollection.insertOne(service)
      res.json(result)
    })
    app.get('/services', async(req, res) =>{
      const cursor = serviceCollection.find({})
      const service = await cursor.toArray()
      res.json(service)
    })
    app.get('/reviews', async(req, res) =>{
      const review = await reviewCollection.find().toArray()
      res.send(review)
    })
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    app.get("/books/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = booksCollection.find(query);
      const userBook= await cursor.toArray();
      res.json(userBook);
    });
    app.get("/books", async (req, res) => {
      const books = await booksCollection.find().toArray();
    res.send(books);
    });
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    app.get('/books/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const service = await booksCollection.findOne({ _id: new ObjectId(id) });
        console.log(service)
    
        if (!service) {
          return res.status(404).json({ error: 'Service not found.' });
        }
    
        res.json(service);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    app.put('/books/:id', async (req, res) => {
      const { id } = req.params;
    
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ObjectId.' });
      }
    
      try {
        const result = await booksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: req.body.status } }
        );
    
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Service not found.' });
        }
        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });    
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// app.get("/services", (req, res) => {
//     const search = req.query.search
//     if (search) {
//        const searchResult = services.filter((service) => service.title.toLowerCase().includes(search))
//        res.send(searchResult)
//     }
//     res.send(services);
// });
// app.get("/services/:id", (req, res) => {
//   const id = req.params.id;
//   const service = services[id-1];
//   res.send(service);
// });

app.get("/", (req, res) => {
  res.send("services api");
});
app.listen(port, () => {
  console.log(port);
});
