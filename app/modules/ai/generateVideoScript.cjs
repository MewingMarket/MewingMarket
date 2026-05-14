/**
 * FILE: generateVideoScript.cjs
 * PATH: /app/modules/ai/generateVideoScript.cjs
 * DESC: Trasforma una guida/FAQ in storyboard + testo voiceover.
 */

function generateVideoScript(guideText, options = {}) {
  const title = options.title || "Tutorial";
  const maxSteps = options.maxSteps || 5;

  const clean = (t) =>
    String(t || "")
      .replace(/\s+/g, " ")
      .trim();

  const base = clean(guideText) || "In questo video ti mostro come fare.";

  const sentences = base.split(".").map(s => s.trim()).filter(Boolean);
  const steps = sentences.slice(0, maxSteps);

  const scenes = [];

  scenes.push("Avatar saluta e introduce il tutorial.");

  steps.forEach((s, i) => {
    scenes.push(`Passo ${i + 1}: ${s}`);
  });

  scenes.push("Avatar chiude il tutorial e invita a fare domande.");

  const voiceover =
    `Ciao! Ora ti mostro ${title.toLowerCase()}. ` +
    steps.join(". ") +
    ". Se hai dubbi, chiedimi pure.";

  return {
    title,
    scenes,
    voiceover
  };
}

module.exports = {
  generateVideoScript
};
