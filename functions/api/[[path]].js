// Notion API proxy for Ops HQ Dashboard
// Fetches tasks, grants from Notion Ops HQ

const NOTION_VERSION = '2025-09-03';
const TASKS_DS_ID = '2fced264-4bae-8177-af73-000b30469836';
const GRANTS_DS_ID = '2fced264-4bae-8123-93ac-000b4981a5e4';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === '/api/tasks') {
      const tasks = await fetchTasks(env.NOTION_API_KEY);
      return new Response(JSON.stringify({ success: true, tasks }), { 
        headers: corsHeaders() 
      });
    }

    if (path === '/api/tasks/overdue') {
      const tasks = await fetchTasks(env.NOTION_API_KEY);
      const today = new Date().toISOString().split('T')[0];
      const overdue = tasks.filter(t => t.due && t.due < today && t.status !== 'Done');
      return new Response(JSON.stringify({ success: true, tasks: overdue }), { 
        headers: corsHeaders() 
      });
    }

    if (path === '/api/tasks/today') {
      const tasks = await fetchTasks(env.NOTION_API_KEY);
      const today = new Date().toISOString().split('T')[0];
      const todays = tasks.filter(t => t.due === today && t.status !== 'Done');
      return new Response(JSON.stringify({ success: true, tasks: todays }), { 
        headers: corsHeaders() 
      });
    }

    if (path === '/api/grants') {
      const grants = await fetchGrants(env.NOTION_API_KEY);
      return new Response(JSON.stringify({ success: true, grants }), { 
        headers: corsHeaders() 
      });
    }

    if (path === '/api/stats') {
      const tasks = await fetchTasks(env.NOTION_API_KEY);
      const grants = await fetchGrants(env.NOTION_API_KEY);
      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        total: tasks.length,
        done: tasks.filter(t => t.status === 'Done').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        todo: tasks.filter(t => t.status === 'Todo' || t.status === 'No Status').length,
        p1: tasks.filter(t => t.priority === 'P1' && t.status !== 'Done').length,
        overdue: tasks.filter(t => t.due && t.due < today && t.status !== 'Done').length,
        dueToday: tasks.filter(t => t.due === today && t.status !== 'Done').length,
        grantsUrgent: grants.filter(g => {
          if (!g.deadline) return false;
          const daysUntil = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 7 && daysUntil >= 0;
        }).length
      };
      
      return new Response(JSON.stringify({ success: true, stats }), { 
        headers: corsHeaders() 
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function fetchTasks(notionKey) {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${TASKS_DS_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page_size: 100,
      sorts: [
        { property: 'Priority', direction: 'ascending' },
        { property: 'Due', direction: 'ascending' }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }

  const data = await response.json();
  
  return data.results.map(page => {
    const name = page.properties.Name?.title?.[0]?.plain_text || 'Untitled';
    const project = page.properties.Project?.relation?.[0]?.id || null;
    
    return {
      id: page.id,
      name: name,
      status: page.properties.Status?.select?.name || 'No Status',
      priority: page.properties.Priority?.select?.name || null,
      due: page.properties.Due?.date?.start || null,
      project: project,
      url: page.url
    };
  });
}

async function fetchGrants(notionKey) {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${GRANTS_DS_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page_size: 100
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${error}`);
  }

  const data = await response.json();
  
  return data.results.map(page => {
    const name = page.properties.Name?.title?.[0]?.plain_text || 
                 page.properties['Grant Name']?.title?.[0]?.plain_text || 
                 'Untitled Grant';
    
    return {
      id: page.id,
      name: name,
      status: page.properties.Status?.select?.name || null,
      deadline: page.properties['Due Date']?.date?.start || 
                page.properties.Deadline?.date?.start || null,
      amount: page.properties.Amount?.number || null,
      url: page.url
    };
  });
}
