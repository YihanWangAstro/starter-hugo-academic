---
widget: hero
headless: true  # This file represents a page section.
weight: 30
# ... Put Your Section Options Here (title etc.) ...

title: SpaceHub
#summary: 
# Hero image (optional). Enter filename of an image in the assets/media/ folder.


hero_media: 'icon.png'

design:
  background:
    gradient_start: '#4bb4e3'
    gradient_end: '#2b94c3'
    gradient_angle: 180
    #Text color (true=light, false=dark, or remove for the dynamic theme color).
    text_color_light: true


# Call to action links (optional).
#   Display link(s) by specifying a URL and label below. Icon is optional for `cta`.
#   Remove a link/note by deleting a cta/note block.
cta:
  url: 'https://github.com/YihanWangAstro/SpaceHub/fork'
  label: Fork SpaceHub
  icon_pack: fas
  icon: download
cta_alt:
  url: 'https://github.com/YihanWangAstro/SpaceHub/'
  label: Github Repository


# Note. An optional note to show underneath the links.
cta_note:
  label: 
---

#### SpaceHub is a state-of-the-art gravitational dynamics framework designed to solve challenging few-body problems with exceptional precision and efficiency. From supermassive black hole binaries to planetary system evolution, SpaceHub handles extreme scenarios, including large mass ratios, highly eccentric orbits, and close gravitational encounters that often challenge conventional numerical integrators. Built with advanced algorithmic regularization and rigorous round-off error control, it enables reliable long-term integrations where standard codes like REBOUND may struggle with numerical accuracy.

<div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin: 30px 0;">
  <div style="text-align: center; max-width: 45%;">
    <h4>RK4 (irreversible)</h4>
    <img src="/uploads/Picture1.gif" alt="RK4 (irreversible)" style="width: 100%; height: auto;" />
  </div>
  <div style="text-align: center; max-width: 45%;">
    <h4>Symplectic (reversible)</h4>
    <img src="/uploads/Picture2.gif" alt="Symplectic (reversible)" style="width: 100%; height: auto;" />
  </div>
</div>

[**Read the paper: MNRAS, 503, 6005-6017 (2021)**](https://ui.adsabs.harvard.edu/abs/2021MNRAS.505.1053W/abstract)

<!---[![GitHub stars](https://img.shields.io/github/stars/YihanWangAstro/SpaceHub.svg?style=social&label=Star&maxAge=2592000)](https://github.com/YihanWangAstro/SpaceHub/stargazers/)--->


