// seeds.js
const mongoose = require('mongoose');
const CodeBlock = require('./models/CodeBlock');

mongoose.connect('mongodb://localhost:27017/codeapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB for seeding");
}).catch(err => console.error(err));

const codeBlocks = [
  {
    name: "Async Case",
    initialTemplate: "async function example() {\n  // your code here\n}",
    solution: "async function example() {\n  try {\n    let result = await Promise.resolve('Success');\n    return result;\n  } catch (err) {\n    throw err;\n  }\n}"
  },
  {
    name: "Callback Hell",
    initialTemplate: "function callbackHell() {\n  // your code here\n}",
    solution: "function callbackHell() {\n  setTimeout(() => {\n    console.log('Solved');\n  }, 1000);\n}"
  },
  {
    name: "Promise Chain",
    initialTemplate: "function promiseChain() {\n  // your code here\n}",
    solution: "function promiseChain() {\n  Promise.resolve()\n    .then(() => console.log('Solved'));\n}"
  },
  {
    name: "Event Loop Demo",
    initialTemplate: "function eventLoopDemo() {\n  // your code here\n}",
    solution: "function eventLoopDemo() {\n  console.log('Start');\n  setTimeout(() => {\n    console.log('End');\n  }, 0);\n  console.log('Middle');\n}"
  },
];

async function seed() {
  try {
    await CodeBlock.deleteMany({});
    await CodeBlock.insertMany(codeBlocks);
    console.log("Seeding successful!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
