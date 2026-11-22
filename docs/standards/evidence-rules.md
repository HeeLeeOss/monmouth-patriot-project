# Evidence rules

Every factual statement on the site carries one of six **evidence grades**. The grade decides the words we may use.
A reader, or an AI tool quoting a single sentence, should be able to tell from the wording alone how sure we are.

The machine-readable table is [`grades.json`](./grades.json). The build reads it, and `tests/grades.test.ts` checks
that it keeps these rules. This page explains it for people; if the two ever differ, fix this page.

## The grades

| Grade           | What it means                                                                                                                                                   | Wording to use                                              | Wording to avoid                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **Proved**      | His own record says it directly, the same-name review settles who he is, and no credible record contradicts it.                                                 | "was", "did", "is recorded as"                              | "probably", "possibly", "may have", "likely"         |
| **Probable**    | The evidence points one way, but a gap remains: a late record, one person's memory, or an identity that rests on more than the name but less than proof.      | "probably", "most likely", "the evidence points to"         | "was", "certainly", "possibly", "may have"           |
| **Possible**    | The evidence fits the claim but does not favour it over the alternatives.                                                                                      | "possibly", "may have", "it is possible that"               | "was", "probably", "likely", "certainly"             |
| **Lead**        | Worth checking, but no primary record supports it yet: a marker, a compiled genealogy, a lineage-society listing, a family tradition. Never published as fact. | "is said to have", "according to", "has not yet been checked" | "was", "probably", "possibly", "may have"          |
| **Unsupported** | Searched for where it should appear, with a positive control, and not found. Not disproved.                                                                    | "no record supports", "is not proved", "was not found"      | "was", "probably", "possibly", "is false"            |
| **Disproved**   | Credible records show the claim is wrong.                                                                                                                       | "is wrong", "the records show otherwise", "did not"         | "was", "probably", "possibly", "may have"            |

**"Was" is for Proved alone.** A sentence that says "he was" states a fact, so it may only be written about a fact
the records prove. **"Probably" is for Probable alone.** Never soften a proved fact, and never harden a probable one.

## How to grade

1. **Start from the man's own records.** A muster roll, pay roll, pension declaration or will made by or about him
   outranks anything written later about him.
2. **Settle identity first.** List every man of the same name in the place and period, and rule each in or out in
   writing (`doNotConfuseWith`). A fact about "John Smith" is only a fact about _this_ John Smith once that is done.
3. **Weigh the distance from the event.** A record made at the time beats one made fifty years later; a pension
   declaration of the 1830s is memory, and its dates and ages are weighed accordingly.
4. **Count independence, not copies.** Three books that repeat one register are one source.
5. **Treat markers, compiled genealogies and lineage-society listings as leads.** They point to records; they are
   not records. A modern marker can be wrong.
6. **Record disagreement, do not hide it.** When records disagree, keep every variant with its sources, name the
   preferred one, and write the reason. The content schema refuses a preferred variant without a rationale.
7. **Log the negative.** "Searched, and not found" is a result. Before logging it, run a positive control: the same
   search must find a known record in the same source, or the negative means nothing.

## Grades for connections and publishing

A profile is published only when patriot status and at least one Monmouth connection (A–E) are each graded
**Probable** or better. Only Probable or better counts towards a connection. Anything below stays on the roster as a
lead.
