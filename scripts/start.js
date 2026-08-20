#!/usr/bin/env node
/**
 * Cross-platform start script for Voynich Codex
 * Usage: node scripts/start.js
 */

const { exec } = require('child_process');
const path = require('path');

const commands = [
  { name: 'Docker', cmd: 'docker-compose up -d' },
  { name: 'Backend', cmd: 'npm run dev:backend', cwd: path.join(__dirname, '..') },
  { name: 'Gateway', cmd: 'npm run dev:gateway', cwd: path.join(__dirname, '..') },
  { name: 'Frontend', cmd: 'npm run dev:frontend', cwd: path.join(__dirname, '..') },
];

console.log('Starting Voynich Codex...\n');

// Start Docker first
const docker = exec(commands[0].cmd, { cwd: path.join(__dirname, '..') });
docker.stdout?.pipe(process.stdout);
docker.stderr?.pipe(process.stderr);

docker.on('close', (code) => {
  if (code !== 0) {
    console.error(`Failed to start ${commands[0].name}`);
    process.exit(1);
  }
  console.log(`${commands[0].name} started successfully\n`);

  // Start services in parallel
  for (let i = 1; i < commands.length; i++) {
    const child = exec(commands[i].cmd, { cwd: commands[i].cwd });
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    console.log(`${commands[i].name} starting...`);
  }
});
