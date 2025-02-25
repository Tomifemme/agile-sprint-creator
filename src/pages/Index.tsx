
import { useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SprintTask from "@/components/SprintTask";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import CreateSprintDialog from "@/components/CreateSprintDialog";
import { Task } from "@/types/task";
import { Sprint } from "@/types/sprint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const { toast } = useToast();

  const currentSprint = sprints.find((sprint) => sprint.id === selectedSprintId);
  const sprintTasks = tasks.filter((task) => 
    currentSprint?.tasks.includes(task.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
      });

      toast({
        title: "Task reordered",
        description: "The task has been moved to a new position.",
      });
    }
  };

  const handleCreateTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
    if (selectedSprintId) {
      setSprints((prev) =>
        prev.map((sprint) =>
          sprint.id === selectedSprintId
            ? { ...sprint, tasks: [...sprint.tasks, task.id] }
            : sprint
        )
      );
    }
    setIsTaskDialogOpen(false);
    toast({
      title: "Task created",
      description: "New task has been added to the sprint backlog.",
    });
  };

  const handleCreateSprint = (sprint: Sprint) => {
    setSprints((prev) => [...prev, sprint]);
    setSelectedSprintId(sprint.id);
    setIsSprintDialogOpen(false);
    toast({
      title: "Sprint created",
      description: "New sprint has been created.",
    });
  };

  const handleMoveTask = (taskId: string, targetSprintId: string) => {
    // Remove task from current sprint
    setSprints((prev) =>
      prev.map((sprint) =>
        sprint.id === selectedSprintId
          ? { ...sprint, tasks: sprint.tasks.filter((id) => id !== taskId) }
          : sprint
      )
    );

    // Add task to target sprint
    setSprints((prev) =>
      prev.map((sprint) =>
        sprint.id === targetSprintId
          ? { ...sprint, tasks: [...sprint.tasks, taskId] }
          : sprint
      )
    );

    toast({
      title: "Task moved",
      description: "Task has been moved to a different sprint.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Sprint Backlog</h1>
          <p className="text-muted-foreground">
            Organize and prioritize your sprint tasks
          </p>
        </header>

        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsSprintDialogOpen(true)}
              variant="outline"
              className="bg-background"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Sprint
            </Button>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Sprint" />
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
          <Button
            onClick={() => setIsTaskDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={!selectedSprintId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {selectedSprintId ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sprintTasks} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sprintTasks.map((task) => (
                  <SprintTask
                    key={task.id}
                    task={task}
                    sprints={sprints.filter((s) => s.id !== selectedSprintId)}
                    onMove={handleMoveTask}
                    onDelete={(id) => {
                      setTasks((prev) => prev.filter((t) => t.id !== id));
                      setSprints((prev) =>
                        prev.map((sprint) => ({
                          ...sprint,
                          tasks: sprint.tasks.filter((taskId) => taskId !== id),
                        }))
                      );
                      toast({
                        title: "Task deleted",
                        description: "The task has been removed from the sprint backlog.",
                      });
                    }}
                    onUpdate={(updatedTask) => {
                      setTasks((prev) =>
                        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                      );
                      toast({
                        title: "Task updated",
                        description: "The task has been successfully updated.",
                      });
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border animate-fade-up">
            <p className="text-muted-foreground">
              Select a sprint or create a new one to get started.
            </p>
          </div>
        )}

        {selectedSprintId && sprintTasks.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border border-border animate-fade-up">
            <p className="text-muted-foreground">
              No tasks yet. Click the "Add Task" button to create your first task.
            </p>
          </div>
        )}

        <CreateTaskDialog
          open={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onCreateTask={handleCreateTask}
        />
        <CreateSprintDialog
          open={isSprintDialogOpen}
          onClose={() => setIsSprintDialogOpen(false)}
          onCreateSprint={handleCreateSprint}
        />
      </div>
    </div>
  );
};

export default Index;
