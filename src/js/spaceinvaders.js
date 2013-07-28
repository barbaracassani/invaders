define(["jquery",
    "src/js/accessories",
    "src/js/alien",
    "src/js/bullet",
    "src/js/cannon",
    "src/js/house"], function($, SP, Alien, Bullet, Cannon, House) {

    'use strict';

    var points = 0,
        level = 1,
        variance = 60000;

    var Game = function() {

        this.$container = $('#gamefield');
        this.template = '<div id="points"></div><div id="lives"></div>';

        this.$container.html(this.template);
        this.$containerH = parseInt(this.$container.height(), 10);
        this.$containerW = parseInt(this.$container.width(), 10);

        this.housesYPos = this.$container.height() - 100;
        this.housesH = 20;
        this.housesW = 20;
        this.housesNo = 5;
        this.housesCounter = this.housesNo;

        this.lives = 5;

        this.aliens = [];
        this.xtremes = {};

        this.distanceBetweenAliens = 30;
        this.offsetOfAlienField = 50;
        this.aliensPerRow = 10;

        this.alienW = 20;
        this.alienH = 20;

        this.alienTypes = [
            {
                class : 'minions',
                exploding : null,
                points : 3
            },
            {
                class : 'bug',
                exploding : null,
                points : 5
            },
            {
                class : 'baddies',
                exploding : null,
                points : 7
            },
            {
                class : 'nasty',
                exploding : null,
                points : 11
            }
        ];

        SP.makeObservable(this);

        this.setup();

        this.layRemainingLives();
        this.updatePointsCounter(0);
        this.attachFieldEvents();
    };

    Game.prototype.setup = function() {
        this.layField();
        this.layCannon();
        this.layHouses();

        this.startClock();
    };

    //Game.prototype.tearDown()

    Game.prototype.layHouses = function() {
        var numOfHouses  = this.housesNo,
            yPos = this.housesYPos,
            n = numOfHouses - 1,
            interval = this.$container.width() / numOfHouses,
            start = interval / 2;
        this.houses = [];
        while (n >= 0) {
            this.houses[n] = new House();
            this.appendObject(this.houses[n]);
            this.houses[n].el.css('left', start + interval * n);
            this.houses[n].el.css('top', yPos);
            this.houses[n].el.attr('id', 'h' + n);
            n--;
        }
    };

    Game.prototype.checkImpactOnCannon = function(bullet) {
        var bulPos = bullet.el.position();
        var bulW = bullet.el.width();
        var cannon = this.cannon.el;
        var pos = cannon.position();
        if (bulPos.top <= pos.top + cannon.height() &&
            bulPos.top >= pos.top &&
            bulPos.left >= pos.left &&
            bulPos.left <= pos.left + cannon.width()) {
            return true;
        }
        return false;
    };

    Game.prototype.checkImpactOnAliens = function(bullet) {
    //    if (isCannon) {

            var bulPos = bullet.el.position();
            var bulW = bullet.el.width();

            var xtrTop = this.xtremes.topMostLeftMost;
            var xtrBottom = this.xtremes.bottomMostRightMost;

            var alienH = this.alienH;
            var alienW = this.alienW;

            var distanceBetweenAliens = this.distanceBetweenAliens;

            var type, num;

            if(bulPos.left > xtrTop.left &&
                bulPos.left < xtrBottom.left + alienW &&
                bulPos.top > xtrTop.top &&
                bulPos.top < xtrBottom.top + alienH ) {
                // the bullet is at least in the "sensitive" area.
                // now let's fine grain it


                // while smart, the matrix approach would need a collection. Or me to rewrite a few things.
                // which I may do, but not right now
                if ((((bulPos.left-xtrTop.left) % (alienW + distanceBetweenAliens)) <= alienW) &&
                    (((bulPos.top-xtrTop.top) % (alienH + distanceBetweenAliens))) <= alienH) {
                    type = Math.floor((bulPos.top-xtrTop.top) / (alienH + distanceBetweenAliens));
                    num = Math.floor((bulPos.left-xtrTop.left) / (alienW + distanceBetweenAliens));
                    // el.attr('id','al_' + a + '_' + i);
                    if ($('#al_' + type + '_' + num).length) {
                        console.warn('hit', type, num);
                        return {
                            type : type,
                            num : num
                        };
                    }
                }
            }

        return false;
    };

    Game.prototype.blastAllTheAliens = function() {
        this.aliens.forEach(function(ar, v) {
            ar.forEach(function(alien, val) {
                this.neutraliseAlien(alien);
            }, this);
        }, this);
        this.aliens = [];
    };

    Game.prototype.blastAllTheHouses = function() {
        this.houses.forEach(function(h, key) {
            this.popHouse(key);
        }, this);
        this.houses = [];
    };

    Game.prototype.gameOver = function() {
        this.blastAllTheAliens();
        this.blastAllTheHouses();
        this.$container.empty();
        this.$container.html('game over!');
    };

    Game.prototype.checkImpactOnHouses = function(bullet) {
        var bulPos = bullet.el.position();
        var bulW = bullet.el.width();
        var noH, dist, step;
        step = this.$container.width() / this.housesNo;
        if (bulPos.top <= this.housesYPos + this.housesH &&
            bulPos.top >= this.housesYPos) {
            // the bullet is in the houses row
            // we know from the start where the houses are
            noH = this.housesNo - 1;

            while (noH >= 0) {
                dist = step / 2 + step * noH;
                if (bulPos.left >= dist && bulPos.left <= dist + this.housesW) {
                    return {
                        type : 'house',
                        num : noH
                    };
                }
                noH--;
            }
        }
        return false;
    };

    Game.prototype.layField = function() {
        var rowSize = this.aliensPerRow,
            alienTypes = this.alienTypes,
            el,
            i = 0, iLen = rowSize,
            a = 0, aLen = alienTypes.length;
        for (; a < aLen ; a++) {
            this.aliens[a] = [];
            for (i = 0; i < iLen ; i++) {
                this.aliens[a][i] = new Alien(alienTypes[a]);
                this.aliens[a][i].subscribe('alienWannaFire', this.fire, this);
                this.appendObject(this.aliens[a][i]);
                el = this.aliens[a][i].el;
                el.attr('id','al_' + a + '_' + i);
                el.css('top', a * (this.distanceBetweenAliens + this.alienH) + this.offsetOfAlienField);
                el.css('left', i * (this.distanceBetweenAliens + this.alienW) + this.offsetOfAlienField);
            }
        }
        this.setXtremes();
    };

    Game.prototype.setXtremes = function() {
        this.xtremes.topMostLeftMost = this.aliens[0][0].el.position();
        this.xtremes.bottomMostRightMost = this.aliens[this.alienTypes.length-1][this.aliensPerRow-1].el.position();
    };

    Game.prototype.updateXtremes = function(isLeft, stepDown) {
        if (isLeft) {
            this.xtremes.topMostLeftMost.left++;
            this.xtremes.bottomMostRightMost.left++;
        } else {
            this.xtremes.topMostLeftMost.left--;
            this.xtremes.bottomMostRightMost.left--;
        }
        if (stepDown) {
            this.xtremes.topMostLeftMost.top+=stepDown;
            this.xtremes.bottomMostRightMost.top+=stepDown;
            if (this.xtremes.bottomMostRightMost.top >= this.housesYPos - 10) {
                this.aliens.forEach(function(ar, index) {
                    if(!ar.length) {
                        return;
                    }
                    if((ar[0].el.position().top+this.alienH) >= this.housesYPos) {
                        this.houses.forEach(function(val, key) {
                            this.degradeHouse({num : val});
                        }, this);
                    }
                }, this);
            }
        }
    };

    Game.prototype.popHouse = function(index) {
        if (!this.houses.length) {
            this.gameOver();
            return;
        }
        var house = this.houses[index];
        (house && house.el) && house.el.remove();
        this.houses[index] = null;
        house = null;
        this.housesCounter--;
    };

    Game.prototype.layCannon = function() {
        this.cannon = new Cannon();
        this.appendObject(this.cannon);
    };

    Game.prototype.appendObject = function(obj, container) {
        var $container = container || this.$container;
        obj.el = $container.appendOne(obj.el);
        obj.inDom = true;
    };

    Game.prototype.attachFieldEvents = function() {
        var _self = this;
        $(document).keydown(function(ev) {
            _self.onKeyDown(ev);
        });
        $(document).keyup(function(ev) {
            _self.onKeyUp(ev);
        });
    };

    Game.prototype.layRemainingLives = function() {
        var lives = this.lives - 1 - 1,
            cannon;
        while (lives >= 0) {
            cannon = $('#lives').appendOne(this.cannon.el.clone());
            cannon.css({
                top : 10,
                right : (10 + lives * 30)
            });
            lives--;
        }
    };

    Game.prototype.updatePointsCounter = function(p) {
        p && (points+=p);
        $('#points').text('Level '+ level + ' - points ' + points);
    };

    Game.prototype.startClock = function() {
        var interval = 50,
            _self = this,
            stepsInEitherDirection = 200,
            currentStep = stepsInEitherDirection,
            left = true,
            moveDown = false,
            clockInterval,
            onClock;
        this.subscribe('oneAlienLess', function(alObj) {
            if (this.wasThatLastAlien()) {
                this.onScreenCompleted();
            }
            interval-=2;
        });
        this.subscribe('oneCannonLess', function() {
            window.cancelAnimationFrame(clockInterval);
            _self.aliens.forEach(function(ar) {
                ar.forEach(function(val, key) {
                    val.stopFire();
                });
            });
        });
        this.subscribe('restartClock', function() {
            onClock();
            _self.aliens.forEach(function(ar) {
                ar.forEach(function(val, key) {
                    val.restartFire();
                });
            });
        });
        onClock = function() {
            _self.moveAliens(left, moveDown);
            currentStep--;
            if (!currentStep) {
                left = !left;
                moveDown = true;
                currentStep = stepsInEitherDirection;
            } else {
                moveDown = false;
            }
            clockInterval = window.requestAnimationFrame(onClock);
        };
        onClock();

    };

    Game.prototype.onScreenCompleted = function() {
        this.blastAllTheAliens();
        this.blastAllTheHouses();
        this.$container.empty();
        this.animateMessage('Well done!', function() {
            this.animateMessage('Level ' + (level + 1), function() {
                this.advanceLevel();
            });
        })
    };

    Game.prototype.advanceLevel = function() {
        level++;
        this.updatePointsCounter(100);
        variance-=2000;
        this.setup();
    };

    Game.prototype.wasThatLastAlien = function() {
        var wasLast = true;
        this.aliens.forEach(function(ar, iter) {
            if (ar.length) {
                wasLast = false;
            }
        });
        return wasLast;
    };

    Game.prototype.moveAliens = function(left, moveDown) {
        var value = left ? '+=1' : '-=1',
            al = this.aliens,
            stepDown = 10,
            a = al.length - 1, i;

        while(a >= 0) {
            i = al[a].length - 1;
            while (i >= 0) {
                al[a][i].el.css('left', value);
                if (moveDown) {
                    al[a][i].el.css('top', '+=' + stepDown);
                }
                i--;
            }
            a--;
        }
        this.updateXtremes(left, (moveDown? stepDown : 0));
    };

    Game.prototype.blastBullet = function(bullet) {
        window.cancelAnimationFrame(bullet.interval);
        bullet.el.remove();
        bullet.inDom = false;
        bullet.unsubscribeAll();
        bullet = null;
    };

    Game.prototype.fire = function(origin) {
        var bullet = new Bullet(this.$containerH, this.containerW),
            shooter = origin === 'cannon' ? this.cannon : origin,
            posit = shooter.el.position();
        this.appendObject(bullet);
        bullet.el.css('left', parseInt(posit.left + shooter.el.width() / 2, 10) );
        bullet.el.css('top', parseInt(posit.top, 10));
        bullet.subscribe('checkMeImpact', function(bullet) {
            var alObj = this.checkImpactOnHouses(bullet);

            if(!alObj) {
                if (origin === 'cannon') {
                    alObj = this.checkImpactOnAliens(bullet);
                    if (alObj) {
                        this.blastBullet(bullet);
                        this.blastAlien(alObj);
                        this.publish('oneAlienLess', alObj);
                    }
                } else {
                    alObj = this.checkImpactOnCannon(bullet);
                    if (alObj) {
                        this.blastBullet(bullet);
                        this.blastCannon();
                        this.publish('oneCannonLess');
                    }
                }
            } else {
                this.degradeHouse(alObj);
            }

        }, this);
        bullet.subscribe('outOfBoundaries', function() {
            bullet.unsubscribeAll();
            bullet = null;
        }, this);
        bullet.subscribe('impacted', function(alObj) {
            if (alObj.type == 'house') {
                this.degradeHouse(alObj);
            } else if (alObj.type == 'cannon') {
                this.blastCannon();
                this.publish('oneCannonLess');
            } else {
                this.blastAlien(alObj);
                this.publish('oneAlienLess', alObj);
            }
            bullet.unsubscribeAll();
            bullet = null;
        }, this);
        bullet.fire(origin);
    };

    Game.prototype.blastCannon = function() {
        this.cannon.el.remove();
        this.lives--;
        this.onDiminishingLives();
    };

    Game.prototype.onDiminishingLives = function() {
        if (this.lives) {
            this.animateMessage('Ouch!', function() {
                $('#lives .cannon').first().remove();
                this.layCannon();
                this.publish('restartClock');
            });
        } else {
            this.gameOver();
            this.animateMessage('Game over');
        }
    };

    Game.prototype.animateMessage = function(message, callback) {
        this.$container.append('<div id="message">' + message + '</div>');
        $('#message').addClass('animation');
        var _self = this;
        var wait = window.setTimeout(function() {
            $('#message').remove();
            callback && callback.call(_self);
        }, 3000);
    };

    Game.prototype.neutraliseAlien = function(alien) {
        window.clearTimeout(alien.timeout);
    };

    Game.prototype.blastAlien = function(alObj) {
        var alienId = 'al_' + alObj.type + '_' + alObj.num,
            removedAlien,
            a = this.aliens.length - 1, i;

        $('#' + alienId).remove();


        // probably better to keep the el references into a map but for the moment being that will do
        while (a >= 0) {
            i = this.aliens[a].length - 1;
            while (i >= 0) {
                if (this.aliens[a][i].el.attr('id') === alienId) {
                    this.neutraliseAlien(this.aliens[a][i]);
                    removedAlien = this.aliens[a].splice(i, 1)[0];
                    this.updatePointsCounter(removedAlien.points);
                    removedAlien = null;
                    return;
                }
                i--;
            }
            a--;
        }
    };

    Game.prototype.degradeHouse = function(alObj) {
        var house = this.houses[alObj.num],
            newClass;
        if (!house) {
            return;
        }
        if (house.currentClass == 'h6') {
            this.popHouse(alObj.num);
            if (!this.housesCounter) {
                this.gameOver();
            }
        } else {
            house.el.removeClass(house.currentClass);
            newClass = 'h' + (1 + 1* house.currentClass.split('')[1]);
            house.el.addClass(newClass);
            house.currentClass = newClass;
        }

    };

    Game.prototype.moveCannon = function(left) {
        var _self = this;
        this.cannonMovingDirection = left ? 'left' : 'right';
        this.cannonMoving = window.setInterval(function() {
            if (left) {
                if (parseInt(_self.cannon.el.css('left'), 10) > 0) {
                    _self.cannon.el.css('left', '-=7');
                }
            } else {
                if ((parseInt(_self.cannon.el.css('left'), 10) + _self.cannon.el.width()) < _self.$container.width()) {
                    _self.cannon.el.css('left', '+=7');
                }
            }
        }, 30);
    };

    Game.prototype.stopCannon = function() {
        window.clearInterval(this.cannonMoving);
        this.cannonMoving = null;
    };

    Game.prototype.onKeyUp = function(ev) {
        switch(ev.keyCode) {
            case 37:
            case 39:
                this.stopCannon();
                break;
        }
    };

    Game.prototype.onKeyDown = function(ev) {
        switch(ev.keyCode) {
            case 32:
                SP.throttle('fire', this.fire, this, 800, 'cannon');
                break;
            case 37:
                if (this.cannonMovingDirection === 'right') {
                    this.stopCannon();
                }
                if (!this.cannonMoving) {
                    this.moveCannon(true);
                }
                break;
            case 39:
                if (this.cannonMovingDirection === 'left') {
                    this.stopCannon();
                }
                if (!this.cannonMoving) {
                    this.moveCannon(false);
                }
                break;
        }
    };

    return Game;

});
