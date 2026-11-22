---
title: Monmouth Patriot Project — foundation, approved sources, standards, and the first names and places
license: Unlicense
---

## Problem

The records that show who served in the American Revolution from Monmouth County, New Jersey are public but scattered across printed registers, federal pension files, state manuscripts and markers, while the compiled databases that join them up are proprietary. Many patriots are now known only by a bridge, park or marker, some of which are wrong, and there is no free, cited, reusable record of them. Before any profile can be written, the project needs a sound foundation: content schemas, a gate that refuses unapproved sources, written evidence standards, and the first public lists of names and places.

## Beneficiary

Historical societies, parks, towns, teachers, students, descendants and the public of Monmouth County, reached through the project's public repository and, later, its site and open data. A named partner organisation is still to be secured, so this run carries no verified last-mile need; the candidates are the Monmouth County Historical Association, the Monmouth Battlefield State Park friends group and the SAR New Jersey Society's Monmouth chapter.

## Scope

Phase 0 and the start of Phase 1 of the project plan (`planning/projects/monmouth-patriot-project/PLAN.md`):

- the repository scaffold: UNLICENSE, LICENSE-DATA.md (CC0-1.0 for data and media), an Astro + MDX static site with zod content collections whose factual fields keep every sourced variant with a preferred value and rationale, permanent person ids and dated places, and CI;
- the approved-sources list `sources/allowlist.yml`, its policy and a CI check that fails on any content file citing a source that is not approved, with at least three sources analysed and at least one approved by the rights reviewer;
- the research standards in `docs/standards/`, written fresh: evidence tags, evidence grades with fixed wording in a table the build reads, citation formats, the positive-control rule, transcription conventions, the answer-first lead summary and the privacy rule;
- the master roster `data/roster.csv` seeded from the Monmouth County militia regiments in Stryker's _Official Register_ (1872), every row cited to its page;
- the namesake inventory seeded from USGS GNIS and HMDB, every entry with an accuracy field.

## Non-goals

No profiles, stories, maps, exports, search or launch in this run. No roster row seeded from the SAR Patriot Research System, the DAR GRS or any commercial genealogy site. No text, transcription, note, image or code from the owner's earlier private research. No Wikipedia text. No image rehosted from a commercial site or from HMDB. Nothing sent, posted or edited outside the project repository.

## Acceptance criteria

| AC | Case | Required evidence |
|---|---|---|
| AC-01 | The site builds with every content collection empty | CI log of `pnpm build` on Node 24 LTS with empty collections |
| AC-02 | A factual field keeps sourced variants, and a preferred variant needs a rationale when variants disagree | Schema test that rejects a preferred variant without a rationale |
| AC-03 | Person ids are permanent and places carry dated historic and modern names | Schema tests for the id pattern and for historicName, modernName, validFrom and validTo |
| AC-04 | Code and text are Unlicense, data and media CC0-1.0 | UNLICENSE and LICENSE-DATA.md at the repo root |
| AC-05 | The approved-sources list records the rights basis per copy or edition, the extraction method and a status | `sources/allowlist.yml` schema with a test |
| AC-06 | A content file citing a source that is not approved fails CI | Test showing the CI check failing on a pending source |
| AC-07 | The SAR Patriot Research System, the DAR GRS and commercial genealogy sites are rejected as sources of copied data | Policy document and their `rejected` entries |
| AC-08 | At least three sources are analysed and at least one is approved by the rights reviewer | Allow-list entries with the reviewer and date |
| AC-09 | Evidence grades have fixed wording the build can read | Grade-wording table in `docs/standards/` and a test that reads it |
| AC-10 | Transcription, lead-summary and privacy rules are written down | The standards documents in `docs/standards/` |
| AC-11 | Every roster row cites its page and is entered as a lead | `data/roster.csv` rows with sourceId and page, and a schema test |
| AC-12 | The roster batch is read from the cited source directly | Written attestation of independent sourcing in the roster PR |
| AC-13 | Every namesake entry cites its GNIS or HMDB record and carries an accuracy field | Place records with source and accuracy, and a schema test |

## Inputs and provenance

| Source | Licence | URL | Retrieved |
|---|---|---|---|
| William S. Stryker, _Official Register of the Officers and Men of New Jersey in the Revolutionary War_ (1872), Internet Archive scan | public-domain (expired copyright; rights of the scan to be confirmed on the allow-list) | https://archive.org/details/officialregister00newjuoft | not yet retrieved |
| NARA M804, Revolutionary War pension and bounty-land warrant application files, NARA catalog copy | public-domain (US federal records; terms of the NARA copy to be confirmed on the allow-list) | https://catalog.archives.gov/ | not yet retrieved |
| USGS Geographic Names Information System | public-domain (US federal data) | https://www.usgs.gov/tools/geographic-names-information-system-gnis | not yet retrieved |
| Historical Marker Database (HMDB) | HMDB terms of use: facts and links only, no text or images copied; to be decided on the allow-list | https://www.hmdb.org/ | not yet retrieved |
