const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
require("dotenv").config();

const url = process.env.MONGO_URI;
// console.log(url);
mongoose.connect(url);

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  dp: {
    type: String,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // Assuming 'Post' is another Mongoose model
    },
  ],
});

userSchema.plugin(plm);

const User = mongoose.model("User", userSchema);

module.exports = User;
