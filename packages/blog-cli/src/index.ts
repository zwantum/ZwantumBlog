#!/usr/bin/env node
import { Command } from 'commander';
import { runInitCommand } from './commands/init';
import { runMigrateCommand } from './commands/migrate';
import { runDoctorCommand } from './commands/doctor';

const program = new Command();

program
  .name('zwantum-blog')
  .description('Universal Reusable Blog Module CLI for React & Next.js')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize ZwantumBlog configuration and files in the host project')
  .option('-b, --base-path <path>', 'Base URL path for the blog', '/blog')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    await runInitCommand(options);
  });

program
  .command('migrate')
  .description('Display or apply database migrations for Supabase/PostgreSQL')
  .action(async () => {
    await runMigrateCommand();
  });

program
  .command('doctor')
  .description('Diagnose host project integration health and setup')
  .action(async () => {
    await runDoctorCommand();
  });

program.parse(process.argv);
