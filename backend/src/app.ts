import express from 'express';
import nodeRoutes from './routes/nodeRoutes';
import imageRoutes from './routes/imageRoutes';

const app = express();

app.use(express.json());


app.use('/nodes', nodeRoutes);
app.use('/images', imageRoutes);


export default app;