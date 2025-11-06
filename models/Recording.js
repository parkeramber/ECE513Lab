// models/Recording.js
const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema({
  zip:       { type: Number },
  airQuality:{ type: Number }
});

module.exports = mongoose.model('Recording', RecordingSchema);

