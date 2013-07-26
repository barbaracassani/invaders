define(['jquery', "src/js/accessories"], function ($, SP) {
    var Bullet = function(containerH, containerW) {
        this.el = '<div class="bullet"></div>';
        SP.makeObservable(this);
        this.containerH = containerH;
        this.containerW = containerW;
        this.inDom = false;

    };
    Bullet.prototype.checkBoundaries = function(isCannon) {
        return isCannon ? parseInt(this.el.css('top'), 10) < 0 :
            parseInt(this.el.css('top'), 10) > this.containerH;
    };
    Bullet.prototype.fire = function(origin) {
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

                _self.publish('checkMeImpact', _self, origin);

                window.requestAnimationFrame(_self.interval);
            };
            this.interval();
        }
    };

    return Bullet;
});