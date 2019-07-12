const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load Input Validations
const validateRegisterInput = require("../../validations/register");
const validateLoginInput = require("../../validations/login");


// models
const User = require('../../models/User');

/**
 * @name GET api/users/test
 * @description Tests users route
 * @access Public
 */
router.get('/test', (req, res) => res.json({ msg: "Users works" }));

/**
 * @name POST api/users/register
 * @description Register users route
 * @access Public
 */
router.post('/register', (req, res) => {
  // Validate req.body
  const { errors, isValid } = validateRegisterInput(req.body);
  // Return errors to the frontend
  if (!isValid) {
    return res.status(400).json(errors)
  }
  // Check if user already exists
  User
    .findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        errors.email = "Email already exist"
        return res.status(400).json(errors)
      } else {
        // Generate email avatar
        const avatar = gravatar.url(req.body.email, {
          s: "200", // Size
          r: "pg",  // Rating
          d: "mm"   // Default
        });
        // save new User to the Database
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              console.log(err);
              throw err;
            }; 
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch (err => console.log(err));
          })
        })
      }
    })
})

/**
 * @name GET api/users/login
 * @desc Login User/ Returning JWT Token
 * @access Public
 */
router.post("/login", (req, res) => {

   // Validate req.body
   const { errors, isValid } = validateLoginInput(req.body);
   // Return errors to the frontend
   if (!isValid) {
     return res.status(400).json(errors)
  }
  
  const email = req.body.email;
  const password = req.body.password;

  // Find User by email
  User
    .findOne({ email })
    .then(user => {
      // Check for user
      if (!user) {
        errors.email = "User not found";
        return res.status(404).json(errors);
      }
      
      // Check Password
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {

            // User Matched
            const payload = { id: user.id, name: user.name, avatar: user.avatar }; // create JWT payload
            
            // Sign Token
            jwt.sign(
              payload,
              keys.secretOrKey,
              { expiresIn: 3600 },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token
                });
              });
          } else {
            errors.password = "password incorrect";
            return res.status(400).json(errors);
          }
        })
    }) 
});

/**
 * @name GET api/users/current
 * @desc  Return current User
 * @access Private 
 */
router.get("/current", passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
});

module.exports = router;