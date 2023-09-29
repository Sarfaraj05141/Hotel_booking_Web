const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User.js');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const bcryptSalt = bcrypt.genSaltSync(10);
const imageDownloader = require('image-downloader');
require('dotenv').config();
const jsonwebtokenSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const Place = require('./Place.js');
const Booking = require('./models/Booking.js');
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173',
  })
);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });

app.get('/test', (req, res) => {
  res.json('test ok');
});

function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(req.cookies.token, jsonwebtokenSecret, {}, async (err, user) => {
      if (err) throw err;
      resolve(user);
    });
  });
}

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jsonwebtoken.sign({ email: userDoc.email, id: userDoc._id, name: userDoc.name }, jsonwebtokenSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jsonwebtoken.verify(token, jsonwebtokenSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json(true);
});

app.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' + newName,
  });
  res.json(newName);
});

const photosMiddleware = multer({ dest: 'uploads/' });
app.post('/uploads', photosMiddleware.array('photos', 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});

app.post('/places', async (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;

  jsonwebtoken.verify(token, jsonwebtokenSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get('/user-places', async (req, res) => {
  const { token } = req.cookies;
  jsonwebtoken.verify(token, jsonwebtokenSecret, {}, async (err, userData) => {
    if (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get('/places/:id', async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put('/places', async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  jsonwebtoken.verify(token, jsonwebtokenSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === (await placeDoc.owner).toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
});

app.get('/places', async (req, res) => {
  res.json(await Place.find());
});

app.post('/bookings', async (req, res) => {
  const userData = await getUserDataFromToken(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } = req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

app.get('/bookings', async (req, res) => {
  const userData = await getUserDataFromToken(req);
  res.json(await Booking.find({ user: userData.id }).populate('place'));
});

app.listen(4000, () => {
  console.log('Server listening on port 4000');
});