import { Router } from 'express';
import { validateJwt, isTeacher, isStudent, } from '../middlewares/validate-jwt.js';
import { test, save, courses, myCourses, assignMe, updateC } from './course.controller.js';

const api = Router();

//rutas publicas
api.get('/test', [validateJwt, isTeacher], test);

//rutas privadas - COMPARTIDAS
api.get('/myCourses', [validateJwt], myCourses);

//rutas privadas - PROFESOR
api.post('/create', [validateJwt, isTeacher], save);
api.put('/updateCourse/:id', [validateJwt, isTeacher],  updateC);

//rutas privadas - ESTUDIANTE
api.put('/assignMe', [validateJwt, isStudent], assignMe);
api.get('/courses', [validateJwt, isStudent], courses);

export default api;