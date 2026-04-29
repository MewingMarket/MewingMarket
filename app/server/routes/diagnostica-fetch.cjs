/* =========================================================
   DIAGNOSTICA FETCH — test formati risposta
========================================================= */

async function testJson(req) {
  return {
    success: true,
    message: "JSON OK",
    time: Date.now()
  };
}

async function testHtml(req) {
  return "<html><body><h1>HTML NON VALIDO</h1></body></html>";
}

async function testErrore(req) {
  throw new Error("Errore simulato");
}

module.exports = {
  testJson,
  testHtml,
  testErrore
};
