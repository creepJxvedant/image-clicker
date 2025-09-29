const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Ensure the photos folder exists
const photosDir = path.join(__dirname, "public", "photos");
fs.mkdirSync(photosDir, { recursive: true });
console.log("Photos directory is set to:", photosDir);

// Helper to get next sequential photo number
function getNextPhotoNumber() {
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith(".png"));
  if (files.length === 0) return 1;
  const nums = files.map(f => parseInt(f.split(".")[0])).filter(n => !isNaN(n));
  return Math.max(...nums) + 1;
}

// POST /upload - save photo
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
    console.log(`Saved photo for user "${name}" (age: ${age}) at: ${photoPath}`);
  } else {
    console.log(`No photo provided. Using placeholder for user "${name}"`);
  }

  const log = `Name: ${name}, Age: ${age}, Photo: ${photoFilename}, Time: ${new Date().toISOString()}\n`;
  fs.appendFileSync(path.join(__dirname, "user_log.txt"), log);
  console.log("User log updated");

  res.send(`Frame uploaded as ${photoFilename}`);
});

// GET /photos/:filename - view uploaded photos
app.get("/photos/:filename", (req, res) => {
  const filePath = path.join(photosDir, req.params.filename);
  console.log("Serving photo:", filePath);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.log("File not found:", filePath);
    res.status(404).send("File not found");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
