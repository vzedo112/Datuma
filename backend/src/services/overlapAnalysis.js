// Cross-file and cross-upload overlap detection.
//
// Detection is sample-based and read-only. We never deduplicate rows behind the
// user's back — we report findings so the user (or a future merge UI) can act.

function normalizeCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v.toString();
  if (typeof v === 'boolean') return v ? '1' : '0';
  return String(v).trim().toLowerCase();
}

function rowHash(row, columns) {
  const parts = [];
  for (const c of columns) parts.push(normalizeCell(row[c]));
  return parts.join('');
}

function buildRowHashSet(rows, columns) {
  const set = new Set();
  for (const r of rows) set.add(rowHash(r, columns));
  return set;
}

function intersectionSize(setA, setB) {
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  let n = 0;
  for (const v of smaller) if (larger.has(v)) n++;
  return n;
}

// Cross-file overlap: for every pair of files in the same upload, count rows
// that are identical (modulo case/whitespace) on the columns they share.
function analyzeCrossFile(datasets) {
  if (!Array.isArray(datasets) || datasets.length < 2) return [];

  const prepped = datasets.map((d) => ({
    name: d.name,
    rowCount: d.rowCount,
    rows: d.rows,
    columnSet: new Set(d.schema.map((c) => c.name)),
  }));

  const findings = [];
  for (let i = 0; i < prepped.length; i++) {
    for (let j = i + 1; j < prepped.length; j++) {
      const a = prepped[i];
      const b = prepped[j];

      const sharedCols = [...a.columnSet].filter((c) => b.columnSet.has(c));
      if (sharedCols.length === 0) continue;
      if (sharedCols.length / Math.max(a.columnSet.size, b.columnSet.size) < 0.5) {
        // Too little schema overlap to call this a real overlap.
        continue;
      }

      const setA = buildRowHashSet(a.rows, sharedCols);
      const setB = buildRowHashSet(b.rows, sharedCols);
      const overlap = intersectionSize(setA, setB);
      if (overlap === 0) continue;

      const overlapPct = Number(
        ((overlap / Math.min(a.rowCount, b.rowCount)) * 100).toFixed(1)
      );
      findings.push({
        kind: 'cross-file',
        between: [a.name, b.name],
        overlappingRows: overlap,
        overlapPct,
        sharedColumns: sharedCols,
        note: overlapPct >= 10
          ? `${overlapPct}% of the smaller file's rows are identical to rows in the other file.`
          : `${overlap.toLocaleString()} identical rows shared.`,
      });
    }
  }
  return findings;
}

// Cross-upload overlap: compare the new files' contents against the *sample*
// stored on each recent prior dashboard's analysisContext. If a high fraction
// of those sampled rows appear verbatim in the new upload, this is almost
// certainly an updated version of that prior dashboard's data.
function analyzeCrossUpload(currentDatasets, priorDashboards) {
  if (!Array.isArray(priorDashboards) || priorDashboards.length === 0) return [];

  const findings = [];
  for (const prior of priorDashboards) {
    const priorCtx = prior?.dashboard?.analysisContext;
    const priorDatasets = priorCtx?.datasets;
    if (!Array.isArray(priorDatasets) || priorDatasets.length === 0) continue;

    for (const pd of priorDatasets) {
      const sample = pd.sample;
      if (!Array.isArray(sample) || sample.length === 0) continue;
      const priorCols = (pd.schema || []).map((c) => c.name);
      if (priorCols.length === 0) continue;

      let bestMatch = null;
      for (const curDataset of currentDatasets) {
        const curCols = new Set(curDataset.schema.map((c) => c.name));
        const sharedCols = priorCols.filter((c) => curCols.has(c));
        if (sharedCols.length === 0) continue;
        if (sharedCols.length / Math.max(priorCols.length, curCols.size) < 0.5) continue;

        // Hash the current file's rows against the shared column subset, then
        // count how many sampled prior rows appear in that hash set.
        const curOnShared = buildRowHashSet(curDataset.rows, sharedCols);
        let matched = 0;
        for (const s of sample) {
          if (curOnShared.has(rowHash(s, sharedCols))) matched++;
        }
        const matchPct = Number(((matched / sample.length) * 100).toFixed(1));
        if (matched > 0 && (!bestMatch || matchPct > bestMatch.matchPct)) {
          bestMatch = {
            currentDataset: curDataset.name,
            priorDataset: pd.name,
            matched,
            sampleSize: sample.length,
            matchPct,
            sharedColumns: sharedCols,
          };
        }
      }

      if (bestMatch && bestMatch.matchPct >= 40) {
        findings.push({
          kind: 'cross-upload',
          priorDashboardId: prior.id,
          priorDashboardName: prior.name || prior.title || prior.filename,
          priorCreatedAt: prior.created_at,
          ...bestMatch,
          note: bestMatch.matchPct >= 80
            ? `Looks like a refresh of "${prior.name || prior.title || prior.filename}" — ${bestMatch.matchPct}% of its sampled rows appear in your new upload.`
            : `Some overlap with "${prior.name || prior.title || prior.filename}" — ${bestMatch.matchPct}% of its sampled rows match.`,
        });
      }
    }
  }
  // Highest-confidence match first.
  return findings.sort((a, b) => b.matchPct - a.matchPct).slice(0, 3);
}

module.exports = { analyzeCrossFile, analyzeCrossUpload };
