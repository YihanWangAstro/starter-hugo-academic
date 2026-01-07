---
widget: hero
headless: true  # This file represents a page section.
weight: 35
# ... Put Your Section Options Here (title etc.) ...

title: VegasAfterglow
#summary: 
# Hero image (optional). Enter filename of an image in the assets/media/ folder.


hero_media: 'vegasafterglow-logo.svg'

design:
  background:
    gradient_start: '#78909c'
    gradient_end: '#546e7a'
    gradient_angle: 180
    #Text color (true=light, false=dark, or remove for the dynamic theme color).
    text_color_light: true
  # Custom CSS to resize the hero image and adjust text size
  css_style: |
    .hero-media img {
      max-width: 25% !important;
      height: auto !important;
    }
    .hero-widget ul li {
      font-size: 0.5em !important;
    }


# Call to action links (optional).
#   Display link(s) by specifying a URL and label below. Icon is optional for `cta`.
#   Remove a link/note by deleting a cta/note block.
cta:
  url: 'https://github.com/YihanWangAstro/VegasAfterglow'
  label: GitHub Repository
  icon_pack: fab
  icon: github
cta_alt:
  url: 'https://pypi.org/project/VegasAfterglow/'
  label: Install via PyPI


# Note. An optional note to show underneath the links.
cta_note:
  label: 
---

#### VegasAfterglow is a high-performance computational framework for gamma-ray burst afterglow modeling, combining C++ efficiency with Python accessibility. Unlike existing tools such as afterglowpy, VegasAfterglow generates light curves in milliseconds — enabling rapid MCMC parameter inference that would otherwise be computationally prohibitive. The framework also offers more comprehensive physics, including reverse shock emission, synchrotron self-Compton, and flexible jet structures for multi-wavelength afterglow analysis:

<div style="font-size: 0.75em;">

**Shock Dynamics:**
- Forward and reverse shock modeling across relativistic and non-relativistic regimes
- Adiabatic and radiative blast wave solutions
- Support for various ambient medium types with energy and mass injection

**Jet Structure & Geometry:**
- Structured jet profiles with arbitrary viewing angles
- Jet spreading dynamics and non-axisymmetric structures
- Complex geometric configurations for realistic modeling

**Radiation Mechanisms:**
- Synchrotron radiation with self-absorption (SSA)
- Inverse Compton scattering including synchrotron self-Compton (SSC)
- Pairwise IC between shock populations with Klein-Nishina corrections

</div>

[![PyPI](https://img.shields.io/pypi/v/VegasAfterglow.svg)](https://pypi.org/project/VegasAfterglow/)