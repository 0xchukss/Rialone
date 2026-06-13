/*
 * RialOne City open-world MVP systems.
 * Modular enough for future GTA-style repos to swap in deeper controllers, AI, missions, and UI.
 */

(function () {
    var SAVE_KEY = "rialone_city_open_world_save_v1",
        MINT = "#A9DDD3",
        CREAM = "#E8E4D9",
        BLACK = "#010101";

    GTA.RialoneGameState = function () {
        this.money = 0;
        this.reputation = 0;
        this.rialoInfluence = 0;
        this.crewRespect = 0;
        this.health = 100;
        this.armor = 0;
        this.vehicleCondition = 100;
        this.wantedLevel = 0;
        this.currentObjective = "Find a mission marker";
        this.completedMissions = {};
        this.unlockedDistricts = {
            "Downtown Onboarding District": true
        };
        this.savedCars = [];
        this.playerPosition = null;
        this.lastSaveAt = null;
        this.saveVersion = 2;
    };

    GTA.RialoneGameState.prototype.applySave = function (data) {
        var key;

        if (!data) {
            return;
        }

        for (key in data) {
            if (data.hasOwnProperty(key) && this[key] !== undefined) {
                this[key] = data[key];
            }
        }
    };

    GTA.RialoneGameState.prototype.addRewards = function (mission) {
        this.money += mission.rewardMoney || 0;
        this.reputation += mission.rewardReputation || 0;
        this.rialoInfluence += mission.rewardInfluence || 0;
        this.crewRespect += Math.max(1, Math.round((mission.rewardReputation || 0) / 4));
        this.completedMissions[mission.id] = true;
        this.currentObjective = "Choose the next mission";
    };

    GTA.RialoneGameState.prototype.capturePlayerPosition = function (player) {
        if (player === undefined || player === null || player.position === undefined) {
            return;
        }

        this.playerPosition = {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z || 128
        };
    };

    GTA.RialoneGameState.prototype.snapshot = function () {
        return {
            saveVersion: this.saveVersion,
            money: this.money,
            reputation: this.reputation,
            rialoInfluence: this.rialoInfluence,
            crewRespect: this.crewRespect,
            health: this.health,
            armor: this.armor,
            vehicleCondition: this.vehicleCondition,
            wantedLevel: this.wantedLevel,
            currentObjective: this.currentObjective,
            completedMissions: this.completedMissions,
            unlockedDistricts: this.unlockedDistricts,
            savedCars: this.savedCars,
            playerPosition: this.playerPosition,
            lastSaveAt: this.lastSaveAt
        };
    };

    GTA.RialoneSaveSystem = function (state) {
        this.state = state;
    };

    GTA.RialoneSaveSystem.prototype.load = function () {
        var raw,
            data;

        try {
            raw = window.localStorage.getItem(SAVE_KEY);

            if (!raw) {
                return false;
            }

            data = JSON.parse(raw);
            this.state.applySave(data);
            return true;
        } catch (ignoreLoad) {
            return false;
        }
    };

    GTA.RialoneSaveSystem.prototype.save = function (player) {
        try {
            this.state.capturePlayerPosition(player);
            this.state.lastSaveAt = Date.now();
            window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.state.snapshot()));
            return true;
        } catch (ignoreSave) {
            return false;
        }
    };

    GTA.RialoneUIManager = function (game, state) {
        this.game = game;
        this.state = state;
        this.root = null;
        this.toast = null;
        this.splash = null;
        this.minimap = null;
        this.baseMap = null;
        this.mapDrawTimer = 0;
        this.dayNightOverlay = null;
    };

    GTA.RialoneUIManager.prototype.start = function () {
        this.injectStyles();
        this.createHud();
        this.createBaseMap();
        this.update();
    };

    GTA.RialoneUIManager.prototype.injectStyles = function () {
        var style = document.createElement("style");

        style.type = "text/css";
        style.appendChild(document.createTextNode(
            "#rialoneHud{position:absolute;left:10px;top:10px;z-index:16;width:286px;pointer-events:none;" +
                "font:12px/1.3 Arial,Helvetica,sans-serif;color:" + CREAM + ";text-transform:uppercase;" +
                "text-shadow:0 0 10px rgba(169,221,211,.45);}" +
            "#rialoneHud .panel{background:rgba(1,1,1,.72);border:1px solid rgba(169,221,211,.45);" +
                "box-shadow:0 0 24px rgba(169,221,211,.18);padding:9px;}" +
            "#rialoneHud .row{display:flex;align-items:center;justify-content:space-between;gap:9px;margin:3px 0;}" +
            "#rialoneHud .label{color:rgba(232,228,217,.62);font-size:10px;letter-spacing:.08em;}" +
            "#rialoneHud .value{color:" + MINT + ";font-weight:bold;}" +
            "#rialoneHud .bars{display:grid;gap:5px;margin:7px 0;}" +
            "#rialoneHud .bar{height:7px;background:rgba(232,228,217,.12);overflow:hidden;border:1px solid rgba(232,228,217,.12);}" +
            "#rialoneHud .bar span{display:block;height:100%;width:0;transition:width .15s linear;}" +
            "#rialoneHud .health span{background:#ff5f5f;box-shadow:0 0 12px rgba(255,95,95,.8);}" +
            "#rialoneHud .armor span{background:#81b7ff;box-shadow:0 0 12px rgba(129,183,255,.75);}" +
            "#rialoneHud .objective{margin-top:8px;color:#fff;font-weight:bold;line-height:1.35;}" +
            "#rialoneHud .stars{letter-spacing:.1em;color:#333;font-size:14px;}" +
            "#rialoneHud .stars .hot{color:#ffe15d;text-shadow:0 0 10px rgba(255,225,93,.9);}" +
            "#rialoneMinimap{position:absolute;right:10px;top:10px;z-index:16;width:156px;padding:6px;" +
                "background:rgba(1,1,1,.72);border:1px solid rgba(169,221,211,.45);box-shadow:0 0 24px rgba(169,221,211,.16);" +
                "font:10px Arial,Helvetica,sans-serif;text-transform:uppercase;color:" + MINT + ";pointer-events:none;}" +
            "#rialoneMinimap canvas{display:block;width:144px;height:144px;background:#030303;image-rendering:pixelated;}" +
            "#rialoneToast{position:absolute;left:50%;top:18%;transform:translate(-50%,-18px);opacity:0;z-index:30;" +
                "font:bold 24px/1.15 Arial,Helvetica,sans-serif;color:#fff;text-align:center;text-transform:uppercase;" +
                "text-shadow:0 0 16px rgba(169,221,211,.95),0 0 34px rgba(232,228,217,.45);transition:opacity .18s,transform .18s;pointer-events:none;}" +
            "#rialoneToast.show{opacity:1;transform:translate(-50%,0);}" +
            "#rialoneSplash{display:none;position:absolute;inset:0;z-index:34;align-items:center;justify-content:center;" +
                "background:radial-gradient(circle at center,rgba(169,221,211,.18),rgba(1,1,1,.82) 58%);text-align:center;" +
                "font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;color:#fff;pointer-events:none;}" +
            "#rialoneSplash.show{display:flex;}" +
            "#rialoneSplash .title{font-size:38px;font-weight:bold;letter-spacing:.02em;color:" + CREAM + ";}" +
            "#rialoneSplash .meta{margin-top:10px;color:" + MINT + ";font-size:13px;letter-spacing:.18em;}" +
            "#rialoneDayNight{position:absolute;inset:0;z-index:4;background:#020614;opacity:0;pointer-events:none;transition:opacity .4s linear;}" +
            "body.missionPhoneMode #rialoneHud{width:225px;font-size:10px;}" +
            "body.missionPhoneMode #rialoneMinimap{width:124px;right:8px;top:8px;}" +
            "body.missionPhoneMode #rialoneMinimap canvas{width:112px;height:112px;}" +
            "body.missionPhoneMode #rialoneSplash .title{font-size:28px;}"
        ));

        document.getElementsByTagName("head")[0].appendChild(style);
    };

    GTA.RialoneUIManager.prototype.createHud = function () {
        var root = document.createElement("div"),
            minimap = document.createElement("div");

        root.id = "rialoneHud";
        root.innerHTML =
            "<div class=\"panel\">" +
                "<div class=\"row\"><span class=\"label\">Cash</span><span class=\"value cash\">$0</span></div>" +
                "<div class=\"row\"><span class=\"label\">Rep</span><span class=\"value rep\">0</span></div>" +
                "<div class=\"row\"><span class=\"label\">Rialo Influence</span><span class=\"value influence\">0</span></div>" +
                "<div class=\"row\"><span class=\"label\">Crew Respect</span><span class=\"value crew\">0</span></div>" +
                "<div class=\"bars\">" +
                    "<div class=\"bar health\"><span></span></div>" +
                    "<div class=\"bar armor\"><span></span></div>" +
                "</div>" +
                "<div class=\"row\"><span class=\"label\">Wanted</span><span class=\"stars\"></span></div>" +
                "<div class=\"objective\"></div>" +
            "</div>";

        minimap.id = "rialoneMinimap";
        minimap.innerHTML = "<div>City Map</div><canvas width=\"144\" height=\"144\"></canvas>";

        this.toast = document.createElement("div");
        this.toast.id = "rialoneToast";

        this.splash = document.createElement("div");
        this.splash.id = "rialoneSplash";

        this.dayNightOverlay = document.createElement("div");
        this.dayNightOverlay.id = "rialoneDayNight";

        document.body.appendChild(root);
        document.body.appendChild(minimap);
        document.body.appendChild(this.toast);
        document.body.appendChild(this.splash);
        document.body.appendChild(this.dayNightOverlay);

        this.root = root;
        this.minimap = minimap.getElementsByTagName("canvas")[0];
    };

    GTA.RialoneUIManager.prototype.createBaseMap = function () {
        var canvas = document.createElement("canvas"),
            ctx,
            image,
            data,
            colors = {
                0: [1, 1, 1, 255],
                1: [35, 33, 30, 255],
                2: [95, 91, 83, 255],
                3: [72, 115, 105, 255],
                4: [51, 67, 62, 255],
                5: [18, 20, 19, 255],
                6: [56, 56, 58, 255],
                7: [56, 56, 58, 255]
            },
            blockX,
            blockY,
            color,
            index;

        canvas.width = 256;
        canvas.height = 256;
        ctx = canvas.getContext("2d");
        image = ctx.createImageData(256, 256);
        data = image.data;

        for (blockY = 0; blockY < 256; blockY += 1) {
            for (blockX = 0; blockX < 256; blockX += 1) {
                color = colors[this.getColumnType(blockX, blockY)] || colors[0];
                index = ((blockY * 256) + blockX) * 4;
                data[index] = color[0];
                data[index + 1] = color[1];
                data[index + 2] = color[2];
                data[index + 3] = color[3];
            }
        }

        ctx.putImageData(image, 0, 0);
        this.baseMap = canvas;
    };

    GTA.RialoneUIManager.prototype.getColumnType = function (blockX, blockY) {
        var column,
            block;

        if (this.game.map.base[blockX] === undefined || this.game.map.base[blockX][blockY] === undefined) {
            return 0;
        }

        column = this.game.map.base[blockX][blockY];
        block = column.blocks[2] || column.blocks[column.blocks.length - 1];

        return block ? block.type : 0;
    };

    GTA.RialoneUIManager.prototype.showToast = function (message) {
        var toast = this.toast;

        toast.innerHTML = message;
        toast.className = "show";
        window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(function () {
            toast.className = "";
        }, 1900);
    };

    GTA.RialoneUIManager.prototype.showSplash = function (title, meta) {
        var splash = this.splash;

        splash.innerHTML =
            "<div>" +
                "<div class=\"title\">" + title + "</div>" +
                "<div class=\"meta\">" + meta + "</div>" +
            "</div>";
        splash.className = "show";

        window.clearTimeout(this.splashTimer);
        this.splashTimer = window.setTimeout(function () {
            splash.className = "";
        }, 2200);
    };

    GTA.RialoneUIManager.prototype.update = function (delta, missionManager, dayNight) {
        var stars = "",
            i;

        if (!this.root) {
            return;
        }

        this.root.getElementsByClassName("cash")[0].innerHTML = "$" + this.state.money;
        this.root.getElementsByClassName("rep")[0].innerHTML = this.state.reputation;
        this.root.getElementsByClassName("influence")[0].innerHTML = this.state.rialoInfluence;
        this.root.getElementsByClassName("crew")[0].innerHTML = this.state.crewRespect;
        this.root.getElementsByClassName("health")[0].getElementsByTagName("span")[0].style.width =
            Math.max(0, Math.min(100, this.state.health)) + "%";
        this.root.getElementsByClassName("armor")[0].getElementsByTagName("span")[0].style.width =
            Math.max(0, Math.min(100, this.state.armor)) + "%";

        for (i = 1; i <= 5; i += 1) {
            stars += i <= this.state.wantedLevel ? "<span class=\"hot\">*</span>" : "*";
        }

        this.root.getElementsByClassName("stars")[0].innerHTML = stars;
        this.root.getElementsByClassName("objective")[0].innerHTML = this.state.currentObjective;

        if (dayNight !== undefined && this.dayNightOverlay !== null) {
            this.dayNightOverlay.style.opacity = dayNight.nightOpacity;
        }

        this.mapDrawTimer += delta || 0;

        if (this.mapDrawTimer > 0.15 && missionManager !== undefined) {
            this.mapDrawTimer = 0;
            this.drawMinimap(missionManager);
        }
    };

    GTA.RialoneUIManager.prototype.drawMinimap = function (missionManager) {
        var canvas = this.minimap,
            ctx,
            size,
            i,
            marker,
            playerBlock;

        if (!canvas || !this.baseMap) {
            return;
        }

        size = canvas.width;
        ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(this.baseMap, 0, 0, size, size);
        ctx.fillStyle = "rgba(1,1,1,.28)";
        ctx.fillRect(0, 0, size, size);

        for (i = 0; i < missionManager.worldMarkers.length; i += 1) {
            marker = missionManager.worldMarkers[i];

            if (marker.mesh.visible !== false && marker.type === "mission") {
                this.drawMapDot(ctx, marker.mesh.position.x, marker.mesh.position.y, size, marker.color || MINT, 5);
            }
        }

        if (missionManager.objectiveMarker !== null && missionManager.objectiveMarker.mesh.visible !== false) {
            this.drawMapCross(ctx, missionManager.objectiveMarker.mesh.position.x, missionManager.objectiveMarker.mesh.position.y, size, "#ff3333", 8);
        }

        playerBlock = this.worldToBlock(this.game.player.position.x, this.game.player.position.y);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc((playerBlock.x / 256) * size, (playerBlock.y / 256) * size, 4, 0, Math.PI * 2, true);
        ctx.fill();

        ctx.strokeStyle = "rgba(169,221,211,.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);
    };

    GTA.RialoneUIManager.prototype.drawMapDot = function (ctx, worldX, worldY, size, color, radius) {
        var block = this.worldToBlock(worldX, worldY);

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc((block.x / 256) * size, (block.y / 256) * size, radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
    };

    GTA.RialoneUIManager.prototype.drawMapCross = function (ctx, worldX, worldY, size, color, radius) {
        var block = this.worldToBlock(worldX, worldY),
            x = (block.x / 256) * size,
            y = (block.y / 256) * size;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - radius, y - radius);
        ctx.lineTo(x + radius, y + radius);
        ctx.moveTo(x + radius, y - radius);
        ctx.lineTo(x - radius, y + radius);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.restore();
    };

    GTA.RialoneUIManager.prototype.worldToBlock = function (worldX, worldY) {
        return {
            x: Math.max(1, Math.min(254, Math.round(worldX / 64))),
            y: Math.max(1, Math.min(254, Math.round(-worldY / 64)))
        };
    };

    GTA.RialoneWantedSystem = function (game, state, ui) {
        this.game = game;
        this.state = state;
        this.ui = ui;
        this.lastCrimeAt = 0;
        this.spawnTimer = 0;
    };

    GTA.RialoneWantedSystem.prototype.reportCrime = function (crime, severity) {
        this.lastCrimeAt = Date.now();
        this.setLevel(Math.min(5, this.state.wantedLevel + (severity || 1)));

        if (this.ui !== null) {
            this.ui.showToast("Wanted level raised: " + crime);
        }
    };

    GTA.RialoneWantedSystem.prototype.setLevel = function (level) {
        this.state.wantedLevel = Math.max(0, Math.min(5, level));
    };

    GTA.RialoneWantedSystem.prototype.update = function (delta, missionManager) {
        this.spawnTimer -= delta;

        if (this.state.wantedLevel >= 2 && this.spawnTimer <= 0 && missionManager !== undefined) {
            this.spawnTimer = Math.max(3, 8 - this.state.wantedLevel);
            missionManager.spawnHostileGroup("Compliance Patrol", Math.min(1 + this.state.wantedLevel, 4), {
                police: true,
                health: 65 + this.state.wantedLevel * 12
            });
        }

        if (this.state.wantedLevel > 0 && Date.now() - this.lastCrimeAt > 40000) {
            this.setLevel(this.state.wantedLevel - 1);
            this.lastCrimeAt = Date.now();
        }
    };

    GTA.RialoneEnemyAI = function (game, state) {
        this.game = game;
        this.state = state;
    };

    GTA.RialoneEnemyAI.prototype.updateWalker = function (walker, delta, index) {
        var player = this.game.player,
            state,
            dx,
            dy,
            distance,
            speed,
            attackDamage,
            attackRange,
            combat,
            canSeePlayer,
            targetRotation,
            rotationDelta;

        if (walker.hostile !== true || walker.sprite === undefined || walker.sprite.visible === false) {
            return false;
        }

        combat = this.game.combat;

        if (combat !== undefined && combat.canWalkerEngage !== undefined && !combat.canWalkerEngage(walker)) {
            return false;
        }

        state = walker.combat;

        if (state !== undefined && (state.downTimer > 0 || state.hitTimer > 0 || state.health <= 0)) {
            return true;
        }

        dx = player.position.x - walker.sprite.position.x;
        dy = player.position.y - walker.sprite.position.y;
        distance = Math.sqrt((dx * dx) + (dy * dy));

        if (walker.aiMode === "guard" && distance > 320) {
            walker.sprite.position.z = 142 + Math.sin(Date.now() / 180 + index) * 2;
            return true;
        }

        if (state !== undefined && state.health < 25 && walker.isPolice !== true &&
                (combat === undefined || combat.isActiveTarget === undefined || !combat.isActiveTarget(walker))) {
            dx = -dx;
            dy = -dy;
        }

        attackRange = walker.isPolice ? 430 : 350;
        canSeePlayer = combat !== undefined && combat.hasLineOfSight !== undefined ?
            combat.hasLineOfSight(combat.getWalkerShotPoint(walker), combat.getShotOrigin()) : true;

        if (distance > attackRange || !canSeePlayer) {
            speed = walker.isPolice ? 66 : 52;

            if (distance > 0) {
                walker.sprite.position.x += (dx / distance) * speed * delta;
                walker.sprite.position.y += (dy / distance) * speed * delta;
            }

            walker.sprite.rotation.z = Math.atan2(-dy, dx) + 1.57079633;
            walker.sprite.position.z = 142 + Math.sin(Date.now() / 130 + index) * 2;
            return true;
        }

        targetRotation = Math.atan2(-dy, dx) + 1.57079633;
        rotationDelta = Math.atan2(Math.sin(targetRotation - walker.sprite.rotation.z), Math.cos(targetRotation - walker.sprite.rotation.z));
        walker.sprite.rotation.z = targetRotation;

        if (Math.abs(rotationDelta) > 0.18) {
            return true;
        }

        walker.attackClock = (walker.attackClock || 0) - delta;

        if (walker.attackClock <= 0 && player.vehicle === null) {
            walker.attackClock = walker.isPolice ? 1.15 : 1.35;
            attackDamage = 2;

            if (combat !== undefined && combat.enemyAttack !== undefined) {
                combat.enemyAttack(walker, attackDamage);
            } else {
                if (this.state.armor > 0) {
                    this.state.armor = Math.max(0, this.state.armor - attackDamage);
                } else {
                    this.state.health = Math.max(0, this.state.health - attackDamage);
                }
            }
        }

        return true;
    };

    GTA.RialoneMissionManager = function (game, state, ui, wanted, saveSystem) {
        this.game = game;
        this.state = state;
        this.ui = ui;
        this.wanted = wanted;
        this.saveSystem = saveSystem;
        this.missions = GTA.RialoneMissionData || [];
        this.playableMissions = [];
        this.worldMarkers = [];
        this.objectiveMarker = null;
        this.activeMission = null;
        this.stageIndex = -1;
        this.stage = null;
        this.stageTimer = 0;
        this.stageSpawnTimer = 0;
        this.missionEnemies = [];
        this.time = 0;
        this.utilityCooldownUntil = 0;
        this.restartTimer = null;
        this.restarting = false;
        this.originBlock = null;
        this.activeMissionAnchorBlock = null;
        this.activeMissionMarker = null;
        this.missionAnchorBlocks = {};
    };

    GTA.RialoneMissionManager.prototype.start = function () {
        var i,
            self = this;

        for (i = 0; i < this.missions.length; i += 1) {
            if (this.missions[i].playable) {
                this.playableMissions.push(this.missions[i]);
            }
        }

        this.playableMissions.sort(function (a, b) {
            return self.getMissionNumber(a) - self.getMissionNumber(b);
        });

        this.spawnUtilityMarkers();
        this.spawnMissionMarkers();
    };

    GTA.RialoneMissionManager.prototype.spawnMissionMarkers = function () {
        var mission,
            position,
            marker,
            missionNumber;

        if (this.activeMission !== null) {
            return;
        }

        this.clearMissionMarkers();
        mission = this.getNextMission();

        if (mission === null) {
            this.state.currentObjective = "All current missions complete";
            return;
        }

        missionNumber = this.getMissionNumber(mission);
        position = this.findMissionMarkerPosition(mission, missionNumber);
        marker = this.createMarker("mission", mission.symbol, position, MINT, mission);
        marker.anchorBlock = this.worldToBlock(position.x, position.y);
        this.missionAnchorBlocks[mission.id] = marker.anchorBlock;
        this.worldMarkers.push(marker);
        this.state.currentObjective = "Find Mission " + missionNumber + ": " + mission.title;
    };

    GTA.RialoneMissionManager.prototype.spawnUtilityMarkers = function () {
        this.worldMarkers.push(this.createMarker("safehouse", "SAVE", this.findCityMarkerPosition({ x: -6, y: 7 }, 8), CREAM, null));
        this.worldMarkers.push(this.createMarker("garage", "GAR", this.findCityMarkerPosition({ x: 10, y: -8 }, 9), "#ffd36f", null));
    };

    GTA.RialoneMissionManager.prototype.getMissionNumber = function (mission) {
        var match = mission.id.match(/^M(\d+)/);

        return match !== null ? parseInt(match[1], 10) : 9999;
    };

    GTA.RialoneMissionManager.prototype.getNextMission = function () {
        var i,
            mission;

        for (i = 0; i < this.playableMissions.length; i += 1) {
            mission = this.playableMissions[i];

            if (!this.state.completedMissions[mission.id]) {
                return mission;
            }
        }

        return null;
    };

    GTA.RialoneMissionManager.prototype.clearMissionMarkers = function () {
        var i,
            marker;

        for (i = this.worldMarkers.length - 1; i >= 0; i -= 1) {
            marker = this.worldMarkers[i];

            if (marker.type !== "mission") {
                continue;
            }

            this.game.scene.remove(marker.mesh);
            this.worldMarkers.splice(i, 1);
        }

        this.activeMissionMarker = null;
    };

    GTA.RialoneMissionManager.prototype.hashText = function (text) {
        var hash = 2166136261,
            i;

        for (i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }

        return Math.abs(hash);
    };

    GTA.RialoneMissionManager.prototype.blockDistance = function (a, b) {
        var dx = a.x - b.x,
            dy = a.y - b.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    GTA.RialoneMissionManager.prototype.isFarFromWorldMarkers = function (block, minDistance) {
        var i,
            marker,
            markerBlock;

        for (i = 0; i < this.worldMarkers.length; i += 1) {
            marker = this.worldMarkers[i];
            markerBlock = this.worldToBlock(marker.mesh.position.x, marker.mesh.position.y);

            if (this.blockDistance(block, markerBlock) < minDistance) {
                return false;
            }
        }

        return true;
    };

    GTA.RialoneMissionManager.prototype.isFarFromMissionAnchors = function (block, minDistance) {
        var id;

        for (id in this.missionAnchorBlocks) {
            if (this.missionAnchorBlocks.hasOwnProperty(id) &&
                    this.blockDistance(block, this.missionAnchorBlocks[id]) < minDistance) {
                return false;
            }
        }

        return true;
    };

    GTA.RialoneMissionManager.prototype.getOriginBlock = function () {
        if (this.originBlock === null) {
            this.originBlock = this.worldToBlock(this.game.player.position.x, this.game.player.position.y);
        }

        return {
            x: this.originBlock.x,
            y: this.originBlock.y
        };
    };

    GTA.RialoneMissionManager.prototype.getMarkerBlockType = function (blockX, blockY) {
        var column,
            block;

        if (this.game.map.base[blockX] === undefined || this.game.map.base[blockX][blockY] === undefined) {
            return 0;
        }

        column = this.game.map.base[blockX][blockY];
        block = column.blocks[2] || column.blocks[column.blocks.length - 1];

        return block !== undefined ? block.type : 0;
    };

    GTA.RialoneMissionManager.prototype.isMarkerBlock = function (blockX, blockY) {
        var type = this.getMarkerBlockType(blockX, blockY);

        return type === 2 || type === 3 || type === 4;
    };

    GTA.RialoneMissionManager.prototype.findNearestMarkerBlock = function (blockX, blockY, index) {
        var radius,
            dx,
            dy,
            candidate,
            fallback = {
                x: Math.max(1, Math.min(254, blockX)),
                y: Math.max(1, Math.min(254, blockY))
            };

        for (radius = 0; radius < 9; radius += 1) {
            for (dx = -radius; dx <= radius; dx += 1) {
                for (dy = -radius; dy <= radius; dy += 1) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                        continue;
                    }

                    candidate = {
                        x: Math.max(1, Math.min(254, blockX + dx)),
                        y: Math.max(1, Math.min(254, blockY + dy))
                    };

                    if (this.isMarkerBlock(candidate.x, candidate.y) && ((candidate.x + candidate.y + index) % 2 === 0 || radius > 3)) {
                        return candidate;
                    }
                }
            }
        }

        return fallback;
    };

    GTA.RialoneMissionManager.prototype.markerPositionFromBlock = function (block, index, z) {
        var nudge = ((index % 3) - 1) * 10;

        return {
            x: (block.x * 64) + nudge,
            y: -(block.y * 64) - nudge,
            z: z || 166
        };
    };

    GTA.RialoneMissionManager.prototype.findCityMarkerPosition = function (offset, index, z) {
        var origin = this.getOriginBlock(),
            block = this.findNearestMarkerBlock(origin.x + offset.x, origin.y + offset.y, index);

        return this.markerPositionFromBlock(block, index, z);
    };

    GTA.RialoneMissionManager.prototype.findMissionMarkerPosition = function (mission, index, z) {
        var existing = this.missionAnchorBlocks[mission.id],
            origin = this.getOriginBlock(),
            seed = this.hashText(mission.id + mission.title),
            attempt,
            angle,
            radius,
            block,
            fallback = null;

        if (existing !== undefined) {
            return this.markerPositionFromBlock(existing, index, z);
        }

        for (attempt = 0; attempt < 96; attempt += 1) {
            angle = ((seed % 6283) / 1000) + (attempt * 2.39996323);
            radius = 20 + ((seed + attempt * 13 + index * 7) % 28);
            block = this.findNearestMarkerBlock(
                origin.x + Math.round(Math.cos(angle) * radius),
                origin.y + Math.round(Math.sin(angle) * radius),
                index + attempt
            );

            if (fallback === null) {
                fallback = block;
            }

            if (this.isFarFromWorldMarkers(block, 15) && this.isFarFromMissionAnchors(block, 19)) {
                return this.markerPositionFromBlock(block, index, z);
            }
        }

        return this.markerPositionFromBlock(fallback || origin, index, z);
    };

    GTA.RialoneMissionManager.prototype.findStageMarkerPosition = function (offset, index, z) {
        var anchor = this.activeMissionAnchorBlock || this.getOriginBlock(),
            block = this.findNearestMarkerBlock(anchor.x + offset.x, anchor.y + offset.y, index);

        return this.markerPositionFromBlock(block, index, z);
    };

    GTA.RialoneMissionManager.prototype.findWorldMarkerPosition = function (type) {
        var i,
            marker;

        for (i = 0; i < this.worldMarkers.length; i += 1) {
            marker = this.worldMarkers[i];

            if (marker.type === type) {
                return {
                    x: marker.mesh.position.x,
                    y: marker.mesh.position.y,
                    z: marker.baseZ
                };
            }
        }

        return null;
    };

    GTA.RialoneMissionManager.prototype.getStageCityOffset = function (kind, index) {
        var offsets = {
            travel: [
                { x: 14, y: 11 },
                { x: -16, y: -10 },
                { x: 19, y: -14 },
                { x: -21, y: 17 }
            ],
            fight: [
                { x: 15, y: -8 },
                { x: -18, y: 12 },
                { x: 22, y: 11 },
                { x: -24, y: -13 }
            ],
            defense: [
                { x: 13, y: -18 },
                { x: -15, y: 19 },
                { x: 21, y: 7 }
            ],
            checkpoint: [
                { x: 12, y: -10 },
                { x: 20, y: 8 },
                { x: -16, y: 18 },
                { x: -24, y: -7 },
                { x: 7, y: -23 }
            ]
        };

        if (offsets[kind] === undefined) {
            return { x: 4, y: 4 };
        }

        return offsets[kind][index % offsets[kind].length];
    };

    GTA.RialoneMissionManager.prototype.findMarkerPosition = function (offset, index) {
        var x = this.game.player.position.x + offset.x,
            y = this.game.player.position.y + offset.y,
            block = this.worldToBlock(x, y),
            nudge = ((index % 3) - 1) * 10;

        return {
            x: (block.x * 64) + nudge,
            y: -(block.y * 64) - nudge,
            z: 166
        };
    };

    GTA.RialoneMissionManager.prototype.createMarker = function (type, label, position, color, mission) {
        var canvas = this.createMarkerCanvas(label, color),
            mesh = this.createCanvasMesh(canvas, type === "mission" ? 64 : 72, type === "mission" ? 64 : 72);

        mesh.position.set(position.x, position.y, position.z);
        this.game.scene.add(mesh);

        return {
            type: type,
            label: label,
            mesh: mesh,
            baseZ: position.z,
            radius: type === "mission" ? 86 : 92,
            mission: mission,
            color: color
        };
    };

    GTA.RialoneMissionManager.prototype.createMarkerCanvas = function (label, color) {
        var canvas = document.createElement("canvas"),
            ctx;

        canvas.width = 128;
        canvas.height = 128;
        ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = "rgba(1,1,1,.65)";
        ctx.beginPath();
        ctx.arc(64, 64, 47, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(64, 64, 49, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.font = label.length > 3 ? "bold 24px Arial" : "bold 34px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 64, 65);

        return canvas;
    };

    GTA.RialoneMissionManager.prototype.createCanvasMesh = function (canvas, width, height) {
        var texture = new THREE.Texture(canvas),
            material,
            mesh;

        texture.needsUpdate = true;
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            color: 0xffffff
        });
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material);
        mesh.doubleSided = true;

        return mesh;
    };

    GTA.RialoneMissionManager.prototype.update = function (delta) {
        var i,
            marker,
            dx,
            dy,
            distance;

        this.time += delta;

        if (this.restarting) {
            return;
        }

        for (i = 0; i < this.worldMarkers.length; i += 1) {
            marker = this.worldMarkers[i];
            marker.mesh.position.z = marker.baseZ + Math.sin(this.time * 3 + i) * 8;
            marker.mesh.scale.x = 1 + Math.sin(this.time * 4 + i) * 0.05;
            marker.mesh.scale.y = marker.mesh.scale.x;

            dx = marker.mesh.position.x - this.game.player.position.x;
            dy = marker.mesh.position.y - this.game.player.position.y;
            distance = Math.sqrt((dx * dx) + (dy * dy));

            if (marker.mesh.visible !== false && distance <= marker.radius) {
                if (marker.type === "mission") {
                    if (this.activeMission === null) {
                        this.startMission(marker.mission, marker);
                    }
                } else if (marker.type === "safehouse") {
                    this.enterSafehouse();
                } else if (marker.type === "garage") {
                    this.enterGarage();
                }
            }
        }

        if (this.activeMission !== null) {
            this.updateActiveMission(delta);
        }
    };

    GTA.RialoneMissionManager.prototype.startMission = function (mission, marker) {
        if (mission === null || mission === undefined) {
            return;
        }

        if (marker !== undefined && marker !== null) {
            marker.mesh.visible = false;
            this.activeMissionAnchorBlock = marker.anchorBlock || this.worldToBlock(marker.mesh.position.x, marker.mesh.position.y);
            this.activeMissionMarker = marker;
        } else if (this.activeMissionAnchorBlock === null) {
            this.activeMissionAnchorBlock = this.getOriginBlock();
            this.activeMissionMarker = null;
        }

        this.activeMission = mission;
        this.stageIndex = -1;
        this.missionEnemies = [];
        this.ui.showSplash(mission.title, mission.district + " | " + mission.missionType);
        this.ui.showToast("Mission started: " + mission.title);
        this.nextStage();
    };

    GTA.RialoneMissionManager.prototype.getMissionStages = function (mission) {
        var commonStart = {
            type: "travel",
            label: mission.objectives[0],
            offset: { x: 160, y: 120 }
        };

        if (mission.id === "M01_OMNI_START") {
            return [
                commonStart,
                { type: "fight", label: "Defeat the wallet-drain gang", enemies: 2 },
                { type: "travel", label: "Escape to the safehouse", offset: { x: -190, y: -150 }, safehouse: true }
            ];
        }

        if (mission.id === "M02_MULTI_BOROUGH") {
            return [
                { type: "checkpoint", label: "Pass five network gates", checkpoints: 5, time: 75 },
                { type: "fight", label: "Clear the toll gang", enemies: 2 },
                { type: "travel", label: "Deliver the identity pass", offset: { x: 220, y: -180 } }
            ];
        }

        if (mission.id === "M03_GASLESS_ESCAPE") {
            return [
                { type: "fight", label: "Rescue your friend from the ambush", enemies: 3 },
                { type: "checkpoint", label: "Escape the heat", checkpoints: 3, time: 55, wanted: 2 },
                { type: "travel", label: "Reach the hideout", offset: { x: -260, y: 260 } }
            ];
        }

        if (mission.id === "M04_SOCIAL_PASS") {
            return [
                { type: "travel", label: "Reach the first login booth", offset: { x: 180, y: -220 } },
                { type: "fight", label: "Fight off the scammers", enemies: 3 },
                { type: "travel", label: "Escort the civilians to onboarding", offset: { x: -220, y: 140 } }
            ];
        }

        if (mission.id === "M05_2FA_FIRE") {
            return [
                { type: "travel", label: "Reach the 2FA tower", offset: { x: 260, y: 220 } },
                { type: "defense", label: "Protect the tower until 2FA goes live", duration: 28, waveSize: 2 },
                { type: "fight", label: "Drop the SIM swap crew", enemies: 3 }
            ];
        }

        return [commonStart];
    };

    GTA.RialoneMissionManager.prototype.nextStage = function () {
        var stages = this.getMissionStages(this.activeMission),
            position;

        this.clearObjectiveMarker();
        this.stageIndex += 1;
        this.stage = stages[this.stageIndex];
        this.stageTimer = 0;
        this.stageSpawnTimer = 0;

        if (this.stage === undefined) {
            this.completeMission();
            return;
        }

        if (this.stage.type === "travel") {
            position = this.stage.safehouse === true ? this.findWorldMarkerPosition("safehouse") : null;

            if (position === null) {
                position = this.findStageMarkerPosition(this.getStageCityOffset("travel", this.stageIndex), this.stageIndex + 12);
            }

            this.objectiveMarker = this.createMarker("objective", "GO", position, "#ffe56a", null);
        } else if (this.stage.type === "fight") {
            position = this.findStageMarkerPosition(this.getStageCityOffset("fight", this.stageIndex), this.stageIndex + 14);
            this.stage.fightPosition = position;
            this.stage.enemiesSpawned = false;
            this.objectiveMarker = this.createMarker("objective", "F", position, "#ff5f5f", null);
        } else if (this.stage.type === "checkpoint") {
            this.stage.remaining = this.stage.time || 60;
            this.stage.current = 0;

            if (this.stage.wanted) {
                this.wanted.setLevel(this.stage.wanted);
                this.wanted.lastCrimeAt = Date.now();
            }

            this.spawnCheckpointMarker();
        } else if (this.stage.type === "defense") {
            this.stage.remaining = this.stage.duration || 20;
            this.stageSpawnTimer = 0.3;
            position = this.findStageMarkerPosition(this.getStageCityOffset("defense", this.stageIndex), this.stageIndex + 17);
            this.objectiveMarker = this.createMarker("objective", "DEF", position, "#ffe56a", null);
        }

        this.state.currentObjective = this.stage.label;
        this.ui.showToast(this.stage.label);
    };

    GTA.RialoneMissionManager.prototype.updateActiveMission = function (delta) {
        var position;

        if (this.stage.type === "travel") {
            if (this.isNearObjective()) {
                this.nextStage();
            }
            return;
        }

        if (this.stage.type === "fight") {
            if (this.stage.enemiesSpawned !== true) {
                if (this.isNearObjective()) {
                    position = this.stage.fightPosition || {
                        x: this.game.player.position.x,
                        y: this.game.player.position.y,
                        z: 166
                    };
                    this.stage.enemiesSpawned = true;
                    this.clearObjectiveMarker();
                    this.spawnHostileGroup(this.activeMission.enemies[0] || "Street Enemy", this.stage.enemies || 2, {
                        health: 90,
                        bossHealth: 140,
                        position: position,
                        boss: true
                    });
                    this.state.currentObjective = this.stage.label + " | Defeat all targets";
                    this.ui.showToast("Boss group arrived");
                }

                return;
            }

            this.resolveDefeatedEnemies();
            this.setNextMissionTarget();

            if (this.getLivingMissionEnemies() === 0) {
                this.nextStage();
            }
            return;
        }

        if (this.stage.type === "checkpoint") {
            this.stage.remaining -= delta;
            this.state.currentObjective = this.stage.label + " | Gate " + (this.stage.current + 1) + "/" + this.stage.checkpoints +
                " | " + Math.max(0, Math.ceil(this.stage.remaining)) + "s";

            if (this.stage.remaining <= 0) {
                this.failMission("Timer expired");
                return;
            }

            if (this.isNearObjective()) {
                this.stage.current += 1;

                if (this.stage.current >= this.stage.checkpoints) {
                    this.nextStage();
                } else {
                    this.spawnCheckpointMarker();
                }
            }
            return;
        }

        if (this.stage.type === "defense") {
            this.stage.remaining -= delta;
            this.stageSpawnTimer -= delta;
            this.state.currentObjective = this.stage.label + " | " + Math.max(0, Math.ceil(this.stage.remaining)) + "s";

            if (this.stageSpawnTimer <= 0 && this.stage.remaining > 0) {
                this.stageSpawnTimer = 7;
                this.spawnHostileGroup(this.activeMission.enemies[0] || "Raider", this.stage.waveSize || 2, {
                    health: 70,
                    position: this.objectiveMarker !== null ? this.objectiveMarker.mesh.position : null,
                    guard: true
                });
            }

            this.resolveDefeatedEnemies();

            if (this.stage.remaining <= 0 && this.getLivingMissionEnemies() === 0) {
                this.nextStage();
            }
        }
    };

    GTA.RialoneMissionManager.prototype.spawnCheckpointMarker = function () {
        var offset = this.getStageCityOffset("checkpoint", this.stage.current);

        this.clearObjectiveMarker();
        this.objectiveMarker = this.createMarker("objective", "G" + (this.stage.current + 1), this.findStageMarkerPosition(offset, this.stage.current + 20), "#ffe56a", null);
    };

    GTA.RialoneMissionManager.prototype.findHostileSpawnPosition = function (center, index) {
        var manager = this.game.npcManager,
            anchor = manager !== undefined && manager.worldToBlock !== undefined ?
                manager.worldToBlock(center.x, center.y) : this.worldToBlock(center.x, center.y),
            rings,
            step,
            angle,
            block,
            roadKey,
            direction;

        if (manager !== undefined && manager.getColumnType !== undefined) {
            for (rings = 2; rings < 9; rings += 1) {
                for (step = 0; step < 12; step += 1) {
                    angle = ((Math.PI * 2) / 12) * (step + index * 0.33);
                    block = {
                        x: Math.max(1, Math.min(254, anchor.x + Math.round(Math.cos(angle) * rings))),
                        y: Math.max(1, Math.min(254, anchor.y + Math.round(Math.sin(angle) * rings)))
                    };

                    if (manager.getColumnType(block.x, block.y) !== 3 || !manager.isRoadsidePavement(block.x, block.y)) {
                        continue;
                    }

                    roadKey = manager.roadKeyForSidewalk(block.x, block.y);

                    if (roadKey === null) {
                        continue;
                    }

                    direction = manager.choosePavementDirection(block.x, block.y, index);

                    return {
                        block: block,
                        direction: direction,
                        roadKey: roadKey,
                        world: manager.blockToWorld(block.x, block.y)
                    };
                }
            }
        }

        angle = ((Math.PI * 2) / 5) * index;
        block = {
            x: Math.max(1, Math.min(254, anchor.x + Math.round(Math.cos(angle) * 3))),
            y: Math.max(1, Math.min(254, anchor.y + Math.round(Math.sin(angle) * 3)))
        };

        return {
            block: block,
            direction: { x: 1, y: 0 },
            roadKey: manager !== undefined && manager.roadKeyForSidewalk !== undefined ?
                manager.roadKeyForSidewalk(block.x, block.y) : null,
            world: {
                x: block.x * 64,
                y: -(block.y * 64)
            }
        };
    };

    GTA.RialoneMissionManager.prototype.isNearObjective = function () {
        var marker = this.objectiveMarker,
            dx,
            dy,
            distance;

        if (marker === null) {
            return false;
        }

        dx = marker.mesh.position.x - this.game.player.position.x;
        dy = marker.mesh.position.y - this.game.player.position.y;
        distance = Math.sqrt((dx * dx) + (dy * dy));

        return distance <= marker.radius;
    };

    GTA.RialoneMissionManager.prototype.spawnHostileGroup = function (label, count, options) {
        var manager = this.game.npcManager,
            offset = this.game.spriteNumbers.offset.PED,
            i,
            sprite,
            angle,
            distance,
            block,
            roadKey,
            walker,
            color,
            center,
            spawn,
            direction,
            firstMissionEnemy = null;

        if (manager === undefined || manager.cloneTintedMesh === undefined) {
            return;
        }

        options = options || {};
        color = options.police ? 0xa9ddd3 : 0xff5f5f;
        center = options.position || {
            x: this.game.player.position.x,
            y: this.game.player.position.y
        };

        for (i = 0; i < count; i += 1) {
            angle = (Math.PI * 2 * i) / Math.max(1, count);
            distance = 150 + (i % 3) * 36;
            spawn = this.findHostileSpawnPosition(center, i);
            sprite = manager.cloneTintedMesh(this.game.sprites[offset].sprite, color);
            sprite.position.set(
                spawn.world.x + Math.cos(angle) * Math.min(28, distance * 0.12),
                spawn.world.y + Math.sin(angle) * Math.min(28, distance * 0.12),
                142
            );
            this.game.scene.add(sprite);
            block = spawn.block || manager.worldToBlock(sprite.position.x, sprite.position.y);
            roadKey = spawn.roadKey || manager.roadKeyForSidewalk(block.x, block.y);
            direction = spawn.direction || manager.choosePavementDirection(block.x, block.y, i);
            walker = {
                sprite: sprite,
                animator: new GTA.SpriteAnimation(this.game, offset, sprite),
                animationBase: offset,
                animationFrame: 0,
                animationClock: 0,
                block: block,
                direction: direction,
                targetBlock: { x: block.x + direction.x, y: block.y + direction.y },
                mode: "walk",
                waitTimer: 0,
                pauseTimer: options.police ? 0 : 0.35 + (i * 0.12),
                crossing: null,
                roadKey: roadKey,
                speed: 34,
                hostile: true,
                isPolice: options.police === true,
                enemyLabel: options.police ? "Compliance Patrol" : (options.boss && i === 0 ? label + " Boss" : label),
                aiMode: options.police ? "chase" : (options.guard ? "guard" : "chase")
            };
            walker.combat = {
                maxHealth: options.boss && i === 0 ? (options.bossHealth || 130) : (options.health || 90),
                health: options.boss && i === 0 ? (options.bossHealth || 130) : (options.health || 90),
                hitTimer: 0,
                downTimer: 0,
                knockbackX: 0,
                knockbackY: 0
            };
            manager.walkers.push(walker);

            if (!options.police) {
                this.missionEnemies.push(walker);

                if (firstMissionEnemy === null) {
                    firstMissionEnemy = walker;
                }
            }
        }

        if (firstMissionEnemy !== null) {
            this.setNextMissionTarget();
        }
    };

    GTA.RialoneMissionManager.prototype.resolveDefeatedEnemies = function () {
        var i,
            enemy,
            state;

        for (i = 0; i < this.missionEnemies.length; i += 1) {
            enemy = this.missionEnemies[i];
            state = enemy.combat;

            if (enemy.resolved || state === undefined || state.health > 0) {
                continue;
            }

            enemy.resolved = true;
            enemy.hostile = false;
            enemy.sprite.visible = false;
        }
    };

    GTA.RialoneMissionManager.prototype.setNextMissionTarget = function () {
        var combat = this.game.combat,
            i,
            enemy;

        if (combat === undefined || combat.getActiveTarget === undefined || combat.setActiveTarget === undefined) {
            return;
        }

        if (combat.getActiveTarget() !== null) {
            return;
        }

        for (i = 0; i < this.missionEnemies.length; i += 1) {
            enemy = this.missionEnemies[i];

            if (!enemy.resolved && enemy.combat !== undefined && enemy.combat.health > 0) {
                combat.setActiveTarget(enemy);
                return;
            }
        }
    };

    GTA.RialoneMissionManager.prototype.clearMissionEnemies = function () {
        var manager = this.game.npcManager,
            i,
            enemy,
            index;

        for (i = 0; i < this.missionEnemies.length; i += 1) {
            enemy = this.missionEnemies[i];
            enemy.resolved = true;
            enemy.hostile = false;

            if (enemy.sprite !== undefined) {
                enemy.sprite.visible = false;
                this.game.scene.remove(enemy.sprite);
            }

            if (manager !== undefined && manager.walkers !== undefined) {
                index = manager.walkers.indexOf(enemy);

                if (index >= 0) {
                    manager.walkers.splice(index, 1);
                }
            }
        }

        this.missionEnemies = [];
    };

    GTA.RialoneMissionManager.prototype.getLivingMissionEnemies = function () {
        var count = 0,
            i,
            enemy;

        for (i = 0; i < this.missionEnemies.length; i += 1) {
            enemy = this.missionEnemies[i];

            if (!enemy.resolved && enemy.combat !== undefined && enemy.combat.health > 0) {
                count += 1;
            }
        }

        return count;
    };

    GTA.RialoneMissionManager.prototype.completeMission = function () {
        var mission = this.activeMission;

        this.clearObjectiveMarker();
        this.clearMissionEnemies();
        this.state.addRewards(mission);
        this.wanted.setLevel(0);
        this.ui.showSplash("Mission Complete", "+$" + mission.rewardMoney + " | +" + mission.rewardReputation + " REP");
        this.ui.showToast("Rialo Influence +" + mission.rewardInfluence);
        this.saveSystem.save(this.game.player);
        this.activeMission = null;
        this.activeMissionAnchorBlock = null;
        this.activeMissionMarker = null;
        this.stage = null;
        this.stageIndex = -1;
        this.spawnMissionMarkers();
    };

    GTA.RialoneMissionManager.prototype.failMission = function (reason) {
        if (this.activeMission === null) {
            return;
        }

        this.clearObjectiveMarker();
        this.clearMissionEnemies();
        this.wanted.setLevel(Math.max(this.state.wantedLevel, this.activeMission.wantedLevelOnFail || 1));
        this.ui.showSplash("Mission Failed", reason);
        this.state.currentObjective = "Regroup at a safehouse";
        this.activeMission = null;
        this.activeMissionAnchorBlock = null;
        this.activeMissionMarker = null;
        this.stage = null;
        this.stageIndex = -1;
        this.spawnMissionMarkers();
    };

    GTA.RialoneMissionManager.prototype.restartActiveMission = function (reason) {
        var mission = this.activeMission,
            self = this;

        if (mission === null) {
            return false;
        }

        this.restarting = true;
        this.clearObjectiveMarker();
        this.clearMissionEnemies();
        this.activeMission = null;
        this.stage = null;
        this.stageIndex = -1;
        this.stageTimer = 0;
        this.stageSpawnTimer = 0;
        this.state.health = 100;
        this.state.armor = 0;
        this.wanted.setLevel(0);
        this.state.currentObjective = "Restarting " + mission.title;
        this.ui.showSplash("Wasted", reason || "Restarting mission");

        window.clearTimeout(this.restartTimer);
        this.restartTimer = window.setTimeout(function () {
            self.restarting = false;
            self.startMission(mission, null);
        }, 1300);

        return true;
    };

    GTA.RialoneMissionManager.prototype.enterSafehouse = function () {
        var self = this;

        if (Date.now() < this.utilityCooldownUntil) {
            return;
        }

        this.utilityCooldownUntil = Date.now() + 2500;
        this.state.health = 100;
        this.state.armor = Math.max(this.state.armor, 25);
        this.state.currentObjective = "Saved at safehouse";

        if (this.saveSystem.save(this.game.player)) {
            this.ui.showSplash("Saved", "Safehouse progress stored");
            this.ui.showToast("Safehouse saved | health restored");

            if (this.activeMission !== null && this.stage !== null && this.stage.safehouse === true &&
                    this.stage.safehouseSaved !== true) {
                this.stage.safehouseSaved = true;
                window.setTimeout(function () {
                    if (self.activeMission !== null && self.stage !== null && self.stage.safehouseSaved === true) {
                        self.nextStage();
                    }
                }, 850);
            }
        } else {
            this.ui.showSplash("Save Failed", "Browser storage blocked");
            this.ui.showToast("Save failed | browser storage blocked");
        }
    };

    GTA.RialoneMissionManager.prototype.enterGarage = function () {
        if (Date.now() < this.utilityCooldownUntil) {
            return;
        }

        this.utilityCooldownUntil = Date.now() + 2500;

        if (this.game.player.vehicle !== null && this.state.savedCars.length < 6) {
            this.state.savedCars.push({
                type: this.game.player.vehicle.type,
                savedAt: Date.now()
            });
            this.state.vehicleCondition = 100;

            if (this.saveSystem.save(this.game.player)) {
                this.ui.showToast("Garage stored car | upgrade bay ready");
            } else {
                this.ui.showToast("Car stored | save failed");
            }
        } else {
            this.ui.showToast("Bring a car here to store it");
        }
    };

    GTA.RialoneMissionManager.prototype.clearObjectiveMarker = function () {
        if (this.objectiveMarker !== null) {
            this.game.scene.remove(this.objectiveMarker.mesh);
            this.objectiveMarker = null;
        }
    };

    GTA.RialoneMissionManager.prototype.worldToBlock = function (worldX, worldY) {
        return {
            x: Math.max(1, Math.min(254, Math.round(worldX / 64))),
            y: Math.max(1, Math.min(254, Math.round(-worldY / 64)))
        };
    };

    GTA.RialoneDayNightCycle = function () {
        this.time = 8;
        this.nightOpacity = 0;
    };

    GTA.RialoneDayNightCycle.prototype.update = function (delta) {
        var normalized;

        this.time += delta * 0.08;

        if (this.time >= 24) {
            this.time -= 24;
        }

        normalized = Math.abs(12 - this.time) / 12;
        this.nightOpacity = Math.max(0, Math.min(0.46, (normalized - 0.42) * 0.8));
    };

    GTA.RialoneOpenWorld = function (game) {
        this.game = game;
        this.state = new GTA.RialoneGameState();
        this.saveSystem = new GTA.RialoneSaveSystem(this.state);
        this.ui = new GTA.RialoneUIManager(game, this.state);
        this.wanted = new GTA.RialoneWantedSystem(game, this.state, this.ui);
        this.enemyAI = new GTA.RialoneEnemyAI(game, this.state);
        this.dayNight = new GTA.RialoneDayNightCycle();
        this.missions = new GTA.RialoneMissionManager(game, this.state, this.ui, this.wanted, this.saveSystem);
    };

    GTA.RialoneOpenWorld.prototype.applySavedPlayerPosition = function () {
        var position = this.state.playerPosition,
            player = this.game.player;

        if (position === null || player === undefined || player.physics === undefined) {
            return;
        }

        player.movePedestrian(position.x, position.y, 0);
        player.position.z = position.z || player.position.z;

        if (player.physics.SetPosition !== undefined) {
            player.physics.SetPosition(new Box2D.Common.Math.b2Vec2(position.x / GTA.PhysicsScale, -position.y / GTA.PhysicsScale));
        }

        if (player.physics.SetLinearVelocity !== undefined) {
            player.physics.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(0, 0));
        }
    };

    GTA.RialoneOpenWorld.prototype.start = function () {
        var loaded = this.saveSystem.load();

        this.applySavedPlayerPosition();
        this.ui.start();
        this.missions.start();
        this.game.wanted = this.wanted;
        this.game.enemyAI = this.enemyAI;
        this.ui.showToast(loaded ? "Save loaded" : "RialOne City story systems online");
    };

    GTA.RialoneOpenWorld.prototype.update = function (delta) {
        this.dayNight.update(delta);
        this.wanted.update(delta, this.missions);
        this.missions.update(delta);
        this.ui.update(delta, this.missions, this.dayNight);

        if (this.state.health <= 0) {
            if (this.missions.restartActiveMission("Mission restarting")) {
                return;
            }

            this.state.health = 100;
            this.state.armor = 0;
            this.state.money = Math.max(0, this.state.money - 250);
            this.state.currentObjective = "You got dropped. Regroup at a safehouse.";
            this.ui.showSplash("Wasted", "-$250 hospital bill");
            this.saveSystem.save(this.game.player);
        }
    };
}());
