var express = require('express')
var router = express.Router()
var knex = require('knex')
var connection = require('../config/database')
const {
  login,
  signup,
  logout,
  loginPage,
  signupPage,
} = require('../controllers/userController')

router.route('/login').get(loginPage).post(login)

router.route('/signup').get(signupPage).post(signup)

router.get('/logout', logout)

module.exports = router
