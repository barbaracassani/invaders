'use strict';

describe("Initialises the game correctly", function() {

    var SpaceInvaders = window.SpaceInvaders || {},
        game;

    beforeEach(function() {
        $('body').append('<div id="gamefield" tabindex="1"><div id="points"></div><div id="lives"></div></div>');
    });

    describe("the aliens", function() {
        beforeEach(function() {
            game = SpaceInvaders.game = new SpaceInvaders.Game();
        });

        it("initialises the aliens correctly", function() {
            expect(game.aliens).not.toBeUndefined();
        });


    });

});