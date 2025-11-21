const express = require('express');
const router = express.Router();


// Example route
router.get('/', (req, res) => {
  res.json({ message: 'API root route working!' });
});

// Auth routes
router.use('/auth', require('../auth'));
router.use('/credentials', require('../credentials'));

module.exports = router;
