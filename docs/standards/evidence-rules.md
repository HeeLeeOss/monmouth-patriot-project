# Evidence rules

Every factual statement on the site carries one of six **evidence grades**. The grade decides the words we may use.
A reader, or an AI tool quoting a single sentence, should be able to tell from the wording alone how sure we are.

The machine-readable table is [`grades.json`](./grades.json). The build reads it, and `tests/grades.test.ts` checks
that it keeps these rules and that the table below matches it phrase for phrase. If they ever differ, fix this page.

## The grades

| Grade | What it means | Wording to use | Wording to avoid |
| --- | --- | --- | --- |
| **Proved** | Searched thoroughly; the evidence, direct or indirect, supports it; identity is settled; any conflict is resolved in writing. | "was", "did", "is recorded as" | "probably", "most likely", "possibly", "may have", "is said to have", "no record supports", "is wrong" |
| **Probable** | The evidence points one way, but a gap remains: a late record, one person's memory, or identity resting on more than the name but less than proof. | "probably", "most likely", "the evidence points to" | "certainly", "definitely", "possibly", "may have", "it is possible that", "is said to have", "according to", "has not yet been checked", "no record supports", "is not proved", "has not been found", "is wrong", "the records show otherwise", "is disproved" |
| **Possible** | The evidence fits the claim but does not favour it over the alternatives. | "possibly", "may have", "it is possible that" | "certainly", "probably", "most likely", "the evidence points to", "is said to have", "according to", "has not yet been checked", "no record supports", "is not proved", "has not been found", "is wrong", "the records show otherwise", "is disproved" |
| **Lead** | Worth checking, but no primary record supports it yet: a marker, a compiled genealogy, a lineage-society listing, a family tradition. Never published as fact. | "is said to have", "according to", "has not yet been checked" | "certainly", "probably", "most likely", "the evidence points to", "possibly", "may have", "it is possible that", "no record supports", "is not proved", "has not been found", "is wrong", "the records show otherwise", "is disproved" |
| **Unsupported** | Searched for where it should appear, with a positive control, and not found. Not disproved. | "no record supports", "is not proved", "has not been found" | "certainly", "probably", "most likely", "the evidence points to", "possibly", "may have", "it is possible that", "is said to have", "according to", "has not yet been checked", "is wrong", "the records show otherwise", "is disproved" |
| **Disproved** | Credible records show the claim is wrong. | "is wrong", "the records show otherwise", "is disproved" | "certainly", "probably", "most likely", "the evidence points to", "possibly", "may have", "it is possible that", "is said to have", "according to", "has not yet been checked", "no record supports", "is not proved", "has not been found" |

## The wording rule

**A plain statement claims Proved.** "[Name] was a private in [unit]" asserts a fact, so a sentence that states a fact
with "was", "did" or any plain past tense, and no qualifier, may only be written about a fact the records prove.

**Every lower grade carries its qualifier in the same sentence.** A probable fact is written with "probably", "most
likely" or "the evidence points to"; a possible one with "possibly" or "may have"; and so on down the table. The word
"was" itself is not banned: "[Name] probably was the private of that name in [unit]" and "the marker says [Name] was a
captain; the records show otherwise" are both correct, because the qualifier tells the reader the grade.

**Never mix grades.** A sentence does not use the wording of a grade other than its own: never soften a proved fact,
and never harden a probable one.

## How to grade

1. **Start from the person's own records.** A muster roll, pay roll, pension declaration or will made by or about
   the person outranks anything written later.
2. **Settle identity first.** List everyone of the same name in the place and period, and rule each in or out in
   writing (`doNotConfuseWith`). A fact about "John Smith" is only a fact about _this_ John Smith once that is done.
3. **Weigh the distance from the event.** A record made at the time beats one made fifty years later; a pension
   declaration of the 1830s is memory, and its dates and ages are weighed accordingly.
4. **Count independence, not copies.** Three books that repeat one register are one source.
5. **Use indirect evidence too.** A fact no single record states can still be proved when several independent records
   together leave only one answer; write the reasoning down as an **[I]** statement.
6. **Treat markers, compiled genealogies and lineage-society listings as leads.** They point to records; they are not
   records. A modern marker can be wrong.
7. **Record disagreement, do not hide it.** When records disagree, keep every variant with its sources, name the
   preferred one, and write the reason. The content schema refuses a preferred variant without a rationale. A fact can
   still be Proved when the conflict has been resolved that way.
8. **Log the negative.** "Searched, and not found" is a result. Before logging it, run a positive control: the same
   search must find a known record in the same source, or the negative means nothing.

## Grades for connections and publishing

The project plan publishes a profile only when patriot status and at least one Monmouth connection (A–E) are each
graded **Probable** or better. A person below that stays on the roster as a lead. A later build check will enforce
it; until then the citation reviewer does.
