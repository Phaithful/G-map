// src/lib/campusRouting.ts
export type GraphNode = { id: number; lng: number; lat: number };
export type GraphEdge = { from: number; to: number; w: number };

export type CampusGraph = {
  meta?: any;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const R = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const dφ = toRad(b.lat - a.lat);
  const dλ = toRad(b.lng - a.lng);

  const x =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

export function buildAdj(graph: CampusGraph) {
  const adj = new Map<number, Array<{ to: number; w: number }>>();
  for (const e of graph.edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, w: e.w });
  }
  return adj;
}

export function nearestNodeId(graph: CampusGraph, p: { lng: number; lat: number }) {
  let bestId = -1;
  let bestD = Infinity;
  for (const n of graph.nodes) {
    const d = haversineMeters({ lng: n.lng, lat: n.lat }, p);
    if (d < bestD) {
      bestD = d;
      bestId = n.id;
    }
  }
  return { id: bestId, dist: bestD };
}

// Binary min-heap for O(log n) priority queue operations
class MinHeap {
  private h: Array<{ id: number; f: number }> = [];

  push(id: number, f: number) {
    this.h.push({ id, f });
    this._up(this.h.length - 1);
  }

  pop() {
    const top = this.h[0];
    const last = this.h.pop()!;
    if (this.h.length > 0) {
      this.h[0] = last;
      this._down(0);
    }
    return top;
  }

  get size() {
    return this.h.length;
  }

  private _up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].f <= this.h[i].f) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }

  private _down(i: number) {
    const n = this.h.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.h[l].f < this.h[s].f) s = l;
      if (r < n && this.h[r].f < this.h[s].f) s = r;
      if (s === i) break;
      [this.h[s], this.h[i]] = [this.h[i], this.h[s]];
      i = s;
    }
  }
}

export function aStar(graph: CampusGraph, startId: number, goalId: number) {
  const adj = buildAdj(graph);

  const nodeById = new Map<number, GraphNode>();
  for (const n of graph.nodes) nodeById.set(n.id, n);

  const goal = nodeById.get(goalId);
  if (!nodeById.has(startId) || !goal) return null;

  // Slight heuristic inflation (5 %) makes A* commit to the more direct
  // branch at any intersection instead of treating both as equal.
  // The result stays within 5 % of the true shortest path.
  const EPSILON = 0.05;
  const h = (id: number) => {
    const n = nodeById.get(id)!;
    return haversineMeters({ lng: n.lng, lat: n.lat }, { lng: goal.lng, lat: goal.lat }) * (1 + EPSILON);
  };

  const open = new MinHeap();
  const cameFrom = new Map<number, number>();
  const gScore = new Map<number, number>();
  const closed = new Set<number>(); // never re-expand a settled node

  gScore.set(startId, 0);
  open.push(startId, h(startId));

  while (open.size > 0) {
    const { id: current } = open.pop();

    if (current === goalId) {
      const path: number[] = [];
      let cur = current;
      while (cur !== undefined) {
        path.push(cur);
        cur = cameFrom.get(cur) as number;
        if (cur === undefined) break;
      }
      path.reverse();
      return { path, distance: gScore.get(goalId) ?? 0 };
    }

    if (closed.has(current)) continue; // stale heap entry — skip
    closed.add(current);

    const currentG = gScore.get(current) ?? Infinity;
    for (const nb of adj.get(current) ?? []) {
      if (closed.has(nb.to)) continue;
      const tentative = currentG + nb.w;
      if (tentative < (gScore.get(nb.to) ?? Infinity)) {
        cameFrom.set(nb.to, current);
        gScore.set(nb.to, tentative);
        open.push(nb.to, tentative + h(nb.to)); // old entry becomes stale; closed set filters it
      }
    }
  }

  return null;
}

export function buildLineString(coords: Array<[number, number]>) {
  return {
    type: "LineString" as const,
    coordinates: coords,
  };
}

export function buildCampusRouteGeoJSON(args: {
  graph: CampusGraph;
  from: { lng: number; lat: number };
  to: { lng: number; lat: number };
  // how far user/destination can be from nearest path node before we refuse
  maxSnapMeters?: number;
}) {
  const { graph, from, to, maxSnapMeters = 150 } = args;

  const startSnap = nearestNodeId(graph, from);
  const endSnap = nearestNodeId(graph, to);

  if (startSnap.id < 0 || endSnap.id < 0) return null;
  if (startSnap.dist > maxSnapMeters || endSnap.dist > maxSnapMeters) {
    // user or destination too far from your recorded network
    return null;
  }

  const result = aStar(graph, startSnap.id, endSnap.id);
  if (!result) return null;

  const nodeById = new Map<number, GraphNode>();
  for (const n of graph.nodes) nodeById.set(n.id, n);

  const pathCoords: Array<[number, number]> = [];

  // ✅ start connector (user -> nearest node)
  pathCoords.push([from.lng, from.lat]);

  // ✅ graph path
  for (const id of result.path) {
    const n = nodeById.get(id)!;
    pathCoords.push([n.lng, n.lat]);
  }

  // ✅ end connector (nearest node -> destination building coordinate)
  pathCoords.push([to.lng, to.lat]);

  const connectorStart = startSnap.dist;
  const connectorEnd = endSnap.dist;

  const totalDistance = result.distance + connectorStart + connectorEnd;

  // Smooth the staircase grid pattern before rendering / step generation
  const smoothed = simplifyDPeucker(pathCoords, 0.000025);

  return {
    geometry: buildLineString(smoothed),
    coords: smoothed,
    distanceMeters: totalDistance,
    snapped: { startSnapMeters: startSnap.dist, endSnapMeters: endSnap.dist },
  };
}

// walking duration estimate (no Mapbox roads)
export function estimateWalkSeconds(distanceMeters: number, speedMps = 1.35) {
  // ~1.35 m/s ≈ 4.86 km/h
  return distanceMeters / speedMps;
}

// ─── Route step types ─────────────────────────────────────────────────────

export type TurnType =
  | "depart"
  | "straight"
  | "slight-left"
  | "left"
  | "slight-right"
  | "right"
  | "arrive";

export type RouteStep = {
  instruction: string;
  turn: TurnType;
  distanceM: number;
  durationS: number;
  startCoord: [number, number]; // [lng, lat]
};

// ─── Internal geometry helpers ────────────────────────────────────────────

function bearingDeg(a: [number, number], b: [number, number]): number {
  const φ1 = toRad(a[1]);
  const φ2 = toRad(b[1]);
  const dλ = toRad(b[0] - a[0]);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

function bearingDelta(from: number, to: number): number {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function turnTypeFromDelta(delta: number): TurnType {
  const abs = Math.abs(delta);
  if (abs < 20) return "straight";
  if (delta < 0) return abs <= 60 ? "slight-left" : "left";
  return abs <= 60 ? "slight-right" : "right";
}

function stepInstruction(turn: TurnType, distM: number): string {
  const d = distM < 1000 ? `${Math.round(distM)}m` : `${(distM / 1000).toFixed(1)}km`;
  switch (turn) {
    case "depart":       return `Head to destination`;
    case "straight":     return `Continue straight for ${d}`;
    case "slight-left":  return `Keep slight left`;
    case "left":         return `Turn left`;
    case "slight-right": return `Keep slight right`;
    case "right":        return `Turn right`;
    case "arrive":       return `You have arrived`;
  }
}

// Douglas-Peucker simplification operating on [lng, lat] coordinate pairs
function ptSegDist(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

export function simplifyDPeucker(
  coords: [number, number][],
  tolerance = 0.000025,
): [number, number][] {
  if (coords.length <= 2) return coords;
  let maxD = 0, maxI = 0;
  const first = coords[0], last = coords[coords.length - 1];
  for (let i = 1; i < coords.length - 1; i++) {
    const d = ptSegDist(coords[i], first, last);
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > tolerance) {
    const L = simplifyDPeucker(coords.slice(0, maxI + 1), tolerance);
    const R = simplifyDPeucker(coords.slice(maxI), tolerance);
    return [...L.slice(0, -1), ...R];
  }
  return [first, last];
}

// ─── Step generation ──────────────────────────────────────────────────────

export function buildRouteSteps(coords: [number, number][]): RouteStep[] {
  if (coords.length < 2) return [];

  const steps: RouteStep[] = [];
  let stepStart = 0;
  let stepTurn: TurnType = "depart";
  let stepDist = 0;
  let prevBearing = bearingDeg(coords[0], coords[1]);

  for (let i = 1; i < coords.length; i++) {
    const segDist = haversineMeters(
      { lng: coords[i - 1][0], lat: coords[i - 1][1] },
      { lng: coords[i][0], lat: coords[i][1] },
    );
    stepDist += segDist;

    if (i === coords.length - 1) {
      steps.push({
        turn: stepTurn,
        instruction: stepInstruction(stepTurn, stepDist),
        distanceM: stepDist,
        durationS: stepDist / 1.35,
        startCoord: coords[stepStart],
      });
      steps.push({
        turn: "arrive",
        instruction: "You have arrived",
        distanceM: 0,
        durationS: 0,
        startCoord: coords[i],
      });
      break;
    }

    const nextBearing = bearingDeg(coords[i], coords[i + 1]);
    const delta = bearingDelta(prevBearing, nextBearing);

    if (Math.abs(delta) >= 20) {
      steps.push({
        turn: stepTurn,
        instruction: stepInstruction(stepTurn, stepDist),
        distanceM: stepDist,
        durationS: stepDist / 1.35,
        startCoord: coords[stepStart],
      });
      stepStart = i;
      stepTurn = turnTypeFromDelta(delta);
      stepDist = 0;
    }
    prevBearing = nextBearing;
  }

  return steps;
}