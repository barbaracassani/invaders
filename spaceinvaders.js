var SpaceInvaders = SpaceInvaders || {};
(function($, SP) {
    var Game = function() {
        this.$container = $('#gamefield');
        this.housesYPos = this.$container.height() - 100;
        this.housesH = 20;
        this.housesW = 20;
        this.housesNo = 5;
        this.aliens = [];
        SP.makeObservable(this);
        this.layField();
        this.layCannon();
        this.layHouses();
        this.attachFieldEvents();
        this.startClock();
    };

    var Alien = function(config) {
        this.el = '<div class="alien ' + config.class + '"></div>';
        this.inDom = false;
        this.timeout = window.setTimeout(function() {

        }, 10000);
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

    var EnemyBullet = function() {
        this.el = '<div class="bullet enemy"></div>';
        SP.makeObservable(this);
        this.inDom = false;
        this.checkImpact = function() {

        }
    };


    var Bullet = function() {
        this.el = '<div class="bullet"></div>';
        SP.makeObservable(this);
        this.inDom = false;
        this.checkImpact = function() {
            var al = SP.game.aliens,
                a = al.length - 1, i, alPos, bulPos, alW, bulW, noH, step, dist, onHouse;
            step = SP.game.$container.width() / SP.game.housesNo;
            while(a >= 0) {
                i = al[a].length - 1;
                while (i >= 0) {

                    bulPos = this.el.position();
                    bulW = this.el.width();

                    onHouse = SP.game.checkImpactOnHouses(this);
                    if (onHouse) {
                        return onHouse;
                    };

                    alPos = al[a][i].el.position();
                    alW = al[a][i].el.width();

                    if ((bulPos.left >= alPos.left) &&
                        (bulPos.left <= (alPos.left + alW)) &&
                        (bulPos.top <= (alPos.top + al[a][i].el.height())) &&
                        (bulPos.top >= alPos.top)) {
                        console.warn('boom!')
                        return {
                            type : a,
                            num : i
                        }
                    }

                    i--;
                }
                a--;
            }
            return false;
        };
        this.checkBoundaries = function() {
            return parseInt(this.el.css('top')) < 0;
        };
        this.fire = function() {
            var _self = this, impacted;
            if (this.inDom) {
                this.interval = window.setInterval(function() {
                    _self.el.css('top', '-=7');
                    if (_self.checkBoundaries.call(_self)) {
                        _self.el.detach();
                        window.clearInterval(_self.interval);
                        _self.inDom = false;
                        _self.publish('outOfBoundaries');
                    }
                    impacted = _self.checkImpact.call(_self);
                    if (impacted) {
                        _self.el.detach();
                        window.clearInterval(_self.interval);
                        _self.inDom = false;
                        _self.publish('impacted', impacted);
                    }
                }, 100);
            }
        }
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
        };
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
                    }
                };
                noH--;
            }
        }
        return false;
    };

    Game.prototype.layField = function() {
        var rowSize = 10,
            offset = 100,
            alienTypes = [
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
            ],
            el,
            i = 0, iLen = rowSize,
            a = 0, aLen = alienTypes.length;
        for (; a < aLen ; a++) {
            this.aliens[a] = [];
            for (i = 0; i < iLen ; i++) {
                this.aliens[a][i] = new Alien(alienTypes[a]);
                this.appendObject(this.aliens[a][i]);
                el = this.aliens[a][i].el;
                el.css('top', a * 50 + offset);
                el.css('left', i * 50 + offset);
            }
        }
    };

    Game.prototype.layCannon = function() {
        this.cannon = new Cannon();
        this.appendObject(this.cannon);
    };

    Game.prototype.appendObject = function(obj) {
        obj.el = this.$container.appendOne(obj.el);
        obj.inDom = true;
    };

    Game.prototype.attachFieldEvents = function() {
        var _self = this;
        this.$container.keypress(function(ev) {
            _self.onKeyEvent(ev)
        });
    };

    Game.prototype.startClock = function() {
        var interval = 50,
            _self = this,
            stepsInEitherDirection = 100,
            currentStep = stepsInEitherDirection,
            left = true,
            moveDown = false,
            clockInterval = window.setInterval(function() {
            _self.moveAliens(left, moveDown);
            currentStep--;
            if (!currentStep) {
                left = !left;
                moveDown = true;
                currentStep = stepsInEitherDirection;
            } else {
                moveDown = false;
            }
        }, interval);
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

    Game.prototype.fire = function() {
        var bullet = new Bullet();
        this.appendObject(bullet);
        bullet.el.css('left', parseInt(this.cannon.el.css('left') + this.cannon.el.width() / 2) );
        bullet.el.css('top', parseInt(this.cannon.el.css('top')));
        bullet.subscribe('outOfBoundaries', function() {
            bullet.unsubscribeAll();
            bullet = null;
        }, this);
        bullet.subscribe('impacted', function(alObj) {
            if (alObj.type == 'house') {
                this.degradeHouse(alObj);
            } else {
                this.blastAlien(alObj);
            }
            bullet.unsubscribeAll();
            bullet = null;
        }, this);
        bullet.fire();
    };

    Game.prototype.blastAlien = function(alObj) {
        var alien = this.aliens[alObj.type][alObj.num];
        alien.el.detach();
        window.clearTimeout(alien.timeout);
        this.aliens[alObj.type].splice(alObj.num, 1);
        alien = null;
    };

    Game.prototype.degradeHouse = function(alObj) {
        var house = this.houses[alObj.num], newClass;
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

    Game.prototype.onKeyEvent = function(ev) {
        switch(ev.keyCode) {
            case 0:
                SP.throttle('fire', this.fire, this, 1000, null);
                break;
            case 37:
                if (parseInt(this.cannon.el.css('left')) > 0) {
                    this.cannon.el.css('left', '-=5');
                }
                break;
            case 39:
                if ((parseInt(this.cannon.el.css('left')) + this.cannon.el.width()) < this.$container.width()) {
                    this.cannon.el.css('left', '+=5');
                }
                break;0
        }
    };

    SP.game = new Game();

}(jQuery, SpaceInvaders));
