'use strict';
define(['src/js/spaceinvaders'], function(Game) {
    describe("Starts and ends the game correctly", function() {

        $('body').append('<div id="gamefield" tabindex="1" style="height:200px;width:200px"><div id="points"></div><div id="lives"></div></div>');
        var game = new Game();

        describe("the aliens", function() {


            it("initialises the aliens correctly", function() {
                expect(game.aliens).not.toBeUndefined();
                expect(game.aliens.length).toEqual(game.alienTypes.length);
                expect(game.aliens[0].length).toEqual(game.aliensPerRow);
            });

            it("sets up the houses", function() {
                expect(game.houses).not.toBeUndefined();
                expect(game.houses.length).toEqual(game.housesNo);
            });

        });

    });
});