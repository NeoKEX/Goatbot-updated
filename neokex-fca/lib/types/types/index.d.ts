/// <reference types="node" />
import { ReadStream } from "fs";
import { EventEmitter } from "events";

declare module "neokex-fca" {
    export type UserID = string;
    export type ThreadID = string;
    export type MessageID = string;
    export type Callback<T = any> = (err: any, result?: T) => void;

    export interface Coordinates {
        latitude: number;
        longitude: number;
    }

    export interface Mention {
        tag: string;
        id: UserID;
        fromIndex?: number;
    }

    export interface Reaction {
        reaction: string;
        userID: UserID;
    }

    export interface StickerPackInfo {
        id: string;
        name: string;
        thumbnail?: string;
    }

    export interface StickerInfo {
        type: "sticker";
        ID: string;
        url?: string;
        animatedUrl?: string;
        packID?: string;
        label: string;
        stickerID: string;
    }

    export interface AddedStickerPackInfo {
        id: string;
        name: string;
        in_sticker_tray: boolean;
        artist?: string;
        preview_image?: { uri: string };
        thumbnail_image?: { uri: string };
    }

    export interface CommentMessage {
        body: string;
        attachment?: ReadStream[];
        mentions?: Mention[];
        url?: string;
        sticker?: string;
    }

    export interface CommentResult {
        id: string;
        url: string;
        count: number;
    }

    export interface ShareResult {
        postID: string;
        url: string;
    }

    export interface Attachment {
        type: "photo" | "animated_image" | "video" | "audio" | "file" | "sticker" | "share" | "location" | "unknown";
        ID: string;
        filename: string;
        url?: string;
        name?: string;
    }

    export interface PhotoAttachment extends Attachment {
        type: "photo";
        thumbnailUrl: string;
        previewUrl: string;
        previewWidth: number;
        previewHeight: number;
        largePreviewUrl: string;
        largePreviewWidth: number;
        largePreviewHeight: number;
        width: number;
        height: number;
    }

    export interface VideoAttachment extends Attachment {
        type: "video";
        duration: number;
        width: number;
        height: number;
        previewUrl: string;
        previewWidth: number;
        previewHeight: number;
        videoType: "file_attachment" | "native_video" | "unknown";
    }

    export interface AudioAttachment extends Attachment {
        type: "audio";
        duration: number;
        audioType: string;
        isVoiceMail: boolean;
    }

    export interface FileAttachment extends Attachment {
        type: "file";
        isMalicious: boolean;
        contentType: string;
    }

    export interface StickerAttachment extends Attachment {
        type: "sticker";
        packID: string;
        spriteUrl?: string;
        spriteUrl2x?: string;
        width: number;
        height: number;
        caption: string;
        description: string;
        frameCount: number;
        frameRate: number;
        framesPerRow: number;
        framesPerCol: number;
    }

    export interface ShareAttachment extends Attachment {
        type: "share";
        title: string;
        description?: string;
        source?: string;
        image?: string;
        width?: number;
        height?: number;
        playable?: boolean;
        subattachments?: any[];
        properties: Record<string, any>;
    }

    export type AnyAttachment = PhotoAttachment | VideoAttachment | AudioAttachment | FileAttachment | StickerAttachment | ShareAttachment;

    export interface MessageReply {
        messageID: MessageID;
        senderID: UserID;
        body: string;
        attachments: AnyAttachment[];
        timestamp: string;
        isReply: true;
    }

    export interface Message {
        type: "message";
        senderID: UserID;
        body: string;
        threadID: ThreadID;
        messageID: MessageID;
        attachments: AnyAttachment[];
        mentions: Record<string, string>;
        timestamp: string;
        isGroup: boolean;
        participantIDs?: UserID[];
        messageReply?: MessageReply;
        isUnread?: boolean;
        reactions?: Reaction[];
    }

    export interface Event {
        type: "event";
        threadID: ThreadID;
        logMessageType: string;
        logMessageData: any;
        logMessageBody: string;
        timestamp: string;
        author: UserID;
    }

    export interface TypingIndicator {
        type: "typ";
        isTyping: boolean;
        from: UserID;
        threadID: ThreadID;
        fromMobile: boolean;
    }

    export type ListenEvent = Message | Event | TypingIndicator;

    export interface UserInfo {
        id: UserID;
        name: string;
        firstName: string;
        lastName?: string;
        vanity: string;
        profileUrl: string;
        profilePicUrl: string;
        gender: string;
        type: "user" | "page";
        isFriend: boolean;
        isBirthday: boolean;
        bio?: string;
        live_city?: string;
        followers?: string;
        following?: string;
        coverPhoto?: string;
    }

    export interface ThreadInfo {
        threadID: ThreadID;
        threadName?: string;
        participantIDs: UserID[];
        userInfo: UserInfo[];
        unreadCount: number;
        messageCount: number;
        imageSrc?: string;
        timestamp: string;
        muteUntil: number;
        isGroup: boolean;
        isArchived: boolean;
        isSubscribed: boolean;
        folder: string;
        nicknames: Record<UserID, string>;
        adminIDs: UserID[];
        emoji?: string;
        color?: string;
        canReply: boolean;
        inviteLink: {
            enable: boolean;
            link: string | null;
        };
    }

    export interface MessageObject {
        body?: string;
        attachment?: ReadStream[];
        sticker?: string;
        emoji?: string;
        emojiSize?: "small" | "medium" | "large";
        mentions?: Mention[];
        edit?: [string, number][];
    }

    export interface API {
        setOptions(options: LoginOptions): void;
        getAppState(): any[];
        getCurrentUserID(): UserID;

        listen(callback: (err: any, event: ListenEvent) => void): EventEmitter;

        sendMessageMqtt(
            message: string | MessageObject,
            threadID: ThreadID,
            replyToMessage?: MessageID,
            callback?: Callback<Message>,
        ): void;

        editMessage(text: string, messageID: MessageID, callback?: Callback): void;

        shareContact(text: string, senderID: UserID, threadID: ThreadID, callback?: Callback): void;
        shareContact(senderID: UserID, threadID: ThreadID, callback?: Callback): void;
        resolvePhotoUrl(photoID: string, callback?: Callback<string>): Promise<string>;

        pin(action: "pin" | "unpin", threadID: ThreadID, messageID: MessageID): Promise<any>;
        pin(action: "list", threadID: ThreadID): Promise<Message[]>;

        markAsRead(threadID: ThreadID, read?: boolean, callback?: Callback): Promise<any>;
        markAsReadAll(callback?: Callback): Promise<void>;
        markAsSeen(timestamp?: number, callback?: Callback): Promise<void>;
        markAsDelivered(threadID: ThreadID, messageID: MessageID, callback?: Callback): Promise<void>;

        sendTypingIndicator(sendTyping: boolean, threadID: ThreadID, callback?: Callback): Promise<void>;

        getThreadInfo(threadID: ThreadID, callback?: Callback<ThreadInfo>): Promise<ThreadInfo>;
        getThreadInfo(threadID: ThreadID[], callback?: Callback<Record<ThreadID, ThreadInfo>>): Promise<Record<ThreadID, ThreadInfo>>;

        getThreadList(limit: number, timestamp: number | null, tags: string[], callback?: Callback<ThreadInfo[]>): Promise<ThreadInfo[]>;
        getThreadHistory(threadID: ThreadID, amount: number, timestamp: number | null, callback?: Callback<Message[]>): Promise<Message[]>;

        getUserInfo(id: UserID, usePayload?: boolean, callback?: Callback<UserInfo>): Promise<UserInfo>;
        getUserInfo(id: UserID[], usePayload?: boolean, callback?: Callback<Record<UserID, UserInfo>>): Promise<Record<UserID, UserInfo>>;

        logout(callback?: (err: any) => void): Promise<void>;

        addExternalModule(moduleObj: Record<string, Function>): void;
        getAccess(authCode?: string, callback?: Callback<string>): Promise<string>;

        httpGet(url: string, form?: any, customHeader?: any, callback?: Callback<string>, notAPI?: boolean): Promise<string>;
        httpPost(url: string, form?: any, customHeader?: any, callback?: Callback<string>, notAPI?: boolean): Promise<string>;
        httpPostFormData(url: string, form?: any, customHeader?: any, callback?: Callback<string>, notAPI?: boolean): Promise<string>;

        stickers: {
            search(query: string): Promise<StickerInfo[]>;
            listPacks(): Promise<StickerPackInfo[]>;
            getStorePacks(): Promise<StickerPackInfo[]>;
            listAllPacks(): Promise<StickerPackInfo[]>;
            addPack(packID: string): Promise<AddedStickerPackInfo>;
            getStickersInPack(packID: string): Promise<StickerInfo[]>;
            getAiStickers(options?: { limit?: number }): Promise<StickerInfo[]>;
        };

        comment(msg: string | CommentMessage, postID: string, replyCommentID?: string, callback?: Callback<CommentResult>): Promise<CommentResult>;
        share(text: string, postID: string, callback?: Callback<ShareResult>): Promise<ShareResult>;
        share(postID: string, callback?: Callback<ShareResult>): Promise<ShareResult>;

        follow(senderID: UserID, follow: boolean, callback?: Callback): void;

        unsent(messageID: MessageID, threadID: ThreadID, callback?: Callback<UnsendMessageEvent>): Promise<UnsendMessageEvent>;
        emoji(emoji: string, threadID?: ThreadID, callback?: Callback<EmojiEvent>): Promise<EmojiEvent>;
        gcname(newName: string, threadID?: ThreadID, callback?: Callback<GroupNameEvent>): Promise<GroupNameEvent>;
        nickname(nickname: string, threadID: ThreadID, participantID: UserID, callback?: Callback<NicknameEvent>): Promise<NicknameEvent>;
        theme(newName: string, threadID?: ThreadID, callback?: Callback<GroupNameEvent>): Promise<GroupNameEvent>;

        [key: string]: any;
    }

    export interface LoginCredentials {
        appState?: any;
    }

    export interface LoginOptions {
        online?: boolean;
        selfListen?: boolean;
        listenEvents?: boolean;
        updatePresence?: boolean;
        forceLogin?: boolean;
        autoMarkDelivery?: boolean;
        autoMarkRead?: boolean;
        listenTyping?: boolean;
        proxy?: string;
        autoReconnect?: boolean;
        userAgent?: string;
        emitReady?: boolean;
        randomUserAgent?: boolean;
        bypassRegion?: string;
    }

    export function login(
        credentials: LoginCredentials,
        options: LoginOptions | Callback<API>,
        callback?: Callback<API>
    ): void;
        }
