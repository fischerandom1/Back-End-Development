const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;
const app = require("../controller/app.js"); // Replace with the actual path to your Express app
const dbconnect = require("../model/databaseConfig.js"); // Update with the correct path
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Test for GET '/'
describe("GET /", () => {
  it("should return server running message", (done) => {
    request(app)
      .get("/")
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.equal("Server is running");
        done(err);
      });
  });
});

describe("GET /models", () => {
  it("should return models based on query params", (done) => {
    request(app)
      .get("/models?type=pytorch&version=classification")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
          if ( err ) return done( err );
        done();
      });
  });
});


describe("POST /user-selection", () => {
  it("should process and return image path", (done) => {
    const modelId = "6543500b9789e87db8163a8f"; // Replace with the desired model_id

    const req = request(app)
      .post("/user-selection")
      .attach("inputImage", "test/test_image.jpg");

    // Manually set the model_id in the request body
    req.field("model_id", modelId);

    req.expect(200).end((err, res) => {
      if (err) return done(err);
      // Assert the response contains image path
      done();
    });
  });
});

describe("POST /insert-prediction", () => {
  it("should insert prediction results into database", (done) => {
    const modelId = "6543500b9789e87db8163a8f"; // Replace with the desired model_id

    const req = request(app)
      .post("/user-selection")
      .attach("inputImage", "test/test_image.jpg");

    // Manually set the model_id in the request body
    req.field("model_id", modelId);

    req.expect(200).end((err, res) => {
      if (err) return done(err);
      // Assert the response contains image path
      done();
    });
  });
});


describe("GET /prediction-history", () => {
  it("should return prediction history", (done) => {
    request(app)
      .get("/prediction-history")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        // Assert the response contains the prediction history
        done();
      });
  });
});


describe("insertDocumentWithMongoose", function () {
  it("should insert a document into the specified collection", async function () {
    const testDocument = {
      /* some test data */
    };
    const result = await dbconnect.insertDocumentWithMongoose(
      "TestCollection",
      testDocument
    );
    expect(result).to.include(testDocument);
  });
});

describe("getAllItem", function () {
  it("should retrieve all items from a specified collection", async function () {
    const items = await dbconnect.getAllItem("TestCollection");
    expect(items).to.be.an("array");
    // You can insert some known documents first and then check if they are retrieved correctly.
  });
});

describe("getFilteredItem", function () {
  it("should retrieve items based on the name filter", async function () {
    const filter = { name: "TestName" }; // Filter criteria
    const projection = {}; // Projection (empty means all fields are included)

    const filteredItems = await dbconnect.getFilteredItem(
      "TestCollection",
      filter,
      projection
    );

    expect(filteredItems).to.be.an("array");
    expect(filteredItems).to.satisfy((items) =>
      items.every(
        (item) => item.name === "TestName" // Condition based on the filter criteria
      )
    );
  });
});


describe('getAllModels', function() {
  it('should retrieve all models from the models collection', async function() {
    const models = await dbconnect.getAllModels();
    expect(models).to.be.an('array');
    // Further assertions based on the expected models
  });
});

describe('checkData', function() {
  it('should add a date to the document if it does not exist', function() {
    const documentWithoutDate = { name: 'Test' };
    const processedDocument = dbconnect.checkData(documentWithoutDate);
    expect(processedDocument).to.have.property('Date');
  });

  it('should not modify the document if it already has a date', function() {
    const documentWithDate = { name: 'Test', Date: new Date() };
    const processedDocument = dbconnect.checkData(documentWithDate);
    expect(processedDocument.Date).to.equal(documentWithDate.Date);
  });
});


describe("Validation Check for POST /user-selection", () => {
  it("should return an error if model_id is missing", (done) => {
    // Send a request with missing model_id
    request(app)
      .post("/user-selection")
      .attach("inputImage", "test/test_image.jpg")
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  it("should return an error if an invalid image format is used", (done) => {
    // Send a request with an invalid image format
    request(app)
      .post("/user-selection")
      .attach("inputImage", "test/test_invalid_image.txt") // Attach a non-image file
      .field("model_id", "6543500b9789e87db8163a8f") // Provide a valid model_id
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  it("should return an error if model_id is not a valid MongoDB ObjectId", (done) => {
    // Send a request with an invalid model_id format
    request(app)
      .post("/user-selection")
      .attach("inputImage", "test/test_image.jpg")
      .field("model_id", "invalid_id") // Provide an invalid model_id
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  it("should return an error if inputImage is not attached", (done) => {
    // Send a request without attaching an image
    request(app)
      .post("/user-selection")
      .field("model_id", "6543500b9789e87db8163a8f") // Provide a valid model_id
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  // Add more validation check test cases here
});

describe("Validation Check for GET /models", () => {
  it("should return an error if type query parameter is missing", (done) => {
    // Send a request with a missing 'type' query parameter
    request(app)
      .get("/models?version=classification")
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  it("should return an error if version query parameter is missing", (done) => {
    // Send a request with a missing 'version' query parameter
    request(app)
      .get("/models?type=pytorch")
      .expect(400) // Expect a 400 Bad Request response
      .end((err, res) => {
        if (err) return done(err);
        // Add assertions for the error response
        done();
      });
  });

  // Add more validation check test cases here
});
