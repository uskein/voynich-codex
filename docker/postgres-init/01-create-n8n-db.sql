-- Creates a dedicated database for n8n so it never pollutes the
-- application database (voynich_codex) with its internal tables.
CREATE DATABASE voynich_n8n;