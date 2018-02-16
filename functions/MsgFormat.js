module.exports = {
    Text: function (replyText) {
        return {
            "type": "text",
            "text": replyText
        };
    },
    Sticker: function (packageId, stickerId) {
        return {
            "type": "sticker",
            "packageId": packageId,
            "stickerId": stickerId
        };
    },
    Image: function (imageSrc) {
        return {
            "type": "image",
            "originalContentUrl": imageSrc,
            "previewImageUrl": imageSrc
        };
    },
    Video: function (videoSrc, previewImageSrc) {
        return {
            "type": "video",
            "originalContentUrl": videoSrc,
            "previewImageUrl": previewImageSrc
        };
    },
    Audio: function (audioSrc, durationMs) {
        return {
            "type": "audio",
            "originalContentUrl": audioSrc,
            "duration": Number(durationMs)
        };
    },
    Location: function (title, address, latitude, longitude) {
        return {
            "type": "location",
            "title": title,
            "address": address,
            "latitude": Number(latitude),
            "longitude": Number(longitude)
        };
    }
};