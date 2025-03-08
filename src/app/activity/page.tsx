// src/app/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ActivityIcon } from "lucide-react";
import ActivityLogItem from '@/components/ActivityLogItem';
import { IActivityLog } from '@/models/ActivityLog';

export default function ActivityPage() {
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const res = await fetch('/api/activity');
        
        if (!res.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        
        const data = await res.json();
        setActivityLogs(data);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityLogs();
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            All activity related to community space bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : activityLogs.length > 0 ? (
            <div>
              {activityLogs.map((log) => (
                <ActivityLogItem key={log._id as string} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">No activity recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}