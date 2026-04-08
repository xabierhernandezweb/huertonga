'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Plant, PlantCategory, PlantOrigin, SoilType } from '@/lib/types';
import { PLANT_CATALOG } from '@/lib/constants';
import { computeHarvestWindow } from '@/lib/harvest';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(60),
  category: z.enum(['tomate', 'fresa', 'ajo', 'acelga', 'zanahoria', 'perejil', 'otro'] as const),
  origin: z.enum(['comprada', 'autogerminated', 'siembra_directa'] as const),
  heightCm: z.string().optional(),
  bedNumber: z.enum(['1', '2', '3', '4'] as const),
  soilType: z.enum(['jardin_arcilloso', 'sustrato', 'arena', 'mixto'] as const),
  notes: z.string().max(300).optional(),
  plantedAt: z.date(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onAddPlant: (plant: Plant) => void;
}

export function AddPlantForm({ onAddPlant }: Props) {
  const router = useRouter();
  const [harvestPreview, setHarvestPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'tomate',
      origin: 'comprada',
      heightCm: '',
      bedNumber: '1',
      soilType: 'jardin_arcilloso',
      notes: '',
      plantedAt: new Date(),
    },
  });

  const watchCategory = form.watch('category');
  const watchOrigin = form.watch('origin');
  const watchPlantedAt = form.watch('plantedAt');
  const isDirectSow = watchOrigin === 'siembra_directa';

  // Update harvest preview reactively
  function updatePreview(category: PlantCategory, plantedAt: Date) {
    const hw = computeHarvestWindow(format(plantedAt, 'yyyy-MM-dd'), category);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const s = new Date(hw.start);
    const e = new Date(hw.end);
    setHarvestPreview(`${months[s.getUTCMonth()]} ${s.getUTCFullYear()} – ${months[e.getUTCMonth()]} ${e.getUTCFullYear()}`);
  }

  function onSubmit(values: FormValues) {
    const plantedAtStr = format(values.plantedAt, 'yyyy-MM-dd');
    const hw = computeHarvestWindow(plantedAtStr, values.category);
    const heightVal = values.heightCm && !isDirectSow ? parseFloat(values.heightCm) : null;

    const plant: Plant = {
      id: uuidv4(),
      name: values.name,
      category: values.category as PlantCategory,
      origin: values.origin as PlantOrigin,
      plantedAt: plantedAtStr,
      heightCm: !isNaN(heightVal!) && heightVal! > 0 ? heightVal : null,
      bedNumber: parseInt(values.bedNumber) as 1 | 2 | 3 | 4,
      soilType: values.soilType as SoilType,
      notes: values.notes ?? '',
      harvestWindowStart: hw.start,
      harvestWindowEnd: hw.end,
      updatedAt: new Date().toISOString(),
    };

    onAddPlant(plant);
    router.push('/');
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Añadir planta</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de planta</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    updatePreview(v as PlantCategory, watchPlantedAt);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.entries(PLANT_CATALOG) as [PlantCategory, typeof PLANT_CATALOG[PlantCategory]][]).map(
                      ([key, cat]) => (
                        <SelectItem key={key} value={key}>
                          {cat.icon} {cat.displayName}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre personalizado</FormLabel>
                <FormControl>
                  <Input placeholder={`Ej: ${PLANT_CATALOG[watchCategory].displayName} del bancal 1`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Origin */}
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origen</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="comprada">Comprada en vivero</SelectItem>
                    <SelectItem value="autogerminated">Autogeminada en casa</SelectItem>
                    <SelectItem value="siembra_directa">Siembra directa (semilla)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Height — only if not direct sow */}
          {!isDirectSow && (
            <FormField
              control={form.control}
              name="heightCm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura al plantar (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.5" placeholder="Ej: 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Planted date */}
          <FormField
            control={form.control}
            name="plantedAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de siembra / trasplante</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn('w-full text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value
                          ? format(field.value, 'd MMMM yyyy', { locale: es })
                          : 'Selecciona una fecha'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(d) => {
                        field.onChange(d);
                        if (d) updatePreview(watchCategory, d);
                      }}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bed number */}
          <FormField
            control={form.control}
            name="bedNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bancal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['1', '2', '3', '4'].map((n) => (
                      <SelectItem key={n} value={n}>Bancal {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Soil type */}
          <FormField
            control={form.control}
            name="soilType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de suelo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="jardin_arcilloso">Tierra de jardín (arcillosa)</SelectItem>
                    <SelectItem value="sustrato">Sustrato universal</SelectItem>
                    <SelectItem value="arena">Arenoso</SelectItem>
                    <SelectItem value="mixto">Mezcla</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Variedad, observaciones..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Harvest preview */}
          {harvestPreview && (
            <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-3 pb-3 text-sm flex items-center gap-2">
                <span>🌾</span>
                <span>Cosecha estimada: <strong>{harvestPreview}</strong></span>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
            <Button type="submit" className="flex-1">Añadir planta</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
