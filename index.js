const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT || 5000;
const fetch = require("node-fetch");
const base = require("airtable").base("appcgeWHNPAmxp88S");
const bodyParser = require("body-parser");

const airtableCache = {};

const postToAirtable = (baseName, redirect) => (req, res) => {
  console.log("req", req.body);
  base(baseName).create({ ...req.body, IP: req.ip }, function(err) {
    if (err) {
      console.error(err);
      return;
    }
  });
  res.redirect(redirect);
};

async function updateAirtableCache() {
  const nodes = [];
  base("Requested Deployments")
    .select()
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          const geocodeCache = record.get("Geocode Cache");
          const active = record.get("Active");
          if (geocodeCache) {
            const geocode = JSON.parse(
              Buffer.from(geocodeCache.substring(2), "base64").toString("utf8")
            );
            nodes.push({ lat: geocode.o.lat, lng: geocode.o.lng, active });
          }
        });

        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
        airtableCache.nodes = nodes;
      }
    );
}

// setInterval(updateAirtableCache, 1000);

express()
  .use(cors())
  .use(bodyParser.urlencoded({ extended: true }))
  .get("/nodes", (req, res) => res.send(JSON.stringify(airtableCache.nodes)))
  .post("/organizer-submit-eyJpIj", postToAirtable("Organizers", "back"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
