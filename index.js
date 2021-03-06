'use strict';

var xde = require('cross-domain-events');

var itemStorage = {
    items: [],
    add: function(item) {
        this.items.push(item);
    },
    getById: function(id) {
        return this.items.filter(function(item) {
            return item.id === id;
        })[0];
    }
};

var replaceWithPostscribe = function(item, html) {
    if(typeof global.postscribe === 'function') {

        if(typeof window.adtech !== 'undefined' && typeof window.burtApi !== 'undefined') {

            var campaignId = (window.adtech.flightId || '') + '_' + (window.adtech.bannerId || '');
            var burtUnit = window.burtApi.trackByNode(item.iframe, {
                name : item.name
            });
            burtUnit.connect('burt.campaign', 'campaign-id', campaignId);
            burtUnit.connect('burt.campaign', 'creative-id', campaignId);
            burtUnit.connect('sch_no.placement', 'placement-id', (window.adtech.placementId || ''));

        }

        item.iframe.remove();
        item.options.container.innerHTML = '';
        global.postscribe(item.options.container, html ? html : '<script src="' + item.options.url + '"></script>', item.options.postscribeOptions);
    }
    else {
        throw new Error('Gardr Postscribe plugin: window.postscribe is ' + typeof global.postscribe + ', expected function');
    }
};

var gardrPostscribe = function(gardrPluginApi) {

    // replacement with postscribe set as an option
    gardrPluginApi.on('item:beforerender', function(item) {
        if(item.options.postscribe === true) {
            setTimeout(function() { // wait until iframe is in the DOM to remove it
                replaceWithPostscribe(item);
            }, 0);
        }
        else {
            itemStorage.add(item);
        }
    });

    // replacement with postscribe requested from inside of iframe
    xde.on('plugin:postscribe', function(msg) {
        var item = itemStorage.getById(msg.data.id);

        if(item) {
            replaceWithPostscribe(item, msg.data.html);
        }
    });

};

module.exports = gardrPostscribe;
