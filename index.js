const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT || 5000;
const fetch = require("node-fetch");
const base = require("airtable").base("appcgeWHNPAmxp88S");
const bodyParser = require("body-parser");

const airtableCache = {};

const postToAirtable = (type, redirect) => (req, res) => {
  console.log("req", req.body);
  base("Combined").create(
    {
      Name: req.body.name || "",
      Email: req.body.email || "",
      Address: req.body.address || "",
      Message: req.body.message || "",
      Type: type,
      Newsletter: req.body.newsletter === "",
      Notify: req.body.notify === "",
      Honnl3P0t: req.body.honnl3P0t || "",
      IP: req.ip
    },
    function(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
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
  .post(
    "/organizer-submit-eyJpIj",
    postToAirtable("Organizer", "https://althea.org/thanks-organizer")
  )
  .post(
    "/user-submit-eyJpIj",
    postToAirtable("User", "https://althea.org/thanks-user")
  )
  .post(
    "/developer-submit-eyJpIj",
    postToAirtable("Developer", "https://althea.org/thanks-developer")
  )
  .post(
    "/other-submit-eyJpIj",
    postToAirtable("Other", "https://althea.org/thanks-other")
  )
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
