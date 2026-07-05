import { execSync } from 'child_process';

const port = process.argv[2] || '3001';

function freePortWin() {
  let out = '';
  try {
    out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
  } catch {
    console.log(`Port ${port} is free.`);
    return;
  }

  const pids = new Set();
  for (const line of out.trim().split('\n')) {
    const pid = line.trim().split(/\s+/).pop();
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  if (pids.size === 0) {
    console.log(`Port ${port} is free.`);
    return;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`Stopped process ${pid} on port ${port}`);
    } catch {
      console.warn(`Could not stop PID ${pid}`);
    }
  }
}

function freePortUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'inherit', shell: true });
    console.log(`Freed port ${port}`);
  } catch {
    console.log(`Port ${port} is free.`);
  }
}

if (process.platform === 'win32') freePortWin();
else freePortUnix();