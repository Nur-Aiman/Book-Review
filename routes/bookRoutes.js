var express = require('express') //import express module
var router = express.Router()
const {
  addBook,
  addBookPage,
  addReview,
  addRating,
  homePage,
  singleBookPage,
  getDescription,
  deleteBook,
  getAllBook,
} = require('../controllers/bookController')
const { authenticateToken } = require('../middleware/authenticateToken')

router.use(authenticateToken)

router.route('/addBook').get(addBookPage).post(addBook)

router.get('/', homePage)

router.route('/:id').get(singleBookPage).delete(deleteBook)

router.route('/:id/review').post(addReview)

router.route('/:id/rate').post(addRating)

module.exports = router
