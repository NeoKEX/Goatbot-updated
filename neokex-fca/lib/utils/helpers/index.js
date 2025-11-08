/* eslint-disable no-prototype-builtins */
"use strict";

const network = require("./axios");
const headers = require("./headers");
const clients = require("./clients");
const constants = require("./constants");
const formatters = require("./formatters"); 
const userAgents = require("./user-agents");
const cheerio = require("cheerio");
const util = require("util");

/**
 * Fetches a URL, scrapes all <script type="application/json"> tags, and returns their parsed content.
 * @param {string} url - The URL to fetch.
 * @param {object} jar - The cookie jar.
 * @param {object} qs - Query string parameters.
 * @param {object} options - Global options.
 * @param {object} ctx - The application context.
 * @param {object} customHeader - Custom headers.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of parsed JSON objects.
 */
async function json(url, jar, qs, options, ctx, customHeader) {
  try {
    const res = await network.get(url, jar, qs, options, ctx, customHeader);
    const body = res.body;
    const $ = cheerio.load(body);
    const scripts = $('script[type="application/json"]');

    if (scripts.length === 0) {
      constants.warn(`No <script type="application/json"> tags found on ${url}`);
      return [];
    }

    const allJsonData = [];
    scripts.each((index, element) => {
      try {
        const jsonContent = $(element).html();
        if (jsonContent) {
          allJsonData.push(JSON.parse(jsonContent));
        }
      } catch (e) {
        constants.warn(`Could not parse JSON from script #${index + 1} on ${url}`);
      }
    });

    return allJsonData;
  } catch (error) {
    constants.error(`Error in utils.json fetching from ${url}:`, error);
    throw error;
  }
}

/**
 * Creates an object with pre-filled request defaults based on HTML and user context.
 * @param {string} html - The HTML content.
 * @param {string|number} userID - The user ID.
 * @param {object} ctx - The context containing session data.
 * @returns {object} An object with .get, .post, and .postFormData methods.
 */
function makeDefaults(html, userID, ctx) {
  let reqCounter = 1;
  const revision = constants.getFrom(html, 'revision":', ",");

  /**
   * Merges provided data with default request parameters.
   * @param {object} obj - The original query or form object.
   * @returns {object} The merged object.
   */
  function mergeWithDefaults(obj) {
    const newObj = {
      av: userID,
      __user: userID,
      __req: (reqCounter++).toString(36),
      __rev: revision,
      __a: 1,
      ...(ctx && {
        fb_dtsg: ctx.fb_dtsg,
        jazoest: ctx.jazoest,
      }),
    };

    if (!obj) return newObj;

    for (const prop in obj) {
      if (obj.hasOwnProperty(prop) && !newObj[prop]) {
        newObj[prop] = obj[prop];
      }
    }

    return newObj;
  }

  return {
    /**
     * Makes a GET request with merged defaults.
     * @param {string} url
     * @param {object} jar
     * @param {object} qs
     * @param {object} ctxx
     * @param {object} [customHeader={}]
     * @returns {Promise<object>}
     */
    get: (url, jar, qs, ctxx, customHeader = {}) =>
      network.get(url, jar, mergeWithDefaults(qs), ctx.globalOptions, ctxx || ctx, customHeader),

    /**
     * Makes a POST request with merged defaults.
     * @param {string} url
     * @param {object} jar
     * @param {object} form
     * @param {object} ctxx
     * @param {object} [customHeader={}]
     * @returns {Promise<object>}
     */
    post: (url, jar, form, ctxx, customHeader = {}) =>
      network.post(url, jar, mergeWithDefaults(form), ctx.globalOptions, ctxx || ctx, customHeader),

    /**
     * Makes a multipart/form-data POST request with merged defaults.
     * @param {string} url
     * @param {object} jar
     * @param {object} form
     * @param {object} qs
     * @param {object} ctxx
     * @returns {Promise<object>}
     */
    postFormData: (url, jar, form, qs, ctxx) =>
      network.postFormData(
        url,
        jar,
        mergeWithDefaults(form),
        mergeWithDefaults(qs),
        ctx.globalOptions,
        ctxx || ctx
      ),
  };
}

module.exports = {
  ...network,
  ...headers,
  ...clients,
  ...constants,
  ...formatters,
  ...userAgents,
  json,
  makeDefaults,
  promisify: (func) => util.promisify(func),
  delay: (ms) => new Promise(r => setTimeout(r, ms))
};