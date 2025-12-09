const {
    createCanvas,
    loadImage,
    registerFont
} = require('canvas');
const fs = require('fs-extra');
const path = require('path');

const fontDir = process.cwd() + "/scripts/cmds/assets/font";
const canvasFontDir = process.cwd() + "/scripts/cmds/canvas/fonts";

registerFont(path.join(fontDir, "BeVietnamPro-Bold.ttf"), {
    family: 'BeVietnamPro',
    weight: 'bold'
});

registerFont(path.join(fontDir, "BeVietnamPro-SemiBold.ttf"), {
    family: 'BeVietnamPro',
    weight: '600'
});

registerFont(path.join(fontDir, "BeVietnamPro-Regular.ttf"), {
    family: 'BeVietnamPro',
    weight: 'normal'
});

registerFont(path.join(fontDir, "Kanit-SemiBoldItalic.ttf"), {
    family: 'Kanit',
    weight: '600',
    style: 'italic'
});

registerFont(path.join(canvasFontDir, "Rounded.otf"), {
    family: 'Rounded'
});

function normalizeText(text) {
    if (!text) return '';
    
    const charMaps = {
        '\u{1D400}': 'A', '\u{1D401}': 'B', '\u{1D402}': 'C', '\u{1D403}': 'D', '\u{1D404}': 'E',
        '\u{1D405}': 'F', '\u{1D406}': 'G', '\u{1D407}': 'H', '\u{1D408}': 'I', '\u{1D409}': 'J',
        '\u{1D40A}': 'K', '\u{1D40B}': 'L', '\u{1D40C}': 'M', '\u{1D40D}': 'N', '\u{1D40E}': 'O',
        '\u{1D40F}': 'P', '\u{1D410}': 'Q', '\u{1D411}': 'R', '\u{1D412}': 'S', '\u{1D413}': 'T',
        '\u{1D414}': 'U', '\u{1D415}': 'V', '\u{1D416}': 'W', '\u{1D417}': 'X', '\u{1D418}': 'Y',
        '\u{1D419}': 'Z', '\u{1D41A}': 'a', '\u{1D41B}': 'b', '\u{1D41C}': 'c', '\u{1D41D}': 'd',
        '\u{1D41E}': 'e', '\u{1D41F}': 'f', '\u{1D420}': 'g', '\u{1D421}': 'h', '\u{1D422}': 'i',
        '\u{1D423}': 'j', '\u{1D424}': 'k', '\u{1D425}': 'l', '\u{1D426}': 'm', '\u{1D427}': 'n',
        '\u{1D428}': 'o', '\u{1D429}': 'p', '\u{1D42A}': 'q', '\u{1D42B}': 'r', '\u{1D42C}': 's',
        '\u{1D42D}': 't', '\u{1D42E}': 'u', '\u{1D42F}': 'v', '\u{1D430}': 'w', '\u{1D431}': 'x',
        '\u{1D432}': 'y', '\u{1D433}': 'z',
        '\u{1D49C}': 'A', '\u{212C}': 'B', '\u{1D49E}': 'C', '\u{1D49F}': 'D', '\u{2130}': 'E',
        '\u{2131}': 'F', '\u{1D4A2}': 'G', '\u{210B}': 'H', '\u{2110}': 'I', '\u{1D4A5}': 'J',
        '\u{1D4A6}': 'K', '\u{2112}': 'L', '\u{2133}': 'M', '\u{1D4A9}': 'N', '\u{1D4AA}': 'O',
        '\u{1D4AB}': 'P', '\u{1D4AC}': 'Q', '\u{211B}': 'R', '\u{1D4AE}': 'S', '\u{1D4AF}': 'T',
        '\u{1D4B0}': 'U', '\u{1D4B1}': 'V', '\u{1D4B2}': 'W', '\u{1D4B3}': 'X', '\u{1D4B4}': 'Y',
        '\u{1D4B5}': 'Z', '\u{1D4B6}': 'a', '\u{1D4B7}': 'b', '\u{1D4B8}': 'c', '\u{1D4B9}': 'd',
        '\u{212F}': 'e', '\u{1D4BB}': 'f', '\u{210A}': 'g', '\u{1D4BD}': 'h', '\u{1D4BE}': 'i',
        '\u{1D4BF}': 'j', '\u{1D4C0}': 'k', '\u{1D4C1}': 'l', '\u{1D4C2}': 'm', '\u{1D4C3}': 'n',
        '\u{1D4C4}': 'o', '\u{1D4C5}': 'p', '\u{1D4C6}': 'q', '\u{1D4C7}': 'r', '\u{1D4C8}': 's',
        '\u{1D4C9}': 't', '\u{1D4CA}': 'u', '\u{1D4CB}': 'v', '\u{1D4CC}': 'w', '\u{1D4CD}': 'x',
        '\u{1D4CE}': 'y', '\u{1D4CF}': 'z',
        '\u{1D4D0}': 'A', '\u{1D4D1}': 'B', '\u{1D4D2}': 'C', '\u{1D4D3}': 'D', '\u{1D4D4}': 'E',
        '\u{1D4D5}': 'F', '\u{1D4D6}': 'G', '\u{1D4D7}': 'H', '\u{1D4D8}': 'I', '\u{1D4D9}': 'J',
        '\u{1D4DA}': 'K', '\u{1D4DB}': 'L', '\u{1D4DC}': 'M', '\u{1D4DD}': 'N', '\u{1D4DE}': 'O',
        '\u{1D4DF}': 'P', '\u{1D4E0}': 'Q', '\u{1D4E1}': 'R', '\u{1D4E2}': 'S', '\u{1D4E3}': 'T',
        '\u{1D4E4}': 'U', '\u{1D4E5}': 'V', '\u{1D4E6}': 'W', '\u{1D4E7}': 'X', '\u{1D4E8}': 'Y',
        '\u{1D4E9}': 'Z', '\u{1D4EA}': 'a', '\u{1D4EB}': 'b', '\u{1D4EC}': 'c', '\u{1D4ED}': 'd',
        '\u{1D4EE}': 'e', '\u{1D4EF}': 'f', '\u{1D4F0}': 'g', '\u{1D4F1}': 'h', '\u{1D4F2}': 'i',
        '\u{1D4F3}': 'j', '\u{1D4F4}': 'k', '\u{1D4F5}': 'l', '\u{1D4F6}': 'm', '\u{1D4F7}': 'n',
        '\u{1D4F8}': 'o', '\u{1D4F9}': 'p', '\u{1D4FA}': 'q', '\u{1D4FB}': 'r', '\u{1D4FC}': 's',
        '\u{1D4FD}': 't', '\u{1D4FE}': 'u', '\u{1D4FF}': 'v', '\u{1D500}': 'w', '\u{1D501}': 'x',
        '\u{1D502}': 'y', '\u{1D503}': 'z',
        '\u{1D504}': 'A', '\u{1D505}': 'B', '\u{212D}': 'C', '\u{1D507}': 'D', '\u{1D508}': 'E',
        '\u{1D509}': 'F', '\u{1D50A}': 'G', '\u{210C}': 'H', '\u{2111}': 'I', '\u{1D50D}': 'J',
        '\u{1D50E}': 'K', '\u{1D50F}': 'L', '\u{1D510}': 'M', '\u{1D511}': 'N', '\u{1D512}': 'O',
        '\u{1D513}': 'P', '\u{1D514}': 'Q', '\u{211C}': 'R', '\u{1D516}': 'S', '\u{1D517}': 'T',
        '\u{1D518}': 'U', '\u{1D519}': 'V', '\u{1D51A}': 'W', '\u{1D51B}': 'X', '\u{1D51C}': 'Y',
        '\u{2128}': 'Z', '\u{1D51E}': 'a', '\u{1D51F}': 'b', '\u{1D520}': 'c', '\u{1D521}': 'd',
        '\u{1D522}': 'e', '\u{1D523}': 'f', '\u{1D524}': 'g', '\u{1D525}': 'h', '\u{1D526}': 'i',
        '\u{1D527}': 'j', '\u{1D528}': 'k', '\u{1D529}': 'l', '\u{1D52A}': 'm', '\u{1D52B}': 'n',
        '\u{1D52C}': 'o', '\u{1D52D}': 'p', '\u{1D52E}': 'q', '\u{1D52F}': 'r', '\u{1D530}': 's',
        '\u{1D531}': 't', '\u{1D532}': 'u', '\u{1D533}': 'v', '\u{1D534}': 'w', '\u{1D535}': 'x',
        '\u{1D536}': 'y', '\u{1D537}': 'z',
        '\u{1D538}': 'A', '\u{1D539}': 'B', '\u{2102}': 'C', '\u{1D53B}': 'D', '\u{1D53C}': 'E',
        '\u{1D53D}': 'F', '\u{1D53E}': 'G', '\u{210D}': 'H', '\u{1D540}': 'I', '\u{1D541}': 'J',
        '\u{1D542}': 'K', '\u{1D543}': 'L', '\u{1D544}': 'M', '\u{2115}': 'N', '\u{1D546}': 'O',
        '\u{2119}': 'P', '\u{211A}': 'Q', '\u{211D}': 'R', '\u{1D54A}': 'S', '\u{1D54B}': 'T',
        '\u{1D54C}': 'U', '\u{1D54D}': 'V', '\u{1D54E}': 'W', '\u{1D54F}': 'X', '\u{1D550}': 'Y',
        '\u{2124}': 'Z', '\u{1D552}': 'a', '\u{1D553}': 'b', '\u{1D554}': 'c', '\u{1D555}': 'd',
        '\u{1D556}': 'e', '\u{1D557}': 'f', '\u{1D558}': 'g', '\u{1D559}': 'h', '\u{1D55A}': 'i',
        '\u{1D55B}': 'j', '\u{1D55C}': 'k', '\u{1D55D}': 'l', '\u{1D55E}': 'm', '\u{1D55F}': 'n',
        '\u{1D560}': 'o', '\u{1D561}': 'p', '\u{1D562}': 'q', '\u{1D563}': 'r', '\u{1D564}': 's',
        '\u{1D565}': 't', '\u{1D566}': 'u', '\u{1D567}': 'v', '\u{1D568}': 'w', '\u{1D569}': 'x',
        '\u{1D56A}': 'y', '\u{1D56B}': 'z',
        '\u24B6': 'A', '\u24B7': 'B', '\u24B8': 'C', '\u24B9': 'D', '\u24BA': 'E',
        '\u24BB': 'F', '\u24BC': 'G', '\u24BD': 'H', '\u24BE': 'I', '\u24BF': 'J',
        '\u24C0': 'K', '\u24C1': 'L', '\u24C2': 'M', '\u24C3': 'N', '\u24C4': 'O',
        '\u24C5': 'P', '\u24C6': 'Q', '\u24C7': 'R', '\u24C8': 'S', '\u24C9': 'T',
        '\u24CA': 'U', '\u24CB': 'V', '\u24CC': 'W', '\u24CD': 'X', '\u24CE': 'Y',
        '\u24CF': 'Z', '\u24D0': 'a', '\u24D1': 'b', '\u24D2': 'c', '\u24D3': 'd',
        '\u24D4': 'e', '\u24D5': 'f', '\u24D6': 'g', '\u24D7': 'h', '\u24D8': 'i',
        '\u24D9': 'j', '\u24DA': 'k', '\u24DB': 'l', '\u24DC': 'm', '\u24DD': 'n',
        '\u24DE': 'o', '\u24DF': 'p', '\u24E0': 'q', '\u24E1': 'r', '\u24E2': 's',
        '\u24E3': 't', '\u24E4': 'u', '\u24E5': 'v', '\u24E6': 'w', '\u24E7': 'x',
        '\u24E8': 'y', '\u24E9': 'z',
        '\u1D00': 'A', '\u0299': 'B', '\u1D04': 'C', '\u1D05': 'D', '\u1D07': 'E',
        '\uA730': 'F', '\u0262': 'G', '\u029C': 'H', '\u026A': 'I', '\u1D0A': 'J',
        '\u1D0B': 'K', '\u029F': 'L', '\u1D0D': 'M', '\u0274': 'N', '\u1D0F': 'O',
        '\u1D18': 'P', '\u01EB': 'Q', '\u0280': 'R', '\uA731': 'S', '\u1D1B': 'T',
        '\u1D1C': 'U', '\u1D20': 'V', '\u1D21': 'W', '\u02E3': 'X', '\u028F': 'Y',
        '\u1D22': 'Z',
        '\uFF21': 'A', '\uFF22': 'B', '\uFF23': 'C', '\uFF24': 'D', '\uFF25': 'E',
        '\uFF26': 'F', '\uFF27': 'G', '\uFF28': 'H', '\uFF29': 'I', '\uFF2A': 'J',
        '\uFF2B': 'K', '\uFF2C': 'L', '\uFF2D': 'M', '\uFF2E': 'N', '\uFF2F': 'O',
        '\uFF30': 'P', '\uFF31': 'Q', '\uFF32': 'R', '\uFF33': 'S', '\uFF34': 'T',
        '\uFF35': 'U', '\uFF36': 'V', '\uFF37': 'W', '\uFF38': 'X', '\uFF39': 'Y',
        '\uFF3A': 'Z', '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd',
        '\uFF45': 'e', '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h', '\uFF49': 'i',
        '\uFF4A': 'j', '\uFF4B': 'k', '\uFF4C': 'l', '\uFF4D': 'm', '\uFF4E': 'n',
        '\uFF4F': 'o', '\uFF50': 'p', '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's',
        '\uFF54': 't', '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x',
        '\uFF59': 'y', '\uFF5A': 'z'
    };

    let result = '';
    for (const char of text) {
        if (charMaps[char]) {
            result += charMaps[char];
        } else {
            const code = char.codePointAt(0);
            if (code >= 0x1D5A0 && code <= 0x1D5B9) {
                result += String.fromCharCode(code - 0x1D5A0 + 65);
            } else if (code >= 0x1D5BA && code <= 0x1D5D3) {
                result += String.fromCharCode(code - 0x1D5BA + 97);
            } else if (code >= 0x1D5D4 && code <= 0x1D5ED) {
                result += String.fromCharCode(code - 0x1D5D4 + 65);
            } else if (code >= 0x1D5EE && code <= 0x1D607) {
                result += String.fromCharCode(code - 0x1D5EE + 97);
            } else if (code >= 0x1D608 && code <= 0x1D621) {
                result += String.fromCharCode(code - 0x1D608 + 65);
            } else if (code >= 0x1D622 && code <= 0x1D63B) {
                result += String.fromCharCode(code - 0x1D622 + 97);
            } else if (code >= 0x1D63C && code <= 0x1D655) {
                result += String.fromCharCode(code - 0x1D63C + 65);
            } else if (code >= 0x1D656 && code <= 0x1D66F) {
                result += String.fromCharCode(code - 0x1D656 + 97);
            } else if (code >= 0x1D670 && code <= 0x1D689) {
                result += String.fromCharCode(code - 0x1D670 + 65);
            } else if (code >= 0x1D68A && code <= 0x1D6A3) {
                result += String.fromCharCode(code - 0x1D68A + 97);
            } else if (code >= 0x1D434 && code <= 0x1D44D) {
                result += String.fromCharCode(code - 0x1D434 + 65);
            } else if (code >= 0x1D44E && code <= 0x1D467) {
                result += String.fromCharCode(code - 0x1D44E + 97);
            } else if (code >= 0x1D468 && code <= 0x1D481) {
                result += String.fromCharCode(code - 0x1D468 + 65);
            } else if (code >= 0x1D482 && code <= 0x1D49B) {
                result += String.fromCharCode(code - 0x1D482 + 97);
            } else if (code >= 0x1D56C && code <= 0x1D585) {
                result += String.fromCharCode(code - 0x1D56C + 65);
            } else if (code >= 0x1D586 && code <= 0x1D59F) {
                result += String.fromCharCode(code - 0x1D586 + 97);
            } else if (code >= 0x1D7CE && code <= 0x1D7D7) {
                result += String.fromCharCode(code - 0x1D7CE + 48);
            } else if (code >= 0x1D7D8 && code <= 0x1D7E1) {
                result += String.fromCharCode(code - 0x1D7D8 + 48);
            } else if (code >= 0x1D7E2 && code <= 0x1D7EB) {
                result += String.fromCharCode(code - 0x1D7E2 + 48);
            } else if (code >= 0x1D7EC && code <= 0x1D7F5) {
                result += String.fromCharCode(code - 0x1D7EC + 48);
            } else if (code >= 0x1D7F6 && code <= 0x1D7FF) {
                result += String.fromCharCode(code - 0x1D7F6 + 48);
            } else {
                result += char;
            }
        }
    }
    
    return result;
}

async function createWelcomeCanvas(gcImg, img1, img2, userName, userNumber, threadName, potato) {
    const width = 1200;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let i = -height; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
    }
    const lightGradient = ctx.createLinearGradient(0, 0, width, height);
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    lightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, width, height);
    const squares = [{
        x: 50,
        y: 50,
        size: 80,
        rotation: 15
    },
        {
            x: 1100,
            y: 80,
            size: 60,
            rotation: -20
        },
        {
            x: 150,
            y: 500,
            size: 50,
            rotation: 30
        },
        {
            x: 1050,
            y: 480,
            size: 70,
            rotation: -15
        },
        {
            x: 900,
            y: 30,
            size: 40,
            rotation: 45
        },
        {
            x: 200,
            y: 150,
            size: 35,
            rotation: -30
        },
        {
            x: 400,
            y: 80,
            size: 45,
            rotation: 60
        },
        {
            x: 700,
            y: 520,
            size: 55,
            rotation: -40
        },
        {
            x: 950,
            y: 250,
            size: 38,
            rotation: 25
        },
        {
            x: 300,
            y: 350,
            size: 42,
            rotation: -50
        }];

    squares.forEach(sq => {
        ctx.save();
        ctx.translate(sq.x + sq.size / 2, sq.y + sq.size / 2);
        ctx.rotate((sq.rotation * Math.PI) / 180);

        const sqGradient = ctx.createLinearGradient(-sq.size / 2, -sq.size / 2, sq.size / 2, sq.size / 2);
        sqGradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
        sqGradient.addColorStop(1, 'rgba(234, 88, 12, 0.1)');

        ctx.fillStyle = sqGradient;
        ctx.fillRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-sq.size / 2, -sq.size / 2, sq.size, sq.size);

        ctx.restore();
    });
    const circles = [{
        x: 250,
        y: 250,
        radius: 30,
        alpha: 0.15
    },
        {
            x: 850,
            y: 150,
            radius: 25,
            alpha: 0.12
        },
        {
            x: 600,
            y: 50,
            radius: 20,
            alpha: 0.1
        },
        {
            x: 100,
            y: 350,
            radius: 35,
            alpha: 0.18
        },
        {
            x: 1000,
            y: 380,
            radius: 28,
            alpha: 0.14
        },
        {
            x: 450,
            y: 480,
            radius: 22,
            alpha: 0.11
        }];

    circles.forEach(circ => {
        ctx.beginPath();
        ctx.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2);
        const circGradient = ctx.createRadialGradient(circ.x, circ.y, 0, circ.x, circ.y, circ.radius);
        circGradient.addColorStop(0, `rgba(249, 115, 22, ${circ.alpha})`);
        circGradient.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = circGradient;
        ctx.fill();

        ctx.strokeStyle = `rgba(249, 115, 22, ${circ.alpha * 2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
    const triangles = [{
        x: 550,
        y: 150,
        size: 40,
        rotation: 0
    },
        {
            x: 180,
            y: 420,
            size: 35,
            rotation: 180
        },
        {
            x: 1080,
            y: 320,
            size: 38,
            rotation: 90
        },
        {
            x: 380,
            y: 200,
            size: 32,
            rotation: -45
        }];

    triangles.forEach(tri => {
        ctx.save();
        ctx.translate(tri.x, tri.y);
        ctx.rotate((tri.rotation * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(0, -tri.size / 2);
        ctx.lineTo(-tri.size / 2, tri.size / 2);
        ctx.lineTo(tri.size / 2, tri.size / 2);
        ctx.closePath();

        const triGradient = ctx.createLinearGradient(-tri.size / 2, 0, tri.size / 2, 0);
        triGradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
        triGradient.addColorStop(1, 'rgba(234, 88, 12, 0.1)');
        ctx.fillStyle = triGradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    });

    async function drawCircularImage(imageSrc, x, y, radius, borderColor, borderWidth = 5) {
        try {
            const image = await loadImage(imageSrc);
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(x, y, radius + borderWidth, 0, Math.PI * 2);
            ctx.fillStyle = borderColor;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x, y, radius + borderWidth, 0, Math.PI * 2);
            ctx.fillStyle = borderColor;
            ctx.fill();
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
        } catch (err) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#1f1f1f';
            ctx.fill();
        }
    }
    
    const normalizedUserName = normalizeText(userName);
    const normalizedThreadName = normalizeText(threadName);
    const normalizedPotato = normalizeText(potato);
    
    await drawCircularImage(img2, width - 120, 100, 55, '#f97316');
    ctx.font = 'bold 20px "BeVietnamPro"';
    ctx.fillStyle = '#f97316';
    ctx.textAlign = 'right';
    ctx.fillText('Added by ' + normalizedPotato, width - 190, 105);
    await drawCircularImage(img1, 120, height - 100, 55, '#ea580c');
    ctx.font = 'bold 24px "BeVietnamPro"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(normalizedUserName, 190, height - 95);
    await drawCircularImage(gcImg, width / 2, 200, 90, '#f97316', 6);
    ctx.font = '600 42px "BeVietnamPro"';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(normalizedThreadName, width / 2, 335);
    ctx.font = 'italic 600 56px "Kanit"';
    const nameGradient = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
    nameGradient.addColorStop(0, '#f97316');
    nameGradient.addColorStop(1, '#ea580c');
    ctx.fillStyle = nameGradient;
    ctx.fillText('WELCOME', width / 2, 410);
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 180, 430);
    ctx.lineTo(width / 2 + 180, 430);
    ctx.stroke();
    ctx.font = '600 26px "BeVietnamPro"';
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'center';
    ctx.fillText(`You are the ${userNumber}th member`, width / 2, 480);

    return canvas.createPNGStream();
}

module.exports = {
    config: {
        name: "welcome",
        version: "1.2",
        author: "Allou Mohamed",
        category: "events"
    },

    onStart: async ({
        threadsData, event, message, usersData
    }) => {
        const type = "log:subscribe";
        if (event.logMessageType != type) return;
        
        try {
            await threadsData.refreshInfo(event.threadID);
            const threadsInfo = await threadsData.get(event.threadID);
            const gcImg = threadsInfo.imageSrc;
            const threadName = threadsInfo.threadName;
            const joined = event.logMessageData.addedParticipants[0].userFbId;
            const by = event.author;
            const img1 = await usersData.getAvatarUrl(joined);
            const img2 = await usersData.getAvatarUrl(by);
            const usernumber = threadsInfo.members?.length || 1;
            const userName = event.logMessageData.addedParticipants[0].fullName;
            const authorN = await usersData.getName(by);
            
            const welcomeImage = await createWelcomeCanvas(gcImg, img1, img2, userName, usernumber, threadName, authorN);
            
            const imagePath = path.join(__dirname, '../cmds/', global.utils.randomString(4) + ".png");
            const writeStream = fs.createWriteStream(imagePath);
            welcomeImage.pipe(writeStream);
            
            await new Promise((resolve) => {
                writeStream.on('finish', resolve);
            });

            await message.send({
                attachment: fs.createReadStream(imagePath)
            });
            
            fs.unlinkSync(imagePath);
        } catch (error) {
            console.error("[WELCOME] Error:", error.message);
            console.error(error.stack);
        }
    }
};
