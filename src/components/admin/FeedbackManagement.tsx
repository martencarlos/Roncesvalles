// src/components/admin/FeedbackManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  X,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Bug,
  Lightbulb,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Pagination from "@/components/Pagination";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";



// Continuing from the previous code
interface Feedback {
    _id: string;
    name: string;
    email: string;
    apartmentNumber?: number;
    type: "bug" | "feature" | "question" | "other";
    content: string;
    status: "new" | "in-progress" | "resolved";
    userId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export default function FeedbackManagement() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Feedback details dialog
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // Delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // Fetch feedback data
    useEffect(() => {
      const fetchFeedbacks = async () => {
        setLoading(true);
        setError("");
        
        try {
          // Build the query URL with pagination and filters
          let url = `/api/feedback?page=${currentPage}&limit=${itemsPerPage}`;
          
          if (statusFilter !== "all") {
            url += `&status=${statusFilter}`;
          }
          
          if (typeFilter !== "all") {
            url += `&type=${typeFilter}`;
          }
          
          const res = await fetch(url);
          
          if (!res.ok) {
            throw new Error("Error al obtener feedback");
          }
          
          const data = await res.json();
          setFeedbacks(data.feedback);
          setTotalPages(data.totalPages);
          setTotalCount(data.totalCount);
        } catch (err: any) {
          setError(err.message);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchFeedbacks();
    }, [currentPage, itemsPerPage, statusFilter, typeFilter]);
    
    // Reset filters
    const resetFilters = () => {
      setSearchQuery("");
      setStatusFilter("all");
      setTypeFilter("all");
      setCurrentPage(1);
    };
    
    // Format feedback type
    const getFeedbackTypeLabel = (type: string) => {
      switch (type) {
        case "bug":
          return "Reporte de error";
        case "feature":
          return "Sugerencia";
        case "question":
          return "Pregunta";
        case "other":
          return "Otro";
        default:
          return type;
      }
    };
    
    // Get feedback type icon
    const getFeedbackTypeIcon = (type: string) => {
      switch (type) {
        case "bug":
          return <Bug className="h-4 w-4 text-red-500" />;
        case "feature":
          return <Lightbulb className="h-4 w-4 text-amber-500" />;
        case "question":
          return <HelpCircle className="h-4 w-4 text-blue-500" />;
        case "other":
          return <MessageSquare className="h-4 w-4 text-purple-500" />;
        default:
          return <MessageSquare className="h-4 w-4" />;
      }
    };
    
    // Get status badge
    const getStatusBadge = (status: string) => {
      switch (status) {
        case "new":
          return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Nuevo
            </Badge>
          );
        case "in-progress":
          return (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              En progreso
            </Badge>
          );
        case "resolved":
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Resuelto
            </Badge>
          );
        default:
          return (
            <Badge variant="outline">{status}</Badge>
          );
      }
    };
    
    // Update feedback status
    const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
      setIsSubmitting(true);
      
      try {
        const res = await fetch(`/api/feedback/${feedbackId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (!res.ok) {
          throw new Error("Error al actualizar el estado del feedback");
        }
        
        // Update feedback in the list
        setFeedbacks((prev) =>
          prev.map((feedback) =>
            feedback._id === feedbackId
              ? { ...feedback, status: newStatus as "new" | "in-progress" | "resolved" }
              : feedback
          )
        );
        
        // Update selected feedback if it's the one being viewed
        if (selectedFeedback && selectedFeedback._id === feedbackId) {
          setSelectedFeedback({
            ...selectedFeedback,
            status: newStatus as "new" | "in-progress" | "resolved",
          });
        }
        
        toast.success("Estado actualizado", {
          description: `El feedback ha sido marcado como "${
            newStatus === "new" ? "Nuevo" :
            newStatus === "in-progress" ? "En progreso" : "Resuelto"
          }"`,
        });
      } catch (err: any) {
        toast.error("Error", {
          description: err.message,
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    // Delete feedback
    const deleteFeedback = async () => {
      if (!deletingFeedback) return;
      
      setIsSubmitting(true);
      
      try {
        const res = await fetch(`/api/feedback/${deletingFeedback._id}`, {
          method: "DELETE",
        });
        
        if (!res.ok) {
          throw new Error("Error al eliminar el feedback");
        }
        
        // Remove feedback from the list
        setFeedbacks((prev) =>
          prev.filter((feedback) => feedback._id !== deletingFeedback._id)
        );
        
        toast.success("Feedback eliminado", {
          description: "El feedback ha sido eliminado correctamente",
        });
      } catch (err: any) {
        toast.error("Error", {
          description: err.message,
        });
      } finally {
        setIsSubmitting(false);
        setIsDeleteDialogOpen(false);
        setDeletingFeedback(null);
      }
    };
    
    // Handle page change
    const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo(0, 0); // Scroll to top when changing page
    };
    
    // Handle items per page change
    const handleItemsPerPageChange = (itemsPerPage: number) => {
      setItemsPerPage(itemsPerPage);
      setCurrentPage(1); // Reset to first page when changing items per page
    };
    
    // Format date
    const formatDate = (dateString: string) => {
      return format(new Date(dateString), "d MMM, yyyy - HH:mm", { locale: es });
    };
    
    // Filter feedback by search query (client-side)
    const filteredFeedbacks = feedbacks.filter((feedback) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        feedback.name.toLowerCase().includes(searchLower) ||
        (feedback.apartmentNumber?.toString() || "").includes(searchLower) ||
        feedback.email.toLowerCase().includes(searchLower) ||
        feedback.content.toLowerCase().includes(searchLower)
      );
    });
    
    return (
      <div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Filter controls */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email, apartamento o contenido..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevos</SelectItem>
                    <SelectItem value="in-progress">En progreso</SelectItem>
                    <SelectItem value="resolved">Resueltos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="bug">Reportes de error</SelectItem>
                    <SelectItem value="feature">Sugerencias</SelectItem>
                    <SelectItem value="question">Preguntas</SelectItem>
                    <SelectItem value="other">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="w-full"
                  disabled={!searchQuery && statusFilter === "all" && typeFilter === "all"}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Feedback summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-blue-600">Nuevos</CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold">{feedbacks.filter(f => f.status === "new").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-amber-600">En Progreso</CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold">{feedbacks.filter(f => f.status === "in-progress").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium text-green-600">Resueltos</CardTitle>
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold">{feedbacks.filter(f => f.status === "resolved").length}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Feedback list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Listado de Feedback
            </CardTitle>
            <CardDescription>
              {filteredFeedbacks.length} de {totalCount} elementos
              {searchQuery && " (filtrados)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback._id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getFeedbackTypeIcon(feedback.type)}
                        <h3 className="font-semibold">
                          {getFeedbackTypeLabel(feedback.type)}
                        </h3>
                        {getStatusBadge(feedback.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm mb-3">
                      <div className="font-medium">{feedback.name}</div>
                      <div className="text-muted-foreground hidden sm:block">•</div>
                      <div className="text-muted-foreground">{feedback.email}</div>
                      {feedback.apartmentNumber && (
                        <>
                          <div className="text-muted-foreground hidden sm:block">•</div>
                          <div>Apto. #{feedback.apartmentNumber}</div>
                        </>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{feedback.content}</p>
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-2">No se encontraron comentarios</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Intente cambiar los filtros de búsqueda"
                    : "Todavía no hay feedback en el sistema"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Feedback details dialog */}
        {selectedFeedback && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getFeedbackTypeIcon(selectedFeedback.type)}
                  {getFeedbackTypeLabel(selectedFeedback.type)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">{selectedFeedback.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(selectedFeedback.createdAt)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedFeedback.email}
                  </div>
                  {selectedFeedback.apartmentNumber && (
                    <div>
                      <span className="text-muted-foreground">Apartamento:</span>{" "}
                      #{selectedFeedback.apartmentNumber}
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-medium mb-2">Contenido:</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-line">
                    {selectedFeedback.content}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <h3 className="text-sm font-medium mb-2">Estado:</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedFeedback.status === "new" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFeedbackStatus(selectedFeedback._id, "new")}
                      disabled={isSubmitting || selectedFeedback.status === "new"}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Nuevo
                    </Button>
                    <Button
                      variant={selectedFeedback.status === "in-progress" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFeedbackStatus(selectedFeedback._id, "in-progress")}
                      disabled={isSubmitting || selectedFeedback.status === "in-progress"}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En Progreso
                    </Button>
                    <Button
                      variant={selectedFeedback.status === "resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFeedbackStatus(selectedFeedback._id, "resolved")}
                      disabled={isSubmitting || selectedFeedback.status === "resolved"}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resuelto
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setDeletingFeedback(selectedFeedback);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        
        {/* Delete confirmation dialog */}
        {deletingFeedback && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">Eliminar Feedback</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. El feedback será eliminado permanentemente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-gray-50 p-4 rounded-md text-sm">
                <p>
                  <span className="font-medium">Tipo:</span>{" "}
                  {getFeedbackTypeLabel(deletingFeedback.type)}
                </p>
                <p>
                  <span className="font-medium">Enviado por:</span>{" "}
                  {deletingFeedback.name}
                </p>
                {deletingFeedback.apartmentNumber && (
                  <p>
                    <span className="font-medium">Apartamento:</span>{" "}
                    #{deletingFeedback.apartmentNumber}
                  </p>
                )}
                <p>
                  <span className="font-medium">Fecha:</span>{" "}
                  {formatDate(deletingFeedback.createdAt)}
                </p>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingFeedback(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteFeedback}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar Feedback"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }