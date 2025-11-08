const OpenAI = require("openai");

const THEME_COLORS = {
        MessengerBlue: "196241301102133",
        Viking: "1928399724138152",
        GoldenPoppy: "174636906462322",
        RadicalRed: "2129984390566328",
        Shocking: "2058653964378557",
        FreeSpeechGreen: "2136751179887052",
        Pumpkin: "175615189761153",
        LightCoral: "980963458735625",
        MediumSlateBlue: "234137870477637",
        DeepSkyBlue: "2442142322678320",
        BrilliantRose: "169463077092846",
        DefaultBlue: "196241301102133",
        HotPink: "169463077092846",
        AquaBlue: "2442142322678320",
        BrightPurple: "234137870477637",
        CoralPink: "980963458735625",
        Orange: "175615189761153",
        Green: "2136751179887052",
        LavenderPurple: "2058653964378557",
        Red: "2129984390566328",
        Yellow: "174636906462322",
        TealBlue: "1928399724138152",
        Aqua: "417639218648241",
        Mango: "930060997172551",
        Berry: "164535220883264",
        Citrus: "370940413392601",
        Candy: "205488546921017",
        Earth: "1833559466821043",
        Support: "365557122117011",
        Music: "339021464972092",
        Pride: "1652456634878319",
        DoctorStrange: "538280997628317",
        LoFi: "1060619084701625",
        Sky: "3190514984517598",
        LunarNewYear: "357833546030778",
        Celebration: "627144732056021",
        Chill: "390127158985345",
        StrangerThings: "1059859811490132",
        Dune: "1455149831518874",
        Care: "275041734441112",
        Astrology: "3082966625307060",
        JBalvin: "184305226956268",
        Birthday: "621630955405500",
        Cottagecore: "539927563794799",
        Ocean: "736591620215564",
        Love: "741311439775765",
        TieDye: "230032715012014",
        Monochrome: "788274591712841",
        Default: "3259963564026002",
        Rocket: "582065306070020",
        Berry2: "724096885023603",
        Candy2: "624266884847972",
        Unicorn: "273728810607574",
        Tropical: "262191918210707",
        Maple: "2533652183614000",
        Sushi: "909695489504566",
        Citrus2: "557344741607350",
        Lollipop: "280333826736184",
        Shadow: "271607034185782",
        Rose: "1257453361255152",
        Lavender: "571193503540759",
        Tulip: "2873642949430623",
        Classic: "3273938616164733",
        Peach: "3022526817824329",
        Honey: "672058580051520",
        Kiwi: "3151463484918004",
        Grape: "193497045377796",
        NonBinary: "737761000603635",
        ThankfulForFriends: "1318983195536293",
        Transgender: "504518465021637",
        TaylorSwift: "769129927636836",
        NationalComingOutDay: "788102625833584",
        Autumn: "822549609168155",
        Cyberpunk2077: "780962576430091",
        MothersDay: "1288506208402340",
        APAHM: "121771470870245",
        Parenthood: "810978360551741",
        StarWars: "1438011086532622",
        GuardianOfTheGalaxy: "101275642962533",
        Bloom: "158263147151440",
        BubbleTea: "195296273246380",
        Basketball: "6026716157422736",
        ElephantsAndFlowers: "693996545771691"
};

module.exports = {
        config: {
                name: "changetheme",
                aliases: ["theme", "settheme"],
                version: "1.0.0",
                author: "NeoKEX",
                countDown: 5,
                role: 0,
                description: {
                        vi: "Thay đổi theme của nhóm/tin nhắn sử dụng AI",
                        en: "Change group/DM theme using AI"
                },
                category: "group",
                guide: {
                        vi: "   {pn} <mô tả> - Thay đổi theme dựa trên mô tả của bạn\n   Ví dụ: {pn} romantic sunset\n   {pn} ocean vibes\n   {pn} birthday party",
                        en: "   {pn} <description> - Change theme based on your description\n   Example: {pn} romantic sunset\n   {pn} ocean vibes\n   {pn} birthday party"
                }
        },

        langs: {
                vi: {
                        missingApiKey: "Vui lòng cấu hình OPENAI_API_KEY để sử dụng lệnh này",
                        missingPrompt: "Vui lòng nhập mô tả theme bạn muốn",
                        thinking: "◈ Đang phân tích yêu cầu của bạn...",
                        success: "◆ Đã thay đổi theme thành '%1' dựa trên mô tả của bạn!\n◈ AI đã chọn theme này vì: %2",
                        error: "◆ Đã xảy ra lỗi khi thay đổi theme: %1",
                        notGroup: "Lệnh này chỉ có thể sử dụng trong nhóm hoặc tin nhắn riêng",
                        noPermission: "Bot không có quyền thay đổi theme trong nhóm này",
                        listThemes: "◈ Các theme có sẵn:\n%1\n\n◆ Sử dụng {pn} <mô tả> để AI tự động chọn theme phù hợp!"
                },
                en: {
                        missingApiKey: "Please configure OPENAI_API_KEY to use this command",
                        missingPrompt: "Please enter a theme description",
                        thinking: "◈ Analyzing your request...",
                        success: "◆ Changed theme to '%1' based on your description!\n◈ AI selected this because: %2",
                        error: "◆ An error occurred while changing theme: %1",
                        notGroup: "This command can only be used in groups or DMs",
                        noPermission: "Bot doesn't have permission to change theme in this group",
                        listThemes: "◈ Available themes:\n%1\n\n◆ Use {pn} <description> to let AI automatically select a suitable theme!"
                }
        },

        onStart: async function ({ args, message, event, api, getLang, commandName }) {
                const { threadID, senderID } = event;

                if (args[0]?.toLowerCase() === "list") {
                        const themeNames = Object.keys(THEME_COLORS);
                        const themeList = themeNames.map((name, i) => `${i + 1}. ${name}`).join("\n");
                        const prefix = global.utils.getPrefix(threadID);
                        return message.reply(getLang("listThemes", themeList).replace("{pn}", `${prefix}${commandName}`));
                }

                if (!process.env.OPENAI_API_KEY) {
                        return message.reply(getLang("missingApiKey"));
                }

                const userPrompt = args.join(" ");
                if (!userPrompt) {
                        return message.reply(getLang("missingPrompt"));
                }

                const thinkingMsg = await message.reply(getLang("thinking"));

                try {
                        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                        const themeNames = Object.keys(THEME_COLORS);
                        const systemPrompt = `You are a theme selection assistant for a messaging app. Based on the user's description, select the most appropriate theme from the available options.

Available themes: ${themeNames.join(", ")}

Analyze the user's request and select the single best matching theme. Consider:
- Color associations (e.g., "ocean" -> Ocean, "love" -> Love/Rose/HotPink)
- Mood/vibe (e.g., "chill" -> Chill/LoFi, "party" -> Celebration/Birthday)
- Events/occasions (e.g., "birthday" -> Birthday, "pride" -> Pride)
- Pop culture references (e.g., "stranger things" -> StrangerThings)
- Seasonal themes (e.g., "autumn" -> Autumn, "lunar new year" -> LunarNewYear)

Return your response as JSON with this exact format:
{
  "theme": "ThemeName",
  "reason": "Brief explanation of why this theme matches the request"
}`;

                        const response = await openai.chat.completions.create({
                                model: "gpt-4",
                                messages: [
                                        { role: "system", content: systemPrompt },
                                        { role: "user", content: userPrompt }
                                ],
                                response_format: { type: "json_object" },
                                max_tokens: 200
                        });

                        const result = JSON.parse(response.choices[0].message.content);
                        const selectedTheme = result.theme;
                        const reason = result.reason || "It matches your description";

                        if (!THEME_COLORS[selectedTheme]) {
                                throw new Error(`AI selected invalid theme: ${selectedTheme}`);
                        }

                        const themeID = THEME_COLORS[selectedTheme];

                        await api.changeThreadColor(themeID, threadID);
                        
                        await message.unsend(thinkingMsg.messageID);
                        return message.reply(getLang("success", selectedTheme, reason));

                } catch (error) {
                        try {
                                await message.unsend(thinkingMsg.messageID);
                        } catch (e) {}
                        
                        return message.reply(getLang("error", error.message));
                }
        }
};
