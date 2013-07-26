define(['jquery', "src/js/accessories"], function ($, SP) {
    var Alien = function(config) {
        var _self = this,
            variance = 60000;
        this.el = '<div class="alien ' + config.class + '"></div>';
        this.inDom = false;
        this.points = config.points;
        SP.makeObservable(this);
        this.timerizeFire = function() {
            this.timeout = window.setTimeout(function() {
                window.clearTimeout(_self.timeout);
                //SP.game.fire.call(SP.game, _self);
                _self.publish('alienWannaFire', _self);
                variance -= 500;
                _self.timerizeFire();
            }, parseInt(Math.random() * variance, 10) );
        };
        this.timerizeFire();
    };
    return Alien;
});