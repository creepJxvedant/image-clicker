const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// Ensure the photos folder exists
const photosDir = path.join(__dirname, "public", "photos");
fs.mkdirSync(photosDir, { recursive: true });

// Helper to get the next number
function getNextPhotoNumber() {
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith(".png"));
  if (files.length === 0) return 1;
  const nums = files.map(f => parseInt(f.split(".")[0])).filter(n => !isNaN(n));
  return Math.max(...nums) + 1;
}

// POST /upload
app.post("/upload", (req, res) => {
  const name = req.body.name || "TempUser";
  const age = req.body.age || 20;
  const photo = req.body.photo || null;

  let photoFilename = "no_photo.png";

  if (photo) {
    const nextNum = getNextPhotoNumber();
    photoFilename = `${nextNum}.png`;
    const photoPath = path.join(photosDir, photoFilename);

    fs.writeFileSync(photoPath, photo.replace(/^data:image\/png;base64,/, ""), "base64");
    console.log("Saved photo at:", photoPath);
  }

  const log = `Name: ${name}, Age: ${age}, Photo: ${photoFilename}, Time: ${new Date().toISOString()}\n`;
  fs.appendFileSync("user_log.txt", log);

  res.send(`Frame uploaded as ${photoFilename}`);
});

// GET /photos/:filename
app.get("/photos/:filename", (req, res) => {
  const filePath = path.join(photosDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
