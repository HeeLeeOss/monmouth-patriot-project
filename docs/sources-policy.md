# Sources policy

The project builds only on sources whose rights we have checked, for the specific copy we read. This page is the
policy; [`sources/allowlist.yml`](../sources/allowlist.yml) is the list it governs.

## The gate

1. **Every source is on the list before it is read.** An entry records the source's title, custodian, URL and
   format; the **rights basis for the specific copy or edition** used; the **extraction method** and its accuracy
   baseline; and a **status**: `approved`, `pending` or `rejected`.
2. **Only the rights reviewer approves.** An entry stays `pending` until the rights reviewer (named in the project
   plan) decides it, and records their name and the date (`reviewer`, `decidedOn`) in their own commit. A reviewer
   without a GitHub account may have the maintainer record the decision for them: the commit then says the decision
   is the reviewer's, recorded at their request, and carries a `Reviewed-by:` line naming them. Nobody else approves,
   and an automated tool never decides a status. The schema refuses an approval without a reviewer.
3. **Rejections by project policy are labelled as such.** The seven rejections below were set by the project's own
   plan and task, not by a reviewer's decision, so their entries record `policy` (where that policy is) instead of
   `reviewer`. The rights reviewer may confirm them in their own commit, and may reject further sources.
4. **Nothing pending or rejected is cited.** The test suite runs `scripts/check-sources.ts` over everything in
   `src/content/` and `data/roster.csv`, including the ids of source records themselves: any source id whose entry
   is not `approved` fails CI. The check fails closed: a file it cannot read (no frontmatter, invalid JSON, a roster
   without a `sourceId` column, an unknown file type) is reported, not skipped.
5. **One citation, one entry.** A source id is either an entry's id, or that id, a double hyphen and a local part
   naming the page or document: `stryker-1872--p123` belongs to `stryker-1872` and to nothing else. Entry ids never
   contain a double hyphen.
6. **Decide per copy, not per record.** A record can be public domain while the scan, index or transcription of it
   that a vendor sells is not. The entry names the copy, and covers only that copy; another edition or copy of the
   same work needs its own entry.
7. **Order of work.** The roster task starts only once `stryker-1872` is approved; the places task only once
   `usgs-gnis` and `hmdb` are approved. Until then the check fails on any roster row or place that cites them.

## Rejected as sources of copied data

These are rejected by project policy, and each has a `rejected` entry giving the reason:

- **Ancestry**
- **Fold3**
- **FamilySearch**
- **Newspapers.com**
- **Find a Grave**
- **SAR Patriot Research System**
- **DAR GRS** (Genealogical Research System)

Nothing is scraped, bulk-downloaded, copied, rehosted or cited from them. Where they host a copy of a public-domain
record, we use a free public copy (NARA, the Library of Congress, archive.org) instead.

## The lead-lookup rule

A person may look up a name **that is already on the roster** in one of the rejected sources, to find out which
records might exist. What they find is a **lead**, never a fact: the claim then goes to the primary record, which is
what gets read, checked and cited. Rows are never added to the roster from a rejected source, and no field is copied
from one. An external id (a SAR patriot number, a DAR ancestor number, a Find a Grave memorial id) may be stored as a
link.

## Against laundering

Copying a compiled entry and attaching a plausible public-domain citation is the main way this policy could be broken.
So:

- **Cite the page or image actually read**, never a collection or database as a whole. Collection-level citations are
  rejected at review.
- **Every contributed batch carries an attestation** that its facts were read from the cited source directly, not
  taken from a rejected source.
- **Reviewers spot-check** for fields or normalisations that only a compiled database would produce; a hit rejects the
  batch.

## Other rules

- **No Wikipedia text.** Wikipedia is CC BY-SA, which would contaminate the project's public-domain data. Facts may be
  checked against Wikidata (CC0); Wikipedia is never a source.
- **No AI output as a source.** AI tools may help find, transcribe or draft; what they produce is checked by a person
  and is never cited.
- **Adding a source** means adding a `pending` entry with its analysis, in a pull request the rights reviewer decides.
