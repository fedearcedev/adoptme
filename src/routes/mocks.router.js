import { Router } from 'express';
import mocksController from '../controllers/mocks.controller.js';
import config from '../config/config.js';

const router = Router();

// Las rutas de mocks escriben datos falsos en la base: en producción no existen.
router.use((req, res, next) => {
    if (config.nodeEnv === 'production') return res.status(404).send({ status: 'error', error: 'Route not found' });
    next();
});

router.get('/mockingpets', mocksController.getMockingPets);
router.get('/mockingusers', mocksController.getMockingUsers);
router.post('/generateData', mocksController.generateData);

export default router;
