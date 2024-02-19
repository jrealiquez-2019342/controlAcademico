import { Router } from 'express';
import { validateJwt, isTeacher, isStudent,} from '../middlewares/validate-jwt.js';
import { test, save, courses} from './course.controller.js';

const api = Router();

//rutas publicas
api.get('/test', [validateJwt, isTeacher], test);

//rutas privadas
api.post('/create', [validateJwt, isTeacher],save);

api.get('/allcourses', [validateJwt], courses);

export default api;