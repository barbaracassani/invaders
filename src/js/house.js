define(['jquery', "src/js/accessories"], function ($, SP) {
    var House = function() {
        this.el = '<div class="house h1"><svg width="50" height="50"><g><path stroke="#000000" ' +
            'fill="red" transform="translate(-10)" stroke-width="1" stroke-dasharray="null" stroke-linejoin="null" ' +
            'stroke-linecap="null" d="m36.06227,36.74998l-26.74949,0l0.08306,-20.61815l-6.64584,0.08521l20.02056,-13.71703l19.85444,13.80224l-6.64584,0l0.08306,20.44776l0.00006,-0.00002z" id="svg_14"/>' +
            '</g></svg></div>';
        this.inDom = false;
        this.currentClass = 'h1';
    };
    return House;
});