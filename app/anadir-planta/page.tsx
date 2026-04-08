'use client';

import { usePlants } from '@/hooks/usePlants';
import { AddPlantForm } from '@/components/forms/AddPlantForm';

export default function AnadirPlantaPage() {
  const { addPlant } = usePlants();

  return <AddPlantForm onAddPlant={addPlant} />;
}
