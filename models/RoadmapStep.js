const mongoose = require('mongoose');

const RoadmapStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  order: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('RoadmapStep', RoadmapStepSchema); 