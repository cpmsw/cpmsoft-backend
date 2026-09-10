# CPMSOFT API Module Structure

## Purpose

`cpmsoft-api` is the HTTP/API layer. This document defines feature and
child-resource route organization so Company, Users, Projects, and
future modules remain predictable and maintainable. Company is the
reference pattern for a feature with multiple child resources.

## Thin API Rule

API routes own URL structure, authentication context, permission
middleware, request extraction, Fastify schemas/Swagger metadata,
delegation to `cpmsoft-core`, and returning results. Business logic
belongs in Core. Do not duplicate Core service/repository logic in
routes.

## Standard Feature Structure

A simple feature may begin as:

``` text
modules/
  feature/
    index.js
    feature.routes.js
```

As it gains child resources, split them into subfolders:

``` text
modules/
  feature/
    childResource/
      childResource.routes.js
      index.js
    history/
      featureHistory.routes.js
      index.js
    index.js
    feature.routes.js
```

Do not allow `<feature>.routes.js` to become a catch-all for unrelated
child resources.

## Company Is the Reference

``` text
modules/
  company/
    addresses/
    emails/
    history/
    notes/
      companyNotes.routes.js
      index.js
    phones/
    company.routes.js
    index.js
```

When another feature gains the same child resource, prefer the same
structure.

## Users Target Structure

``` text
modules/
  users/
    history/
      userHistory.routes.js
      index.js
    notes/
      userNotes.routes.js
      index.js
    index.js
    users.routes.js
```

`users.routes.js` should focus on the User record itself: list/search,
count, get by ID, create, update, deactivate, reactivate, and closely
related record actions. Notes and History belong in separate route
concerns.

## Child-Resource Rule

When a module gains a reusable child resource such as Notes, History,
Addresses, Phones, Emails, Pictures, or Attachments, prefer a separate
subfolder and route file rather than expanding the primary feature
route.

## `index.js` Responsibility

The feature `index.js` is the composition/registration point.
Conceptually:

``` js
module.exports = async function (fastify) {
  await fastify.register(require("./feature.routes"));
  await fastify.register(require("./notes"), { prefix: "/:featureId/notes" });
  await fastify.register(require("./history"), { prefix: "/:featureId/history" });
};
```

Exact prefixes must preserve the established API contract. Child-folder
`index.js` files should normally remain simple exports/registration
wrappers.

## Shared Core Services

Feature routes should reuse generic Core services whenever possible:

``` js
const notesService = require("cpmsoft-core/notes");
const PARENT_TYPE = "user";
```

The shared Core service owns persistence, validation, transactions, and
audit behavior.

## Parent-Type Convention

For generic child resources, define `PARENT_TYPE` once near the top of
the route module and consistently pass tenant ID, parent type, parent
ID, acting user, and request data to Core.

## Permissions

Permissions belong at the API boundary. Examples are `company.view` /
`company.edit` and `users.view` / `users.edit`. Read child-resource
routes normally require the parent's view permission; mutations normally
require the parent's edit permission unless a distinct permission is
intentionally designed. Frontend visibility is not a substitute for API
permission enforcement.

## Route Naming

Use predictable names:

``` text
company.routes.js
users.routes.js
companyNotes.routes.js
userNotes.routes.js
companyHistory.routes.js
userHistory.routes.js
```

Use concise resource folders such as `notes/`, `history/`, `addresses/`,
`phones/`, and `emails/`.

## Notes Route Pattern

Canonical Notes routes expose:

``` text
GET    /
POST   /
PUT    /:noteId
DELETE /:noteId
```

under a parent prefix such as `/api/companies/:companyId/notes` or
`/api/users/:userId/notes`. Routes obtain tenant/user/parent information
and call `cpmsoft-core/notes`; they contain no Notes SQL or audit
implementation.

## History Route Pattern

Once a feature has meaningful audit history, use:

``` text
feature/
  history/
    featureHistory.routes.js
    index.js
```

History routes require view permission, extract parent ID and supported
filters, delegate retrieval to Core, and use the correct
database/executor for the owning domain. Do not create separate history
storage models for each feature.

## Database Awareness

The API contains no SQL, but wiring must preserve domain ownership:

``` text
Company/shared application history -> appdb pattern
User history                       -> authdb pattern
```

Do not route User history through Company/appdb merely because the HTTP
shape is similar.

## API / Frontend Contract Stability

Reorganizing route files must preserve existing public URLs unless an
API change is intentional. Moving User History into
`users/history/userHistory.routes.js` should not force a frontend change
from an already-established `/api/users/:userId/history` URL.

Filesystem organization is an implementation detail; API URLs are a
client contract.

## Swagger / Schema Convention

Child-resource routes should retain Fastify schema metadata, useful
tags/summaries, and appropriate body schemas. Keep HTTP schemas in API;
keep business validation in Core.

## Before Adding a Route

Check whether it is primary-record behavior or a child resource, whether
Company or another feature establishes the structure, whether it belongs
in a subfolder, whether a shared Core service exists, what parent type
and permission apply, whether existing URLs are preserved, and whether
business logic is accidentally being placed in API.

## Current Reference Direction

``` text
Company           -> modular child-resource route organization
Users             -> mirror Company as Notes and History are separated
cpmsoft-core/notes -> generic child-resource business logic
cpmsoft-core/audit -> shared audit/history behavior
```

Goal:

``` text
same concern
-> same folder pattern
-> same route pattern
-> shared Core behavior
-> feature-specific permissions and parent identity
```

Follow this convention unless a concrete business requirement justifies
a different structure.
