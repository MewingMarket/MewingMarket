const isProd = process.env.NODE_ENV === "production";

function logInfo(...args) {
  if (!isProd) console.log(...args);
}

function logWarn(...args) {
  console.warn(...args);
}

function logError(...args) {
  console.error(...args);
}

module.exports = {
  logInfo,
  logWarn,
  logError
};
