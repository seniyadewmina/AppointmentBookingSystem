const { Sequelize, DataTypes } = require("sequelize");
const db = require("../config/database");

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
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  contact: { 
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^\+?[\d\s()-]{7,}$/ // Basic phone number validation
    }
  }
}, {
  timestamps: true,
  paranoid: true // Enable soft deletes
});

const Slot = db.define("Slot", {
  date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString().split('T')[0] // Prevent past dates
    }
  },
  start_time: { 
    type: DataTypes.TIME, 
    allowNull: false,
    validate: {
      isValidTime(value) {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          throw new Error('Invalid time format');
        }
      }
    }
  },
  end_time: { 
    type: DataTypes.TIME, 
    allowNull: false,
    validate: {
      isValidTime(value) {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          throw new Error('Invalid time format');
        }
      }
    }
  },
  is_available: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['date', 'start_time', 'end_time']
    },
    {
      fields: ['is_available']
    }
  ]
});

const Appointment = db.define("Appointment", {
  status: {
    type: DataTypes.ENUM('booked', 'cancelled', 'completed'),
    defaultValue: 'booked'
  },
  contact: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      is: /^\+?[\d\s()-]{7,}$/
    }
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  }
}, {
  timestamps: true,
  paranoid: true // Soft delete appointments
});

// Relationships with explicit foreign keys and constraints
User.hasMany(Appointment, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  },
  onDelete: 'RESTRICT' // Prevent user deletion with active appointments
});

Appointment.belongsTo(User, {
  foreignKey: 'userId'
});

Slot.hasMany(Appointment, {
  foreignKey: {
    name: 'slotId',
    allowNull: false
  },
  onDelete: 'RESTRICT' // Maintain referential integrity
});

Appointment.belongsTo(Slot, {
  foreignKey: 'slotId'
});

// Safe sync for development (use migrations for production)
db.sync({ alter: process.env.NODE_ENV === 'development' });

module.exports = { User, Slot, Appointment };