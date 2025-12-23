import { 
  Apple, Croissant, Milk, Beef, Pill, Flower2, 
  Shirt, Tv, Gamepad2, Sofa, 
  Hammer, Wrench, Lightbulb, PaintBucket, 
  ShoppingBasket, Utensils, 
  Sandwich, IceCream, Coffee, 
  Smartphone, Monitor, Speaker
} from 'lucide-react';

export const getCategoryIcon = (category) => {
  if (!category) return ShoppingBasket;
  
  const lower = category.toLowerCase();
  
  // Grocery
  if (lower.includes('produce') || lower.includes('fruit') || lower.includes('veg')) return Apple;
  if (lower.includes('bakery') || lower.includes('bread')) return Croissant;
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese')) return Milk;
  if (lower.includes('meat') || lower.includes('beef') || lower.includes('chicken') || lower.includes('seafood')) return Beef;
  if (lower.includes('deli') || lower.includes('sandwich')) return Sandwich;
  if (lower.includes('pharmacy') || lower.includes('health') || lower.includes('medicine')) return Pill;
  if (lower.includes('floral') || lower.includes('flower') || lower.includes('garden') || lower.includes('plant')) return Flower2;
  if (lower.includes('frozen') || lower.includes('ice cream')) return IceCream;
  if (lower.includes('coffee') || lower.includes('breakfast')) return Coffee;
  if (lower.includes('snacks') || lower.includes('candy')) return IceCream; // Using generic treat icon

  // Target / Dept Store
  if (lower.includes('clothing') || lower.includes('shoe') || lower.includes('men') || lower.includes('women')) return Shirt;
  if (lower.includes('electronics') || lower.includes('tv')) return Tv;
  if (lower.includes('phone') || lower.includes('mobile')) return Smartphone;
  if (lower.includes('computer') || lower.includes('laptop')) return Monitor;
  if (lower.includes('toy') || lower.includes('game') || lower.includes('lego')) return Gamepad2;
  if (lower.includes('home') || lower.includes('furniture') || lower.includes('decor')) return Sofa;

  // Hardware
  if (lower.includes('tool') || lower.includes('drill') || lower.includes('saw') || lower.includes('hardware')) return Hammer;
  if (lower.includes('plumbing') || lower.includes('pipe')) return Wrench;
  if (lower.includes('electrical') || lower.includes('wire') || lower.includes('bulb') || lower.includes('battery')) return Lightbulb;
  if (lower.includes('paint') || lower.includes('brush')) return PaintBucket;
  if (lower.includes('lumber') || lower.includes('wood')) return Hammer; // Generic construction

  return ShoppingBasket;
};
