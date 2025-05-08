
import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CreateAdminResponse {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  jobTitle?: string;
  error?: string | Error;
}

const CreateDefaultAdmin = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAdminUser = async () => {
    if (isCreated || isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Define the administrator credentials
      const adminCredentials = {
        name: "Kasper Schmidt Johansen",
        email: "kasper.johansen@polygongroup.com",
        password: "Password123!", // This is a temporary password that should be changed after first login
        role: "administrator" as const,
        phone: "51670538",
        jobTitle: "Skadeleder/Projektleder"
      };
      
      // Create the administrator user
      const result = await authService.createUser(adminCredentials) as CreateAdminResponse;
      
      if (result?.id) {
        setIsCreated(true);
        toast({
          title: "Administrator bruger oprettet",
          description: `${adminCredentials.name} er blevet oprettet som administrator`,
          variant: "default"
        });
      } else if (result?.error) {
        throw new Error(result.error.toString());
      }
    } catch (err) {
      console.error("Error creating administrator:", err);
      setError(err instanceof Error ? err.message : "Fejl under oprettelse af administrator");
      toast({
        title: "Fejl under oprettelse",
        description: err instanceof Error ? err.message : "Kunne ikke oprette administrator",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    createAdminUser();
  }, []);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-center space-x-2">
        <AlertCircle className="h-5 w-5" />
        <div>
          <p className="font-medium">Kunne ikke oprette administrator</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isCreated) {
    return (
      <div className="p-4 border border-green-200 bg-green-50 rounded-md text-green-800 flex items-center space-x-2">
        <CheckCircle className="h-5 w-5" />
        <div>
          <p className="font-medium">Administrator bruger oprettet</p>
          <p className="text-sm">Kasper Schmidt Johansen er blevet oprettet som administrator</p>
          <p className="text-sm mt-1">Email: kasper.johansen@polygongroup.com</p>
          <p className="text-sm">Password: Password123! (bør ændres efter første login)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-blue-200 bg-blue-50 rounded-md text-blue-800">
      <p>Opretter administrator bruger...</p>
    </div>
  );
};

export default CreateDefaultAdmin;
