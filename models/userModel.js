const mongoose = require('mongoose')
const db = require('../config/database')
const bcrypt = require('bcrypt')

db()

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add the username'],
    },
    password: {
        type: String,
        required: [true, 'Please add the user password'],
    },
    email: {
        type: String,
        required: [true, 'Please add the user email'],
    },
    token: {
        type: String,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
})

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

const User = new mongoose.model('User_Accounts', UserSchema)

module.exports = User