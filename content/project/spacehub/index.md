---
title: SpaceHub
summary: High-precision gravitational few-body integration toolkit for astrophysics.
tags:
  - Few-Body Dynamics
  - N-Body Simulation
  - C++
  - Open Source
date: '2021-05-01T00:00:00Z'

external_link: ''

image:
  caption: ''
  focal_point: Smart

links:
  - icon: github
    icon_pack: fab
    name: GitHub
    url: https://github.com/YihanWangAstro/SpaceHub
  - icon: file-alt
    icon_pack: fas
    name: Paper
    url: https://ui.adsabs.harvard.edu/abs/2021MNRAS.505.1053W/abstract
url_code: 'https://github.com/YihanWangAstro/SpaceHub'
url_pdf: ''
url_slides: ''
url_video: ''
---

SpaceHub is a state-of-the-art few-body gravity integration toolkit built in C++. It implements Algorithmic Regularization (AR) and symplectic integrators to handle scenarios that break conventional codes:

```
$ spacehub --status
┌─────────────────────────────────────────────┐
│  SpaceHub v1.0                              │
│  Extreme mass ratios      ✓                 │
│  High eccentricities      ✓                 │
│  Close encounters         ✓                 │
│  Round-off error control  ✓                 │
│  Long-term integration    ✓                 │
└─────────────────────────────────────────────┘
```

**Key Features:**
- Algorithmic Regularization for extreme mass ratios (e.g., SMBH + stellar-mass objects)
- Symplectic integrators ensuring time-reversibility
- Rigorous round-off error control for long-term orbital evolution
- Easy-to-use API designed for community adoption
- Applications: SMBH binaries, planetary system evolution, chaotic star clusters

**Publication:** Wang et al. (2021), MNRAS, 505, 1053
