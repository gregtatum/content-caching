# Places DB Explorations

This repo contains explorations into reading the places database, and scraping the content of webpages.

```
npm install
npm run scraper
npm run url-list
```

Apply the marionette script to mozilla-central to scrape, and adjust the paths: Marionette-scraping-script.patch

Run it with:

```
mach test browser/components/migration/tests/marionette/test_build_content_cache.py
```
