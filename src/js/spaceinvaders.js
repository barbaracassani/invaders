var SpaceInvaders = SpaceInvaders || {};
(function($, SP) {

    'use strict';

    var Game = function() {
        this.$container = $('#gamefield');
        this.housesYPos = this.$container.height() - 100;
        this.housesH = 20;
        this.housesW = 20;
        this.housesNo = 5;
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
                exploding : null
            },
            {
                class : 'bug',
                exploding : null
            },
            {
                class : 'baddies',
                exploding : null
            },
            {
                class : 'nasty',
                exploding : null
            }
        ];

        SP.makeObservable(this);
        this.layField();
        this.layCannon();
        this.layRemainingLives();
        this.layHouses();
        this.attachFieldEvents();
        this.startClock();
    };

    var Alien = function(config) {
        var _self = this,
            variance = 60000;
        this.el = '<div class="alien ' + config.class + '"></div>';
        this.inDom = false;
        this.timerizeFire = function() {
            this.timeout = window.setTimeout(function() {
                window.clearTimeout(_self.timeout);
                SP.game.fire.call(SP.game, _self);
                variance -= 500;
                _self.timerizeFire();
            }, parseInt(Math.random() * variance, 10) );
        };
        this.timerizeFire();
    };

    var Cannon = function() {
        this.el = '<div class="cannon"></div>';
        this.inDom = false;
    };

    var House = function() {
        this.el = '<div class="house h1"></div>';
        this.inDom = false;
        this.currentClass = 'h1';
    };


    var Bullet = function() {
        this.el = '<div class="bullet"></div>';
        SP.makeObservable(this);
        this.inDom = false;
        this.checkImpact = function(isCannon) {
            var al = SP.game.aliens,
                xtr = SP.game.xtremes,
                a = al.length - 1, i, bulPos, bulW, step, onHouse, cannonPos, cannonW, alPos, alW,
                xtrTop, xtrBottom, type, num;

            step = SP.game.$container.width() / SP.game.housesNo;
            onHouse = SP.game.checkImpactOnHouses(this);

            if (onHouse) {
                return onHouse;
            }
            if (isCannon) {

                bulPos = this.el.position();
                bulW = this.el.width();

                xtrTop = xtr.topMostLeftMost.el.position();
                xtrBottom = xtr.bottomMostRightMost.el.position();

                if(bulPos.left > xtrTop.left &&
                    bulPos.left < xtrBottom.left + SP.game.alienW &&
                    bulPos.top > xtrTop.top &&
                    bulPos.top < xtrBottom.top + SP.game.alienH ) {
                    // the bullet is at least in the "sensitive" area.
                    // now let's fine grain it


                    // while smart, the matrix approach would need a collection. Or me to rewrite a few things.
                    // which I may do, but not right now
                    if ((((bulPos.left-xtrTop.left) % (SP.game.alienW + SP.game.distanceBetweenAliens)) <= SP.game.alienW) &&
                        (((bulPos.top-xtrTop.top) % (SP.game.alienH + SP.game.distanceBetweenAliens))) <= SP.game.alienH) {
                        type = Math.floor((bulPos.top-xtrTop.top) / (SP.game.alienH + SP.game.distanceBetweenAliens));
                        num = Math.floor((bulPos.left-xtrTop.left) / (SP.game.alienW + SP.game.distanceBetweenAliens));
                        // el.attr('id','al_' + a + '_' + i);
                        if ($('#al_' + type + '_' + num).length) {
                            return {
                                type : type,
                                num : num
                            };
                        }
                    }
/*                    while(a >= 0) {
                        i = al[a].length - 1;
                        while (i >= 0) {

                            bulPos = this.el.position();
                            bulW = this.el.width();

                            alPos = al[a][i].el.position();
                            alW = this.alienW;

                            if ((bulPos.left >= alPos.left) &&
                                (bulPos.left <= (alPos.left + alW)) &&
                                (bulPos.top <= (alPos.top + this.alienH)) &&
                                (bulPos.top >= alPos.top)) {

                                return {
                                    type : a,
                                    num : i
                                };
                            }

                            i--;
                        }
                        a--;
                    }*/
                }

            } else {
                bulPos = this.el.position();
                bulW = this.el.width();
                cannonPos = SP.game.cannon.el.position();
                cannonW = SP.game.cannon.el.width();
                if ((bulPos.left >= cannonPos.left) &&
                    (bulPos.left <= (cannonPos.left + cannonW)) &&
                    (bulPos.top <= (cannonPos.top + SP.game.cannon.el.height())) &&
                    (bulPos.top >= cannonPos.top)) {
                    return {
                        type : 'cannon',
                        num : null
                    };
                }
            }
            return false;
        };
        this.checkBoundaries = function(isCannon) {
            return isCannon ? parseInt(this.el.css('top'), 10) < 0 :
                parseInt(this.el.css('top'), 10) > SP.game.$container.height();
        };
        this.fire = function(origin) {
            var _self = this, impacted;
            if (this.inDom) {

                this.interval = function() {
                    origin == 'cannon' ? (_self.el.css('top', '-=7')) : (_self.el.css('top', '+=7'));

                    if (_self.checkBoundaries.call(_self, origin === 'cannon')) {
                        _self.el.remove();
                        window.cancelAnimationFrame(_self.interval);
                        _self.inDom = false;
                        _self.publish('outOfBoundaries');
                        return;
                    }
                    impacted = _self.checkImpact.call(_self, origin === 'cannon');
                    if (impacted) {
                        _self.el.remove();
                        window.cancelAnimationFrame(_self.interval);
                        _self.inDom = false;;
                        _self.publish('impacted', impacted);
                        return;
                    }
                    window.requestAnimationFrame(_self.interval);
                };
                this.interval();
            }
        };
    };

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
                if (bulPos.left >= dist && bulPos.left <= dist + SP.game.housesW) {
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
        this.xtremes.topMostLeftMost = this.aliens[0][0];
        this.xtremes.bottomMostRightMost = this.aliens[this.alienTypes.length-1][this.aliensPerRow-1];
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

    Game.prototype.startClock = function() {
        var interval = 50,
            _self = this,
            stepsInEitherDirection = 200,
            currentStep = stepsInEitherDirection,
            left = true,
            moveDown = false,
            clockInterval,
            onClock;
        this.subscribe('oneAlienLess', function() {
            interval-=2;
        });
        this.subscribe('oneCannonLess', function() {
            window.cancelAnimationFrame(onClock);
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

    Game.prototype.moveAliens = function(left, moveDown) {
        var value = left ? '+=1' : '-=1',
            al = this.aliens,
            a = al.length - 1, i;

        while(a >= 0) {
            i = al[a].length - 1;
            while (i >= 0) {
                al[a][i].el.css('left', value);
                if (moveDown) {
                    al[a][i].el.css('top', '+=10');
                }
                i--;
            }
            a--;
        }
    };

    Game.prototype.fire = function(origin) {
        var bullet = new Bullet(),
            shooter = origin === 'cannon' ? this.cannon : origin,
            posit = shooter.el.position();
        this.appendObject(bullet);
        bullet.el.css('left', parseInt(posit.left + shooter.el.width() / 2, 10) );
        bullet.el.css('top', parseInt(posit.top, 10));
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
                this.publish('oneAlienLess');
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

            $('#lives .cannon').first().remove();
            this.layCannon();
            this.publish('restartClock');

        } else {
            console.warn('game over');
        }
    };

    Game.prototype.blastAlien = function(alObj) {
        var alienId = 'al_' + alObj.type + '_' + alObj.num,
            a = this.aliens.length - 1, i;

        $('#' + alienId).remove();


        // probably better to keep the el references into a map but for the moment being that will do
        while (a >= 0) {
            i = this.aliens[a].length - 1;
            while (i >= 0) {
                if (this.aliens[a][i].el.attr('id') === alienId) {
                    window.clearTimeout(this.aliens[a][i].timeout);
                    this.aliens[a].splice(i, 1);
                    return;
                    /*if (!this.aliens[a].length) {
                        this.aliens.splice(a, 1);
                    }*/
                }
                i--;
            }
            a--;
        }
    };

    Game.prototype.degradeHouse = function(alObj) {
        var house = this.houses[alObj.num], newClass;
        if (!house) {
            return;
        }
        if (house.currentClass == 'h6') {
            house.el.remove();
            this.houses.splice(alObj.num, 1);
            house = null;
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
                SP.throttle('fire', this.fire, this, 1000, 'cannon');
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

    SP.Game = Game;

}(jQuery, SpaceInvaders));
