"use strict";

const { randomUserAgent } = require("./user-agents");

/**
 * Generates a comprehensive and realistic set of headers for requests to Facebook.
 * @param {string} url - The target URL.
 * @param {object} options - Global options from context.
 * @param {object} ctx - The application context (containing fb_dtsg, lsd, etc.).
 * @param {object} customHeader - Any extra headers to merge.
 * @returns {object} A complete headers object.
 */
function getHeaders(url, options, ctx, customHeader) {
    const { 
        userAgent, 
        secChUa, 
        secChUaFullVersionList, 
        secChUaPlatform, 
        secChUaPlatformVersion 
    } = randomUserAgent();

    const host = new URL(url).hostname;
    const referer = `https://${host}/`;

    const headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Dpr': '1',
        'Host': host,
        'Origin': `https://${host}`,
        'Referer': referer,
        'Sec-Ch-Prefers-Color-Scheme': 'light',
        'Sec-Ch-Ua': secChUa,
        'Sec-Ch-Ua-Full-Version-List': secChUaFullVersionList,
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Model': '""',
        'Sec-Ch-Ua-Platform': secChUaPlatform,
        'Sec-Ch-Ua-Platform-Version': secChUaPlatformVersion,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': userAgent,
        'Viewport-Width': '1920'
    };

    if (ctx) {
        if (ctx.fb_dtsg) {
            headers['X-Fb-Lsd'] = ctx.lsd;
        }
        if (ctx.region) {
            headers['X-MSGR-Region'] = ctx.region;
        }
        if (ctx.master) {
            const { __spin_r, __spin_b, __spin_t } = ctx.master;
            if (__spin_r) headers['X-Fb-Spin-R'] = String(__spin_r);
            if (__spin_b) headers['X-Fb-Spin-B'] = String(__spin_b);
            if (__spin_t) headers['X-Fb-Spin-T'] = String(__spin_t);
        }
    }
    
    if (customHeader) {
        Object.assign(headers, customHeader);
        if (customHeader.noRef) {
            delete headers.Referer;
        }
    }

    return headers;
}

const meta = (prop) => new RegExp(`<meta property="${prop}" content="([^"]*)"`);

module.exports = {
    getHeaders,
    meta,
};