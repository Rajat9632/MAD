// Utility script to kill process on port 5000
// Usage: node kill-port.js [port]

const { exec } = require('child_process');
const port = process.argv[2] || '5000';

console.log(`Finding process on port ${port}...`);

// Windows command
exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error finding process: ${error.message}`);
    return;
  }

  if (!stdout) {
    console.log(`No process found on port ${port}`);
    return;
  }

  // Parse PID from output
  const lines = stdout.trim().split('\n');
  const pids = new Set();
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 0) {
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log(`Could not find PID for port ${port}`);
    return;
  }

  console.log(`Found ${pids.size} process(es) on port ${port}:`);
  pids.forEach(pid => console.log(`  PID: ${pid}`));

  // Kill all processes
  pids.forEach(pid => {
    console.log(`Killing process ${pid}...`);
    exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
      if (killError) {
        console.error(`Failed to kill PID ${pid}: ${killError.message}`);
      } else {
        console.log(`✓ Successfully killed PID ${pid}`);
      }
    });
  });
});

