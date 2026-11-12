import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Los tests NUNCA usan la base de desarrollo ni la de producción.
// Por defecto levantan un MongoDB en memoria que se descarta al terminar.
// Si preferís una base de test propia, definí MONGO_URL_TEST.
let memoryServer = null;

export const connectTestDB = async () => {
    let uri = process.env.MONGO_URL_TEST;
    if (!uri) {
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri('adoptme_test');
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
};

export const clearTestDB = async () => {
    const collections = Object.values(mongoose.connection.collections);
    for (const collection of collections) {
        await collection.deleteMany({});
    }
};

export const disconnectTestDB = async () => {
    await clearTestDB();
    await mongoose.disconnect();
    if (memoryServer) await memoryServer.stop();
};
