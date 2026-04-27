# Computer Inventory System

A secure internal web application for IT departments to manage computer hardware, peripherals, user assignments, asset lifecycle, reporting, and audit history.

**Stack:** Node.js · Express.js · MongoDB · Mongoose · Handlebars (HBS)  
**Architecture:** MVC + Service Layer

---

## Project Structure

```
computer-inventory/
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── app.js
│
├── config/
│   ├── auth.js
│   ├── db.js
│   └── multer.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── apiKey.middleware.js
│   ├── rbac.middleware.js
│   ├── rateLimiter.js
│   └── errorHandler.js
│
├── models/
│   ├── User.model.js
│   ├── Asset.model.js
│   ├── Assignment.model.js
│   ├── Maintenance.model.js
│   ├── AuditLog.model.js
│   └── ApiKey.model.js
│
├── services/
│   ├── auth.service.js
│   ├── asset.service.js
│   ├── assignment.service.js
│   ├── maintenance.service.js
│   ├── audit.service.js
│   ├── report.service.js
│   └── apiKey.service.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── asset.controller.js
│   ├── assignment.controller.js
│   ├── maintenance.controller.js
│   ├── report.controller.js
│   └── user.controller.js
│
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── asset.routes.js
│   ├── assignment.routes.js
│   ├── maintenance.routes.js
│   ├── report.routes.js
│   └── user.routes.js
│
├── views/
│   ├── layouts/
│   │   ├── main.hbs
│   │   └── auth.hbs
│   ├── partials/
│   │   ├── navbar.hbs
│   │   ├── sidebar.hbs
│   │   ├── flash.hbs
│   │   └── pagination.hbs
│   ├── auth/
│   │   ├── login.hbs
│   │   └── register.hbs
│   ├── dashboard/
│   │   └── index.hbs
│   ├── assets/
│   │   ├── index.hbs
│   │   ├── detail.hbs
│   │   └── form.hbs
│   ├── assignments/
│   │   ├── index.hbs
│   │   └── form.hbs
│   ├── maintenance/
│   │   ├── index.hbs
│   │   └── form.hbs
│   ├── reports/
│   │   └── index.hbs
│   ├── users/
│   │   └── index.hbs
│   └── errors/
│       ├── 403.hbs
│       ├── 404.hbs
│       └── 500.hbs
│
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── img/
│
├── utils/
│   ├── hbsHelpers.js
│   ├── pagination.js
│   └── validators.js
│
├── uploads/
├── logs/
└── docs/
    └── requirements.md
```
