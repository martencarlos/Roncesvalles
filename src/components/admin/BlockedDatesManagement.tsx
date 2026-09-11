// src/components/admin/BlockedDatesManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  ShieldAlert,
  Flame,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { toast } from "sonner";
import "react-datepicker/dist/react-datepicker.css";
import { IBlockedDate, BlockedMealType, JuntaReason } from "@/models/BlockedDate";

registerLocale("es", es);

const MEAL_LABELS: Record<BlockedMealType, string> = {
  lunch: "Comida",
  dinner: "Cena",
  both: "Comida y Cena",
};

const MEAL_TONES: Record<BlockedMealType, "warning" | "info" | "neutral"> = {
  lunch: "warning",
  dinner: "info",
  both: "neutral",
};

export default function BlockedDatesManagement() {
  const [blocks, setBlocks] = useState<IBlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [newMealType, setNewMealType] = useState<BlockedMealType>("lunch");
  const [newReason, setNewReason] = useState<JuntaReason>(
    "Junta general ordinaria"
  );
  const [newPrepararFuego, setNewPrepararFuego] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<IBlockedDate | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blocked-dates");
      if (!res.ok) throw new Error("Error al obtener los bloqueos");
      const data: IBlockedDate[] = await res.json();
      const sorted = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBlocks(sorted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const resetCreateForm = () => {
    setNewDate(new Date());
    setNewMealType("lunch");
    setNewReason("Junta general ordinaria");
    setNewPrepararFuego(false);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate.toISOString(),
          mealType: newMealType,
          reason: newReason,
          prepararFuego: newPrepararFuego,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al crear el bloqueo");
      }

      await fetchBlocks();
      setShowCreateDialog(false);
      resetCreateForm();
      const mealLabel = MEAL_LABELS[newMealType];
      toast.success("Bloqueo creado", {
        description: `Se ha bloqueado ${mealLabel.toLowerCase()} el ${format(newDate, "d MMM, yyyy", { locale: es })}.`,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (block: IBlockedDate) => {
    setDeletingBlock(block);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingBlock?._id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/blocked-dates/${deletingBlock._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el bloqueo");
      await fetchBlocks();
      toast.success("Bloqueo eliminado", {
        description: "El bloqueo ha sido eliminado correctamente.",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setDeletingBlock(null);
    }
  };

  const formatDate = (date: string | Date) =>
    format(new Date(date), "d MMM, yyyy", { locale: es });

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => {
            resetCreateForm();
            setShowCreateDialog(true);
          }}
        >
          <PlusCircle />
          Nuevo Bloqueo
        </Button>
      </div>

      {/* Blocks list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : blocks.length > 0 ? (
        <div className="space-y-3">
          {blocks.map((block) => (
            <Card key={block._id as string} className="py-0 transition-colors hover:bg-accent/40">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-medium text-sm">
                      {formatDate(block.date)}
                    </span>
                    <StatusBadge tone={MEAL_TONES[block.mealType]}>
                      {MEAL_LABELS[block.mealType]}
                    </StatusBadge>
                    <StatusBadge tone="neutral">{block.reason}</StatusBadge>
                    {block.prepararFuego && (
                      <StatusBadge tone="danger" className="gap-1">
                        <Flame className="h-3 w-3" />
                        Con fuego
                      </StatusBadge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteClick(block)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    aria-label="Eliminar bloqueo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShieldAlert}
          title="No hay bloqueos de fecha activos"
          description="Cree un bloqueo para impedir reservas durante una Junta General."
          action={
            <Button
              onClick={() => {
                resetCreateForm();
                setShowCreateDialog(true);
              }}
            >
              <PlusCircle />
              Nuevo Bloqueo
            </Button>
          }
        />
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Bloqueo de Fecha</DialogTitle>
            <DialogDescription>
              Bloquea todas las mesas para una fecha y servicio específicos por
              motivo de junta. Ningún usuario podrá realizar reservas durante
              este período.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Fecha
              </Label>
              <DatePicker
                selected={newDate}
                onChange={(date: Date | null) => date && setNewDate(date)}
                dateFormat="d MMMM, yyyy"
                locale="es"
                className="w-full rounded-md border border-input bg-card p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                wrapperClassName="w-full"
              />
            </div>

            {/* Meal type */}
            <div className="space-y-2">
              <Label>Servicio afectado</Label>
              <Select
                value={newMealType}
                onValueChange={(v) => setNewMealType(v as BlockedMealType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch">Comida</SelectItem>
                  <SelectItem value="dinner">Cena</SelectItem>
                  <SelectItem value="both">Comida y Cena</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select
                value={newReason}
                onValueChange={(v) => setNewReason(v as JuntaReason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junta general ordinaria">
                    Junta general ordinaria
                  </SelectItem>
                  <SelectItem value="Junta general extraordinaria">
                    Junta general extraordinaria
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fire preparation */}
            <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3">
              <Checkbox
                id="prepararFuego"
                checked={newPrepararFuego}
                onCheckedChange={(checked) =>
                  setNewPrepararFuego(Boolean(checked))
                }
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="prepararFuego" className="cursor-pointer font-medium flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-warning-foreground" />
                  Preparar fuego
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  El conserje recibirá una notificación. El servicio de
                  conserjería aplica independientemente del plazo de antelación.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Bloqueo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Bloqueo</DialogTitle>
            <DialogDescription>
              {deletingBlock && (
                <>
                  ¿Está seguro de que desea eliminar el bloqueo del{" "}
                  <strong>{formatDate(deletingBlock.date)}</strong> para{" "}
                  <strong>{MEAL_LABELS[deletingBlock.mealType].toLowerCase()}</strong>?
                  Los usuarios podrán volver a hacer reservas en esa fecha.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
