const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

const airtableCache = {};

function updateAirtableCache() {
  airtableCache.currentTime = Date.now();
}

setInterval(updateAirtableCache, 1000);

express()
  .get("/", (req, res) => res.send(airtableCache.currentTime))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
