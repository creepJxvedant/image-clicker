const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

app.post("/upload", (req, res) => {

  const name = req.body.name || "TempUser";
  const age = req.body.age || 20;
  const photo = req.body.photo || null;

  const timestamp = Date.now();
  const photoFilename = `photo_${timestamp}.png`;
  const base64Data = photo.replace(/^data:image\/png;base64,/, "");

  fs.writeFileSync(path.join(__dirname, photoFilename), base64Data, "base64");

  const log = `Name: ${name}, Age: ${age}, Photo: ${photoFilename}, Time: ${new Date().toISOString()}\n`;
  fs.appendFileSync("user_log.txt", log);
  res.send("ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
