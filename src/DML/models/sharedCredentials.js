const { DataTypes, Model } = require('sequelize');
const sequelizeInstance = require('../../db/sequelizeInstance');
const Credential = require('./credentials');
const User = require('./users');

class SharedCredential extends Model {}

SharedCredential.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        credential_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: Credential,
                key: 'id',
            },
        },
        owner_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        shared_with_user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        can_edit: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
    },
    {
        sequelize: sequelizeInstance,
        tableName: 'shared_credentials',
        timestamps: true,
        updatedAt: false,
    }
);

SharedCredential.belongsTo(Credential, { foreignKey: 'credential_id', as: 'credential' });
SharedCredential.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
SharedCredential.belongsTo(User, { foreignKey: 'shared_with_user_id', as: 'sharedWith' });

Credential.hasMany(SharedCredential, { foreignKey: 'credential_id', as: 'sharedCredentials' });
User.hasMany(SharedCredential, { foreignKey: 'owner_id', as: 'ownedShares' });
User.hasMany(SharedCredential, { foreignKey: 'shared_with_user_id', as: 'receivedShares' });

module.exports = SharedCredential;

