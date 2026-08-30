// Starts backend + frontend together. No dependencies needed.
// Usage from project root:  npm start   (or: node start.js)
const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
let shuttingDown = false;

function start(name, colorCode, cwd, command) {
  const child = spawn(command, {
    cwd: path.join(__dirname, cwd),
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' },
  });

  const tag = `\x1b[${colorCode}m[${name}]\x1b[0m`;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) out.write(`${tag} ${line}\n`);
    });
    stream.on('end', () => {
      if (buffer) out.write(`${tag} ${buffer}\n`);
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on('exit', (code) => {
    console.log(`${tag} exited with code ${code}`);
    shutdown();
  });

  return child;
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of procs) {
    if (p.pid && !p.killed) {
      if (isWin) {
        // /T kills the whole process tree (npm -> nodemon/vite -> node)
        spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { shell: true });
      } else {
        p.kill('SIGTERM');
      }
    }
  }
  setTimeout(() => process.exit(0), 500);
}

const procs = [
  start('backend', '36', 'backend', 'npm run dev'),
  start('frontend', '35', 'frontend', 'npm run dev'),
];

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\x1b[33mStarting backend + frontend. Press Ctrl+C to stop both.\x1b[0m');
