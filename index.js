/**
 * @author NTKhang & Modded by NeoKEX
 * ! The source code is written by NTKhang, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
        // --expose-gc  : lets MemoryManager call global.gc() to force V8 GC when heap is high
        // --max-old-space-size=400 : caps V8 old-gen heap at 400 MB so Node aggressively collects
        //   before the host (Render 512 MB container) hits its limit and OOM-kills the process
        const child = spawn(process.execPath, ["--expose-gc", "--max-old-space-size=400", "Goat.js"], {
                cwd: __dirname,
                stdio: "inherit",
                shell: false,
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
        });

        child.on("close", (code) => {
                log.info("Project stopped with code:", code);
                if (code === 0) {
                        log.info("Project", "Stopped cleanly. Not restarting.");
                        return;
                }
                const delay = code === 2 ? 0 : 3000;
                log.info("Project", `Restarting in ${delay / 1000}s...`);
                setTimeout(() => startProject(), delay);
        });
}

startProject();
