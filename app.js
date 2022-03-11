const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running successfully at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error at ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const getQuery = `select * from user where username = '${username}';`;
  const DbQuery = await db.get(getQuery);
  if (DbQuery === undefined) {
    if (password.length > 4) {
      const postQuery = `insert into
             user ( username ,name, password , gender,location) 
            values
            (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )`;
      const insertUser = await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getQuery = `select * from user where username = '${username}';`;
  const DbQuery = await db.get(getQuery);
  //   response.send(DbQuery.password);
  if (DbQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatch = await bcrypt.compare(
      request.body.password,
      DbQuery.password
    );
    if (isMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change-password

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getQuery = `select * from user where username = '${username}';`;
  const DbQuery = await db.get(getQuery);
  if (DbQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatch = await bcrypt.compare(oldPassword, DbQuery.password);
    if (isMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newUpdatedPassword = await bcrypt.hash(
          request.body.newPassword,
          10
        );
        const updateQuery = `update user set password = '${newUpdatedPassword}'
        where username = '${username}';`;
        await db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

app.get("/register/", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const getQuery = `select * from user where username = '${username}';`;
  const DbQuery = await db.get(getQuery);
  response.send(DbQuery);
});

module.exports = app;
