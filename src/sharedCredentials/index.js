const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/middleware');
const {
    shareCredential,
    getSharedCredentialsForUser,
    getSharedCredentialById,
    revokeSharedCredential,
    getSharedCredentialsByOwner,
} = require('./sharedCredentialsService');

router.use(authenticateToken);

router.post('/share', async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { credential_id, shared_with_user_id, can_edit, expiry_hours } = req.body;

        if (!credential_id || !shared_with_user_id) {
            return res.status(400).json({
                message: 'credential_id and shared_with_user_id are required',
            });
        }

        const expiryHours = expiry_hours !== undefined ? parseFloat(expiry_hours) : undefined;

        const result = await shareCredential(
            ownerId,
            parseInt(credential_id),
            parseInt(shared_with_user_id),
            can_edit || false,
            expiryHours
        );

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        return res.status(201).json({
            message: 'Credential shared successfully',
            sharedCredential: result.sharedCredential,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to share credential',
            error: err.message,
        });
    }
});

router.get('/received', async (req, res) => {
    try {
        const userId = req.user.id;
        const sharedCredentials = await getSharedCredentialsForUser(userId);

        return res.json({
            sharedCredentials,
            count: sharedCredentials.length,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch shared credentials',
            error: err.message,
        });
    }
});

router.get('/received/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const sharedCredentialId = parseInt(req.params.id);

        if (isNaN(sharedCredentialId)) {
            return res.status(400).json({ message: 'Invalid shared credential ID' });
        }

        const sharedCredential = await getSharedCredentialById(userId, sharedCredentialId);

        if (!sharedCredential) {
            return res.status(404).json({ message: 'Shared credential not found or expired' });
        }

        return res.json({ sharedCredential });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch shared credential',
            error: err.message,
        });
    }
});

router.get('/shared', async (req, res) => {
    try {
        const ownerId = req.user.id;
        const sharedCredentials = await getSharedCredentialsByOwner(ownerId);

        return res.json({
            sharedCredentials,
            count: sharedCredentials.length,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch shared credentials',
            error: err.message,
        });
    }
});

router.delete('/revoke/:id', async (req, res) => {
    try {
        const ownerId = req.user.id;
        const sharedCredentialId = parseInt(req.params.id);

        if (isNaN(sharedCredentialId)) {
            return res.status(400).json({ message: 'Invalid shared credential ID' });
        }

        const revoked = await revokeSharedCredential(ownerId, sharedCredentialId);

        if (!revoked) {
            return res.status(404).json({ message: 'Shared credential not found' });
        }

        return res.json({ message: 'Shared credential revoked successfully' });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to revoke shared credential',
            error: err.message,
        });
    }
});

module.exports = router;

