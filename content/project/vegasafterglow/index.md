---
title: VegasAfterglow
summary: High-performance framework for gamma-ray burst afterglow modeling.
tags:
  - Gamma-Ray Bursts
  - Afterglow Modeling
  - C++
  - Python
  - Open Source
date: '2025-01-01T00:00:00Z'

external_link: ''

image:
  caption: ''
  focal_point: Smart

links:
  - icon: github
    icon_pack: fab
    name: GitHub
    url: https://github.com/YihanWangAstro/VegasAfterglow
  - icon: python
    icon_pack: fab
    name: PyPI
    url: https://pypi.org/project/VegasAfterglow/
url_code: 'https://github.com/YihanWangAstro/VegasAfterglow'
url_pdf: ''
url_slides: ''
url_video: ''
---

VegasAfterglow is a high-performance computational framework combining C++ efficiency with Python accessibility for gamma-ray burst afterglow modeling.

```
$ pip install VegasAfterglow
$ python -c "import VegasAfterglow; print('ready')"
ready
┌─────────────────────────────────────────────┐
│  VegasAfterglow                             │
│  Light curve generation   ~ms               │
│  MCMC inference           ✓                 │
│  Forward + reverse shock  ✓                 │
│  Synchrotron self-Compton ✓                 │
│  Structured jets          ✓                 │
└─────────────────────────────────────────────┘
```

**Key Features:**
- Generates light curves in milliseconds — enabling rapid MCMC parameter inference
- Forward and reverse shock modeling across relativistic and non-relativistic regimes
- Synchrotron self-Compton emission
- Flexible jet structures with arbitrary viewing angles
- Python interface for seamless integration with standard fitting tools

**Publication:** Wang, Chen & Zhang (2025), JHEAP
