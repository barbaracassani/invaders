define(['jquery'], function ($) {

    'use strict';

    var SP =  {};

    /**
     * Expects receiver + methods as arguments
     */
    SP.mixin = function() {
        if (arguments.length < 2) {
            throw new Error("This mixin expect at least 3 arguments, receiver and augmentator, and a method name");
        }

        var args = Array.prototype.slice.apply(arguments),
        target = args.shift(),
        source = args.shift(),
        methodNames = args,
        len = methodNames.length - 1;

        while(len >= 0) {
            target[methodNames[len]] = source[methodNames[len]];
            len--;
        }
    };

    SP.makeObservable = function(target) {
        SP.mixin(target, this, 'publish', 'subscribe', 'unsubscribe', 'unsubscribeAll');
    };

    SP.uuid = function(seed) {
        var s = seed || 's';
        return s +
            (Math.random() * 1000).toString().substr(0,4) +
            (new Date().valueOf().toString().substr(8));
    };

    SP.publish = function(event, args) {
        var callbacks,
            len,
            l, scope;

        this.listeners = this.listeners || {};
        callbacks = this.listeners[event];
        len = callbacks? callbacks.length : 0;

        if (!callbacks || !len) {
            return;
        }
        l = len-1;
        while (l >= 0) {
            scope = callbacks[l].scope || this;
            callbacks[l].callback.call(scope, args);
            l--;
        }
    };

    SP.subscribe = function(event, callback, scope) {
        var listeners,
            token = SP.uuid('event');

        this.listeners = this.listeners || {};

        listeners = this.listeners;
        listeners[event] = listeners[event] || [];

        listeners[event].push({
            callback : callback,
            scope : scope,
            token : token
        });
        return token;
    };

    SP.unsubscribeAll = function(event) {
        if (event) {
            delete this.listeners[event];
        } else {
            delete this.listeners;
        }
    };

    SP.unsubscribe = function(event, token) {

        var listeners,
            len;

        this.listeners = this.listeners || {};
        listeners = this.listeners;

        listeners[event] = listeners[event] || [];
        len = listeners[event].length;
        while (len >= 0) {
            if (listeners[event][len].token === token) {
                listeners[event].splice(len,1);
                return;
            }
        }

    };

    SP.throttles = {};

    SP.throttle = function(id, func, scope, time, params) {
        if (SP.throttles[id]) {
            return;
        }
        func.call(scope, params);
        SP.throttles[id] = window.setTimeout(function() {
            window.clearTimeout(SP.throttles[id]);
            delete SP.throttles[id];
        }, time);
    };

    /**
     * Truly annoyed by jQuery returning the container and not the appendee, unlike vanilla js.
     * That will teach it :PPP
     */
    $.fn.extend({
        appendOne : function(child) {
            var el = $(child);
            return $(this[0].appendChild(el[0]));
        }
    });

    /**
     * Stubbing the console when it's not around
     * @type {Function}
     */
    window.console = window.console || {};
    ['log', 'warn', 'error', 'assert', 'info', 'debug'].forEach(function(value, iterator) {
        !window.console[value] && (window.console[value] = function(){});
    });



    /**
     * Polyfill for requestAnimationFrame
     */
    window.requestAnimationFrame = (function(){
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    window.cancelAnimationFrame = (function() {
        return window.cancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            function(id) {
                window.clearTimeout(id);
            };
    })();

    return SP;

});