export type WheelItemDto = {
  id: string;
  name: string;
  image?: string | null;
};

export type WheelCategoryDto = {
  id: string;
  name: string;
  items: WheelItemDto[];
};

// Bu dosya şu an için gerçek bir backend yerine
// sahte (mock) bir API gibi davranıyor. Daha sonra
// istersen kendi backend endpoint'lerine bağlayabilirsin.

export async function fetchWheelCategories(): Promise<WheelCategoryDto[]> {
  const response = await fetch('https://cevirgo.com/api/data.php');

  if (!response.ok) {
    throw new Error('Kategoriler yüklenemedi');
  }

  const data = (await response.json()) as WheelCategoryDto[];
  return data;
}

