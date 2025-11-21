const { DataTypes, Model } = require('sequelize');
const sequelizeInstance = require('../../db/sequelizeInstance');
const Credential = require('./credentials');

class CredentialVersion extends Model {}

CredentialVersion.init(
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
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        encrypted_password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tags:{
            type: DataTypes.STRING,
            allowNull: true,
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
        tableName: 'credential_versions',
        timestamps: true,
        updatedAt: false, // Only track creation time for versioning
    }
);

CredentialVersion.belongsTo(Credential, { foreignKey: 'credential_id', as: 'credential' });
Credential.hasMany(CredentialVersion, { foreignKey: 'credential_id', as: 'versions' });

module.exports = CredentialVersion;

