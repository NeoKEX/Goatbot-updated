"use strict";

const url = require("url");
const querystring = require("querystring");
const { getType } = require("../../constants");

function getExtension(original_extension, fullFileName = "") {
    if (original_extension) {
        return original_extension;
    } else {
        const extension = fullFileName.split(".").pop();
        return (extension === fullFileName) ? "" : extension;
    }
}

function _formatAttachment(attachment1, attachment2) {
    const blob_attachment = attachment1.mercury || attachment1.blob_attachment || attachment1.sticker_attachment;
    let type_attachment = blob_attachment && blob_attachment.__typename ? blob_attachment.__typename : attachment1.attach_type;

    if (type_attachment == null && attachment1.id != null && attachment1.extensible_attachment == null) {
        return {
            type: "share",
            ID: attachment1.id,
            url: attachment1.href,
            title: "Shared Content",
            description: "Unsupported shared content.",
            source: null,
            isUnrecognized: true
        };
    }
    
    if (!attachment1.attach_type && attachment1.imageMetadata) {
        return {
            type: 'photo',
            ID: attachment1.fbid,
            filename: attachment1.filename,
            fileSize: Number(attachment1.fileSize || 0),
            mimeType: attachment1.mimeType,
            width: attachment1.imageMetadata.width,
            height: attachment1.imageMetadata.height,
            url: null,
            thumbnailUrl: null,
            previewUrl: null,
            largePreviewUrl: null,
            name: attachment1.filename
        };
    }

    attachment2 = attachment2 || { id: "", image_data: {} };
    attachment1 = attachment1.mercury || attachment1;
    let blob = attachment1.blob_attachment || attachment1.sticker_attachment;
    let type = blob && blob.__typename ? blob.__typename : attachment1.attach_type;

    if (!type && attachment1.sticker_attachment) {
        type = "StickerAttachment";
        blob = attachment1.sticker_attachment;
    } else if (!type && attachment1.extensible_attachment) {
        if (attachment1.extensible_attachment.story_attachment?.target?.__typename === "MessageLocation") {
            type = "MessageLocation";
        } else {
            type = "ExtensibleAttachment";
        }
        blob = attachment1.extensible_attachment;
    }

    switch (type) {
        case "MessageImage":
            return {
                type: "photo", ID: blob.legacy_attachment_id, filename: blob.filename,
                thumbnailUrl: blob.thumbnail.uri, previewUrl: blob.preview.uri,
                previewWidth: blob.preview.width, previewHeight: blob.preview.height,
                largePreviewUrl: blob.large_preview.uri, largePreviewWidth: blob.large_preview.width,
                largePreviewHeight: blob.large_preview.height, url: blob.large_preview.uri,
                width: blob.original_dimensions.x, height: blob.original_dimensions.y, name: blob.filename
            };
        case "MessageAnimatedImage":
            return {
                type: "animated_image", ID: blob.legacy_attachment_id, name: blob.filename,
                previewUrl: blob.preview_image.uri, previewWidth: blob.preview_image.width,
                previewHeight: blob.preview_image.height, url: blob.animated_image.uri,
                width: blob.animated_image.width, height: blob.animated_image.height,
                facebookUrl: blob.animated_image.uri
            };
        case "MessageVideo":
            return {
                type: "video", ID: blob.legacy_attachment_id, filename: blob.filename,
                duration: blob.playable_duration_in_ms, thumbnailUrl: blob.large_image.uri,
                previewUrl: blob.large_image.uri, previewWidth: blob.large_image.width,
                previewHeight: blob.large_image.height, url: blob.playable_url,
                width: blob.original_dimensions.x, height: blob.original_dimensions.y,
                videoType: blob.video_type.toLowerCase()
            };
        case "MessageFile":
            return {
                type: "file", ID: blob.message_file_fbid, filename: blob.filename,
                url: blob.url, isMalicious: blob.is_malicious,
                contentType: blob.content_type, name: blob.filename
            };
        case "MessageAudio":
            return {
                type: "audio", ID: blob.url_shimhash, filename: blob.filename,
                duration: blob.playable_duration_in_ms, audioType: blob.audio_type,
                url: blob.playable_url, isVoiceMail: blob.is_voicemail
            };
        case "Sticker":
        case "StickerAttachment":
             return {
                type: "sticker", ID: blob.id, url: blob.url, packID: blob.pack?.id,
                spriteUrl: blob.sprite_image, spriteUrl2x: blob.sprite_image_2x,
                width: blob.width, height: blob.height, caption: blob.label,
                description: blob.label, frameCount: blob.frame_count,
                frameRate: blob.frame_rate, framesPerRow: blob.frames_per_row,
                framesPerCol: blob.frames_per_column, stickerID: blob.id
            };
        case "ExtensibleAttachment":
            const story = blob.story_attachment;
            return {
                type: "share", ID: blob.legacy_attachment_id, url: story.url,
                title: story.title_with_entities.text,
                description: story.description?.text,
                source: story.source?.text,
                image: story.media?.image?.uri,
                width: story.media?.image?.width,
                height: story.media?.image?.height,
                playable: story.media?.is_playable,
                duration: story.media?.playable_duration_in_ms,
                playableUrl: story.media?.playable_url,
                subattachments: story.subattachments,
                properties: story.properties.reduce((obj, cur) => ({...obj, [cur.key]: cur.value.text}), {})
            };
        default:
            return { type: "unknown", error: `Unrecognized attachment type: ${type}` };
    }
}

function formatAttachment(attachments, attachmentIds, attachmentMap, shareMap) {
    attachmentMap = shareMap || attachmentMap;
    return attachments ?
        attachments.map((val, i) => {
            if (!attachmentMap || !attachmentIds || !attachmentMap[attachmentIds[i]]) {
                return _formatAttachment(val);
            }
            return _formatAttachment(val, attachmentMap[attachmentIds[i]]);
        }) : [];
}

module.exports = {
    _formatAttachment,
    formatAttachment
};