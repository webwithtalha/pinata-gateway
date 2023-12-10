const express = require("express");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(morgan("dev"));

app.use("/api", require("./routes/fileRouter"));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
