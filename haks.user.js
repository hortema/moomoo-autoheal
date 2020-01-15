// ==UserScript==
// @name         Capture WebSockets
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*.moomoo.io/*
// @grant        none
// ==/UserScript==

(function() {
    var foodIDs = ["16", ""]
    var toExclude = [ /* "PLAYER_MOVE", */ "LEADERS_UPDATE", "a", "GATHER_ANIM" ]

    'use strict';
    var packets = {
        UPDATE_HEALTH: "h",
        PLAYER_START: "1",
        /* PLAYER_ADD: "2", */
        PLAYER_ANGLE: "2",
        PLAYER_UPDATE: "3",
        PLAYER_ATTACK :"4",
        PLAYER_MOVE: "33",
        PLAYER_REMOVE: "4",
        LEADERS_UPDATE: "5",
        SELECT_ITEM: "5",
        LOAD_GAME_OBJ: "6",
        PLAYER_UPGRADE: "6",
        GATHER_ANIM: "7",
        AUTO_ATK: "7",
        WIGGLE: "8",
        CLAN_CREATE: "8",
        PLAYER_LEAVE_CLAN: "9",
        STAT_UPDATE: "9",
        CLAN_REQ_JOIN: "10",
        UPDATE_HEALTH: "10",
        CLAN_ACC_JOIN: "11",
        CLAN_KICK: "12",
        ITEM_BUY: "13",
        UPDATE_AGE: "15",
        UPGRADES: "16",
        UPDATE_ITEMS: "17",
        CHAT: "ch",
        CLAN_DEL: "ad",
        PLAYER_SET_CLAN: "st",
        SET_CLAN_PLAYERS: "sa",
        CLAN_ADD: "ac",
        CLAN_NOTIFY: "an",
        MINIMAP: "mm",
        UPDATE_STORE: "us",
        DISCONN: "d",

        // added by me
        WINDOW_FOCUS: "rmd",
        ATTACK: "c"
    };

    var scr = document.createElement('script'),
        head = document.head || document.getElementsByTagName('head')[0];
    scr.src = 'https://rawcdn.githack.com/kawanet/msgpack-lite/5b71d82cad4b96289a466a6403d2faaa3e254167/dist/msgpack.min.js';
    scr.async = false;

    head.insertBefore(scr, head.firstChild);

    scr.addEventListener('load', function() {
        window.currentAngle = 0;

        var displayIFrame = document.createElement("iframe");
        var displayCanvas = document.createElement("canvas");
        displayIFrame.style.position = "absolute";
        displayIFrame.style.top = "0";
        displayIFrame.style.left = "0";
        displayIFrame.style.border = "none";
        displayIFrame.style.padding = "0";
        displayIFrame.style.margin = "0";
        displayIFrame.style.pointerEvents = "none";

        displayIFrame.width = window.screen.availWidth;

        var body = document.body,
            html = document.documentElement;

        displayIFrame.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

        displayCanvas.style.position = "absolute";
        displayCanvas.style.top = "0";
        displayCanvas.style.left = "0";

        displayCanvas.width = window.screen.availWidth;
        displayCanvas.height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);;

        document.body.appendChild(displayIFrame);
        displayIFrame.contentDocument.documentElement.style.overflow = "hidden";
        displayIFrame.contentDocument.body.appendChild(displayCanvas);

        var displayCtx = displayCanvas.getContext("2d");

        WebSocket.prototype.addEventListener = (function(a) {
            return function(b) {
                console.log("addEventListener called");
            }
        })(WebSocket.prototype.addEventListener);

        WebSocket.prototype.send = (function(a) {
            return function(b) {
                window.commSocket = this;

                if (!this.LISTENER_ADDED) {
                    this.onmessage = (function(aaa) {
                        return function(bbb) {
                            var bbbbb = new Uint8Array(bbb.data);
                            var decoded = msgpack.decode(bbbbb);

                            if (Object.values(packets).includes(decoded[0])) {
                                try{
                                for (var i of Object.keys(packets)) { if (packets[i] == decoded[0]) { decoded[0] = i; } };
                                } catch (e) {
                                    console.error(e);
                                }
                                console.log("thing of later: " + decoded[0]);
                                 if (decoded[0] == "PLAYER_START") {
                                     window.currentId = decoded[1][0];
                                     window.currentHealth = 100;
                                 } else if (decoded[0] == "PLAYER_LEAVE_CLAN") {
                                     if (decoded[1][0] == "food") {
                                         window.currentFood = decoded[1][1];
                                     }
                                 }
                            }

                            if (decoded[0] == "h") {
                                 console.log("health update!")
                                 console.log("" + decoded[1][0] + " == " + window.currentId);
                                 if (decoded[1][0] == window.currentId) {
                                     window.currentHealth = decoded[1][1];
                                 }
                            }

                            if (!toExclude.includes(decoded[0]))
                                console.log("From server: " + JSON.stringify(decoded, null, 2));

                            aaa.apply(this, Array.from(arguments));
                        };
                    })(this.onmessage);

                    window.healFunction = function() {
                        if (window.currentHealth < 100 && window.autoHealActive && (window.currentFood >= 10 || window.location.hostname.startsWith("sandbox"))) {
                                console.log("heal!");
                                if (window.location.hostname.startsWith("sandbox")) {
                                    commSocket.send(msgpack.encode(["5", [0, null]]));
                                } else {
                                    commSocket.send(msgpack.encode(["5", [0, null]]));
                                }
                                setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, 0.79]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); }, 50);
                            }

                        setTimeout(healFunction, (window.currentHealth / 100) * 150);
                    };

                    setTimeout(healFunction, 150);

                    window.addEventListener("keydown", function(event) {
                        console.log(event.code);
                        if (event.code == "KeyP") {
                            window.autoHealActive = !window.autoHealActive;
                        }
                    });

                    window.addEventListener("keyup", function(event) {
                        console.log("loll");

                        if (event.code == "KeyK") {
                            commSocket.send(msgpack.encode(["5", [6, null]]));
                            setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, 2.36]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, window.currentAngle]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); }, 50); }, 50);

                            setTimeout(function() {
                                commSocket.send(msgpack.encode(["5", [6, null]]));
                                setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, 0.79]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, window.currentAngle]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); }, 50); }, 50);
                            }, 100);

                            setTimeout(function() {
                                commSocket.send(msgpack.encode(["5", [6, null]]));
                                setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, -0.79]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, window.currentAngle]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); }, 50); }, 50);
                            }, 200);

                            setTimeout(function() {
                                commSocket.send(msgpack.encode(["5", [6, null]]));
                                setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, -2.36]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); setTimeout(function() { commSocket.send(msgpack.encode(["c", [1, window.currentAngle]])); setTimeout(function() { commSocket.send(msgpack.encode(["c", [0, null]])); }, 50); }, 50); }, 50);
                            }, 300);
                        }
                    });
                }

                this.LISTENER_ADDED = true;

                try {
                    var decoded = msgpack.decode(b);
                    // console.log(decoded);
                } catch (e) {
                    console.log("ree");
                }

                if (Object.values(packets).includes(decoded[0])) {
                    for (var i of Object.keys(packets)) { if (packets[i] == decoded[0]) { decoded[0] = i; } };
                    if (decoded[0] == "PLAYER_MOVE") {
                        decoded[1][0] = decoded[1][0] * 57.2957795;

                        /* var testA = ["33", [Math.PI / 4]]
                        a.apply(this, [msgpack.encode(testA)]);
                        return; */
                    }
                }

                if (decoded[0] == "PLAYER_ANGLE") {
                    window.currentAngle = decoded[1][0];
                    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
                    var r = 500;

                    displayCtx.strokeStyle = "#1e90ff";
                    displayCtx.beginPath();
                    displayCtx.moveTo((displayCanvas.width / 2), displayCanvas.height / 2);
                    displayCtx.lineTo((displayCanvas.width / 2) + r * Math.cos(window.currentAngle), (displayCanvas.height / 2) + r * Math.sin(window.currentAngle));
                    displayCtx.stroke();
                    displayCtx.closePath();

                    displayCtx.fillStyle = "black";
                    displayCtx.font = "20px 'Hammersmith One'";
                    displayCtx.fillText("Autoheal: " + (window.autoHealActive ? "ON" : "OFF"), 5, 20);
                    console.log("text!")
                }

                if (decoded[0] != "PLAYER_ADD")
                    console.log("From client:" + JSON.stringify(decoded, null, 2));

                if (decoded[0] != "pp")
                    a.apply(this, Array.from(arguments));
            }
        })(WebSocket.prototype.send);
    });
    // Your code here...
})();
