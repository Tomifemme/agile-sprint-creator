
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grip, Trash, Edit } from "lucide-react";
import { useState } from "react";
import EditTaskDialog from "./EditTaskDialog";

interface SprintTaskProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: (task: Task) => void;
}

const SprintTask = ({ task, onDelete, onUpdate }: SprintTaskProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in-progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="p-4 backdrop-blur-sm bg-card/80 border shadow-sm hover:shadow-md transition-shadow animate-fade-up"
      >
        <div className="flex items-start gap-4">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 touch-none"
            aria-label="Drag to reorder"
          >
            <Grip className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {getStatusLabel(task.status)}
              </span>
              <span className="text-xs text-muted-foreground">
                {task.points} points
              </span>
            </div>
          </div>
        </div>
      </Card>

      <EditTaskDialog
        task={task}
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdateTask={onUpdate}
      />
    </>
  );
};

export default SprintTask;
