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

export function aStar(graph: CampusGraph, startId: number, goalId: number) {
  const nodes = graph.nodes;
  const adj = buildAdj(graph);

  const nodeById = new Map<number, GraphNode>();
  for (const n of nodes) nodeById.set(n.id, n);

  const start = nodeById.get(startId);
  const goal = nodeById.get(goalId);
  if (!start || !goal) return null;

  const h = (id: number) => {
    const n = nodeById.get(id)!;
    return haversineMeters({ lng: n.lng, lat: n.lat }, { lng: goal.lng, lat: goal.lat });
  };

  const open = new Set<number>([startId]);
  const cameFrom = new Map<number, number>();

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  gScore.set(startId, 0);
  fScore.set(startId, h(startId));

  const popBest = () => {
    let best = -1;
    let bestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        best = id;
      }
    }
    open.delete(best);
    return best;
  };

  while (open.size > 0) {
    const current = popBest();
    if (current === goalId) {
      // reconstruct
      const path: number[] = [current];
      let cur = current;
      while (cameFrom.has(cur)) {
        cur = cameFrom.get(cur)!;
        path.push(cur);
      }
      path.reverse();
      return {
        path,
        distance: gScore.get(goalId) ?? 0,
      };
    }

    const neighbors = adj.get(current) ?? [];
    const currentG = gScore.get(current) ?? Infinity;

    for (const nb of neighbors) {
      const tentative = currentG + nb.w;
      const nbG = gScore.get(nb.to) ?? Infinity;
      if (tentative < nbG) {
        cameFrom.set(nb.to, current);
        gScore.set(nb.to, tentative);
        fScore.set(nb.to, tentative + h(nb.to));
        open.add(nb.to);
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

  return {
    geometry: buildLineString(pathCoords),
    distanceMeters: totalDistance,
    snapped: { startSnapMeters: startSnap.dist, endSnapMeters: endSnap.dist },
  };
}

// walking duration estimate (no Mapbox roads)
export function estimateWalkSeconds(distanceMeters: number, speedMps = 1.35) {
  // ~1.35 m/s ≈ 4.86 km/h
  return distanceMeters / speedMps;
}