
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import LogoutButton from "@/components/LogoutButton";
import { supabase } from "@/lib/supabase";

// Project type definition
interface Project {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  assignees: string[];
}

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", assignees: "" });

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching projects",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data as Project[];
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (project: { title: string; assignees: string[] }) => {
      if (!user) throw new Error("User not authenticated");
      
      const newProject = {
        title: project.title,
        user_id: user.id,
        assignees: project.assignees,
      };
      
      const { data, error } = await supabase
        .from("projects")
        .insert(newProject)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateDialogOpen(false);
      setNewProject({ title: "", assignees: "" });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProject.title.trim()) {
      toast({
        title: "Project title required",
        description: "Please enter a title for your project.",
        variant: "destructive",
      });
      return;
    }
    
    // Split assignees by comma and remove whitespace
    const assigneesList = newProject.assignees 
      ? newProject.assignees.split(',').map(email => email.trim()).filter(Boolean)
      : [];
    
    createProjectMutation.mutate({
      title: newProject.title,
      assignees: assigneesList,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agile Sprint Creator</h1>
        <LogoutButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Start a new agile project for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Create a new project to manage sprints and tasks.</p>
          </CardContent>
          <CardFooter>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new agile project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter project title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignees">Assignees (comma separated emails)</Label>
                    <Input
                      id="assignees"
                      placeholder="email1@example.com, email2@example.com"
                      value={newProject.assignees}
                      onChange={(e) => setNewProject({ ...newProject, assignees: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Projects you are participating in</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">View and manage your existing projects.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => navigate("/my-projects")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              View Projects
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <p className="text-muted-foreground mb-4">You don't have any projects yet.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Project</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/project/${project.id}`)}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>
                    Created on {new Date(project.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {project.assignees.length} team member{project.assignees.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/project/${project.id}`);
                  }}>
                    Open Project
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
