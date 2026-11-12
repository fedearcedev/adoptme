import { expect } from 'chai';
import supertest from 'supertest';
import bcrypt from 'bcrypt';

import app from '../src/app.js';
import { connectTestDB, clearTestDB, disconnectTestDB } from './helpers/db.js';

const requester = supertest(app);

describe('Tests del router de mocks (/api/mocks)', function () {
    before(async function () {
        await connectTestDB();
    });

    beforeEach(async function () {
        await clearTestDB();
    });

    after(async function () {
        await disconnectTestDB();
    });

    it('GET /mockingpets devuelve mascotas generadas', async function () {
        const { statusCode, body } = await requester.get('/api/mocks/mockingpets');
        expect(statusCode).to.equal(200);
        expect(body.payload).to.be.an('array').with.lengthOf(100);
        expect(body.payload[0]).to.include.keys('_id', 'name', 'specie', 'adopted');
    });

    it('GET /mockingusers devuelve 50 usuarios con formato Mongo y password hasheada', async function () {
        const { statusCode, body } = await requester.get('/api/mocks/mockingusers');
        expect(statusCode).to.equal(200);
        expect(body.payload).to.be.an('array').with.lengthOf(50);
        const user = body.payload[0];
        expect(user).to.include.keys('_id', 'first_name', 'last_name', 'email', 'password', 'role', 'pets');
        expect(user.pets).to.be.an('array').that.is.empty;
        expect(['user', 'admin']).to.include(user.role);
        expect(await bcrypt.compare('coder123', user.password)).to.be.true;
    });

    it('POST /generateData inserta usuarios y mascotas consultables por los GET', async function () {
        const { statusCode, body } = await requester.post('/api/mocks/generateData').send({ users: 5, pets: 8 });
        expect(statusCode).to.equal(201);
        expect(body.payload).to.deep.equal({ usersInserted: 5, petsInserted: 8 });

        const users = await requester.get('/api/users');
        const pets = await requester.get('/api/pets');
        expect(users.body.payload).to.have.lengthOf(5);
        expect(pets.body.payload).to.have.lengthOf(8);
        users.body.payload.forEach((u) => expect(u).to.not.have.property('password'));
    });

    it('POST /generateData rechaza cantidades inválidas con 400', async function () {
        for (const body of [{ users: -3 }, { users: 'abc' }, { pets: 1.5 }, {}]) {
            const res = await requester.post('/api/mocks/generateData').send(body);
            expect(res.statusCode).to.equal(400);
            expect(res.body.status).to.equal('error');
        }
    });
});
