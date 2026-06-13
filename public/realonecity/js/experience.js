/*
 * RialOne City experience layer: intro, menu, audio, and ambient NPCs.
 */

(function () {
    var musicPath = "assets/background-music.mp3",
        footstepPath = "assets/running-steps.mp3",
        crashPath = "assets/car-crash.mp3",
        drivingPath = "assets/car-driving.mp3";

    GTA.Audio = {
        context: null,
        music: null,
        footsteps: null,
        crash: null,
        driving: null,
        footstepsActive: false,
        drivingActive: false,
        audioMonitor: null,
        lastFootstep: 0,
        lastCrash: 0,
        unlocked: false,

        init: function () {
            if (this.music === null) {
                this.music = this.createAudio(musicPath, 0.10, true);
                this.footsteps = this.createAudio(footstepPath, 0.28, true);
                this.crash = this.createAudio(crashPath, 0.7, false);
                this.driving = this.createAudio(drivingPath, 0.68, true);
            }

            this.startLoopMonitor();
            this.attachUnlockListeners();
        },

        createAudio: function (path, volume, loop) {
            var audio = document.createElement("audio");

            audio.src = path;
            audio.loop = loop;
            audio.volume = volume;
            audio.preload = "auto";

            return audio;
        },

        startLoopMonitor: function () {
            var self = this;

            if (this.audioMonitor !== null) {
                return;
            }

            this.audioMonitor = window.setInterval(function () {
                self.refreshLoop(self.footsteps, self.footstepsActive);
                self.refreshLoop(self.driving, self.drivingActive);
            }, 500);
        },

        refreshLoop: function (audio, active) {
            if (audio === null) {
                return;
            }

            audio.loop = true;

            if (active) {
                if (audio.paused || audio.ended) {
                    if (audio.ended) {
                        audio.currentTime = 0;
                    }

                    this.safePlay(audio);
                }
            } else if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        },

        attachUnlockListeners: function () {
            var self = this,
                unlock = function () {
                    self.unlock();
                };

            document.addEventListener("keydown", unlock, false);
            document.addEventListener("click", unlock, false);
        },

        unlock: function () {
            var AudioContext = window.AudioContext || window.webkitAudioContext,
                playPromise;

            if (this.context === null && AudioContext !== undefined) {
                this.context = new AudioContext();
            }

            if (this.context && this.context.resume !== undefined) {
                this.context.resume();
            }

            if (this.music !== null) {
                playPromise = this.music.play();

                if (playPromise && playPromise.catch !== undefined) {
                    playPromise.catch(function () {});
                }
            }

            this.unlocked = true;
        },

        tone: function (frequency, duration, type, volume, slideTo) {
            var oscillator,
                gain,
                now;

            if (this.context === null) {
                this.unlock();
            }

            if (this.context === null) {
                return;
            }

            now = this.context.currentTime;
            oscillator = this.context.createOscillator();
            gain = this.context.createGain();

            oscillator.type = type || "sine";
            oscillator.frequency.setValueAtTime(frequency, now);

            if (slideTo !== undefined) {
                oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
            }

            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start(now);
            oscillator.stop(now + duration);
        },

        noise: function (duration, volume) {
            var buffer,
                data,
                source,
                gain,
                now,
                i;

            if (this.context === null) {
                this.unlock();
            }

            if (this.context === null) {
                return;
            }

            buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
            data = buffer.getChannelData(0);

            for (i = 0; i < data.length; i += 1) {
                data[i] = (Math.random() * 2 - 1) * (1 - (i / data.length));
            }

            now = this.context.currentTime;
            source = this.context.createBufferSource();
            gain = this.context.createGain();

            source.buffer = buffer;
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            source.connect(gain);
            gain.connect(this.context.destination);
            source.start(now);
        },

        playFootstep: function () {
            var now = Date.now();

            if (this.footsteps !== null) {
                this.setFootsteps(true);
                return;
            }

            if (now - this.lastFootstep < 240) {
                return;
            }

            this.lastFootstep = now;
            this.noise(0.055, 0.075);
            this.tone(95, 0.045, "triangle", 0.035, 65);
        },

        setFootsteps: function (active) {
            if (this.footsteps === null) {
                return;
            }

            this.footstepsActive = active;
            this.refreshLoop(this.footsteps, active);
        },

        playCrash: function () {
            var now = Date.now();

            if (now - this.lastCrash < 650) {
                return;
            }

            this.lastCrash = now;

            if (this.crash !== null) {
                this.crash.currentTime = 0;
                this.safePlay(this.crash);
                return;
            }

            this.noise(0.24, 0.32);
            this.tone(72, 0.22, "sawtooth", 0.16, 36);
        },

        setDriving: function (active) {
            if (this.driving === null) {
                return;
            }

            this.drivingActive = active;
            this.refreshLoop(this.driving, active);
        },

        safePlay: function (audio) {
            var playPromise = audio.play();

            if (playPromise && playPromise.catch !== undefined) {
                playPromise.catch(function () {});
            }
        },

        playCollect: function () {
            this.tone(540, 0.08, "square", 0.09, 920);
            this.tone(920, 0.12, "triangle", 0.07, 1240);
        },

        playMission: function () {
            this.tone(220, 0.1, "triangle", 0.08, 440);
            window.setTimeout(function () {
                GTA.Audio.tone(660, 0.16, "square", 0.07, 990);
            }, 90);
        },

        playMenu: function () {
            this.tone(330, 0.07, "triangle", 0.045, 440);
        }
    };

    GTA.Experience = {
        game: null,
        menu: null,
        guidance: null,
        guidanceTimer: null,
        booted: false,
        bootScreen: null,
        minBootDone: false,
        gameLoaded: false,
        platformMode: "pc",
        gameStarted: false,
        mobileControls: null,
        mobileControlsTimer: null,
        landscapeBlocker: null,
        orientationListenerReady: false,
        startGameCallback: null,
        pendingPhoneStart: false,
        bootProgress: 0,
        bootProgressTimer: null,
        bootProgressDuration: 5000,

        boot: function (startGame) {
            var screen,
                content,
                loading;

            GTA.Audio.init();
            this.injectStyles();
            this.minBootDone = false;
            this.gameLoaded = false;
            this.booted = false;
            this.gameStarted = false;
            this.bootProgress = 0;
            this.clearBootProgressTimer();

            screen = document.createElement("div");
            screen.id = "missionBoot";
            screen.innerHTML =
                "<div class=\"rialoLoadingSurface\"></div>" +
                "<div class=\"bootShade\"></div>" +
                "<div class=\"bootText\">" +
                    "<div class=\"bootSmall\">Choose your platform to begin</div>" +
                    "<div class=\"platformSelect\">" +
                        "<button data-platform=\"pc\">PC</button>" +
                        "<button data-platform=\"phone\">Mobile</button>" +
                    "</div>" +
                    "<div class=\"bootLoading\">" +
                        "<div class=\"loadingLabel\">Loading</div>" +
                        "<div class=\"loadingTrack\">" +
                            "<div class=\"loadingFill\"></div>" +
                            "<div class=\"loadingKnob\"></div>" +
                        "</div>" +
                        "<div class=\"loadingDots\"><span></span><span></span><span></span></div>" +
                    "</div>" +
                "</div>";

            document.body.appendChild(screen);
            this.bootScreen = screen;
            content = screen.getElementsByClassName("bootText")[0];
            loading = screen.getElementsByClassName("bootLoading")[0];
            loading.offsetHeight;
            this.setBootProgress(0);
            content.offsetHeight;
            content.className = "bootText show";
            this.bindPlatformButtons(screen, startGame);
            this.createLandscapeBlocker();
        },

        bindPlatformButtons: function (screen, startGame) {
            var buttons = screen.getElementsByTagName("button"),
                self = this,
                i;

            for (i = 0; i < buttons.length; i += 1) {
                buttons[i].onclick = function () {
                    self.selectPlatform(this.getAttribute("data-platform"), startGame);
                };
            }
        },

        selectPlatform: function (mode, startGame) {
            var screen = this.bootScreen,
                small;

            if (this.gameStarted) {
                return;
            }

            this.platformMode = mode === "phone" ? "phone" : "pc";
            this.gameStarted = true;
            this.applyPlatformClass();
            GTA.Audio.unlock();
            GTA.Audio.playMenu();

            if (screen !== null) {
                screen.className = "platformChosen";
                this.setBootProgress(0);
                this.startBootProgress();
                small = screen.getElementsByClassName("bootSmall")[0];

                if (small !== undefined) {
                    small.innerHTML = this.isPhoneMode() ? "Preparing mobile controls" : "Preparing PC controls";
                }
            }

            if (this.isPhoneMode()) {
                this.startPhoneMode(startGame);
                return;
            }

            this.startSelectedGame(startGame);
        },

        applyPlatformClass: function () {
            var body = document.body,
                className = body.className.replace(/\bmissionPhoneMode\b/g, "").replace(/\bmissionPcMode\b/g, "");

            body.className = className + (this.isPhoneMode() ? " missionPhoneMode" : " missionPcMode");
        },

        isPhoneMode: function () {
            return this.platformMode === "phone";
        },

        startSelectedGame: function (startGame) {
            window.setTimeout(function () {
                startGame();
            }, 80);
        },

        clearBootProgressTimer: function () {
            if (this.bootProgressTimer !== null) {
                window.clearInterval(this.bootProgressTimer);
                this.bootProgressTimer = null;
            }
        },

        setBootProgress: function (progress) {
            var screen = this.bootScreen,
                fill,
                knob;

            this.bootProgress = Math.max(0, Math.min(100, progress));

            if (screen === null) {
                return;
            }

            fill = screen.getElementsByClassName("loadingFill")[0];
            knob = screen.getElementsByClassName("loadingKnob")[0];

            if (fill !== undefined) {
                fill.style.width = this.bootProgress + "%";
            }

            if (knob !== undefined) {
                knob.style.left = this.bootProgress + "%";
            }
        },

        startBootProgress: function () {
            var self = this,
                started = Date.now();

            this.clearBootProgressTimer();

            this.bootProgressTimer = window.setInterval(function () {
                var elapsed = Date.now() - started,
                    target = Math.min(100, (elapsed / self.bootProgressDuration) * 100);

                self.setBootProgress(target);

                if (elapsed >= self.bootProgressDuration) {
                    self.completeBootProgress();
                }
            }, 90);
        },

        completeBootProgress: function () {
            this.clearBootProgressTimer();
            this.setBootProgress(100);
            this.minBootDone = true;
            this.finishBoot();
        },

        startPhoneMode: function (startGame) {
            var self = this;

            this.startGameCallback = startGame;
            this.pendingPhoneStart = true;
            this.bindOrientationListeners();
            this.requestLandscapeLock();
            this.updateLandscapeState();

            window.setTimeout(function () {
                self.updateLandscapeState();
            }, 650);
        },

        bindOrientationListeners: function () {
            var self = this,
                update = function () {
                    window.setTimeout(function () {
                        self.updateLandscapeState();
                    }, 120);
                };

            if (this.orientationListenerReady) {
                return;
            }

            this.orientationListenerReady = true;
            window.addEventListener("resize", update, false);
            window.addEventListener("orientationchange", update, false);
        },

        requestLandscapeLock: function () {
            var doc = document.documentElement,
                requestFullscreen = doc.requestFullscreen ||
                    doc.webkitRequestFullscreen ||
                    doc.mozRequestFullScreen ||
                    doc.msRequestFullscreen,
                orientation = window.screen && window.screen.orientation ? window.screen.orientation : null,
                fullscreenPromise;

            if (requestFullscreen !== undefined &&
                    (document.fullscreenElement === undefined || document.fullscreenElement === null)) {
                try {
                    fullscreenPromise = requestFullscreen.call(doc);

                    if (fullscreenPromise && fullscreenPromise.catch !== undefined) {
                        fullscreenPromise.catch(function () {});
                    }
                } catch (ignoreFullscreen) {}
            }

            if (orientation !== null && orientation.lock !== undefined) {
                try {
                    orientation.lock("landscape").catch(function () {});
                } catch (ignoreLock) {}
            }
        },

        isLandscape: function () {
            var viewport = window.visualViewport;

            return (viewport && viewport.width ? viewport.width : window.innerWidth) >=
                (viewport && viewport.height ? viewport.height : window.innerHeight);
        },

        createLandscapeBlocker: function () {
            var blocker;

            if (this.landscapeBlocker !== null) {
                return;
            }

            blocker = document.createElement("div");
            blocker.id = "missionLandscapeBlocker";
            blocker.innerHTML =
                "<div class=\"landscapePanel\">" +
                    "<div class=\"landscapeTitle\">Rotate Phone</div>" +
                    "<div class=\"landscapeText\">RialOne City mobile mode is landscape only.</div>" +
                "</div>";
            document.body.appendChild(blocker);
            this.landscapeBlocker = blocker;
        },

        updateLandscapeState: function () {
            var isReady;

            if (!this.isPhoneMode()) {
                return;
            }

            this.createLandscapeBlocker();
            isReady = this.isLandscape();
            document.body.className = document.body.className.replace(/\bmissionPortraitRequired\b/g, "") +
                (isReady ? "" : " missionPortraitRequired");

            if (this.game !== null && this.game.resizeRenderer !== undefined) {
                this.game.resizeRenderer();
            }

            if (isReady && this.pendingPhoneStart && this.startGameCallback !== null) {
                this.pendingPhoneStart = false;
                this.startSelectedGame(this.startGameCallback);
            }
        },

        finishBoot: function () {
            var screen = this.bootScreen,
                self = this;

            if (!this.minBootDone || this.booted || screen === null) {
                return;
            }

            this.clearBootProgressTimer();
            screen.className = (screen.className + " fade").replace(/^\s+|\s+$/g, "");
            window.setTimeout(function () {
                if (screen.parentNode) {
                    screen.parentNode.removeChild(screen);
                }

                self.booted = true;
                self.bootScreen = null;
                GTA.Audio.unlock();
            }, 370);
        },

        injectStyles: function () {
            var style = document.createElement("style");

            style.type = "text/css";
            style.appendChild(document.createTextNode(
                "#missionBoot,#missionMenuOverlay{" +
                    "position:absolute;inset:0;z-index:40;overflow:hidden;background:#010101;color:#E8E4D9;" +
                    "font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;" +
                "}" +
                ".rialoLoadingSurface{" +
                    "position:absolute;inset:0;background-image:url('assets/rialo-loading.svg');" +
                    "background-size:cover;background-position:center;transform:scale(1.01);" +
                "}" +
                "#missionMenuOverlay .rialoLoadingSurface{filter:brightness(.55) blur(1px);transform:scale(1.035);}" +
                "#missionBoot.fade{opacity:0;transition:opacity .35s ease;}" +
                ".bootShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.08) 45%,rgba(0,0,0,.28));}" +
                ".menuShade{position:absolute;inset:0;background:rgba(1,1,1,.64);}" +
                ".bootText{" +
                    "position:absolute;left:50%;bottom:72px;width:520px;max-width:calc(100vw - 48px);" +
                    "opacity:0;transform:translate(-50%,16px);text-align:center;color:#f8f0df;" +
                    "text-shadow:0 0 22px rgba(246,224,184,.32);transition:opacity .35s ease,transform .35s ease;" +
                "}" +
                ".bootText.show{opacity:1;transform:translate(-50%,0);}" +
                ".bootSmall{font-size:12px;color:rgba(248,240,223,.76);letter-spacing:.28em;line-height:1.5;}" +
                ".platformSelect{display:flex;justify-content:center;gap:10px;margin-top:18px;}" +
                ".platformSelect button{" +
                    "height:42px;min-width:122px;border:1px solid rgba(248,240,223,.62);" +
                    "background:rgba(3,5,9,.64);color:#fff7e8;font:bold 12px Arial;text-transform:uppercase;" +
                    "letter-spacing:.12em;box-shadow:0 0 22px rgba(246,224,184,.16);cursor:pointer;" +
                "}" +
                ".platformSelect button:hover{background:rgba(248,240,223,.16);}" +
                "#missionBoot.platformChosen .platformSelect{display:none;}" +
                "#missionBoot.platformChosen .bootSmall{font-size:10px;color:rgba(248,240,223,.52);}" +
                ".bootLoading{display:none;margin-top:16px;}" +
                "#missionBoot.platformChosen .bootLoading{display:block;}" +
                ".loadingLabel{margin-bottom:20px;color:#fff7e8;font-size:16px;letter-spacing:.44em;}" +
                ".loadingTrack{position:relative;width:500px;max-width:100%;height:12px;margin:0 auto;}" +
                ".loadingTrack:before{" +
                    "content:'';position:absolute;left:0;right:0;top:5px;height:2px;border-radius:4px;" +
                    "background:rgba(248,240,223,.22);box-shadow:0 0 0 1px rgba(248,240,223,.12);" +
                "}" +
                ".loadingFill{" +
                    "position:absolute;left:0;top:4px;height:4px;width:0;border-radius:4px;" +
                    "background:linear-gradient(90deg,#fff8e8,#d9c39d);box-shadow:0 0 18px rgba(246,224,184,.72);" +
                    "transition:width .18s linear;" +
                "}" +
                ".loadingKnob{" +
                    "position:absolute;left:0;top:0;width:12px;height:12px;border-radius:50%;margin-left:-6px;" +
                    "background:#fff8e8;box-shadow:0 0 22px rgba(246,224,184,.9);transition:left .18s linear;" +
                "}" +
                ".loadingDots{display:flex;justify-content:center;gap:14px;margin-top:27px;}" +
                ".loadingDots span{width:7px;height:7px;border-radius:50%;background:#f8f0df;opacity:.35;animation:rialoDot 1.2s infinite ease-in-out;}" +
                ".loadingDots span:nth-child(2){animation-delay:.16s;}" +
                ".loadingDots span:nth-child(3){animation-delay:.32s;}" +
                "@keyframes rialoDot{0%,100%{opacity:.3;transform:scale(.85);}50%{opacity:1;transform:scale(1.1);}}" +
                "#missionLandscapeBlocker{" +
                    "display:none;position:fixed;inset:0;z-index:60;background:#010101;color:#E8E4D9;" +
                    "font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;text-align:center;" +
                    "align-items:center;justify-content:center;padding:22px;" +
                "}" +
                "body.missionPortraitRequired #missionLandscapeBlocker{display:flex;}" +
                ".landscapePanel{border:1px solid rgba(169,221,211,.62);padding:18px 20px;background:rgba(1,1,1,.78);box-shadow:0 0 28px rgba(169,221,211,.22);}" +
                ".landscapeTitle{font-size:24px;font-weight:bold;text-shadow:0 0 16px rgba(169,221,211,.72);}" +
                ".landscapeText{font-size:12px;color:#A9DDD3;margin-top:8px;line-height:1.4;}" +
                "#missionMenuButton{" +
                    "position:absolute;left:12px;bottom:12px;z-index:20;border:1px solid rgba(169,221,211,.58);" +
                    "background:rgba(1,1,1,.8);color:#E8E4D9;padding:9px 13px;font:bold 12px Arial;" +
                    "text-transform:uppercase;cursor:pointer;box-shadow:0 0 18px rgba(169,221,211,.18);" +
                "}" +
                "#missionMenuButton:hover,.menuButton:hover{background:rgba(169,221,211,.16);color:#fff;}" +
                "#missionMenuOverlay{display:none;z-index:35;}" +
                "#missionMenuOverlay.show{display:block;}" +
                ".menuPanel{" +
                    "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:410px;max-width:calc(100vw - 34px);" +
                    "background:linear-gradient(180deg,rgba(1,1,1,.9),rgba(1,1,1,.78));border:1px solid rgba(232,228,217,.48);" +
                    "box-shadow:0 0 38px rgba(169,221,211,.2),inset 0 0 0 1px rgba(169,221,211,.16);padding:20px;max-height:calc(100vh - 56px);overflow-y:auto;" +
                "}" +
                ".menuKicker{color:#A9DDD3;font:bold 10px Arial;letter-spacing:.28em;margin-bottom:6px;}" +
                ".menuTitle{font-size:28px;font-weight:bold;margin-bottom:6px;color:#E8E4D9;text-shadow:0 0 18px rgba(232,228,217,.4);}" +
                ".menuMeta{font-size:11px;line-height:1.45;color:rgba(232,228,217,.68);margin-bottom:13px;text-transform:none;}" +
                ".menuButton{" +
                    "display:block;width:100%;height:38px;margin:8px 0;border:1px solid rgba(232,228,217,.36);" +
                    "background:rgba(1,1,1,.48);color:#E8E4D9;font:bold 13px Arial;text-transform:uppercase;cursor:pointer;" +
                "}" +
                ".missionSelect{display:none;margin-top:12px;grid-template-columns:1fr;gap:8px;}" +
                ".missionSelect.show{display:grid;}" +
                ".missionSelectHeader{display:none;margin-top:14px;color:#A9DDD3;font:bold 10px Arial;letter-spacing:.22em;}" +
                ".missionSelectHeader.show{display:block;}" +
                ".missionSelect button{" +
                    "height:54px;text-align:left;padding:8px 11px;border:1px solid rgba(169,221,211,.36);background:rgba(169,221,211,.1);" +
                    "color:#E8E4D9;font:bold 11px Arial;text-transform:uppercase;cursor:pointer;display:grid;gap:2px;" +
                "}" +
                ".missionSelect button:hover{background:rgba(232,228,217,.14);border-color:rgba(232,228,217,.62);}" +
                ".missionNumber{color:#A9DDD3;font-size:10px;letter-spacing:.14em;}" +
                ".missionName{color:#fff;font-size:12px;letter-spacing:.04em;}" +
                ".missionMeta{color:rgba(232,228,217,.62);font-size:9px;letter-spacing:.08em;}" +
                ".controlsPanel{" +
                    "display:none;margin-top:10px;padding:11px;border:1px solid rgba(169,221,211,.35);" +
                    "background:rgba(1,1,1,.48);color:#E8E4D9;font:12px/1.45 Arial;text-transform:none;" +
                "}" +
                ".controlsPanel.show{display:block;}" +
                ".controlsPanel strong{display:block;color:#fff;text-transform:uppercase;font-size:12px;margin:8px 0 3px;}" +
                ".controlsPanel span{display:block;color:#A9DDD3;}" +
                ".exitMessage{display:none;color:#A9DDD3;font-size:13px;margin-top:10px;line-height:1.35;}" +
                ".exitMessage.show{display:block;}" +
                "#missionGuidance{" +
                    "position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:18;min-width:290px;" +
                    "max-width:560px;padding:10px 14px;border:1px solid rgba(169,221,211,.55);" +
                    "background:rgba(1,1,1,.82);color:#E8E4D9;text-align:center;font:bold 12px Arial;" +
                    "text-transform:uppercase;box-shadow:0 0 20px rgba(169,221,211,.2);pointer-events:none;" +
                "}" +
                "#missionGuidance .guideKeys{display:block;color:#A9DDD3;font:bold 11px Arial;margin-top:4px;}" +
                "body.missionPhoneMode #GTADebugPositionData,body.missionPhoneMode .stats{display:none;}" +
                "body.missionPhoneMode #missionMenuButton{left:10px;bottom:calc(118px + env(safe-area-inset-bottom));padding:7px 10px;font-size:11px;}" +
                "body.missionPhoneMode #missionGuidance{" +
                    "bottom:calc(116px + env(safe-area-inset-bottom));width:auto;min-width:0;" +
                    "max-width:360px;font-size:9px;padding:5px 8px;line-height:1.15;" +
                "}" +
                "body.missionPhoneMode #missionGuidance .guideKeys{font-size:8px;margin-top:2px;}" +
                "#missionTouchControls{display:none;font-family:Arial,Helvetica,sans-serif;}" +
                "body.missionPhoneMode #missionTouchControls{display:block;}" +
                "#missionTouchControls button{" +
                    "pointer-events:auto;border:1px solid rgba(169,221,211,.65);background:rgba(1,1,1,.78);" +
                    "color:#E8E4D9;box-shadow:0 0 18px rgba(169,221,211,.24);font:bold 13px Arial;text-transform:uppercase;" +
                    "touch-action:none;-webkit-user-select:none;user-select:none;" +
                "}" +
                "#missionTouchControls button:active{background:rgba(169,221,211,.22);}" +
                ".touchSteer{position:fixed;left:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:22;display:flex;gap:12px;}" +
                ".touchActions{position:fixed;right:12px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:22;display:flex;gap:11px;align-items:flex-end;}" +
                ".touchRound{width:78px;height:78px;border-radius:50%;font-size:30px;}" +
                ".touchPill{height:74px;min-width:84px;border-radius:37px;padding:0 18px;}" +
                ".touchTall{height:88px;min-width:104px;border-radius:44px;font-size:15px;}" +
                "#missionTouchControls .carOnly{display:none;}" +
                "#missionTouchControls.inVehicle .footOnly{display:none;}" +
                "#missionTouchControls.inVehicle .carOnly{display:inline-block;}" +
                "#missionTouchControls.inVehicle .touchActions{gap:7px;}" +
                "@media (max-width:520px){" +
                    ".bootText{bottom:34px;max-width:calc(100vw - 32px);}" +
                    ".loadingLabel{font-size:12px;letter-spacing:.34em;margin-bottom:14px;}" +
                    ".platformSelect{flex-wrap:wrap;}" +
                    ".platformSelect button{min-width:104px;}" +
                    ".touchRound{width:68px;height:68px;}" +
                    ".touchPill{height:66px;min-width:72px;padding:0 14px;font-size:11px;}" +
                    ".touchTall{height:80px;min-width:90px;}" +
                "}"
            ));

            document.getElementsByTagName("head")[0].appendChild(style);
        },

        gameReady: function (game) {
            this.game = game;
            this.gameLoaded = true;

            if (GTA.CombatSystem !== undefined && game.combat === undefined) {
                game.combat = new GTA.CombatSystem(game);
            }

            this.createMenu();
            this.createGuidance();
            this.updateLandscapeState();

            if (this.isPhoneMode()) {
                this.createMobileControls();
            }

            if (GTA.NPCManager !== undefined) {
                game.npcManager = new GTA.NPCManager(game);
            }

            this.finishBoot();
        },

        createMenu: function () {
            var button,
                overlay,
                missions,
                select,
                i,
                missionButton,
                self = this;

            if (this.menu !== null) {
                return;
            }

            button = document.createElement("button");
            button.id = "missionMenuButton";
            button.appendChild(document.createTextNode("Menu"));
            document.body.appendChild(button);

            overlay = document.createElement("div");
            overlay.id = "missionMenuOverlay";
            overlay.innerHTML =
                "<div class=\"rialoLoadingSurface\"></div>" +
                "<div class=\"menuShade\"></div>" +
                "<div class=\"menuPanel\">" +
                    "<div class=\"menuKicker\">Mission Retrieval</div>" +
                    "<div class=\"menuTitle\">RialOne City</div>" +
                    "<div class=\"menuMeta\">Pick a retrieval run, restart the city session, or check controls before heading back into the streets.</div>" +
                    "<button class=\"menuButton restart\">Restart</button>" +
                    "<button class=\"menuButton selectMission\">Select Mission</button>" +
                    "<button class=\"menuButton controlsMenu\">Controls</button>" +
                    "<button class=\"menuButton closeMenu\">Resume</button>" +
                    "<button class=\"menuButton exitGame\">Exit</button>" +
                    "<div class=\"missionSelectHeader\">Available Retrieval Missions</div>" +
                    "<div class=\"missionSelect\"></div>" +
                    "<div class=\"controlsPanel\">" +
                        "<strong>On Foot</strong>" +
                        "<span>W / Arrow Up: move forward</span>" +
                        "<span>S / Arrow Down: move backward</span>" +
                        "<span>A / D: turn left or right</span>" +
                        "<span>E: enter a nearby car or hijack a moving car</span>" +
                        "<span>Enter / Space / J: shoot nearby targets</span>" +
                        "<span>Phone: hold RUN, tap SHOOT, and steer with the arrow buttons</span>" +
                        "<strong>In A Car</strong>" +
                        "<span>W: drive forward</span>" +
                        "<span>A / D: steer</span>" +
                        "<span>R: reverse</span>" +
                        "<span>S: speed boost</span>" +
                        "<span>E: exit the car</span>" +
                        "<span>Phone: DRIVE, REV, BOOST, E, and arrow buttons</span>" +
                        "<strong>Map And Missions</strong>" +
                        "<span>Click the nav map to expand it</span>" +
                        "<span>Enter the glowing mission marker to reveal submissions</span>" +
                    "</div>" +
                    "<div class=\"exitMessage\">Session closed. Press restart to begin again.</div>" +
                "</div>";

            missions = overlay.getElementsByClassName("missionSelect")[0];

            for (i = 0; i < GTA.RetrievalMissionConfig.missions.length; i += 1) {
                var mission = GTA.RetrievalMissionConfig.missions[i];

                missionButton = document.createElement("button");
                missionButton.setAttribute("data-mission", i);
                missionButton.innerHTML =
                    "<span class=\"missionNumber\">Mission " + mission.id + "</span>" +
                    "<span class=\"missionName\">" + mission.name + "</span>" +
                    "<span class=\"missionMeta\">" + mission.submissions.length + " symbols to recover</span>";
                missions.appendChild(missionButton);
            }

            document.body.appendChild(overlay);

            button.onclick = function () {
                GTA.Audio.playMenu();
                overlay.className = "show";
            };

            overlay.getElementsByClassName("restart")[0].onclick = function () {
                GTA.Audio.playMenu();
                window.location.reload();
            };

            overlay.getElementsByClassName("selectMission")[0].onclick = function () {
                GTA.Audio.playMenu();
                select = overlay.getElementsByClassName("missionSelect")[0];
                select.className = select.className === "missionSelect show" ? "missionSelect" : "missionSelect show";
                overlay.getElementsByClassName("missionSelectHeader")[0].className =
                    select.className === "missionSelect show" ? "missionSelectHeader show" : "missionSelectHeader";
                overlay.getElementsByClassName("controlsPanel")[0].className = "controlsPanel";
            };

            overlay.getElementsByClassName("controlsMenu")[0].onclick = function () {
                var controls = overlay.getElementsByClassName("controlsPanel")[0];

                GTA.Audio.playMenu();
                controls.className = controls.className === "controlsPanel show" ? "controlsPanel" : "controlsPanel show";
                overlay.getElementsByClassName("missionSelect")[0].className = "missionSelect";
                overlay.getElementsByClassName("missionSelectHeader")[0].className = "missionSelectHeader";
            };

            overlay.getElementsByClassName("closeMenu")[0].onclick = function () {
                GTA.Audio.playMenu();
                overlay.className = "";
            };

            overlay.getElementsByClassName("exitGame")[0].onclick = function () {
                GTA.Audio.playMenu();
                overlay.getElementsByClassName("exitMessage")[0].className = "exitMessage show";
            };

            missions.onclick = function (event) {
                var target = event.target,
                    missionIndex;

                if (target && target.getAttribute("data-mission") !== null) {
                    missionIndex = parseInt(target.getAttribute("data-mission"), 10);

                    if (self.game && self.game.retrievalMissions) {
                        GTA.Audio.playMission();
                        self.game.retrievalMissions.loadMission(missionIndex);
                        overlay.className = "";
                    }
                }
            };

            this.menu = overlay;
        },

        createGuidance: function () {
            var guidance,
                self = this;

            if (this.guidance !== null) {
                return;
            }

            guidance = document.createElement("div");
            guidance.id = "missionGuidance";
            document.body.appendChild(guidance);
            this.guidance = guidance;
            this.updateGuidance();

            this.guidanceTimer = window.setInterval(function () {
                self.updateGuidance();
            }, 140);
        },

        updateGuidance: function () {
            var player,
                carDistance,
                combatResult;

            if (this.guidance === null || this.game === null || this.game.player === undefined) {
                return;
            }

            player = this.game.player;

            if (player.vehicle !== null) {
                this.setGuidance(
                    "Driving mode",
                    this.isPhoneMode() ? "DRIVE forward | arrows steer | REV reverse | BOOST speed | E exit" :
                        "W forward | A/D steer | R reverse | S boost | E exit"
                );
                return;
            }

            combatResult = this.game.combat && this.game.combat.getRecentResult !== undefined ?
                this.game.combat.getRecentResult() : null;

            if (combatResult !== null) {
                if (combatResult.hit) {
                    this.setGuidance(
                        combatResult.health <= 0 ? "Target down" : "Shot landed",
                        combatResult.health <= 0 ? "Keep moving through the city" :
                            "Target health " + combatResult.health + " | Enter shoots again"
                    );
                } else {
                    this.setGuidance(
                        "Shot missed",
                        this.isPhoneMode() ? "Face the target and tap Shoot" : "Face the target and fire again"
                    );
                }

                return;
            }

            carDistance = this.nearestCarDistance(player.position.x, player.position.y);

            if (carDistance < 230) {
                this.setGuidance(
                    this.isPhoneMode() ? "Tap E to enter the car" : "Press E to enter the car",
                    this.isPhoneMode() ? "You can also hijack a moving car with E" : "You can also hijack a moving car with E"
                );
                return;
            }

            this.setGuidance(
                "Find the glowing mission marker",
                this.isPhoneMode() ? "Hold RUN and steer with arrows to search the city" :
                    "Enter shoot | E car | enter marker"
            );
        },

        createMobileControls: function () {
            var controls,
                buttons,
                i,
                control,
                self = this;

            if (this.mobileControls !== null) {
                return;
            }

            controls = document.createElement("div");
            controls.id = "missionTouchControls";
            controls.innerHTML =
                "<div class=\"touchSteer\">" +
                    "<button class=\"touchRound\" data-touch=\"left\">&larr;</button>" +
                    "<button class=\"touchRound\" data-touch=\"right\">&rarr;</button>" +
                "</div>" +
                "<div class=\"touchActions\">" +
                    "<button class=\"touchTall footOnly\" data-touch=\"run\">Run</button>" +
                    "<button class=\"touchTall footOnly combatAction\" data-touch=\"attack\">Shoot</button>" +
                    "<button class=\"touchTall carOnly\" data-touch=\"drive\">Drive</button>" +
                    "<button class=\"touchPill carOnly\" data-touch=\"reverse\">Rev</button>" +
                    "<button class=\"touchPill carOnly\" data-touch=\"boost\">Boost</button>" +
                    "<button class=\"touchRound vehicleAction\" data-touch=\"vehicle\">E</button>" +
                "</div>";

            document.body.appendChild(controls);
            this.mobileControls = controls;
            buttons = controls.getElementsByTagName("button");

            for (i = 0; i < buttons.length; i += 1) {
                control = buttons[i].getAttribute("data-touch");

                if (control === "vehicle" || control === "attack") {
                    this.bindMobileTap(buttons[i], control);
                } else {
                    this.bindMobileHold(buttons[i], control);
                }
            }

            this.mobileControlsTimer = window.setInterval(function () {
                self.updateMobileControls();
            }, 180);
            this.updateMobileControls();
        },

        bindMobileHold: function (button, control) {
            var self = this,
                start = function (event) {
                    event.preventDefault();
                    self.setMobileControl(control, true);
                },
                end = function (event) {
                    event.preventDefault();
                    self.setMobileControl(control, false);
                };

            if (window.PointerEvent !== undefined) {
                button.addEventListener("pointerdown", start, false);
                button.addEventListener("pointerup", end, false);
                button.addEventListener("pointercancel", end, false);
                button.addEventListener("pointerleave", end, false);
            } else {
                button.addEventListener("touchstart", start, false);
                button.addEventListener("touchend", end, false);
                button.addEventListener("touchcancel", end, false);
                button.addEventListener("mousedown", start, false);
                button.addEventListener("mouseup", end, false);
                button.addEventListener("mouseleave", end, false);
            }
        },

        bindMobileTap: function (button, control) {
            var self = this,
                tap = function (event) {
                    event.preventDefault();

                    if (control === "attack") {
                        self.mobileAttackTap();
                    } else {
                        self.mobileVehicleTap();
                    }
                };

            if (window.PointerEvent !== undefined) {
                button.addEventListener("pointerdown", tap, false);
            } else {
                button.addEventListener("touchstart", tap, false);
                button.addEventListener("mousedown", tap, false);
            }
        },

        setMobileControl: function (control, active) {
            var player = this.game && this.game.player ? this.game.player : null;

            if (player === null) {
                return;
            }

            if (control === "left") {
                player.turnLeft = active;
            } else if (control === "right") {
                player.turnRight = active;
            } else if (control === "run" || control === "drive") {
                player.moveForward = active;
            } else if (control === "reverse") {
                player.vehicleReverse = active;
            } else if (control === "boost") {
                player.vehicleBoost = active;
            }

            this.updateMobileControls();
        },

        mobileAttackTap: function () {
            var player = this.game && this.game.player ? this.game.player : null;

            if (player === null || player.vehicle !== null) {
                return;
            }

            player.attack();
            this.updateMobileControls();
        },

        mobileVehicleTap: function () {
            var player = this.game && this.game.player ? this.game.player : null,
                self = this;

            if (player === null || player.vehicleUseDown) {
                return;
            }

            player.moveForward = false;
            player.vehicleReverse = false;
            player.vehicleBoost = false;
            player.vehicleUseDown = true;
            player.toggleVehicle();
            this.updateMobileControls();

            window.setTimeout(function () {
                player.vehicleUseDown = false;
                self.updateMobileControls();
            }, 240);
        },

        updateMobileControls: function () {
            var player = this.game && this.game.player ? this.game.player : null,
                vehicleButton;

            if (this.mobileControls === null || player === null) {
                return;
            }

            this.mobileControls.className = player.vehicle !== null ? "inVehicle" : "";
            vehicleButton = this.mobileControls.getElementsByClassName("vehicleAction")[0];

            if (vehicleButton !== undefined) {
                vehicleButton.innerHTML = player.vehicle !== null ? "Exit" : "E";
            }
        },

        nearestCarDistance: function (playerX, playerY) {
            var distance = 999999,
                activeObjects = this.game.activeObjects || [],
                i,
                car,
                dx,
                dy,
                current;

            for (i = 0; i < activeObjects.length; i += 1) {
                car = activeObjects[i];

                if (car.sprite === undefined || car.type === undefined || this.game.cars[car.type] === undefined) {
                    continue;
                }

                dx = car.sprite.position.x - playerX;
                dy = car.sprite.position.y - playerY;
                current = Math.sqrt(dx * dx + dy * dy);

                if (current < distance) {
                    distance = current;
                }
            }

            if (this.game.npcManager !== undefined) {
                for (i = 0; i < this.game.npcManager.cars.length; i += 1) {
                    car = this.game.npcManager.cars[i].object;
                    dx = car.sprite.position.x - playerX;
                    dy = car.sprite.position.y - playerY;
                    current = Math.sqrt(dx * dx + dy * dy);

                    if (current < distance) {
                        distance = current;
                    }
                }
            }

            return distance;
        },

        setGuidance: function (title, detail) {
            this.guidance.innerHTML = title + "<span class=\"guideKeys\">" + detail + "</span>";
        }
    };

    GTA.NPCManager = function (game) {
        this.game = game;
        this.walkers = [];
        this.cars = [];
        this.time = 0;
        this.carRoadCounts = {};
        this.walkerRoadCounts = {};
        this.playerVehicleLastPosition = null;
        this.maxCarsPerRoad = 2;
        this.maxWalkersPerRoad = 2;
        this.maxCrossing = 1;
        this.localWalkerCount = 6;
        this.localCarCount = 3;
        this.pedColors = [0xff6b6b, 0x58d6ff, 0xffd166, 0xb56dff, 0x72ef8a, 0xff9f43];
        this.carColors = [0xffffff, 0xff4757, 0x2ed573, 0x1e90ff, 0xffc312, 0xa4b0be, 0xff7f50];
        this.spawnWalkers(18);
        this.spawnCars(8);
    };

    GTA.NPCManager.prototype.cloneTintedMesh = function (source, tint) {
        var geometry = THREE.GeometryUtils.clone(source.geometry),
            material = new THREE.MeshBasicMaterial({
                map: source.material.map,
                transparent: true,
                color: tint
            }),
            mesh = new THREE.Mesh(geometry, material);

        mesh.geometry.dynamic = true;
        mesh.doubleSided = true;

        return mesh;
    };

    GTA.NPCManager.prototype.spawnWalkers = function (count) {
        var i,
            offset = this.game.spriteNumbers.offset.PED,
            sprite,
            spot;

        for (i = 0; i < count; i += 1) {
            spot = this.findPavementStart(i);
            this.changeRoadCount(this.walkerRoadCounts, spot.roadKey, 1);
            sprite = this.cloneTintedMesh(this.game.sprites[offset].sprite, this.pedColors[i % this.pedColors.length]);
            sprite.position.set(spot.world.x, spot.world.y, 142);
            this.game.scene.add(sprite);

            this.walkers.push({
                sprite: sprite,
                animator: new GTA.SpriteAnimation(this.game, offset, sprite),
                animationBase: offset,
                animationFrame: 0,
                animationClock: 0,
                block: {
                    x: spot.block.x,
                    y: spot.block.y
                },
                direction: spot.direction,
                targetBlock: {
                    x: spot.block.x + spot.direction.x,
                    y: spot.block.y + spot.direction.y
                },
                mode: "walk",
                waitTimer: 0,
                pauseTimer: 0,
                crossing: null,
                roadKey: spot.roadKey,
                speed: 22 + (i % 4) * 3
            });
        }
    };

    GTA.NPCManager.prototype.spawnCars = function (count) {
        var models = [4, 12, 24, 31, 36, 44, 58, 6, 10, 20],
            i,
            car,
            spot,
            model;

        for (i = 0; i < count; i += 1) {
            model = models[i % models.length];

            if (this.game.cars[model] === undefined) {
                model = 4;
            }

            spot = this.findRoadStart(i);
            this.changeRoadCount(this.carRoadCounts, spot.roadKey, 1);
            car = new GTA.GameObjectPosition();
            car.addCar(this.game, model, spot.world.x, -spot.world.y + (this.game.cars[model].height / 2), 255, 0);
            car.sprite = this.cloneTintedMesh(car.sprite, this.carColors[i % this.carColors.length]);
            car.sprite.position.set(spot.world.x, spot.world.y, 129);
            car.sprite.rotation.z = this.carRotationForDirection(spot.direction);
            this.game.scene.add(car.sprite);

            this.cars.push({
                object: car,
                block: {
                    x: spot.block.x,
                    y: spot.block.y
                },
                direction: spot.direction,
                laneSide: spot.laneSide,
                targetBlock: {
                    x: spot.block.x + spot.direction.x,
                    y: spot.block.y + spot.direction.y
                },
                state: "drive",
                stopTimer: 0,
                yieldTimer: 0,
                blocksUntilStop: 2 + (i % 4),
                roadKey: spot.roadKey,
                speed: 42 + (i % 3) * 6,
                color: this.carColors[i % this.carColors.length]
            });
        }
    };

    GTA.NPCManager.prototype.findPavementStart = function (index) {
        var start = this.getSpawnAnchor(index, "walker"),
            rings,
            dx,
            dy,
            block,
            direction,
            roadKey,
            found = 0,
            desired = index < this.localWalkerCount ? index * 2 : 0;

        for (rings = 1; rings < 64; rings += 1) {
            for (dx = -rings; dx <= rings; dx += 1) {
                for (dy = -rings; dy <= rings; dy += 1) {
                    if (Math.abs(dx) !== rings && Math.abs(dy) !== rings) {
                        continue;
                    }

                    block = {
                        x: start.x + dx,
                        y: start.y + dy
                    };

                    if (this.getColumnType(block.x, block.y) !== 3 || !this.isRoadsidePavement(block.x, block.y)) {
                        continue;
                    }

                    roadKey = this.roadKeyForSidewalk(block.x, block.y);

                    if (roadKey === null || this.getRoadCount(this.walkerRoadCounts, roadKey) >= this.maxWalkersPerRoad) {
                        continue;
                    }

                    direction = this.choosePavementDirection(block.x, block.y, index);

                    if (found < desired) {
                        found += 1;
                        continue;
                    }

                    return {
                        block: block,
                        direction: direction,
                        roadKey: roadKey,
                        world: this.blockToWorld(block.x, block.y)
                    };
                }
            }
        }

        block = {
            x: start.x + 3 + index,
            y: start.y + 3
        };

        return {
            block: block,
            direction: {
                x: 1,
                y: 0
            },
            roadKey: this.roadKeyForSidewalk(block.x, block.y),
            world: this.blockToWorld(block.x, block.y)
        };
    };

    GTA.NPCManager.prototype.findRoadStart = function (index) {
        var start = this.getSpawnAnchor(index, "car"),
            rings,
            dx,
            dy,
            block,
            directions,
            direction,
            roadKey,
            attempt,
            found = 0,
            desired = index < this.localCarCount ? index * 3 : 0;

        for (rings = 1; rings < 72; rings += 1) {
            for (dx = -rings; dx <= rings; dx += 1) {
                for (dy = -rings; dy <= rings; dy += 1) {
                    if (Math.abs(dx) !== rings && Math.abs(dy) !== rings) {
                        continue;
                    }

                    block = {
                        x: start.x + dx,
                        y: start.y + dy
                    };

                    if (this.getColumnType(block.x, block.y) !== 2) {
                        continue;
                    }

                    directions = this.getRoadDirections(block.x, block.y);

                    if (directions.length > 0) {
                        for (attempt = 0; attempt < directions.length; attempt += 1) {
                            direction = directions[(index + attempt) % directions.length];
                            roadKey = this.roadKeyForRoad(block.x, block.y, direction);

                            if (this.getRoadCount(this.carRoadCounts, roadKey) >= this.maxCarsPerRoad) {
                                continue;
                            }

                            if (found < desired) {
                                found += 1;
                                continue;
                            }

                            return {
                                block: block,
                                direction: direction,
                                roadKey: roadKey,
                                laneSide: (index % 2) ? 1 : -1,
                                world: this.blockToLaneWorld(block.x, block.y, direction, (index % 2) ? 1 : -1)
                            };
                        }
                    }
                }
            }
        }

        block = {
            x: start.x + 6 + index,
            y: start.y
        };
        direction = {
            x: 1,
            y: 0
        };

        return {
            block: block,
            direction: direction,
            roadKey: this.roadKeyForRoad(block.x, block.y, direction),
            laneSide: 1,
            world: this.blockToLaneWorld(block.x, block.y, direction, 1)
        };
    };

    GTA.NPCManager.prototype.worldToBlock = function (worldX, worldY) {
        return {
            x: Math.max(1, Math.min(254, Math.round(worldX / 64))),
            y: Math.max(1, Math.min(254, Math.round(-worldY / 64)))
        };
    };

    GTA.NPCManager.prototype.getColumnType = function (blockX, blockY) {
        var column,
            block;

        if (blockX <= 0 || blockX >= 255 || blockY <= 0 || blockY >= 255 ||
                this.game.map.base[blockX] === undefined ||
                this.game.map.base[blockX][blockY] === undefined) {
            return 0;
        }

        column = this.game.map.base[blockX][blockY];
        block = column.blocks[2] || column.blocks[column.blocks.length - 1];

        return block ? block.type : 0;
    };

    GTA.NPCManager.prototype.getSpawnAnchor = function (index, kind) {
        var player = this.game.player,
            playerBlock = this.worldToBlock(player.position.x, player.position.y),
            seed;

        if ((kind === "car" && index < this.localCarCount) ||
                (kind === "walker" && index < this.localWalkerCount)) {
            return playerBlock;
        }

        seed = kind === "car" ? (index * 37) + 19 : (index * 53) + 41;

        return {
            x: 16 + ((seed * 17) % 224),
            y: 16 + (((seed + 29) * 31) % 224)
        };
    };

    GTA.NPCManager.prototype.getRoadAxis = function (blockX, blockY) {
        if (this.getColumnType(blockX + 1, blockY) === 2 || this.getColumnType(blockX - 1, blockY) === 2) {
            return "h";
        }

        if (this.getColumnType(blockX, blockY + 1) === 2 || this.getColumnType(blockX, blockY - 1) === 2) {
            return "v";
        }

        return null;
    };

    GTA.NPCManager.prototype.roadKeyForRoad = function (blockX, blockY, direction) {
        var axis = direction && direction.x !== 0 ? "h" : direction && direction.y !== 0 ? "v" : this.getRoadAxis(blockX, blockY);

        if (axis === "h") {
            return "h:" + blockY;
        }

        if (axis === "v") {
            return "v:" + blockX;
        }

        return "r:" + blockX + ":" + blockY;
    };

    GTA.NPCManager.prototype.roadKeyForSidewalk = function (blockX, blockY) {
        var candidates = [
                { x: blockX + 1, y: blockY },
                { x: blockX - 1, y: blockY },
                { x: blockX, y: blockY + 1 },
                { x: blockX, y: blockY - 1 }
            ],
            i,
            axis;

        for (i = 0; i < candidates.length; i += 1) {
            if (this.getColumnType(candidates[i].x, candidates[i].y) !== 2) {
                continue;
            }

            axis = this.getRoadAxis(candidates[i].x, candidates[i].y);

            if (axis === "h") {
                return "h:" + candidates[i].y;
            }

            if (axis === "v") {
                return "v:" + candidates[i].x;
            }

            return "r:" + candidates[i].x + ":" + candidates[i].y;
        }

        return null;
    };

    GTA.NPCManager.prototype.getRoadCount = function (counts, key) {
        if (key === null || counts[key] === undefined) {
            return 0;
        }

        return counts[key];
    };

    GTA.NPCManager.prototype.changeRoadCount = function (counts, key, delta) {
        if (key === null) {
            return;
        }

        counts[key] = Math.max(0, this.getRoadCount(counts, key) + delta);
    };

    GTA.NPCManager.prototype.setWalkerRoadKey = function (walker, key) {
        if (walker.roadKey === key) {
            return;
        }

        this.changeRoadCount(this.walkerRoadCounts, walker.roadKey, -1);
        walker.roadKey = key;
        this.changeRoadCount(this.walkerRoadCounts, walker.roadKey, 1);
    };

    GTA.NPCManager.prototype.setCarRoadKey = function (car, key) {
        if (car.roadKey === key) {
            return;
        }

        this.changeRoadCount(this.carRoadCounts, car.roadKey, -1);
        car.roadKey = key;
        this.changeRoadCount(this.carRoadCounts, car.roadKey, 1);
    };

    GTA.NPCManager.prototype.canCarUseRoadKey = function (car, key) {
        return key === car.roadKey ||
            this.getRoadCount(this.carRoadCounts, key) < this.maxCarsPerRoad;
    };

    GTA.NPCManager.prototype.blockToWorld = function (blockX, blockY) {
        return {
            x: blockX * 64,
            y: -(blockY * 64)
        };
    };

    GTA.NPCManager.prototype.blockToLaneWorld = function (blockX, blockY, direction, laneSide) {
        var world = this.blockToWorld(blockX, blockY);

        if (direction.x !== 0) {
            world.y += laneSide * 14;
        } else {
            world.x += laneSide * 14;
        }

        return world;
    };

    GTA.NPCManager.prototype.isRoadsidePavement = function (blockX, blockY) {
        return this.getColumnType(blockX + 1, blockY) === 2 ||
            this.getColumnType(blockX - 1, blockY) === 2 ||
            this.getColumnType(blockX, blockY + 1) === 2 ||
            this.getColumnType(blockX, blockY - 1) === 2;
    };

    GTA.NPCManager.prototype.getPavementDirections = function (blockX, blockY, requireRoadside) {
        var directions = [],
            candidates = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ],
            i,
            nextX,
            nextY;

        for (i = 0; i < candidates.length; i += 1) {
            nextX = blockX + candidates[i].x;
            nextY = blockY + candidates[i].y;

            if (this.getColumnType(nextX, nextY) !== 3) {
                continue;
            }

            if (requireRoadside && !this.isRoadsidePavement(nextX, nextY)) {
                continue;
            }

            directions.push(candidates[i]);
        }

        return directions;
    };

    GTA.NPCManager.prototype.choosePavementDirection = function (blockX, blockY, index) {
        var directions = this.getPavementDirections(blockX, blockY, true);

        if (directions.length === 0) {
            directions = this.getPavementDirections(blockX, blockY, false);
        }

        if (directions.length === 0) {
            directions.push({ x: 1, y: 0 });
        }

        return directions[index % directions.length];
    };

    GTA.NPCManager.prototype.canWalkerUseBlock = function (walker, blockX, blockY) {
        var roadKey;

        if (this.getColumnType(blockX, blockY) !== 3 || !this.isRoadsidePavement(blockX, blockY)) {
            return false;
        }

        roadKey = this.roadKeyForSidewalk(blockX, blockY);

        return roadKey === walker.roadKey ||
            this.getRoadCount(this.walkerRoadCounts, roadKey) < this.maxWalkersPerRoad;
    };

    GTA.NPCManager.prototype.hasActiveCrossing = function () {
        var i;

        for (i = 0; i < this.walkers.length; i += 1) {
            if (this.walkers[i].mode === "wait" || this.walkers[i].mode === "cross") {
                return true;
            }
        }

        return false;
    };

    GTA.NPCManager.prototype.getRoadDirections = function (blockX, blockY) {
        var directions = [];

        if (this.getColumnType(blockX + 1, blockY) === 2) {
            directions.push({ x: 1, y: 0 });
        }

        if (this.getColumnType(blockX - 1, blockY) === 2) {
            directions.push({ x: -1, y: 0 });
        }

        if (this.getColumnType(blockX, blockY + 1) === 2) {
            directions.push({ x: 0, y: 1 });
        }

        if (this.getColumnType(blockX, blockY - 1) === 2) {
            directions.push({ x: 0, y: -1 });
        }

        return directions;
    };

    GTA.NPCManager.prototype.findCrossing = function (blockX, blockY, index) {
        var directions = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ],
            i,
            direction,
            step,
            x,
            y;

        for (i = 0; i < directions.length; i += 1) {
            direction = directions[(i + index) % directions.length];
            x = blockX + direction.x;
            y = blockY + direction.y;

            if (this.getColumnType(x, y) !== 2) {
                continue;
            }

            for (step = 1; step <= 7; step += 1) {
                x = blockX + direction.x * step;
                y = blockY + direction.y * step;

                if (this.getColumnType(x, y) === 3 && this.isRoadsidePavement(x, y)) {
                    return {
                        x: x,
                        y: y,
                        direction: direction
                    };
                }

                if (this.getColumnType(x, y) !== 2) {
                    break;
                }
            }
        }

        return null;
    };

    GTA.NPCManager.prototype.pedRotationForDirection = function (direction) {
        return Math.atan2(-direction.y, direction.x) + 1.57079633;
    };

    GTA.NPCManager.prototype.carRotationForDirection = function (direction) {
        return this.pedRotationForDirection(direction);
    };

    GTA.NPCManager.prototype.walkerTargetWorld = function (walker) {
        return this.blockToWorld(walker.targetBlock.x, walker.targetBlock.y);
    };

    GTA.NPCManager.prototype.carTargetWorld = function (car) {
        return this.blockToLaneWorld(car.targetBlock.x, car.targetBlock.y, car.direction, car.laneSide);
    };

    GTA.NPCManager.prototype.moveToward = function (sprite, target, speed, delta) {
        var dx = target.x - sprite.position.x,
            dy = target.y - sprite.position.y,
            distance = Math.sqrt(dx * dx + dy * dy),
            step = speed * delta;

        if (distance <= step || distance < 1) {
            sprite.position.x = target.x;
            sprite.position.y = target.y;

            return true;
        }

        sprite.position.x += (dx / distance) * step;
        sprite.position.y += (dy / distance) * step;

        return false;
    };

    GTA.NPCManager.prototype.getCarBodyRadius = function (car) {
        var model;

        if (car === null || car === undefined || car.object === undefined) {
            return 42;
        }

        model = this.game.cars[car.object.type] || {};

        return Math.max(42, Math.min(72, Math.max(model.width || 52, model.height || 52) * 0.58));
    };

    GTA.NPCManager.prototype.predictCarStep = function (car, target, delta) {
        var dx = target.x - car.object.sprite.position.x,
            dy = target.y - car.object.sprite.position.y,
            distance = Math.sqrt(dx * dx + dy * dy),
            step = Math.min(distance, car.speed * delta);

        if (distance <= 1) {
            return {
                x: target.x,
                y: target.y
            };
        }

        return {
            x: car.object.sprite.position.x + (dx / distance) * step,
            y: car.object.sprite.position.y + (dy / distance) * step
        };
    };

    GTA.NPCManager.prototype.carsShareBlock = function (a, b) {
        return a !== null && a !== undefined && b !== null && b !== undefined && a.x === b.x && a.y === b.y;
    };

    GTA.NPCManager.prototype.shouldYieldToTraffic = function (car, index, target, delta) {
        var next = this.predictCarStep(car, target, delta),
            carRadius = this.getCarBodyRadius(car),
            i,
            other,
            otherTarget,
            otherNext,
            otherRadius,
            dx,
            dy,
            distance,
            forwardDistance,
            sideDistance,
            sameLane,
            sameTarget,
            swappingBlocks,
            priority;

        for (i = 0; i < this.cars.length; i += 1) {
            if (i === index) {
                continue;
            }

            other = this.cars[i];

            if (other === undefined || other.driverEvicted === true || other.object === undefined || other.object.sprite === undefined) {
                continue;
            }

            otherRadius = this.getCarBodyRadius(other);
            dx = other.object.sprite.position.x - next.x;
            dy = other.object.sprite.position.y - next.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (carRadius + otherRadius) * 0.76) {
                return true;
            }

            sameLane = car.direction.x === other.direction.x &&
                car.direction.y === other.direction.y &&
                car.laneSide === other.laneSide;

            if (sameLane) {
                forwardDistance = (other.object.sprite.position.x - car.object.sprite.position.x) * car.direction.x -
                    (other.object.sprite.position.y - car.object.sprite.position.y) * car.direction.y;
                sideDistance = Math.abs((other.object.sprite.position.x - car.object.sprite.position.x) * car.direction.y +
                    (other.object.sprite.position.y - car.object.sprite.position.y) * car.direction.x);

                if (forwardDistance > 0 && forwardDistance < 112 && sideDistance < 42) {
                    return true;
                }
            }

            otherTarget = this.carTargetWorld(other);
            otherNext = this.predictCarStep(other, otherTarget, delta);
            dx = otherNext.x - next.x;
            dy = otherNext.y - next.y;
            distance = Math.sqrt(dx * dx + dy * dy);
            sameTarget = this.carsShareBlock(car.targetBlock, other.targetBlock);
            swappingBlocks = this.carsShareBlock(car.targetBlock, other.block) && this.carsShareBlock(other.targetBlock, car.block);
            priority = (index + car.block.x + car.block.y) > (i + other.block.x + other.block.y);

            if ((sameTarget || swappingBlocks || distance < (carRadius + otherRadius) * 0.68) && priority) {
                return true;
            }
        }

        return false;
    };

    GTA.NPCManager.prototype.triggerTrafficDriverRetaliation = function (car) {
        var driver;

        if (car === null || car === undefined || car.driverEvicted === true) {
            return null;
        }

        if (this.game.combat !== undefined && this.game.combat.applyCarHit !== undefined) {
            return this.game.combat.applyCarHit(car);
        }

        driver = this.evictShotDriver(car);

        if (driver !== null) {
            driver.hostile = true;
            driver.aiMode = "duel";
            driver.enemyLabel = "Angry Driver";
        }

        return driver;
    };

    GTA.NPCManager.prototype.getVehicleWorldPosition = function (vehicle) {
        if (vehicle === null || vehicle === undefined || vehicle.physics === undefined) {
            return null;
        }

        return {
            x: vehicle.physics.GetPosition().x * GTA.PhysicsScale,
            y: -vehicle.physics.GetPosition().y * GTA.PhysicsScale
        };
    };

    GTA.NPCManager.prototype.getTrafficImpactForVehicle = function (vehicle, driveAngle, speed) {
        var position = this.getVehicleWorldPosition(vehicle),
            leadDistance = speed >= 0 ? 76 : -58,
            lead,
            i,
            car,
            dx,
            dy,
            distance,
            radius;

        if (position === null || Math.abs(speed) < 1.2) {
            return null;
        }

        lead = {
            x: position.x + Math.cos(driveAngle) * leadDistance,
            y: position.y + Math.sin(driveAngle) * leadDistance
        };

        for (i = 0; i < this.cars.length; i += 1) {
            car = this.cars[i];

            if (car === undefined || car.driverEvicted === true || car.object === undefined || car.object.sprite === undefined) {
                continue;
            }

            radius = this.getCarBodyRadius(car) + 40;
            dx = car.object.sprite.position.x - lead.x;
            dy = car.object.sprite.position.y - lead.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                return car;
            }

            dx = car.object.sprite.position.x - position.x;
            dy = car.object.sprite.position.y - position.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius * 0.74) {
                return car;
            }
        }

        return null;
    };

    GTA.NPCManager.prototype.getWalkerBodyRadius = function () {
        return 22;
    };

    GTA.NPCManager.prototype.getVehicleBodyRadius = function (vehicle) {
        var model;

        if (vehicle === null || vehicle === undefined) {
            return 56;
        }

        model = this.game.cars[vehicle.type] || {};

        return Math.max(54, Math.min(98, Math.max(model.width || 58, model.height || 72) * 0.72));
    };

    GTA.NPCManager.prototype.getObjectWorldPosition = function (object) {
        if (object === null || object === undefined) {
            return null;
        }

        if (object.physics !== undefined) {
            return {
                x: object.physics.GetPosition().x * GTA.PhysicsScale,
                y: -object.physics.GetPosition().y * GTA.PhysicsScale
            };
        }

        if (object.sprite !== undefined) {
            return {
                x: object.sprite.position.x,
                y: object.sprite.position.y
            };
        }

        return null;
    };

    GTA.NPCManager.prototype.getVehicleImpactForVehicle = function (vehicle, driveAngle, speed) {
        var position = this.getVehicleWorldPosition(vehicle),
            future,
            vehicleRadius,
            i,
            car,
            activeCar,
            targetPosition,
            targetRadius,
            distance,
            threshold,
            activeObjects;

        if (position === null || Math.abs(speed) < 1.2) {
            return null;
        }

        future = {
            x: position.x + Math.cos(driveAngle) * (speed >= 0 ? 96 : -74),
            y: position.y + Math.sin(driveAngle) * (speed >= 0 ? 96 : -74)
        };
        vehicleRadius = this.getVehicleBodyRadius(vehicle);

        for (i = 0; i < this.cars.length; i += 1) {
            car = this.cars[i];

            if (car === undefined || car.driverEvicted === true || car.object === undefined || car.object.sprite === undefined) {
                continue;
            }

            targetPosition = this.getObjectWorldPosition(car.object);

            if (targetPosition === null) {
                continue;
            }

            targetRadius = this.getCarBodyRadius(car);
            threshold = Math.max(58, vehicleRadius * 0.68 + targetRadius * 0.76);
            distance = this.distancePointToSegment(targetPosition.x, targetPosition.y, position.x, position.y, future.x, future.y);

            if (distance <= threshold) {
                return {
                    trafficCar: car,
                    position: targetPosition
                };
            }
        }

        activeObjects = this.game.activeObjects || [];

        for (i = 0; i < activeObjects.length; i += 1) {
            activeCar = activeObjects[i];

            if (activeCar === vehicle || activeCar.sprite === undefined || activeCar.type === undefined ||
                    this.game.cars[activeCar.type] === undefined) {
                continue;
            }

            targetPosition = this.getObjectWorldPosition(activeCar);

            if (targetPosition === null) {
                continue;
            }

            targetRadius = this.getVehicleBodyRadius(activeCar);
            threshold = Math.max(62, vehicleRadius * 0.66 + targetRadius * 0.66);
            distance = this.distancePointToSegment(targetPosition.x, targetPosition.y, position.x, position.y, future.x, future.y);

            if (distance <= threshold) {
                return {
                    activeCar: activeCar,
                    position: targetPosition
                };
            }
        }

        return null;
    };

    GTA.NPCManager.prototype.resolveVehicleImpact = function (vehicle, impact) {
        var position = this.getVehicleWorldPosition(vehicle),
            targetPosition = impact !== null && impact !== undefined ? impact.position : null,
            dx,
            dy,
            distance,
            push = 18;

        if (position === null || targetPosition === null || vehicle.physics === undefined) {
            return;
        }

        dx = position.x - targetPosition.x;
        dy = position.y - targetPosition.y;
        distance = Math.sqrt(dx * dx + dy * dy) || 1;
        vehicle.physics.SetPosition(new Box2D.Common.Math.b2Vec2(
            (position.x + (dx / distance) * push) / GTA.PhysicsScale,
            -(position.y + (dy / distance) * push) / GTA.PhysicsScale
        ));
        vehicle.physics.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(0, 0));

        if (impact.activeCar !== undefined && impact.activeCar.physics !== undefined) {
            impact.activeCar.physics.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(
                -(dx / distance) * 1.8,
                (dy / distance) * 1.8
            ));
        }
    };

    GTA.NPCManager.prototype.isWalkerInactive = function (walker) {
        var state;

        if (walker === null || walker === undefined || walker.resolved === true ||
                walker.sprite === undefined || walker.sprite.visible === false || walker.mode === "down") {
            return true;
        }

        state = walker.combat;

        return state !== undefined && (state.dead === true || state.downTimer > 0 || state.health <= 0);
    };

    GTA.NPCManager.prototype.predictWalkerStep = function (walker, target, speed, delta) {
        var dx = target.x - walker.sprite.position.x,
            dy = target.y - walker.sprite.position.y,
            distance = Math.sqrt(dx * dx + dy * dy),
            step = Math.min(distance, speed * delta);

        if (distance <= 1) {
            return {
                x: target.x,
                y: target.y
            };
        }

        return {
            x: walker.sprite.position.x + (dx / distance) * step,
            y: walker.sprite.position.y + (dy / distance) * step
        };
    };

    GTA.NPCManager.prototype.distancePointToSegment = function (px, py, ax, ay, bx, by) {
        var dx = bx - ax,
            dy = by - ay,
            lengthSq = dx * dx + dy * dy,
            t;

        if (lengthSq <= 0.001) {
            dx = px - ax;
            dy = py - ay;

            return Math.sqrt(dx * dx + dy * dy);
        }

        t = ((px - ax) * dx + (py - ay) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));
        dx = px - (ax + t * (bx - ax));
        dy = py - (ay + t * (by - ay));

        return Math.sqrt(dx * dx + dy * dy);
    };

    GTA.NPCManager.prototype.shouldWalkerYield = function (walker, index, target, speed, delta) {
        var next = this.predictWalkerStep(walker, target, speed, delta),
            walkerRadius = this.getWalkerBodyRadius(walker),
            i,
            other,
            otherTarget,
            otherNext,
            car,
            vehiclePosition,
            dx,
            dy,
            distance,
            minDistance,
            priority;

        for (i = 0; i < this.walkers.length; i += 1) {
            if (i === index) {
                continue;
            }

            other = this.walkers[i];

            if (this.isWalkerInactive(other)) {
                continue;
            }

            otherTarget = this.walkerTargetWorld(other);
            otherNext = other.pauseTimer > 0 || other.mode === "wait" ?
                { x: other.sprite.position.x, y: other.sprite.position.y } :
                this.predictWalkerStep(other, otherTarget, other.mode === "cross" ? 36 : other.speed, delta);
            dx = otherNext.x - next.x;
            dy = otherNext.y - next.y;
            distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = this.getWalkerBodyRadius(other) + walkerRadius;
            priority = (index + walker.block.x + walker.block.y) > (i + other.block.x + other.block.y);

            if (distance < minDistance && priority) {
                return true;
            }
        }

        for (i = 0; i < this.cars.length; i += 1) {
            car = this.cars[i];

            if (car === undefined || car.driverEvicted === true || car.object === undefined || car.object.sprite === undefined) {
                continue;
            }

            dx = car.object.sprite.position.x - next.x;
            dy = car.object.sprite.position.y - next.y;
            distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = this.getCarBodyRadius(car) + walkerRadius * 0.85;

            if (distance < minDistance) {
                return true;
            }
        }

        vehiclePosition = this.getVehicleWorldPosition(this.game.player.vehicle);

        if (vehiclePosition !== null) {
            dx = vehiclePosition.x - next.x;
            dy = vehiclePosition.y - next.y;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.getVehicleBodyRadius(this.game.player.vehicle) + walkerRadius) {
                return true;
            }
        }

        return false;
    };

    GTA.NPCManager.prototype.crushWalker = function (walker, sourceX, sourceY, byPlayer) {
        var state,
            dx,
            dy,
            distance;

        if (this.isWalkerInactive(walker)) {
            return false;
        }

        if (this.game.combat !== undefined && this.game.combat.ensureWalkerCombat !== undefined) {
            state = this.game.combat.ensureWalkerCombat(walker);
        } else {
            walker.combat = walker.combat || {
                maxHealth: 100,
                health: 100,
                hitTimer: 0,
                downTimer: 0,
                knockbackX: 0,
                knockbackY: 0,
                barTimer: 0,
                healthBar: null
            };
            state = walker.combat;
        }

        dx = walker.sprite.position.x - sourceX;
        dy = walker.sprite.position.y - sourceY;
        distance = Math.sqrt(dx * dx + dy * dy) || 1;
        state.health = 0;
        state.dead = true;
        state.downTimer = 2.1;
        state.hitTimer = 0;
        state.knockbackX = (dx / distance) * 48;
        state.knockbackY = (dy / distance) * 48;
        state.barTimer = 0;
        walker.mode = "down";
        walker.pauseTimer = 0;

        if (this.game.combat !== undefined && this.game.combat.hideHealthBar !== undefined) {
            this.game.combat.hideHealthBar(walker);
        }

        if (byPlayer === true && this.game.combat !== undefined && this.game.combat.awardKill !== undefined && walker.hostile === true) {
            this.game.combat.awardKill(walker);
            this.game.combat.clearActiveTarget(walker);
        }

        if (byPlayer === true && this.game.wanted !== undefined && walker.hostile !== true && walker.isPolice !== true) {
            this.game.wanted.reportCrime("hit and run", 2);
        }

        return true;
    };

    GTA.NPCManager.prototype.crushWalkersAlongPath = function (fromX, fromY, toX, toY, radius, byPlayer) {
        var i,
            walker,
            distance,
            threshold;

        if (Math.abs(toX - fromX) + Math.abs(toY - fromY) < 1.5) {
            return;
        }

        for (i = 0; i < this.walkers.length; i += 1) {
            walker = this.walkers[i];

            if (this.isWalkerInactive(walker)) {
                continue;
            }

            threshold = Math.max(34, radius * 0.72 + this.getWalkerBodyRadius(walker) * 0.65);
            distance = this.distancePointToSegment(
                walker.sprite.position.x,
                walker.sprite.position.y,
                fromX,
                fromY,
                toX,
                toY
            );

            if (distance <= threshold) {
                this.crushWalker(walker, toX, toY, byPlayer === true);
            }
        }
    };

    GTA.NPCManager.prototype.crushWalkersWithPlayerVehicle = function () {
        var vehicle = this.game.player.vehicle,
            position,
            previous,
            radius;

        if (vehicle === null || vehicle === undefined) {
            this.playerVehicleLastPosition = null;
            return;
        }

        position = this.getVehicleWorldPosition(vehicle);

        if (position === null) {
            this.playerVehicleLastPosition = null;
            return;
        }

        previous = this.playerVehicleLastPosition || position;
        radius = this.getVehicleBodyRadius(vehicle);
        this.crushWalkersAlongPath(previous.x, previous.y, position.x, position.y, radius, true);
        this.playerVehicleLastPosition = {
            x: position.x,
            y: position.y
        };
    };

    GTA.NPCManager.prototype.resolveWalkerOverlaps = function () {
        var i,
            j,
            a,
            b,
            dx,
            dy,
            distance,
            minDistance,
            push;

        for (i = 0; i < this.walkers.length; i += 1) {
            a = this.walkers[i];

            if (this.isWalkerInactive(a)) {
                continue;
            }

            for (j = i + 1; j < this.walkers.length; j += 1) {
                b = this.walkers[j];

                if (this.isWalkerInactive(b)) {
                    continue;
                }

                dx = b.sprite.position.x - a.sprite.position.x;
                dy = b.sprite.position.y - a.sprite.position.y;
                distance = Math.sqrt(dx * dx + dy * dy) || 1;
                minDistance = this.getWalkerBodyRadius(a) + this.getWalkerBodyRadius(b);

                if (distance >= minDistance) {
                    continue;
                }

                push = (minDistance - distance) * 0.5;
                dx /= distance;
                dy /= distance;
                a.sprite.position.x -= dx * push;
                a.sprite.position.y -= dy * push;
                b.sprite.position.x += dx * push;
                b.sprite.position.y += dy * push;
            }
        }
    };

    GTA.NPCManager.prototype.resolveWalkerCarOverlaps = function () {
        var i,
            j,
            walker,
            car,
            dx,
            dy,
            distance,
            minDistance,
            push;

        for (i = 0; i < this.walkers.length; i += 1) {
            walker = this.walkers[i];

            if (this.isWalkerInactive(walker)) {
                continue;
            }

            for (j = 0; j < this.cars.length; j += 1) {
                car = this.cars[j];

                if (car === undefined || car.driverEvicted === true || car.object === undefined || car.object.sprite === undefined) {
                    continue;
                }

                dx = walker.sprite.position.x - car.object.sprite.position.x;
                dy = walker.sprite.position.y - car.object.sprite.position.y;
                distance = Math.sqrt(dx * dx + dy * dy) || 1;
                minDistance = this.getCarBodyRadius(car) + this.getWalkerBodyRadius(walker) * 0.72;

                if (distance >= minDistance) {
                    continue;
                }

                if (car.state === "drive" && (car.yieldTimer || 0) <= 0) {
                    this.crushWalker(walker, car.object.sprite.position.x, car.object.sprite.position.y, false);
                    continue;
                }

                push = minDistance - distance;
                walker.sprite.position.x += (dx / distance) * push;
                walker.sprite.position.y += (dy / distance) * push;
                walker.pauseTimer = Math.max(walker.pauseTimer || 0, 0.2);
            }
        }
    };

    GTA.NPCManager.prototype.animateWalker = function (walker, delta) {
        walker.animationClock += delta;

        if (walker.animationClock >= 0.11) {
            walker.animationClock = 0;
            walker.animationFrame = (walker.animationFrame + 1) % 7;
            walker.animator.setSprite(walker.animationBase + walker.animationFrame);
        }
    };

    GTA.NPCManager.prototype.advanceWalker = function (walker, index) {
        var crossing,
            nextBlock,
            directions,
            chosen;

        walker.block.x = walker.targetBlock.x;
        walker.block.y = walker.targetBlock.y;
        this.setWalkerRoadKey(walker, this.roadKeyForSidewalk(walker.block.x, walker.block.y));

        if (walker.mode === "cross") {
            walker.mode = "walk";
            walker.crossing = null;
            walker.direction = this.choosePavementDirection(walker.block.x, walker.block.y, index);
            walker.targetBlock = {
                x: walker.block.x + walker.direction.x,
                y: walker.block.y + walker.direction.y
            };
            return;
        }

        if (!this.hasActiveCrossing() && (index + walker.block.x + walker.block.y) % 19 === 0) {
            crossing = this.findCrossing(walker.block.x, walker.block.y, index);

            if (crossing !== null) {
                walker.mode = "wait";
                walker.waitTimer = 0.55 + (index % 3) * 0.18;
                walker.crossing = crossing;
                return;
            }
        }

        nextBlock = {
            x: walker.block.x + walker.direction.x,
            y: walker.block.y + walker.direction.y
        };

        if (!this.canWalkerUseBlock(walker, nextBlock.x, nextBlock.y)) {
            directions = [
                { x: walker.direction.y, y: walker.direction.x },
                { x: -walker.direction.y, y: -walker.direction.x },
                { x: -walker.direction.x, y: -walker.direction.y }
            ];
            chosen = 0;

            while (chosen < directions.length &&
                    !this.canWalkerUseBlock(walker, walker.block.x + directions[chosen].x, walker.block.y + directions[chosen].y)) {
                chosen += 1;
            }

            walker.direction = directions[chosen] || this.choosePavementDirection(walker.block.x, walker.block.y, index);
        }

        walker.targetBlock = {
            x: walker.block.x + walker.direction.x,
            y: walker.block.y + walker.direction.y
        };
    };

    GTA.NPCManager.prototype.advanceCar = function (car, index) {
        var directions,
            forward,
            left,
            right,
            options = [],
            choice,
            roadKey,
            i;

        car.block.x = car.targetBlock.x;
        car.block.y = car.targetBlock.y;
        this.setCarRoadKey(car, this.roadKeyForRoad(car.block.x, car.block.y, car.direction));

        car.blocksUntilStop -= 1;

        if (car.blocksUntilStop <= 0) {
            car.state = "stopped";
            car.stopTimer = 1.4 + (index % 4) * 0.35;
            car.blocksUntilStop = 2 + ((index + car.block.x + car.block.y) % 4);
            car.targetBlock = {
                x: car.block.x,
                y: car.block.y
            };
            return;
        }

        directions = this.getRoadDirections(car.block.x, car.block.y);
        forward = {
            x: car.direction.x,
            y: car.direction.y
        };
        left = {
            x: -car.direction.y,
            y: car.direction.x
        };
        right = {
            x: car.direction.y,
            y: -car.direction.x
        };

        roadKey = this.roadKeyForRoad(car.block.x, car.block.y, forward);

        if (this.getColumnType(car.block.x + forward.x, car.block.y + forward.y) === 2 &&
                this.canCarUseRoadKey(car, roadKey)) {
            choice = forward;
        } else {
            roadKey = this.roadKeyForRoad(car.block.x, car.block.y, left);

            if (this.getColumnType(car.block.x + left.x, car.block.y + left.y) === 2 &&
                    this.canCarUseRoadKey(car, roadKey)) {
                options.push(left);
            }

            roadKey = this.roadKeyForRoad(car.block.x, car.block.y, right);

            if (this.getColumnType(car.block.x + right.x, car.block.y + right.y) === 2 &&
                    this.canCarUseRoadKey(car, roadKey)) {
                options.push(right);
            }

            if (options.length === 0 && directions.length > 0) {
                for (i = 0; i < directions.length; i += 1) {
                    roadKey = this.roadKeyForRoad(car.block.x, car.block.y, directions[i]);

                    if (this.canCarUseRoadKey(car, roadKey)) {
                        options.push(directions[i]);
                    }
                }
            }

            if (options.length === 0) {
                car.state = "stopped";
                car.stopTimer = 1.2;
                car.targetBlock = {
                    x: car.block.x,
                    y: car.block.y
                };
                return;
            }

            choice = options[(index + car.block.x + car.block.y) % options.length];
        }

        car.direction = choice;
        car.targetBlock = {
            x: car.block.x + car.direction.x,
            y: car.block.y + car.direction.y
        };
    };

    GTA.NPCManager.prototype.hijackNearestCar = function (playerX, playerY, maxDistance) {
        var nearest = null,
            nearestIndex = -1,
            nearestDistance = maxDistance,
            i,
            car,
            dx,
            dy,
            distance,
            vehicle,
            worldX,
            worldY;

        for (i = 0; i < this.cars.length; i += 1) {
            car = this.cars[i];
            dx = car.object.sprite.position.x - playerX;
            dy = car.object.sprite.position.y - playerY;
            distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance) {
                nearest = car;
                nearestIndex = i;
                nearestDistance = distance;
            }
        }

        if (nearest === null) {
            return null;
        }

        this.cars.splice(nearestIndex, 1);
        this.changeRoadCount(this.carRoadCounts, nearest.roadKey, -1);
        this.spawnEvictedDriver(nearest, nearestIndex + 20);

        vehicle = nearest.object;
        worldX = vehicle.sprite.position.x;
        worldY = vehicle.sprite.position.y;
        vehicle.x = worldX + 32;
        vehicle.y = -worldY + (this.game.cars[vehicle.type].height / 2);
        vehicle.z = 255;
        vehicle.rotation = vehicle.sprite.rotation.z + 1.57079633;
        vehicle.initPhysics(this.game);
        vehicle.physics.SetAngle(-vehicle.sprite.rotation.z);
        vehicle.physics.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(0, 0));
        this.game.activeObjects.push(vehicle);

        return vehicle;
    };

    GTA.NPCManager.prototype.spawnEvictedDriver = function (car, index) {
        var carBlock = this.worldToBlock(car.object.sprite.position.x, car.object.sprite.position.y),
            radius,
            dx,
            dy,
            block,
            roadKey,
            direction,
            offset = this.game.spriteNumbers.offset.PED,
            sprite,
            walker;

        for (radius = 1; radius < 6; radius += 1) {
            for (dx = -radius; dx <= radius; dx += 1) {
                for (dy = -radius; dy <= radius; dy += 1) {
                    block = {
                        x: carBlock.x + dx,
                        y: carBlock.y + dy
                    };

                    if (this.getColumnType(block.x, block.y) !== 3 || !this.isRoadsidePavement(block.x, block.y)) {
                        continue;
                    }

                    roadKey = this.roadKeyForSidewalk(block.x, block.y);

                    if (this.getRoadCount(this.walkerRoadCounts, roadKey) >= this.maxWalkersPerRoad) {
                        continue;
                    }

                    direction = this.choosePavementDirection(block.x, block.y, index);
                    this.changeRoadCount(this.walkerRoadCounts, roadKey, 1);
                    sprite = this.cloneTintedMesh(this.game.sprites[offset].sprite, this.pedColors[index % this.pedColors.length]);
                    sprite.position.set(block.x * 64, -(block.y * 64), 142);
                    this.game.scene.add(sprite);

                    walker = {
                        sprite: sprite,
                        animator: new GTA.SpriteAnimation(this.game, offset, sprite),
                        animationBase: offset,
                        animationFrame: 0,
                        animationClock: 0,
                        block: {
                            x: block.x,
                            y: block.y
                        },
                        direction: direction,
                        targetBlock: {
                            x: block.x + direction.x,
                            y: block.y + direction.y
                        },
                        mode: "walk",
                        waitTimer: 0,
                        pauseTimer: 0,
                        crossing: null,
                        roadKey: roadKey,
                        speed: 20
                    };

                    this.walkers.push(walker);

                    return walker;
                }
            }
        }

        return null;
    };

    GTA.NPCManager.prototype.evictShotDriver = function (car) {
        var index,
            driver;

        if (car === null || car === undefined || car.driverEvicted === true) {
            return null;
        }

        index = this.cars.indexOf(car);

        if (index < 0) {
            return null;
        }

        car.driverEvicted = true;
        this.cars.splice(index, 1);
        this.changeRoadCount(this.carRoadCounts, car.roadKey, -1);
        driver = this.spawnEvictedDriver(car, index + 80);

        if (driver !== null) {
            driver.hostile = true;
            driver.aiMode = "duel";
            driver.enemyLabel = "Angry Driver";
            driver.attackClock = 0.45;
        }

        return driver;
    };

    GTA.NPCManager.prototype.update = function (delta) {
        var i,
            walker,
            car,
            target,
            reached,
            speed,
            fromX,
            fromY;

        this.time += delta;
        this.crushWalkersWithPlayerVehicle();

        for (i = 0; i < this.walkers.length; i += 1) {
            walker = this.walkers[i];

            if (this.game.combat !== undefined && this.game.combat.updateWalkerState !== undefined &&
                    this.game.combat.updateWalkerState(walker, delta, i, this.time)) {
                continue;
            }

            if (this.game.enemyAI !== undefined && this.game.enemyAI.updateWalker !== undefined &&
                    this.game.enemyAI.updateWalker(walker, delta, i)) {
                continue;
            }

            if (walker.mode === "wait") {
                walker.waitTimer -= delta;
                walker.sprite.rotation.z = this.pedRotationForDirection(walker.crossing.direction);

                if (walker.waitTimer <= 0) {
                    walker.mode = "cross";
                    walker.direction = walker.crossing.direction;
                    walker.targetBlock = {
                        x: walker.crossing.x,
                        y: walker.crossing.y
                    };
                }
            } else if (walker.pauseTimer > 0) {
                walker.pauseTimer = Math.max(0, walker.pauseTimer - delta);
                walker.sprite.rotation.z = this.pedRotationForDirection(walker.direction);
                this.animateWalker(walker, delta);
            } else {
                target = this.walkerTargetWorld(walker);
                speed = walker.mode === "cross" ? 36 : walker.speed;

                if (this.shouldWalkerYield(walker, i, target, speed, delta)) {
                    walker.pauseTimer = 0.2 + ((i + walker.block.x + walker.block.y) % 3) * 0.08;
                    walker.sprite.rotation.z = this.pedRotationForDirection(walker.direction);
                    this.animateWalker(walker, delta);
                    walker.sprite.position.z = 142 + Math.sin(this.time * 9 + i) * 2;
                    continue;
                }

                reached = this.moveToward(walker.sprite, target, speed, delta);
                walker.sprite.rotation.z = this.pedRotationForDirection(walker.direction);
                this.animateWalker(walker, delta);

                if (reached) {
                    this.advanceWalker(walker, i);
                }
            }

            walker.sprite.position.z = 142 + Math.sin(this.time * 9 + i) * 2;
        }

        this.resolveWalkerOverlaps();
        this.resolveWalkerCarOverlaps();

        for (i = 0; i < this.cars.length; i += 1) {
            car = this.cars[i];

            if (car.state === "stopped") {
                car.stopTimer -= delta;
                car.object.sprite.rotation.z = this.carRotationForDirection(car.direction);

                if (car.stopTimer <= 0) {
                    car.state = "drive";
                    this.advanceCar(car, i);
                }

                continue;
            }

            if (car.yieldTimer > 0) {
                car.yieldTimer = Math.max(0, car.yieldTimer - delta);
                car.object.sprite.rotation.z = this.carRotationForDirection(car.direction);
                continue;
            }

            target = this.carTargetWorld(car);

            if (this.shouldYieldToTraffic(car, i, target, delta)) {
                car.yieldTimer = 0.28 + ((i + car.block.x + car.block.y) % 3) * 0.12;
                car.object.sprite.rotation.z = this.carRotationForDirection(car.direction);
                continue;
            }

            fromX = car.object.sprite.position.x;
            fromY = car.object.sprite.position.y;
            reached = this.moveToward(car.object.sprite, target, car.speed, delta);
            car.object.sprite.rotation.z = this.carRotationForDirection(car.direction);
            this.crushWalkersAlongPath(fromX, fromY, car.object.sprite.position.x, car.object.sprite.position.y, this.getCarBodyRadius(car), false);

            if (reached) {
                this.advanceCar(car, i);
            }
        }
    };
}());
