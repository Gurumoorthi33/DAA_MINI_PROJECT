let points = [];
let depot = null;
let optimizedRoute = [];
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Distance calculation
function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Add single point
function addPoint() {
  const input = document.getElementById('coordInput').value.trim();
  if (!input) {
    showAlert('Please enter coordinates', 'warning');
    return;
  }

  const match = input.match(/(\d+)\s*,\s*(\d+)/);
  if (!match) {
    showAlert('Invalid format. Use: x,y', 'warning');
    return;
  }

  const x = parseInt(match[1]);
  const y = parseInt(match[2]);

  if (x < 0 || x > 500 || y < 0 || y > 400) {
    showAlert('Coordinates must be within canvas (0-500, 0-400)', 'warning');
    return;
  }

  points.push({ x, y });
  document.getElementById('coordInput').value = '';
  updateDisplay();
  showAlert('Point added successfully!', 'success');
}

// Add multiple points
function addMultiplePoints() {
  const input = document.getElementById('multiPoints').value.trim();
  if (!input) return;

  const matches = input.match(/\((\d+)\s*,\s*(\d+)\)/g);
  if (!matches) {
    showAlert('Invalid format. Use: (x1,y1),(x2,y2),...', 'warning');
    return;
  }

  let added = 0;
  matches.forEach(pt => {
    const coords = pt.match(/(\d+)\s*,\s*(\d+)/);
    if (coords) {
      const x = parseInt(coords[1]);
      const y = parseInt(coords[2]);
      if (x >= 0 && x <= 500 && y >= 0 && y <= 400) {
        points.push({ x, y });
        added++;
      }
    }
  });

  document.getElementById('multiPoints').value = '';
  updateDisplay();
  showAlert(`Added ${added} points successfully!`, 'success');
}

// Remove point
function removePoint(index) {
  points.splice(index, 1);
  updateDisplay();
}

// Set depot
function addDepot() {
  if (points.length === 0) {
    showAlert('Add at least one point first', 'warning');
    return;
  }
  depot = points[0];
  showAlert('Depot set at first point', 'info');
  updateDisplay();
}

// Generate random points
function generateRandom() {
  points = [];
  const count = 8 + Math.floor(Math.random() * 7);
  for (let i = 0; i < count; i++) {
    points.push({
      x: 30 + Math.floor(Math.random() * 440),
      y: 30 + Math.floor(Math.random() * 340)
    });
  }
  depot = points[0];
  updateDisplay();
  showAlert(`Generated ${count} random points`, 'success');
}

// Clear all
function clearAll() {
  points = [];
  depot = null;
  optimizedRoute = [];
  updateDisplay();
  document.getElementById('routeList').innerHTML = '';
  document.getElementById('totalDistance').textContent = '0';
  document.getElementById('pointCount').textContent = '0';
  document.getElementById('algorithmUsed').textContent = '-';
  document.getElementById('computeTime').textContent = '0ms';
  showAlert('All data cleared', 'info');
}

// Greedy algorithm
function greedyAlgorithm(pts) {
  const unvisited = [...pts];
  let current = depot || unvisited.shift();
  const route = [current];
  let totalDist = 0;

  while (unvisited.length) {
    let nearest = unvisited.reduce((min, p) =>
      distance(current, p) < distance(current, min) ? p : min
    );
    totalDist += distance(current, nearest);
    current = nearest;
    route.push(nearest);
    unvisited.splice(unvisited.indexOf(nearest), 1);
  }

  if (depot) {
    totalDist += distance(current, depot);
    route.push(depot);
  }

  return { route, distance: totalDist };
}

// 2-Opt algorithm
function twoOptAlgorithm(pts) {
  let result = greedyAlgorithm(pts);
  let route = result.route;
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        const dist1 = distance(route[i - 1], route[i]) + distance(route[j], route[j + 1]);
        const dist2 = distance(route[i - 1], route[j]) + distance(route[i], route[j + 1]);

        if (dist2 < dist1) {
          const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  let totalDist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDist += distance(route[i], route[i + 1]);
  }

  return { route, distance: totalDist };
}

// Genetic algorithm
function geneticAlgorithm(pts) {
  const populationSize = 50;
  const generations = 100;
  const mutationRate = 0.1;

  function createIndividual() {
    let ind = [...pts];
    for (let i = ind.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ind[i], ind[j]] = [ind[j], ind[i]];
    }
    if (depot) {
      ind = [depot, ...ind.filter(p => p !== depot), depot];
    }
    return ind;
  }

  function fitness(individual) {
    let dist = 0;
    for (let i = 0; i < individual.length - 1; i++) {
      dist += distance(individual[i], individual[i + 1]);
    }
    return 1 / (dist + 1);
  }

  function crossover(parent1, parent2) {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;
    const child = new Array(parent1.length);

    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

    let j = 0;
    for (let i = 0; i < parent2.length; i++) {
      if (!child.includes(parent2[i])) {
        while (child[j] !== undefined) j++;
        child[j] = parent2[i];
      }
    }

    return child;
  }

  function mutate(individual) {
    if (Math.random() < mutationRate) {
      let i = depot ? 1 : 0;
      let j = depot ? 1 : 0;
      while (i === j) {
        i = depot ? 1 + Math.floor(Math.random() * (individual.length - 2)) : Math.floor(Math.random() * individual.length);
        j = depot ? 1 + Math.floor(Math.random() * (individual.length - 2)) : Math.floor(Math.random() * individual.length);
      }
      [individual[i], individual[j]] = [individual[j], individual[i]];
    }
    return individual;
  }

  let population = Array.from({ length: populationSize }, createIndividual);

  for (let gen = 0; gen < generations; gen++) {
    population.sort((a, b) => fitness(b) - fitness(a));

    const newPopulation = population.slice(0, 10);

    while (newPopulation.length < populationSize) {
      const parent1 = population[Math.floor(Math.random() * 20)];
      const parent2 = population[Math.floor(Math.random() * 20)];
      let child = crossover(parent1, parent2);
      child = mutate(child);
      newPopulation.push(child);
    }

    population = newPopulation;
  }

  const bestRoute = population[0];
  let totalDist = 0;
  for (let i = 0; i < bestRoute.length - 1; i++) {
    totalDist += distance(bestRoute[i], bestRoute[i + 1]);
  }

  return { route: bestRoute, distance: totalDist };
}

// Optimize route
function optimizeRoute() {
  if (points.length < 2) {
    showAlert('Add at least 2 points to optimize', 'warning');
    return;
  }

  const algorithm = document.getElementById('algorithm').value;
  const startTime = performance.now();
  let result;

  switch (algorithm) {
    case 'greedy':
      result = greedyAlgorithm([...points]);
      break;
    case '2opt':
      result = twoOptAlgorithm([...points]);
      break;
    case 'genetic':
      result = geneticAlgorithm([...points]);
      break;
  }

  const endTime = performance.now();
  const computeTime = (endTime - startTime).toFixed(2);

  optimizedRoute = result.route;

  document.getElementById('totalDistance').textContent = result.distance.toFixed(2);
  document.getElementById('pointCount').textContent = points.length;
  document.getElementById('algorithmUsed').textContent = algorithm.toUpperCase();
  document.getElementById('computeTime').textContent = computeTime + 'ms';

  const routeListHTML = optimizedRoute.map((p, i) => `
    <div class="route-item">
      <div class="route-number">${i + 1}</div>
      <div>
        <strong>${i === 0 && depot ? '🏢 Depot' : '📍 Stop'}</strong>: (${p.x}, ${p.y})
        ${i < optimizedRoute.length - 1 ? `<br><small>↓ ${distance(p, optimizedRoute[i + 1]).toFixed(2)} units</small>` : ''}
      </div>
    </div>
  `).join('');

  document.getElementById('routeList').innerHTML = routeListHTML;
  updateDisplay();
  showAlert('Route optimized successfully!', 'success');
}

// Update display
function updateDisplay() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw optimized route
  if (optimizedRoute.length > 1) {
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(optimizedRoute[0].x, optimizedRoute[0].y);
    for (let i = 1; i < optimizedRoute.length; i++) {
        ctx.lineTo(optimizedRoute[i].x, optimizedRoute[i].y);
    }
    ctx.stroke();

    // Draw arrows
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      drawArrow(optimizedRoute[i], optimizedRoute[i + 1]);
    }
  }

  // Draw points
  points.forEach((p, i) => {
    const isDepot = depot && p.x === depot.x && p.y === depot.y;
    ctx.fillStyle = isDepot ? '#dc3545' : '#667eea';
    ctx.beginPath();
    ctx.arc(p.x, p.y, isDepot ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Poppins';
    ctx.fillText(isDepot ? '🏢' : i + 1, p.x - 6, p.y - 12);
  });

  // Update point list
  const pointListHTML = points.map((p, i) => `
    <div class="point-item">
      <span class="point-coords">${depot && p.x === depot.x && p.y === depot.y ? '🏢 ' : ''}(${p.x}, ${p.y})</span>
      <button class="btn-remove" onclick="removePoint(${i})">Remove</button>
    </div>
  `).join('');
  document.getElementById('pointList').innerHTML = pointListHTML || '<p style="text-align:center;color:#999;">No points added</p>';

  document.getElementById('pointCount').textContent = points.length;
}

// Draw arrow
function drawArrow(from, to) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  ctx.fillStyle = '#28a745';
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(midX - 8 * Math.cos(angle - Math.PI / 6), midY - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(midX - 8 * Math.cos(angle + Math.PI / 6), midY - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// Show alert
function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    alertBox.innerHTML = '';
  }, 3000);
}

// Canvas click to add point
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);
  points.push({ x, y });
  updateDisplay();
  showAlert(`Point added at (${x}, ${y})`, 'success');
});

// Initialize
updateDisplay();
