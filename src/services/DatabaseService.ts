import { Sprint } from '@/types/sprint';
import { Task } from '@/types/task';

// Local storage keys
const SPRINTS_KEY = 'sprints';
const TASKS_KEY = 'tasks';
const PRODUCT_BACKLOG_KEY = 'productBacklog';
const USERS_KEY = 'users'; // New key for storing all registered users

export class DatabaseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    // Initialize storage if needed
    this.initializeUserStorage();
  }

  // Initialize storage for new users
  private initializeUserStorage(): void {
    const sprintsKey = this.getKey(SPRINTS_KEY);
    const tasksKey = this.getKey(TASKS_KEY);
    const backlogKey = this.getKey(PRODUCT_BACKLOG_KEY);
    
    // Check if user data already exists
    if (!localStorage.getItem(sprintsKey)) {
      localStorage.setItem(sprintsKey, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(tasksKey)) {
      localStorage.setItem(tasksKey, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(backlogKey)) {
      localStorage.setItem(backlogKey, JSON.stringify([]));
    }
    
    // Initialize users list if it doesn't exist
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
  }

  // Get user-specific storage key
  private getKey(baseKey: string): string {
    return `${baseKey}_${this.userId}`;
  }

  // User methods
  static isEmailRegistered(email: string): boolean {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.some((user: { email: string }) => user.email === email);
  }

  static registerUser(email: string, password: string): void {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users.push({ email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  static validateCredentials(email: string, password: string): boolean {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.some((user: { email: string, password: string }) => 
      user.email === email && user.password === password
    );
  }

  // Sprint methods
  async getSprints(): Promise<Sprint[]> {
    const storedSprints = localStorage.getItem(this.getKey(SPRINTS_KEY));
    console.log('Getting sprints for user', this.userId, 'from key', this.getKey(SPRINTS_KEY), storedSprints);
    return storedSprints ? JSON.parse(storedSprints) : [];
  }

  async saveSprints(sprints: Sprint[]): Promise<void> {
    console.log('Saving sprints for user', this.userId, 'to key', this.getKey(SPRINTS_KEY), sprints);
    localStorage.setItem(this.getKey(SPRINTS_KEY), JSON.stringify(sprints));
  }

  async saveSprint(sprint: Sprint): Promise<Sprint> {
    const sprints = await this.getSprints();
    const existingIndex = sprints.findIndex(s => s.id === sprint.id);
    
    if (existingIndex >= 0) {
      sprints[existingIndex] = sprint;
    } else {
      sprints.push(sprint);
    }
    
    await this.saveSprints(sprints);
    return sprint;
  }

  async deleteSprint(sprintId: string): Promise<void> {
    const sprints = await this.getSprints();
    const filteredSprints = sprints.filter(sprint => sprint.id !== sprintId);
    await this.saveSprints(filteredSprints);
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    const storedTasks = localStorage.getItem(this.getKey(TASKS_KEY));
    console.log('Getting tasks for user', this.userId, 'from key', this.getKey(TASKS_KEY), storedTasks);
    return storedTasks ? JSON.parse(storedTasks) : [];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    console.log('Saving tasks for user', this.userId, 'to key', this.getKey(TASKS_KEY), tasks);
    localStorage.setItem(this.getKey(TASKS_KEY), JSON.stringify(tasks));
  }

  async saveTask(task: Task): Promise<Task> {
    const tasks = await this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    await this.saveTasks(tasks);
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    await this.saveTasks(filteredTasks);
    
    // Also remove task ID from any sprints that reference it
    const sprints = await this.getSprints();
    const updatedSprints = sprints.map(sprint => ({
      ...sprint,
      tasks: sprint.tasks.filter(id => id !== taskId)
    }));
    await this.saveSprints(updatedSprints);
  }

  // Product backlog methods
  async getProductBacklog(): Promise<Task[]> {
    const storedBacklog = localStorage.getItem(this.getKey(PRODUCT_BACKLOG_KEY));
    console.log('Getting product backlog for user', this.userId, 'from key', this.getKey(PRODUCT_BACKLOG_KEY), storedBacklog);
    return storedBacklog ? JSON.parse(storedBacklog) : [];
  }

  async saveProductBacklog(tasks: Task[]): Promise<void> {
    console.log('Saving product backlog for user', this.userId, 'to key', this.getKey(PRODUCT_BACKLOG_KEY), tasks);
    localStorage.setItem(this.getKey(PRODUCT_BACKLOG_KEY), JSON.stringify(tasks));
  }
}
