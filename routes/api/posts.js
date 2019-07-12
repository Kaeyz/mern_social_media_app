const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Post model
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

// Load post validation
const validatePostInput = require("../../validations/post");

/**
 * @name GET api/posts/test
 * @description Tests posts route
 * @access Public
 */
router.get('/test', (req, res) => res.json({ msg: "Posts works" }));

/**
 * @name GET api/posts
 * @description Get Post
 * @access Public
`*/
router.get("/", (req, res) => {
  Post
    .find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({noPostFound: "No posts found"}));
});

/**
 * @name GET api/posts/:id
 * @description Get Post by id
 * @access Public
`*/
router.get("/:id", (req, res) => {
  Post
    .findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({noPostFound: "No post found with that ID"}));
});

/**
 * @name POST api/post
 * @description Create Post
 * @access Private
`*/
router.post('/', passport.authenticate("jwt", { session: false }), (req, res) => {
const {errors, isValid} = validatePostInput(req.body)

  // Check Validation
  if (!isValid) {
    // If errors, send 400 with errors object
    return res.status(400).json(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.name,
    user: req.user.id
  });

  newPost.save().then(post => res.json(post));
});

/**
 * @name DELETE api/posts/:id
 * @description Delete Post
 * @access Private
`*/
router.delete("/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
          return res.status(401).json({notuthorized: "User not authorized" })
          }
          // Delete Post
          post.remove().then(() => res.json({ sucess: true }))
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
  })
});


/**
 * @name POST api/posts/like/:id
 * @description Like post
 * @access Private
`*/
router.post("/like/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
 Profile.findOne({ user: req.user._id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ alreadyLiked: "User already liked this post" });
          }
          // Add user id to the like array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    })
    .catch(err => res.status(404).json({ usernotfound: "User not found" }));
});

/**
 * @name POST api/posts/unlike/:id
 * @description unLike post
 * @access Private
`*/
router.post("/unlike/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ notLiked: "You have not liked this post" });
          }
          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          post.likes.splice(removeIndex, 1);

          // Save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No post found" }));
    })
    .catch(err => res.status(404).json({ usernotfound: "User not found" }));
});

/**
 * @name POST api/posts/comment/:id
 * @description Add Comment to post
 * @access Private
`*/
router.post("/comment/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  const {errors, isValid} = validatePostInput(req.body)

  // Check Validation
  if (!isValid) {
    // If errors, send 400 with errors object
    return res.status(400).json(errors);
  }

      Post.findById(req.params.id)
        .then(post => {
          const newComment = {
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id
            }

          // Add to comment array
          post.comments.unshift(newComment);

          post.save().then(post => res.json(post))
    })
  .catch(err => res.status(404).json({postnotfound: err}))
});


/**
 * @name DELETE api/posts/comment/:id
 * @description Remove Comment from post
 * @access Private
`*/
router.delete("/comment/:id/:comment_id", passport.authenticate("jwt", { session: false }), (req, res) => {
      Post.findById(req.params.id)
        .then(post => {
          // Check to see if the comment exist
          if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0 ) {
            return res.status(404).json({ commentnotexist: "Comment does not exist" });
          }
          // Get the remove index
          const removeIndex = post.comments
            .map(item => item._id.toString())
            .indexOf(req.params.comment_id);

          // Splice comment out of array
          post.comments.splice(removeIndex, 1);
          post.save().then(post => res.json(post))
        })
  .catch(err => res.status(404).json({postnotfound: "No post found"}))
});

module.exports = router;