import { supabase } from './supabase';

export async function processAIQuery(query: string): Promise<string> {
  // 1. Fetch Real-time Task Data
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, description, due_date, status, priority, assigned_user:profiles!tasks_assigned_to_fkey(full_name)');
  
  // 2. Fetch Real-time Team Data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('full_name, role, is_approved');

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const systemPrompt = `You are "Zyricon AI", the high-performance workspace intelligence engine for TaskFlow.
Your objective is to provide precise, data-driven insights based on REAL-TIME workspace state.

CURRENT WORKSPACE STATE:
- Timestamp: ${new Date().toLocaleString()}
- Active Tasks: ${JSON.stringify(tasks || [])}
- Team Members: ${JSON.stringify(profiles || [])}

CAPABILITIES:
1. TASK ANALYTICS: Calculate completion rates, identify bottlenecks (Blocked tasks), and track deadlines.
2. TEAM INSIGHTS: Identify which employees are overloaded or who is responsible for specific high-priority tasks.
3. URGENCY DETECTION: Highlight tasks that are overdue or due within the next 24 hours.

RULES:
- Always use **bold** for names, dates, and status levels.
- Use clean Markdown tables or bullet points for lists.
- If the user asks about someone specifically (e.g. "What is MOMO doing?"), look into the Active Tasks for that user.
- Keep responses professional, data-focused, and concise.
- If data is missing for a specific query, suggest checking the Dashboard filters.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUser Question: ${query}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for factual accuracy
          maxOutputTokens: 1200,
        }
      })
    });

    const result = await response.json();
    
    if (result.error) {
      return `AI Configuration Error: ${result.error.message}`;
    }

    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      return result.candidates[0].content.parts[0].text;
    }

    return "I analyzed the data but couldn't generate a clear insight. Please rephrase your question.";
  } catch (err: any) {
    return "Connection Error: I couldn't reach the intelligence engine. " + err.message;
  }
}
