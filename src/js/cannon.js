define(['jquery', "src/js/accessories"], function ($, SP) {
    var Cannon = function() {
        this.el = '<div class="cannon"></div>';
        this.inDom = false;
    };
    return Cannon;
});