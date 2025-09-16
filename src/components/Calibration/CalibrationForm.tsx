import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalibration, EquipmentEntry } from '@/hooks/useCalibration';
import { useTranslation } from '@/context/TranslationContext';
import { Trash2, Plus, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  department_and_employee: z.string().min(1, 'Påkrævet'),
  report_number: z.string().min(1, 'Påkrævet'),
  control_date: z.string().min(1, 'Påkrævet'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CalibrationFormProps {
  onCancel: () => void;
}

export const CalibrationForm: React.FC<CalibrationFormProps> = ({ onCancel }) => {
  const { t } = useTranslation();
  const { saveReport } = useCalibration();
  const { toast } = useToast();
  
  const [equipmentEntries, setEquipmentEntries] = useState<EquipmentEntry[]>([
    { equipment_number: 1 }
  ]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department_and_employee: '',
      report_number: '',
      control_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const addEquipmentEntry = () => {
    if (equipmentEntries.length < 10) {
      setEquipmentEntries(prev => [...prev, { 
        equipment_number: prev.length + 1 
      }]);
    }
  };

  const removeEquipmentEntry = (index: number) => {
    if (equipmentEntries.length > 1) {
      const newEntries = equipmentEntries.filter((_, i) => i !== index);
      // Renumber entries
      const renumbered = newEntries.map((entry, i) => ({
        ...entry,
        equipment_number: i + 1
      }));
      setEquipmentEntries(renumbered);
    }
  };

  const updateEquipmentEntry = (index: number, field: keyof EquipmentEntry, value: string) => {
    setEquipmentEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const onSubmit = async (data: FormData, status: 'draft' | 'completed') => {
    try {
      const reportData = {
        department_and_employee: data.department_and_employee,
        report_number: data.report_number,
        control_date: data.control_date,
        notes: data.notes || null,
        status
      };
      
      await saveReport(reportData, equipmentEntries);
      onCancel();
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const generatePdf = async () => {
    const formData = form.getValues();
    setIsGeneratingPdf(true);
    
    try {
      // This would call a PDF generation service
      // For now, we'll show a message
      toast({
        title: t('calibration.messages.pdfGenerating'),
        description: "PDF funktionalitet kommer snart",
      });
    } catch (error) {
      toast({
        title: "Fejl",
        description: "Kunne ikke generere PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="department_and_employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibration.form.departmentAndEmployee')}</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Skadeservice - John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="report_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibration.form.reportNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. 12TRE-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="control_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibration.form.controlDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('calibration.equipment.title')}</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addEquipmentEntry}
                disabled={equipmentEntries.length >= 10}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('calibration.equipment.addEquipment')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {equipmentEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-2 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">Nr.</label>
                      <Input value={entry.equipment_number} disabled className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Produktnavn</label>
                      <Input 
                        placeholder="F.eks. Tramex MRH III"
                        value={entry.product_name || ''}
                        onChange={(e) => updateEquipmentEntry(index, 'product_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Produktnummer</label>
                      <Input 
                        placeholder="Evt. probe nummer"
                        value={entry.product_number || ''}
                        onChange={(e) => updateEquipmentEntry(index, 'product_number', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Godkendt margen</label>
                      <Input 
                        placeholder="F.eks. ±2%"
                        value={entry.approved_margin || ''}
                        onChange={(e) => updateEquipmentEntry(index, 'approved_margin', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Målt værdi</label>
                      <Input 
                        placeholder="F.eks. 1,3"
                        value={entry.measured_result || ''}
                        onChange={(e) => updateEquipmentEntry(index, 'measured_result', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vurdering</label>
                      <Select 
                        value={entry.assessment || ''}
                        onValueChange={(value) => updateEquipmentEntry(index, 'assessment', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Vælg" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OK">OK</SelectItem>
                          <SelectItem value="Ikke OK">Ikke OK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Initialer</label>
                        <Input 
                          placeholder="F.eks. JD"
                          value={entry.initials || ''}
                          onChange={(e) => updateEquipmentEntry(index, 'initials', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      {equipmentEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEquipmentEntry(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('calibration.form.notes')}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Korte noter, særlige observationer eller kommentarer..."
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuller
            </Button>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.handleSubmit((data) => onSubmit(data, 'draft'))()}
              >
                {t('calibration.actions.saveDraft')}
              </Button>
              <Button 
                type="button"
                onClick={() => form.handleSubmit((data) => onSubmit(data, 'completed'))()}
              >
                Gem og færdiggør
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={generatePdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPdf ? 'Genererer...' : t('calibration.actions.generatePdf')}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};