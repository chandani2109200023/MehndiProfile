const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const adminRoutes = require('./src/routes/adminRoutes.js');
const authRoutes = require('./src/routes/authRoute.js');
const userRoutes = require('./src/routes/userRoutes.js');
const documentRoute = require('./src/routes/documentRoutes.js');
const investmentRoutes = require('./src/routes/investmentRoutes.js');
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ✅ Enable CORS for specific origins
app.use(cors({ origin: "http://localhost:3000" }));

// Routes
app.use('/investment',investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/document', documentRoute);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal server error occurred.' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});
