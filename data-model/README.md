# Data model

[Ontology](../docs/ontology/declarations.json) grants each named schema one semantic
owner and lists allowed cross-owner references and capability reads.
[inference.schema.json](inference.schema.json) declares those schemas' fields.
[Architecture](../docs/architecture/declarations.md) defines request/run/inspection
transitions and the division between structural and behavioral verification.

To change a declaration:

1. Establish or amend its semantic ownership and dependency permission in ontology.
2. Edit the admitted schema. Fields are required; objects reject additional keys.
3. Run `make _data-models`. It generates Python frozen data classes, browser validators,
   runtime schema metadata, and ownership descriptions.
4. Update the executing consumer and independent behavioral checks. A schema cannot
   supply an algorithm or prove that a new policy is implemented.
5. Run `make check test`; run `make intro-page test-integration` for presentation changes.

`make check` compares generated content exactly and fails on drift. It never
regenerates files to conceal a mismatch. Site builds also refuse stale contracts.
Generated files live next to their consumers, with a DO NOT EDIT header and an
identity derived from the ontology and schema. The server and browser must agree
on that identity before enabling live execution.

Domain records use JSON Schema 2020-12. [OpenAPI 3.1](openapi.json) owns HTTP
operations and references those records; routes are generated into the Python and
browser consumers. Dependency versions belong to the repository lock files.
Python validates with `jsonschema`; Ajv compiles standalone browser validators at
build time. Browser inspection remains offline and needs no schema service.

The admitted profile includes closed named objects, local references, required
fields, arrays, typed unions, nullable values, constants, enums, bounds, and
patterns. Unknown generator keywords and duplicate JSON keys fail explicitly.
`x-owner` binds schemas to ontology grants; `x-maximum-from` declares a permitted
capability dependency. Defaults initialize declarations; submitted data must be
complete and valid. Structural validation does not establish executable support.

Ownership admission traverses nested references, including arrays and unions.
Generated-consumer checks compare exact content, including compiled validators.
OpenAPI is validated against an in-memory bundle of the canonical schemas;
no second hand-maintained transport schema exists.

Behavioral admission enforces chronological unique arrivals and the current
single-arrival-at-zero capability. Run validation checks binding, causal order,
commitment, delivery, and numerical trace relationships. Numerical traces have a
structural schema too; shape validation cannot establish correct tensor arithmetic.
Replay and independent calculations provide separate evidence for that claim.
