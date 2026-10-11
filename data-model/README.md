# Data model

[Ontology modules](../docs/ontology/README.md) explicitly grant one or more named schemas per concept.
Each schema has exactly one owner; capability reads are explicitly granted.
Schema references must resolve, but have no separate cross-owner permission list. Supporting records do not require separate ontology concepts. The
[authored YAML manifest](declarations.yaml) composes field contracts from domain
modules. [inference.schema.json](inference.schema.json) is a generated bundle,
not an editing authority.
[Architecture](../docs/architecture/declarations.md) defines request/run/inspection
transitions and the division between structural and behavioral verification.

To change a declaration:

1. Establish or amend its semantic ownership in ontology.
2. Edit the admitted YAML schema module. Fields are required; objects reject additional keys.
3. Run `make _data-models`. It generates Python frozen data classes, browser validators,
   runtime schema metadata, ownership descriptions, JSON bundles, and the shared HTTP metadata/runtime boundary.
4. Update the executing consumer and independent behavioral checks. A schema cannot
   supply an algorithm or prove that a new policy is implemented.
5. Run `make _check test`; run `make _intro-page test-integration` for presentation changes.

`make _check` compares generated content exactly and fails on drift. It never
regenerates files to conceal a mismatch. Site builds also refuse stale contracts.
Generated files live next to their consumers, with a DO NOT EDIT header and an
identity derived from ontology, schemas, transport, and experiment bindings. The current server and browser must agree
on that identity before enabling live execution. The planned browser execution
path must retain generated execution and evidence interfaces across worker boundaries;
HTTP is a transport binding, not the owner of domain semantics. See the
[website architecture](../docs/architecture/website.md) for runtime placement.

Domain records use JSON Schema 2020-12. [OpenAPI 3.1](openapi.yaml) owns HTTP
operations and references those records; routes are generated into the Python and
browser consumers. Dependency versions belong to the repository lock files.
Python validates with `jsonschema`; Ajv compiles standalone browser validators at
build time. Browser inspection remains offline and needs no schema service.

The admitted profile includes closed named objects, local references, required
fields, arrays, typed unions, nullable values, constants, enums, bounds, and
patterns. Unknown generator keywords, duplicate keys, YAML aliases, and nonfinite values
fail explicitly. Nested records need named ontology-owned declarations; maps may
only contain declared value types.
`x-owner` binds schemas to ontology grants; `x-maximum-from` declares a permitted
capability dependency. `x-ontology-reference` compiles the admitted concepts into
reference choices; `x-ontology-binding` generates the primary/related exclusion
constraints. `x-operation` identifies declarations that own implemented operation
names; duplicate ownership is rejected. The catalog owns experiment subject
bindings, which are validated and emitted into generated consumers.
Defaults initialize declarations; submitted data must be
complete and valid. Structural validation does not establish executable support.

Ownership admission traverses nested references, including arrays and unions.
Generated-consumer checks compare exact content, including compiled validators.
OpenAPI is validated against an in-memory bundle of the canonical schemas;
no second hand-maintained transport schema exists.

Behavioral admission enforces chronological unique arrivals and the current
single-arrival-at-zero capability. Run validation checks binding, causal order,
selection, publication, and numerical trace relationships. Numerical traces have a
structural schema too; shape validation cannot establish correct tensor arithmetic.
Replay and independent calculations provide separate evidence for that claim.

Public data records must use generated types. The source gate rejects handwritten
record classes/factories and transport shapes. Routes and allowed response types
come from OpenAPI, together with request schemas and shared HTTP policy. One WSGI
application validates requests and responses against that generated metadata.
Generated socket and Lambda bridges adapt runtime envelopes only; governance
rejects stale bridges and competing HTTP implementations. Source checks are for the supported Python/JS
implementation, not a proof about arbitrary dynamic code. Behavioral parity checks
remain necessary.
