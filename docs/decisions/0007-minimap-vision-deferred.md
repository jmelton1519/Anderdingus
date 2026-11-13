# ADR 0007: Minimap screen reading deferred behind a pluggable event source

Status: accepted

Minimap reading is deferred, not dropped: it is the first big feature after the first working slice, run as a timeboxed feasibility spike. Event sources are pluggable so a vision source can sit beside GSI (and the console relay). Discord bots cannot officially receive Go Live video (that needs unofficial reverse engineering and breaks the ToS), so capture happens locally in the companion app. Screen capture may need CS2's `-allow_third_party_software` launch option, which turns off Trusted Mode; check that against ADR 0010 before shipping.
