# Citation guide

Every claim cites the **page or image actually read**, never a collection or a database as a whole. A reader must be
able to go from the citation to the exact line we relied on.

## The layered citation

Each source record (`src/content/sources/<id>.json`) holds its citation in five layers, from the thing itself to the
moment we read it:

| Layer          | What it records                                                              | Example                                                                                         |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **item**       | The original document or publication.                                        | William S. Stryker, _Official Register of the Officers and Men of New Jersey in the Revolutionary War_ (Trenton, 1872) |
| **record**     | The part of it that holds the fact: page, entry, file, folio.                | p. [page], "[unit]" list, entry for [name]                                                      |
| **copy**       | The copy we read, which may have its own rights: a scan, a microfilm, an original. | Internet Archive scan, identifier `[identifier]`, image [n]                                     |
| **where read** | Where that copy was consulted.                                               | archive.org; NARA catalog; NJ State Archives reading room                                       |
| **when**       | The date it was read.                                                        | 2027-01-15                                                                                      |

The copy layer matters: a public-domain record can be held behind a vendor's restricted scan. The copy we cite must be
one the approved-sources list allows.

Each citation also carries the **stable archival identifier** (catalog id, roll and frame, book page) as well as any
URL, so a dead link can still be traced, and a Wayback Machine snapshot of the URL taken when it was cited.

## Evidence tags

Inside research notes and fact-check logs, each statement carries a tag saying how we know it:

| Tag        | Meaning                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| **[V]**    | **Seen.** We read it ourselves on the cited page or image.                      |
| **[R]**    | **Reported.** Another work says it; we have not yet seen the record behind it. |
| **[I]**    | **Inferred.** It follows from what we have seen, and the reasoning is written down. |
| **[OPEN]** | **Not yet found.** We are looking; the search so far is logged.                |

Only **[V]** statements, and **[I]** statements built on them, can support a published claim. **[R]** is a lead.

## Formats by record type

Write each citation in this order. Square brackets mark the parts to fill in.

- **Pension or bounty-land file (NARA M804):** [Name], pension file [file number], [state]; _Revolutionary War
  Pension and Bounty-Land Warrant Application Files_, NARA microfilm M804, roll [roll], image [image]; NARA catalog
  [catalog id]; read [date].
- **Compiled service record (NARA M881):** [Name], [unit]; _Compiled Service Records of Soldiers Who Served in the
  American Army During the Revolutionary War_, NARA microfilm M881, roll [roll], card [card]; NARA catalog [catalog
  id]; read [date].
- **Printed register or book:** [Author], _[Title]_ ([place], [year]), p. [page]; [copy, e.g. Internet Archive
  identifier]; read [date].
- **Manuscript:** [Repository], [collection], [series or number], [item], [folio or page]; [copy]; read [date].
- **Newspaper:** _[Title]_ ([place]), [date], p. [page], col. [column]; [copy, e.g. Chronicling America]; read [date].
- **Gravestone or marker:** [Cemetery or site], [location], [inscription as written]; photographed or read by
  [person] on [date]; or HMDB marker [number] for the marker's location, with its text summarised, not copied.

## What never counts as a citation

- A database or collection named as a whole.
- A lineage-society record number, compiled genealogy or online tree on its own: these are leads ([R]).
- An AI tool's output. AI may help find, transcribe or draft; it is never cited.
- Wikipedia. Facts may be checked against Wikidata, but the citation is always the record.
