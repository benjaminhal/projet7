const auth = require('../middleware/auth');
const Book = require('../models/thing');
const jwt = require('jsonwebtoken');
const fs = require('fs');

exports.createBook = (req, res, next) => { console.log("create book");
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;
    const book = new Book({
      ...bookObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`, 
      userId: req.auth.userId,
      averageRating: bookObject.ratings[0].grade
    });
  
    book.save()
      .then(() => res.status(201).json({ message: 'Livre enregistré avec succès !' })) 
      .catch(error =>{console.log(error); res.status(400).json({ erreur: error })});
  };
  

exports.getBooks = (req, res, next) => {
    Book.find()
        .then((books) => {
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(400).json({
                erreur: error
            });
        });
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
    }).then(
        (book) => {
            res.status(200).json(book);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                erreur: error 
            });
        }
    );
};

exports.modifyBook = (req, res, next) => {
    let bookObject = {};

    // Si une image est fournie via multer
    if (req.file) {
        bookObject = {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/resized_${req.file.filename}`, 
        };
    } else {
        // Si aucune image n'est fournie, prenez directement les informations du corps de la requête.
        bookObject = { ...req.body };
    }

    // Suppression du champ _userId du livre à mettre à jour pour éviter toute modification non autorisée.
    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé !' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ message: 'Requête non autorisée !' });
            }

            // Mise à jour du livre.
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Livre mis à jour avec succès !' })) 
                .catch(error => res.status(400).json({ erreur: error })); 
        })
        .catch(error => res.status(500).json({ erreur: error })); 
};

    exports.deleteBook = (req, res, next) => {
        Book.findOne({_id: req.params.id})
            .then(book => {
                if (book.userId !== req.auth.userId) {
                    res.status(403).json({message: 'Requête non autorisée !'});
                } else {
                    const filename = book.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`, () => {
                        Book.deleteOne({_id: req.params.id})
                            .then(() => res.status(200).json({message: 'Livre supprimé avec succès !'}))
                            .catch(error => res.status(400).json({ erreur: error }));
                    });
                }
            })
            .catch(error => res.status(500).json({ erreur: error }));
    };

exports.getAllStuff = (req, res, next) => {
  Thing.find().then(
    (things) => {
      res.status(200).json(things);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


exports.rateBook = (req, res, next) => {
    const userId = req.auth.userId;
    const grade = req.body.rating;

    if (!grade || grade < 0 || grade > 5) {
        return res.status(400).json({ message: 'Note invalide !' });
    }
    Book.findOne({ _id: req.params.id })
        .then(book => {
            const userRating = book.ratings.find(rating => rating.userId === userId);
            if (userRating) {
                return res.status(400).json({ message: 'Vous avez déjà noté ce livre !' });
            }
            book.ratings.push({ userId, grade });
            const averageRating = (book.ratings.reduce((acc, rating) => acc + rating.grade, 0) / book.ratings.length).toFixed(1);
            book.averageRating = parseFloat(averageRating); 
            return book.save();
        })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(500).json({ erreur: error })); 
};

exports.getBestRatedBooks = (req, res, next) => {
    Book.find().sort({averageRating: -1}).limit(3)
        .then((books) => {
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(400).json({
                erreur: error
            });
        });
}