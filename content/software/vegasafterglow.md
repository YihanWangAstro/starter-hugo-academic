---
# Software page, block 1: VegasAfterglow — description and physics (left) + logo and links (right).
widget: blank
headless: true
weight: 10
design:
  columns: '1'
  css_class: portal-block
---

<div class="p-title"><h2>VegasAfterglow</h2><a class="p-more" href="https://github.com/YihanWangAstro/VegasAfterglow" target="_blank" rel="noopener">GitHub &raquo;</a></div>
<div class="p-row">
<div class="p-col p-col-wide p-prose">

VegasAfterglow is a high-performance computational framework for gamma-ray burst afterglow modeling, combining C++ efficiency with Python accessibility. It generates light curves in milliseconds, enabling rapid MCMC parameter inference that would otherwise be computationally prohibitive. The framework also offers more comprehensive physics, including reverse shock emission, synchrotron self-Compton, and flexible jet structures for multi-wavelength afterglow analysis.

<div class="p-cards p-cards-3">
<div class="p-card"><div class="p-card-head">Shock dynamics</div><ul class="p-plain"><li>Forward and reverse shock modeling across relativistic and non-relativistic regimes</li><li>Adiabatic and radiative blast wave solutions</li><li>Support for various ambient medium types with energy and mass injection</li></ul></div>
<div class="p-card"><div class="p-card-head">Jet structure &amp; geometry</div><ul class="p-plain"><li>Structured jet profiles with arbitrary viewing angles</li><li>Jet spreading dynamics and non-axisymmetric structures</li><li>Complex geometric configurations for realistic modeling</li></ul></div>
<div class="p-card"><div class="p-card-head">Radiation mechanisms</div><ul class="p-plain"><li>Synchrotron radiation with self-absorption (SSA)</li><li>Inverse Compton scattering including synchrotron self-Compton (SSC)</li><li>Pairwise IC between shock populations with Klein-Nishina corrections</li></ul></div>
</div>

</div>
<div class="p-col p-col-narrow">
<figure class="p-shot p-shot-logo"><img src="/uploads/vegasafterglow-logo.svg" alt="VegasAfterglow logo"></figure>
<div class="p-cards">
<a class="p-card" href="https://ui.adsabs.harvard.edu/abs/2026JHEAp..5000490W/abstract" target="_blank" rel="noopener"><span class="p-card-label">Paper</span><div class="p-card-head">JHEAp, 5, 100490 (2026)</div></a>
<a class="p-card" href="https://github.com/YihanWangAstro/VegasAfterglow" target="_blank" rel="noopener"><span class="p-card-label">Code</span><div class="p-card-head">GitHub repository</div></a>
<a class="p-card" href="https://pypi.org/project/VegasAfterglow/" target="_blank" rel="noopener"><span class="p-card-label">Install</span><div class="p-card-head">PyPI</div><div class="p-card-sub"><code>pip install VegasAfterglow</code></div></a>
</div>
</div>
</div>
