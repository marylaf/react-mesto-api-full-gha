const dotenv = require('dotenv');

dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const { errors } = require('celebrate');
const { celebrate, Joi } = require('celebrate');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const validateURL = require('./middlewares/validation');
const userRouter = require('./routes/users');
const cardRouter = require('./routes/cards');
const { createUser } = require('./controllers/users');
const { login } = require('./controllers/users');
const auth = require('./middlewares/auth');
const NotFound = require('./errors/not-found-err');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/mestodb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    'https://mary.student.nomoredomains.monster',
    'http://mary.student.nomoredomains.monster',
    'https://api.mary.student.nomoredomains.monster',
    'http://api.mary.student.nomoredomains.monster',
  ],
  credentials: true,
}));

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().custom(validateURL),
    email: Joi.string().required().email(),
    password: Joi.string().required(),

  }),
}), createUser);

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),

  }),
}), login);

app.use('/', auth, userRouter);
app.use('/', auth, cardRouter);

const { PORT = 3000 } = process.env;

app.use((req, res, next) => {
  const error = new NotFound('Запрашиваемый ресурс не найден');
  return next(error);
});
app.use(errorLogger);
app.use(auth);
app.use(errors());
app.use((err, req, res, next) => {
  // если у ошибки нет статуса, выставляем 500
  const { statusCode = 500, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? 'Внутренняя ошибка сервера'
        : message,
    });
  next();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
