const Credential = require('../DML/models/credentials');
const CredentialVersion = require('../DML/models/credentialVersions');

/**
 * Creates a new version for a credential (internal use, no user verification)
 * Version numbers are auto-incremented based on existing versions
 * 
 * @param {number} credentialId - The credential ID to create a version for
 * @param {object} versionData - Version data (encrypted_password, notes, tags)
 * @returns {object|null} - The created version or null if error
 */
async function createCredentialVersionInternal(credentialId, { encrypted_password, notes, tags }) {
  try {
    const latestVersion = await CredentialVersion.findOne({
      where: { credential_id: credentialId },
      order: [['version', 'DESC']],
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    const version = await CredentialVersion.create({
      credential_id: credentialId,
      version: nextVersion,
      encrypted_password: encrypted_password,
      notes: notes || null,
      tags: tags || null,
    });

    console.log(`Successfully created version ${nextVersion} for credential ${credentialId}`);
    
    return {
      id: version.id,
      credential_id: version.credential_id,
      version: version.version,
      notes: version.notes,
      tags: version.tags,
      created_at: version.createdAt,
    };
  } catch (error) {
    console.error(`Error creating credential version for credential ${credentialId}:`, error);
    console.error('Error details:', error.message, error.stack);
    return null;
  }
}

/**
 * Deletes all versions for a credential
 * 
 * @param {number} credentialId - The credential ID
 * @returns {boolean} - True if successful
 */
async function deleteAllCredentialVersions(credentialId) {
  try {
    await CredentialVersion.destroy({
      where: { credential_id: credentialId },
    });
    return true;
  } catch (error) {
    console.error('Error deleting credential versions:', error);
    return false;
  }
}

/**
 * Gets all versions for a specific credential
 * 
 * @param {number} userId - The user ID to verify ownership
 * @param {number} credentialId - The credential ID to get versions for
 * @returns {array|null} - Array of versions or null if credential not found
 */
async function getCredentialVersions(userId, credentialId) {
  const credential = await Credential.findOne({
    where: {
      id: credentialId,
      user_id: userId,
    },
  });

  if (!credential) {
    return null;
  }

  const versions = await CredentialVersion.findAll({
    where: { credential_id: credentialId },
    order: [['version', 'DESC']],
  });

  return versions.map(version => ({
    id: version.id,
    credential_id: version.credential_id,
    version: version.version,
    encrypted_password: version.encrypted_password,
    notes: version.notes,
    tags: version.tags,
    created_at: version.createdAt,
  }));
}

/**
 * Gets a specific version by version number
 * 
 * @param {number} userId - The user ID to verify ownership
 * @param {number} credentialId - The credential ID
 * @param {number} versionNumber - The version number to retrieve
 * @returns {object|null} - The version or null if not found
 */
async function getCredentialVersionByNumber(userId, credentialId, versionNumber) {
  const credential = await Credential.findOne({
    where: {
      id: credentialId,
      user_id: userId,
    },
  });

  if (!credential) {
    return null;
  }

  const version = await CredentialVersion.findOne({
    where: {
      credential_id: credentialId,
      version: versionNumber,
    },
  });

  if (!version) {
    return null;
  }

  return {
    id: version.id,
    credential_id: version.credential_id,
    version: version.version,
    encrypted_password: version.encrypted_password,
    notes: version.notes,
    tags: version.tags,
    created_at: version.createdAt,
  };
}

module.exports = {
  createCredentialVersionInternal,
  getCredentialVersions,
  getCredentialVersionByNumber,
  deleteAllCredentialVersions,
};

