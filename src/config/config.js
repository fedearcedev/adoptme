import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Ningún secreto vive en el código: todo sale de variables de entorno.
export default {
    port: process.env.PORT || 8080,
    mongoUrl: process.env.MONGO_URL,
    jwtSecret: process.env.JWT_SECRET || 'cambiar-este-secreto',
    nodeEnv: process.env.NODE_ENV || 'development'
};
