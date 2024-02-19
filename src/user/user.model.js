import {Schema, model} from "mongoose";

const userSchema = Schema({
    name:{
        type: String,
        required: [true, 'Name is required.']
    },
    surname: {
        type: String,
        required: [true, 'Surname is required.']
    },
    username: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, 'Username is required.']
    },
    password:{
        type: String,
        minLength: [8, 'Password must be 8 characters'],
        required: [true, 'Password is required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.']
    },
    phone:{
        type: String,
        minLength: 8,
        maxLength: 8,
        required: [true, 'Phone is required.']
    },
    role:{
        type: String,
        uppercase: true,
        enum: ['TEACHER', 'STUDENT'],
        required: [true, 'Role is required.']
    },
    courses:[{
        type: Schema.Types.ObjectId,
        ref: 'Course'
    }]
}, {
    versionKey: false
});

export default model('User', userSchema)