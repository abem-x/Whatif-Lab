const STORAGE_KEY = 'whatif-lab-progress-v1';

const periodicTable = {
  1: { name: 'Hydrogen', symbol: 'H' },
  2: { name: 'Helium', symbol: 'He' },
  3: { name: 'Lithium', symbol: 'Li' },
  4: { name: 'Beryllium', symbol: 'Be' },
  5: { name: 'Boron', symbol: 'B' },
  6: { name: 'Carbon', symbol: 'C' },
  7: { name: 'Nitrogen', symbol: 'N' },
  8: { name: 'Oxygen', symbol: 'O' },
  9: { name: 'Fluorine', symbol: 'F' },
  10: { name: 'Neon', symbol: 'Ne' },
  11: { name: 'Sodium', symbol: 'Na' },
  12: { name: 'Magnesium', symbol: 'Mg' },
  13: { name: 'Aluminum', symbol: 'Al' },
  14: { name: 'Silicon', symbol: 'Si' },
  15: { name: 'Phosphorus', symbol: 'P' },
  16: { name: 'Sulfur', symbol: 'S' },
  17: { name: 'Chlorine', symbol: 'Cl' },
  18: { name: 'Argon', symbol: 'Ar' },
  19: { name: 'Potassium', symbol: 'K' },
  20: { name: 'Calcium', symbol: 'Ca' }
};

const defaultProgress = {
  experiments: {
    physics: false,
    chemistry: false,
    biology: false,
    challenge: false
  },
  challengeScore: 0,
  challengeAttempts: 0,
  badges: []
};

function safeLoadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress, experiments: { ...defaultProgress.experiments }, badges: [] };
    const parsed = JSON.parse(raw);
    return {
      experiments: { ...defaultProgress.experiments, ...(parsed.experiments || {}) },
      challengeScore: Number.isFinite(parsed.challengeScore) ? parsed.challengeScore : 0,
      challengeAttempts: Number.isFinite(parsed.challengeAttempts) ? parsed.challengeAttempts : 0,
      badges: Array.isArray(parsed.badges) ? parsed.badges : []
    };
  } catch (error) {
    return { ...defaultProgress, experiments: { ...defaultProgress.experiments }, badges: [] };
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Progress could not be saved.', error);
  }
}

const progress = safeLoadProgress();

function renderProgressDashboard() {
  const completedCount = Object.values(progress.experiments).filter(Boolean).length;
  const badgeList = document.getElementById('badge-list');
  const badges = [
    { id: 'physics', label: 'Motion Explorer', earned: progress.experiments.physics },
    { id: 'chemistry', label: 'Atomic Builder', earned: progress.experiments.chemistry },
    { id: 'biology', label: 'Cell Mapper', earned: progress.experiments.biology },
    { id: 'challenge', label: 'Challenge Champion', earned: progress.experiments.challenge }
  ];

  badgeList.innerHTML = badges
    .map(
      (badge) => `
        <div class="badge ${badge.earned ? 'earned' : ''}">
          ${badge.earned ? '✓ ' : '— '}${badge.label}
        </div>
      `
    )
    .join('');

  document.getElementById('completed-count').textContent = String(completedCount);
  document.getElementById('badge-count').textContent = String(badges.filter((badge) => badge.earned).length);
  document.getElementById('challenge-score').textContent = `${progress.challengeScore}/${Math.max(progress.challengeAttempts, 1)}`;
}

function markExperiment(name) {
  if (!progress.experiments[name]) {
    progress.experiments[name] = true;
    saveProgress(progress);
    renderProgressDashboard();
  }
}

function resetProgress() {
  Object.assign(progress, JSON.parse(JSON.stringify(defaultProgress)));
  saveProgress(progress);
  renderProgressDashboard();
}

function initPhysics() {
  const gravitySelect = document.getElementById('gravity-select');
  const speedSlider = document.getElementById('speed-slider');
  const angleSlider = document.getElementById('angle-slider');
  const speedOutput = document.getElementById('speed-output');
  const angleOutput = document.getElementById('angle-output');
  const timeOutput = document.getElementById('time-output');
  const distanceOutput = document.getElementById('distance-output');
  const heightOutput = document.getElementById('height-output');
  const flightOutput = document.getElementById('flight-output');
  const canvas = document.getElementById('projectile-canvas');
  const ctx = canvas.getContext('2d');

  const gravityMap = { earth: 9.81, moon: 1.62, mars: 3.71 };
  let animationFrameId = null;
  let simulationTime = 0;
  let isPlaying = false;
  let currentGravity = gravityMap[gravitySelect.value];

  function updatePhysicsValues() {
    const speed = Number(speedSlider.value);
    const angle = Number(angleSlider.value);
    const gravity = gravityMap[gravitySelect.value];
    currentGravity = gravity;
    speedOutput.textContent = `${speed} m/s`;
    angleOutput.textContent = `${angle}°`;

    const angleRad = (angle * Math.PI) / 180;
    const flightTime = (2 * speed * Math.sin(angleRad)) / gravity;
    const range = (speed * speed * Math.sin(2 * angleRad)) / gravity;
    const maxHeight = (speed * speed * (Math.sin(angleRad) ** 2)) / (2 * gravity);

    timeOutput.textContent = `${simulationTime.toFixed(2)} s`;
    distanceOutput.textContent = `${(simulationTime * speed * Math.cos(angleRad)).toFixed(2)} m`;
    heightOutput.textContent = `${Math.max(0, (speed * Math.sin(angleRad) * simulationTime) - 0.5 * gravity * simulationTime * simulationTime).toFixed(2)} m`;
    flightOutput.textContent = `${flightTime.toFixed(2)} s`;
    drawProjectileScene();
  }

  function drawSegmentPath(points, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  function computeTrajectory(gravity, speed, angle) {
    const angleRad = (angle * Math.PI) / 180;
    const flightTime = (2 * speed * Math.sin(angleRad)) / gravity;
    const points = [];
    const maxT = Math.max(flightTime, 0.1);

    for (let t = 0; t <= maxT; t += 0.05) {
      const x = speed * Math.cos(angleRad) * t;
      const y = speed * Math.sin(angleRad) * t - 0.5 * gravity * t * t;
      if (y < 0) break;
      points.push({ x, y });
    }
    return { points, flightTime };
  }

  function drawProjectileScene() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 32;
    const xScale = (width - padding * 2) / 120;
    const yScale = (height - padding * 2) / 80;

    ctx.fillStyle = '#07152b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(176, 210, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let x = padding; x < width - padding; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    for (let y = padding; y < height - padding; y += 40) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(width - padding, padding);
    ctx.strokeStyle = '#7fd0ff';
    ctx.stroke();

    const earth = computeTrajectory(gravityMap.earth, Number(speedSlider.value), Number(angleSlider.value));
    const moon = computeTrajectory(gravityMap.moon, Number(speedSlider.value), Number(angleSlider.value));

    const drawPoints = (points, color) => {
      const transformed = points.map((point) => ({
        x: padding + point.x * xScale,
        y: height - padding - point.y * yScale
      }));
      drawSegmentPath(transformed, color);
    };

    drawPoints(earth.points, '#5ad8ff');
    drawPoints(moon.points, '#d7b5ff');

    const speed = Number(speedSlider.value);
    const angle = Number(angleSlider.value);
    const angleRad = (angle * Math.PI) / 180;
    const currentT = Math.min(simulationTime, (2 * speed * Math.sin(angleRad)) / currentGravity);
    const x = speed * Math.cos(angleRad) * currentT;
    const y = speed * Math.sin(angleRad) * currentT - 0.5 * currentGravity * currentT * currentT;

    const dotX = padding + x * xScale;
    const dotY = height - padding - y * yScale;

    ctx.beginPath();
    ctx.fillStyle = '#f9e6a4';
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dfeefd';
    ctx.font = '12px Segoe UI';
    ctx.fillText('x', width - padding - 12, height - padding + 20);
    ctx.fillText('y', padding - 12, padding + 12);
    ctx.fillText('Earth', 30, 28);
    ctx.fillText('Moon', 110, 28);
    ctx.fillStyle = '#5ad8ff';
    ctx.fillRect(15, 18, 10, 10);
    ctx.fillStyle = '#d7b5ff';
    ctx.fillRect(90, 18, 10, 10);
  }

  function setSimulationResultsFromCurrent() {
    const speed = Number(speedSlider.value);
    const angle = Number(angleSlider.value);
    const gravity = gravityMap[gravitySelect.value];
    const angleRad = (angle * Math.PI) / 180;
    const time = Math.min(simulationTime, (2 * speed * Math.sin(angleRad)) / gravity);
    const x = speed * Math.cos(angleRad) * time;
    const y = speed * Math.sin(angleRad) * time - 0.5 * gravity * time * time;

    const flightTime = (2 * speed * Math.sin(angleRad)) / gravity;
    const range = (speed * speed * Math.sin(2 * angleRad)) / gravity;
    const maxHeight = (speed * speed * (Math.sin(angleRad) ** 2)) / (2 * gravity);

    timeOutput.textContent = `${time.toFixed(2)} s`;
    distanceOutput.textContent = `${Math.max(0, x).toFixed(2)} m`;
    heightOutput.textContent = `${Math.max(0, y).toFixed(2)} m`;
    flightOutput.textContent = `${flightTime.toFixed(2)} s`;
    document.getElementById('time-output').textContent = `${time.toFixed(2)} s`;
    document.getElementById('distance-output').textContent = `${Math.max(0, range).toFixed(2)} m`;
    document.getElementById('height-output').textContent = `${maxHeight.toFixed(2)} m`;
  }

  function animateProjectile() {
    if (!isPlaying) return;
    const speed = Number(speedSlider.value);
    const angle = Number(angleSlider.value);
    const gravity = gravityMap[gravitySelect.value];
    const flightTime = (2 * speed * Math.sin((angle * Math.PI) / 180)) / gravity;

    simulationTime += 0.025;
    if (simulationTime >= flightTime) {
      simulationTime = flightTime;
      isPlaying = false;
      setSimulationResultsFromCurrent();
      drawProjectileScene();
      return;
    }

    setSimulationResultsFromCurrent();
    drawProjectileScene();
    animationFrameId = requestAnimationFrame(animateProjectile);
  }

  function stopAnimation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  function resetPhysicsSimulation() {
    stopAnimation();
    isPlaying = false;
    simulationTime = 0;
    updatePhysicsValues();
    markExperiment('physics');
  }

  function runPhysicsSimulation() {
    isPlaying = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animateProjectile);
    markExperiment('physics');
  }

  function pausePhysicsSimulation() {
    isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  speedSlider.addEventListener('input', () => {
    updatePhysicsValues();
  });

  angleSlider.addEventListener('input', () => {
    updatePhysicsValues();
  });

  gravitySelect.addEventListener('change', () => {
    updatePhysicsValues();
  });

  document.getElementById('physics-run').addEventListener('click', runPhysicsSimulation);
  document.getElementById('physics-pause').addEventListener('click', pausePhysicsSimulation);
  document.getElementById('physics-reset').addEventListener('click', resetPhysicsSimulation);
  document.getElementById('physics-replay').addEventListener('click', () => {
    simulationTime = 0;
    runPhysicsSimulation();
  });

  updatePhysicsValues();
}

function initChemistry() {
  const protonSlider = document.getElementById('proton-slider');
  const neutronSlider = document.getElementById('neutron-slider');
  const electronSlider = document.getElementById('electron-slider');
  const phSlider = document.getElementById('ph-slider');
  const atomVisual = document.getElementById('atom-visual');

  function updateAtomBuilder() {
    const protons = Number(protonSlider.value);
    const neutrons = Number(neutronSlider.value);
    const electrons = Number(electronSlider.value);
    const massNumber = protons + neutrons;
    const netCharge = electrons - protons;
    const element = periodicTable[protons] || { name: 'Unknown element', symbol: '?' };

    document.getElementById('atomic-number').textContent = String(protons);
    document.getElementById('mass-number').textContent = String(massNumber);
    document.getElementById('charge-number').textContent = `${netCharge > 0 ? '+' : ''}${netCharge}`;
    document.getElementById('element-name').textContent = element.name;

    atomVisual.innerHTML = '';
    const core = document.createElement('div');
    core.className = 'atom-core';
    atomVisual.appendChild(core);

    const electronsToPlace = Math.max(0, Math.min(electrons, 20));
    const radius = 72;
    for (let index = 0; index < electronsToPlace; index += 1) {
      const electron = document.createElement('div');
      const angle = (Math.PI * 2 * index) / Math.max(1, electronsToPlace);
      const x = 50 + Math.cos(angle) * radius * 0.5;
      const y = 50 + Math.sin(angle) * radius * 0.6;
      electron.className = 'electron';
      electron.style.left = `${x}%`;
      electron.style.top = `${y}%`;
      atomVisual.appendChild(electron);
    }

    markExperiment('chemistry');
  }

  protonSlider.addEventListener('input', updateAtomBuilder);
  neutronSlider.addEventListener('input', updateAtomBuilder);
  electronSlider.addEventListener('input', updateAtomBuilder);

  function updatePH() {
    const ph = Number(phSlider.value);
    document.getElementById('ph-output').textContent = ph.toFixed(1);

    const category = ph < 7 ? 'Acidic' : ph > 7 ? 'Basic' : 'Neutral';
    const explanation = ph < 7
      ? 'This solution has a higher concentration of hydrogen ions than neutral water.'
      : ph > 7
        ? 'This solution has a lower concentration of hydrogen ions than neutral water.'
        : 'A pH of 7 is considered neutral on this simplified educational scale.';

    document.getElementById('ph-category').textContent = category;
    document.getElementById('ph-explanation').textContent = explanation;
    markExperiment('chemistry');
  }

  phSlider.addEventListener('input', updatePH);

  updateAtomBuilder();
  updatePH();
}

const organelleData = {
  nucleus: {
    name: 'Nucleus',
    function: 'Contains DNA and controls many cell activities.',
    detail: 'Both plant and animal cells have a nucleus, which stores genetic information.'
  },
  membrane: {
    name: 'Cell membrane',
    function: 'Controls what enters and leaves the cell.',
    detail: 'The membrane is a thin boundary that helps maintain the internal environment.'
  },
  cytoplasm: {
    name: 'Cytoplasm',
    function: 'A jelly-like substance where many reactions happen.',
    detail: 'The cytoplasm contains dissolved materials and supports organelles.'
  },
  mitochondria: {
    name: 'Mitochondria',
    function: 'Release energy from food through respiration.',
    detail: 'They are important in both plant and animal cells.'
  },
  ribosomes: {
    name: 'Ribosomes',
    function: 'Build proteins from amino acids.',
    detail: 'Ribosomes are tiny structures found in many cells.'
  },
  cellwall: {
    name: 'Cell wall',
    function: 'Provides rigid support to plant cells.',
    detail: 'Plant cells have a cell wall outside the membrane; animal cells do not.'
  },
  chloroplast: {
    name: 'Chloroplast',
    function: 'Carries out photosynthesis to make food.',
    detail: 'Chloroplasts are found in plant cells and allow them to capture light energy.'
  },
  vacuole: {
    name: 'Large central vacuole',
    function: 'Stores water and helps maintain cell shape.',
    detail: 'Plant cells usually have one large vacuole, while animal cells have smaller vacuoles.'
  }
};

function initBiology() {
  const cellTypeSelect = document.getElementById('cell-type');
  const orgList = document.getElementById('cell-organelle-list');
  const cellDiagram = document.getElementById('cell-diagram');
  const organelleInfo = document.getElementById('organelle-info');
  const soluteA = document.getElementById('solute-a');
  const soluteB = document.getElementById('solute-b');
  const arrow = document.getElementById('osmosis-arrow');
  const summary = document.getElementById('osmosis-summary');

  const organelles = [
    { key: 'nucleus', label: 'Nucleus' },
    { key: 'membrane', label: 'Membrane' },
    { key: 'cytoplasm', label: 'Cytoplasm' },
    { key: 'mitochondria', label: 'Mitochondria' },
    { key: 'ribosomes', label: 'Ribosomes' },
    { key: 'cellwall', label: 'Cell wall' },
    { key: 'chloroplast', label: 'Chloroplasts' },
    { key: 'vacuole', label: 'Vacuole' }
  ];

  let selectedType = cellTypeSelect.value;
  let selectedOrganelle = 'nucleus';

  function renderOrganelleList() {
    orgList.innerHTML = '';
    organelles.forEach((organelle) => {
      if (selectedType === 'animal' && ['cellwall', 'chloroplast', 'vacuole'].includes(organelle.key)) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = organelle.label;
      button.className = organelle.key === selectedOrganelle ? 'active' : '';
      button.addEventListener('click', () => {
        selectedOrganelle = organelle.key;
        renderOrganelleList();
        renderOrganelleInfo();
      });
      orgList.appendChild(button);
    });
  }

  function renderOrganelleInfo() {
    const data = organelleData[selectedOrganelle];
    organelleInfo.innerHTML = `
      <h4>${data.name}</h4>
      <p><strong>Function:</strong> ${data.function}</p>
      <p>${data.detail}</p>
    `;
  }

  function renderCellDiagram() {
    cellDiagram.className = `cell-diagram ${selectedType}`;
    cellDiagram.innerHTML = '<div class="cell-shape"></div>';

    const positions = {
      animal: {
        membrane: { x: 50, y: 50 },
        nucleus: { x: 50, y: 42 },
        mitochondria: { x: 30, y: 62 },
        ribosomes: { x: 68, y: 57 },
        cytoplasm: { x: 70, y: 70 }
      },
      plant: {
        membrane: { x: 50, y: 50 },
        nucleus: { x: 49, y: 42 },
        mitochondria: { x: 28, y: 62 },
        ribosomes: { x: 71, y: 58 },
        cytoplasm: { x: 72, y: 68 },
        cellwall: { x: 50, y: 50 },
        chloroplast: { x: 36, y: 30 },
        vacuole: { x: 72, y: 63 }
      }
    };

    const current = positions[selectedType];
    Object.entries(current).forEach(([key, coord]) => {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `organelle ${key} ${selectedOrganelle === key ? 'active' : ''}`;
      node.style.left = `${coord.x}%`;
      node.style.top = `${coord.y}%`;
      node.setAttribute('aria-label', organelleData[key]?.name || 'Cell structure');
      node.addEventListener('click', () => {
        selectedOrganelle = key;
        renderOrganelleList();
        renderCellDiagram();
        renderOrganelleInfo();
      });
      cellDiagram.appendChild(node);
    });
  }

  cellTypeSelect.addEventListener('change', () => {
    selectedType = cellTypeSelect.value;
    if (selectedType === 'plant') {
      selectedOrganelle = 'nucleus';
    } else {
      selectedOrganelle = 'nucleus';
    }
    renderOrganelleList();
    renderCellDiagram();
    renderOrganelleInfo();
    markExperiment('biology');
  });

  function updateOsmosis() {
    const a = Number(soluteA.value);
    const b = Number(soluteB.value);
    document.getElementById('side-a-label').textContent = `${a}%`;
    document.getElementById('side-b-label').textContent = `${b}%`;

    if (a > b) {
      arrow.textContent = '→';
      arrow.className = 'osmosis-arrow left-right';
      summary.textContent = `Net water movement: from Side B to Side A because Side A has the higher solute concentration.`;
    } else if (b > a) {
      arrow.textContent = '←';
      arrow.className = 'osmosis-arrow right-left';
      summary.textContent = `Net water movement: from Side A to Side B because Side B has the higher solute concentration.`;
    } else {
      arrow.textContent = '↔';
      arrow.className = 'osmosis-arrow balanced';
      summary.textContent = 'The water concentration is equal on both sides, so net water movement is close to zero.';
    }

    markExperiment('biology');
  }

  soluteA.addEventListener('input', updateOsmosis);
  soluteB.addEventListener('input', updateOsmosis);

  renderOrganelleList();
  renderCellDiagram();
  renderOrganelleInfo();
  updateOsmosis();
}

const challengeBank = [
  {
    subject: 'Physics',
    difficulty: 'beginner',
    question: 'A ball is launched at 45° with a speed of 20 m/s on Earth. Which statement is most accurate?',
    options: [
      'The horizontal and vertical motions are independent when air resistance is ignored.',
      'The ball falls upward during the first half of flight.',
      'The time of flight depends only on horizontal motion.',
      'Gravity makes the projectile speed increase continuously.'
    ],
    answer: 'The horizontal and vertical motions are independent when air resistance is ignored.',
    explanation: 'Horizontal motion remains at constant speed while vertical motion is accelerated by gravity, so the components can be treated separately.'
  },
  {
    subject: 'Chemistry',
    difficulty: 'beginner',
    question: 'A solution with a pH of 3 is best described as:',
    options: [
      'Acidic',
      'Neutral',
      'Basic',
      'A gas mixture'
    ],
    answer: 'Acidic',
    explanation: 'The pH scale runs from 0 to 14; values below 7 are acidic, so a pH of 3 is acidic.'
  },
  {
    subject: 'Biology',
    difficulty: 'intermediate',
    question: 'When a cell is placed in a solution with a higher solute concentration outside the cell, what happens to water movement?',
    options: [
      'Water moves out of the cell by osmosis.',
      'Water moves into the cell by osmosis.',
      'Water does not move.',
      'Only solute particles move across the membrane.'
    ],
    answer: 'Water moves out of the cell by osmosis.',
    explanation: 'The external solution has a lower water concentration, so water tends to move out of the cell toward the more concentrated side.'
  }
];

function initChallenge() {
  const subjectNode = document.getElementById('challenge-subject');
  const difficultyNode = document.getElementById('challenge-difficulty');
  const questionNode = document.getElementById('challenge-question');
  const optionsNode = document.getElementById('challenge-options');
  const feedbackNode = document.getElementById('challenge-feedback');
  const progressFill = document.getElementById('challenge-progress');
  const nextButton = document.getElementById('challenge-next');
  const submitButton = document.getElementById('challenge-submit');
  const skipButton = document.getElementById('challenge-skip');

  let currentIndex = 0;
  let selectedAnswer = null;
  let answered = false;
  let score = 0;

  function renderQuestion() {
    const challenge = challengeBank[currentIndex];
    if (!challenge) return;

    subjectNode.textContent = challenge.subject;
    difficultyNode.textContent = `Difficulty: ${challenge.difficulty}`;
    questionNode.textContent = challenge.question;
    optionsNode.innerHTML = '';
    feedbackNode.textContent = 'Choose your prediction before checking the answer.';
    feedbackNode.className = 'feedback-box';
    selectedAnswer = null;
    answered = false;

    challenge.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-button';
      button.textContent = option;
      button.addEventListener('click', () => {
        if (answered) return;
        selectedAnswer = option;
        document.querySelectorAll('.option-button').forEach((el) => el.classList.remove('selected'));
        button.classList.add('selected');
      });
      optionsNode.appendChild(button);
    });

    const total = challengeBank.length;
    progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;
  }

  function revealAnswer() {
    const challenge = challengeBank[currentIndex];
    const buttons = Array.from(optionsNode.querySelectorAll('.option-button'));
    buttons.forEach((button) => {
      button.disabled = true;
      const isCorrect = button.textContent === challenge.answer;
      if (isCorrect) button.classList.add('correct');
      if (selectedAnswer && button.textContent === selectedAnswer && !isCorrect) {
        button.classList.add('incorrect');
      }
    });

    const correct = selectedAnswer === challenge.answer;
    const message = correct
      ? `Correct! ${challenge.explanation}`
      : `Not quite. The correct answer is: ${challenge.answer}. ${challenge.explanation}`;

    feedbackNode.textContent = message;
    feedbackNode.classList.add(correct ? 'success' : 'error');
    answered = true;

    if (correct) {
      score += 1;
    }

    progress.challengeAttempts += 1;
    progress.challengeScore = score;
    saveProgress(progress);
    renderProgressDashboard();
    markExperiment('challenge');
  }

  function skipChallenge() {
    const challenge = challengeBank[currentIndex];
    feedbackNode.textContent = `Skipped. ${challenge.explanation}`;
    selectedAnswer = null;
    answered = true;
  }

  function advanceChallenge() {
    if (currentIndex < challengeBank.length - 1) {
      currentIndex += 1;
      renderQuestion();
    } else {
      currentIndex = 0;
      renderQuestion();
      score = 0;
      progress.challengeScore = 0;
      saveProgress(progress);
      renderProgressDashboard();
    }
  }

  submitButton.addEventListener('click', () => {
    if (!selectedAnswer) {
      feedbackNode.textContent = 'Pick an answer before checking your prediction.';
      return;
    }
    revealAnswer();
  });

  skipButton.addEventListener('click', () => {
    skipChallenge();
  });

  nextButton.addEventListener('click', () => {
    advanceChallenge();
  });

  renderQuestion();
}

function buildSummaryReport() {
  const speed = Number(document.getElementById('speed-slider').value);
  const angle = Number(document.getElementById('angle-slider').value);
  const gravityName = document.getElementById('gravity-select').value;
  const angleDegrees = Number(document.getElementById('angle-slider').value);
  const protonCount = Number(document.getElementById('proton-slider').value);
  const neutronCount = Number(document.getElementById('neutron-slider').value);
  const electronCount = Number(document.getElementById('electron-slider').value);
  const phValue = Number(document.getElementById('ph-slider').value);
  const cellType = document.getElementById('cell-type').value;
  const soluteA = Number(document.getElementById('solute-a').value);
  const soluteB = Number(document.getElementById('solute-b').value);
  const projectileFlight = Number(document.getElementById('flight-output').textContent.replace(' s', '')) || 0;
  const projectileRange = Number(document.getElementById('distance-output').textContent.replace(' m', '')) || 0;
  const projectileHeight = Number(document.getElementById('height-output').textContent.replace(' m', '')) || 0;

  return `WhatIf Lab experiment report\n\n` +
    'Experiment summary\n' +
    `- Physics: gravity preset = ${gravityName}; initial speed = ${speed} m/s; launch angle = ${angleDegrees}°; flight time = ${projectileFlight.toFixed(2)} s; range = ${projectileRange.toFixed(2)} m; max height = ${projectileHeight.toFixed(2)} m.\n` +
    `- Chemistry: atom configuration = ${protonCount} protons, ${neutronCount} neutrons, ${electronCount} electrons; pH = ${phValue.toFixed(1)}; educational model assumes simplified electron shells and does not claim a full physical atom model.\n` +
    `- Biology: cell type = ${cellType}; solute A = ${soluteA}%; solute B = ${soluteB}%; this is a conceptual osmosis model showing net water movement across a selectively permeable membrane.\n\n` +
    'Relevant equations\n' +
    '- Projectile motion: x(t) = v₀ cos(θ) · t; y(t) = v₀ sin(θ) · t − ½gt²; range = v₀² sin(2θ) / g\n' +
    '- pH: pH = −log₁₀[H⁺]\n\n' +
    'Assumptions and observations\n' +
    '- The projectile model neglects air resistance and assumes launch and landing heights are equal.\n' +
    '- The atom builder uses a teaching model and displays simplified shell locations.\n' +
    '- The osmosis model illustrates conceptually how water moves from a region of higher water concentration toward a lower water concentration.\n\n' +
    'This report is a simulated student lab summary and should not be confused with direct experimental measurements.';
}

function initProgressReports() {
  const reportButton = document.getElementById('report-button');
  const printButton = document.getElementById('print-report');
  const reportOutput = document.getElementById('report-output');
  const resetButton = document.getElementById('reset-progress');

  function updateReport() {
    const summary = buildSummaryReport();
    reportOutput.textContent = summary;
    return summary;
  }

  reportButton.addEventListener('click', () => {
    const summary = updateReport();

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatif-lab-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  });

  printButton.addEventListener('click', () => {
    updateReport();
    window.print();
  });

  resetButton.addEventListener('click', () => {
    const confirmed = window.confirm('Reset your saved learning progress?');
    if (confirmed) {
      resetProgress();
      reportOutput.textContent = 'Progress has been reset.';
    }
  });

  updateReport();
}

function initHomeNav() {
  document.querySelector('.button.primary[href="#experiments"]').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('experiments').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initPhysics();
  initChemistry();
  initBiology();
  initChallenge();
  initProgressReports();
  initHomeNav();
  renderProgressDashboard();
});
