================================================================================
  PUTIMACH - HOSTINGER HPANEL / CPANEL 100% PRODUCTION DEPLOYMENT GUIDE
================================================================================

Target Archive File: putimach_hpanel_deploy.zip (Located in your project root)

Inside this ZIP archive:
 ├── index.html                   (Storefront Main SPA Entry)
 ├── .htaccess                    (Root Apache SPA Rewrite & Routing Rules)
 ├── assets/                      (Compiled Storefront JS & CSS Bundles)
 ├── uploads/                     (Product Images & Uploads)
 ├── admin/
 │    ├── index.html              (Admin Panel SPA Entry)
 │    ├── .htaccess               (Admin Sub-App Apache SPA Rewrite Rules)
 │    └── assets/                 (Compiled Admin Panel JS & CSS Bundles)
 ├── server.js                    (Express Server - Optional for Node.js Mode)
 ├── .env                         (Configured Supabase & API Environment Credentials)
 └── package.json                 (Dependencies for Node.js Mode)

--------------------------------------------------------------------------------
OPTION 1: STANDARD HOSTINGER SHARED HOSTING (SUPER SIMPLE - Apache Static SPA)
--------------------------------------------------------------------------------
1. Log in to your Hostinger hPanel -> Go to "File Manager".
2. Open the "public_html" directory.
3. Upload "putimach_hpanel_deploy.zip".
4. Right-click "putimach_hpanel_deploy.zip" and click "Extract".
5. Extract directly into "public_html".
6. Ensure hidden files are visible so ".htaccess" is extracted cleanly.

DONE! Your website is now live:
 - Storefront: https://yourdomain.com
 - Admin Panel: https://yourdomain.com/admin/
   (Admin Login: admin@putimach.com / admin123)

--------------------------------------------------------------------------------
OPTION 2: HOSTINGER NODE.JS WEB APP (For Express Proxy & Upload APIs)
--------------------------------------------------------------------------------
1. Log in to Hostinger hPanel -> Click "Setup Node.js App".
2. Node.js Version: Select 18.x or 20.x
3. Application Root: public_html
4. Application URL: yourdomain.com
5. Application Startup File: server.js
6. Upload "putimach_hpanel_deploy.zip" and extract into public_html.
7. Click "Run NPM Install" in Hostinger hPanel Node.js dashboard.
8. Click "Start Application" or "Restart App".

--------------------------------------------------------------------------------
DIAGNOSTIC & ERROR HANDLING BUILT-IN
--------------------------------------------------------------------------------
- Both index.html and admin/index.html contain built-in runtime error listeners.
- If any script error, missing env parameter, or database network block occurs,
  a clear visual alert box ("PutiMach Deployment Diagnostic Alert") will pop up on
  screen showing the exact error message, filename, and line number instead of
  a blank white screen.
================================================================================
