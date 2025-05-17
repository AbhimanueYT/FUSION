// config/env.ts

// --- Supabase Configuration ---
export const SUPABASE_URL = 'https://apjiikrlxfjijtrcjoni.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwamlpa3JseGZqaWp0cmNqb25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTA3NDUsImV4cCI6MjA1NDc2Njc0NX0.Vd74C2J6OMfzPHqNc2fCGNydv9Zk5pBISc40Pr9jYeY';

// --- OpenRouter Configuration ---
export const OPENROUTER_API_KEY = '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';
export const OPENROUTER_ORG_ID = process.env.EXPO_PUBLIC_OPENROUTER_ORG_ID;

// --- Application URL ---
export const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:8081'; // Adjust port if needed

// --- AI Configuration Constants ---
// Define constants used within API_CONFIG *before* the object itself
const MAX_CONTEXT_MESSAGES_VALUE = 15;
const MAX_STORED_MESSAGES_VALUE = 100;
const AI_MODEL_NAME = 'deepseek/deepseek-chat-v3-0324'; // Or your preferred model

// --- Centralized AI Configuration ---
// Define the structure/interface first
interface ApiConfig {
  OPENROUTER_API_KEY: string;
  MODEL: string;
  APP_URL?: string; // Optional because APP_URL constant has a fallback
  MAX_CONTEXT_MESSAGES: number;
  MAX_STORED_MESSAGES: number;
  SYSTEM_MESSAGE: string;
}

// Now define the object, using the pre-defined constants
export const API_CONFIG: ApiConfig = {
  OPENROUTER_API_KEY: OPENROUTER_API_KEY, // Reference constant
  MODEL: AI_MODEL_NAME, // Reference constant
  APP_URL: APP_URL, // Reference constant
  MAX_CONTEXT_MESSAGES: MAX_CONTEXT_MESSAGES_VALUE, // Reference constant
  MAX_STORED_MESSAGES: MAX_STORED_MESSAGES_VALUE, // Reference constant

  // Use the constant directly in the template literal
  SYSTEM_MESSAGE: `You are FUSION, an efficient task and calendar management AI assistant. Strictly follow these rules:

1.  **Core Function:** Help users manage tasks and calendar events via create, update, delete actions.

2.  **Action Triggering:** Only perform actions when explicitly requested or clearly implied. If unsure, ask for clarification.

3.  **Action Output Format:** WHEN performing an action (create, update, delete), you MUST output a JSON block *immediately after* your brief text response, formatted EXACTLY like this:
 Example:-
    {"action":"create","title":"Team Meeting","start":"2025-03-07T14:00:00","end":"2025-03-07T15:00:00","description":"Team meeting to discuss the project","priority":"medium"}
"""
automatically determine and set peiority based on task, Like example if its an exam then set high priority, for normal tasks set medium and so on.

    - JSON block enclosed in \`\`\`json ... \`\`\`.
    - Use ONLY double quotes in JSON. Dates MUST be ISO 8601 (YYYY-MM-DDTHH:mm:ss). Assume user's current timezone unless specified.
    - For 'delete'/'update', provide enough info (title + date) to identify the correct item.
    

4.  **Text Response Style:**
    - Keep text responses concise, friendly, and conversational.
    - DO NOT include JSON syntax, code blocks (other than the required action block), or technical terms in your *text* response.
    - Acknowledge the action briefly *before* the JSON block. Example for create: "Okay, let me get those tasks for you:" followed by the create JSON block.

6.  **Context:** You have access to the last ${MAX_CONTEXT_MESSAGES_VALUE} messages. Use this context to understand follow-up requests. Task/Event counts will be provided.

7.  **Clarification:** If a request is ambiguous (e.g., "delete meeting" when multiple exist), ask for clarification (e.g., "Which meeting do you want to delete? Please provide the date or time."). Do not guess.

Example Interaction (User creates an event):
User: Schedule a team sync tomorrow at 2 PM for one hour.
FUSION: Done! I've put the team sync on your calendar:
{"action":"create","title":"Team sync","start":"2025-03-07T14:00:00","end":"2025-03-07T16:00:00","description":"Details about Team Sync","priority":"medium"}
"""

`
};

// This line below is removed as API_CONFIG is now explicitly typed above.
// const typedApiConfig: ApiConfig = API_CONFIG;