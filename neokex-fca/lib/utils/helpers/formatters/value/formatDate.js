"use strict";

const { NUM_TO_MONTH, NUM_TO_DAY } = require("../../constants");

/**
 * Formats a Date object into a GMT string.
 * @param {Date} date The date to format.
 */
function formatDate(date) {
    let d = date.getUTCDate();
    d = d >= 10 ? d : "0" + d;
    let h = date.getUTCHours();
    h = h >= 10 ? h : "0" + h;
    let m = date.getUTCMinutes();
    m = m >= 10 ? m : "0" + m;
    let s = date.getUTCSeconds();
    s = s >= 10 ? s : "0" + s;
    return (
        NUM_TO_DAY[date.getUTCDay()] +
        ", " +
        d +
        " " +
        NUM_TO_MONTH[date.getUTCMonth()] +
        " " +
        date.getUTCFullYear() +
        " " +
        h +
        ":" +
        m +
        ":" +
        s +
        " GMT"
    );
}

module.exports = formatDate;