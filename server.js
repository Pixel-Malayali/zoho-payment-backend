import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import oauthRoutes from './routes/oauth.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['https://www.pixelmalayali.com', 'https://pixelmalayali.blogspot.com']
}));

// Base root check route
app.get('/', (req, res) => {
  res.send('Zoho Payments Backend is running successfully!');
});

// Mount Routes
app.use('/', oauthRoutes);
app.use('/', paymentRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
