const fs = require("fs");

function loadEnvFile(filePath) {
  const lines =
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/);

  for (const line of lines) {
    const text = line.trim();

    if (!text || text.startsWith("#")) {
      continue;
    }

    const index = text.indexOf("=");

    if (index < 1) {
      continue;
    }

    const key =
      text.substring(0, index).trim();

    const value =
      text.substring(index + 1).trim();

    process.env[key] = value;
  }
}

loadEnvFile("/etc/cpmsoft/cpmsoft.env");

module.exports = {
  apps: [
    {
      name: "cpmsoft-api",
      cwd: "/var/www/backend/cpmsoft-api",
      script: "server.js",

      env: {
        NODE_ENV: "production",

        JWT_SECRET:
          process.env.JWT_SECRET,

        CONTACT_ADMIN_EMAIL:
          process.env.CONTACT_ADMIN_EMAIL,

        DB_PASSWORD:
          process.env.DB_PASSWORD,

        SMTP_HOST:
          process.env.SMTP_HOST,

        SMTP_PORT:
          process.env.SMTP_PORT,

        SMTP_USER:
          process.env.SMTP_USER,

        SMTP_PASS:
          process.env.SMTP_PASS,

        SMTP_FROM:
          process.env.SMTP_FROM,

        RECAPTCHA_SITE_KEY:
          process.env.RECAPTCHA_SITE_KEY,

        RECAPTCHA_SECRET_KEY:
          process.env.RECAPTCHA_SECRET_KEY
      }
    }
  ]
};