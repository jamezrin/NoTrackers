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

// Works with some string that denotes the start of the url
const TrailingSegmentHandler = function (trailingSegment) {
    return {
        handle: function (details) {
            let encodedSegment = details.url.substring(
                details.url.lastIndexOf(trailingSegment) + trailingSegment.length
            );

            return encodedSegment ? 
                decodeURIComponent(encodedSegment) : 
                null;
        }
    }
}

// Some TradeDoubler domains use a different url structure
const TradeDoublerHandler = function () {
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

// Register handlers for websites here
const handlers = processHandlers([
    {
        pattern: "*://track.effiliation.com/servlet/effi.redir?*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://mailtracking.gitter.im/track/click/*",
        handler: TrailingSegmentHandler("/")
    },
    {
        pattern: "*://clkuk.tradedoubler.com/click?*",
        handler: TradeDoublerHandler()
    },
    {
        pattern: "*://clkde.tradedoubler.com/click?*",
        handler: TradeDoublerHandler()
    },
    {
        pattern: "*://clk.tradedoubler.com/click?*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://track.webgains.com/click.html?*",
        handler: TrailingSegmentHandler("wgtarget=")
    },
    {
        pattern: "*://www.awin1.com/cread.php?*",
        handler: GenericParameterHandler("p")
    },
    {
        pattern: "*://ad.admitad.com/*",
        handler: TrailingSegmentHandler("ulp")
    },
    {
        pattern: "*://shareasale.com/*",
        handler: GenericParameterHandler("urllink")
    }
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

// Adds http protocol if neither http or https are in the url
const PROTOCOL_REGEX = /^(http|https)\:\/\//
function processRedirectUrl(redirectUrl) {
    if (!PROTOCOL_REGEX.test(redirectUrl)) {
        redirectUrl = "http://" + redirectUrl;
    }

    return redirectUrl;
}

// Takes a property from every element in the array
function pluck(array, key) {
    return array.map(function (obj) {
        return obj[key];
    });
}

function registerListener() {
    chrome.webRequest.onBeforeRequest.addListener(function (details) {
        const matchingHandler = findHandlerFor(details);
        const extractedRedirectUrl = matchingHandler.handle(details);
        const redirectUrl = processRedirectUrl(extractedRedirectUrl);

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

// Handle errors, say something, etc...
function initialize() {
    console.log('Initializing NoTrackers...');
    registerListener();
}

(function () {
    initialize();
})();
