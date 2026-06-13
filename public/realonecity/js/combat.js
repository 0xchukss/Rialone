/*
 * Lightweight combat layer for RialOne City.
 * This keeps fight behavior modular so larger city/combat repos can replace or extend it later.
 */

(function () {
    GTA.CombatSystem = function (game) {
        this.game = game;
        this.moves = {};
        this.lastAttackAt = 0;
        this.lastResultAt = 0;
        this.lastResult = null;
        this.playerAttackTimer = 0;
        this.bullets = [];
        this.impacts = [];
        this.activeTarget = null;
        this.registerMove("punch", {
            label: "Punch",
            range: 112,
            closeRange: 58,
            arc: 115,
            damage: 38,
            cooldown: 430,
            stun: 0.42,
            knockback: 52,
            recovery: 0.26
        });
        this.registerMove("shoot", {
            label: "Shot",
            range: 460,
            closeRange: 58,
            arc: 72,
            damage: 34,
            cooldown: 280,
            stun: 0.22,
            knockback: 28,
            recovery: 0.12
        });
    };

    GTA.CombatSystem.prototype.registerMove = function (id, config) {
        this.moves[id] = {
            label: config.label || id,
            range: config.range || 96,
            closeRange: config.closeRange || 52,
            arc: config.arc || 100,
            damage: config.damage || 25,
            cooldown: config.cooldown || 450,
            stun: config.stun || 0.4,
            knockback: config.knockback || 40,
            recovery: config.recovery || 0.25
        };
    };

    GTA.CombatSystem.prototype.getForwardVector = function () {
        var player = this.game.player,
            angle = player.physics !== undefined ? player.physics.GetAngle() : 0;

        return {
            x: Math.cos(angle),
            y: -Math.sin(angle)
        };
    };

    GTA.CombatSystem.prototype.ensureWalkerCombat = function (walker) {
        if (walker.combat === undefined) {
            walker.combat = {
                maxHealth: 100,
                health: 100,
                hitTimer: 0,
                downTimer: 0,
                knockbackX: 0,
                knockbackY: 0,
                barTimer: 0,
                healthBar: null
            };
        }

        if (walker.combat.maxHealth === undefined) {
            walker.combat.maxHealth = 100;
        }

        if (walker.combat.health === undefined) {
            walker.combat.health = walker.combat.maxHealth;
        }

        if (walker.combat.hitTimer === undefined) {
            walker.combat.hitTimer = 0;
        }

        if (walker.combat.downTimer === undefined) {
            walker.combat.downTimer = 0;
        }

        if (walker.combat.knockbackX === undefined) {
            walker.combat.knockbackX = 0;
        }

        if (walker.combat.knockbackY === undefined) {
            walker.combat.knockbackY = 0;
        }

        if (walker.combat.barTimer === undefined) {
            walker.combat.barTimer = 0;
        }

        if (walker.combat.healthBar === undefined) {
            walker.combat.healthBar = null;
        }

        return walker.combat;
    };

    GTA.CombatSystem.prototype.playerAttack = function (moveId) {
        var move = this.moves[moveId || "shoot"],
            now = Date.now(),
            target,
            state,
            origin,
            end,
            forward;

        if (move === undefined || this.game.player === undefined || this.game.player.vehicle !== null) {
            return null;
        }

        if (now - this.lastAttackAt < move.cooldown) {
            return null;
        }

        this.lastAttackAt = now;
        this.playerAttackTimer = move.recovery;
        target = this.findTarget(move);
        origin = this.getShotOrigin();

        if (target !== null && target.kind === "car") {
            end = this.getCarShotPoint(target.car);
            this.spawnBullet(origin, end, "player");
            this.spawnImpact(end, "player");
            state = this.applyCarHit(target.car);
            this.lastResult = {
                hit: true,
                label: move.label,
                health: state !== null ? state.health : 0
            };
            this.playShotSound();
        } else if (target !== null) {
            end = this.getWalkerShotPoint(target.walker);
            this.spawnBullet(origin, end, "player");
            this.spawnImpact(end, "player");
            state = this.applyHit(target.walker, move);
            this.lastResult = {
                hit: true,
                label: move.label,
                health: state.health
            };
            this.playShotSound();
        } else {
            forward = this.getForwardVector();
            end = {
                x: origin.x + forward.x * Math.min(move.range, 360),
                y: origin.y + forward.y * Math.min(move.range, 360),
                z: origin.z
            };
            end = this.clipShotToWall(origin, end);
            this.spawnBullet(origin, end, "player");
            this.lastResult = {
                hit: false,
                label: move.label,
                health: 0
            };
            this.playMissSound();
        }

        this.lastResultAt = now;

        return this.lastResult;
    };

    GTA.CombatSystem.prototype.getShotOrigin = function () {
        return {
            x: this.game.player.position.x,
            y: this.game.player.position.y,
            z: (this.game.player.position.z || 128) + 24
        };
    };

    GTA.CombatSystem.prototype.getWalkerShotPoint = function (walker) {
        return {
            x: walker.sprite.position.x,
            y: walker.sprite.position.y,
            z: walker.sprite.position.z + 18
        };
    };

    GTA.CombatSystem.prototype.getCarShotPoint = function (car) {
        return {
            x: car.object.sprite.position.x,
            y: car.object.sprite.position.y,
            z: car.object.sprite.position.z + 16
        };
    };

    GTA.CombatSystem.prototype.findTarget = function (move) {
        var npcManager = this.game.npcManager,
            player = this.game.player,
            forward = this.getForwardVector(),
            arcDot = Math.cos((move.arc * Math.PI / 180) / 2),
            nearest = null,
            nearestDistance = move.range,
            origin = this.getShotOrigin(),
            activeTarget = this.getActiveTarget(),
            activeTargetPoint,
            carTarget,
            i,
            walker,
            state,
            dx,
            dy,
            distance,
            dot;

        if (npcManager === undefined || npcManager.walkers === undefined) {
            return null;
        }

        if (activeTarget !== null) {
            activeTargetPoint = this.getWalkerShotPoint(activeTarget);
            dx = activeTargetPoint.x - player.position.x;
            dy = activeTargetPoint.y - player.position.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= move.range && distance > 0) {
                dot = ((dx / distance) * forward.x) + ((dy / distance) * forward.y);

                if ((dot >= arcDot || distance <= move.closeRange) &&
                        this.hasLineOfSight(origin, activeTargetPoint)) {
                    return {
                        kind: "walker",
                        walker: activeTarget,
                        distance: distance
                    };
                }
            }

            return null;
        }

        for (i = 0; i < npcManager.walkers.length; i += 1) {
            walker = npcManager.walkers[i];
            state = this.ensureWalkerCombat(walker);

            if (state.downTimer > 0 || walker.sprite === undefined || walker.sprite.visible === false) {
                continue;
            }

            dx = walker.sprite.position.x - player.position.x;
            dy = walker.sprite.position.y - player.position.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > move.range || distance <= 0) {
                continue;
            }

            dot = ((dx / distance) * forward.x) + ((dy / distance) * forward.y);

            if (dot < arcDot && distance > move.closeRange) {
                continue;
            }

            if (!this.hasLineOfSight(origin, this.getWalkerShotPoint(walker))) {
                continue;
            }

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = {
                    kind: "walker",
                    walker: walker,
                    distance: distance
                };
            }
        }

        carTarget = this.findCarTarget(move, origin, forward, arcDot, nearestDistance);

        if (carTarget !== null) {
            return carTarget;
        }

        return nearest;
    };

    GTA.CombatSystem.prototype.findCarTarget = function (move, origin, forward, arcDot, maxDistance) {
        var npcManager = this.game.npcManager,
            player = this.game.player,
            nearest = null,
            nearestDistance = maxDistance,
            i,
            car,
            point,
            dx,
            dy,
            distance,
            dot;

        if (npcManager === undefined || npcManager.cars === undefined) {
            return null;
        }

        for (i = 0; i < npcManager.cars.length; i += 1) {
            car = npcManager.cars[i];

            if (car.driverEvicted === true || car.object === undefined || car.object.sprite === undefined ||
                    car.object.sprite.visible === false) {
                continue;
            }

            point = this.getCarShotPoint(car);
            dx = point.x - player.position.x;
            dy = point.y - player.position.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > move.range || distance <= 0) {
                continue;
            }

            dot = ((dx / distance) * forward.x) + ((dy / distance) * forward.y);

            if (dot < arcDot && distance > move.closeRange) {
                continue;
            }

            if (!this.hasLineOfSight(origin, point)) {
                continue;
            }

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = {
                    kind: "car",
                    car: car,
                    distance: distance
                };
            }
        }

        return nearest;
    };

    GTA.CombatSystem.prototype.applyHit = function (walker, move) {
        var state = this.ensureWalkerCombat(walker),
            forward = this.getForwardVector();

        this.setActiveTarget(walker);
        state.health = Math.max(0, state.health - move.damage);
        state.hitTimer = move.stun;
        state.knockbackX = forward.x * move.knockback;
        state.knockbackY = forward.y * move.knockback;
        state.barTimer = 4.8;
        this.updateHealthBar(walker, 0);

        if (walker.sprite.material !== undefined) {
            walker.sprite.material.opacity = 0.72;
        }

        if (state.health <= 0) {
            state.downTimer = 1.8;
            state.dead = true;
            walker.mode = "down";
            this.awardKill(walker);
            this.clearActiveTarget(walker);
        }

        if (this.game.wanted !== undefined && walker.hostile !== true) {
            this.game.wanted.reportCrime(walker.isPolice ? "assault on patrol" : "street assault", walker.isPolice ? 2 : 1);
        }

        return state;
    };

    GTA.CombatSystem.prototype.applyCarHit = function (car) {
        var driver = null,
            state;

        if (this.game.npcManager !== undefined && this.game.npcManager.evictShotDriver !== undefined) {
            driver = this.game.npcManager.evictShotDriver(car);
        }

        if (driver === null) {
            return null;
        }

        driver.hostile = true;
        driver.aiMode = "duel";
        driver.enemyLabel = "Angry Driver";
        driver.speed = 28;
        state = this.ensureWalkerCombat(driver);
        state.maxHealth = 70;
        state.health = 70;
        state.barTimer = 5;
        this.setActiveTarget(driver);

        return state;
    };

    GTA.CombatSystem.prototype.update = function (delta) {
        var i,
            item,
            opacity;

        if (this.playerAttackTimer > 0) {
            this.playerAttackTimer = Math.max(0, this.playerAttackTimer - delta);
        }

        for (i = this.bullets.length - 1; i >= 0; i -= 1) {
            item = this.bullets[i];
            item.life -= delta;
            opacity = Math.max(0, item.life / item.maxLife);

            if (item.mesh.material !== undefined) {
                item.mesh.material.opacity = opacity;
            }

            if (item.life <= 0) {
                this.game.scene.remove(item.mesh);
                this.bullets.splice(i, 1);
            }
        }

        for (i = this.impacts.length - 1; i >= 0; i -= 1) {
            item = this.impacts[i];
            item.life -= delta;
            opacity = Math.max(0, item.life / item.maxLife);
            item.mesh.scale.x = 1 + (1 - opacity) * 1.4;
            item.mesh.scale.y = item.mesh.scale.x;

            if (item.mesh.material !== undefined) {
                item.mesh.material.opacity = opacity;
            }

            if (item.life <= 0) {
                this.game.scene.remove(item.mesh);
                this.impacts.splice(i, 1);
            }
        }
    };

    GTA.CombatSystem.prototype.updateWalkerState = function (walker, delta, index, time) {
        var state = this.ensureWalkerCombat(walker),
            fade;

        this.updateHealthBar(walker, delta);

        if (walker.resolved === true) {
            this.hideHealthBar(walker);
            walker.sprite.visible = false;
            return true;
        }

        if (state.downTimer > 0) {
            state.downTimer = Math.max(0, state.downTimer - delta);
            walker.sprite.position.z = 132;

            if (walker.sprite.material !== undefined) {
                fade = state.downTimer < 0.8 ? state.downTimer / 0.8 : 0.34;
                walker.sprite.material.opacity = Math.max(0, Math.min(0.34, fade));
            }

            if (state.downTimer <= 0) {
                if (state.dead === true) {
                    walker.resolved = true;
                    walker.hostile = false;
                    walker.sprite.visible = false;
                    this.hideHealthBar(walker);
                    return true;
                }

                state.health = state.maxHealth;
                state.hitTimer = 0;
                state.barTimer = 0;
                walker.mode = "walk";
                walker.sprite.visible = true;
                this.hideHealthBar(walker);

                if (walker.sprite.material !== undefined) {
                    walker.sprite.material.opacity = 1;
                }
            }

            return true;
        }

        if (state.hitTimer > 0) {
            state.hitTimer = Math.max(0, state.hitTimer - delta);
            walker.sprite.position.x += state.knockbackX * delta;
            walker.sprite.position.y += state.knockbackY * delta;
            walker.sprite.position.z = 146 + Math.sin((time + index) * 18) * 3;

            if (state.hitTimer <= 0 && walker.sprite.material !== undefined) {
                walker.sprite.material.opacity = 1;
            }

            return true;
        }

        return false;
    };

    GTA.CombatSystem.prototype.enemyAttack = function (walker, damage) {
        var state = this.game.openWorld !== undefined ? this.game.openWorld.state : null,
            origin,
            end;

        if (walker.sprite === undefined || this.game.player === undefined || !this.canWalkerEngage(walker)) {
            return false;
        }

        origin = this.getWalkerShotPoint(walker);
        end = this.getShotOrigin();

        if (!this.hasLineOfSight(origin, end)) {
            return false;
        }

        this.spawnBullet(origin, end, "enemy");
        this.spawnImpact(end, "enemy");

        if (state !== null) {
            if (state.armor > 0) {
                state.armor = Math.max(0, state.armor - damage);
            } else {
                state.health = Math.max(0, state.health - damage);
            }
        }

        this.playEnemyShotSound();
        return true;
    };

    GTA.CombatSystem.prototype.spawnBullet = function (from, to, owner) {
        var dx = to.x - from.x,
            dy = to.y - from.y,
            length = Math.max(28, Math.sqrt(dx * dx + dy * dy)),
            canvas = document.createElement("canvas"),
            ctx,
            texture,
            material,
            mesh,
            gradient;

        canvas.width = 128;
        canvas.height = 16;
        ctx = canvas.getContext("2d");
        gradient = ctx.createLinearGradient(0, 8, 128, 8);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.16, owner === "enemy" ? "rgba(255,95,95,.9)" : "rgba(169,221,211,.9)");
        gradient.addColorStop(1, "rgba(255,245,205,1)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(4, 8);
        ctx.lineTo(124, 8);
        ctx.stroke();
        ctx.strokeStyle = owner === "enemy" ? "rgba(255,95,95,.45)" : "rgba(169,221,211,.45)";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(18, 8);
        ctx.lineTo(124, 8);
        ctx.stroke();

        texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            color: 0xffffff
        });
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, 10, 1, 1), material);
        mesh.doubleSided = true;
        mesh.position.set((from.x + to.x) / 2, (from.y + to.y) / 2, Math.max(from.z || 150, to.z || 150));
        mesh.rotation.z = Math.atan2(dy, dx);
        this.game.scene.add(mesh);
        this.bullets.push({
            mesh: mesh,
            life: 0.14,
            maxLife: 0.14
        });
    };

    GTA.CombatSystem.prototype.spawnImpact = function (point, owner) {
        var canvas = document.createElement("canvas"),
            ctx,
            texture,
            material,
            mesh,
            color = owner === "enemy" ? "255,95,95" : "169,221,211";

        canvas.width = 64;
        canvas.height = 64;
        ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, 64, 64);
        ctx.fillStyle = "rgba(" + color + ",.35)";
        ctx.beginPath();
        ctx.arc(32, 32, 21, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,245,205,.95)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, 32);
        ctx.lineTo(44, 32);
        ctx.moveTo(32, 20);
        ctx.lineTo(32, 44);
        ctx.stroke();

        texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            color: 0xffffff
        });
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 28, 1, 1), material);
        mesh.doubleSided = true;
        mesh.position.set(point.x, point.y, (point.z || 150) + 3);
        this.game.scene.add(mesh);
        this.impacts.push({
            mesh: mesh,
            life: 0.22,
            maxLife: 0.22
        });
    };

    GTA.CombatSystem.prototype.ensureHealthBar = function (walker) {
        var state = this.ensureWalkerCombat(walker),
            canvas,
            texture,
            material,
            mesh;

        if ((state.healthBar !== null && state.healthBar !== undefined) || walker.sprite === undefined) {
            return state.healthBar;
        }

        canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 28;
        texture = new THREE.Texture(canvas);
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            color: 0xffffff
        });
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(13, 3, 1, 1), material);
        mesh.doubleSided = true;
        this.game.scene.add(mesh);

        state.healthBar = {
            canvas: canvas,
            ctx: canvas.getContext("2d"),
            texture: texture,
            mesh: mesh,
            lastPercent: -1,
            lastHit: -1
        };

        return state.healthBar;
    };

    GTA.CombatSystem.prototype.drawHealthBar = function (walker) {
        var state = this.ensureWalkerCombat(walker),
            bar = this.ensureHealthBar(walker),
            percent,
            ctx,
            fillWidth;

        if (bar === null) {
            return;
        }

        percent = Math.max(0, Math.min(1, state.health / state.maxHealth));

        if (percent === bar.lastPercent && state.hitTimer === bar.lastHit) {
            return;
        }

        bar.lastPercent = percent;
        bar.lastHit = state.hitTimer;
        ctx = bar.ctx;
        ctx.clearRect(0, 0, 128, 28);
        ctx.fillStyle = "rgba(1,1,1,.78)";
        ctx.fillRect(8, 7, 112, 14);
        ctx.strokeStyle = state.hitTimer > 0 ? "#fff5cd" : "#E8E4D9";
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 7, 112, 14);
        fillWidth = Math.max(0, Math.round(108 * percent));
        ctx.fillStyle = percent > 0.55 ? "#A9DDD3" : (percent > 0.25 ? "#ffd36f" : "#ff5f5f");
        ctx.fillRect(10, 9, fillWidth, 10);
        ctx.fillStyle = "rgba(255,255,255,.42)";
        ctx.fillRect(10, 9, fillWidth, 3);
        bar.texture.needsUpdate = true;
    };

    GTA.CombatSystem.prototype.updateHealthBar = function (walker, delta) {
        var state = this.ensureWalkerCombat(walker),
            bar,
            show = false;

        if (state.barTimer > 0) {
            state.barTimer = Math.max(0, state.barTimer - (delta || 0));
        }

        if (this.isActiveTarget(walker) && state.health > 0) {
            show = true;
        }

        if (!show || walker.sprite === undefined || walker.sprite.visible === false || state.health <= 0) {
            this.hideHealthBar(walker);
            return;
        }

        bar = this.ensureHealthBar(walker);

        if (bar === null) {
            return;
        }

        bar.mesh.visible = true;
        bar.mesh.position.set(walker.sprite.position.x, walker.sprite.position.y, walker.sprite.position.z + 28);
        this.drawHealthBar(walker);
    };

    GTA.CombatSystem.prototype.hideHealthBar = function (walker) {
        var state;

        if (walker.combat === undefined) {
            return;
        }

        state = walker.combat;

        if (state.healthBar !== undefined && state.healthBar !== null) {
            state.healthBar.mesh.visible = false;
        }
    };

    GTA.CombatSystem.prototype.getRecentResult = function () {
        if (this.lastResult === null || Date.now() - this.lastResultAt > 1200) {
            return null;
        }

        return this.lastResult;
    };

    GTA.CombatSystem.prototype.getActiveTarget = function () {
        if (this.isWalkerAlive(this.activeTarget)) {
            return this.activeTarget;
        }

        this.activeTarget = null;
        return null;
    };

    GTA.CombatSystem.prototype.isActiveTarget = function (walker) {
        return walker !== null && walker !== undefined && this.getActiveTarget() === walker;
    };

    GTA.CombatSystem.prototype.canWalkerEngage = function (walker) {
        return this.isActiveTarget(walker);
    };

    GTA.CombatSystem.prototype.setActiveTarget = function (walker) {
        var oldTarget = this.getActiveTarget(),
            state;

        if (oldTarget !== null && oldTarget !== walker) {
            this.hideHealthBar(oldTarget);
        }

        this.activeTarget = walker;
        walker.hostile = true;
        state = this.ensureWalkerCombat(walker);
        state.barTimer = 5;
        this.updateHealthBar(walker, 0);
    };

    GTA.CombatSystem.prototype.clearActiveTarget = function (walker) {
        if (this.activeTarget === walker) {
            this.hideHealthBar(walker);
            this.activeTarget = null;
        }
    };

    GTA.CombatSystem.prototype.isWalkerAlive = function (walker) {
        var state;

        if (walker === null || walker === undefined || walker.sprite === undefined ||
                walker.sprite.visible === false || walker.resolved === true) {
            return false;
        }

        state = this.ensureWalkerCombat(walker);
        return state.health > 0 && state.downTimer <= 0 && state.dead !== true;
    };

    GTA.CombatSystem.prototype.awardKill = function (walker) {
        var state = this.ensureWalkerCombat(walker);

        if (state.rewarded === true) {
            return;
        }

        state.rewarded = true;

        if (this.game.openWorld !== undefined && this.game.openWorld.state !== undefined) {
            this.game.openWorld.state.money += 100;
        }

        if (this.game.openWorld !== undefined && this.game.openWorld.ui !== undefined) {
            this.game.openWorld.ui.showToast("Target down +$100");
        }
    };

    GTA.CombatSystem.prototype.getWorldBlock = function (worldX, worldY) {
        if (this.game.npcManager !== undefined && this.game.npcManager.worldToBlock !== undefined) {
            return this.game.npcManager.worldToBlock(worldX, worldY);
        }

        return {
            x: Math.max(1, Math.min(254, Math.round(worldX / 64))),
            y: Math.max(1, Math.min(254, Math.round(-worldY / 64)))
        };
    };

    GTA.CombatSystem.prototype.getColumnType = function (worldX, worldY) {
        var manager = this.game.npcManager,
            block,
            column,
            mapBlock;

        block = this.getWorldBlock(worldX, worldY);

        if (manager !== undefined && manager.getColumnType !== undefined) {
            return manager.getColumnType(block.x, block.y);
        }

        if (this.game.map === undefined || this.game.map.base[block.x] === undefined ||
                this.game.map.base[block.x][block.y] === undefined) {
            return 0;
        }

        column = this.game.map.base[block.x][block.y];
        mapBlock = column.blocks[2] || column.blocks[column.blocks.length - 1];

        return mapBlock ? mapBlock.type : 0;
    };

    GTA.CombatSystem.prototype.canBulletPassColumn = function (columnType) {
        return columnType === 2 || columnType === 3;
    };

    GTA.CombatSystem.prototype.hasLineOfSight = function (from, to) {
        return this.clipShotToWall(from, to).blocked !== true;
    };

    GTA.CombatSystem.prototype.clipShotToWall = function (from, to) {
        var dx = to.x - from.x,
            dy = to.y - from.y,
            distance = Math.sqrt(dx * dx + dy * dy),
            steps = Math.max(2, Math.ceil(distance / 16)),
            i,
            t,
            point,
            previous = {
                x: from.x,
                y: from.y,
                z: from.z
            },
            startBlock = this.getWorldBlock(from.x, from.y),
            endBlock = this.getWorldBlock(to.x, to.y),
            pointBlock,
            columnType;

        for (i = 1; i < steps; i += 1) {
            t = i / steps;
            point = {
                x: from.x + dx * t,
                y: from.y + dy * t,
                z: from.z + ((to.z || from.z) - from.z) * t
            };
            pointBlock = this.getWorldBlock(point.x, point.y);

            if ((pointBlock.x === startBlock.x && pointBlock.y === startBlock.y) ||
                    (pointBlock.x === endBlock.x && pointBlock.y === endBlock.y)) {
                previous = point;
                continue;
            }

            columnType = this.getColumnType(point.x, point.y);

            if (!this.canBulletPassColumn(columnType)) {
                previous.blocked = true;
                return previous;
            }

            previous = point;
        }

        return to;
    };

    GTA.CombatSystem.prototype.playHitSound = function () {
        if (GTA.Audio !== undefined && GTA.Audio.tone !== undefined) {
            GTA.Audio.tone(150, 0.05, "square", 0.05, 95);
            window.setTimeout(function () {
                GTA.Audio.tone(310, 0.06, "triangle", 0.035, 180);
            }, 34);
        }
    };

    GTA.CombatSystem.prototype.playShotSound = function () {
        if (GTA.Audio !== undefined && GTA.Audio.tone !== undefined) {
            GTA.Audio.tone(620, 0.035, "square", 0.045, 120);
            window.setTimeout(function () {
                GTA.Audio.tone(180, 0.055, "triangle", 0.035, 120);
            }, 26);
        }
    };

    GTA.CombatSystem.prototype.playEnemyShotSound = function () {
        if (GTA.Audio !== undefined && GTA.Audio.tone !== undefined) {
            GTA.Audio.tone(420, 0.035, "square", 0.035, 130);
        }
    };

    GTA.CombatSystem.prototype.playMissSound = function () {
        if (GTA.Audio !== undefined && GTA.Audio.tone !== undefined) {
            GTA.Audio.tone(90, 0.045, "triangle", 0.025, 70);
        }
    };
}());
