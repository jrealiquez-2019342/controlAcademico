'use strict'

import Course from './course.model.js';
import jwt from 'jsonwebtoken';
import User from './../user/user.model.js'

export const test = (req, res) => {
    console.log('course test is running.');
    return res.send({ message: `Course test is running.` })
}

export const save = async (req, res) => {
    try {
        let { token } = req.headers;
        let data = req.body;
        //validamos que la data no venga vacia
        if (Object.entries(data).length === 0) return res.status(400).send({ message: `Empty data` });

        //colocamos el id al curso con el profesor que lo esta creando

        //validar que el curso no exista
        let existing = await Course.findOne({ name: data.name, section: data.section });
        if (existing) return res.status(400).send({ message: `Error | Course already exists.` });

        let { uid } = jwt.verify(token, process.env.SECRET_KEY);

        //validamos que el uid no sea vacio
        if (!uid) return res.status(400).send({ message: `Teacher id not found from token.` })
        data.teacher = uid;
        //creamos el curso
        let course = new Course(data);
        //guardamos en mongo
        await course.save();
        //respondemos
        return res.send({ message: `Successfully created course` })
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: `Error creating course. | `, err: err.errors })
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
            //unicamente podran ver los cursos los alumnos
            //el profesor para ver sus cursos debe usar la ruta myCourses
            /*let resultsTeacher = await Course.find({ teacher: uid });
            return res.send({ resultsTeacher });*/
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

export const updateC = async (req, res) => {
    try {
        let { id } = req.params;
        let data = req.body;

        let updateCourse = await Course.findOneAndUpdate(
            { _id: id },
            data,
            { new: true }
        );

        if (!updateCourse) return res.status(401).send({ message: `Course not found and not updated.` });
        return res.send({ message: `Course updated successfully.` })

    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Error updating.` })
    }
}