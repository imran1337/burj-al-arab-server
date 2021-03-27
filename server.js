const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.klaju.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const admin = require("firebase-admin");

const serviceAccount = require("./configs/burj-al-arab-e4553-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
  res.send("Site Working!");
});

client.connect((err) => {
  const collection = client
    .db(`${process.env.DB_NAME}`)
    .collection(`${process.env.DB_COLLECTION}`);
  // perform actions on the collection object

  //store booking information
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((response) => {
      console.log(response);
      res.send(JSON.stringify({ success: response.insertedCount > 0 }));
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log("IdToken: ", idToken);
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          console.log(decodedToken);
          const { email } = req.query;
          if (tokenEmail !== email) {
            return res
              .status(401)
              .send(
                JSON.stringify({ success: false, msg: "401 unauthorized" })
              );
          }
          collection.find({ email }).toArray((err, documents) => {
            res.status(200).send(documents);
          });
        })
        .catch((error) => {
          res.send(JSON.stringify(error));
        });
    } else res.status(401).send("unauthorized");
  });

  console.log("database connected");
});

app.listen(4007, () => {
  console.log("Server listening at http://localhost:4007");
});
