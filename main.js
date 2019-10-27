// Works with query string parameters
const GenericParameterHandler = function (parameterName) {
    return {
        // return null if fail, or redirect url
        handle: function (details) {
            let parsedQueryString = parseQueryString(details.url);
            let targetUrl = parsedQueryString[parameterName];
            return targetUrl;
        }
    }
}

const GitterMailTrackingHandler = function () {
    return {
        handle: function (details) {
            let encodedSegment = details.url.substring(
                details.url.lastIndexOf('/') + 1
            );

            return encodedSegment ? 
                "https://" + decodeURIComponent(encodedSegment) : 
                null;
        }
    }
}

const TradedoublerHandler = function () {
    return {
        handle: function (details) {
            let targetUrl = details.url.substring(
                details.url.lastIndexOf("url(") + 4,
                details.url.lastIndexOf(")")
            );

            return targetUrl ? 
                decodeURIComponent(targetUrl) : 
                null 
        }
    }
}

const WebGainsHandler = function () {
    return {
        handle: function (details) {
            let encodedSegment = details.url.substring(
                details.url.lastIndexOf("wgtarget=") + 9
            );

            return encodedSegment ? 
                decodeURIComponent(encodedSegment) : 
                null;
        }
    }
}

const AdmitadHandler = function () {
    return {
        handle: function (details) {
            let encodedSegment = details.url.substring(
                details.url.lastIndexOf("ulp=") + 4
            );

            return encodedSegment ? 
                decodeURIComponent(encodedSegment) : 
                null;
        }
    }
}

// Register handlers for websites here
const handlers = processHandlers([
    {
        pattern: "*://track.effiliation.com/servlet/effi.redir?*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://mailtracking.gitter.im/track/click/*",
        handler: GitterMailTrackingHandler()
    },
    {
        pattern: "*://clkuk.tradedoubler.com/click?*",
        handler: TradedoublerHandler()
    },
    {
        pattern: "*://clkde.tradedoubler.com/click?*",
        handler: TradedoublerHandler()
    },
    {
        pattern: "*://clk.tradedoubler.com/click?*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://track.webgains.com/click.html?*",
        handler: WebGainsHandler() // they don't encode the url, so cannot use GenericParameterHandler
    },
    {
        pattern: "*://www.awin1.com/cread.php?*",
        handler: GenericParameterHandler("p")
    },
    {
        pattern: "*://ad.admitad.com/*",
        handler: AdmitadHandler("ulp")
    },
]);

// Converts wildcard patterns to regex patterns when creating the handlers array
function processHandlers(handlers) {
    return handlers.map(function (entry) {
        entry._regex = new RegExp(
            "^" + // start of line
            entry.pattern.replace(/\*/g, "[^ ]*") + // replace wildcards with regex
            "$" // end of line
        );
        return entry;
    })
}

// From https://stackoverflow.com/a/979995/4673065
// camelCase 'd for consistency's sake
function parseQueryString(query) {
    var vars = query.split("&");
    var queryString = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        // If first entry with this name
        if (typeof queryString[key] === "undefined") {
            queryString[key] = decodeURIComponent(value);
            // If second entry with this name
        } else if (typeof queryString[key] === "string") {
            var arr = [queryString[key], decodeURIComponent(value)];
            queryString[key] = arr;
            // If third or later entry with this name
        } else {
            queryString[key].push(decodeURIComponent(value));
        }
    }
    return queryString;
}

// Tries to match a handler regex pattern to the current url
// then returns the handler function for the found entry, or null
function findHandlerFor(details) {
    let entry = handlers.find(function (obj) {
        return obj._regex.test(details.url)
    });

    return entry ? entry.handler : null;
}

// 
function registerListener() {
    chrome.webRequest.onBeforeRequest.addListener(function (details) {
        const matchingHandler = findHandlerFor(details);
        const redirectUrl = matchingHandler.handle(details);

        if (redirectUrl) {
            console.log("Redirecting %s to %s...", 
                details.url, redirectUrl
            );
            return { redirectUrl: redirectUrl };
        } else {
            console.log("Could not handle %s, blocking it...",
                details.url
            );
            return { cancel: true };
        }
    },
        { urls: pluck(handlers, "pattern") }, // only process urls we know we have handlers for
        ['blocking'] // not async, so it allows to modify the outcome of the request
    );
}

// Takes a property from every element in the array
function pluck(array, key) {
    return array.map(function (obj) {
        return obj[key];
    });
}

// Handle errors, say something, etc...
function initialize() {
    console.log('Initializing NoTrackers...');
    registerListener();
}

(function () {
    initialize();
})();
