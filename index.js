const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT || 5000;
const fetch = require("node-fetch");
const base = require("airtable").base("app10GFwKz0Ipn7TW");

const airtableCache = {};

async function updateAirtableCache() {
  const nodes = [];
  base("Requested Deployments")
    .select()
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function(record) {
          const geocodeCache = record.get("Geocode Cache");
          if (geocodeCache) {
            const geocode = JSON.parse(
              Buffer.from(geocodeCache.substring(2), "base64").toString("utf8")
            );
            nodes.push({ lat: geocode.o.lat, lng: geocode.o.lng });
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

setInterval(updateAirtableCache, 1000);

express()
  .use(cors())
  .get("/nodes", (req, res) => res.send(JSON.stringify(airtableCache.nodes)))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
