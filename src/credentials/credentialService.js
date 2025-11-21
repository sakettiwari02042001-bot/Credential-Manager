const Credential = require('../DML/models/credentials');
const { Op } = require('sequelize');
const { encrypt, decrypt } = require('./encryption');
const { createCredentialVersionInternal, deleteAllCredentialVersions } = require('../credentialVersion/credentialVersionService');

async function createCredential(userId, { username, password, notes, tags, expires_at }) {
  const encryptedPassword = encrypt(password);
  
  const credentialData = {
    user_id: userId,
    username,
    encrypted_password: encryptedPassword,
    notes: notes || null,
    tags: tags || null,
    expires_at: expires_at || null,
  };

  return await Credential.create(credentialData);
}

async function getAllCredentials(userId) {
  const credentials = await Credential.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });

  // Decrypt passwords for response
  return credentials.map(cred => ({
    id: cred.id,
    user_id: cred.user_id,
    username: cred.username,
    password: decrypt(cred.encrypted_password),
    notes: cred.notes,
    tags: cred.tags,
    expires_at: cred.expires_at,
    created_at: cred.createdAt,
    updated_at: cred.updatedAt,
  }));
}

async function getCredentialByTag(userId, tag) {
  const credentials = await Credential.findAll({
    where: {
      user_id: userId,
      tags: {
        [Op.like]: `%${tag}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  return credentials.map(cred => ({
    id: cred.id,
    user_id: cred.user_id,
    username: cred.username,
    password: decrypt(cred.encrypted_password),
    notes: cred.notes,
    tags: cred.tags,
    expires_at: cred.expires_at,
    created_at: cred.createdAt,
    updated_at: cred.updatedAt,
  }));
}

async function getCredentialByID(userId, credentialId) {
  const credential = await Credential.findOne({
    where: {
      id: credentialId,
      user_id: userId,
    },
  });

  if (!credential) {
    return null;
  }

  return {
    id: credential.id,
    user_id: credential.user_id,
    username: credential.username,
    password: decrypt(credential.encrypted_password),
    notes: credential.notes,
    tags: credential.tags,
    expires_at: credential.expires_at,
    created_at: credential.createdAt,
    updated_at: credential.updatedAt,
  };
}

async function updateCredentialByID(userId, credentialId, { username, password, notes, tags, expires_at }) {
  const credential = await Credential.findOne({
    where: {
      id: credentialId,
      user_id: userId,
    },
  });

  if (!credential) {
    return null;
  }

  // Store old values for version history before updating
  const oldEncryptedPassword = credential.encrypted_password;
  const oldNotes = credential.notes;
  const oldTags = credential.tags;

  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (password !== undefined) updateData.encrypted_password = encrypt(password);
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;
  if (expires_at !== undefined) updateData.expires_at = expires_at;

  await credential.update(updateData);

  // Create version history asynchronously (non-blocking)
  // Only create version if password, notes, or tags changed
  const shouldCreateVersion = 
    (password !== undefined && oldEncryptedPassword !== updateData.encrypted_password) ||
    (notes !== undefined && oldNotes !== notes) ||
    (tags !== undefined && oldTags !== tags);

  if (shouldCreateVersion) {
    // Fire and forget - don't wait for version creation
    createCredentialVersionInternal(credentialId, {
      encrypted_password: oldEncryptedPassword,
      notes: oldNotes,
      tags: oldTags,
    })
      .then(version => {
        if (version) {
          console.log(`Version ${version.version} created for credential ${credentialId}`);
        } else {
          console.error(`Failed to create version for credential ${credentialId}: returned null`);
        }
      })
      .catch(err => {
        console.error(`Failed to create credential version (async) for credential ${credentialId}:`, err);
      });
  }

  return {
    id: credential.id,
    user_id: credential.user_id,
    username: credential.username,
    password: decrypt(credential.encrypted_password),
    notes: credential.notes,
    tags: credential.tags,
    expires_at: credential.expires_at,
    created_at: credential.createdAt,
    updated_at: credential.updatedAt,
  };
}

async function deleteCredentialByID(userId, credentialId) {
  const credential = await Credential.findOne({
    where: {
      id: credentialId,
      user_id: userId,
    },
  });

  if (!credential) {
    return false;
  }

  // Delete all versions first (maintain sync)
  await deleteAllCredentialVersions(credentialId);
  
  // Then delete the credential
  await credential.destroy();
  return true;
}

module.exports = {
  createCredential,
  getAllCredentials,
  getCredentialByTag,
  getCredentialByID,
  updateCredentialByID,
  deleteCredentialByID,
};

