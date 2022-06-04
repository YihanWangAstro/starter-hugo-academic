---
# Documentation: https://wowchemy.com/docs/managing-content/

title: 'SpaceHub: A high-performance gravity integration toolkit for few-body problems
  in astrophysics'
subtitle: ''
summary: ''
authors:
- Yi-Han Wang
- Nathan W.~C. Leigh
- Bin Liu
- Rosalba Perna
tags:
- gravitation
- 'methods: numerical'
- 'stars: kinematics and dynamics'
- planetary systems
- Astrophysics - Solar and Stellar Astrophysics
- Astrophysics - Earth and Planetary Astrophysics
- Astrophysics - Instrumentation and Methods for Astrophysics
- Physics - Computational Physics
categories: []
date: '2021-07-01'
lastmod: 2022-06-02T03:19:39-04:00
featured: true
draft: false

# Featured image
# To use, place an image named `featured.jpg/png` in your page's folder.
# Placement options: 1 = Full column width, 2 = Out-set, 3 = Screen-width
# Focal point options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
# Set `preview_only` to `true` to just use the image for thumbnails.
image:
  placement: 2
  caption: "Relative energy error and performance tests on a two body system with extreme eccentricity e=0.9999 and semi-major axis a = 1 AU. The central object has a mass of 1 solar mass and the test particle has a mass of 1 earth mass. We integrate the system for 1000 orbits. This test is designed to quantify how the different integration methods are able to handle extremely eccentric orbits and very close pair-wise approaches between particles."
  focal_point: "Smart"
  preview_only: false
  #alt_text: An optional description of the image for screen readers.


# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
publishDate: '2022-06-02T07:19:39.138833Z'
publication_types:
- '2'
abstract:  'We present the open source few-body gravity integration toolkit {\tt SpaceHub}. {\tt SpaceHub} offers a variety of algorithmic methods, including the unique algorithms AR-Radau, AR-Sym6, AR-ABITS and AR-chain+ which we show out-perform other methods in the literature and allow for fast, precise and accurate computations to deal with few-body problems ranging from interacting black holes to planetary dynamics. We show that AR-Sym6 and AR-chain+, with algorithmic regularization, chain algorithm, active round-off error compensation and a symplectic kernel implementation, are the fastest and most accurate algorithms to treat black hole dynamics with extreme mass ratios, extreme eccentricities and very close encounters. AR-Radau, the first regularized Radau integrator with round off error control down to 64 bits floating point machine precision, has the ability to handle extremely eccentric orbits and close approaches in long-term integrations. AR-ABITS, a bit efficient arbitrary precision method, achieves any precision with the least CPU cost compared to other open source arbitrary precision few-body codes. With the implementation of deep numerical and code optimization, these new algorithms in {\tt SpaceHub} prove superior to other popular high precision few-body codes in terms of performance, accuracy and speed. '
publication: '*mnras*'
doi: 10.1093/mnras/stab1189
links:
- name: arXiv
  url: https://arxiv.org/abs/2104.06413
---
