const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const fileupload = require("express-fileupload");
const ObjectId = require("mongodb").ObjectID;
const fs = require("fs-extra");
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.7ntnx.mongodb.net:27017,cluster0-shard-00-01.7ntnx.mongodb.net:27017,cluster0-shard-00-02.7ntnx.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-87jhz3-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("doctors"));
app.use(fileupload());
app.get("/", (req, res) => {
  res.send("Hello World");
});

client.connect((err) => {
  const collection = client
    .db(process.env.DB_NAME)
    .collection(process.env.DB_COLLECTION);
  const doctorCollection = client.db(process.env.DB_NAME).collection("doctors");

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    console.log(appointment);
    collection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }
      collection.find(filter).toArray((err, documents) => {
        console.log(email, date.date, doctors, documents);
        res.send(documents);
      });
    });
  });

  app.get("/allAppointments", (req, res) => {
    collection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addADoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    doctorCollection.insertOne({ name, email, image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
});

app.listen(process.env.PORT || 5000);
