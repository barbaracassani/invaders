define(['jquery', "src/js/accessories"], function ($, SP) {
    var House = function() {
        this.el = '<div class="house h1"></div>';
        this.inDom = false;
        this.currentClass = 'h1';
    };
    return House;
});