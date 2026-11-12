import { expect } from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';

import app from '../src/app.js';
import userModel from '../src/dao/models/User.js';
import petModel from '../src/dao/models/Pet.js';
import adoptionModel from '../src/dao/models/Adoption.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from './helpers/db.js';

const requester = supertest(app);

// Un ObjectId válido que no existe en la base: sirve para los casos 404.
const nonExistentId = () => new mongoose.Types.ObjectId().toString();

const createUser = (overrides = {}) => userModel.create({
    first_name: 'Test',
    last_name: 'User',
    email: `test.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'hash-de-prueba',
    ...overrides
});

const createPet = (overrides = {}) => petModel.create({
    name: 'Firulais',
    specie: 'dog',
    birthDate: new Date('2020-01-01'),
    ...overrides
});

describe('Tests funcionales del router de adopciones (/api/adoptions)', function () {
    before(async function () {
        await connectTestDB();
    });

    beforeEach(async function () {
        await clearTestDB();
    });

    after(async function () {
        await disconnectTestDB();
    });

    describe('GET /api/adoptions', function () {
        it('devuelve 200 y un array vacío cuando no hay adopciones', async function () {
            const { statusCode, body } = await requester.get('/api/adoptions');

            expect(statusCode).to.equal(200);
            expect(body.status).to.equal('success');
            expect(body.payload).to.be.an('array').that.is.empty;
        });

        it('devuelve 200 y todas las adopciones existentes', async function () {
            const user = await createUser();
            const petA = await createPet({ name: 'Michi', specie: 'cat' });
            const petB = await createPet({ name: 'Rocco' });
            await adoptionModel.create([{ owner: user._id, pet: petA._id }, { owner: user._id, pet: petB._id }]);

            const { statusCode, body } = await requester.get('/api/adoptions');

            expect(statusCode).to.equal(200);
            expect(body.status).to.equal('success');
            expect(body.payload).to.be.an('array').with.lengthOf(2);
            body.payload.forEach((adoption) => {
                expect(adoption).to.have.all.keys('_id', 'owner', 'pet', '__v');
                expect(adoption.owner).to.equal(user._id.toString());
            });
        });
    });

    describe('GET /api/adoptions/:aid', function () {
        it('devuelve 200 y la adopción cuando el id existe', async function () {
            const user = await createUser();
            const pet = await createPet();
            const adoption = await adoptionModel.create({ owner: user._id, pet: pet._id });

            const { statusCode, body } = await requester.get(`/api/adoptions/${adoption._id}`);

            expect(statusCode).to.equal(200);
            expect(body.status).to.equal('success');
            expect(body.payload._id).to.equal(adoption._id.toString());
            expect(body.payload.owner).to.equal(user._id.toString());
            expect(body.payload.pet).to.equal(pet._id.toString());
        });

        it('devuelve 404 cuando la adopción no existe', async function () {
            const { statusCode, body } = await requester.get(`/api/adoptions/${nonExistentId()}`);

            expect(statusCode).to.equal(404);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Adoption not found');
        });

        it('devuelve 400 cuando el id no tiene formato de ObjectId', async function () {
            const { statusCode, body } = await requester.get('/api/adoptions/id-invalido');

            expect(statusCode).to.equal(400);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Invalid adoption id');
        });
    });

    describe('POST /api/adoptions/:uid/:pid', function () {
        it('devuelve 200, crea la adopción y actualiza usuario y mascota', async function () {
            const user = await createUser();
            const pet = await createPet();

            const { statusCode, body } = await requester.post(`/api/adoptions/${user._id}/${pet._id}`);

            expect(statusCode).to.equal(200);
            expect(body.status).to.equal('success');
            expect(body.message).to.equal('Pet adopted');
            expect(body.payload).to.have.property('_id');

            // Efectos en la base: la mascota queda adoptada y con dueño...
            const petInDb = await petModel.findById(pet._id).lean();
            expect(petInDb.adopted).to.be.true;
            expect(petInDb.owner.toString()).to.equal(user._id.toString());

            // ...el usuario la tiene en su lista de mascotas...
            const userInDb = await userModel.findById(user._id).lean();
            expect(userInDb.pets.map((p) => p._id.toString())).to.include(pet._id.toString());

            // ...y existe el registro de adopción, recuperable por el GET.
            const adoptions = await adoptionModel.find({ owner: user._id, pet: pet._id }).lean();
            expect(adoptions).to.have.lengthOf(1);
            const { statusCode: getStatus } = await requester.get(`/api/adoptions/${adoptions[0]._id}`);
            expect(getStatus).to.equal(200);
        });

        it('devuelve 400 cuando la mascota ya fue adoptada y no crea otra adopción', async function () {
            const firstOwner = await createUser();
            const secondUser = await createUser();
            const pet = await createPet();
            await requester.post(`/api/adoptions/${firstOwner._id}/${pet._id}`).expect(200);

            const { statusCode, body } = await requester.post(`/api/adoptions/${secondUser._id}/${pet._id}`);

            expect(statusCode).to.equal(400);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Pet is already adopted');
            expect(await adoptionModel.countDocuments()).to.equal(1);
            const petInDb = await petModel.findById(pet._id).lean();
            expect(petInDb.owner.toString()).to.equal(firstOwner._id.toString());
        });

        it('devuelve 404 cuando el usuario no existe', async function () {
            const pet = await createPet();

            const { statusCode, body } = await requester.post(`/api/adoptions/${nonExistentId()}/${pet._id}`);

            expect(statusCode).to.equal(404);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('user Not found');
            expect(await adoptionModel.countDocuments()).to.equal(0);
        });

        it('devuelve 404 cuando la mascota no existe', async function () {
            const user = await createUser();

            const { statusCode, body } = await requester.post(`/api/adoptions/${user._id}/${nonExistentId()}`);

            expect(statusCode).to.equal(404);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Pet not found');
            expect(await adoptionModel.countDocuments()).to.equal(0);
        });

        it('devuelve 400 cuando el id de usuario no es válido', async function () {
            const pet = await createPet();

            const { statusCode, body } = await requester.post(`/api/adoptions/usuario-invalido/${pet._id}`);

            expect(statusCode).to.equal(400);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Invalid user id');
        });

        it('devuelve 400 cuando el id de mascota no es válido', async function () {
            const user = await createUser();

            const { statusCode, body } = await requester.post(`/api/adoptions/${user._id}/mascota-invalida`);

            expect(statusCode).to.equal(400);
            expect(body.status).to.equal('error');
            expect(body.error).to.equal('Invalid pet id');
        });

        it('devuelve 404 cuando falta el id de mascota en la ruta', async function () {
            const user = await createUser();

            const { statusCode, body } = await requester.post(`/api/adoptions/${user._id}`);

            expect(statusCode).to.equal(404);
            expect(body.status).to.equal('error');
        });
    });
});
