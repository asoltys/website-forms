const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT || 5000;
const fetch = require("node-fetch");
const base = require("airtable").base("appcgeWHNPAmxp88S");
const bodyParser = require("body-parser");
const expressSanitized = require("express-sanitize-escape");

const airtableCache = {};

const postToAirtable = type => (req, res) => {
  const redirect = typeof req.query.r === "string" ? req.query.r : false;
  base("Combined").create(
    {
      Name: req.body.Name || "",
      Email: req.body.Email || "",
      Address: req.body.Address || "",
      Message: req.body.Message || "",
      Type: type,
      Newsletter: req.body.Newsletter === "",
      Notify: req.body.Notify === "",
      Honnl3P0t: req.body.Honnl3P0t || "",
      IP: req.ip
    },
    function(err) {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
  if (redirect) {
    res.redirect(redirect);
  }
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

var corsOptions = {
  origin: 'http://althea.org',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

express()
  .use(cors(corsOptions))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(expressSanitized.middleware())
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
