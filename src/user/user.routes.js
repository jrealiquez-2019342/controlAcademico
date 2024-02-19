import { Router } from "express";
//importar funcionalidades del controlador.
import { validateJwt, isTeacher, isStudent } from "../middlewares/validate-jwt.js";
import { test, login, myCourses, assignMe,registerTeacher, registerStudent, courses } from "./user.controller.js";

const api = Router();

//rutas publicas
api.post('/login', login);
api.post('/registerTeacher', registerTeacher);
api.post('/registerStudent', registerStudent);
api.get('/test', [validateJwt, isTeacher], test);


//rutas privadas
api.get('/courses', [validateJwt],courses);
api.get('/myCourses', [validateJwt], myCourses);
api.put('/assignMe', [validateJwt, isStudent],assignMe);


export default api;