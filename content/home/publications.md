---
# An instance of the Pages widget.
# Documentation: https://wowchemy.com/docs/page-builder/
widget: pages

# This file represents a page section.
headless: true

# Order that this section appears on the page.
weight: 90

title: Recent Publications
subtitle: ''



content:
  autonumbering: true
  # Filter on criteria
  filters:
    folders:
      - publication
    tag: ''
    category: ''
    publication_type: ''
    author: ''
    exclude_featured: false
    exclude_future: false
    exclude_past: false
  # Choose how many pages you would like to display (0 = all pages)
  count: 10
  # Choose how many pages you would like to offset by
  offset: 0
  # Page order: descending (desc) or ascending (asc) date.
  order: desc
design:
  # Choose a view for the listings:
  view: citation
  columns: '2'
---

{{% callout note %}}
Quickly discover relevant content by [filtering publications](./publication/). 
A complete list of publications can also be found at the [NASA ADS](https://ui.adsabs.harvard.edu/search/q=orcid%3A0000-0002-8614-8721&sort=date+desc).
{{% /callout %}}
