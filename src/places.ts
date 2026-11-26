/**
 * Helpers for namesake place records: which citations count as a place's listing, where each one links, and how
 * to read the coordinate text the listings give.
 */

/** A GNIS feature (`usgs-gnis--f<feature id>`) or an HMDB marker page (`hmdb--m<marker number>`). */
const LISTING = /^(?:usgs-gnis--f|hmdb--m)(\d+)$/;

export const isListing = (sourceId: string): boolean => LISTING.test(sourceId);

/** The page a listing citation was read from, or undefined for any other citation. */
export const citationUrl = (sourceId: string): string | undefined => {
  const m = LISTING.exec(sourceId);
  if (!m) return undefined;
  return sourceId.startsWith("hmdb--")
    ? `https://www.hmdb.org/m.asp?m=${m[1]}`
    : `https://edits.nationalmap.gov/apps/gaz-domestic/public/summary/${m[1]}`;
};

export type Coordinates = { lat: number; lon: number };

const signed = (deg: number, hemi: string) => (hemi === "S" || hemi === "W" ? -deg : deg);

/**
 * Read coordinate text as a listing gives it: HMDB's degrees and decimal minutes ("40° 18.691′ N, 74° 11.364′ W")
 * or GNIS's packed degrees, minutes and seconds ("401646N 0742004W"). Undefined when the text is neither.
 */
export const parseCoordinateText = (text: string): Coordinates | undefined => {
  const hmdb = /^(\d{1,2})°\s*(\d{1,2}(?:\.\d+)?)′\s*([NS]),\s*(\d{1,3})°\s*(\d{1,2}(?:\.\d+)?)′\s*([EW])$/.exec(text.trim());
  if (hmdb) {
    const [, la, lam, ns, lo, lom, ew] = hmdb;
    return { lat: signed(+la! + +lam! / 60, ns!), lon: signed(+lo! + +lom! / 60, ew!) };
  }
  const gnis = /^(\d{2})(\d{2})(\d{2})([NS])\s+(\d{3})(\d{2})(\d{2})([EW])$/.exec(text.trim());
  if (gnis) {
    const [, la, lam, las, ns, lo, lom, los, ew] = gnis;
    return {
      lat: signed(+la! + +lam! / 60 + +las! / 3600, ns!),
      lon: signed(+lo! + +lom! / 60 + +los! / 3600, ew!),
    };
  }
  return undefined;
};
