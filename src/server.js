import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';

const start = async () => {
    if (!config.mongoUrl) {
        console.error('Falta la variable de entorno MONGO_URL. Copiá .env.example a .env y completala.');
        process.exit(1);
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUrl);
    console.log('Conectado a MongoDB');
    app.listen(config.port, () => console.log(`Listening on ${config.port}`));
};

start().catch((error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
});
