import express from 'express';
import isoRoutes from './routes/isoRoutes';
import nodeRoutes from './routes/nodeRoutes';
import imageRoutes from './routes/imageRoutes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());


app.use('/isos',isoRoutes);
app.use('/images', imageRoutes);
app.use('/nodes', nodeRoutes);


export default app;