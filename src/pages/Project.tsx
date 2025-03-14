
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Plus, ArrowLeft, Calendar, ListChecks, 
  Inbox, Clock, Users, ChevronDown, ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Sprint } from "@/types/sprint";
import { Task } from "@/types/task";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import CreateSprintDialog from "@/components/CreateSprintDialog";
import SprintDetails from "@/components/SprintDetails";

interface Project {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  assignees: string[];
}

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({});

  // Fetch project details
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (error) {
        toast({
          title: "Error fetching project",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Project;
    },
  });

  // Fetch tasks for this project
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching tasks",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data as Task[];
    },
  });

  // Fetch sprints for this project
  const { data: sprints = [], isLoading: isSprintsLoading } = useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .order("startDate", { ascending: true });
      
      if (error) {
        toast({
          title: "Error fetching sprints",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data as Sprint[];
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "status" | "assignees">) => {
      if (!user) throw new Error("User not authenticated");
      
      const newTask = {
        ...task,
        id: crypto.randomUUID(),
        status: "todo" as const,
        assignees: [],
        project_id: projectId,
      };
      
      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setIsCreateTaskOpen(false);
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Create sprint mutation
  const createSprintMutation = useMutation({
    mutationFn: async (sprint: Omit<Sprint, "id" | "tasks">) => {
      if (!user) throw new Error("User not authenticated");
      
      const newSprint = {
        ...sprint,
        id: crypto.randomUUID(),
        tasks: [],
        project_id: projectId,
      };
      
      const { data, error } = await supabase
        .from("sprints")
        .insert(newSprint)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      setIsCreateSprintOpen(false);
      toast({
        title: "Sprint created",
        description: "Your sprint has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create sprint",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Add task to sprint mutation
  const addTaskToSprintMutation = useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      // First get the current sprint
      const { data: sprintData, error: sprintError } = await supabase
        .from("sprints")
        .select("tasks")
        .eq("id", sprintId)
        .single();
        
      if (sprintError) throw sprintError;
      
      // Update the sprint with the new task
      const updatedTasks = [...(sprintData.tasks || []), taskId];
      
      const { error: updateError } = await supabase
        .from("sprints")
        .update({ tasks: updatedTasks })
        .eq("id", sprintId);
        
      if (updateError) throw updateError;
      
      return { sprintId, taskId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      toast({
        title: "Task added",
        description: "Task added to sprint successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add task",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = (task: Omit<Task, "id" | "status" | "assignees">) => {
    createTaskMutation.mutate(task);
  };

  const handleCreateSprint = (sprint: Sprint) => {
    createSprintMutation.mutate({
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
  };

  const handleAddToSprint = (taskId: string, sprintId: string) => {
    addTaskToSprintMutation.mutate({ taskId, sprintId });
  };

  const toggleSprintExpansion = (sprintId: string) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  const backlogTasks = tasks.filter(task => 
    !sprints.some(sprint => sprint.tasks.includes(task.id))
  );

  const isLoading = isProjectLoading || isTasksLoading || isSprintsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <h1 className="text-3xl font-bold">{project.title}</h1>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="backlog">Product Backlog</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created On</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ListChecks className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Tasks</p>
                    <p className="text-sm text-muted-foreground">{tasks.length}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Active Sprints</p>
                    <p className="text-sm text-muted-foreground">
                      {sprints.filter(sprint => 
                        new Date(sprint.startDate) <= new Date() && 
                        new Date(sprint.endDate) >= new Date()
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Team Members</p>
                </div>
                <div className="pl-7 space-y-1">
                  {project.assignees.length > 0 ? (
                    project.assignees.map((assignee, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{assignee}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No team members assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backlog" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Product Backlog</h2>
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <CreateTaskDialog 
                  onCreateTask={handleCreateTask}
                  onCancel={() => setIsCreateTaskOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {backlogTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-4">No tasks in the product backlog.</p>
                <Button onClick={() => setIsCreateTaskOpen(true)}>Create First Task</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {backlogTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs ${
                          task.priority === "high" ? "bg-red-100 text-red-800" :
                          task.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {task.priority}
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {task.points} pts
                        </div>
                      </div>
                    </div>
                    
                    {sprints.length > 0 && (
                      <div className="mt-4 flex justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Add to Sprint</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Select Sprint</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                              {sprints.map((sprint) => (
                                <Button 
                                  key={sprint.id} 
                                  variant="outline" 
                                  className="w-full justify-start"
                                  onClick={() => {
                                    handleAddToSprint(task.id, sprint.id);
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {sprint.name} ({new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()})
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sprints" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Sprints</h2>
            <Dialog open={isCreateSprintOpen} onOpenChange={setIsCreateSprintOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Sprint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Sprint</DialogTitle>
                </DialogHeader>
                <CreateSprintDialog 
                  open={isCreateSprintOpen}
                  onClose={() => setIsCreateSprintOpen(false)}
                  onCreateSprint={handleCreateSprint}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {sprints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-4">No sprints created yet.</p>
                <Button onClick={() => setIsCreateSprintOpen(true)}>Create First Sprint</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sprints.map((sprint) => (
                <Card key={sprint.id} className="overflow-hidden">
                  <CardHeader className="p-4 cursor-pointer" onClick={() => toggleSprintExpansion(sprint.id)}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{sprint.name}</CardTitle>
                      <Button variant="ghost" size="sm">
                        {expandedSprints[sprint.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </div>
                      <div className="ml-4 flex items-center">
                        <ListChecks className="mr-1 h-4 w-4" />
                        {sprint.tasks.length} task{sprint.tasks.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedSprints[sprint.id] && (
                    <CardContent className="p-4 border-t">
                      <SprintDetails 
                        sprint={sprint} 
                        tasks={tasks.filter(task => sprint.tasks.includes(task.id))}
                        projectId={project.id}
                      />
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Project;
