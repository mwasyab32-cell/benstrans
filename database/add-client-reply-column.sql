-- Add client_reply column to contacts table
USE bensdb;

ALTER TABLE contacts 
ADD COLUMN client_reply TEXT NULL AFTER admin_reply,
ADD COLUMN client_replied_at TIMESTAMP NULL AFTER replied_at;
