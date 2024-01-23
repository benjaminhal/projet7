const auth = require('../middleware/auth');
const Book = require('../models/thing');
const jwt = require('jsonwebtoken');
const average = require('../utils/average');
const fs = require('fs');

exports.createBook = (req, res, next) => { console.log("create book");
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;
    const book = new Book({
      ...bookObject,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, 
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
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, 
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
    // On vérifie que la note est comprise entre 0 et 5
    if (0 <= req.body.rating <= 5) {
        // Stockage de la requête dans une constante
        const ratingObject = { ...req.body, grade: req.body.rating };
        // Suppression du faux _id envoyé par le front
        delete ratingObject._id;
        // Récupération du livre auquel on veut ajouter une note
        Book.findOne({_id: req.params.id})
            .then(book => {
                // Création d'un tableau regroupant toutes les userId des utilisateurs ayant déjà noté le livre en question
                const newRatings = book.ratings;
                const userIdArray = newRatings.map(rating => rating.userId);
                // On vérifie que l'utilisateur authentifié n'a jamais donné de note au livre en question
                if (userIdArray.includes(req.auth.userId)) {
                    res.status(403).json({ message : 'Not authorized' });
                } else {
                    // Ajout de la note
                    newRatings.push(ratingObject);
                    // Création d'un tableau regroupant toutes les notes du livre, et calcul de la moyenne des notes
                    const grades = newRatings.map(rating => rating.grade);
                    const averageGrades = average.average(grades);
                    book.averageRating = averageGrades;
                    // Mise à jour du livre avec la nouvelle note ainsi que la nouvelle moyenne des notes
                    Book.updateOne({ _id: req.params.id }, { ratings: newRatings, averageRating: averageGrades, _id: req.params.id })
                        .then(() => { res.status(201).json()})
                        .catch(error => { res.status(400).json( { error })});
                    res.status(200).json(book);
                }
            })
            .catch((error) => {
                res.status(404).json({ error });
            });
    } else {
        res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
    }
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