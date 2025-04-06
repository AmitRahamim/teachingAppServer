// models/CodeBlock.js
const mongoose = require('mongoose');

const CodeBlockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  initialTemplate: { type: String, required: true },
  solution: { type: String, required: true },
});

module.exports = mongoose.model('CodeBlock', CodeBlockSchema);
