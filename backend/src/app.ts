import express from 'express';
import adminRoutes from './routes/adminRoutes';
import isoRoutes from './routes/isoRoutes';
import nodeRoutes from './routes/nodeRoutes';
import imageRoutes from './routes/imageRoutes';
import logRoutes from './routes/logRoutes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/admins',adminRoutes);
app.use('/isos',isoRoutes);
app.use('/images', imageRoutes);
app.use('/nodes', nodeRoutes);
app.use('/logs',logRoutes);

export default app;