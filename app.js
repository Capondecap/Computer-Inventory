require('dotenv').config();
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const authenticate = require('./middleware/authenticate');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const { apiLimiter } = require('./middleware/rateLimiter');
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const apiKeyRoutes = require('./routes/apiKey.routes');
const assetRoutes = require('./routes/asset.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    json: (val) => JSON.stringify(val ?? []),
    isAdmin: (role) => role === 'admin',
    formatDate: (date) => (date ? new Date(date).toLocaleDateString() : ''),
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.use(express.static('public'));
app.use(authenticate);
app.use('/api/', apiLimiter, apiKeyAuth);

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/items', assetRoutes);
app.use('/api/transactions', assignmentRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

module.exports = app;
