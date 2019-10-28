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
        pattern: "*://www.awin1.com/cread.php?*",
        handler: GenericParameterHandler("p")
    },
    {
        pattern: "*://shareasale.com/*",
        handler: GenericParameterHandler("urllink")
    },
    {
        pattern: "*://www.googleadservices.com/pagead/aclk?*",
        handler: GenericParameterHandler("adurl")
    },
    {
        pattern: "*://track.effiliation.com/servlet/effi.redir?*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://*.evyy.net/c/*",
        handler: GenericParameterHandler("u")
    },
    {
        pattern: "*://www.dpbolvw.net/click*",
        handler: GenericParameterHandler("url")
    },
    {
        pattern: "*://mailtracking.gitter.im/track/click/*",
        handler: TrailingSegmentHandler("/")
    },
    {
        pattern: "*://track.webgains.com/click.html?*",
        handler: TrailingSegmentHandler("wgtarget=")
    },
    {
        pattern: "*://ad.admitad.com/*",
        handler: TrailingSegmentHandler("ulp=")
    },
    {
        pattern: "*://clickserve.dartsearch.net/link/click?*",
        handler: TrailingSegmentHandler("ds_dest_url=")
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

function parseQueryString(fullUrl) {
    const queryStringStart = fullUrl.lastIndexOf("?");

    if (queryStringStart === -1) {
        return {};
    }

    if (queryStringStart == fullUrl.length - 1) {
        return {};
    }

    const queryString = fullUrl.substring(
        queryStringStart + 1
    );

    const parameters = queryString.split("&");

    var parametersObj = {};
    for (var i = 0; i < parameters.length; i++) {
        const pair = parameters[i].split("=");

        const key = pair[0] ? decodeURIComponent(pair[0]) : "";
        const value = pair[1] ? decodeURIComponent(pair[1]) : "";

        const savedValue = parametersObj[key];
        const savedValueType = typeof savedValue;

        if (savedValueType === "undefined") {
            parametersObj[key] = value;
        } else if (savedValueType === "string") {
            parametersObj[key] = [savedValue, value];
        } else if (savedValueType === "object") {
            parametersObj[key].push(value);
        }
    }
    return parametersObj;
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
    if (!redirectUrl) {
        return null;
    }

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

        if (extractedRedirectUrl) {
            const redirectUrl = processRedirectUrl(extractedRedirectUrl);

            console.log("Redirecting %s to %s...", 
                details.url, redirectUrl
            );
            return { redirectUrl: redirectUrl };
        } else {
            console.log("Could not handle %s",
                details.url
            );
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

// If running under Chrome
if (typeof chrome !== "undefined") {
    initialize();
}

// If running under NodeJS
if (typeof module !== "undefined") {
    module.exports = {
        GenericParameterHandler,
        TrailingSegmentHandler,
        TradeDoublerHandler,
    
        processHandlers,
        registerListener,
        findHandlerFor,
        processRedirectUrl,
        parseQueryString,
        pluck,
        handlers,
    }
}
