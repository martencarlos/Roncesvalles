'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Info, 
  Calendar, 
  Users, 
  Table, 
  CheckCircle2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  UtensilsCrossed,
  UserIcon,
  KeyIcon,
  Mail,
  History,
  LayoutDashboard,
  Filter,
  Eye,
  Download
} from "lucide-react";

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
        {/* Table of contents */}
        <Card>
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-blue-500" />
              Contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <ul className="space-y-2">
              <li>
                <Link href="#introduccion" className="text-blue-600 hover:underline">
                  1. Introducción
                </Link>
              </li>
              <li>
                <Link href="#cuenta" className="text-blue-600 hover:underline">
                  2. Gestión de Cuenta
                </Link>
                <ul className="ml-5 mt-1 space-y-1">
                  <li>
                    <Link href="#crear-cuenta" className="text-blue-600 hover:underline">
                      2.1 Crear una nueva cuenta
                    </Link>
                  </li>
                  <li>
                    <Link href="#iniciar-sesion" className="text-blue-600 hover:underline">
                      2.2 Iniciar sesión
                    </Link>
                  </li>
                  <li>
                    <Link href="#recuperar-contraseña" className="text-blue-600 hover:underline">
                      2.3 Recuperar contraseña
                    </Link>
                  </li>
                  <li>
                    <Link href="#perfil" className="text-blue-600 hover:underline">
                      2.4 Gestionar perfil
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="#reservas" className="text-blue-600 hover:underline">
                  3. Gestión de Reservas
                </Link>
                <ul className="ml-5 mt-1 space-y-1">
                  <li>
                    <Link href="#crear-reserva" className="text-blue-600 hover:underline">
                      3.1 Crear una reserva
                    </Link>
                  </li>
                  <li>
                    <Link href="#gestionar-reservas" className="text-blue-600 hover:underline">
                      3.2 Gestionar reservas existentes
                    </Link>
                  </li>
                  <li>
                    <Link href="#confirmar-reservas" className="text-blue-600 hover:underline">
                      3.3 Confirmar reservas pasadas
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="#visualizacion" className="text-blue-600 hover:underline">
                  4. Filtros y Visualización
                </Link>
              </li>
              <li>
                <Link href="#servicios-adicionales" className="text-blue-600 hover:underline">
                  5. Servicios Adicionales
                </Link>
              </li>
              <li>
                <Link href="#actividad" className="text-blue-600 hover:underline">
                  6. Registro de Actividad
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        {/* Introduction Section */}
        <Card id="introduccion">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              1. Introducción
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-muted-foreground mb-4">
              Esta aplicación permite a los residentes de la Sociedad Roncesvalles gestionar las reservas de espacios comunitarios 
              para comidas y cenas, incluyendo la asignación de mesas y servicios adicionales como horno y brasa.
            </p>
            <p className="text-muted-foreground">
              Cada apartamento puede tener una cuenta de usuario para realizar y gestionar sus propias reservas. El sistema 
              está diseñado para ser intuitivo y fácil de usar, permitiendo una gestión eficiente de los espacios comunes.
            </p>
          </CardContent>
        </Card>
        
        {/* Account Management Section */}
        <Card id="cuenta">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-purple-500" />
              2. Gestión de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-6">
            {/* Create Account Subsection */}
            <div id="crear-cuenta">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-green-500" />
                2.1 Crear una nueva cuenta
              </h3>
              <p className="text-muted-foreground mb-3">
                Para crear una nueva cuenta en el sistema, siga estos pasos:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Haga clic en el botón <span className="font-medium">Iniciar Sesión</span> en la parte superior derecha.</li>
                <li>En la pantalla de inicio de sesión, haga clic en <span className="font-medium">Crear cuenta</span>.</li>
                <li>Complete el formulario con la siguiente información:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li><span className="font-medium">Nombre completo:</span> Su nombre y apellido.</li>
                    <li><span className="font-medium">Número de Apartamento:</span> Seleccione su número de apartamento (1-48).</li>
                    <li><span className="font-medium">Correo electrónico:</span> Ingrese un correo electrónico válido para recibir notificaciones.</li>
                    <li><span className="font-medium">Contraseña:</span> Cree una contraseña segura (mínimo 8 caracteres).</li>
                    <li><span className="font-medium">Confirmar contraseña:</span> Repita la contraseña creada.</li>
                  </ul>
                </li>
                <li>Haga clic en <span className="font-medium">Crear Cuenta</span> para finalizar el registro.</li>
              </ol>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <span className="font-medium">Nota:</span> Solo se permite una cuenta por apartamento. Si su apartamento ya tiene una cuenta registrada, deberá utilizar esa cuenta o contactar al administrador del sistema.
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Login Subsection */}
            <div id="iniciar-sesion">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-500" />
                2.2 Iniciar sesión
              </h3>
              <p className="text-muted-foreground mb-3">
                Para acceder a su cuenta:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Haga clic en el botón <span className="font-medium">Iniciar Sesión</span> en la parte superior derecha.</li>
                <li>Ingrese su correo electrónico y contraseña.</li>
                <li>Haga clic en <span className="font-medium">Iniciar Sesión</span>.</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Una vez iniciada la sesión, será redirigido a la página principal de reservas donde podrá ver y gestionar sus reservas.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            {/* Password Recovery Subsection */}
            <div id="recuperar-contraseña">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <KeyIcon className="h-5 w-5 text-amber-500" />
                2.3 Recuperar contraseña
              </h3>
              <p className="text-muted-foreground mb-3">
                Si ha olvidado su contraseña, puede restablecerla siguiendo estos pasos:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>En la pantalla de inicio de sesión, haga clic en <span className="font-medium">¿Olvidó su contraseña?</span>.</li>
                <li>Ingrese el correo electrónico asociado a su cuenta.</li>
                <li>Haga clic en <span className="font-medium">Enviar Instrucciones</span>.</li>
                <li>Recibirá un correo electrónico con un enlace para restablecer su contraseña (revise su carpeta de spam si no lo recibe).</li>
                <li>Haga clic en el enlace y siga las instrucciones para crear una nueva contraseña.</li>
              </ol>
              <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-700">
                <span className="font-medium">Importante:</span> El enlace para restablecer la contraseña expira después de 1 hora por razones de seguridad.
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Profile Management Subsection */}
            <div id="perfil">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-500" />
                2.4 Gestionar perfil
              </h3>
              <p className="text-muted-foreground mb-3">
                Para actualizar su información personal o cambiar su contraseña:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Haga clic en su nombre o iniciales en la parte superior derecha.</li>
                <li>Seleccione <span className="font-medium">Perfil</span> en el menú desplegable.</li>
                <li>En la página de perfil puede:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Modificar su nombre completo.</li>
                    <li>Cambiar su contraseña actual (opcional).</li>
                  </ul>
                </li>
                <li>Haga clic en <span className="font-medium">Guardar Cambios</span> para actualizar su información.</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                El correo electrónico no se puede cambiar ya que es el identificador principal de su cuenta. Si necesita cambiar su correo electrónico, contacte con el administrador del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Bookings Management Section */}
        <Card id="reservas">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              3. Gestión de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-6">
            {/* Create Booking Subsection */}
            <div id="crear-reserva">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-green-500" />
                3.1 Crear una reserva
              </h3>
              <p className="text-muted-foreground mb-3">
                Para crear una nueva reserva, siga estos pasos:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Desde la página principal, haga clic en el botón <span className="font-medium">Nueva Reserva</span>.</li>
                <li>Seleccione la fecha deseada para su reserva en el calendario.</li>
                <li>Elija el tipo de comida: <span className="font-medium">Comida</span> o <span className="font-medium">Cena</span>.</li>
                <li>Indique el número de personas que asistirán.</li>
                <li>Seleccione las mesas que desea reservar (1-6) haciendo clic en ellas en el diagrama:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Las mesas disponibles aparecen en color naranja.</li>
                    <li>Las mesas ya reservadas aparecen en gris y no pueden seleccionarse.</li>
                    <li>Las mesas seleccionadas se mostrarán en color primario (azul).</li>
                  </ul>
                </li>
                <li>Marque las opciones adicionales si las necesita:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li><span className="font-medium">Preparar fuego para la reserva</span>: Si necesita que se prepare el fuego.</li>
                    <li><span className="font-medium">Reserva de horno</span>: Si necesita utilizar el horno.</li>
                    <li><span className="font-medium">Reserva de brasa</span>: Si necesita utilizar la parrilla/brasa.</li>
                  </ul>
                </li>
                <li>Haga clic en <span className="font-medium">Crear Reserva</span> para finalizar.</li>
              </ol>
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                <span className="font-medium">Nota:</span> El calendario muestra indicadores para fechas con reservas existentes:
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    <span>Comida</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span>Cena</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <span>Ambas</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Manage Bookings Subsection */}
            <div id="gestionar-reservas">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" />
                3.2 Gestionar reservas existentes
              </h3>
              <p className="text-muted-foreground mb-3">Para modificar o cancelar sus reservas existentes:</p>
              
              <h4 className="font-medium text-base mt-4 mb-2">Editar una reserva</h4>
              <ol className="list-decimal pl-5 space-y-1 mb-4">
                <li>Localice su reserva en la página principal.</li>
                <li>Haga clic en el botón <span className="font-medium">Editar</span>.</li>
                <li>Realice los cambios necesarios en el formulario.</li>
                <li>Haga clic en <span className="font-medium">Actualizar Reserva</span> para guardar los cambios.</li>
              </ol>
              
              <h4 className="font-medium text-base mt-4 mb-2">Eliminar una reserva</h4>
              <ol className="list-decimal pl-5 space-y-1 mb-4">
                <li>Localice su reserva en la página principal.</li>
                <li>Haga clic en el botón <span className="font-medium">Eliminar</span>.</li>
                <li>Confirme la eliminación cuando se le solicite.</li>
              </ol>
              
              <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-700 mt-2">
                <span className="font-medium">Importante:</span> Las reservas ya confirmadas no se pueden editar ni eliminar por usuarios regulares. Si necesita modificar una reserva confirmada, contacte con el administrador del sistema.
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Confirm Bookings Subsection */}
            <div id="confirmar-reservas">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
                3.3 Confirmar reservas pasadas
              </h3>
              <p className="text-muted-foreground mb-3">
                Después de cada evento, es importante confirmar sus reservas pasadas con el número real de asistentes. Esto es necesario para la facturación correcta y la gestión del espacio:
              </p>
              <ol className="list-decimal pl-5 space-y-2 mb-4">
                <li>Las reservas pendientes de confirmación tendrán una etiqueta <span className="font-medium">Por confirmar</span>.</li>
                <li>También puede ver todas las reservas pendientes haciendo clic en el botón <span className="font-medium">X por confirmar</span> en la página principal.</li>
                <li>Para confirmar una reserva:
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Localice la reserva pasada que necesita confirmar.</li>
                    <li>Haga clic en el botón <span className="font-medium">Confirmar</span>.</li>
                    <li>En el diálogo de confirmación, ingrese el número final de asistentes.</li>
                    <li>Opcionalmente, añada notas relevantes sobre la reserva.</li>
                    <li>Haga clic en <span className="font-medium">Confirmar Reserva</span> para finalizar.</li>
                  </ul>
                </li>
              </ol>
              <div className="bg-red-50 p-3 rounded-md text-sm text-red-700 mt-2">
                <span className="font-medium">Importante:</span> La confirmación de reservas es obligatoria para la correcta facturación. Las reservas no confirmadas serán facturadas según el número de asistentes previsto inicialmente.
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters and Visualization Section */}
        <Card id="visualizacion">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-500" />
              4. Filtros y Visualización
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <h3 className="font-medium text-base mb-2">Filtrar Reservas</h3>
            <p className="text-muted-foreground mb-3">
              La aplicación ofrece varias opciones para filtrar y visualizar sus reservas:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="font-medium">Hoy:</span> Muestra solo las reservas del día actual.</li>
              <li><span className="font-medium">Próximas:</span> Muestra todas las reservas futuras, incluyendo las de hoy.</li>
              <li><span className="font-medium">Pasadas:</span> Muestra las reservas de fechas anteriores.</li>
              <li><span className="font-medium">Por confirmar:</span> Muestra las reservas pasadas que aún no han sido confirmadas.</li>
              <li><span className="font-medium">Fecha específica:</span> Al seleccionar una fecha en el calendario, se muestran solo las reservas para ese día.</li>
            </ul>
            
            <h3 className="font-medium text-base mb-2 mt-6">Modos de Visualización</h3>
            <p className="text-muted-foreground mb-3">
              Puede alternar entre dos vistas diferentes para las reservas:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Vista de Tarjetas:</span> Muestra las reservas en formato de tarjetas individuales con todos los detalles.
                <div className="bg-gray-50 p-2 mt-1 rounded text-xs text-muted-foreground">Ideal para ver todos los detalles de cada reserva.</div>
              </li>
              <li>
                <span className="font-medium">Vista de Lista:</span> Muestra las reservas en formato de lista compacta, agrupadas por fecha.
                <div className="bg-gray-50 p-2 mt-1 rounded text-xs text-muted-foreground">Ideal para una visión general de múltiples reservas.</div>
              </li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Para cambiar entre estas vistas, utilice el botón de alternar vista (con ícono de cuadrícula o lista) ubicado junto al título de la sección de reservas.
            </p>
            
            <h3 className="font-medium text-base mb-2 mt-6">Consultar Disponibilidad</h3>
            <p className="text-muted-foreground mb-3">
              Para ver qué mesas están disponibles en una fecha específica:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Seleccione la fecha deseada en el calendario principal.</li>
              <li>Debajo del calendario, utilice las pestañas <span className="font-medium">Comida</span> y <span className="font-medium">Cena</span> para ver la disponibilidad para cada servicio.</li>
              <li>Las mesas disponibles se mostrarán con etiquetas verdes (ejemplo: <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5">Mesa #3</span>).</li>
              <li>Si todas las mesas están reservadas, aparecerá un mensaje indicándolo.</li>
            </ol>
          </CardContent>
        </Card>
        
        {/* Additional Services Section */}
        <Card id="servicios-adicionales">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
              5. Servicios Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-muted-foreground mb-3">
              Al crear o editar una reserva, puede solicitar estos servicios adicionales:
            </p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <span className="font-medium">Preparar fuego para la reserva:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicite que se prepare el fuego para su reserva. Útil si planea usar la zona de fuego y prefiere encontrarlo ya preparado.
                </p>
              </li>
              <li>
                <span className="font-medium">Reserva de horno:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicita el uso exclusivo del horno comunitario para su comida o cena. Recomendado si planea cocinar alimentos que requieren horno.
                </p>
              </li>
              <li>
                <span className="font-medium">Reserva de brasa:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicita el uso exclusivo de la parrilla/brasa comunitaria. Ideal para barbacoas o platos a la parrilla.
                </p>
              </li>
            </ul>
            <div className="bg-green-50 p-3 rounded-md text-sm text-green-700 mt-4">
              <span className="font-medium">Sugerencia:</span> Si planea utilizar estos servicios, es recomendable reservarlos con anticipación,
              especialmente en fechas de alta demanda como fines de semana o festivos.
            </div>
          </CardContent>
        </Card>
        
        {/* Activity Log Section */}
        <Card id="actividad">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              6. Registro de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 space-y-4">
            <p className="text-muted-foreground mb-3">
              El sistema mantiene un registro completo de todas las actividades relacionadas con las reservas:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Creación de nuevas reservas</li>
              <li>Modificaciones de reservas existentes</li>
              <li>Cancelaciones de reservas</li>
              <li>Confirmaciones de reservas pasadas</li>
            </ul>
            
            <p className="text-muted-foreground mt-3">
              Para acceder al registro de actividad:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Haga clic en el botón <span className="font-medium">Ver Actividad</span> en la página principal.</li>
              <li>En la página de actividad, podrá ver un historial cronológico de todas las acciones relacionadas con las reservas de su apartamento.</li>
              <li>Utilice los controles de paginación en la parte inferior para navegar entre páginas si hay muchos registros.</li>
            </ol>
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mt-3">
              <span className="font-medium">Nota:</span> El registro de actividad es útil para verificar acciones pasadas y resolver cualquier duda sobre reservas realizadas, modificadas o canceladas.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}