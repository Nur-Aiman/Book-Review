var express = require('express')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const saltRounds = 10
var router = express.Router()
var knex = require('knex')
var connection = require('../config/database')
const jwt = require('jsonwebtoken')
const jwtSecret = process.env.ACCESS_TOKEN_SECRET
require('dotenv').config()

module.exports = {
  // @desc Register a user
  // @route POST /api/users/signup
  // @access public
  signup: async function signup(req, res) {
    const email = req.body.email

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      req.flash('error', 'Invalid email format')
      return res.redirect('/api/users/signup')
    }

    User.findOne({ email: email })
      .then((existingUser) => {
        if (existingUser) {
          req.flash('error', 'Email already in use')
          res.redirect('/api/users/signup')
        } else {
          const data = {
            name: req.body.name,
            password: bcrypt.hashSync(req.body.password, saltRounds),
            email: email,
            token: '',
          }

          const token = jwt.sign({ email: data.email }, jwtSecret)

          data.token = token

          User.insertMany([data])

          res.redirect('/api/users/login')
        }
      })
      .catch((err) => {
        console.log(err)
        req.flash('error', 'Registration error')
        res.redirect('/api/users/signup')
      })
  },

  // @desc Login user
  // @route POST /api/users/login
  // @access public
  login: async function login(req, res) {
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'User does not exist')
          res.redirect('/api/users/login')
        } else if (bcrypt.compareSync(req.body.password, user.password)) {
          const payload = {
            _id: user._id,
            name: user.name,
            password: user.password,
            email: user.email,
            // add any other properties as needed
          }
          const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1h',
          })
          res.cookie('access_token', token, { httpOnly: true })
          res.redirect('/api/books')
        } else {
          req.flash('error', 'Wrong password')
          res.redirect('/api/users/login')
        }
      })
      .catch((err) => {
        console.log(err)
        req.flash('error', 'Wrong details')
        res.redirect('/api/users/login')
      })
  },

  //@desc Go to login page
  //@route GET /api/users/login
  //@access public
  loginPage: function loginPage(req, res) {
    res.render('login', { error: req.flash('error') })
  },

  //@desc Go to register page
  //@route GET /api/users/register
  //@access public
  signupPage: function signupPage(req, res) {
    res.render('signup', { error: req.flash('error') })
  },

  //@desc Logout user and go to home page
  //@route GET /api/users/logout
  //@access private
  logout: function logout(req, res) {
    res.clearCookie('access_token')
    res.redirect('/')
  },
}
