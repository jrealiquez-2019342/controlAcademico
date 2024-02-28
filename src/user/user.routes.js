import { Router } from "express";
//importar funcionalidades del controlador.
import { validateJwt, isTeacher, isStudent } from "../middlewares/validate-jwt.js";
import { test, login, registerTeacher, registerStudent, deleteU, update } from "./user.controller.js";

const api = Router();

//rutas publicas
api.post('/login', login);
api.post('/registerTeacher', registerTeacher);
api.post('/registerStudent', registerStudent);



//rutas privadas
api.get('/test', [validateJwt, isTeacher], test);
api.delete('/delete', [validateJwt],deleteU);
api.put('/update', [validateJwt], update);

export default api;