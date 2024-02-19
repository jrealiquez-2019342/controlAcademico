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

export const courses = async (req, res) => {
    try {

        //recuperar el token
        let { token } = req.headers;

        //validar si es estudiante o profesor
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);
        if (!role) return res.status(400).send({ message: `User role not found from token.` });

        switch (role) {
            case 'TEACHER':
                let resultsTeacher = await Course.find({ teacher: uid });
                return res.send({ resultsTeacher });
            case 'STUDENT':
                let resultsStudent = await Course.find().populate('teacher', ['name', 'surname', 'email']);
                return res.send({ resultsStudent });
        }


    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error showing courses.` })
    }
}

export const myCourses = async (req, res) => {
    try {
        //recuperar el token
        let { token } = req.headers;

        //validar si es estudiante o profesor
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);
        if (!role) return res.status(400).send({ message: `User role not found from token.` });

        switch (role) {
            case 'TEACHER':
                let resultsTeacher = await Course.find({ teacher: uid });
                return res.send({ resultsTeacher });
            case 'STUDENT':
                let { courses } = await User.findOne({ _id: uid }).populate('courses', ['name', 'section']);
                return res.send({ courses });
        }
    } catch (err) {
        console.error(err);

    }
}

export const assignMe = async (req, res) => {
    try {
        let { token } = req.headers;
        let { courses } = req.body;
        console.log(courses);
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);
        if (!role) return res.status(400).send({ message: `User role not found from token.` });


        //validar que tenga menos de tres cursos
        let validate = await User.findOne({ _id: uid });
        let pivotCourses = validate.courses;
        if (pivotCourses.length >= 3) return res.status(400).send({ message: `You have reached the limit to courses` })

        //validar que no me asigne a un curso ya asignado
        if (validate.courses.includes(courses)) {
            return res.status(400).send({ message: `You are already assigned to this course.` });
        }

        //validar que exista el curso
        let course = await Course.findOne({ _id: courses });
        if (!course) return res.status(404).send({ message: `Course not found.` });

        //meter el id del curso a mis cursos (usuario)
        let register = await User.findOneAndUpdate(
            { _id: uid },
            { $push: { courses } },
            { new: true }
        ).populate('courses', ['name', 'section']);
        if (!register) return res.status(400).send({ message: `Error while assigning course to student.` })

        return res.send({ message: `New course asigned`, course });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `ERROR TO ASSIGN` })
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
        //extraer id
        let { id } = req.params;
        //extraer datos a actualizar
        let data = req.body;
        //validar si trae datos y si se pueden modificar.
        if (!checkUpdate(data, id)) return res.status(400).send({ message: `Have submitted some data that cannot be updated or missing data` });

        //actualizar
        let updatedUser = await User.findOneAndUpdate(
            { _id: id },
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


export const deleteU = async () => {
    try {
        let { token } = req.headers;
        let { id } = req.params;
        let { wordCheck } = req.body;
        //validar si esta logeado
        if (!token) return res.status(401).send({ message: `Token is required. | Login required.` })

        //extraer el id y el role
        let { role, uid } = jwt.verify(token, process.env.SECRET_KEY);

        switch (role) {
            case 'TEACHER':
                // Eliminar al profesor y los cursos que tiene a su cargo
                let deletedTeacher = await User.findOneAndDelete({ _id: id });
                if (!deletedTeacher) return res.status(400).send({ message: `Teacher not found and not deleted.` });

                //validar palabra de confirmacion
                if (!wordCheck) return res.status(400).send({ message: `wordCheck IS REQUIRED.` });
                if (wordCheck !== 'CONFIRM') return res.status(400).send({ message: `wordCheck must be -> CONFIRM` });
                
                // Eliminar los cursos del profesor
                let deletedCourses = await Course.deleteMany({ teacher: id });
                if (!deletedCourses) return res.status(400).send({ message: `Courses not found and not deleted.` });

                // Desvincular a los alumnos de los cursos del profesor
                await Promise.all(deletedCourses.map(async (course) => {
                    await User.updateMany({ courses: course._id }, { $pull: { courses: course._id } });
                }));

                return res.send({ message: `Teacher with username @${deletedTeacher.username} deleted successfully along with associated courses.` });
            case 'STUDENT':
                //validar palabra de confirmacion
                if (!wordCheck) return res.status(400).send({ message: `wordCheck IS REQUIRED.` });
                if (wordCheck !== 'CONFIRM') return res.status(400).send({ message: `wordCheck must be -> CONFIRM` });

                //eliminar (usuario)
                let deleted = await User.findOneAndDelete({ _id: id });
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

