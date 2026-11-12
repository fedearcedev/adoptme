import mongoose from 'mongoose';
import { adoptionsService, petsService, usersService } from "../services/index.js"

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAllAdoptions = async (req, res, next) => {
    try {
        const result = await adoptionsService.getAll();
        res.send({ status: "success", payload: result })
    } catch (error) {
        next(error);
    }
}

const getAdoption = async (req, res, next) => {
    try {
        const adoptionId = req.params.aid;
        if (!isValidId(adoptionId)) return res.status(400).send({ status: "error", error: "Invalid adoption id" })
        const adoption = await adoptionsService.getBy({ _id: adoptionId })
        if (!adoption) return res.status(404).send({ status: "error", error: "Adoption not found" })
        res.send({ status: "success", payload: adoption })
    } catch (error) {
        next(error);
    }
}

const createAdoption = async (req, res, next) => {
    try {
        const { uid, pid } = req.params;
        if (!isValidId(uid)) return res.status(400).send({ status: "error", error: "Invalid user id" });
        if (!isValidId(pid)) return res.status(400).send({ status: "error", error: "Invalid pet id" });
        const user = await usersService.getUserById(uid);
        if (!user) return res.status(404).send({ status: "error", error: "user Not found" });
        const pet = await petsService.getBy({ _id: pid });
        if (!pet) return res.status(404).send({ status: "error", error: "Pet not found" });
        if (pet.adopted) return res.status(400).send({ status: "error", error: "Pet is already adopted" });
        user.pets.push(pet._id);
        await usersService.update(user._id, { pets: user.pets })
        await petsService.update(pet._id, { adopted: true, owner: user._id })
        const adoption = await adoptionsService.create({ owner: user._id, pet: pet._id })
        res.send({ status: "success", message: "Pet adopted", payload: adoption })
    } catch (error) {
        next(error);
    }
}

export default {
    createAdoption,
    getAllAdoptions,
    getAdoption
}
