
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, ListChecks, User, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Sprint } from "@/types/sprint";
import { Task } from "@/types/task";
import SprintTask from "@/components/SprintTask";

interface SprintDetailsProps {
  sprint: Sprint;
  tasks: Task[];
  projectId: string;
}

const SprintDetails = ({ sprint, tasks, projectId }: SprintDetailsProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"todo" | "in-progress" | "done">("todo");
  
  // Remove task from sprint mutation
  const removeTaskFromSprintMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // First get the current sprint
      const { data: sprintData, error: sprintError } = await supabase
        .from("sprints")
        .select("tasks")
        .eq("id", sprint.id)
        .single();
        
      if (sprintError) throw sprintError;
      
      // Update the sprint without the task
      const updatedTasks = (sprintData.tasks || []).filter(id => id !== taskId);
      
      const { error: updateError } = await supabase
        .from("sprints")
        .update({ tasks: updatedTasks })
        .eq("id", sprint.id);
        
      if (updateError) throw updateError;
      
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      toast({
        title: "Task removed",
        description: "Task removed from sprint successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: "todo" | "in-progress" | "done" }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);
        
      if (error) throw error;
      
      return { taskId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast({
        title: "Task updated",
        description: "Task status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleRemoveTask = (taskId: string) => {
    removeTaskFromSprintMutation.mutate(taskId);
  };

  const handleStatusChange = (taskId: string, status: "todo" | "in-progress" | "done") => {
    updateTaskStatusMutation.mutate({ taskId, status });
  };

  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === "todo");
  const inProgressTasks = tasks.filter(task => task.status === "in-progress");
  const doneTasks = tasks.filter(task => task.status === "done");

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);
  const completedPoints = doneTasks.reduce((sum, task) => sum + task.points, 0);
  const progressPercentage = tasks.length > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Define empty sprints array for SprintTask component
  const emptySprintArray: Sprint[] = [];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Duration</p>
            <p className="text-sm text-muted-foreground">{durationDays} days</p>
          </div>
        </div>
        <div className="flex items-center">
          <ListChecks className="mr-2 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm text-muted-foreground">{progressPercentage}% complete</p>
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Story Points</p>
            <p className="text-sm text-muted-foreground">{completedPoints} / {totalPoints} points</p>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex space-x-1 mb-4">
        <Button
          variant={activeTab === "todo" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("todo")}
          className="flex-1"
        >
          To Do ({todoTasks.length})
        </Button>
        <Button
          variant={activeTab === "in-progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("in-progress")}
          className="flex-1"
        >
          In Progress ({inProgressTasks.length})
        </Button>
        <Button
          variant={activeTab === "done" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("done")}
          className="flex-1"
        >
          Done ({doneTasks.length})
        </Button>
      </div>

      <div className="space-y-3 mt-4">
        {activeTab === "todo" && (
          <>
            {todoTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks in To Do</p>
            ) : (
              todoTasks.map(task => (
                <SprintTask 
                  key={task.id} 
                  task={task}
                  sprints={emptySprintArray}
                  onDelete={() => handleRemoveTask(task.id)}
                  onUpdate={(updatedTask) => {
                    // This is just a placeholder since we're not fully implementing task updates here
                    console.log("Task updated:", updatedTask);
                  }}
                  onMove={() => {
                    // This is just a placeholder since we're not implementing move functionality
                    console.log("Move task");
                  }}
                />
              ))
            )}
          </>
        )}

        {activeTab === "in-progress" && (
          <>
            {inProgressTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tasks in progress</p>
            ) : (
              inProgressTasks.map(task => (
                <SprintTask 
                  key={task.id} 
                  task={task}
                  sprints={emptySprintArray}
                  onDelete={() => handleRemoveTask(task.id)}
                  onUpdate={(updatedTask) => {
                    // Update the task status if it changed
                    if (updatedTask.status !== task.status) {
                      handleStatusChange(task.id, updatedTask.status);
                    }
                  }}
                  onMove={() => {
                    // This is just a placeholder since we're not implementing move functionality
                    console.log("Move task");
                  }}
                />
              ))
            )}
          </>
        )}

        {activeTab === "done" && (
          <>
            {doneTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No completed tasks</p>
            ) : (
              doneTasks.map(task => (
                <SprintTask 
                  key={task.id} 
                  task={task}
                  sprints={emptySprintArray}
                  onDelete={() => handleRemoveTask(task.id)}
                  onUpdate={(updatedTask) => {
                    // Update the task status if it changed
                    if (updatedTask.status !== task.status) {
                      handleStatusChange(task.id, updatedTask.status);
                    }
                  }}
                  onMove={() => {
                    // This is just a placeholder since we're not implementing move functionality
                    console.log("Move task");
                  }}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SprintDetails;
