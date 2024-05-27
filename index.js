const express = require("express");
const authMiddleware = require("./auth-middleware");

const app = express();

const books = [
  { id: 1, name: "Harry Potter" },
  { id: 2, name: "Clean Code" },
  { id: 3, name: "Javascript: Good practices" },
];

app.use("/", authMiddleware);

app.get("/books", (request, response) => {
  return response.send({ books });
});

app.listen(4000, () => console.log("The server is running at PORT 4000"));