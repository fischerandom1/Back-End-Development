const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

var dbconnect = {
  connectMongoose: async function () {
    const url = "mongodb://localhost:27017/FYP";
    try {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB with Mongoose");
    } catch (error) {
      console.error("Error connecting to MongoDB with Mongoose", error);
    }
  },

  insertDocumentWithMongoose: async function (collectionName, document) {
    await this.connectMongoose();
    try {
      const DynamicModel =
        mongoose.models[collectionName] ||
        mongoose.model(
          collectionName,
          new mongoose.Schema({}, { strict: false }),
          collectionName
        );
      const newItem = new DynamicModel(document);
      const result = await newItem.save();
      console.log(
        `Document inserted with Mongoose into collection '${collectionName}' with _id: ${result._id}`
      );
      return result; // Return the result for further processing if necessary
    } catch (error) {
      console.error(
        `Error inserting document with Mongoose into collection '${collectionName}'`,
        error
      );
      throw error; // Throw the error to be caught by the caller
    }
  },

  getConnection: async function () {
    const url = "mongodb://localhost:27017/FYP";

    const client = new MongoClient(url);

    try {
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB", error);
    }

    return client;
  },
  updateModelPort: async function (modelName, portNumber) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db("FYP");
      const collection = db.collection("models");

      const updateResult = await collection.updateOne(
        { _id: modelName },
        { $set: { Dynamic_Port_Number: portNumber } }
      );

      console.log(`Matched Count: ${updateResult.matchedCount}`);
      console.log(`Modified Count: ${updateResult.modifiedCount}`);
      console.log(`Upserted Count: ${updateResult.upsertedCount}`);


      if (updateResult.upsertedCount > 0) {
        console.log(
          `Inserted a new document for model ${modelName} with port ${portNumber}`
        );
      } else if (updateResult.modifiedCount > 0) {
        console.log(
          `Updated document for model ${modelName} with new port ${portNumber}`
        );
      } else {
        console.log(
          `No changes made for model ${modelName}. It might already have port ${portNumber}`
        );
      }

      return updateResult; // Return the result for further processing if necessary
    } catch (error) {
      console.error(
        `Error updating port for model '${modelName}' in collection '${collectionName}'`,
        error
      );
      throw error; // Re-throw the error so it can be caught and handled by the caller
    } finally {
      if (client) {
        client.close();
      }
    }
  },
  getAllItem: async function (collectionName) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db("FYP");
      const collection = db.collection(collectionName);

      const result = await collection.find().toArray();
      return result;
    } catch (error) {
      console.error(`Error getting documents from '${collectionName}'`, error);
      throw error; // Re-throw the error so it can be caught and handled by the caller
    } finally {
      // Ensure that the client connection is closed even if an error occurs
      if (client) {
        client.close();
      }
    }
  },

  getFilteredItem: async function (collectionName, filter, filtercolumn) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db("FYP");
      const collection = db.collection(collectionName);

      const result = await collection
        .find(filter, { projection: filtercolumn })
        .toArray();
      console.log(result);
      return result;
    } catch (error) {
      console.error(`Error fetching document from '${collectionName}'`, error);
    } finally {
      if (client) {
        client.close();
      }
    }
  },
  getAllModels: async function () {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db("FYP");
      const collection = db.collection("models");

      const models = await collection.find({}).toArray();
      console.log("All models:", models);
      return models;
    } catch (error) {
      console.error("Error fetching models from 'models' collection", error);
    } finally {
      if (client) {
        client.close();
      }
    }
  },

  checkData: function (document) {
    if (!document.Date) {
      document.Date = new Date();
    }

    console.log(document);
    return document;
  },
};

module.exports = dbconnect;
