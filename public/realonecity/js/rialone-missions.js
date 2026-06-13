/*
 * RialOne City campaign data.
 * All mission objects are plain data so designers can rebalance objectives, rewards, and unlocks.
 */

(function () {
    function mission(id, title, symbol, district, missionType, description, objectives, enemies, vehicles, wantedLevelOnFail, rewardMoney, rewardReputation, unlocks, completionTrigger, playable) {
        return {
            id: id,
            title: title,
            symbol: symbol,
            district: district,
            missionType: missionType,
            description: description,
            objectives: objectives,
            enemies: enemies,
            vehicles: vehicles,
            wantedLevelOnFail: wantedLevelOnFail,
            rewardMoney: rewardMoney,
            rewardReputation: rewardReputation,
            rewardInfluence: Math.max(1, Math.round(rewardReputation / 2)),
            unlocks: unlocks,
            completionTrigger: completionTrigger,
            playable: playable === true
        };
    }

    GTA.RialoneMissionTypes = [
        "INTRO",
        "STREET_FIGHT",
        "CAR_CHASE",
        "STREET_RACE",
        "ESCORT",
        "INFILTRATION",
        "DEFENSE",
        "HACK_TERMINAL",
        "DELIVERY",
        "BOSS_FIGHT",
        "POLICE_ESCAPE",
        "DATA_HEIST",
        "RWA_RECOVERY",
        "AI_AGENT_CONTRACT",
        "MARKET_MANIPULATION",
        "FINAL_ASSAULT"
    ];

    GTA.RialoneDistricts = [
        "Downtown Onboarding District",
        "Data Row",
        "Reactive Heights",
        "Asset Docks",
        "Finance Core",
        "Compliance Block",
        "Privacy Underground",
        "Agent Alley",
        "Bridge Freeway",
        "Subzero Zone"
    ];

    GTA.RialoneMissionData = [
        mission("M01_OMNI_START", "Welcome to Rialo City", "OM", "Downtown Onboarding District", "INTRO", "Create your Omni Account and escape a wallet-drain gang.", ["Meet your contact", "Activate Omni Account", "Defeat the wallet-drain gang", "Escape to the safehouse"], ["Wallet Drain Thug", "Street Scammer"], ["Starter Sedan"], 1, 500, 10, ["Safehouse", "Downtown Map"], "ReachSafehouse", true),
        mission("M02_MULTI_BOROUGH", "One Account, Five Boroughs", "5B", "Downtown / Bridge Freeway", "DELIVERY", "Carry an identity pass through hostile network gates.", ["Pass five network gates", "Avoid toll gangs", "Deliver identity pass"], ["Toll Gang Driver", "Bridge Lookout"], ["Starter Sedan"], 1, 650, 12, ["Bridge Freeway Marker"], "DeliverIdentityPass", true),
        mission("M03_GASLESS_ESCAPE", "Gasless Getaway", "GX", "Downtown Onboarding District", "POLICE_ESCAPE", "Rescue a friend and escape the gang without gas fees slowing you down.", ["Rescue friend", "Unlock car", "Escape gang ambush", "Lose police heat"], ["Wallet Drain Driver", "Street Ambusher"], ["Starter Sedan"], 2, 800, 16, ["Police Heat UI"], "EvadeWantedZone", true),
        mission("M04_SOCIAL_PASS", "Social Login Street Pass", "SP", "Downtown Onboarding District", "ESCORT", "Move three civilians through login booths while scammers swarm the block.", ["Escort three NPCs", "Fight scammers", "Reach onboarding center"], ["Login Scammer", "Booth Lurker"], ["None"], 1, 750, 14, ["Crew Respect"], "EscortComplete", true),
        mission("M05_2FA_FIRE", "Two-Factor Fire Drill", "2F", "Downtown Onboarding District", "DEFENSE", "Protect a racer while 2FA towers come online.", ["Protect racer", "Activate 2FA towers", "Defeat identity thieves"], ["Identity Thief", "SIM Swap Brawler"], ["Starter Sedan"], 2, 900, 18, ["2FA Tower Jobs"], "DefenseTimerComplete", true),
        mission("M06_ORACLE_TAX", "The Oracle Tax Shakedown", "OR", "Data Row", "DATA_HEIST", "Break into an oracle cartel office and clean the price feed.", ["Infiltrate oracle office", "Steal pricing files", "Fight guards", "Upload clean feed"], ["Oracle Guard", "Feed Enforcer"], ["Data Van"], 2, 1200, 22, ["Data Row"], "UploadCleanFeed", false),
        mission("M07_TRAFFIC_FEED", "Traffic Feed Takeover", "TF", "Data Row", "CAR_CHASE", "Hack traffic lights and chase a fake-data van.", ["Hack traffic lights", "Reroute ambulance", "Chase fake-data van"], ["Fake Data Driver"], ["Data Van"], 2, 1250, 22, ["Traffic Hack Jobs"], "VanDisabled", false),
        mission("M08_RAIN_INSURANCE", "Rain Check Insurance", "RN", "Data Row / Flood Zone", "DEFENSE", "Collect weather proof and trigger an instant payout for flood victims.", ["Collect weather proof", "Defend flood victims", "Trigger instant payout"], ["Claim Shark", "Flood Zone Raider"], ["Rescue Truck"], 2, 1300, 24, ["Insurance Contracts"], "PayoutTriggered", false),
        mission("M09_CUSTOMS_MIDNIGHT", "Customs at Midnight", "CM", "Asset Docks", "INFILTRATION", "Verify cargo in the port while smugglers hunt your scanner.", ["Scan containers", "Verify cargo", "Defeat smugglers", "Release shipment"], ["Dock Smuggler", "Cargo Guard"], ["Cargo Truck"], 2, 1400, 24, ["Asset Docks"], "ShipmentReleased", false),
        mission("M10_DATA_NEVER_SLEEPS", "The Data Never Sleeps", "DN", "Reactive Heights", "DEFENSE", "Hold a timer tower until midnight execution.", ["Defend timer tower", "Survive waves", "Confirm execution"], ["Timer Raider", "Automation Breaker"], ["None"], 2, 1500, 26, ["Reactive Heights"], "MidnightExecution", false),
        mission("M11_CONDITIONAL_TX", "Conditional Transaction", "CT", "Reactive Heights", "DELIVERY", "Deliver a package that only clears if GPS and time conditions are met.", ["Deliver package", "Hit GPS checkpoint", "Beat time limit", "Verify recipient"], ["Courier Jacker"], ["Courier Bike"], 1, 1450, 25, ["Courier Jobs"], "RecipientVerified", false),
        mission("M12_SLEEP_LOOP_RESUME", "Sleep, Loop, Resume", "SL", "Reactive Heights", "INFILTRATION", "Plant credentials, leave the area, then return when the vault timer wakes.", ["Plant credentials", "Leave area", "Return after timer", "Open vault"], ["Casino Guard", "Vault Crew"], ["Coupe"], 2, 1700, 28, ["Vault Runs"], "VaultOpened", false),
        mission("M13_NO_BOT_NEEDED", "No Bot Needed", "NB", "Reactive Heights", "MARKET_MANIPULATION", "Stop a bot gang and trigger the automated bid yourself.", ["Stop bot gang", "Trigger automated bid", "Escape auction hall"], ["Bid Bot", "Auction Enforcer"], ["Auction Car"], 2, 1650, 27, ["Auction Missions"], "BidConfirmed", false),
        mission("M14_NANO_RUN", "Nanosecond Night Run", "NR", "Racing District", "STREET_RACE", "Win a reactive checkpoint race against the fastest crew in town.", ["Win race", "Avoid dynamic barriers", "Beat rival crew"], ["Rival Racer"], ["Tuned Sedan"], 1, 1800, 30, ["Street Races"], "RaceWon", false),
        mission("M15_FRESH_STATE", "Fresh State", "FS", "Data Row", "INFILTRATION", "Find stale map data and expose a fake-balance gang.", ["Reveal stale map data", "Locate hidden safehouse", "Defeat fake-balance gang"], ["Fake Balance Dealer"], ["None"], 2, 1750, 30, ["Hidden Safehouses"], "SafehouseFound", false),
        mission("M16_TBILL_TOWER", "T-Bill Tower", "TB", "Finance Core", "DEFENSE", "Protect a tokenized treasury auction in a raided skyscraper.", ["Protect auction", "Fight raiders", "Secure data feed"], ["Treasury Raider", "Auction Sniper"], ["Armored Sedan"], 3, 2200, 34, ["Finance Core"], "AuctionSecured", false),
        mission("M17_DIVIDEND_DRIVEBY", "Dividend Drive-By", "DD", "Finance Core", "CAR_CHASE", "Escort a corporate-action signal through an ambush.", ["Escort signal", "Avoid ambush", "Deliver dividend update"], ["Broker Biker"], ["Signal Bike"], 2, 2050, 32, ["Dividend Jobs"], "UpdateDelivered", false),
        mission("M18_STOCK_SPLIT_WAR", "Stock Split Street War", "SW", "Finance Core", "STREET_FIGHT", "Expose a fake stock split and fight the trading crew behind it.", ["Expose fake split", "Chase broker", "Fight trading crew"], ["Trading Brawler", "Split Broker"], ["Broker Coupe"], 2, 2150, 34, ["Trading Floor Access"], "BrokerDefeated", false),
        mission("M19_INVOICE_INFERNO", "Invoice Inferno", "II", "Industrial Zone", "DEFENSE", "Verify a paid invoice and defend a shop from loan sharks.", ["Verify paid invoice", "Defend shop", "Unlock emergency credit"], ["Loan Shark", "Repo Thug"], ["Work Van"], 2, 1900, 31, ["Industrial Zone"], "CreditUnlocked", false),
        mission("M20_WAREHOUSE_RIOT", "Warehouse Receipt Riot", "WR", "Asset Docks", "RWA_RECOVERY", "Protect warehouse receipts while cargo gangs riot.", ["Verify inventory", "Protect receipts", "Defeat cargo gang"], ["Cargo Gang", "Forklift Bruiser"], ["Cargo Truck"], 2, 2300, 36, ["Receipt Recovery"], "ReceiptsProtected", false),
        mission("M21_POLICY_GATE", "Policy Gate", "PG", "Compliance Block", "INFILTRATION", "Guard a restricted vault against fake whales.", ["Verify VIP eligibility", "Stop fake whales", "Defend vault"], ["Fake Whale", "Gate Crasher"], ["Security SUV"], 2, 2100, 34, ["Compliance Block"], "VaultHeld", false),
        mission("M22_AML_HEAT", "AML Heat", "AH", "Compliance Block", "POLICE_ESCAPE", "Trace dirty funds and chase a courier before settlement clears.", ["Trace dirty funds", "Chase courier", "Block settlement"], ["Dirty Courier", "Mixer Driver"], ["Unmarked Sedan"], 3, 2400, 38, ["AML Challenges"], "SettlementBlocked", false),
        mission("M23_COLLATERAL_CALL", "Collateral Call", "CC", "Finance Core", "DELIVERY", "Recover eligible collateral before the margin timer ends.", ["Recover collateral", "Avoid repo gang", "Deliver before timer"], ["Repo Driver", "Margin Enforcer"], ["Repo Truck"], 2, 2350, 37, ["Collateral Jobs"], "CollateralDelivered", false),
        mission("M24_HAIRCUT_HIGHWAY", "Haircut Highway", "HH", "Bridge Freeway", "ESCORT", "Protect a collateral data convoy through haircut checkpoints.", ["Escort convoy", "Hit haircut checkpoints", "Survive ambush"], ["Road Raider", "Bridge Gunner"], ["Convoy Car"], 3, 2600, 40, ["Bridge Convoys"], "ConvoySafe", false),
        mission("M25_COVENANT_ENGINE", "Covenant Truth Engine", "CE", "Compliance Block", "INFILTRATION", "Steal ERP proof and notify both sides before the lender war starts.", ["Steal ERP proof", "Run covenant test", "Notify lender and borrower"], ["ERP Guard", "Covenant Broker"], ["None"], 2, 2500, 39, ["Covenant Jobs"], "NoticeSent", false),
        mission("M26_BLACKBOX_BORROWER", "The Black Box Borrower", "BB", "Privacy Underground", "INFILTRATION", "Collect proof without exposing raw borrower data.", ["Collect proof", "Avoid surveillance", "Escape guards"], ["Surveillance Guard", "Black Box Hunter"], ["Black Van"], 3, 2800, 42, ["Privacy Underground"], "ProofEscaped", false),
        mission("M27_HIDDEN_INPUTS", "No One Sees the Inputs", "HI", "Privacy Underground", "DEFENSE", "Destroy leak servers and protect the encrypted file.", ["Destroy leak servers", "Protect encrypted file", "Escape tunnels"], ["Leak Broker", "Tunnel Guard"], ["Tunnel Bike"], 3, 2900, 44, ["Encrypted Data Jobs"], "FileProtected", false),
        mission("M28_ACCREDITED_ACCESS", "Accredited Access", "AA", "Compliance Block", "ESCORT", "Verify investor access and escort the real investor through attackers.", ["Verify access", "Block fake credentials", "Escort investor"], ["Credential Faker", "Gate Thief"], ["Executive Sedan"], 2, 2600, 40, ["Investor Jobs"], "InvestorSafe", false),
        mission("M29_FROZEN_WALLET", "The Frozen Wallet", "FW", "Privacy Underground", "CAR_CHASE", "Chase a stolen asset and freeze control before it crosses town.", ["Chase stolen asset", "Activate freeze control", "Defeat wallet thief"], ["Wallet Thief", "Tunnel Driver"], ["Stolen Coupe"], 3, 3000, 45, ["Freeze Controls"], "WalletFrozen", false),
        mission("M30_AUDIT_ESCAPE", "Audit Trail Escape", "AE", "Compliance Block", "POLICE_ESCAPE", "Carry sealed audit evidence through police and gang pressure.", ["Carry audit evidence", "Survive pursuit", "Upload proof"], ["Audit Hunter", "Dirty Patrol"], ["Audit Van"], 3, 3100, 46, ["Audit Trails"], "ProofUploaded", false),
        mission("M31_HIRE_BOT", "Hire the Bot, Not the Boss", "HB", "Agent Alley", "AI_AGENT_CONTRACT", "Hire an AI agent and defend its escrow terminal.", ["Hire AI agent", "Defend escrow terminal", "Verify output"], ["Escrow Raider", "Prompt Thief"], ["None"], 2, 2700, 42, ["Agent Alley"], "OutputVerified", false),
        mission("M32_DEADLINE_REFUND", "Deadline or Refund", "DR", "Agent Alley", "DEFENSE", "Defend a garage while waiting for AI delivery, then trigger refund.", ["Wait for delivery", "Defend garage", "Trigger refund"], ["Deadline Shark", "Agent Hijacker"], ["Garage Car"], 2, 2750, 43, ["Refund Contracts"], "RefundTriggered", false),
        mission("M33_JUDGE_BOT", "Judge Bot Alley", "JB", "Agent Alley", "ESCORT", "Protect a judge bot while it compares rival agent outputs.", ["Protect judge bot", "Compare outputs", "Reward winner"], ["Output Thief", "Bot Saboteur"], ["None"], 2, 2850, 44, ["Judge Agent Income"], "WinnerRewarded", false),
        mission("M34_A2A_COURIER", "A2A Courier", "AC", "Agent Alley", "DELIVERY", "Carry an agent task address across town under interception.", ["Carry task address", "Avoid interceptors", "Deliver to hub"], ["Task Interceptor", "Hub Raider"], ["Courier Bike"], 2, 2900, 45, ["A2A Jobs"], "TaskDelivered", false),
        mission("M35_PASSIVE_JUDGE", "Passive Judge Hustle", "PJ", "Agent Alley", "AI_AGENT_CONTRACT", "Judge three AI jobs and unlock passive judge income.", ["Judge three jobs", "Earn reputation", "Unlock income"], ["Rigged Agent", "Escrow Brawler"], ["None"], 1, 3000, 46, ["Judge Income"], "IncomeUnlocked", false),
        mission("M36_CBOE_SIGNAL", "The CBOE Signal", "CS", "Finance Core", "DEFENSE", "Protect a market data relay from trading thieves.", ["Protect market relay", "Fight trading thieves", "Keep feed live"], ["Signal Thief", "Market Raider"], ["Signal Van"], 3, 3300, 48, ["Market Signals"], "FeedLive", false),
        mission("M37_FX_RUN", "FX Run", "FX", "Finance Core / Bridge Freeway", "CAR_CHASE", "Settle payment before the FX rate moves.", ["Settle payment", "Beat FX timer", "Escape currency gang"], ["Currency Gang", "FX Driver"], ["Fast Sedan"], 2, 3200, 47, ["FX Jobs"], "PaymentSettled", false),
        mission("M38_OPTIONS_HOUSE", "Options House", "OH", "Finance Core", "MARKET_MANIPULATION", "Expose stale options pricing in a trading-floor brawl.", ["Expose stale pricing", "Hack pricing board", "Defeat desk boss"], ["Options Boss", "Desk Guard"], ["Executive Sedan"], 3, 3400, 50, ["Options Contracts"], "DeskBossDefeated", false),
        mission("M39_DERIVATIVE_DRIFT", "Derivative Drift", "DF", "Asset Docks", "STREET_RACE", "Drift through the port and trigger a derivative update.", ["Race through port", "Collect disruption signals", "Trigger derivative update"], ["Port Racer", "Derivative Driver"], ["Drift Car"], 2, 3450, 50, ["Drift Zones"], "DerivativeUpdated", false),
        mission("M40_STOPLOSS_SIREN", "Stop-Loss Siren", "SS", "Finance Core", "DEFENSE", "Protect a treasury and activate stop-loss under attack.", ["Protect treasury", "Activate stop-loss", "Survive manipulation attack"], ["Manipulation Crew", "Treasury Raider"], ["Armored Sedan"], 3, 3600, 52, ["Stop Loss Abilities"], "StopLossActive", false),
        mission("M41_BRIDGE_BURNER", "Bridge Burner", "BR", "Bridge Freeway", "BOSS_FIGHT", "Attack a bridge cartel checkpoint and open native interop.", ["Attack checkpoint", "Free trapped users", "Unlock native route"], ["Bridge Boss", "Cartel Guard"], ["Armored Truck"], 4, 3900, 56, ["Native Interop Route"], "CheckpointLiberated", false),
        mission("M42_WRAPPED_WAR", "Wrapped Asset War", "WW", "Bridge Freeway", "RWA_RECOVERY", "Identify fake wrapped tokens and burn counterfeit supply.", ["Identify fakes", "Chase minters", "Burn counterfeit supply"], ["Fake Minter", "Wrapper Guard"], ["Mint Van"], 3, 3800, 55, ["Counterfeit Cleanup"], "SupplyBurned", false),
        mission("M43_100K_CALL_RIOT", "The 100K Call Riot", "10", "Downtown Festival Zone", "DEFENSE", "Keep festival scans, rides, payments, and rewards alive under load.", ["Keep ticket scans live", "Protect rides", "Defend reward booths"], ["Load Riot Crew", "Scan Jammer"], ["Festival Cart"], 3, 3950, 57, ["Festival Zone"], "FestivalStable", false),
        mission("M44_PROPOSER_CHAOS", "Concurrent Proposer Chaos", "CP", "Subzero Zone", "DEFENSE", "Coordinate validators and keep three towers online.", ["Coordinate validators", "Defend three towers", "Keep city online"], ["Tower Raider", "Consensus Breaker"], ["Validator SUV"], 4, 4300, 62, ["Subzero Zone"], "TowersOnline", false),
        mission("M45_INFINITE_FREEWAY", "Infinite Freeway", "IF", "Bridge Freeway", "STREET_RACE", "Race across an expanding freeway and defeat the road gang.", ["Race freeway", "Open map section", "Defeat road gang"], ["Road Boss", "Freeway Racer"], ["Nitro Coupe"], 3, 4200, 60, ["New Map Section"], "FreewayOpened", false),
        mission("M46_MIDDLEWARE_MONOPOLY", "Middleware Monopoly", "MM", "All Districts", "BOSS_FIGHT", "Defeat the oracle, bridge, indexer, and RPC bosses.", ["Defeat oracle boss", "Defeat bridge boss", "Defeat indexer boss", "Defeat RPC boss"], ["Oracle Boss", "Bridge Boss", "Indexer Boss", "RPC Boss"], ["Boss Sedan"], 4, 4700, 66, ["Boss Chain"], "BossChainCleared", false),
        mission("M47_LIVING_ASSET", "The Living Asset", "LA", "Asset Docks / Finance Core", "RWA_RECOVERY", "Build and defend a living asset while feeds connect.", ["Build asset", "Connect feeds", "Defend activation"], ["Asset Raider", "Feed Thief"], ["Asset Truck"], 4, 4800, 68, ["Living Assets"], "AssetActivated", false),
        mission("M48_CITY_WORKFLOW", "Citywide Workflow", "CW", "Entire City", "FINAL_ASSAULT", "Connect banks, ports, weather, identity, agents, markets, and compliance systems.", ["Connect banks", "Connect ports", "Connect weather", "Connect identity", "Connect agents", "Connect markets"], ["Workflow Breaker", "City Saboteur"], ["Command Car"], 4, 5200, 72, ["Map Automation"], "WorkflowOnline", false),
        mission("M49_SUBZERO_SIEGE", "Subzero Siege", "SZ", "Subzero Zone", "FINAL_ASSAULT", "Defend validator towers, data relays, compliance gates, and agent hubs.", ["Defend validator towers", "Defend data relays", "Defend gates", "Defend hubs"], ["Subzero Raider", "Elite Breaker"], ["Validator Truck"], 5, 6000, 82, ["Final Mission"], "SiegeBroken", false),
        mission("M50_GET_REAL", "Get Real", "GR", "Entire City", "FINAL_ASSAULT", "Fight through the shutdown, race to the tower, and activate Rialo City fully.", ["Survive shutdown", "Race to final tower", "Defeat old middleware bosses", "Activate Rialo City"], ["Middleware King", "Elite Compliance Squad"], ["Final Coupe"], 5, 10000, 120, ["Endgame Complete"], "CityActivated", false)
    ];
}());
