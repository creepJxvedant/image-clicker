const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Folder for photos
const photosDir = path.join(__dirname, "public", "photos");
fs.mkdirSync(photosDir, { recursive: true });
console.log("Photos directory:", photosDir);

// Passkey for hidden dashboard
const DASHBOARD_PASSKEY = "9870"; // <-- change this

// Helper to get next sequential photo number
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
    console.log(`Saved photo for user "${name}" at: ${photoPath}`);
  }

  const log = `Name: ${name}, Age: ${age}, Photo: ${photoFilename}, Time: ${new Date().toISOString()}\n`;
  fs.appendFileSync(path.join(__dirname, "user_log.txt"), log);
  console.log("User log updated");

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

// GET /hidden - password protected dashboard
app.get("/hidden", (req, res) => {
  const pass = req.query.pass || "";
  if (pass !== DASHBOARD_PASSKEY) {
    return res.status(401).send("Unauthorized. Provide correct passkey with ?pass=YOURPASS");
  }

  // List all uploaded photos
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith(".png"));
  let html = `<h1>Hidden Dashboard</h1>`;
  html += `<p>Total uploaded photos: ${files.length}</p>`;
  files.sort((a,b) => parseInt(a) - parseInt(b)).forEach(file => {
    html += `<div style="margin:10px;"><img src="/photos/${file}" style="width:200px;"><br>${file}</div>`;
  });
  res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
