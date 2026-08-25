@AGENTS.md

## Incident note — 2026-08-24 kosher custom order (resolved)

Joe's two-line kosher custom order (`admin_c8158a7fd49e42a195719385`) created both
Annatel lines and attached the requested physical SIMs, but both lines completed
without DIDs. The affected BitLink line IDs are
`8f020fb4-8547-4cf0-9922-b6bb2a37ea8b` and
`52a5eb8b-64e5-45d3-b619-96ab48f005d8`; their Annatel line IDs are
`0c08c500-373a-4bb8-a61a-815550d07743` and
`de315503-f1e1-4fe7-807f-b26e256abc7f`.

Root cause: the DID picker was prefix-blind, so it offered numbers from our
ordinary Israeli block to kosher lines and Annatel refused them with HTTP 422
(`did ... is not compatible with kosher line`). At the time the tenant simply
held no kosher-provisioned stock, so no candidate could have worked.

Annatel has since allocated a kosher block — `+972555216500`–`+972555216599`,
100 numbers, all present in the tenant bank (verified against `/api/dids`) — and
attached one to each stuck line: `+972555216502` to `0c08c500…` and
`+972555216501` to `de315503…`. Both carrier lines are healthy: main SIM, plan
provisioned, no suspensions.

Second incident, 2026-08-25: an ordinary basic-plan order
(`e5fd475b-77c2-43e2-9a51-c4d1e7e4d960`, carrier `8480df4d-1385-43b5-a759-e11be1217893`)
completed with no DID for the mirror-image reason — once the kosher block
landed in the bank it started coming back first on page 1 of `/api/dids`, and
the prefix-blind picker offered kosher numbers to a non-kosher line five times,
each refused with `did ... is not compatible with non kosher line`. The blocks
are exclusive in BOTH directions; the picker now matches on both sides.

Note for future kosher work: our Israeli inventory is two blocks of 100 —
`+9725551953xx` (ordinary) and `+9725552165xx` (kosher). The `/api/dids`
response has no kosher flag, so the block prefix is the only signal;
`KOSHER_DID_PREFIXES` in `src/lib/telecom/annatel/provider.ts` is the list to
extend when Annatel allocates another block. The four `+97258` numbers in the
bank are customer port-ins (`origin: "ported"`, three of them on non-kosher
lines) — **058 is not a kosher range**, and an earlier fix that assumed it was
has been reverted.
