//Ejecutar sercicios
import { initServer } from './configs/app.js';
import { connect } from './configs/mongo.js';
import { createTeacher } from './src/user/user.controller.js';

initServer();
connect();
createTeacher()