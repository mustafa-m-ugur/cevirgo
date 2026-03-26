export type CustomWheel = {
  id: string;
  name: string;
  items: string[];
};

let customWheels: CustomWheel[] = [];

export function getCustomWheels(): CustomWheel[] {
  return customWheels;
}

export function createCustomWheel(name: string, items: string[]): CustomWheel {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const wheel: CustomWheel = {
    id,
    name,
    items,
  };
  customWheels = [...customWheels, wheel];
  return wheel;
}

export function deleteCustomWheel(id: string): void {
  customWheels = customWheels.filter((wheel) => wheel.id !== id);
}


