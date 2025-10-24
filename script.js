// Function to calculate Euclidean distance
function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// AI-inspired route optimization (Greedy approach)
function optimizeRoute() {
  const input = document.getElementById("points").value.trim();
  const resultDiv = document.getElementById("result");

  if (!input) {
    resultDiv.innerHTML = "<p style='color:red;'>⚠️ Please enter valid coordinates.</p>";
    return;
  }

  // Parse input like (2,3),(4,1)
  const points = input.match(/\((\d+),(\d+)\)/g)?.map(pt => {
    const [x, y] = pt.replace(/[()]/g, "").split(",").map(Number);
    return { x, y };
  });

  if (!points || points.length < 2) {
    resultDiv.innerHTML = "<p style='color:red;'>⚠️ Enter at least two points.</p>";
    return;
  }

  // Greedy algorithm: start from first point, choose nearest next
  const unvisited = [...points];
  let current = unvisited.shift();
  const route = [current];
  let totalDistance = 0;

  while (unvisited.length) {
    let nearest = unvisited.reduce((min, p) =>
      distance(current, p) < distance(current, min) ? p : min
    );
    totalDistance += distance(current, nearest);
    current = nearest;
    route.push(nearest);
    unvisited.splice(unvisited.indexOf(nearest), 1);
  }

  // Display result
  resultDiv.innerHTML = `
    <h3>🧩 Optimized Garbage Collection Route</h3>
    <div class="route">
      ${route.map((p, i) => `📍 Stop ${i + 1}: (${p.x}, ${p.y})`).join("<br>")}
    </div>
    <p><strong>🚗 Total Distance:</strong> ${totalDistance.toFixed(2)} units</p>
    <p><strong>🧠 Optimization Logic:</strong> Greedy nearest-neighbor (AI heuristic)</p>
  `;
}
