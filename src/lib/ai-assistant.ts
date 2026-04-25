import { supabase } from './supabase';

export async function processAIQuery(query: string): Promise<string> {
  // 1. Fetch Real-time Task & Team Data
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, description, due_date, status, priority, assigned_user:profiles!tasks_assigned_to_fkey(full_name)');
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('full_name, role, is_approved');

  // Configuration (Prioritize Env Vars)
  const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCFAt2PJ677bwJ4a5ffZ_aHcZKSWKpj3zA";

  const systemPrompt = `You are "Zyricon AI", the high-performance workspace intelligence engine for TaskFlow.
Your objective is to provide precise, data-driven insights based on REAL-TIME workspace state.

CURRENT WORKSPACE STATE:
- Timestamp: ${new Date().toLocaleString()}
- Active Tasks: ${JSON.stringify(tasks || [])}
- Team Members: ${JSON.stringify(profiles || [])}

CAPABILITIES:
1. TASK ANALYTICS: Completion rates, bottlenecks, and deadlines.
2. TEAM INSIGHTS: Load balancing and task assignments.
3. URGENCY DETECTION: Overdue or near-due monitoring.

RULES:
- Use **bold** for names, dates, and statuses.
- Use Markdown tables or bullet points.
- Keep responses professional and data-focused.`;

  // 3. AI Execution Logic (Hybrid)
  try {
    if (OPENAI_KEY) {
      // Execute via OpenAI GPT-4o
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.2
        })
      });
      const result = await response.json();
      return result.choices[0].message.content;
    } else {
      // Fallback/Default to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      });
      const result = await response.json();
      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text;
      }
      throw new Error("Gemini response parsing failed");
    }
  } catch (err: any) {
    return `AI Connection Error: ${err.message}. Ensure your API keys are valid in the Dashboard settings.`;
  }
}
