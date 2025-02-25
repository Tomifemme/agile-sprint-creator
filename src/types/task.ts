
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  points: number;
  status: "todo" | "in-progress" | "done";
}
