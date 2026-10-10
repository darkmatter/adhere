# More details for each typescript, react, and security preset rule

The details study's data: for each rule, a paragraph on why it holds and one on
where it does not apply, beyond what its description, examples, and matchers
say. An agent wrote them as a rule's author would, from each rule's file and
adhere's skill alone, without the labels or the repos the study reads.

## react/effects/clean-up-what-they-start

### why

Whatever an effect starts outlives the render that started it: without a cleanup, a listener, subscription, or timer keeps calling a stale closure after the component unmounts, and each time the effect runs again it adds another copy on top of the last. Connections and intervals left open also hold memory and network resources for as long as the page stays open.

### scope

An effect that returns the unsubscribe function its subscribe call gives back, rather than an arrow of its own, still returns a cleanup, and a path that returns early before starting anything needs none. Work that finishes on its own, such as setting the document title, focusing an element, or a single request, is not something left running.

## react/effects/event-logic-in-handlers

### why

An effect runs when its dependencies change, not when the user acts, so an action routed through state runs again whenever another dependency changes while the flag is still set, and does not run at all when a repeated action sets the same value. It also costs an extra render and splits one action between a flag and an effect, which hides why the code ran.

### scope

An effect that keeps something outside React in step with what the component shows, such as fetching results for the selected filter or connecting to the room the user picked, is not event logic even though a user's choice set the state it reads. The test is whether the code would need to run if the component appeared with that state some other way. State set by something other than the user, such as a server push or a timer, is not what the rule is about.

## react/effects/external-stores-use-sync-external-store

### why

A value copied into state by an effect is wrong on the first render, misses any change between that render and the subscription, and under concurrent rendering can differ between components that read the same store in one render. `useSyncExternalStore` reads the store during render, so every reader sees its current value, and it lets server rendering supply a value of its own.

### scope

Reading a store through a hook its library provides, such as a selector hook, already subscribes the right way, and a stream of events, such as messages from a socket, that an effect collects into state has no current value to read instead. A response fetched from a server is not an external store.

## react/effects/fetches-ignore-stale-responses

### why

Responses come back in whatever order the network delivers them, so when the inputs change quickly an earlier, slower response can land last and leave the component showing data for inputs it no longer has. A response after unmount sets state for a component that is gone, and a request nobody will read still costs the network and the server.

### scope

A request whose response sets no state, such as sending an analytics event or warming a cache for later, has no response to ignore.

## react/effects/notify-parents-in-handlers

### why

An effect reports the change only after the child has rendered with it, so the parent updates a render later, costing an extra pass and a moment when the two disagree. It also runs on mount and whenever the parent passes a new callback, reporting changes nobody made.

### scope

A change from outside the component, such as a size an observer measured or a message a subscription delivered, is made in that observer's or subscription's callback, which is the place to report it. A callback such as `onReady`, called once on mount, reports no change to the component's state.

## react/server/no-private-data-to-client

### why

Props cross to the browser in the page's serialized payload, where anyone can read them in the page source or the network panel whether or not the component displays them. A whole record also carries every column added to it later, such as a password hash or an internal note, so a prop that leaks nothing today can start leaking without any change to the page.

### scope

A prop passed to another Server Component never leaves the server. An object already narrowed to what the page shows, such as the result of a query that selects only those columns or a view model built for the client, can be passed whole.

## react/server/server-functions-authorize-and-validate

### why

A Server Function's parameter types are erased at runtime and its id ships to the browser, so anyone can call it directly, with another user's ids or with an object where a string was expected. Checking access in the page that shows its button does not protect it, since a direct call never renders that page.

### scope

An action meant for visitors who are not signed in, such as signing in, signing up, or sending a contact form, has no session to require, though it must still validate its arguments. A check made by a helper the function calls first, or by a wrapper it is defined through, such as one that requires a session and parses the input with a schema, counts as the function's own. A function that a `"use server"` file does not export is a helper, not an endpoint.

## react/state/no-contradictory-state

### why

Separate booleans allow combinations that mean nothing, such as sending and sent at once, and every transition has to remember to reset the others, so one forgotten setter leaves the screen showing a spinner beside a success message. With one status, each transition is a single assignment and the type lists every state the component can be in.

### scope

Booleans for independent things that may hold in any combination, such as whether a menu is open and whether a form has unsaved edits, are not one thing's status. Flags derived during render from a single status, or returned together by a library hook, such as a query's `isLoading` and `isError`, are not separate state the component keeps.

## react/state/no-props-copied-into-state

### why

A copy in state makes two sources for one value, and a component reused for another item, as when navigating from one record to the next, keeps showing the first. Patching that with an effect that copies the prop again costs a render with the stale value and can overwrite what the user was editing.

### scope

Keeping a prop's previous value in state, to notice during render that it changed and adjust other state, compares against the prop rather than standing in for it. A value meant to differ from the prop over time, such as a debounced copy that lags behind it on purpose, is a different value, not a stale one.

## react/state/store-ids-not-copies

### why

When an item in the list is edited, the copy keeps its old fields, and when the item is removed, the selection still shows something that no longer exists, while changes made through the copy never reach the list. An id is the only fact the selection adds, and everything else is read from the list, which stays the one source.

### scope

A copy kept apart from the list on purpose, such as a draft being edited or an option chosen from search results that change with the next query, is not a pointer into the list, and a selected value that is a plain string or number is its own id. An item from a constant list that never changes cannot go stale.

## security/constant-time-secret-compare

### why

A string comparison stops at the first character that differs, so how long the check takes reveals how much of a guess was right, and an attacker who can time enough requests can recover the expected value a character at a time. A constant-time comparison takes as long for a near miss as for a wild guess.

### scope

Checking that a secret is present or well formed, such as whether an authorization header starts with the Bearer scheme, compares nothing secret, and neither does comparing values that are not secrets, such as an event type, a key's public id, or a username. Looking a token up by its value in a database or a map is not a comparison the code makes.

## security/no-secrets-in-output

### why

Logs and error messages are shipped to aggregators and error trackers, kept for months, and read by far more people than may hold the secret, and a response reaches the browser, its caches, and anyone watching the network. A secret that lands in any of them has to be treated as leaked and replaced.

### scope

Handing a credential to the party it was issued to, such as a sign-in response that sets the session cookie or returns an access token, or a new API key shown once to the user who created it, is the response's purpose, not a leak. Values named like secrets that are not, such as a publishable or public key, a pagination token, a cache key, or a count of tokens a model used, may be logged and returned.

## security/no-untrusted-input-in-commands-or-paths

### why

A shell reads separators, pipes, and substitutions in an interpolated string as syntax, so a crafted value runs whatever command its sender wants, and `eval` or `new Function` runs whatever code it holds. A name with parent-directory segments resolves outside the intended directory, and so can an absolute one, letting its sender read or overwrite files such as configuration or keys.

### scope

Input from the person running the program, such as a command-line tool's own arguments or the operator's configuration, crosses no trust boundary, and a value the code made itself, such as a generated id or a temporary file's name, is not input at all. A URL or route built from input is not a file path.

## security/parameterized-queries

### why

An interpolated value becomes part of the SQL text, so one containing a quote can close the string and add clauses that read, change, or delete whatever the connection can reach. A function's argument counts because the function cannot see where its caller got the value, and a parameter typed as a number can still hold text at runtime.

### scope

SQL text the code assembles from fixed pieces of its own may be interpolated, such as placeholders numbered for however many values there are, conditions chosen in code whose values are still bound, or ASC or DESC picked by a flag.

## typescript/async/concurrent-independent-work

### why

Awaiting independent calls one after another makes the total wait the sum of their latencies rather than the longest of them, so three 100 ms lookups take 300 ms, and a loop over a hundred items makes a hundred round trips in a row.

### scope

A call that should run only after an earlier one allowed it, such as loading data once an authorization check passes, depends on that check even when it takes nothing from it. Reading a stream or async iterator with `for await` takes its items in order by design.

## typescript/async/network-calls-have-timeouts

### why

Without a deadline, a request to a server that accepts the connection and then stalls waits as long as the runtime allows, often minutes and sometimes forever. In a server, each stalled call holds a request, a socket, and memory, and enough of them exhaust the process before anything reports an error.

### scope

A connection meant to stay open, such as a server-sent event stream, a long poll, or a WebSocket, is expected to wait and is not a request left waiting without limit.

## typescript/design/no-argument-mutation

### why

The caller still holds the same object, so a change it did not ask for shows up wherever else that object is used: a list sorted for display reorders the caller's data, and a default written into a shared options object leaks into every later call. Code that detects change by reference, such as memoized views or state updates, also misses a change made in place.

### scope

Some arguments are passed in to be changed, such as a request object that middleware decorates, a draft an immutable-update helper passes to its recipe, a DOM element, or a context a framework hands a callback to fill, and writing to a stream or connection is using it, not mutating data. Sorting or pushing to a copy the function made first, or changing `this` in a method, does not touch an argument.

## typescript/errors/no-swallowed-errors

### why

A failure dressed as an ordinary result lets the caller and the user act on wrong data, so an outage reads as a customer with no invoices, and the cause is lost at the one place it was known. The bug then surfaces later, somewhere else, with nothing pointing back to it.

### scope

Reporting the failure at the point where it stops propagating handles it, such as a request handler that logs it and responds with an error status, a command that exits with a failing code, or a component that shows an error state. Catching to retry handles it too, as long as the last failure still surfaces.

## typescript/errors/release-on-every-path

### why

A release that runs only on success leaks the resource every time the work throws, and the damage shows up later and elsewhere: a pool runs dry after a handful of failures and every later request hangs, a lock is never freed and other work blocks for good, and temporary files and child processes pile up until a limit is hit.

### scope

A resource meant to live as long as the program, such as a pool, client, or server created at startup, is not acquired for one piece of work, and a function that acquires a resource to hand to its caller passes the duty to release it along with the resource. A helper that acquires and releases around a callback it runs, such as a `transaction` method that takes a callback or a `withLock` wrapper, releases on every path itself.

## typescript/testing/assert-outcomes

### why

A test that only checks that the code ran stays green whatever the code computes, so it misses the regressions it exists to catch while still counting toward coverage and making the suite look safer than it is.

### scope

When not throwing is the behavior under test, such as a validator accepting valid input, asserting that it does not throw asserts the outcome, and so do type-level assertions and snapshots of rendered output. An assertion made through a helper the test calls, or on the calls a mock received, checks what the code did.

## typescript/testing/independent-tests

### why

A test that leans on another's leftovers passes only when the file runs whole and in its written order, so running it alone, skipping or reordering its neighbors, or running tests in parallel breaks it. When it fails, the cause is in a different test from the one reported, and a change to the earlier test can make it pass for the wrong reason.

### scope

State that a hook resets between tests, such as mocks restored or tables truncated in an `afterEach`, does not carry over from one test to the next, and a module-level variable that each test assigns before reading holds nothing another test left.

## typescript/types/assertions-only-when-proven

### why

An assertion silences the checker at the very spot it disagreed, so a wrong claim surfaces later as a crash or bad data far from the cast, and when the code around it changes, the assertion goes on claiming what is no longer true. A runtime check in its place fails where the assumption breaks, with a message that says which one.

### scope

A non-null `get` right after `has` on the same map, or an index a loop's bound keeps in range, states a fact the code has checked in a way the type checker cannot follow. An assertion that only widens a type, such as giving an empty array or a `null` starting value its intended type, claims nothing false, and `satisfies` checks rather than claims.

## typescript/types/derive-dont-restate

### why

Two hand-written descriptions of the same data drift apart: a value added to the constant or a field added to the schema is missing from the restated type, and the compiler says nothing because each declaration is valid on its own. A derived type changes with its source, so the compiler flags every use the change breaks.

### scope

Types whose fields match by coincidence, or that are meant to stay fixed when their look-alike changes, such as a published API contract or the shape of an older stored version, are not the same data. A type that mirrors something the code cannot import, such as a third-party payload with no published types, has nothing to derive from.

## typescript/types/unrepresentable-invalid-states

### why

With optional fields and flags, the compiler accepts objects no state allows, such as one that is loading and holds an error, and every reader has to work out again which combinations are real, usually with checks or non-null assertions that miss a case. A union lets the compiler narrow on the state, so each branch sees exactly its fields, and an exhaustive switch flags a new state wherever it goes unhandled.

### scope

Optional fields that are independent of each other, so that every combination is valid, such as an options object, a partial update, or a set of search filters, describe no states and need no union.

## typescript/types/validate-external-data

### why

Types are erased at runtime, so a cast of outside data is a claim nothing checks: when the other side sends another shape, such as after an API change, with a variable unset, or from a hand-edited file, the mismatch passes the boundary silently and fails later as an `undefined` deep in the code or as bad data written onward. A check where the data enters fails there, naming the field that was wrong.

### scope

A value kept at the type its source guarantees, such as an environment variable read as a possibly undefined string and checked before use, makes no unchecked claim, and neither does a typed result an SDK returns without a cast in this code. A JSON file imported at build time is typed by the compiler from its own content.
