/**
 * Demo QR code — a deterministic, QR-look pattern (finder squares in three
 * corners + a seeded data grid), not a real encoder. This is a mocked
 * visual for the ticket demo, the same "clearly a stand-in" spirit as the
 * AI service stubs — not meant to be scanned. Same seed always renders the
 * same pattern, so a given ticket's "QR" looks stable across views.
 */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    return (h >>> 8) / 0xffffff;
  };
}

const GRID = 21;

function buildCells(seed: string): boolean[][] {
  const rand = seededRandom(seed);
  const cells: boolean[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => rand() > 0.58)
  );

  function stampFinder(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[row + r][col + c] = border || inner;
      }
    }
  }
  stampFinder(0, 0);
  stampFinder(0, GRID - 7);
  stampFinder(GRID - 7, 0);

  return cells;
}

export function QRCode({ seed, size = 160 }: { seed: string; size?: number }) {
  const cells = buildCells(seed);

  return (
    <div style={{ width: size, height: size }} className="bg-white rounded-tile p-2 shrink-0">
      <svg viewBox={`0 0 ${GRID} ${GRID}`} width="100%" height="100%" shapeRendering="crispEdges">
        <rect x={0} y={0} width={GRID} height={GRID} fill="#ffffff" />
        {cells.map((row, r) =>
          row.map((filled, c) => (filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#111111" /> : null))
        )}
      </svg>
    </div>
  );
}
