const fs = require("fs-extra");
const path = require("path");

let writeTimeout = null;
let pendingConfig = null;

function saveConfig(config, immediate = false) {
    const configPath = global.client?.dirConfig || path.join(process.cwd(), "config.json");
    
    if (!config || typeof config !== "object") {
        throw new Error("Invalid config object");
    }

    if (!config.prefix || !config.language) {
        throw new Error("Config missing required fields (prefix, language)");
    }

    pendingConfig = config;

    if (immediate) {
        if (writeTimeout) {
            clearTimeout(writeTimeout);
            writeTimeout = null;
        }
        return writeConfigToFile(configPath);
    }

    if (writeTimeout) {
        return;
    }

    writeTimeout = setTimeout(() => {
        writeConfigToFile(configPath);
        writeTimeout = null;
    }, 500);
}

function writeConfigToFile(configPath) {
    if (!pendingConfig) return;
    
    try {
        const backupPath = configPath + ".backup";
        if (fs.existsSync(configPath)) {
            fs.copyFileSync(configPath, backupPath);
        }
        
        fs.writeFileSync(configPath, JSON.stringify(pendingConfig, null, 2));
        pendingConfig = null;
        return true;
    } catch (err) {
        console.error("Error saving config:", err);
        throw err;
    }
}

function getConfig() {
    const configPath = global.client?.dirConfig || path.join(process.cwd(), "config.json");
    return fs.readJsonSync(configPath);
}

function updateConfigField(fieldPath, value) {
    const config = global.GoatBot?.config || getConfig();
    
    const keys = fieldPath.split(".");
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    saveConfig(config, true);
    return config;
}

function addToArray(fieldPath, value) {
    const config = global.GoatBot?.config || getConfig();
    
    const keys = fieldPath.split(".");
    let current = config;
    
    for (let i = 0; i < keys.length; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = i === keys.length - 1 ? [] : {};
        }
        if (i === keys.length - 1) {
            if (!Array.isArray(current[keys[i]])) {
                throw new Error(`${fieldPath} is not an array`);
            }
            if (!current[keys[i]].includes(value)) {
                current[keys[i]].push(value);
            }
        } else {
            current = current[keys[i]];
        }
    }
    
    saveConfig(config, true);
    return config;
}

function removeFromArray(fieldPath, value) {
    const config = global.GoatBot?.config || getConfig();
    
    const keys = fieldPath.split(".");
    let current = config;
    
    for (let i = 0; i < keys.length; i++) {
        if (!current[keys[i]]) {
            return config;
        }
        if (i === keys.length - 1) {
            if (!Array.isArray(current[keys[i]])) {
                throw new Error(`${fieldPath} is not an array`);
            }
            const index = current[keys[i]].indexOf(value);
            if (index !== -1) {
                current[keys[i]].splice(index, 1);
            }
        } else {
            current = current[keys[i]];
        }
    }
    
    saveConfig(config, true);
    return config;
}

module.exports = {
    saveConfig,
    getConfig,
    updateConfigField,
    addToArray,
    removeFromArray
};
