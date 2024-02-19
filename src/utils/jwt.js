'use strict'

import jwt from 'jsonwebtoken';
const secretKey = '@LlaveSecretaParaControlAcademicoIN6AM@'

export const generateJwt = async(payload)=>{
    try {
        return jwt.sign(payload, secretKey, {
            expiresIn: '1h',
            algorithm: 'HS256'
        })
    } catch (err) {
        console.error(err);
        return err;
    }
}