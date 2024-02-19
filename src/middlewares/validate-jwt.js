'use strict'

import jwt from 'jsonwebtoken';
import User from './../user/user.model.js';

export const validateJwt = async(req, res, next)=>{
    try {
        let secretKey = process.env.SECRET_KEY;
        let {token} = req.headers;
        //console.log(token);
        if(!token) return res.status(401).send({message:`Unauthorized`});
        let {uid} = jwt.verify(token, secretKey);
        let user = await User.findOne({_id: uid});
        if(!user) return res.status(404).send({message:`User not found - Unauthorized.`});
        req.user = user;
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send({message:`Invalid token`})
    }
}

export const isTeacher = async(req, res, next)=>{
    try {
        let {user} = req;//req que ya tenemos
        if(!user || user.role !== 'TEACHER') return res.status(403).send({message:`You dont have access. | username: ${user.username}`});
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({message:`Unauthorized role`})
    }
}

export const isStudent = async(req, res, next)=>{
    try {
        let {user} = req;//req que ya tenemos
        if(!user || user.role !== 'STUDENT') return res.status(403).send({message:`You dont have access. | username: ${user.username}`});
        next();
    } catch (err) {
        console.error(err);
        return res.status(403).send({message:`Unauthorized role`})
    }
}