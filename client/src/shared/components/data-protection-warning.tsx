import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export function DataProtectionWarning() {
  const [showWarning, setShowWarning] = useState(false);

  const exportUserData = () => {
    try {
      const userData = {
        authToken: localStorage.getItem('authToken'),
        currentUser: localStorage.getItem('currentUser'),
        adminToken: localStorage.getItem('adminToken'),
        isAdmin: localStorage.getItem('isAdmin'),
        adminUser: localStorage.getItem('adminUser'),
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `wedding-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const safeClearStorage = () => {
    if (window.confirm(
      "⚠️ WARNING: This will log you out and you'll need to log back in to see your data.\n\n" +
      "Your weddings and guests are safely stored in the database, but you'll lose your login session.\n\n" +
      "Do you want to backup your session before clearing?"
    )) {
      const shouldBackup = window.confirm("Would you like to download a backup of your session data first?");
      
      if (shouldBackup) {
        exportUserData();
        // Wait a moment for download to start
        setTimeout(() => {
          if (window.confirm("Backup download started. Now clear storage?")) {
            localStorage.clear();
            window.location.reload();
          }
        }, 1000);
      } else {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Data Protection Tools
        </CardTitle>
        <CardDescription>
          Backup your session data or safely clear storage if needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Your wedding data is safely stored in the database. 
            These tools only affect your login session.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={exportUserData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Backup Session
          </Button>
          
          <Button 
            onClick={safeClearStorage}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Clear Storage (Safe)
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Backup Session:</strong> Downloads your login tokens for recovery</p>
          <p><strong>Clear Storage:</strong> Logs you out but keeps your wedding data safe</p>
        </div>
      </CardContent>
    </Card>
  );
} 