-- Custom SQL migration file, put your code below! --
DELETE FROM "files" WHERE "url" LIKE 'local://%';
DELETE FROM "global_files" WHERE "url" LIKE 'local://%';