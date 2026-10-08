# Architecture

Start with the boundary relevant to your question. The [ontology](../ontology/README.md)
owns meaning; these documents own how those meanings are implemented and connected.

| Question | Document |
| --- | --- |
| What enters and leaves an experiment? How is chronology recorded? | [Workloads and events](workloads.md) |
| Which settings are fixed, editable, submitted, or observed? | [Declarations and interaction state](declarations.md) |
| How do the three zoom levels inspect one computation? | [Inspection boundaries](inspection.md) |
| How are contracts admitted, generated, and validated? | [Data model](../../data-model/README.md) |

Use `make help` for workflows declared in the [Makefile](../../Makefile).
Specific numerical implementations live under [implementation](../implementation/README.md).
