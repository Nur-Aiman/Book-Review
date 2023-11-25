const express = require('express')
const dotenv = require('dotenv').config()
const app = express()
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
var connection = require('./config/database')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const session = require('express-session')
//const ejsLint = require('ejs-lint')

var usersRouter = require('./routes/userRoutes')
var booksRouter = require('./routes/bookRoutes')
const { authenticateToken } = require('./middleware/authenticateToken')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(
  session({
    secret: 'fvdsfsdsdsd',
    resave: false,
    saveUninitialized: false,
  })
)

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))
app.use('/images', express.static('images'))
app.use(flash())

app.use('/api/users/', usersRouter)
app.use('/api/books/', booksRouter)

// go to welcome page
app.get('/', (req, res) => {
  res.render('welcome')
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
