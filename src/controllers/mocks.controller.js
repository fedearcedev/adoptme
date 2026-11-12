import { generatePets, generateUsers } from '../utils/mocking.js';
import { petsService, usersService } from '../services/index.js';

const MAX_QUANTITY = 1000;

// Devuelve el número validado o null si no es un entero entre 0 y MAX_QUANTITY.
const parseQuantity = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > MAX_QUANTITY) return null;
    return number;
};

const getMockingPets = (req, res) => {
    const quantity = parseQuantity(req.query.quantity, 100);
    if (quantity === null) return res.status(400).send({ status: 'error', error: `quantity must be an integer between 0 and ${MAX_QUANTITY}` });
    res.send({ status: 'success', payload: generatePets(quantity) });
};

const getMockingUsers = async (req, res, next) => {
    try {
        const users = await generateUsers(50);
        res.send({ status: 'success', payload: users });
    } catch (error) {
        next(error);
    }
};

// Decisión documentada: users y pets llegan en el BODY (JSON), por ejemplo { "users": 10, "pets": 20 }.
const generateData = async (req, res, next) => {
    try {
        const usersQty = parseQuantity(req.body?.users, 0);
        const petsQty = parseQuantity(req.body?.pets, 0);
        if (usersQty === null || petsQty === null) {
            return res.status(400).send({ status: 'error', error: `users and pets must be integers between 0 and ${MAX_QUANTITY}` });
        }
        if (usersQty === 0 && petsQty === 0) {
            return res.status(400).send({ status: 'error', error: 'Send at least one of users or pets greater than 0' });
        }
        const users = usersQty > 0 ? await usersService.create(await generateUsers(usersQty)) : [];
        const pets = petsQty > 0 ? await petsService.create(generatePets(petsQty)) : [];
        res.status(201).send({
            status: 'success',
            payload: { usersInserted: users.length, petsInserted: pets.length }
        });
    } catch (error) {
        next(error);
    }
};

export default { getMockingPets, getMockingUsers, generateData };
