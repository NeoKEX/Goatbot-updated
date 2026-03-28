const chalk = require('chalk');
const path = require('path');
const { log, createOraDots, getText } = global.utils;

module.exports = async function (api, createLine) {
        // ———————————————————— LOAD DATA ———————————————————— //
        console.log(chalk.hex("#f5ab00")(createLine("DATABASE")));
        const controller = await require(path.join(__dirname, '..', '..', 'database/controller/index.js'))(api); // data is loaded here
        const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize } = controller;
        log.info('DATABASE', getText('loadData', 'loadThreadDataSuccess', global.db.allThreadData.filter(t => t.threadID.toString().length > 15).length));
        log.info('DATABASE', getText('loadData', 'loadUserDataSuccess', global.db.allUserData.length));
        // ———————————————————— OPTIMIZED AUTO SYNC ———————————————————— //
        if (api && global.GoatBot.config.database.autoSyncWhenStart == true) {
                console.log(chalk.hex("#f5ab00")(createLine("AUTO SYNC")));
                const spin = createOraDots(getText('loadData', 'refreshingThreadData'));

                try {
                        api.setOptions({ logLevel: 'silent' });
                        spin._start();

                        // OPTIMIZATION: Use batched loading instead of fetching all at once
                        const BATCH_SIZE = 100; // Optimal batch size for FCA
                        const MAX_THREADS = 5000; // Reasonable limit to prevent memory issues
                        let allThreadInfo = [];

                        // Fetch threads in batches
                        let timestamp = null;
                        let hasMore = true;
                        let batchCount = 0;

                        while (hasMore && allThreadInfo.length < MAX_THREADS) {
                                const batch = await api.getThreadList(BATCH_SIZE, timestamp, ['INBOX']);

                                if (!batch || batch.length === 0) {
                                        hasMore = false;
                                        break;
                                }

                                allThreadInfo.push(...batch);
                                batchCount++;

                                // Get timestamp for next batch from last thread
                                const lastThread = batch[batch.length - 1];
                                if (lastThread && lastThread.timestamp) {
                                        timestamp = lastThread.timestamp;
                                } else {
                                        hasMore = false;
                                }

                                // Small delay between batches to avoid rate limiting
                                if (hasMore && batch.length === BATCH_SIZE) {
                                        await new Promise(resolve => setTimeout(resolve, 300));
                                }

                                // Log progress every 10 batches
                                if (batchCount % 10 === 0) {
                                        log.info('SYNC', `Fetched ${allThreadInfo.length} threads...`);
                                }
                        }

                        // Filter valid threads
                        allThreadInfo = allThreadInfo.filter(thread => thread && thread.threadID);

                        log.info('SYNC', `Total threads fetched: ${allThreadInfo.length} (in ${batchCount} batches)`);

                        // OPTIMIZATION: Process threads in chunks to prevent blocking
                        const CHUNK_SIZE = 50;
                        const threadDataWillSet = [];
                        const allThreadData = [...global.db.allThreadData];
                        const processedThreadIDs = new Set();

                        for (let i = 0; i < allThreadInfo.length; i += CHUNK_SIZE) {
                                const chunk = allThreadInfo.slice(i, i + CHUNK_SIZE);

                                await Promise.all(chunk.map(async (threadInfo) => {
                                        processedThreadIDs.add(threadInfo.threadID);

                                        if (threadInfo.isGroup && !allThreadData.some(thread => thread.threadID === threadInfo.threadID)) {
                                                threadDataWillSet.push(await threadsData.create(threadInfo.threadID, threadInfo));
                                        } else {
                                                const existingIndex = allThreadData.findIndex(thread => thread.threadID === threadInfo.threadID);
                                                if (existingIndex !== -1) {
                                                        const threadRefreshed = await threadsData.refreshInfo(threadInfo.threadID, threadInfo);
                                                        allThreadData.splice(existingIndex, 1);
                                                        threadDataWillSet.push(threadRefreshed);
                                                }
                                        }
                                        global.db.receivedTheFirstMessage[threadInfo.threadID] = true;
                                }));

                                // Yield to event loop every chunk
                                await new Promise(resolve => setImmediate(resolve));
                        }

                        // Handle threads where bot is no longer present
                        const botID = api.getCurrentUserID();
                        const allThreadDataDontHaveBot = allThreadData.filter(thread =>
                                !processedThreadIDs.has(thread.threadID)
                        );

                        // Process in smaller batches
                        for (let i = 0; i < allThreadDataDontHaveBot.length; i += CHUNK_SIZE) {
                                const chunk = allThreadDataDontHaveBot.slice(i, i + CHUNK_SIZE);

                                await Promise.all(chunk.map(async (thread) => {
                                        const findMe = thread.members.find(m => m.userID == botID);
                                        if (findMe) {
                                                findMe.inGroup = false;
                                                await threadsData.set(thread.threadID, { members: thread.members });
                                        }
                                }));
                        }

                        // Update global data
                        global.db.allThreadData = [
                                ...threadDataWillSet,
                                ...allThreadDataDontHaveBot
                        ];

                        spin._stop();
                        log.info('DATABASE', getText('loadData', 'refreshThreadDataSuccess', global.db.allThreadData.length));

                } catch (err) {
                        spin._stop();
                        log.error('DATABASE', getText('loadData', 'refreshThreadDataError'), err);
                } finally {
                        api.setOptions({
                                logLevel: global.GoatBot.config.optionsFca.logLevel
                        });
                }
        }
        // ————————————— ——————————— ———————————— ——————————— //
        return {
                threadModel: threadModel || null,
                userModel: userModel || null,
                dashBoardModel: dashBoardModel || null,
                globalModel: globalModel || null,
                threadsData,
                usersData,
                dashBoardData,
                globalData,
                sequelize
        };
};