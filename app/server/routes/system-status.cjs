/**
 * app/server/routes/system-status.cjs
 * Stato del sistema
 */

const os = require("os");
const { SERVER_LOGS } = require("../services/logging.cjs");

module.exports = function (app) {
  app.get("/system/status", (req, res) => {
    try {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      const cpuLoad = os.loadavg();
      const users = global.userStates ? Object.keys(global.userStates).length : 0;
      const logs = SERVER_LOGS.length;

      const status = {
        uptime,
        users,
        logs,
        memory,
        cpuLoad,
        timestamp: new Date().toISOString()
      };

      if (typeof global.logEvent === "function") {
        global.logEvent("system_status_check", status);
      }

      return res.json(status);

    } catch (err) {
      console.error("❌ Errore /system/status:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("system_status_error", {
          error: err?.message || "unknown"
        });
      }

      return res.status(500).json({ error: "Errore recupero stato sistema" });
    }
  });
};
