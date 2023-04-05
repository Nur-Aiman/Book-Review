var express = require('express')
var router = express.Router()
var knex = require('knex')
var connection = require('../config/database')
const jwt = require('jsonwebtoken')

module.exports = {
  //@desc Go to home page
  //@route GET /api/books
  //@access private
  homePage: async function homePage(req, res) {
    try {
      userEmail = req.user.email
      // Query book data from MySQL database using Knex.js
      const bookData = await connection('books').select('*')

      // Pass book data to home.ejs view
      res.render('home', { bookData, userEmail })
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    }
  },

  //@desc View single book
  //@route GET /api/books/:id
  //@access private
  singleBookPage: async function singleBookPage(req, res) {
    const bookId = req.params.id
    const userId = req.user.id // assuming the authenticated user's ID is stored in req.user.id
    const userEmail = req.user.email

    connection
      .select('*')
      .from('books')
      .where('id', bookId)
      .first()
      .then((bookData) => {
        connection
          .select('review.review', 'user.email')
          .from('review')
          .join('user', 'review.userId', 'user.id')
          .where('review.bookId', bookId)
          .then((reviews) => {
            connection('rating')
              .avg('rating as averageRating')
              .where('bookId', bookId)
              .first()
              .then((result) => {
                const averageRating = result.averageRating || 0

                connection('rating')
                  .select('rating')
                  .where({
                    bookId: bookId,
                    userId: userId,
                  })
                  .first()
                  .then((userRating) => {
                    const currentUserRating = userRating
                      ? userRating.rating
                      : null
                    res.render('singleBookPage', {
                      bookData,
                      reviews,
                      averageRating,
                      currentUserRating,
                      userEmail,
                    })
                  })
                  .catch((error) => {
                    console.error(error)
                    res.sendStatus(500)
                  })
              })
              .catch((error) => {
                console.error(error)
                res.sendStatus(500)
              })
          })
          .catch((error) => {
            console.error(error)
            res.sendStatus(500)
          })
      })
      .catch((error) => {
        console.error(error)
        res.sendStatus(500)
      })
  },

  //@desc Go to add book page
  //@route GET /api/books/addBook
  //@access private
  addBookPage: function addBookPage(req, res) {
    res.render('addBook')
  },

  //@desc Add a new book
  //@route POST /api/books/addBook
  //@access private
  addBook: async function addBook(req, res) {
    console.log('POST Request', req.body)

    // Get the maximum ID value in the book table
    var getMaxID = connection.raw(
      `
        SELECT MAX(id) AS max_id FROM books;
        `
    )

    getMaxID
      .then(function (result) {
        var id = result[0][0].max_id != null ? result[0][0].max_id + 1 : 1

        // Get the ID of the currently logged in user based on the email address
        var userEmail = req.user.email
        var getUserId = connection.raw(
          `
            SELECT id FROM user WHERE email = ?;
            `,
          [userEmail]
        )

        getUserId
          .then(function (result) {
            var userId = result[0][0].id

            // Insert a new record into the book table with the specified ID value and user ID
            var promise = connection.raw(
              `
                INSERT INTO books (id, BookName, BookAuthor, BookImage, Description, userId)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
              [
                id,
                req.body.title,
                req.body.author,
                req.body.image,
                req.body.description,
                userId,
              ]
            )

            promise
              .then(function (result) {
                res.redirect('/api/books')
              })
              .catch(function (error) {
                console.log(error)
                res.json(500, {
                  message: error,
                })
              })
          })
          .catch(function (error) {
            console.log(error)
            res.json(500, {
              message: error,
            })
          })
      })
      .catch(function (error) {
        console.log(error)
        res.json(500, {
          message: error,
        })
      })
  },

  // @desc Give review to a book
  // @route POST /api/books/:id/review
  // @access private
  addReview: async function addReview(req, res) {
    const bookId = req.params.id
    const review = req.body.review
    const userId = req.user.id

    // Check if the review textarea is not empty
    if (review.trim() === '') {
      res.redirect(`/api/books/${bookId}`)
    } else {
      connection('review')
        .insert({ bookId, review, userId })
        .then(() => {
          res.redirect(`/api/books/${bookId}`)
        })
        .catch((error) => {
          console.error(error)
          res.status(500).send('Error adding review.')
        })
    }
  },

  //@desc Give rating to a book
  //@route POST /api/books/:id/rate
  //@access private
  addRating: function addRating(req, res) {
    const bookId = req.params.id
    const userId = req.user.id
    const rating = req.body.rating

    connection('rating')
      .select('id', 'rating')
      .where('bookId', bookId)
      .andWhere('userId', userId)
      .first()
      .then((result) => {
        if (result) {
          // user has already rated the book, so do nothing
          res.redirect(`/api/books/${bookId}`)
        } else {
          // add new rating for the current user
          connection('rating')
            .insert({ bookId, userId, rating })
            .then(() => {
              res.redirect(`/api/books/${bookId}`)
            })
            .catch((error) => {
              console.error(error)
              res.sendStatus(500)
            })
        }
      })
      .catch((error) => {
        console.error(error)
        res.sendStatus(500)
      })
  },

  getDescription: function getDescription(req, res) {},

  //@desc Delete book
  //@route DELETE /api/books/:id
  //@access private
  deleteBook: async function deleteBook(req, res) {
    const bookId = req.params.id

    try {
      await connection.transaction(async (trx) => {
        // First, delete all child records from the `rating` table
        await trx('rating').where('bookId', bookId).del()
        // Then, delete all child records from the `review` table
        await trx('review').where('bookId', bookId).del()

        // Then, delete the record from the `books` table
        await trx('books').where('id', bookId).del()
      })

      res.redirect('/api/books')
    } catch (error) {
      console.error(error)
      res.status(500).send('Error deleting book.')
    }
  },
}
