# Architecture

Start with the boundary relevant to your question. The [ontology](../ontology/README.md)
owns meaning; these documents own component boundaries and how they connect.
[Purpose](../purpose/README.md) owns the mission and scope;
[data models](../../data-model/README.md) own interface shapes. Architecture explains
those interfaces without maintaining a competing declaration.

| Question | Document |
| --- | --- |
| What enters and leaves an experiment? How is chronology recorded? | [Workloads and events](workloads.md) |
| Which settings are fixed, editable, submitted, or observed? | [Declarations and interaction state](declarations.md) |
| How do the three zoom levels inspect one computation? | [Inspection boundaries](inspection.md) |
| How are computation, stored evidence, and transport separated? | [Execution delivery](delivery.md) |
| Why browser execution, which interfaces remain, and what must the spike prove? | [Website architecture and execution parity](website.md) |
| How are contracts admitted, generated, and validated? | [Data model](../../data-model/README.md) |

Use `make help` for workflows declared in the [Makefile](../../Makefile).
Specific numerical implementations live under [implementation](../implementation/README.md).
