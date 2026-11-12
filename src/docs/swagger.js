import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import __dirname from '../utils/index.js';

const swaggerOptions = {
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'AdoptMe API',
            version: '1.0.0',
            description: 'Documentación del módulo de Usuarios de AdoptMe (Backend III – Coderhouse).'
        },
        servers: [{ url: '/', description: 'Servidor actual' }]
    },
    // utils/index.js exporta la carpeta src/utils; los YAML viven en src/docs/**
    apis: [path.join(__dirname, '..', 'docs', '**', '*.yaml').replace(/\\/g, '/')]
};

const swaggerSpecs = swaggerJSDoc(swaggerOptions);

export default swaggerSpecs;
