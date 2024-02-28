'use strict'
import { generateJwt } from './../utils/jwt.js';
import { checkPassword, checkUpdate, encrypt } from './../utils/validator.js';
import User from './user.model.js';
import Course from './../course/course.model.js';
import jwt from 'jsonwebtoken';

export const test = (req, res) => {
    console.log('user test is running.')
    return res.send({ message: `User test is running.` });
}

export const registerTeacher = async (req, res) => {
    try {
        let data = req.body;

        //validar que no haya un user existente
        let findUser = await User.findOne({ username: data.user });
        if (findUser) return res.status(409).send({ message: `Username already exists.` });
        //validar que el correo no este en uso
        let findEmail = await User.findOne({ email: data.email });
        if (findEmail) return res.status(409).send({ message: `Email already in use.` })

        //encriptar la contrasenia
        data.password = await encrypt(data.password);

        //si el no ingreso role, le asignamos uno por defecto
        if (!data.role) data.role = 'TEACHER';

        //creamos nuestro usuario
        let user = new User(data);
        //guardamos en mongo
        await user.save();
        //respondemos al usuario
        return res.send({ message: `Registered successfully. \nCan be logged with username ${user.username}` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error registering user. | `, err: err.errors })
    }
}

export const registerStudent = async (req, res) => {
    try {
        let data = req.body;

        //validar que no haya un user existente
        let findUser = await User.findOne({ username: data.username });
        if (findUser) return res.status(409).send({ message: `Username already exists.` });
        //validar que el correo no este en uso
        let findEmail = await User.findOne({ email: data.email });
        if (findEmail) return res.status(409).send({ message: `Email already in use.` })

        //encriptar la contrasenia
        data.password = await encrypt(data.password);

        //le asignamos rol por defecto
        data.role = 'STUDENT';
        //creamos nuestro usuario
        let user = new User(data);
        //guardamos en mongo
        await user.save();
        //respondemos al usuario
        return res.send({ message: `Registered successfully. \nCan be logged with username ${user.username}` });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error registering user. | `, err: err.errors })
    }
}



export const login = async (req, res) => {
    try {
        let { username, password } = req.body;
        let user = await User.findOne({ username });
        if (!user) return res.status(404).send({ message: `Invalid credentials.` })

        if (await checkPassword(password, user.password)) {
            let loggedUser = {
                uid: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }

            //generar el token y enviarlo como respuesta.
            let token = await generateJwt(loggedUser);
            return res.send({
                message: `WELCOME ${user.username}`,
                loggedUser,
                token
            })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `ERROR IN LOGIN` });
    }
}

export const update = async (req, res) => {
    try {
        //extraer token
        let { token } = req.headers;

        //validar si es estudiante o profesor
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);

        //extraer datos a actualizar
        let data = req.body;

        switch (role) {
            case 'TEACHER':
                //validar si trae datos y si se pueden modificar.
                if (!checkUpdate(data, false)) return res.status(400).send({ message: `Have submitted some data that cannot be updated or missing data` });
                break;
            case 'STUDENT':
                //validar si trae datos y si se pueden modificar.
                if (!checkUpdate(data, uid)) return res.status(400).send({ message: `Have submitted some data that cannot be updated or missing data` });
                break;
        }

        //actualizar
        let updatedUser = await User.findOneAndUpdate(
            { _id: uid },
            data,
            { new: true }
        )
        if (!updatedUser) return res.status(401).send({ message: `User not found and not updated.` });
        return res.send({ message: `Update user`, updatedUser });
    } catch (err) {
        console.error(err);
        if (err.keyValue.username) return res.status(400).send({ message: `Username @${err.keyValue.username} is al ready token.` })
        return res.status(500).send({ message: `Error updating profile.` })
    }
}


export const deleteU = async (req, res) => {
    try {
        let { token } = req.headers;
        let { wordCheck } = req.body;
        //validar si esta logeado
        if (!token) return res.status(401).send({ message: `Token is required. | Login required.` })

        //extraer el id y el role
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);

        switch (role) {
            case 'TEACHER':

                //validar palabra de confirmacion
                if (!wordCheck) return res.status(400).send({ message: `wordCheck IS REQUIRED.` });
                if (wordCheck !== 'CONFIRM') return res.status(400).send({ message: `wordCheck must be -> CONFIRM` });

                // Encontrar los cursos del profesor
                let coursesToDelete = await Course.find({ teacher: uid });

                // Verificar si se encontraron cursos para eliminar
                if (coursesToDelete.length === 0) return res.status(404).send({ message: `No courses found for teacher ${uid}.` });

                // Desvincular a los alumnos de los cursos del profesor
                await Promise.all(coursesToDelete.map(async (course) => {
                    await User.updateMany({ courses: course._id }, { $pull: { courses: course._id } });
                }));

                // Eliminar los cursos del profesor
                let deletedCourses = await Course.deleteMany({ teacher: uid });

                // Eliminar al profesor
                let deletedTeacher = await User.findOneAndDelete({ _id: uid });
                if (!deletedTeacher) {
                    return res.status(404).send({ message: `Teacher not found.` });
                }

                return res.send({ message: `Teacher with username @${deletedTeacher.username} deleted successfully along with associated courses.` });

            case 'STUDENT':
                //validar palabra de confirmacion
                if (!wordCheck) return res.status(400).send({ message: `wordCheck in body IS REQUIRED.` });
                if (wordCheck !== 'CONFIRM') return res.status(400).send({ message: `wordCheck must be -> CONFIRM` });

                //eliminar (usuario)
                let deleted = await User.findOneAndDelete({ _id: uid });
                //verificar que se elimino
                if (!deleted) return res.status(400).send({ message: `Profule not found and not deleted.` });
                return res.send({ message: `Account with username @${deleted.username} deleted successfully.` });
        }

    } catch (err) {
        console.error(err);

    }
}

export const createTeacher = async () => {
    try {
        let user = await User.findOne({ username: 'jnoj' });
        if (!user) {
            console.log('Creando profesor...')
            let teacher = new User({
                name: 'Josue',
                surname: 'Noj',
                username: 'jnoj',
                password: '12345',
                email: 'jnoj@kinal.org.gt',
                phone: '87654321',
                role: 'TEACHER'
            });
            teacher.password = await encrypt(teacher.password);
            await teacher.save();
            return console.log({ message: `Registered successfully. \nCan be logged with username ${teacher.username}` })
        }
        console.log({ message: `Can be logged with username ${user.username}` });

    } catch (err) {
        console.error(err);
        return err;
    }
}

