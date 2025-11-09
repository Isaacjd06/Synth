-- Rename table from BrainReport to synth_updates and update default title
ALTER TABLE "BrainReport" RENAME TO "synth_updates";

-- Update default title value in existing records (optional)
UPDATE "synth_updates" SET title = 'Synth Updates' WHERE title = 'Synth Brain Report';
