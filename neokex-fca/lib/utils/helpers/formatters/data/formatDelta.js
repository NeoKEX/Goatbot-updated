"use strict";

const formatID = require('../value/formatID');
const { _formatAttachment } = require('./formatAttachment');

function getAdminTextMessageType(type) {
    switch (type) {
        case 'unpin_messages_v2': return 'log:unpin-message';
        case 'pin_messages_v2': return 'log:pin-message';
        case "change_thread_theme": return "log:thread-color";
        case "change_thread_icon":
        case 'change_thread_quick_reaction': return "log:thread-icon";
        case "change_thread_nickname": return "log:user-nickname";
        case "change_thread_admins": return "log:thread-admins";
        case "group_poll": return "log:thread-poll";
        case "change_thread_approval_mode": return "log:thread-approval-mode";
        case "messenger_call_log":
        case "participant_joined_group_call": return "log:thread-call";
        default: return type;
    }
}

function formatDeltaMessage(m) {
    const md = m.delta.messageMetadata;
    const mdata = m.delta.data?.prng ? JSON.parse(m.delta.data.prng) : [];
    const mentions = {};
    for (const mention of mdata) {
        mentions[mention.i] = m.delta.body.substring(mention.o, mention.o + mention.l);
    }

    const messageReply = m.delta.messageReply ? {
        messageID: m.delta.messageReply.messageID,
        senderID: formatID(m.delta.messageReply.senderID),
        body: m.delta.messageReply.body,
        attachments: m.delta.messageReply.attachments,
        timestamp: m.delta.messageReply.timestamp,
        isReply: true
    } : null;

    return {
        type: "message",
        senderID: formatID(md.actorFbId.toString()),
        body: m.delta.body || "",
        threadID: formatID((md.threadKey.threadFbId || md.threadKey.otherUserFbId).toString()),
        messageID: md.messageId,
        messageIdentifier: md.messageIdentifier,
        attachments: (m.delta.attachments || []).map(v => _formatAttachment(v)),
        mentions: mentions,
        timestamp: md.timestamp,
        isGroup: !!md.threadKey.threadFbId,
        participantIDs: m.delta.participants,
        messageReply: messageReply
    };
}

function formatDeltaEvent(m) {
    let logMessageType;
    let logMessageData;

    switch (m.class) {
        case "AdminTextMessage":
            logMessageData = m.untypedData;
            logMessageType = getAdminTextMessageType(m.type);
            break;
        case "ThreadName":
            logMessageType = "log:thread-name";
            logMessageData = { name: m.name };
            break;
        case "ParticipantsAddedToGroupThread":
            logMessageType = "log:subscribe";
            logMessageData = { addedParticipants: m.addedParticipants };
            break;
        case "ParticipantLeftGroupThread":
            logMessageType = "log:unsubscribe";
            logMessageData = { leftParticipantFbId: m.leftParticipantFbId };
            break;
        default:
            logMessageType = m.class;
            logMessageData = m;
    }

    return {
        type: "event",
        threadID: formatID((m.messageMetadata.threadKey.threadFbId || m.messageMetadata.threadKey.otherUserFbId).toString()),
        messageID: m.messageMetadata.messageId.toString(),
        logMessageType,
        logMessageData,
        logMessageBody: m.messageMetadata.adminText,
        timestamp: m.messageMetadata.timestamp,
        author: m.messageMetadata.actorFbId,
        participantIDs: m.participants
    };
}

function formatDeltaReadReceipt(delta) {
    return {
        reader: (delta.threadKey.otherUserFbId || delta.actorFbId).toString(),
        time: delta.actionTimestampMs,
        threadID: formatID((delta.threadKey.otherUserFbId || delta.threadKey.threadFbId).toString()),
        type: "read_receipt"
    };
}

module.exports = {
    formatDeltaMessage,
    formatDeltaEvent,
    formatDeltaReadReceipt,
    getAdminTextMessageType
};