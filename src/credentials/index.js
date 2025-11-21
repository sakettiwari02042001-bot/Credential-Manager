const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');
const {
  createCredential,
  getAllCredentials,
  getCredentialByTag,
  getCredentialByID,
  updateCredentialByID,
  deleteCredentialByID,
} = require('./credentialService');

// Apply authentication middleware to all routes
router.use(authenticateToken);

router.post('/createCredential', async (req, res) => {
  try {
    const { username, password, notes, tags, expires_at } = req.body;
    const userId = req.user.id;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const credential = await createCredential(userId, {
      username,
      password,
      notes,
      tags,
      expires_at,
    });

    return res.status(201).json({
      message: 'Credential created successfully',
      credential: {
        id: credential.id,
        username: credential.username,
        notes: credential.notes,
        tags: credential.tags,
        expires_at: credential.expires_at,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create credential', error: err.message });
  }
});

router.get('/getAllCredentials', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await getAllCredentials(userId);
    return res.json({ credentials });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch credentials', error: err.message });
  }
});

router.get('/getCredentialByTag/:tag', async (req, res) => {
  try {
    const userId = req.user.id;
    const { tag } = req.params;

    if (!tag) {
      return res.status(400).json({ message: 'Tag parameter is required' });
    }

    const credentials = await getCredentialByTag(userId, tag);
    return res.json({ credentials });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch credentials by tag', error: err.message });
  }
});

router.get('/getCredentialByID/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = parseInt(req.params.id);

    if (isNaN(credentialId)) {
      return res.status(400).json({ message: 'Invalid credential ID' });
    }

    const credential = await getCredentialByID(userId, credentialId);

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    return res.json({ credential });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch credential', error: err.message });
  }
});

router.put('/updateCredentialByID/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = parseInt(req.params.id);
    const { username, password, notes, tags, expires_at } = req.body;

    if (isNaN(credentialId)) {
      return res.status(400).json({ message: 'Invalid credential ID' });
    }

    const credential = await updateCredentialByID(userId, credentialId, {
      username,
      password,
      notes,
      tags,
      expires_at,
    });

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    return res.json({
      message: 'Credential updated successfully',
      credential,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update credential', error: err.message });
  }
});

// DELETE /credentials/:id - Delete credential by ID
router.delete('/deleteCredentialByID/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentialId = parseInt(req.params.id);

    if (isNaN(credentialId)) {
      return res.status(400).json({ message: 'Invalid credential ID' });
    }

    const deleted = await deleteCredentialByID(userId, credentialId);

    if (!deleted) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    return res.json({ message: 'Credential deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete credential', error: err.message });
  }
});

module.exports = router;

