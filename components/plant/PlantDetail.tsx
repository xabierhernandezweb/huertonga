'use client';

import { useState } from 'react';
import { Plant, Warning, WeatherData } from '@/lib/types';
import { PLANT_CATALOG } from '@/lib/constants';
import { formatHarvestRange } from '@/lib/harvest';
import { getWateringRecommendation } from '@/lib/watering';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Droplets, Calendar, Sprout, Info, ShieldAlert, Pencil, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  plant: Plant;
  warnings: Warning[];
  weather: WeatherData | null;
  onUpdateHeight: (id: string, h: number) => void;
  onDelete: (id: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  alto: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
  medio: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
  bajo: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40',
  ok: '',
};

const ORIGIN_LABEL: Record<string, string> = {
  comprada: 'Comprada en vivero',
  autogerminated: 'Autogeminada en casa',
  siembra_directa: 'Siembra directa',
};

const SOIL_LABEL: Record<string, string> = {
  jardin_arcilloso: 'Tierra de jardín (arcillosa)',
  sustrato: 'Sustrato universal',
  arena: 'Arena',
  mixto: 'Mezcla',
};

export function PlantDetail({ plant, warnings, weather, onUpdateHeight, onDelete }: Props) {
  const [heightDialog, setHeightDialog] = useState(false);
  const [heightInput, setHeightInput] = useState(String(plant.heightCm ?? ''));
  const [deleteDialog, setDeleteDialog] = useState(false);
  const router = useRouter();

  const catalog = PLANT_CATALOG[plant.category];
  const watering = getWateringRecommendation(plant, weather);
  const harvestLabel = formatHarvestRange(plant.harvestWindowStart, plant.harvestWindowEnd);

  function handleSaveHeight() {
    const v = parseFloat(heightInput);
    if (!isNaN(v) && v > 0) {
      onUpdateHeight(plant.id, v);
      setHeightDialog(false);
    }
  }

  function handleDelete() {
    onDelete(plant.id);
    router.push('/');
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" /> Volver al huerto</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{catalog.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{plant.name}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="secondary">{ORIGIN_LABEL[plant.origin]}</Badge>
            <Badge variant="secondary">Bancal {plant.bedNumber}</Badge>
            <Badge variant="secondary">{SOIL_LABEL[plant.soilType]}</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="info" className="flex-1">Información</TabsTrigger>
          <TabsTrigger value="alertas" className="flex-1">
            Alertas {warnings.length > 0 && <span className="ml-1 text-xs text-red-600">({warnings.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="riego" className="flex-1">Riego</TabsTrigger>
        </TabsList>

        {/* Info tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Sprout className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Altura actual:</span>
                  <span className="font-medium">
                    {plant.heightCm != null ? `${plant.heightCm} cm` : 'Germinando...'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setHeightDialog(true)}>
                  <Pencil className="h-3 w-3 mr-1" /> Actualizar
                </Button>
              </div>

              <Separator />

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Plantado el:</span>
                <span className="font-medium">{new Date(plant.plantedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Cosecha estimada:</span>
                <span className="font-medium">{harvestLabel}</span>
              </div>

              {plant.notes && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">{plant.notes}</p>
                </>
              )}

              {catalog.claySoilNotes && (
                <>
                  <Separator />
                  <div className="flex gap-2 text-sm p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-700 dark:text-amber-300">{catalog.claySoilNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar planta
          </Button>
        </TabsContent>

        {/* Alertas tab */}
        <TabsContent value="alertas" className="space-y-3">
          {warnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-3xl block mb-2">✅</span>
              <p>No hay alertas activas para esta planta.</p>
            </div>
          ) : (
            warnings.map((w) => (
              <Alert key={w.id} className={`${RISK_COLORS[w.riskLevel]} border`}>
                <div className="flex items-start gap-2">
                  {w.riskLevel === 'alto' ? (
                    <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <AlertTitle>{w.title}</AlertTitle>
                    <AlertDescription className="space-y-1 mt-1">
                      <p>{w.description}</p>
                      <p className="font-medium">💡 {w.recommendation}</p>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </TabsContent>

        {/* Riego tab */}
        <TabsContent value="riego">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Recomendación de riego
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 min-w-[80px]">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{watering.frequencyDays}</div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">días entre riegos</div>
                </div>
                {watering.amountMl && (
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 min-w-[80px]">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{watering.amountMl}</div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">ml aprox. / riego</div>
                  </div>
                )}
              </div>

              {watering.reducedDueToRain && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-md border border-blue-200 dark:border-blue-800">
                  <Droplets className="h-4 w-4 shrink-0" />
                  <span>Lluvia prevista — considera omitir el riego de hoy.</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">{watering.notes}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Height edit dialog */}
      <Dialog open={heightDialog} onOpenChange={setHeightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar altura</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Altura actual (cm)</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="Ej: 15"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHeightDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveHeight}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar planta?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{plant.name}</strong> de tu huerto. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
