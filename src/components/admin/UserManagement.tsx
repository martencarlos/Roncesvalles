// src/components/admin/UserManagement.tsx
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Loader2,
  UserX,
  UserCog,
  Search,
  X,
  FilterIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  apartmentNumber?: number;
  createdAt: string;
}

interface UserManagementProps {
  isITAdmin: boolean;
}

export default function UserManagement({ isITAdmin }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New user form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    apartmentNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user form state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  // Delete user dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Generate apartment numbers 1-48
  const apartmentNumbers = Array.from({ length: 48 }, (_, i) => i + 1);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/users");

        if (!res.ok) {
          throw new Error("Error al obtener usuarios");
        }

        const data = await res.json();
        setUsers(data);
        applyFilters(data, searchQuery, roleFilter);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filters
  const applyFilters = (usersList: User[], query: string, role: string) => {
    let filtered = [...usersList];

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          user.apartmentNumber?.toString().includes(lowerQuery)
      );
    }

    // Filter by role
    if (role !== "all") {
      filtered = filtered.filter((user) => user.role === role);
    }

    setFilteredUsers(filtered);
  };

  // Handle search and filter
  useEffect(() => {
    applyFilters(users, searchQuery, roleFilter);
  }, [users, searchQuery, roleFilter]);

  // Reset filter
  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
  };

  // Handle add user
  const handleAddUser = async () => {
    // Validation
    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.password ||
      (newUser.role === "user" && !newUser.apartmentNumber)
    ) {
      toast.error("Por favor, complete todos los campos requeridos");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        ...(newUser.role === "user" && newUser.apartmentNumber
          ? { apartmentNumber: parseInt(newUser.apartmentNumber) }
          : {}),
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      // Add the new user to the list
      setUsers((prev) => [...prev, data]);

      // Reset form and close dialog
      setNewUser({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
        apartmentNumber: "",
      });
      setIsAddUserOpen(false);

      toast.success("Usuario creado correctamente");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      password: "",
      confirmPassword: "",
    });
    setIsEditUserOpen(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // Validation
    if (!editForm.name) {
      toast.error("El nombre es requerido");
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);

    try {
      const userData: any = {
        name: editForm.name,
      };

      // Only IT Admins can change roles
      if (isITAdmin) {
        userData.role = editForm.role;
      }

      // Only include password if provided
      if (editForm.password) {
        userData.password = editForm.password;
      }

      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar usuario");
      }

      // Update the user in the list
      setUsers((prev) =>
        prev.map((user) => (user._id === editingUser._id ? data : user))
      );

      // Reset form and close dialog
      setIsEditUserOpen(false);
      setEditingUser(null);

      toast.success("Usuario actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/users/${userToDelete._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar usuario");
      }

      // Remove the user from the list
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));

      // Reset state and close dialog
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);

      toast.success("Usuario eliminado correctamente");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o apartamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full sm:w-80"
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por rol" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="user">Usuarios</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="conserje">Conserjes</SelectItem>
              <SelectItem value="it_admin">Administradores IT</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || roleFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}

          {isITAdmin && (
            <Button onClick={() => setIsAddUserOpen(true)} className="ml-2">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="truncate max-w-xs">
                      {user.email}
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      user.role === "user"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : user.role === "admin"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : user.role === "conserje"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {user.role === "user"
                      ? "Usuario"
                      : user.role === "admin"
                      ? "Administrador"
                      : user.role === "conserje"
                      ? "Conserje"
                      : user.role === "it_admin"
                      ? "Admin IT"
                      : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm">
                  {user.role === "user" && user.apartmentNumber && (
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">
                        Apartamento:
                      </span>
                      <span className="font-medium">
                        #{user.apartmentNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creado:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="flex-1"
                  >
                    <UserCog className="h-4 w-4 mr-1.5" />
                    Editar
                  </Button>
                  {isITAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-1.5" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-muted-foreground">
            No se encontraron usuarios que coincidan con los criterios de
            búsqueda.
          </p>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Complete la información para crear un nuevo usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="Nombre Apellido"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value.trim() })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario (Residente)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="conserje">
                    Conserje (Gestión Notas)
                  </SelectItem>
                  <SelectItem value="it_admin">Administrador IT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newUser.role === "user" && (
              <div className="grid gap-2">
                <Label htmlFor="apartmentNumber">Número de Apartamento</Label>
                <Select
                  value={newUser.apartmentNumber}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, apartmentNumber: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar apartamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartmentNumbers.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Apartamento #{num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={newUser.confirmPassword}
                onChange={(e) =>
                  setNewUser({ ...newUser, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualice la información del usuario.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre completo</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Nombre Apellido"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Correo electrónico</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar
                </p>
              </div>

              {isITAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Rol</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario (Residente)</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="conserje">
                        Conserje (Gestión Notas)
                      </SelectItem>
                      <SelectItem value="it_admin">Administrador IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Cambiar contraseña (opcional)
                </h3>

                <div className="grid gap-2">
                  <Label htmlFor="edit-password">Nueva contraseña</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deje en blanco para mantener la contraseña actual
                  </p>
                </div>

                <div className="grid gap-2 mt-2">
                  <Label htmlFor="edit-confirm-password">
                    Confirmar nueva contraseña
                  </Label>
                  <Input
                    id="edit-confirm-password"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado
              permanentemente.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="font-medium">Nombre:</span>
                    <span>{userToDelete.name}</span>

                    <span className="font-medium">Email:</span>
                    <span className="truncate">{userToDelete.email}</span>

                    <span className="font-medium">Rol:</span>
                    <span className="capitalize">{userToDelete.role}</span>

                    {userToDelete.role === "user" &&
                      userToDelete.apartmentNumber && (
                        <>
                          <span className="font-medium">Apartamento:</span>
                          <span>#{userToDelete.apartmentNumber}</span>
                        </>
                      )}
                  </div>
                </div>

                <Alert variant="destructive">
                  <AlertDescription>
                    Todas las reservas asociadas a este usuario seguirán
                    existiendo, pero ya no estarán vinculadas a un usuario
                    activo.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
