import { spawn } from 'child_process';

console.log('\n======================================================');
console.log('🚀 STARTING SMART WASTE MANAGEMENT SYSTEM (DEV MODE)');
console.log('======================================================');
console.log('➜  Backend API : http://localhost:5000');
console.log('➜  Frontend UI : http://localhost:3000 (Opening in browser...)');
console.log('======================================================\n');

const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: './server',
  stdio: 'inherit',
  shell: true
});

const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: './client',
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  try { serverProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
