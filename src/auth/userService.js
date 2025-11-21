const User = require('../DML/models/users');
const bcrypt = require('bcrypt');

async function findUserByEmail(email) {
  return await User.findOne({ where: { email } });
}

async function createUser({ email, usertype, password }) {
  // Hash the password before storing
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return await User.create({ email, usertype, password: hashedPassword });
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { findUserByEmail, createUser, comparePassword };
