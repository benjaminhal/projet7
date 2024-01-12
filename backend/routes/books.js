const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/books');

router.get('/', bookCtrl.getBooks);
//router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth,multer, bookCtrl.createBook);
//router.post('/:id/rating', auth, bookCtrl.rateBook);
//router.put('/:id', auth, upload('modify'), bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);


module.exports = router;