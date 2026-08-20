#!/usr/bin/env node
/**
 * Cross-platform stop script for Voynich Codex
 * Usage: node scripts/stop.js
 */

const { exec } = require('child_process');
const path = require('path');

console.log('Stopping Voynich Codex...\n');

const cmd = 'docker-compose down';
const cwd = path.join(__dirname, '..');

exec(cmd, { cwd }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error stopping services: ${error.message}`);
    process.exit(1);
  }
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  console.log('All services stopped successfully');
});
