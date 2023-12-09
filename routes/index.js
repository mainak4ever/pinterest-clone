var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts.js");
const { default: mongoose } = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

// to use email for login instead of username.
// passport.use(new localStrategy({ usernameField: 'email' }, userModel.authenticate()));

const upload = require("./multer.js");

const textToImage = require("text-to-image");

/* GET home page. */
router.get(
  "/signup",
  saveOriginalUrl,
  isNotLoggedIn,
  function (req, res, next) {
    res.render("signup");
  }
);
router.get("/login", saveOriginalUrl, isNotLoggedIn, function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});
router.get("/", async function (req, res, next) {
  const posts = await postModel.find({}).sort({ createdAt: -1 });
  // console.log(posts);
  const isAuth = req.isAuthenticated();
  // console.log(isAuth);
  res.render("index", { posts, isAuth });
});

router.get("/search", async (req, res, next) => {
  const searchString = req.query.searchString;

  try {
    const posts = await postModel
      .find({
        $or: [
          { title: { $regex: searchString, $options: "i" } },
          { description: { $regex: searchString, $options: "i" } },
          { board: { $regex: searchString, $options: "i" } },
          { tags: { $regex: searchString, $options: "i" } },
          // Add other fields you want to search here
        ],
      })
      .sort({ createdAt: -1 });

    const isAuth = req.isAuthenticated();

    res.render("index", { posts, isAuth }); // Render the index view with posts and authentication info
  } catch (error) {
    res.render("error", { error }); // Render an error view if an error occurs
  }
});

router.get("/create", isLoggedIn, function (req, res, next) {
  res.render("create");
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate("saved");
  // console.log(user);
  res.render("profile", { user });
});

router.get("/userprofile/:id", async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.params.id;
  const user = await userModel.findOne({ _id: userId }).populate("posts");
  let currentUserModel = null;
  if (isAuth) {
    currentUserModel = await userModel.findOne({
      username: req.session.passport.user,
    });
  }

  // console.log(user);
  res.render("userprofile", { user, isAuth, currentUserModel });
});

router.get("/post/:id", async function (req, res, next) {
  try {
    const isAuth = req.isAuthenticated();
    const postId = req.params.id;
    let currentUserModel = null;
    if (isAuth) {
      const currentUser = req.session.passport.user;
      currentUserModel = await userModel.findOne({
        username: currentUser,
      });
    }

    // console.log(currentUserModel);
    const post = await postModel
      .findOne({ _id: postId })
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } }, // Sort comments in descending order based on createdAt timestamp
        populate: { path: "author" }, // Populate the 'author' field in comments
      })
      .populate("user");

    // console.log(post);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    post.comments.sort((a, b) => b.createdAt - a.createdAt);
    res.render("postpage", { post, isAuth, currentUserModel });
  } catch (err) {
    console.error("Error fetching post:", err);

    res.status(500).send("Error fetching post");
  }
});

router.post("/addlike", isLoggedIn, async function (req, res, next) {
  const { currentUserId, postId } = req.body;
  const post = await postModel.findOne({ _id: postId });
  post.likes.push(currentUserId);
  post.save();

  let previousPage = req.get("Referer") || "/";
  res.redirect(previousPage);
});

router.post("/addtosave", isLoggedIn, async function (req, res, next) {
  const { currentUserId, postId } = req.body;
  const user = await userModel.findOne({ _id: currentUserId });
  user.saved.push(postId);
  user.save();
});

router.post("/addcomment", isLoggedIn, async function (req, res, next) {
  const { postId, commentText, currentUserId } = req.body;
  const post = await postModel.findOne({ _id: postId });
  post.comments.push({
    text: commentText,
    author: currentUserId,
  });
  post.save();
});

router.post("/follow/:id", isLoggedIn, async function (req, res, next) {
  let userId = req.params.id;

  let followedUser = await userModel.findOne({ _id: userId });

  let currentUser = await userModel.findOne({
    username: req.session.passport.user,
  });

  followedUser.followers.push(currentUser._id);
  currentUser.following.push(followedUser._id);

  await followedUser.save();
  await currentUser.save();

  let previousPage = req.get("Referer") || "/";
  res.redirect(previousPage);
});

router.post(
  "/updateDp",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    if (!req.file) return res.send("No file uploaded.");

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    user.dp = image;
    await user.save();
    res.redirect("/profile");
  }
);

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    if (!req.file) return res.send("No file uploaded.");

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    const newPost = new postModel({
      title: req.body.title,
      description: req.body.description,
      // Assuming 'image' field contains the uploaded image
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      link: req.body.link,
      board: req.body.board,
      tags: req.body.tags,
      user: user._id,
    });
    await newPost.save();
    user.posts.push(newPost._id);
    await user.save();
    res.redirect("/profile");
  }
);

router.post("/register", async function (req, res, next) {
  const { username, email, fullname } = req.body;

  const firstLetter = fullname.charAt(0).toUpperCase();

  const dataUri = await textToImage.generate(`${firstLetter}`, {
    debug: false,
    maxWidth: 240,
    fontSize: 200,
    fontFamily: "Arial",
    margin: 40,
    bgColor: "#d8d8d8",
    fileType: "jpeg",
  });

  const defaultImage = {
    data: Buffer.from(dataUri.split("base64,")[1], "base64"),
    contentType: "image/jpeg", // Set the content type of the image
  };

  const userData = new userModel({
    username,
    email,
    fullname,
    dp: defaultImage,
  });

  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      const redirectTo = req.session.originalUrl || "/profile"; // Redirect to originalUrl if available, otherwise default to '/profile'
      delete req.session.originalUrl; // Clear the stored URL
      res.redirect(redirectTo);
    });
  });
});

// router.post(
//   "/login",
//   passport.authenticate("local", {

//     successRedirect: "/profile",
//     failureRedirect: "/login",
//     failureFlash: true,
//   }),
//   function (req, res, next) {}
// );

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {
    const redirectTo = req.session.originalUrl || "/profile"; // Redirect to originalUrl if available, otherwise default to '/profile'
    delete req.session.originalUrl; // Clear the stored URL
    res.redirect(redirectTo);
  }
);
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/auth/google/callback", // Adjust the callback URL based on your setup
//     },
//     async function (accessToken, refreshToken, profile, done) {
//       try {
//         let user = await User.findOne({ googleId: profile.id });

//         if (user) {
//           return done(null, user); // User found, return the user
//         } else {
//           const newUser = new User({
//             fullname: profile.displayName,
//             email: profile.emails[0].value, // Assuming Google returns the user's email
//             // You may extract other relevant information from the profile object
//             // Save the Google ID to identify the user for future logins
//             googleId: profile.id,
//           });

//           const savedUser = await newUser.save();
//           return done(null, savedUser); // New user created and saved, return the user
//         }
//       } catch (error) {
//         return done(error); // Handle any errors that occur during the process
//       }
//     }
//   )
// );
// router.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // Google OAuth callback route (this URL should match the callbackURL from the GoogleStrategy)
// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/login" }), // Redirect to '/login' on failure
//   function (req, res) {
//     // Successful authentication, redirect to a different route or send a response
//     res.redirect("/profile");
//   }
// );

router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function isNotLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/profile");
}

function saveOriginalUrl(req, res, next) {
  if (req.method === "GET" && !req.isAuthenticated()) {
    req.session.originalUrl = req.originalUrl || "/";
  }
  console.log(req.session.originalUrl);
  next();
}
module.exports = router;
