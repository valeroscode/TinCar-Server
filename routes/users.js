const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { UserModel, CarModel } = require("../models/models");

const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, process.env.REACT_APP_JWT, (err) => {
      if (err) return res.sendStatus(403);
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

router.post("/register", async (req, res) => {
  const { name, username, password } = req.body;

  const user = await UserModel.findOne({ username });

  if (user) {
    return res.json({ message: "User already exists" });
  }

  const hashedPw = await bcrypt.hash(password, 10);

  const newUser = new UserModel({
    name,
    username,
    password: hashedPw,
    savedCars: [],
  });
  await newUser.save();

  res.json({ message: "User registered successfully" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username });
  if (!user) {
    return res.json({ message: "User does not exist" });
  }

  const isPwValid = await bcrypt.compare(password, user.password);

  if (!isPwValid) {
    return res.json({ message: "Username or password is incorrect" });
  }

  //Use env variable in place of secret
  const token = jwt.sign({ id: user._id }, process.env.REACT_APP_JWT);
  res.json({ token, userID: user._id, name: user.name, savedCars: user.cars });
});

router.get("/getCars/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const findUser = await UserModel.findById(id);
    res.json({
      data: findUser,
    });
  } catch (err) {
    console.error(err);
  }
});

router.post("/updateCars/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { car } = req.body;
    const findUser = await UserModel.findById(id);
    findUser.cars.push(car);
    await findUser.save();
    res.json({
      data: findUser,
    });
  } catch (err) {
    console.error(err);
  }
});

router.post("/removeCar", async (req, res) => {
  try {
    const { userID, id } = req.body;
    const findUser = await UserModel.findById(userID);
    findUser.cars.pull({
      _id: id,
    });
    await findUser.save();
    res.json({
      data: findUser,
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
