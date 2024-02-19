import {Schema, model} from 'mongoose'

export const courseShema = Schema({
    name:{
        type: String,
        require: [true, 'Name is required.']
    },
    section:{
        type: String,
        require: [true, 'Section is required.']
    },
    teacher:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Teacher/user is required.']
    }
},{
    versionKey: false
});

export default model('Course', courseShema);