const mongoose = require( "mongoose" );

const ModelsSchema = new mongoose.Schema({
  Model_Name: {
    type: String,
    default: "",
  },
  Model_Link: {
    type: String,
    default: "",
  },
  Model_Type: {
    type: String,
    default: "",
  },
  Model_Version: {
    type: String,
    default: "",
  },
  Port_Number: {
    type: String,
    default: "",
  },
  Dynamic_Port_Number: {
    type: String,
    default: "",
  },
  Relative_Path: {
    type: String,
    default: "",
  },
  CreatedTimestamp: {
    type: Date,
    default: Date.now, // Automatically set the creation timestamp
  },
  UpdatedTimestamp: {
    type: Date,
    default: Date.now, // Automatically set the update timestamp
  },
});

// Pre-save middleware to update the timestamps
ModelsSchema.pre( "save", function ( next )
{
    const now = new Date();
    this.UpdatedTimestamp = now;
    if ( !this.CreatedTimestamp )
    {
        this.CreatedTimestamp = now;
    }
    next();
} );

const Model = mongoose.model( "Models", ModelsSchema );

module.exports = Model;