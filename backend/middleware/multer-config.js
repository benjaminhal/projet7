const multer = require('multer'); // Importation du package multer pour gérer les fichiers entrants dans les requêtes HTTP
// Dictionnaire des types MIME pour déterminer les extensions de fichier
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};
// Configuration de multer pour enregistrer les fichiers dans le dossier images
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images'); // Définit le dossier de destination pour les fichiers
    },
    // Génère un nom de fichier unique avec l'extension de fichier appropriée
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_'); // Remplace les espaces dans le nom d'origine du fichier par des underscores
        const extension = MIME_TYPES[file.mimetype]; // Détermine l'extension du fichier à partir de son type MIME
        callback(null, name + Date.now() + '.' + extension); // Génère le nom du fichier
    }
});

// ***Handle file uploads***
module.exports = (req, res, next) => {
  const upload = multer({ storage }).single('image');
  upload(req, res, (error) => {
    if (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    } else {
      next();
    }
  });
};

