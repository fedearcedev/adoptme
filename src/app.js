import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import usersRouter from './routes/users.router.js';
import petsRouter from './routes/pets.router.js';
import adoptionsRouter from './routes/adoption.router.js';
import sessionsRouter from './routes/sessions.router.js';
import mocksRouter from './routes/mocks.router.js';
import swaggerSpecs from './docs/swagger.js';
import errorHandler from './middlewares/errorHandler.js';

// La app se exporta sin escuchar en ningún puerto: así los tests
// la importan con Supertest y server.js es quien la levanta.
const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send({ status: 'success', message: 'AdoptMe API. Documentación en /api/docs' }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/users', usersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/adoptions', adoptionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/mocks', mocksRouter);

app.use((req, res) => res.status(404).send({ status: 'error', error: 'Route not found' }));
app.use(errorHandler);

export default app;
