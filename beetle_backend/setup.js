const { spawn } = require("child_process");
const os = require("os");

// Check if we're on Windows
const isWindows = os.platform() === "win32";

// Choose the right script for the OS
const cmd = isWindows ? "setup.bat" : "bash";
const args = isWindows ? [] : ["setup.sh"];

// Run the script and show output in the terminal
const child = spawn(cmd, args, { stdio: "inherit", shell: true });

// Show exit status
child.on("exit", (code) => {
  console.log(`✅ Finished with code ${code}`);
});

// Show error if script fails to start
child.on("error", (err) => {
  console.error(`❌ Error: ${err.message}`);
});
