# Mycelium

A static, installable UK mushroom scouting PWA. Serve `dist/` over HTTPS (or localhost). No build step, credentials, or server are required.

Uses browser geolocation, Open-Meteo recent model-based daily weather and geocoding, and iNaturalist research-grade seasonal species counts in a 30 km radius. All inference is an explicitly labelled exploratory heuristic, not a calibrated fruiting forecast. Species ecology links to First Nature, local guidance to Surrey Wildlife Trust. Species photos are taxonomically matched iNaturalist default photos with attribution. If either API fails, the app retains time-labelled previous reports or shows unavailable data without fabricating weather or sightings.

The broad UK guide is supplemented by every species-level candidate returned in nearby seasonal records, up to a disclosed provider cap of 3,000 taxa. Non-species taxonomic groups are excluded. Species outside the guide receive record-based labels, photos and source links but no invented habitat or weather score. Guide notes use broad UK habitat and seasonal knowledge; added notes have not been independently source-checked or expert-validated. Results sort first by historical record count, then scouting signals. Search, habitat filters, list modes and progressive display support the larger candidate list. This remains an incomplete survey, not a calibrated forecasting model. GPS bounds are a coarse UK-area guard, not a national border check. The app does not establish identity, edibility, access rights, or the presence of a species in a particular woodland.

Offline: service worker caches the shell and viewed photos; browser local storage stores one last report. No analytics or app backend. Coordinates necessarily go to third-party weather and sightings APIs. Private hosting authentication may prevent cold offline launches on some browsers.

Deploy `dist/` to any static PWA-compatible HTTPS host. Manifest and service worker assume the origin root; adapt their scope and start URL for subdirectory deployments. Production photos should be checked for the credited licence and source link.
