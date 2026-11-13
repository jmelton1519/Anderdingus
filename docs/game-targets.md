# Game targets: business ranking

Status: draft, 2026-11-13. Player counts are third-party estimates (Valve and Riot do not publish official figures); payout math is illustrative, not a forecast. Re-verify rules and APIs before building each adapter.

## Ranking

| Rank | Game                                 | Audience                                                                                       | Official live data                                                                                     | Integration ease                                                  | Rules risk for live assist                                                                                            | Payout potential for a Discord bot                                                      |
| ---- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1    | **Counter-Strike 2** (v1)            | Very large, ~825K avg concurrent on Steam (Aug 2026), peak ~1.33M; #1 on Steam                 | Yes: Game State Integration (local JSON push)                                                          | Easy; mature TS/C#/Rust libraries                                 | Medium: needs per-platform check (Valve vs. FACEIT/ESL)                                                               | High: huge base, proven paid analytics market (Leetify)                                 |
| 2    | **Dota 2**                           | Large, ~600K avg concurrent (Aug 2026); ~8.9M monthly audience (Aug 2026, analyst estimate)    | Yes: Game State Integration (Valve, same family as CS2)                                                | Easy; closest to a copy of the CS2 adapter                        | Medium: same Valve framework, verify per mode                                                                         | Medium-high: heavy information load (items, cooldowns, objectives) suits an assistant   |
| 3    | **League of Legends**                | Largest by far, ~120-135M monthly players (unofficial estimates)                               | Yes: local Live Client Data API plus Riot web APIs                                                     | Medium: more setup, Riot developer-portal approval for production | **High**: Riot bans real-time data that changes behavior in the moment; pre-game and post-game analysis is encouraged | Medium: huge market, but crowded (Mobalytics, Blitz) and limited to post-match/coaching |
| 4    | **Rocket League**                    | Small on Steam (~18-19K avg concurrent, Oct 2026); more players on other platforms (uncounted) | Yes: official local Stats API (opt-in via config)                                                      | Easy                                                              | Low-medium (verify)                                                                                                   | Low: small audience                                                                     |
| -    | Apex, Call of Duty/Warzone, Valorant | Not researched in depth                                                                        | No comparable official live feed known; Valorant is opt-in via Riot Sign On with strict in-match rules | Hard / risky                                                      | High                                                                                                                  | Skip for now                                                                            |

## Why this order

1. **CS2 first.** Largest concurrent audience of any Steam game, official data feed, and a visible paid market. Third-party estimates put Leetify (CS2 analytics) at roughly $4.5-5M annual revenue with a ~20-person team, which suggests players pay for CS2 insight. Our angle is different: a live, voice-and-chat assistant for friend groups, not a stats website.
2. **Dota 2 second.** Cheapest way to prove the game-adapter layer: same Valve GSI approach, a large and information-dense game, and a community used to third-party tools.
3. **League third, and only in pre/post-game modes.** Biggest market, but Riot's policies discourage in-the-moment advice, and well-funded incumbents (Mobalytics est. ~$8-9M revenue; Blitz reports 8M+ users) already own the analytics space. A post-match review bot is viable; a live-callout bot is not.
4. **Rocket League fourth.** Easy official API, but a small Steam audience limits upside.

## Rough payout math (illustrative)

Assumptions: Discord Premium Apps subscription at $5/month; Discord's cut ~10% (sources vary; confirm in the Developer Docs); payouts start after $100 earned; available in the US, EU and UK.

- Net per subscriber: $5 x 12 x 0.90 = **$54/year**.
- Subscribers needed for **$100K/year**: about **1,850**.
- As a share of average Steam concurrent players: CS2 ~0.2%, Dota 2 ~0.3%, Rocket League ~10%. For League's ~130M monthly players it would be well under 0.01%, but the rules limit what we may sell there.
- Reality check: most bots convert far fewer than 1% of their users, so treat these as ceilings, and expect the first year to be about finding fit, not revenue. Servers or teams paying a flat fee (instead of individuals) may suit friend groups better.

## Risks that apply to all games

- Platform rules for real-time assistance differ by game and organizer; get a written rules check before any public launch.
- Valve or Riot policy changes can remove a data source overnight; keep the adapter layer thin.
- Player counts here are estimates and swing month to month.

## Sources

- CS2 player counts: https://timesaver.gg/news/cs2-player-count-august-2026-two-year-low and https://www.demandsage.com/?p=61687
- Dota 2 player counts: https://activeplayer.io/?p=9626 and https://bo3.gg/dota2/news/dota-2-monthly-audience-reaches-record-8-88-million
- League of Legends player estimates: https://wecoach.gg/blog/article/league-of-legends-player-count-and-statistics-2026 and https://lolnow.gg/lol-player-count/
- Rocket League player counts and Stats API: https://www.explosion.com/game-guides/rocket-league-player-count/ and https://www.rocketleague.com/en/developer/stats-api
- Riot developer policies: https://support-developer.riotgames.com/hc/en-us/articles/22698732381587 and https://lolnow.gg/riot-cracks-down-on-overlays-in-league-of-legends-a-long-overdue-clean-up/
- Competitor revenue estimates (third-party, low confidence): https://techlist.ai/leetify.com and https://techlist.ai/mobalytics.gg
- Discord monetization: https://docs.discord.com/developers/platform/app-monetization and https://voxbooster.com/blog/discord-server-subscription-monetization-statistics-2026
