const { JWT_SECRET } = process.env;
const express = require("express");
const usersRouter = express.Router();
const jwt = require("jsonwebtoken");
const {
  createUser,
  getUser,
  getUserById,
  getUserByUserName,
  getOrdersByUser,
  getCartByUser,
  getAllUsers,
  updateUser,
} = require("../db");
const { getReviewsByUser } = require("../db/reviews");
const { requireUser, requireAdmin } = require("./utils");

usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users...");
  next();
});

usersRouter.post("/register", async (req, res, next) => {
  const { first, last, email, imageURL, username, password } = req.body;
  try {
    if (password.length <= 7) {
      next({
        name: "ShortPasswordError",
        message: "Password must be longer than 7 characters.",
      });
      return;
    }
    const _user = await getUserByUserName(username);
    if (_user) {
      next({
        name: "UserExistsError",
        message: "A user by that username already exists",
      });
      return;
    }
    const user = await createUser({
      first: first,
      last: last,
      email: email,
      imageURL: imageURL,
      username: username,
      password: password,
    });
    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    console.log("USER", user);
    res.send({
      message: "thank you for signing up",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
});
usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password",
    });
  }

  try {
    const user = await getUser({ username, password });
    if (user) {
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      res.send({
        message: "you're logged in!",
        user,
        token,
      });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "Username or password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// add users/me
usersRouter.get("/me", requireUser, async (req, res, next) => {

  console.log("A request is being made to users/me");
  
  const auth = req.header("Authorization");
  const prefix = "Bearer ";
  const token = auth.slice(prefix.length);
  const { id } = jwt.verify(token, JWT_SECRET);

  try {
    const user = await getUserById(id);
    const userOrders = await getOrdersByUser(user);
    const userCart = await getCartByUser(user);

    if (userOrders) {
      user.orders = userOrders;
    } else {
      user.orders = [];
    }

    if (userCart) {
      user.cart = userCart;
    } else {
      user.cart = [];
    }

    if (id == req.user.id) {
      res.send(user);
    }
    // }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get("/:userId/orders", requireAdmin, async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await getUserById(userId);
    if (user) {
      const orders = await getOrdersByUser(user);
      res.send(orders);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get('/', requireAdmin, async (req, res, next) => {
  try {
    const allUsers = await getAllUsers();
    res.send(allUsers);
  } catch ({ name, message }) {
    next({ name, message })
  };
});

usersRouter.patch('/:userId', requireAdmin, async (req, res, next) => {
  const { userId } = req.params;
  const { first, last, email, imageURL, username, password, isAdmin } = req.body;
  try {
    const updatedUser = await updateUser({
      id: userId,
      first: first,
      last: last,
      email: email,
      imageURL: imageURL,
      username: username,
      password: password,
      isAdmin: isAdmin,
    });
    res.send(updatedUser);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

usersRouter.get('/:userId/reviews', requireUser, async (req, res, next) => {
  const { userId } = req.params;

  try {
      const userReviews = await getReviewsByUser(userId);
      
      res.send(userReviews);
  } catch ({ name, message }) {
      next({ name, message });
  };
});


usersRouter.delete("/:userId", requireAdmin, async (req, res, next) => {
  const { userId } = req.params;
  
  try {
    const userToDelete = await getUserById(userId);
    if (!userToDelete) {
      throw Error(`You can't delete a product that doesn't exist.`);
    };
    const deleteUser = await destroyUser(userToDelete);
    
    res.send(deleteUser);
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;
