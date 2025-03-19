// src/app/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ActivityIcon, ChevronLeft, ChevronRight } from "lucide-react";
import ActivityLogItem from '@/components/ActivityLogItem';
import { IActivityLog } from '@/models/ActivityLog';
import Pagination from '@/components/Pagination';

export default function ActivityPage() {
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/activity?page=${currentPage}&limit=${itemsPerPage}`);
        
        if (!res.ok) {
          throw new Error('Error al obtener registros de actividad');
        }
        
        const data = await res.json();
        setActivityLogs(data.logs);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityLogs();
  }, [currentPage, itemsPerPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };
  
  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Registro de Actividad</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reservas
            </Link>
          </Button>
        </div>
      </header>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="px-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ActivityIcon className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription className="text-sm">
            Toda la actividad relacionada con las reservas de espacios comunitarios
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {loading && currentPage === 1 ? (
            <div className="flex justify-center p-6 sm:p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : activityLogs.length > 0 ? (
            <>
              <div className="space-y-1">
                {activityLogs.map((log) => (
                  <ActivityLogItem key={log._id as string} log={log} />
                ))}
              </div>
              
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
            </>
          ) : (
            <p className="text-muted-foreground py-6 sm:py-8 text-center">No se ha registrado actividad todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}