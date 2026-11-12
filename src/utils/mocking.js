import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { createHash } from './index.js';

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'turtle'];

// Hashear con bcrypt es lento a propósito. Como los 50 usuarios comparten
// la contraseña "coder123", se hashea una sola vez y se reutiliza el hash.
let cachedHash = null;
const getMockPasswordHash = async () => {
    if (!cachedHash) cachedHash = await createHash('coder123');
    return cachedHash;
};

const buildEmail = (firstName, lastName) => {
    const clean = (text) => text.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    // Dominio example.com: reservado para ejemplos, nunca pertenece a una persona real.
    return `${clean(firstName)}.${clean(lastName)}.${faker.string.alphanumeric(6).toLowerCase()}@example.com`;
};

// Formato "como lo entregaría Mongo": incluye _id (ObjectId) y __v.
export const generateUsers = async (quantity) => {
    const password = await getMockPasswordHash();
    return Array.from({ length: quantity }, () => {
        const first_name = faker.person.firstName();
        const last_name = faker.person.lastName();
        return {
            _id: new mongoose.Types.ObjectId(),
            first_name,
            last_name,
            email: buildEmail(first_name, last_name),
            password,
            role: faker.helpers.arrayElement(['user', 'admin']),
            pets: [],
            __v: 0
        };
    });
};

export const generatePets = (quantity) => {
    return Array.from({ length: quantity }, () => ({
        _id: new mongoose.Types.ObjectId(),
        name: faker.animal.petName(),
        specie: faker.helpers.arrayElement(SPECIES),
        birthDate: faker.date.past({ years: 12 }),
        adopted: false,
        image: '',
        __v: 0
    }));
};
