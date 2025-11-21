const { DataTypes, Model } = require('sequelize');
const sequelizeInstance = require('../../db/sequelizeInstance');
const User = require('./users');

class Credential extends Model {}

Credential.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        encrypted_password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tags: {
            type: DataTypes.STRING,
            allowNull: true,
            // Can store comma-separated values or JSON string
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize: sequelizeInstance,
        tableName: 'credentials',
        timestamps: true,
    }
);

Credential.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Credential, { foreignKey: 'user_id', as: 'credentials' });

module.exports = Credential;

