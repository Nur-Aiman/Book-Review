const mongoose = require('mongoose')

module.exports = () => {
  mongoose
    .connect(process.env.DB_CONNECT
    )
    .then(() => {
      console.log('mongo connected')
    })
    .catch(() => {
      console.log('failed to connect')
    })
}

////

///

