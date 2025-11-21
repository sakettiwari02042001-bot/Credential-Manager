const Credential = require('../DML/models/credentials');
const SharedCredential = require('../DML/models/sharedCredentials');
const User = require('../DML/models/users');
const { decrypt } = require('../credentials/encryption');

const DEFAULT_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 2;

function isExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

function calculateExpiryTime(expiryHours) {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + expiryHours);
    return expiryTime;
}

async function shareCredential(ownerId, credentialId, sharedWithUserId, canEdit = false, expiryHours = DEFAULT_EXPIRY_HOURS) {
    if (expiryHours < 0 || expiryHours > MAX_EXPIRY_HOURS) {
        return { success: false, message: `Expiry hours must be between 0 and ${MAX_EXPIRY_HOURS} hours` };
    }

    const credential = await Credential.findOne({
        where: {
            id: credentialId,
            user_id: ownerId,
        },
    });

    if (!credential) {
        return { success: false, message: 'Credential not found or you do not own it' };
    }

    if (ownerId === sharedWithUserId) {
        return { success: false, message: 'Cannot share credential with yourself' };
    }

    const sharedWithUser = await User.findByPk(sharedWithUserId);
    if (!sharedWithUser) {
        return { success: false, message: 'User to share with not found' };
    }

    const existingShare = await SharedCredential.findOne({
        where: {
            credential_id: credentialId,
            shared_with_user_id: sharedWithUserId,
        },
    });

    const expiresAt = calculateExpiryTime(expiryHours);

    if (existingShare && !isExpired(existingShare.expires_at)) {
        await existingShare.update({ 
            can_edit: canEdit, 
            expires_at: expiresAt,
            createdAt: new Date() 
        });
        return {
            success: true,
            sharedCredential: {
                id: existingShare.id,
                credential_id: existingShare.credential_id,
                owner_id: existingShare.owner_id,
                shared_with_user_id: existingShare.shared_with_user_id,
                can_edit: existingShare.can_edit,
                expires_at: existingShare.expires_at,
                created_at: existingShare.createdAt,
            },
        };
    }

    if (existingShare && isExpired(existingShare.expires_at)) {
        await existingShare.destroy();
    }

    const sharedCredential = await SharedCredential.create({
        credential_id: credentialId,
        owner_id: ownerId,
        shared_with_user_id: sharedWithUserId,
        can_edit: canEdit,
        expires_at: expiresAt,
    });

    return {
        success: true,
        sharedCredential: {
            id: sharedCredential.id,
            credential_id: sharedCredential.credential_id,
            owner_id: sharedCredential.owner_id,
            shared_with_user_id: sharedCredential.shared_with_user_id,
            can_edit: sharedCredential.can_edit,
            expires_at: sharedCredential.expires_at,
            created_at: sharedCredential.createdAt,
        },
    };
}

async function getSharedCredentialsForUser(userId) {
    const sharedCredentials = await SharedCredential.findAll({
        where: { shared_with_user_id: userId },
        include: [
            {
                model: Credential,
                as: 'credential',
                attributes: ['id', 'username', 'encrypted_password', 'notes', 'tags', 'expires_at'],
            },
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'email'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    const validShares = [];
    const expiredIds = [];

    for (const share of sharedCredentials) {
        if (isExpired(share.expires_at)) {
            expiredIds.push(share.id);
        } else if (!share.credential) {
            expiredIds.push(share.id);
        } else {
            let decryptedPassword = null;
            try {
                if (share.credential.encrypted_password) {
                    const encryptedValue = share.credential.encrypted_password;
                    if (!encryptedValue || typeof encryptedValue !== 'string') {
                        throw new Error('Invalid encrypted password format: not a string');
                    }
                    if (!encryptedValue.includes(':')) {
                        throw new Error('Invalid encrypted password format: missing IV separator');
                    }
                    decryptedPassword = decrypt(encryptedValue);
                }
            } catch (error) {
                console.error(`Failed to decrypt password for credential ${share.credential_id}:`, error.message);
                console.error(`Encrypted value length: ${share.credential.encrypted_password ? share.credential.encrypted_password.length : 'null'}`);
                console.error(`Encrypted value preview: ${share.credential.encrypted_password ? share.credential.encrypted_password.substring(0, 50) : 'null'}`);
                decryptedPassword = '[Decryption Error]';
            }

            validShares.push({
                id: share.id,
                credential_id: share.credential_id,
                owner_id: share.owner_id,
                owner_email: share.owner ? share.owner.email : null,
                shared_with_user_id: share.shared_with_user_id,
                can_edit: share.can_edit,
                created_at: share.createdAt,
                expires_at: share.expires_at,
                credential: {
                    id: share.credential.id,
                    username: share.credential.username,
                    password: decryptedPassword,
                    notes: share.credential.notes,
                    tags: share.credential.tags,
                    expires_at: share.credential.expires_at,
                },
            });
        }
    }

    if (expiredIds.length > 0) {
        await SharedCredential.destroy({
            where: { id: expiredIds },
        });
    }

    return validShares;
}

async function getSharedCredentialById(userId, sharedCredentialId) {
    const sharedCredential = await SharedCredential.findOne({
        where: {
            id: sharedCredentialId,
            shared_with_user_id: userId,
        },
        include: [
            {
                model: Credential,
                as: 'credential',
                attributes: ['id', 'username', 'encrypted_password', 'notes', 'tags', 'expires_at'],
            },
            {
                model: User,
                as: 'owner',
                attributes: ['id', 'email'],
            },
        ],
    });

    if (!sharedCredential) {
        return null;
    }

    if (isExpired(sharedCredential.expires_at)) {
        await sharedCredential.destroy();
        return null;
    }

    if (!sharedCredential.credential) {
        await sharedCredential.destroy();
        return null;
    }

    let decryptedPassword = null;
    try {
        if (sharedCredential.credential.encrypted_password) {
            const encryptedValue = sharedCredential.credential.encrypted_password;
            if (!encryptedValue || typeof encryptedValue !== 'string') {
                throw new Error('Invalid encrypted password format: not a string');
            }
            if (!encryptedValue.includes(':')) {
                throw new Error('Invalid encrypted password format: missing IV separator');
            }
            decryptedPassword = decrypt(encryptedValue);
        }
    } catch (error) {
        console.error(`Failed to decrypt password for credential ${sharedCredential.credential_id}:`, error.message);
        console.error(`Encrypted value length: ${sharedCredential.credential.encrypted_password ? sharedCredential.credential.encrypted_password.length : 'null'}`);
        console.error(`Encrypted value preview: ${sharedCredential.credential.encrypted_password ? sharedCredential.credential.encrypted_password.substring(0, 50) : 'null'}`);
        decryptedPassword = '[Decryption Error]';
    }

    return {
        id: sharedCredential.id,
        credential_id: sharedCredential.credential_id,
        owner_id: sharedCredential.owner_id,
        owner_email: sharedCredential.owner ? sharedCredential.owner.email : null,
        shared_with_user_id: sharedCredential.shared_with_user_id,
        can_edit: sharedCredential.can_edit,
        created_at: sharedCredential.createdAt,
        expires_at: sharedCredential.expires_at,
        credential: {
            id: sharedCredential.credential.id,
            username: sharedCredential.credential.username,
            password: decryptedPassword,
            notes: sharedCredential.credential.notes,
            tags: sharedCredential.credential.tags,
            expires_at: sharedCredential.credential.expires_at,
        },
    };
}

async function revokeSharedCredential(ownerId, sharedCredentialId) {
    const sharedCredential = await SharedCredential.findOne({
        where: {
            id: sharedCredentialId,
            owner_id: ownerId,
        },
    });

    if (!sharedCredential) {
        return false;
    }

    await sharedCredential.destroy();
    return true;
}

async function getSharedCredentialsByOwner(ownerId) {
    const sharedCredentials = await SharedCredential.findAll({
        where: { owner_id: ownerId },
        include: [
            {
                model: User,
                as: 'sharedWith',
                attributes: ['id', 'email'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    const validShares = [];
    const expiredIds = [];

    for (const share of sharedCredentials) {
        if (isExpired(share.expires_at)) {
            expiredIds.push(share.id);
        } else {
            validShares.push({
                id: share.id,
                credential_id: share.credential_id,
                owner_id: share.owner_id,
                shared_with_user_id: share.shared_with_user_id,
                shared_with_email: share.sharedWith.email,
                can_edit: share.can_edit,
                created_at: share.createdAt,
                expires_at: share.expires_at,
            });
        }
    }

    if (expiredIds.length > 0) {
        await SharedCredential.destroy({
            where: { id: expiredIds },
        });
    }

    return validShares;
}

module.exports = {
    shareCredential,
    getSharedCredentialsForUser,
    getSharedCredentialById,
    revokeSharedCredential,
    getSharedCredentialsByOwner,
};

