const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('appointment_db', 'root', '#Sara1234*', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
