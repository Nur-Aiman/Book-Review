var express = require('express')
var router = express.Router()
var knex = require('knex')
var connection = require('../config/database')
const jwt = require('jsonwebtoken')

module.exports = {
  // @desc Register a user
  // @route POST /api/users/signup
  // @access public
  signup: async function signup(req, res) {
    console.log('POST Request', req.body)

    const email = req.body['email']
    const password = req.body['password']

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      req.flash('error', 'Invalid email format')
      res.redirect('/api/users/signup')
    } else {
      // Validate password requirements
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
      if (!passwordRegex.test(password)) {
        req.flash(
          'error',
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number'
        )
        res.redirect('/api/users/signup')
      } else {
        var id = null
        // Get the maximum ID value in the user table
        var getMaxID = connection.raw(
          `
        SELECT MAX(id) AS max_id FROM user;
        `
        )
        getMaxID
          .then(function (result) {
            if (result[0][0].max_id != null) {
              id = result[0][0].max_id + 1
            } else {
              id = 1
            }

            // Insert a new record into the user table with the specified ID value
            var promise = connection.raw(
              `
            INSERT INTO user (id, email, password, fullName)
            VALUES (?, ?, ?, ?)
            `,
              [
                id,
                req.body['email'],
                req.body['password'],
                req.body['fullName'],
              ]
            )

            promise
              .then(function (result) {
                res.redirect('/api/users/login')
              })
              .catch(function (error) {
                console.log(error)
                req.flash('error', 'Registration failed')
                res.redirect('/api/users/signup')
              })
          })
          .catch(function (error) {
            console.log(error)
            req.flash('error', 'Registration failed')
            res.redirect('/api/users/signup')
          })
      }
    }
  },

  // @desc Login user
  // @route POST /api/users/login
  // @access public
  login: async function login(req, res) {
    console.log('POST Request', req.body)

    var email = req.body.email
    var password = req.body.password

    // Check if the user exists in the database
    var promise = connection.raw(
      `
      SELECT * FROM user
      WHERE email = ?;
      `,
      [email]
    )

    promise
      .then(function (result) {
        if (result[0].length == 0) {
          req.flash('error', 'User not found')
          res.redirect('/api/users/login')
        } else {
          // Check if the password matches
          if (result[0][0].password == password) {
            // Password matched, generate a token and store it in cookies
            const user = {
              id: result[0][0].id,
              email: result[0][0].email,
              fullName: result[0][0].fullName,
            }
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            console.log(
              `Login successful. Current user: Email: ${email} Password: ${password} Token: ${accessToken}`
            )
            res.cookie('access_token', accessToken, { httpOnly: true })
            console.log('COOKIES')
            res.redirect('/api/books')
          } else {
            // Password didn't match, return an error
            req.flash('error', 'Invalid password')

            res.redirect('/api/users/login')
          }
        }
      })
      .catch(function (error) {
        console.log(error)
        res.status(500).json({
          message: error,
        })
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
