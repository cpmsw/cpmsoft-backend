module.exports = {
  apps: [
    {
      name: "cpmsoft-api",
      cwd: "/var/www/backend/cpmsoft-api",
      script: "server.js",
      env: {
        NODE_ENV: "production",

        // JWT
        JWT_SECRET: "e52f5fb54513ac13a862f6b60a5337a2c56eba87851417a2bb9d1561cdc4629688fa4a19d36a5c8f2488d6643e16867e4f19693b08c7d7c8e0e6901b48e37bcc",

	// CONTACT ADMIN 
	CONTACT_ADMIN_EMAIL: "vasu@itsystems.com",	
        // SMTP
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_USER: "vasu@itsystems.com",
        SMTP_PASS: "muqs newj nsrm ejmk",
        SMTP_FROM: "CPMSOFT <vasu@itsystems.com>",

        // reCAPTCHA
        RECAPTCHA_SITE_KEY: "6LeZHFsrAAAAALJKLshPZo4XrKn7EeDC_3BrYYlN",
        RECAPTCHA_SECRET_KEY: "6LeZHFsrAAAAADS-04EJchK3Q_7rilPU1YSBN8YD"
      }
    }
  ]
};

