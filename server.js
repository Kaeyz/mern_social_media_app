const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require("passport");
const path = require('path');

// Route files
const users = require('./routes/api/user');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB config
const db = require('./config/keys').mongoURL;
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log('Database Connected'))
  .catch(err => console.log({ "dbErr": err }));

//Passport Middleware
app.use(passport.initialize());

// Passport Config
require("./config/passport")(passport);

// Use Routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

// Serve as static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"))
  // set static folder
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  });
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`server running on http://localhost:${port}`));