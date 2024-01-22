const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const compressImage = require('../middleware/compress');

const bookCtrl = require('../controllers/books');

router.get('/', bookCtrl.getBooks);
//router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth,multer, compressImage, bookCtrl.createBook);
//router.post('/', auth, multer, multer.resizeImage, bookCtrl.createBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);
router.put('/:id', auth, multer, compressImage, bookCtrl.modifyBook);
//router.put('/:id', auth, multer, multer.resizeImage, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
//router.post('/:id/rating', auth, bookCtrl.createRating);

module.exports = router;