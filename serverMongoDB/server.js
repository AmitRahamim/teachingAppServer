// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const CodeBlock = require('./models/CodeBlock');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB 
mongoose
  .connect(process.env.MONGO_URL || 'mongodb://localhost:27017/codeapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

// Object to track rooms and their state
const rooms = {};

//  Express Endpoints//

// Get all code blocks 
app.get('/api/codeblocks', async (req, res) => {
  try {
    const codeBlocks = await CodeBlock.find();
    res.json(codeBlocks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single code block by ID
app.get('/api/codeblocks/:id', async (req, res) => {
  try {
    const codeBlock = await CodeBlock.findById(req.params.id);
    if (!codeBlock) return res.status(404).json({ error: 'Not found' });
    res.json(codeBlock);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);

    
    if (!rooms[roomId]) {
      rooms[roomId] = { mentor: null, students: {}, currentCode: null };
    }
    const room = rooms[roomId];

    // first client becomes mentor, others become students with a student number.
    let role = 'student';
    if (!room.mentor) {
      room.mentor = socket.id;
      role = 'mentor';
      socket.userName = 'Mentor';
    } else {
      if (!room.nextStudentNumber) room.nextStudentNumber = 1;
      socket.userName = `Student ${room.nextStudentNumber}`;
      room.students[socket.id] = socket.userName;
      room.nextStudentNumber++;
    }

    console.log(`Socket ${socket.id} assigned role: ${role} (${socket.userName}) in room ${roomId}`);
    socket.emit('roleAssigned', { role, userName: socket.userName });

    // If the room already has a code update, send it to the newly joined client
    if (room.currentCode) {
      socket.emit('updateCode', { code: room.currentCode });
    }

    // Update student count in the room
    io.to(roomId).emit('studentCount', { count: Object.keys(room.students).length });

    // When a client makes a code change, update the room state and broadcast the change.
    socket.on('codeChange', (data) => {
      room.currentCode = data.code;
      socket.to(roomId).emit('updateCode', { code: data.code });
    });

    // Listen for chat messages and broadcast using the assigned userName
    socket.on('chatMessage', (data) => {
      const senderName = socket.userName || 'Unknown';
      io.to(roomId).emit('chatMessage', { sender: senderName, message: data.message });
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (room.mentor === socket.id) {
        io.to(roomId).emit('mentorLeft');
        delete rooms[roomId]; // Clear room when mentor leaves
      } else {
        delete room.students[socket.id];
        io.to(roomId).emit('studentCount', { count: Object.keys(room.students).length });
      }
    });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
