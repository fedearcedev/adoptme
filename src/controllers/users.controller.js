import mongoose from 'mongoose';
import { usersService } from "../services/index.js"

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Nunca devolvemos el hash de la contraseña en una respuesta.
const sanitize = (user) => {
    const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete plain.password;
    return plain;
};

const getAllUsers = async (req, res, next) => {
    try {
        const users = await usersService.getAll();
        res.send({ status: "success", payload: users.map(sanitize) })
    } catch (error) {
        next(error);
    }
}

const getUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;
        if (!isValidId(userId)) return res.status(400).send({ status: "error", error: "Invalid user id" })
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).send({ status: "error", error: "User not found" })
        res.send({ status: "success", payload: sanitize(user) })
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;
        if (!isValidId(userId)) return res.status(400).send({ status: "error", error: "Invalid user id" })
        // El rol y la contraseña no se cambian por esta ruta.
        const { first_name, last_name, email } = req.body;
        const updateBody = Object.fromEntries(
            Object.entries({ first_name, last_name, email }).filter(([, value]) => value !== undefined)
        );
        if (Object.keys(updateBody).length === 0) return res.status(400).send({ status: "error", error: "Nothing to update" })
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).send({ status: "error", error: "User not found" })
        await usersService.update(userId, updateBody);
        res.send({ status: "success", message: "User updated" })
    } catch (error) {
        next(error);
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;
        if (!isValidId(userId)) return res.status(400).send({ status: "error", error: "Invalid user id" })
        const user = await usersService.getUserById(userId);
        if (!user) return res.status(404).send({ status: "error", error: "User not found" })
        await usersService.delete(userId);
        res.send({ status: "success", message: "User deleted" })
    } catch (error) {
        next(error);
    }
}

export default {
    deleteUser,
    getAllUsers,
    getUser,
    updateUser
}
