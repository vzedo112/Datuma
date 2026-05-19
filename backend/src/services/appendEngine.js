// Append-only merge: combine a parent dataset's stored rows with rows from a
// new upload. Exact-duplicate rows (byte-identical, case/whitespace tolerant
// per cell) are kept once. Nothing is overwritten — that's the whole point.
//
// This deliberately doesn't do PK-based merge or conflict resolution. Those
// would mean discarding old values in favour of new ones, which violates the
// "never silently mutate user data" principle. Append is the safe minimum.

const ROW_CAP_PER_DATASET = 25_000;

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

// Merge a single dataset's prior rows with new rows.
//
// Strategy: hash prior rows on their shared-with-new columns; any new row
// whose hash is not in the prior set is appended. We use only shared columns
// for hashing so an added column on the new file doesn't make every row look
// "new."
//
// Returns { rows, added, deduped, schemaDiff, capApplied }.
function appendDataset(prior, fresh) {
  if (!prior || !Array.isArray(prior.rows) || prior.rows.length === 0) {
    // No prior rows to merge against — caller should treat the fresh data
    // as the canonical dataset.
    return null;
  }

  const priorCols = (prior.schema || []).map((c) => c.name);
  const freshCols = fresh.schema.map((c) => c.name);
  const sharedCols = priorCols.filter((c) => freshCols.includes(c));

  // If there's no schema overlap at all, the prior dataset is unrelated to
  // the new file — refuse to append (the caller should handle this).
  if (sharedCols.length === 0) {
    return null;
  }

  const priorHashes = new Set();
  for (const r of prior.rows) priorHashes.add(rowHash(r, sharedCols));

  let added = 0;
  let deduped = 0;
  const additions = [];
  for (const r of fresh.rows) {
    if (priorHashes.has(rowHash(r, sharedCols))) {
      deduped++;
    } else {
      additions.push(r);
      added++;
    }
  }

  // Combined dataset is prior rows + newly added rows. We keep prior first
  // because it represents the historical record; new rows are appended.
  let combined = prior.rows.concat(additions);
  let capApplied = false;
  if (combined.length > ROW_CAP_PER_DATASET) {
    // Keep the most recent rows — drop from the FRONT (oldest history).
    combined = combined.slice(combined.length - ROW_CAP_PER_DATASET);
    capApplied = true;
  }

  // Schema drift surfaces for transparency. We don't reconcile it; we just
  // tell the caller, who can decide what to do (typically: present this to
  // the user and use the new file's schema, since it's strictly newer).
  const addedCols = freshCols.filter((c) => !priorCols.includes(c));
  const removedCols = priorCols.filter((c) => !freshCols.includes(c));
  const schemaDiff = {
    addedColumns: addedCols,
    removedColumns: removedCols,
    sharedColumns: sharedCols,
  };

  return {
    rows: combined,
    added,
    deduped,
    schemaDiff,
    capApplied,
  };
}

module.exports = {
  appendDataset,
  ROW_CAP_PER_DATASET,
};
