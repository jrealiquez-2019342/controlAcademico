'use strict'

import Course from './course.model.js';
import jwt from 'jsonwebtoken';

export const test = (req, res)=>{
    console.log('course test is running.');
    return res.send({message: `Course test is running.`})
}

export const save = async (req, res) => {
    try {
        let {token} = req.headers;
        let data = req.body;
        //validamos que la data no venga vacia
        if (!data) return res.status(400).send({ message: `Empty data` });
        //colocamos el id al curso con el profesor que lo esta creando

        //validar que el curso no exista
        let existing = await Course.findOne({name:data.name, section: data.section});
        if(existing) return res.status(400).send({message:`Error | Course already exists.`});

        let {uid} = jwt.verify(token, process.env.SECRET_KEY);

        //validamos que el uid no sea vacio
        if(!uid) return res.status(400).send({message:`Teacher id not found from token.`})
        data.teacher = uid;
        //creamos el curso
        let course = new Course(data);
        //guardamos en mongo
        await course.save();
        //respondemos
        return res.send({message: `Successfully created course`})
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