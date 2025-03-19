'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info, Calendar, Users, Table, CheckCircle2, PlusCircle, Edit, Trash2, UtensilsCrossed } from "lucide-react";

export default function HowToUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Guía de Uso</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reservas
            </Link>
          </Button>
        </div>
      </header>
      
      <div className="space-y-6">
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Introducción
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-muted-foreground mb-4">
              Esta aplicación permite a los residentes de la Sociedad Roncesvalles gestionar las reservas de espacios comunitarios 
              para comidas y cenas, incluyendo la asignación de mesas y servicios adicionales como horno y brasa.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-500" />
              Crear una Reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <p className="text-muted-foreground">Para crear una nueva reserva, siga estos pasos:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Haga clic en el botón <span className="font-medium">Nueva Reserva</span> en la página principal.</li>
              <li>Complete el formulario con los siguientes datos:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li><span className="font-medium">Número de Apartamento:</span> Ingrese su número de apartamento (1-48).</li>
                  <li><span className="font-medium">Fecha:</span> Seleccione la fecha deseada para su reserva.</li>
                  <li><span className="font-medium">Tipo de Comida:</span> Elija entre comida (lunch) o cena (dinner).</li>
                  <li><span className="font-medium">Número de Personas:</span> Indique cuántas personas asistirán.</li>
                  <li><span className="font-medium">Seleccionar Mesas:</span> Elija las mesas que desea reservar (1-6).</li>
                  <li><span className="font-medium">Opciones Adicionales:</span> Marque si necesita reserva de horno o brasa.</li>
                </ul>
              </li>
              <li>Haga clic en <span className="font-medium">Crear Reserva</span> para finalizar.</li>
            </ol>
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mt-2">
              <span className="font-medium">Nota:</span> Las mesas ya reservadas aparecerán en gris y no podrán seleccionarse. 
              En el calendario, los puntos indican días con reservas existentes (naranja para comida, azul para cena).
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Gestionar Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <h3 className="font-medium text-base">Editar una Reserva</h3>
            <p className="text-muted-foreground">Para modificar una reserva existente:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Localice su reserva en la página principal.</li>
              <li>Haga clic en el botón <span className="font-medium">Editar</span>.</li>
              <li>Actualice los detalles necesarios en el formulario.</li>
              <li>Haga clic en <span className="font-medium">Actualizar Reserva</span> para guardar los cambios.</li>
            </ol>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium text-base">Eliminar una Reserva</h3>
            <p className="text-muted-foreground">Para cancelar una reserva:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Localice su reserva en la página principal.</li>
              <li>Haga clic en el botón <span className="font-medium">Eliminar</span>.</li>
              <li>Confirme la eliminación cuando se le solicite.</li>
            </ol>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium text-base">Confirmar una Reserva Pasada</h3>
            <p className="text-muted-foreground">Después del evento, debe confirmar la reserva con el número real de asistentes:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Localice su reserva pasada (tendrá un indicador "Por confirmar").</li>
              <li>Haga clic en el botón <span className="font-medium">Confirmar</span>.</li>
              <li>Ingrese el número final de asistentes y cualquier nota relevante.</li>
              <li>Haga clic en <span className="font-medium">Confirmar Reserva</span>.</li>
            </ol>
            <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-700 mt-2">
              <span className="font-medium">Importante:</span> La confirmación de reservas es necesaria para la facturación y gestión adecuada del espacio.
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Filtros y Visualización
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <h3 className="font-medium text-base">Filtrar Reservas</h3>
            <p className="text-muted-foreground">La aplicación ofrece varias opciones para filtrar las reservas:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Hoy:</span> Muestra solo las reservas del día actual.</li>
              <li><span className="font-medium">Próximas:</span> Muestra las reservas futuras.</li>
              <li><span className="font-medium">Pasadas:</span> Muestra las reservas anteriores.</li>
              <li><span className="font-medium">Calendario:</span> Seleccione una fecha específica para ver sus reservas.</li>
              <li><span className="font-medium">Por confirmar:</span> Muestra las reservas pasadas pendientes de confirmación.</li>
            </ul>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium text-base">Modos de Visualización</h3>
            <p className="text-muted-foreground">Puede alternar entre dos vistas diferentes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Vista de Tarjetas:</span> Muestra las reservas en formato de tarjetas.</li>
              <li><span className="font-medium">Vista de Lista:</span> Muestra las reservas en formato de lista compacta.</li>
            </ul>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium text-base">Disponibilidad de Mesas</h3>
            <p className="text-muted-foreground">Para ver qué mesas están disponibles en una fecha específica:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Seleccione la fecha deseada en el calendario.</li>
              <li>Utilice las pestañas de <span className="font-medium">Comida</span> y <span className="font-medium">Cena</span> para ver la disponibilidad para cada servicio.</li>
              <li>Las mesas disponibles se mostrarán en verde.</li>
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              Servicios Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-muted-foreground mb-3">Al crear o editar una reserva, puede solicitar los siguientes servicios adicionales:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-medium">Reserva de Horno:</span> Solicita el uso del horno comunitario para su comida o cena.</li>
              <li><span className="font-medium">Reserva de Brasa:</span> Solicita el uso de la parrilla/brasa comunitaria.</li>
            </ul>
            <div className="bg-green-50 p-3 rounded-md text-sm text-green-700 mt-4">
              <span className="font-medium">Sugerencia:</span> Si planea utilizar estos servicios, es recomendable reservarlos con anticipación,
              especialmente en fechas de alta demanda.
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Funciones Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <h3 className="font-medium text-base">Registro de Actividad</h3>
            <p className="text-muted-foreground">Puede acceder al historial completo de actividades relacionadas con las reservas:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Haga clic en el botón <span className="font-medium">Ver Actividad</span> en la página principal.</li>
              <li>Consulte el registro de todas las acciones realizadas (creación, modificación, eliminación y confirmación de reservas).</li>
            </ol>
            
            <Separator className="my-4" />
            
            <h3 className="font-medium text-base">Exportar Datos</h3>
            <p className="text-muted-foreground">Para exportar datos de reservas confirmadas:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Haga clic en el botón <span className="font-medium">Exportar</span> en la página principal.</li>
              <li>Seleccione el año para el que desea exportar los datos.</li>
              <li>Elija el formato de exportación (Excel/CSV o PDF).</li>
              <li>Haga clic en <span className="font-medium">Exportar</span> para descargar el archivo.</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              Los datos exportados incluyen información sobre las reservas confirmadas, el número de asistentes y los importes correspondientes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}