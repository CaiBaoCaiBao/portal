export async function register() {
    // 只在 Node runtime 打日志时可用这个判断
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[portal] ready", process.env.NODE_ENV);
    }
}