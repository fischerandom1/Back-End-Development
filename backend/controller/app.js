const multer = require("multer");
var express = require("express");
const cors = require("cors");
const axios = require("axios");
var app = express();
const path = require("path");
const mongoose = require("mongoose");
const { exec } = require("child_process");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  },
});
const upload = multer({ storage: storage });
var model_database = require("../model/Models.js");
var database = require("../model/databaseConfig.js");
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const fs = require("fs");
const buffer = require("buffer");
const portfinder = require("portfinder");

app.use(cors());
app.use(bodyParser.json()); // parse application/json
app.use(urlencodedParser); // parse application/x-www-form-urlencoded
database.getConnection();
database.connectMongoose();

// ..................................................................
// Functions
// ..................................................................

async function findEmptyPort() {
  portfinder.basePort = 2000; // start searching from port 2000
  portfinder.highestPort = 9000; // search up to port 9000

  try {
    const port = await portfinder.getPortPromise();
    console.log(`Found an empty port: ${port}`);
    return port;
  } catch (error) {
    console.error("Could not find an empty port", error);
    throw error;
  }
}

app.use(
  "/output_images",
  express.static(path.join(__dirname, "output_images"))
);




// ..................................................................
// Server Page
// ..................................................................
app.get("/", async (request, response) => {
  response.send("Server is running");
});

// ..................................................................
// Getting all the models
// ..................................................................

app.get("/models", async (req, res) => {
  // Destructure or set default values for the type and version query parameters
  const {
    type: modelType = "pytorch",
    version: modelVersion = "classification",
  } = req.query;

  // Validate modelType and modelVersion if necessary
  // For example, ensure that modelType is either 'pytorch' or 'tensorflow'
  // and that modelVersion is either 'classification' or 'segmentation'

  try {
    // Use a case-insensitive regular expression for modelVersion
    // const regex = new RegExp(modelVersion, "i");

    // Construct the query based on the parameters
    const query = {
      Model_Type: modelType.toLowerCase(), // Ensuring that modelType is in lowercase for the query
      Model_Version: modelVersion.toLowerCase(),
    };

    // Perform the search with the constructed query and projection
    const models = await model_database.find(query);

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ..................................................................
// Post the image from the frontend to the backend
// ..................................................................

app.post("/user-selection", upload.array("inputImage"), async (req, res) => {
  try {
    if ( req.files.length == 1 )
    {
      const filePath = req.files[ 0 ].path; // Path where the uploaded image is saved

      console.log( filePath );
      
      const parts = filePath.split( "_" );
      const lastPart = parts[ parts.length - 1 ];
      // Now split by dot to separate the name and extension, then take the first part
      const imageid = lastPart.split( "." )[ 0 ] + ".jpg";

      // Create a FormData object to send the file to the prediction API
      const FormData = require( "form-data" );
      const formData = new FormData();
      formData.append(
        "file",
        fs.createReadStream( filePath ),
        req.files[ 0 ].originalname
      );
      const modelId = req.body.model_id;
      // Include form boundary in the headers
      const formHeaders = formData.getHeaders();

      // Convert string ID to ObjectId for MongoDB
      const objectId = new mongoose.Types.ObjectId( modelId );

      // Fetch model information from the 'models' collection
      let modelInfo;
      try
      {
        modelInfo = await database.getFilteredItem(
          "models",
          { _id: objectId },
          {}
        );
        if ( modelInfo.length === 0 )
        {
          return res.status( 404 ).json( { message: "Model not found." } );
        }
      } catch ( modelError )
      {
        console.error( "Error fetching model data:", modelError );
        return res.status( 500 ).json( { message: "Error fetching model data." } );
      }

      // Extract the model_link and model_name from the fetched modelInfo
      const modelLink = modelInfo[ 0 ].Model_Link;
      const modelName = modelInfo[ 0 ].Model_Name; // Adjust the key based on your schema
      const modelPort = modelInfo[ 0 ].Dynamic_Port_Number;
      const modelVersion = modelInfo[ 0 ].Model_Version;

      console.log( modelLink, modelName );

      const textQuery = req.body.text_query;

      // Include text query if model requires it
      if (
        textQuery &&
        ( modelName === "OwlVit" || modelName === "Segment Anything" )
      )
      {
        formData.append( "text_queries", textQuery ); // Append text query
      }

      if ( modelVersion !== "3d-object-detection" )
      {
        // Make a POST request to the FastAPI '/object-to-img' endpoint
        axios
          .post( `${ modelLink }${ modelPort }/object-to-img`, formData, {
            headers: { ...formHeaders },
            responseType: "arraybuffer",
          } )
          .then( ( response ) =>
          {
            // Overwrite the original image with the prediction image
            fs.writeFile( filePath, response.data, ( err ) =>
            {
              if ( err )
              {
                console.error( "Error saving the prediction image:", err );
                return res
                  .status( 500 )
                  .json( { message: "Failed to save the prediction image." } );
              }

              // Send a success response to the client with the path to the saved image
              res.json( { outputImage: path.basename( filePath ) } );
            } );
          } )
          .catch( ( error ) =>
          {
            console.error( "Error making POST request:", error );
            res.status( 500 ).json( {
              message: "An error occurred while making the POST request.",
            } );
          } );
      } else
      {
        res.json( { outputImage: path.basename( imageid ) } );
      }


    } else
    {
      let allDBResults = [];

      let operationsCompleted = 0;
      const totalOperations = req.files.filter(
        ( file ) => file.mimetype === "image/jpg"
      ).length;

      req.files.forEach( async ( file ) =>
      {
        // Process only if the file is a JPG
        if ( file.mimetype === 'image/jpeg' )
        {
          const filePath = file.path;

          const parts = filePath.split( "_" );
          const lastPart = parts[ parts.length - 1 ];
          // Now split by dot to separate the name and extension, then take the first part
          const imageid = ( lastPart.split( "." )[ 0 ] ) + ".jpg";

          // Create a FormData object to send the file to the prediction API
          const FormData = require( "form-data" );
          const formData = new FormData();
          formData.append(
            "file",
            fs.createReadStream( filePath ),
            file.originalname
          );
          const modelId = req.body.model_id;
          // Include form boundary in the headers
          const formHeaders = formData.getHeaders();

          // Convert string ID to ObjectId for MongoDB
          const objectId = new mongoose.Types.ObjectId( modelId );

          // Fetch model information from the 'models' collection
          let modelInfo;
          try
          {
            modelInfo = await database.getFilteredItem(
              "models",
              { _id: objectId },
              {}
            );
            if ( modelInfo.length === 0 )
            {
              return res.status( 404 ).json( { message: "Model not found." } );
            }
          } catch ( modelError )
          {
            console.error( "Error fetching model data:", modelError );
            return res
              .status( 500 )
              .json( { message: "Error fetching model data." } );
          }

          // Extract the model_link and model_name from the fetched modelInfo
          const modelLink = modelInfo[ 0 ].Model_Link;
          const modelName = modelInfo[ 0 ].Model_Name; // Adjust the key based on your schema
          const modelPort = modelInfo[ 0 ].Dynamic_Port_Number;
          const modelVersion = modelInfo[ 0 ].Model_Version;

          console.log( modelLink, modelName );

          const textQuery = req.body.text_query;

          // Include text query if model requires it
          if (
            textQuery &&
            ( modelName === "OwlVit" || modelName === "Segment Anything" )
          )
          {
            formData.append( "text_queries", textQuery ); // Append text query
          }

          if ( modelVersion !== "3d-object-detection" )
          {
            // Make a POST request to the FastAPI '/object-to-img' endpoint
            axios
              .post( `${ modelLink }${ modelPort }/object-to-img`, formData, {
                headers: { ...formHeaders },
                responseType: "arraybuffer",
              } )
              .then( ( response ) =>
              {
                // Overwrite the original image with the prediction image
                fs.writeFile( filePath, response.data, ( err ) =>
                {
                  if ( err )
                  {
                    console.error( "Error saving the prediction image:", err );
                    return res
                      .status( 500 )
                      .json( { message: "Failed to save the prediction image." } );
                  }

                  // Send a success response to the client with the path to the saved image
                  allDBResults.push( path.basename( filePath ) );
                  operationsCompleted++;
                  if ( operationsCompleted === totalOperations )
                  {
                    res.json( { outputImage: allDBResults } );
                  }
                } );
              } )
              .catch( ( error ) =>
              {
                console.error( "Error making POST request:", error );
                res.status( 500 ).json( {
                  message: "An error occurred while making the POST request.",
                } );
              } );
          } else
          {
          
            res.json( { outputImage: path.basename( imageid ) } );

          }
        }
        });
    
    }
  } catch (error) {
    console.error("Error processing data:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the data." });
  }
});

// ..........................................................................................
// Post the image from the frontend to the backend to get json and append to database
// ..........................................................................................

app.post("/insert-prediction", upload.array("inputImage"), async (req, res) => {
  try {
    if (req.files.length == 1) {
      const filePath = req.files[ 0 ].path; // Path where the uploaded image is saved
      
      const parts = filePath.split("_");
      const lastPart = parts[parts.length - 1];
      // Now split by dot to separate the name and extension, then take the first part
      const imageid = lastPart.split(".")[0] + ".jpg";


      // Create a FormData object to send the file to the prediction API
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append(
        "file",
        fs.createReadStream(filePath),
        req.files[0].originalname
      );

      // Include form boundary in the headers
      const formHeaders = formData.getHeaders();
      const modelId = req.body.model_id; // Assuming modelId is sent in the body of the request
      // console.log("modelId:", modelId);
      // Convert string ID to ObjectId for MongoDB
      const objectId = new mongoose.Types.ObjectId(modelId);
      // console.log("objectId:", objectId);

      // Fetch model information from the 'models' collection
      let modelInfo;
      try {
        modelInfo = await database.getFilteredItem(
          "models",
          { _id: objectId },
          {}
        );
        if (modelInfo.length === 0) {
          return res.status(404).json({ message: "Model not found." });
        }
      } catch (modelError) {
        console.error("Error fetching model data:", modelError);
        return res.status(500).json({ message: "Error fetching model data." });
      }

      const modelLink = modelInfo[0].Model_Link;
      // Extract the model_link from the fetched modelInfo
      const modelName = modelInfo[0].Model_Name; // Adjust the key based on your schema
      const modelPort = modelInfo[0].Dynamic_Port_Number;

      console.log( modelLink, modelName );
      
      const modelVersion = modelInfo[0].Model_Version; // Assuming you store version as Model_Version


      const textQuery = req.body.text_query;

      // Include text query if model requires it
      if (
        textQuery &&
        (modelName === "OwlVit" || modelName === "Segment Anything")
      ) {
        formData.append("text_queries", textQuery); // Append text query
      }

      if ( modelVersion !== "3d-object-detection" )
      {
        // Make a POST request to the FastAPI '/object-to-json' endpoint
        axios
          .post( `${ modelLink }${ modelPort }/object-to-json`, formData, {
            headers: { ...formHeaders },
            responseType: "json",
          } )
          .then( async ( response ) =>
          {
            // Check if the expected data is present
            if ( !response.data || typeof response.data.result === "undefined" )
            {
              console.error(
                "The expected result property is not present in the response."
              );
              return res
                .status( 500 )
                .json( { message: "The result is undefined." } );
            }

            const jsonResult = response.data.result;
            jsonResult.filePath = filePath;
            jsonResult.modelInfo = modelInfo[ 0 ]; // Add the model information to the result
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split( "T" )[ 0 ];
            jsonResult.currentDate = formattedDate;

            // Insert the combined data into the 'Predictions' collection
            try
            {
              const insertResult = await database.insertDocumentWithMongoose(
                "Predictions",
                jsonResult
              );
              console.log(
                "Combined result inserted into the database:",
                insertResult
              );
              res.json( { dbResult: jsonResult } );
            } catch ( dbError )
            {
              console.error(
                "Error inserting combined data into the database:",
                dbError
              );
              res
                .status( 500 )
                .json( { message: "Failed to insert data into the database." } );
            }
          } )
          .catch( ( error ) =>
          {
            console.error( "Error making POST request to /object-to-json:", error );
            res.status( 500 ).json( {
              message:
                "An error occurred while making the POST request to /object-to-json.",
            } );
          } );
      } else
      {
        let emptyArray = [];
        res.json( { dbResult: emptyArray } );
      }
    } else {
      let allDBResults = [];

      let operationsCompleted = 0;
      const totalOperations = req.files.length;

      req.files.map(async (file) => {
        const filePath = file.path;
        const parts = filePath.split("_");
        const lastPart = parts[parts.length - 1];
        // Now split by dot to separate the name and extension, then take the first part
        const imageid = lastPart.split(".")[0] + ".jpg";

        const FormData = require("form-data");
        const formData = new FormData();
        formData.append(
          "file",
          fs.createReadStream(filePath),
          req.files[0].originalname
        );

        const formHeaders = formData.getHeaders();
        const modelId = req.body.model_id;

        const objectId = new mongoose.Types.ObjectId(modelId);
        let modelInfo;
        try {
          modelInfo = await database.getFilteredItem(
            "models",
            { _id: objectId },
            {}
          );
          if (modelInfo.length === 0) {
            return res.status(404).json({ message: "Model not found." });
          }
        } catch (modelError) {
          console.error("Error fetching model data:", modelError);
          return res
            .status(500)
            .json({ message: "Error fetching model data." });
        }
        const modelLink = modelInfo[0].Model_Link;
        const modelName = modelInfo[0].Model_Name;
        const modelPort = modelInfo[ 0 ].Dynamic_Port_Number;
        
        console.log( modelLink, modelName );
        
        const modelVersion = modelInfo[0].Model_Version; // Assuming you store version as Model_Version


        const textQuery = req.body.text_query;

        if (
          textQuery &&
          (modelName === "OwlVit" || modelName === "Segment Anything")
        ) {
          formData.append("text_queries", textQuery); // Append text query
        }
        if ( modelVersion !== "3d-object-detection" )
        {
          axios
            .post( `${ modelLink }${ modelPort }/object-to-json`, formData, {
              headers: { ...formHeaders },
              responseType: "json",
            } )
            .then( async ( response ) =>
            {
              // Check if the expected data is present
              if ( !response.data || typeof response.data.result === "undefined" )
              {
                console.error(
                  "The expected result property is not present in the response."
                );
                return res
                  .status( 500 )
                  .json( { message: "The result is undefined." } );
              }

              const jsonResult = response.data.result;
              jsonResult.filePath = filePath;
              jsonResult.modelInfo = modelInfo[ 0 ]; // Add the model information to the result
              const currentDate = new Date();
              const formattedDate = currentDate.toISOString().split( "T" )[ 0 ];
              jsonResult.currentDate = formattedDate;

              // Insert the combined data into the 'Predictions' collection
              try
              {
                const insertResult = await database.insertDocumentWithMongoose(
                  "Predictions",
                  jsonResult
                );
                console.log(
                  "Combined result inserted into the database:",
                  insertResult
                );
                allDBResults.push( jsonResult );
                operationsCompleted++;
                if ( operationsCompleted === totalOperations )
                {
                  res.json( { dbResult: allDBResults } );
                }
              } catch ( dbError )
              {
                console.error(
                  "Error inserting combined data into the database:",
                  dbError
                );
                res.status( 500 ).json( {
                  message: "Failed to insert data into the database.",
                } );
              }
            } )
            .catch( ( error ) =>
            {
              console.error(
                "Error making POST request to /object-to-json:",
                error
              );
              res.status( 500 ).json( {
                message:
                  "An error occurred while making the POST request to /object-to-json.",
              } );
            } );
        } else
        {
          let emptyArray = [];
          res.json({ dbResult: emptyArray });
        }
      });
    }
  } catch (error) {
    console.error("Error processing data:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the data." });
  }
});

// ..................................................................
// Add new models
// ..................................................................
app.post("/add-model", upload.array("modelupload", 10), async (req, res) => {
  try {
    console.log("Received new model data");

    // Access the text fields
    const modelname = req.body.modelname;
    const modeltype = req.body.modeltype;
    const environment = req.body.environment;
    const portnumber = req.body.portnumber;
    const folderpath = req.body.folderpath;
    const dockerfile = req.body.dockerfile;
    const mainpy = req.body.mainpy;
    const requirements = req.body.requirements;

    // Access the file uploaded
    const files = req.files;

    console.log({
      modelname,
      modeltype,
      environment,
      portnumber,
      folderpath,
      dockerfile,
      mainpy,
      requirements,
      files: files
        ? files.map((file) => file.originalname)
        : "No file uploaded", // Log the names of all files
    });

    // Dict to insert
    const modelToSave = {
      Model_Name: modelname,
      Model_Link: "http://0.0.0.0:",
      Model_Type: environment,
      Model_Version: modeltype,
      Port_Number: portnumber,
      Relative_Path: folderpath,
      Dynamic_Port_Number: "",
    };

    console.log("New model info added to the database:", modelToSave);
    // Instead of directly sending the response, wait until the database operation is complete
    try {
      const insertResult = await database.insertDocumentWithMongoose(
        "models",
        modelToSave
      );
      console.log("Added into database:", insertResult);

      // Create files and folders in development folder
      var dir = `${folderpath}/${modeltype}/${modelname}-${
        environment == "pytorch" ? "nn" : "tf"
      }`;
      console.log("pikachu", dir);

      // Ensure unique folder
      if (fs.existsSync(dir)) {
        let filenamealreadyexists = 0;
        let temp_dir = dir;
        while (fs.existsSync(temp_dir)) {
          temp_dir = dir;
          console.log("THIS IS", fs.existsSync(dir));
          filenamealreadyexists += 1;
          temp_dir += `(${filenamealreadyexists})`;
        }
        dir = temp_dir; // Rename folder
        console.log(dir);
      }
      fs.mkdirSync(dir, { recursive: true }); // Make new folder

      // Write files
      fs.writeFileSync(`${dir}/requirements.txt`, requirements, "utf-8");
      fs.writeFileSync(`${dir}/Dockerfile`, dockerfile, "utf-8");
      fs.writeFileSync(`${dir}/main.py`, mainpy, "utf-8");

      // Transfer file to repo
      if (files) {
        files.forEach((file) => {
          const destinationPath = path.join(dir, file.originalname);
          fs.renameSync(file.path, destinationPath);
          console.log(`File moved to: ${destinationPath}`);
        });
      } else {
        console.log("No files were uploaded.");
      }

      // Send the response here, after the database operation
      res
        .status(200)
        .json({ message: "Model added successfully", data: modelToSave });
    } catch (dbError) {
      console.error(
        "Error inserting combined data into the database:",
        dbError
      );
      res.status(500).json({
        message: "Failed to insert data into the database.",
      });
    }
  } catch (error) {
    console.error("Error adding model:", error);
    // Ensure this is the only place where response is sent in case of an error
    res.status(500).json({ message: "Failed to add model" });
  }
});

// ..................................................................
// Prediction history page
// ..................................................................

app.get("/prediction-history", async (req, res) => {
  try {
    const predictions = await database.getAllItem("Predictions");
    console.log(predictions);
    res.json(predictions);
  } catch (error) {
    console.error(
      "Error fetching predictions from the 'Predictions' collection",
      error
    );
    res
      .status(500)
      .json({ error: "An error occurred while fetching predictions." });
  }
});

// ..................................................................
// Start up contatiner
// ..................................................................

app.post("/run-container", async (req, res) => {
  const modelId = req.body.model_id;
  const objectId = new mongoose.Types.ObjectId(modelId);

  try {
    let modelInfo = await database.getFilteredItem(
      "models",
      { _id: objectId },
      {}
    );

    if (modelInfo.length === 0) {
      return res.status(404).json({ message: "Model not found." });
    }

    // Find an empty port
    const port = await portfinder.getPortPromise();

    console.log(port);

    // Update MongoDB with the port number
    await database.updateModelPort(objectId, port); // Implement this method in your database module

    const modelName = modelInfo[0].Model_Name.replace(/\s+/g, "").toLowerCase();

    const modelPath = modelInfo[0].Relative_Path;
    const staticport = parseInt(modelInfo[0].Port_Number, 10);

    // Command to build and run Docker container
    // Replace 'path/to/dockerfile' and 'your-docker-image' with your actual paths and image name
    const dockerBuildCmd = `docker build -t ${modelName} ${modelPath}`;
    const dockerRunCmd = `docker run -p ${port}:${staticport} ${modelName}:latest`; // Replace <container-port> with the internal port your Docker container exposes

    exec(dockerBuildCmd, (buildError, buildStdout, buildStderr) => {
      if (buildError) {
        console.error(`Build error: ${buildError}`);
        return res.status(500).send("Failed to build Docker container");
      }
      console.log(`Docker Build`);

      exec(dockerRunCmd, (runError, runStdout, runStderr) => {
        if (runError) {
          console.error(`Run error: ${runError}`);
          return res.status(500).send("Failed to start Docker container");
        }
      });
      res.send(`Container started on port ${port}`);
    });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = app;
