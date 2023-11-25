var express = require('express')
const Book = require('../models/bookModel')
const User = require('../models/userModel')
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

      // Query book data from MongoDB
      const bookData = await Book.find({})

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
    try {
      const bookId = req.params.id
      console.log(bookId)
      const userId = req.user._id // assuming the authenticated user's ID is stored in req.user.id
      const userEmail = req.user.email

      const bookData = await Book.findById(bookId).exec()

      if (!bookData) {
        res.sendStatus(404)
        return
      }

      const reviews = bookData.reviews.map((review) => ({
        review: review.review,
        email: review.email, // Consider populating the User info instead of using userId
      }))

      const ratings = bookData.ratings
      const averageRating =
        ratings.reduce((acc, rating) => acc + rating.rating, 0) /
          ratings.length || 0

      const userRating = ratings.find(
        (rating) => String(rating.userId) === userId
      )
      const currentUserRating = userRating ? userRating.rating : null

      res.render('singleBookPage', {
        bookData,
        reviews,
        averageRating,
        currentUserRating,
        userEmail,
      })
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    }
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

    try {
      const userEmail = req.user.email

      const user = await User.findOne({ email: userEmail })

      if (!user) {
        res.status(400).json({ message: 'User not found' })
        return
      }

      const userId = user._id

      const newBook = new Book({
        title: req.body.title,
        author: req.body.author,
        image: req.body.image,
        description: req.body.description,
        userId,
      })

      const savedBook = await newBook.save()

      if (savedBook) {
        res.redirect('/api/books')
      } else {
        res.status(500).json({ message: 'Error adding book' })
      }
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    }
  },

  // @desc Give review to a book
  // @route POST /api/books/:id/review
  // @access private
  addReview: async function addReview(req, res) {
    const bookId = req.params.id
    const review = req.body.review
    const userId = req.user._id

    // Check if the review textarea is not empty
    if (review.trim() === '') {
      res.redirect(`/api/books/${bookId}`)
    } else {
      try {
        const book = await Book.findById(bookId)

        if (!book) {
          res.status(404).json({ message: 'Book not found' })
          return
        }

        const user = await User.findById(userId)

        if (!user) {
          res.status(404).json({ message: 'User not found' })
          return
        }

        const email = user.email
        console.log(user)
        console.log(email)

        book.reviews.push({ userId, review, email })

        await book.save()

        res.redirect(`/api/books/${bookId}`)
      } catch (error) {
        console.error(error)
        res.status(500).send('Error adding review.')
      }
    }
  },

  //@desc Give rating to a book
  //@route POST /api/books/:id/rate
  //@access private
  addRating: async function addRating(req, res) {
    const bookId = req.params.id
    const userId = req.user._id
    const ratingValue = req.body.rating

    try {
      const book = await Book.findById(bookId)

      if (!book) {
        res.status(404).json({ message: 'Book not found' })
        return
      }

      const user = await User.findById(userId)

      if (!user) {
        res.status(404).json({ message: 'User not found' })
        return
      }

      const email = user.email

      const existingRatingIndex = book.ratings.findIndex(
        (rating) => String(rating.userId) === String(userId)
      )

      if (existingRatingIndex !== -1) {
        // User has already rated the book, so do nothing
        res.redirect(`/api/books/${bookId}`)
      } else {
        // Add new rating for the current user
        book.ratings.push({ userId, rating: ratingValue, email })

        await book.save()

        res.redirect(`/api/books/${bookId}`)
      }
    } catch (error) {
      console.error(error)
      res.status(500).send('Error adding rating.')
    }
  },

  getDescription: function getDescription(req, res) {},

  //@desc Delete book
  //@route DELETE /api/books/:id
  //@access private
  deleteBook: async function deleteBook(req, res) {
    const bookId = req.params.id

    try {
      // Find the book by its ID and remove it
      const deletedBook = await Book.findByIdAndRemove(bookId)

      if (!deletedBook) {
        res.status(404).json({ message: 'Book not found' })
        return
      }

      res.redirect('/api/books')
    } catch (error) {
      console.error(error)
      res.status(500).send('Error deleting book.')
    }
  },
}
