const Credential = require('../DML/models/credentials');
const { Op } = require('sequelize');
const { encrypt, decrypt } = require('./encryption');

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

  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (password !== undefined) updateData.encrypted_password = encrypt(password);
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;
  if (expires_at !== undefined) updateData.expires_at = expires_at;

  await credential.update(updateData);

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

