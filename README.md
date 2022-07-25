# Content Caching

This repo contains explorations into content caching for FF.

## Node scripts

There are some node scripts in `/scripts` which can read the places database, and extract lists from it. Open the files for a description of what they do.

```
npm install
node scripts/build-algolia-data.js
node scripts/full-text-search.js
node scripts/most-recent-urls.js
node scripts/scraper.js
node scripts/url-list.js
```

Apply the [marionette script](https://github.com/gregtatum/gecko/blob/content-caching/browser/components/migration/tests/marionette/test_build_content_cache.py) to mozilla-central to scrape, and adjust the paths: Marionette-scraping-script.patch

Run it with:

```
mach test browser/components/migration/tests/marionette/test_build_content_cache.py
```

The scraped data takes the form:

```
├── data
│   ├── cached
│   ├── hosts.json
│   ├── list
│   │   ├── arstechnica.com.json
│   │   └── www.amazon.com.json
│   ├── screenshot
│   │   ├── 2b1200daf27d-arstechnica.com.png
│   │   ├── 2b1203c9c275-arstechnica.com.png
│   │   ├── 2b120586054e-arstechnica.com.png
│   │   ├── 2b120696ecf1-arstechnica.com.png
│   │   ├── ...
│   │   └── 7226497b8b3c-arstechnica.com.png
│   └── text
│       ├── 2b1200daf27d-arstechnica.com.txt
│       ├── 2b1203c9c275-arstechnica.com.txt
│       ├── 2b120586054e-arstechnica.com.txt
│       ├── 2b120696ecf1-arstechnica.com.txt
│       ├── ...
│       └── 7226497b8b3c-arstechnica.com.txt
```

And the `data/list/HOST.json` file looks like:

```json
[
  {
    "url": "https://arstechnica.com/",
    "title": "Ars Technica",
    "description": "Serving the Technologist for more than a decade. IT news, reviews, and analysis.",
    "url_hash": 47358780747625
  },
  {
    "url": "https://arstechnica.com/tech-policy/2022/05/lawsuit-musk-manipulated-twitter-stock-price-in-attempt-to-renegotiate-sale/",
    "title": "Lawsuit: Musk manipulated Twitter stock price in attempt to renegotiate sale | Ars Technica",
    "description": null,
    "url_hash": 47360051565982
  },
  ...
]
```
