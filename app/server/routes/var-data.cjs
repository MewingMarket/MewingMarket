// FILE: app/server/routes/var-data.cjs
const fs = require("fs");
const path = require("path");

module.exports = (app) => {
  app.get("/diagnostica/var-data", (req, res) => {
    const base = "/var/data";

    function safeList(p, opts = {}) {
      try {
        const full = path.resolve(p);
        const entries = fs.readdirSync(full, { withFileTypes: true });
        return entries
          .filter(e => !opts.onlyFiles || e.isFile())
          .filter(e => !opts.onlyDirs || e.isDirectory())
          .map(e => ({
            name: e.name,
            type: e.isDirectory() ? "dir" : "file"
          }));
      } catch (e) {
        return { error: e.message };
      }
    }

    const result = {
      base,
      dirs_level1: safeList(base, { onlyDirs: true }),
      files_level1: safeList(base, { onlyFiles: true }),
      json_in_json_dir: safeList(path.join(base, "json"), { onlyFiles: true }),
      json_in_backup_json: safeList(path.join(base, "backup/json"), { onlyFiles: true })
    };

    res.json(result);
  });
};
