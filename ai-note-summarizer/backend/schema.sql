-- ========================================================
-- Notes App Database Schema (MySQL 8.0+)
-- Intern Project: React + FastAPI + MySQL + OpenRouter AI
-- ========================================================

CREATE DATABASE IF NOT EXISTS notes_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE notes_db;

-- Drop table if exists for clean migrations
DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    ai_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at DESC),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Seed Data
INSERT INTO notes (title, content, category, ai_summary) VALUES
(
    'Internship Project Plan: Notes App',
    'Goal is to wire a React frontend with a FastAPI backend and MySQL database. Include full CRUD operations (Create, Read, Update, Delete) and an AI Summarize button using free LLM on OpenRouter.',
    'Work',
    'Full-stack React, FastAPI, and MySQL notes app with OpenRouter AI summarization.'
),
(
    'OpenRouter Free Models & API Setup',
    'Sign up on OpenRouter, generate an API key, store it in .env without committing to Git. Use meta-llama/llama-3.1-8b-instruct:free or similar free model for 1-line note summarization.',
    'Study',
    'Securely configure OpenRouter API in .env using free LLM models for concise summaries.'
),
(
    'Grocery List for Weekend Hackathon',
    'Need to pick up cold brew coffee, oat milk, sparkling water, dark chocolate, avocados, and protein snack bars for the study group coding session.',
    'Personal',
    'Essential groceries and snacks for weekend hackathon study group.'
);
