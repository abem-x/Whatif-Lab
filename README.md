# WhatIf Lab

WhatIf Lab is a responsive educational science website built with HTML5, CSS3, and vanilla JavaScript. It helps students explore geology-inspired concepts in a hands-on virtual environment using simplified classroom models for physics, chemistry, and biology.

## Architecture and file structure

- `index.html` — page structure and section layout
- `styles.css` — dark futuristic design, layout, mobile responsiveness, and reduced-motion support
- `app.js` — simulation logic, accessibility features, local storage, challenge system, and report generation

### Requirement mapping

- Home page and navigation: `index.html`
- Projectile motion simulation: `app.js` (`initPhysics`)
- Atom Builder and pH lab: `app.js` (`initChemistry`)
- Cell Explorer and osmosis model: `app.js` (`initBiology`)
- Challenge mode: `app.js` (`initChallenge`)
- Progress dashboard and report download: `app.js` (`renderProgressDashboard`, `initProgressReports`)
- Visual design and responsive rules: `styles.css`

## Features

- Physics: projectile motion with gravity presets for Earth, Moon, and Mars
- Chemistry: atom builder and pH scale exploration
- Biology: plant/animal cell explorer and osmosis simulation
- Challenge mode: multiple-choice prediction tasks with feedback
- Local progress tracking via `localStorage`
- Printable/downloading experiment report generated in-browser

## Run locally

From the project folder, launch a simple static web server:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in a desktop or mobile browser.

## GitHub Pages deployment

1. Push the project folder to a GitHub repository.
2. In the repository settings, open Pages.
3. Choose the main branch and the root folder (`/`).
4. Save the publisher. GitHub will generate a public URL for the site.

## Educational notes

- Simulations intentionally use simplified models for classroom learning.
- Results are educational, not direct measurements from a lab instrument.
- Students can reset their progress with the reset button in the progress dashboard.
