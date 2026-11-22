---
title: Monmouth Patriot Project — foundation, approved sources, standards, and the first names and places
riskTier: medium
license: Unlicense
provenance: >-
  Roster rows from William S. Stryker's Official Register (1872), Internet Archive scan, public domain by expired
  copyright; NARA M804 pension files from the NARA catalog, US federal records; place names from USGS GNIS, US
  federal data; marker facts and links from HMDB under its terms, with no text or images copied. Each source is used
  only once its entry on sources/allowlist.yml is approved by the rights reviewer for the specific copy. No SAR, DAR
  or commercial genealogy database, no Wikipedia text, and nothing from the owner's earlier private research.
definitionOfShipped: >-
  The project repository holds the scaffold, the approved-sources gate, the standards and the first roster and
  namesake entries, published openly, and at least one candidate partner (the Monmouth County Historical
  Association, the Monmouth Battlefield State Park friends group or the SAR New Jersey Society's Monmouth chapter)
  has been shown the roster and inventory and its response recorded.
beneficiary: >-
  Historical societies, parks, towns, teachers, students and descendants of Monmouth County, New Jersey; a named
  partner organisation is still to be secured.
milestones:
  - id: M1
    title: Foundation, approved-sources gate and standards
    rows: [AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10]
  - id: M2
    title: First names and places from approved sources
    rows: [AC-11, AC-12, AC-13]
---

## Summary

This run lays the foundation of the Monmouth Patriot Project, a public-domain record of the Revolutionary War
patriots connected to Monmouth County, New Jersey, and produces its first public lists of names and places. It is a
good deed because the records are public but scattered, the compilations that join them are proprietary, and many
patriots survive only as a name on a bridge or marker; a free, cited, reusable record serves historical societies,
schools and descendants ahead of the Battle of Monmouth's 250th anniversary on June 28, 2028.

## Scope

**In scope:** the repository scaffold (UNLICENSE, LICENSE-DATA.md, Astro + MDX with zod content collections that
keep sourced variants, permanent person ids and dated places, CI); the approved-sources list with its policy and a
CI gate; the research standards written fresh; the master roster seeded from the Monmouth County militia regiments
in Stryker's _Official Register_ (1872); and the namesake inventory seeded from USGS GNIS and HMDB.

**Out of scope:** profiles, stories, maps, data exports, search and launch, which are later runs of the project plan
(`planning/projects/monmouth-patriot-project/PLAN.md`); anything sent, posted or edited outside the project
repository.

## Risk

**Medium.** The dominant risk is licence and terms-of-service contamination: a roster row copied from the SAR
Patriot Research System, the DAR GRS or a commercial genealogy site under a public-domain citation, or a vendor's
restricted scan of a public-domain record. The second is accuracy: OCR errors, same-name men, and stating more
certainty than a record supports. Mitigations: no source is read until the rights reviewer approves it for the
specific copy; citations at page level; a written attestation of independent sourcing on every batch; every roster
row checked by a person against the page image and recorded as `verifiedBy`; evidence grades with fixed wording.
No refusal guardrail is triggered: the subjects are long-deceased historical people, no living person is recorded,
the work gives no medical, legal, financial or safety advice, and it benefits the public, not a for-profit entity.
Enslavement is stated plainly from the records, as the standards require. Expert review is not required.

## Approach

Work proceeds in two milestones, each delivered as pull requests to the project repository and reviewed by a
person.

- **M1 — Foundation, approved-sources gate and standards.** The scaffold and schemas come first, with tests for the
  variant rule, the id pattern and the dated places. The approved-sources list follows, with its CI gate shown
  failing on a pending source; four sources are analysed (Stryker 1872, the NARA catalog copy of M804, USGS GNIS and
  HMDB), and the rights reviewer, Christine Carter, approves or rejects each. The standards are written new, with
  the grade-wording table the build reads.
- **M2 — First names and places.** Once Stryker is approved, the roster is seeded from the Monmouth militia
  regiments, each row with its page, entered as a lead, checked by a person against the page image, and covered by
  the batch's attestation. Once GNIS and HMDB are approved, the first namesake entries are entered with their source
  and an accuracy field set to unverified. The citation reviewer, Amelia Carter, audits a stratified sample of the
  roster; rows she entered herself go to the maintainer's author-audited second pass.

Fee-needing records are out of this run: only free online copies are used.

## Definition of shipped

Not merely merged: the scaffold, gate, standards, roster seed and first namesake entries are published openly in the
project repository under the Unlicense and CC0, the roster audit has passed, and at least one candidate partner has
been shown the roster and inventory with its response recorded. A partner's adoption or citation remains the bar for
the project as a whole.
