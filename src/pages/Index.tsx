
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
import { Task } from "@/types/task";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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
    setIsDialogOpen(false);
    toast({
      title: "Task created",
      description: "New task has been added to the sprint backlog.",
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

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">Tasks</h2>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {tasks.map((task) => (
                <SprintTask
                  key={task.id}
                  task={task}
                  onDelete={(id) => {
                    setTasks((prev) => prev.filter((t) => t.id !== id));
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

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg border border-border animate-fade-up">
            <p className="text-muted-foreground">
              No tasks yet. Click the "Add Task" button to create your first task.
            </p>
          </div>
        )}

        <CreateTaskDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onCreateTask={handleCreateTask}
        />
      </div>
    </div>
  );
};

export default Index;
