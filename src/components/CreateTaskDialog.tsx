import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { User } from "@/types/user";
import { Avatar } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { Sprint } from "@/types/sprint";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  sprints?: Sprint[];
  selectedSprintId?: string;
}

const MOCK_USERS: User[] = [
  { id: "1", name: "John Doe", avatarUrl: "https://github.com/shadcn.png" },
  { id: "2", name: "Jane Smith", avatarUrl: "https://github.com/shadcn.png" },
  { id: "3", name: "Bob Johnson", avatarUrl: "https://github.com/shadcn.png" },
];

const CreateTaskDialog = ({ open, onClose, onCreateTask, sprints, selectedSprintId }: CreateTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [points, setPoints] = useState("");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState(selectedSprintId || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority: priority || "medium", // Default to medium if not selected
      points: Number(points) || 1, // Default to 1 if not valid
      status,
      assignees,
    };
    onCreateTask(newTask);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setPoints("");
    setStatus("todo");
    setAssignees([]);
    setSprintId(selectedSprintId || "");
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as "todo" | "in-progress" | "done");
  };

  const toggleAssignee = (userId: string) => {
    setAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only positive numbers
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1)) {
      setPoints(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          {sprints && sprints.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="sprint">Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {MOCK_USERS.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant={assignees.includes(user.id) ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => toggleAssignee(user.id)}
                >
                  <Avatar className="w-6 h-6">
                    <img src={user.avatarUrl} alt={user.name} />
                  </Avatar>
                  {user.name}
                  {assignees.includes(user.id) && (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Story Points</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={points}
              onChange={handlePointsChange}
              placeholder="Enter story points"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;