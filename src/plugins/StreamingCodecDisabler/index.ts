import { definePluginSettings, Settings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";

let MediaEngine = findStoreLazy("MediaEngineStore");

let originalCodecStatuses: {
    AV1: boolean,
    H265: boolean,
    H264: boolean;
} = {
    AV1: true,
    H265: true,
    H264: true
};

export default definePlugin({
    name: "StreamingCodecDisabler",
    description: "Disable codecs for streaming of your choice! (for multi-gpu setups and forcing encoding on a non-primary (and less capable) gpu)",
    authors: [{ name: "davidkra230", id: 652699312631054356n }],
    settings: definePluginSettings({
        disableAv1Codec: {
            description: "Make Discord not consider using AV1 for streaming.",
            type: OptionType.BOOLEAN,
            default: false
        },
        disableH265Codec: {
            description: "Make Discord not consider using H265 for streaming.",
            type: OptionType.BOOLEAN,
            default: false
        },
        disableH264Codec: {
            description: "Make Discord not consider using H264 for streaming.",
            type: OptionType.BOOLEAN,
            default: false
        },
    }),
    patches: [
        {
            find: "setVideoBroadcast(this.shouldConnectionBroadcastVideo",
            replacement: {
                match: /setGoLiveSource\(.,.\)\{/,
                replace: "$&$self.updateDisabledCodecs();"
            },
        }
    ],
    async updateDisabledCodecs() {
        MediaEngine.setAv1Enabled(originalCodecStatuses.AV1 && !Settings.plugins.StreamingCodecDisabler.disableAV1Codec);
        MediaEngine.setH265Enabled(originalCodecStatuses.H265 && !Settings.plugins.StreamingCodecDisabler.disableH265Codec);
        MediaEngine.setH264Enabled(originalCodecStatuses.H264 && !Settings.plugins.StreamingCodecDisabler.disableH264Codec);
    },

    async start() {
        MediaEngine = MediaEngine.getMediaEngine();
        let options = Object.keys(originalCodecStatuses);
        // [{"codec":"","decode":false,"encode":false}]
        let CCs = JSON.parse(await new Promise((res) => MediaEngine.getCodecCapabilities(res)));
        CCs.forEach((codec: { codec: string; encode: boolean; }) => {
            if (options.includes(codec.codec)) {
                originalCodecStatuses[codec.codec] = codec.encode;
            }
        });
    },
    async stop() {
        MediaEngine.setAv1Enabled(originalCodecStatuses.AV1);
        MediaEngine.setH265Enabled(originalCodecStatuses.H265);
        MediaEngine.setH264Enabled(originalCodecStatuses.H264);
    }
});