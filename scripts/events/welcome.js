const { getTime, drive } = global.utils;

module.exports = {
        config: {
                name: "welcome",
                version: "1.4",
                author: "NTKhang",
                category: "events"
        },

        langs: {
                vi: {
                        session1: "sáng",
                        session2: "trưa",
                        session3: "chiều",
                        session4: "tối",
                        multiple1: "bạn",
                        multiple2: "các bạn",
                        welcomeMessage: "Cảm ơn bạn đã thêm mình vào nhóm!\nPrefix của bot: %1\nĐể xem danh sách lệnh, vui lòng nhập: %1help",
                        defaultWelcomeMessage: "Chào mừng {userNameTag} đã đến với {boxName}! Chúc {multiple} một buổi {session} vui vẻ 🎉"
                },
                en: {
                        session1: "morning",
                        session2: "noon",
                        session3: "afternoon",
                        session4: "evening",
                        multiple1: "you",
                        multiple2: "you guys",
                        welcomeMessage: "Thanks for adding me to the group.\nBot prefix: %1\nUse %1help to see the available commands.",
                        defaultWelcomeMessage: "Welcome {userNameTag} to {boxName}! Wishing you a great {session} 🎉"
                }
        },

        onStart: async ({ threadsData, message, event, api, getLang, client }) => {
                if (event.logMessageType !== "log:subscribe")
                        return;

                return async function () {
                        const { threadID } = event;
                        const { addedParticipants } = event.logMessageData;
                        if (!addedParticipants || addedParticipants.length === 0)
                                return;

                        let threadData;
                        try {
                                threadData = await threadsData.get(threadID);
                        } catch (e) {
                                return;
                        }

                        if (!threadData?.settings?.sendWelcomeMessage)
                                return;

                        const botID = api.getCurrentUserID();

                        // ── Case 1: Bot itself was added to the group ──
                        if (addedParticipants.some(item => item.userFbId == botID)) {
                                const prefix = global.utils.getPrefix(threadID);
                                return message.send(getLang("welcomeMessage", prefix));
                        }

                        // ── Case 2: Regular member(s) joined ──

                        const hours = +getTime("HH");
                        const session =
                                hours < 10 ? getLang("session1") :
                                hours < 12 ? getLang("session2") :
                                hours < 18 ? getLang("session3") :
                                             getLang("session4");

                        const isMultiple = addedParticipants.length > 1;
                        const multiple = isMultiple ? getLang("multiple2") : getLang("multiple1");
                        const threadName = threadData.threadName;

                        let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

                        const namesList = addedParticipants.map(u => u.fullName).join(", ");
                        const firstName = addedParticipants[0].fullName;
                        const mentions = addedParticipants.map(u => ({ tag: u.fullName, id: u.userFbId }));

                        welcomeMessage = welcomeMessage
                                .replace(/\{userName\}/g, isMultiple ? namesList : firstName)
                                .replace(/\{userNameTag\}/g, isMultiple ? namesList : firstName)
                                .replace(/\{multiple\}/g, multiple)
                                .replace(/\{boxName\}|\{threadName\}/g, threadName)
                                .replace(/\{session\}/g, session);

                        const form = { body: welcomeMessage, mentions };

                        if (threadData.data.welcomeAttachment && threadData.data.welcomeAttachment.length > 0) {
                                const streams = threadData.data.welcomeAttachment.map(fileId =>
                                        drive.getFile(fileId, "stream")
                                );
                                const settled = await Promise.allSettled(streams);
                                form.attachment = settled
                                        .filter(({ status }) => status === "fulfilled")
                                        .map(({ value }) => value);
                        }

                        message.send(form);
                };
        }
};
