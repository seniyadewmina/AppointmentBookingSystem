# Appointment Booking System

This is a Node.js-based appointment booking system with authentication, built using Express, Sequelize (for database management), JWT for authentication, and bcrypt for password hashing.

## 🚀 Features
- **User Authentication**: Signup, login, logout, and token refresh using JWT.
- **Password Security**: Bcrypt for hashing passwords.
- **Rate Limiting**: Prevent brute-force attacks with Express Rate Limit.
- **Database Management**: Sequelize ORM with MySQL/PostgreSQL.
- **Environment Variables**: Securely handle secrets using dotenv.
- **Appointment Management**: Book, retrieve, and cancel appointments.

## 🛠️ Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via Sequelize ORM)
- **Authentication**: JWT (JSON Web Token)
- **Security**: Bcrypt.js, Express Rate Limit
- **Environment Management**: dotenv

## 📌 Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MySQL](https://www.mysql.com/) or [PostgreSQL](https://www.postgresql.org/)
- [Git](https://git-scm.com/)

## 🛠️ Setup & Installation

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/seniyadewmina/Appointment-Booking-System.git
cd appointment-booking-system
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and add:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=appointment_db
JWT_SECRET=your_secret_key
TOKEN_EXPIRY=1h
NODE_ENV=development
```

### 4️⃣ Set Up Database
Update `config/database.js` with your database details, then run:
```sh
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### 5️⃣ Start the Server
```sh
npm run dev  # For development (nodemon)
npm start    # For production
```

### 6️⃣ API Endpoints
- **Authentication**:
  - **POST** `/auth/signup` → Register a new user
  - **POST** `/auth/login` → Login and receive a JWT token
  - **POST** `/auth/logout` → Logout by clearing the cookie
  - **POST** `/auth/refresh` → Refresh the JWT token

- **Appointments**:
  - **GET** `/slots` → Retrieve available time slots
  - **POST** `/appointments` → Book an appointment
  - **GET** `/appointments` → Retrieve booked appointments for a user
  - **DELETE** `/appointments/:id` → Cancel an appointment

## 🔧 Development
### Running in Development Mode
For hot-reloading during development, use:
```sh
npm run dev
```

### Running in Production
```sh
npm start
```

## 📬 Contact

For any queries or suggestions, reach out via:  
📧 **seniyadewminaw@gmail.com**  
🔗 [LinkedIn](https://www.linkedin.com/in/seniyadewmina/)  

---

