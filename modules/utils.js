// modules/utils.js

function generateUID() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = {
  generateUID
};
