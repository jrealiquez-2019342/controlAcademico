'use strict'

import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import {config} from 'dotenv';
//importar rutas de los modelos.
import userRoutes from './../src/user/user.routes.js';
import courseRoutes from './../src/course/course.routes.js';

//configuracion
const app = express();
config();
const port = process.env.PORT || 3056;

//configuracion del servidor
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

//agregar rutas de los modelos
app.use('/user', userRoutes);
app.use('/course', courseRoutes);

export const initServer = ()=>{
    app.listen(port);
    console.log(`Server is running in port ${port}`);
}
