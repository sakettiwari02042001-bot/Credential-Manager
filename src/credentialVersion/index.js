const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');
const {
  getCredentialVersions,
  getCredentialVersionByNumber,
} = require('./credentialVersionService');

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.get('/getCredentialVersions/:credentialId', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = parseInt(req.params.credentialId);

    if (isNaN(credentialId)) {
      return res.status(400).json({ message: 'Invalid credential ID' });
    }

    const versions = await getCredentialVersions(userId, credentialId);

    if (versions === null) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    return res.json({
      credential_id: credentialId,
      versions,
      count: versions.length,
    });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Failed to fetch credential versions', 
      error: err.message 
    });
  }
});

router.get('/getCredentialVersionByNumber/:credentialId/:versionNumber', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = parseInt(req.params.credentialId);
    const versionNumber = parseInt(req.params.versionNumber);

    if (isNaN(credentialId)) {
      return res.status(400).json({ message: 'Invalid credential ID' });
    }

    if (isNaN(versionNumber)) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    const version = await getCredentialVersionByNumber(userId, credentialId, versionNumber);

    if (!version) {
      return res.status(404).json({ message: 'Credential or version not found' });
    }

    return res.json({ version });
  } catch (err) {
    return res.status(500).json({ 
      message: 'Failed to fetch credential version', 
      error: err.message 
    });
  }
});

module.exports = router;

