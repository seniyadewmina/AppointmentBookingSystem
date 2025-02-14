const { DataTypes } = require("sequelize");
const db = require("../config/database");
const bcrypt = require("bcryptjs");

const User = db.define("User", {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'This email is already registered'
    },
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8, 100],
        msg: 'Password must be between 8-100 characters'
      }
    }
  },
  contact: {
    type: DataTypes.STRING,
    validate: {
      is: {
        args: /^\+?[\d\s()-]{7,}$/,
        msg: 'Invalid phone number format'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  }
}, {
  timestamps: true,
  paranoid: true, // Enable soft deletes
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Password hashing middleware
const hashPassword = async (user) => {
  if (user.changed('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }
};

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

// Instance method for password verification
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Virtual field for basic user info
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.deletedAt;
  return values;
};

module.exports = User;