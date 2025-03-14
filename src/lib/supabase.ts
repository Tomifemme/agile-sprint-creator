
import { createClient } from '@supabase/supabase-js';
import { type Task } from '@/types/task';
import { type Sprint } from '@/types/sprint';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Tasks
export async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select('*');
  
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data as Task[];
}

export async function createTask(task: Task) {
  const { error } = await supabase.from('tasks').insert(task);
  
  if (error) {
    console.error('Error creating task:', error);
    return false;
  }
  
  return true;
}

export async function updateTask(task: Task) {
  const { error } = await supabase
    .from('tasks')
    .update(task)
    .eq('id', task.id);
  
  if (error) {
    console.error('Error updating task:', error);
    return false;
  }
  
  return true;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  
  return true;
}

// Sprints
export async function fetchSprints() {
  const { data, error } = await supabase.from('sprints').select('*');
  
  if (error) {
    console.error('Error fetching sprints:', error);
    return [];
  }
  
  return data as Sprint[];
}

export async function createSprint(sprint: Sprint) {
  const { error } = await supabase.from('sprints').insert(sprint);
  
  if (error) {
    console.error('Error creating sprint:', error);
    return false;
  }
  
  return true;
}

export async function updateSprint(sprint: Sprint) {
  const { error } = await supabase
    .from('sprints')
    .update(sprint)
    .eq('id', sprint.id);
  
  if (error) {
    console.error('Error updating sprint:', error);
    return false;
  }
  
  return true;
}

export async function deleteTaskFromSprint(sprintId: string, taskId: string) {
  // First, get the current sprint
  const { data, error } = await supabase
    .from('sprints')
    .select('tasks')
    .eq('id', sprintId)
    .single();
  
  if (error) {
    console.error('Error fetching sprint:', error);
    return false;
  }
  
  // Update the sprint's tasks array
  const updatedTasks = (data.tasks as string[]).filter(id => id !== taskId);
  
  const { error: updateError } = await supabase
    .from('sprints')
    .update({ tasks: updatedTasks })
    .eq('id', sprintId);
  
  if (updateError) {
    console.error('Error updating sprint tasks:', updateError);
    return false;
  }
  
  return true;
}

export async function addTaskToSprint(sprintId: string, taskId: string) {
  // First, get the current sprint
  const { data, error } = await supabase
    .from('sprints')
    .select('tasks')
    .eq('id', sprintId)
    .single();
  
  if (error) {
    console.error('Error fetching sprint:', error);
    return false;
  }
  
  // Update the sprint's tasks array
  const updatedTasks = [...(data.tasks as string[]), taskId];
  
  const { error: updateError } = await supabase
    .from('sprints')
    .update({ tasks: updatedTasks })
    .eq('id', sprintId);
  
  if (updateError) {
    console.error('Error updating sprint tasks:', updateError);
    return false;
  }
  
  return true;
}

// Projects
export async function fetchProjects() {
  const { data, error } = await supabase.from('projects').select('*');
  
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return data;
}

export async function createProject(project: { title: string; user_id: string; assignees: string[] }) {
  const { error } = await supabase.from('projects').insert(project);
  
  if (error) {
    console.error('Error creating project:', error);
    return false;
  }
  
  return true;
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  
  return data;
}

export async function fetchTasksForProject(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) {
    console.error('Error fetching tasks for project:', error);
    return [];
  }
  
  return data as Task[];
}

export async function fetchSprintsForProject(projectId: string) {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('startDate', { ascending: true });
  
  if (error) {
    console.error('Error fetching sprints for project:', error);
    return [];
  }
  
  return data as Sprint[];
}
