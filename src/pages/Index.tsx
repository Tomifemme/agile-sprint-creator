import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, LogOut } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { DatabaseService } from "@/services/DatabaseService";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [productBacklogTasks, setProductBacklogTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isProductBacklogTaskDialogOpen, setIsProductBacklogTaskDialogOpen] = useState(false);
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const dbService = user ? new DatabaseService(user.id) : null;

  useEffect(() => {
    const loadData = async () => {
      if (!dbService) return;
      
      try {
        setIsLoading(true);
        
        const loadedSprints = await dbService.getSprints();
        setSprints(loadedSprints);
        
        if (loadedSprints.length > 0 && !currentSprint) {
          setCurrentSprint(loadedSprints[0]);
        }
        
        const loadedTasks = await dbService.getTasks();
        setTasks(loadedTasks);
        
        const loadedBacklog = await dbService.getProductBacklog();
        setProductBacklogTasks(loadedBacklog);
      } catch (error) {
        console.error('Failed to load data', error);
        toast({
          title: 'Error',
          description: 'Failed to load your sprint data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user, toast]);

  useEffect(() => {
    const saveTasks = async () => {
      if (!dbService || isLoading) return;
      
      try {
        await dbService.saveTasks(tasks);
      } catch (error) {
        console.error('Failed to save tasks', error);
      }
    };
    
    if (user && !isLoading) {
      saveTasks();
    }
  }, [tasks, user, isLoading]);

  useEffect(() => {
    const saveSprints = async () => {
      if (!dbService || isLoading) return;
      
      try {
        await dbService.saveSprints(sprints);
      } catch (error) {
        console.error('Failed to save sprints', error);
      }
    };
    
    if (user && !isLoading) {
      saveSprints();
    }
  }, [sprints, user, isLoading]);

  useEffect(() => {
    const saveProductBacklog = async () => {
      if (!dbService || isLoading) return;
      
      try {
        await dbService.saveProductBacklog(productBacklogTasks);
      } catch (error) {
        console.error('Failed to save product backlog', error);
      }
    };
    
    if (user && !isLoading) {
      saveProductBacklog();
    }
  }, [productBacklogTasks, user, isLoading]);

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

  const handleProductBacklogDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProductBacklogTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
      });

      toast({
        title: "Task reordered",
        description: "The task has been moved to a new position in product backlog.",
      });
    }
  };

  const handleCreateTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
    if (currentSprint) {
      setSprints((prev) =>
        prev.map((sprint) =>
          sprint.id === currentSprint.id
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

  const handleCreateProductBacklogTask = (task: Task) => {
    setProductBacklogTasks((prev) => [...prev, task]);
    setIsProductBacklogTaskDialogOpen(false);
    toast({
      title: "Task created",
      description: "New task has been added to the product backlog.",
    });
  };

  const handleCreateSprint = (sprint: Sprint) => {
    setSprints((prev) => [...prev, sprint]);
    setCurrentSprint(sprint);
    setIsSprintDialogOpen(false);
    toast({
      title: "Sprint created",
      description: "New sprint has been created.",
    });
  };

  const handleMoveTask = (taskId: string, targetSprintId: string) => {
    const sourceSprint = sprints.find(sprint => 
      sprint.tasks.includes(taskId)
    );

    if (sourceSprint) {
      setSprints((prev) =>
        prev.map((sprint) =>
          sprint.id === sourceSprint.id
            ? { ...sprint, tasks: sprint.tasks.filter((id) => id !== taskId) }
            : sprint
        )
      );

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
    }
  };

  const handleMoveToProductBacklog = (taskId: string) => {
    const taskToMove = tasks.find(task => task.id === taskId);
    
    if (taskToMove) {
      setProductBacklogTasks(prev => [...prev, taskToMove]);
      
      const sourceSprint = sprints.find(sprint => sprint.tasks.includes(taskId));
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      if (sourceSprint) {
        setSprints(prev => 
          prev.map(sprint => 
            sprint.id === sourceSprint.id 
              ? { ...sprint, tasks: sprint.tasks.filter(id => id !== taskId) } 
              : sprint
          )
        );
      }
      
      toast({
        title: "Task moved to Product Backlog",
        description: "Task has been moved to the product backlog.",
      });
    }
  };

  const handleMoveToSprint = (taskId: string, sprintId: string) => {
    const taskToMove = productBacklogTasks.find(task => task.id === taskId);
    
    if (taskToMove) {
      setTasks(prev => [...prev, taskToMove]);
      
      setSprints(prev => 
        prev.map(sprint => 
          sprint.id === sprintId 
            ? { ...sprint, tasks: [...sprint.tasks, taskId] } 
            : sprint
        )
      );
      
      setProductBacklogTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Task moved to Sprint",
        description: "Task has been moved to the selected sprint.",
      });
    }
  };

  const toggleSprintCollapse = (sprintId: string) => {
    setCollapsedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  const getSprintTasks = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return [];
    
    return tasks.filter(task => sprint.tasks.includes(task.id));
  };

  const handleSelectSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      setCurrentSprint(sprint);
      toast({
        title: "Sprint selected",
        description: `${sprint.name} is now the current sprint.`,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle the state update and redirection
    } catch (error) {
      console.error('Logout failed', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading your sprint backlog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="text-center space-y-4 relative">
          <div className="absolute right-0 top-0">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          
          <h1 className="text-4xl font-bold text-primary">Sprint Backlog</h1>
          <p className="text-muted-foreground">
            Organize and prioritize your sprint tasks
          </p>
        </header>

        <div className="flex justify-between items-center gap-4 flex-wrap">
          <Button
            onClick={() => setIsSprintDialogOpen(true)}
            variant="outline"
            className="bg-background"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Sprint
          </Button>
          
          {sprints.length > 0 && (
            <Select onValueChange={handleSelectSprint} value={currentSprint?.id || ""}>
              <SelectTrigger className="w-[180px] bg-background">
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
          )}
          
          <Button
            onClick={() => setIsTaskDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white ml-auto"
            disabled={!currentSprint}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {currentSprint ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Sprint Backlog</h2>
            
            <div key={currentSprint.id} className="mb-8">
              <div 
                className="flex items-center justify-between bg-card p-4 rounded-t-lg border border-border cursor-pointer"
                onClick={() => toggleSprintCollapse(currentSprint.id)}
              >
                <div>
                  <h3 className="text-xl font-medium">{currentSprint.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentSprint.startDate).toLocaleDateString()} - {new Date(currentSprint.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-2">{getSprintTasks(currentSprint.id).length} tasks</span>
                  {collapsedSprints[currentSprint.id] ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {!collapsedSprints[currentSprint.id] && (
                <div className="bg-card/50 p-4 rounded-b-lg border-x border-b border-border">
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={getSprintTasks(currentSprint.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {getSprintTasks(currentSprint.id).map((task) => (
                          <SprintTask
                            key={task.id}
                            task={task}
                            sprints={sprints.filter((s) => s.id !== currentSprint.id)}
                            onMove={handleMoveTask}
                            onDelete={(id) => {
                              setTasks((prev) => prev.filter((t) => t.id !== id));
                              setSprints((prev) =>
                                prev.map((s) => ({
                                  ...s,
                                  tasks: s.tasks.filter((taskId) => taskId !== id),
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
                            onMoveToBacklog={handleMoveToProductBacklog}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  {getSprintTasks(currentSprint.id).length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        No tasks in this sprint. Click the "Add Task" button to create a task.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border animate-fade-up">
            <p className="text-muted-foreground">
              {sprints.length > 0 
                ? "Select a sprint using the dropdown above." 
                : "Create a new sprint to get started."}
            </p>
          </div>
        )}

        <div className="mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Product Backlog</h2>
            <Button
              onClick={() => setIsProductBacklogTaskDialogOpen(true)}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Backlog
            </Button>
          </div>
          
          <DndContext collisionDetection={closestCenter} onDragEnd={handleProductBacklogDragEnd}>
            <SortableContext items={productBacklogTasks} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {productBacklogTasks.map((task) => (
                  <SprintTask
                    key={task.id}
                    task={task}
                    sprints={sprints}
                    onMove={(taskId, sprintId) => handleMoveToSprint(taskId, sprintId)}
                    onDelete={(id) => {
                      setProductBacklogTasks((prev) => prev.filter((t) => t.id !== id));
                      toast({
                        title: "Task deleted",
                        description: "The task has been removed from the product backlog.",
                      });
                    }}
                    onUpdate={(updatedTask) => {
                      setProductBacklogTasks((prev) =>
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
          
          {productBacklogTasks.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg border border-border animate-fade-up">
              <p className="text-muted-foreground">
                Your product backlog is empty. Add tasks to track future work.
              </p>
            </div>
          )}
        </div>

        <CreateTaskDialog
          open={isTaskDialogOpen}
          onClose={() => setIsTaskDialogOpen(false)}
          onCreateTask={handleCreateTask}
          sprints={sprints}
          selectedSprintId={currentSprint?.id}
        />
        <CreateTaskDialog
          open={isProductBacklogTaskDialogOpen}
          onClose={() => setIsProductBacklogTaskDialogOpen(false)}
          onCreateTask={handleCreateProductBacklogTask}
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
